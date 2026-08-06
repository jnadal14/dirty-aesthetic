#!/usr/bin/env python3
"""Generate web-optimized image variants for the Dirty Aesthetic site.

Originals stay untouched in assets/images/.
Outputs go to assets/images/optimized/.
Writes data/epk-images.json for the EPK page (lineup + gallery paths).

Lineup: drop BARDIA.jpg or BARDIA.png (etc.) in assets/images/LINEUP/.
Gallery: numbered files 1.jpg, 2.png, … in assets/images/GALLERY/.
"""

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "images"
OUT = SRC / "optimized"
OUT_COVERS = OUT / "covers"
OUT_LINEUP = OUT / "lineup"
OUT_GALLERY = OUT / "gallery"
OUT_GALLERY_FULL = OUT / "gallery" / "full"
OUT_MERCH = OUT / "merch"
OUT_POSTERS_ROOT = OUT / "posters"
OUT_POSTERS = OUT_POSTERS_ROOT / "archive"
OUT_BACKGROUNDS = OUT / "backgrounds"
OUT_LOGOS = OUT / "logos"
DATA = ROOT / "data"
for d in (OUT, OUT_COVERS, OUT_LINEUP, OUT_GALLERY, OUT_GALLERY_FULL, OUT_MERCH, OUT_POSTERS_ROOT, OUT_POSTERS, OUT_BACKGROUNDS, OUT_LOGOS, DATA):
    d.mkdir(parents=True, exist_ok=True)

CWEBP = (
    shutil.which("cwebp")
    or ("/opt/homebrew/bin/cwebp" if Path("/opt/homebrew/bin/cwebp").exists() else None)
    or ("/usr/local/bin/cwebp" if Path("/usr/local/bin/cwebp").exists() else None)
)
if not CWEBP:
    raise SystemExit("cwebp not found")

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG")

LINEUP_SOURCES = {
    "bardia": ["BARDIA"],
    "dylan": ["DYLAN"],
    "jacob": ["JACOB"],
    "josh-c": ["JOSH C", "JOSH-C", "JOSH_C"],
    "josh-s": ["JOSH S", "JOSH-S", "JOSH_S"],
}


def resize_to_width(img, target_w):
    if img.width <= target_w:
        return img.copy()
    ratio = target_w / img.width
    return img.resize((target_w, round(img.height * ratio)), Image.LANCZOS)


def save_jpeg(img, dest, quality=82):
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)


def save_webp(src_path, dest_webp, quality=80, alpha=False):
    cmd = [CWEBP, "-q", str(quality), "-m", "6", "-mt", "-quiet"]
    if alpha:
        cmd.extend(["-alpha_q", "100"])
    cmd.extend([str(src_path), "-o", str(dest_webp)])
    subprocess.run(cmd, check=True)


def save_webp_from_image(img, dest_webp, quality=80, alpha=False):
    """Encode WebP from an in-memory image via a lossless intermediate.

    Encoding from the JPEG we just wrote means compressing JPEG artifacts:
    that costs quality *and* bytes. One archive poster came out at 324 KB
    through the JPEG against 279 KB encoded from the source.
    """
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as handle:
        tmp = Path(handle.name)
    try:
        img.save(tmp, "PNG")
        save_webp(tmp, dest_webp, quality, alpha=alpha)
    finally:
        tmp.unlink(missing_ok=True)


def save_resized_webp(src_path, dest_webp, width, quality=80):
    cmd = [
        CWEBP,
        "-q", str(quality),
        "-m", "6",
        "-mt",
        "-quiet",
        "-resize", str(width), "0",
        str(src_path),
        "-o", str(dest_webp),
    ]
    subprocess.run(cmd, check=True)


def find_source(subdir, names):
    """Find first matching source file by base name and any common extension."""
    folder = SRC / subdir
    for name in names:
        for ext in IMAGE_EXTS:
            path = folder / f"{name}{ext}"
            if path.exists():
                return path
    return None


def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def rel(path):
    return str(path.relative_to(ROOT)).replace("\\", "/")


def report(path):
    if not path or not path.exists():
        return
    size_kb = path.stat().st_size / 1024
    print(f"  {path.relative_to(ROOT)}  {size_kb:.0f} KB")


def flatten_alpha(img, bg=(0, 0, 0)):
    if img.mode == "P":
        img = img.convert("RGBA")
    if img.mode in ("RGBA", "LA"):
        base = Image.new("RGB", img.size, bg)
        base.paste(img, mask=img.split()[-1])
        return base
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def process_gallery_item(src_path, out_dir, out_base, grid_w=800, lightbox_w=1600):
    """Grid-sized JPEG/WebP for masonry + separate lightbox variants."""
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)

    grid = flatten_alpha(resize_to_width(img, grid_w))
    out_jpg = out_dir / f"{out_base}.jpg"
    save_jpeg(grid, out_jpg, quality=80)
    out_webp = out_dir / f"{out_base}.webp"
    save_webp_from_image(grid, out_webp, 76)

    lb = flatten_alpha(resize_to_width(img, lightbox_w))
    lb_jpg = OUT_GALLERY_FULL / f"{out_base}.jpg"
    save_jpeg(lb, lb_jpg, quality=84)
    lb_webp = OUT_GALLERY_FULL / f"{out_base}.webp"
    save_webp_from_image(lb, lb_webp, 80)

    return {
        "webp": rel(out_webp),
        "src": rel(out_jpg),
        "full": rel(lb_jpg),
        "fullWebp": rel(lb_webp),
        "type": "jpeg",
        "width": grid.width,
        "height": grid.height,
    }


def has_real_transparency(img):
    """True only when the alpha channel is actually used.

    Plenty of source PNGs carry a fully-opaque alpha channel. Treating those as
    transparent forced a PNG encode — one poster came out at 2.2 MB that JPEG
    encodes in well under a tenth of that.
    """
    if img.mode == "P":
        if "transparency" not in img.info:
            return False
        img = img.convert("RGBA")
    if img.mode not in ("RGBA", "LA"):
        return False
    alpha_min, _ = img.getchannel("A").getextrema()
    return alpha_min < 255


def save_variant(img, out_dir, out_base, jpeg_q, webp_q):
    """Write one sized variant, keeping alpha as PNG and everything else JPEG."""
    if has_real_transparency(img):
        out_png = out_dir / f"{out_base}.png"
        img.save(out_png, "PNG", optimize=True)
        out_webp = out_dir / f"{out_base}.webp"
        save_webp(out_png, out_webp, webp_q, alpha=True)
        return out_png, out_webp, "png"

    out_jpg = out_dir / f"{out_base}.jpg"
    save_jpeg(img, out_jpg, jpeg_q)
    out_webp = out_jpg.with_suffix(".webp")
    save_webp_from_image(img.convert("RGB"), out_webp, webp_q)
    return out_jpg, out_webp, "jpeg"


def process_raster(src_path, out_dir, out_base, target_width, jpeg_q=82, webp_q=80,
                   lightbox_width=None):
    """Display-sized variant, plus an optional lightbox-sized one.

    Without lightbox_width the manifest's "full" points at the untouched
    original — fine for a build input, ruinous when the lightbox serves it to a
    visitor, since these run 3000x3000 and up (10-24 MB per click).
    """
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)
    resized = resize_to_width(img, target_width)

    out_src, out_webp, kind = save_variant(resized, out_dir, out_base, jpeg_q, webp_q)
    meta = {
        "webp": rel(out_webp),
        "src": rel(out_src),
        "full": rel(src_path),
        "type": kind,
        "width": resized.width,
        "height": resized.height,
    }

    if lightbox_width:
        full_dir = out_dir / "full"
        full_dir.mkdir(parents=True, exist_ok=True)
        full = resize_to_width(img, lightbox_width)
        full_src, full_webp, _ = save_variant(full, full_dir, out_base, 84, 80)
        meta["full"] = rel(full_src)
        meta["fullWebp"] = rel(full_webp)
        meta["fullWidth"] = full.width
        meta["fullHeight"] = full.height

    return meta


def process(src_name, out_name, target_width, jpeg_q=82, webp_q=80):
    src = SRC / src_name
    if not src.exists():
        print(f"  SKIP {src_name} (missing)")
        return None
    # Strip any extension from out_name. Passing "header-desktop.jpg" through
    # produced header-desktop.jpg.jpg while the pages referenced
    # header-desktop.jpg, so the file the site actually served stopped being
    # regenerated and silently went stale.
    out_base = Path(out_name).stem
    meta = process_raster(src, OUT, out_base, target_width, jpeg_q, webp_q)
    report(OUT / Path(meta["src"]).name)
    report(OUT / Path(meta["webp"]).name)
    return meta


def process_cover(src_name, out_name=None, target=1200, jpeg_q=85, webp_q=82, lightbox=1600):
    src = SRC / "covers" / src_name
    if not src.exists():
        print(f"  SKIP covers/{src_name} (missing)")
        return None
    out_base = Path(out_name or src_name).stem
    meta = process_raster(src, OUT_COVERS, out_base, target, jpeg_q, webp_q,
                          lightbox_width=lightbox)
    report(OUT_COVERS / Path(meta["src"]).name)
    report(OUT_COVERS / Path(meta["webp"]).name)
    return meta


def discover_gallery_sources():
    gallery_dir = SRC / "GALLERY"
    numbered = []
    for path in gallery_dir.iterdir():
        if not path.is_file():
            continue
        match = re.match(r"^(\d+)\.(jpg|jpeg|png)$", path.name, re.I)
        if match:
            numbered.append((int(match.group(1)), path))
    numbered.sort(key=lambda item: item[0])
    return [path for _, path in numbered]


print("Hero / background images")
for r in [
    process("HEADER.jpg", "header-desktop.jpg", 1920, jpeg_q=82, webp_q=78),
    process("HEADER_MOBILE.jpg", "header-mobile.jpg", 1080, jpeg_q=82, webp_q=78),
    process("FULL_PROFILE.jpg", "full-profile.jpg", 900, jpeg_q=82, webp_q=80),
]:
    if r:
        report(ROOT / r["src"])
        report(ROOT / r["webp"])

print("Section background")
r = process("BACKGROUND/BACK_EP.jpg", "back-ep.jpg", 1600, jpeg_q=80, webp_q=78)
if r:
    report(ROOT / r["src"])
    report(ROOT / r["webp"])
r = process(
    "BACKGROUND/modern nostalgia full cover no text.png",
    "modern-nostalgia-album-bg",
    1920,
    jpeg_q=84,
    webp_q=82,
)
if r:
    report(ROOT / r["src"])
    report(ROOT / r["webp"])

print("Featured show artwork")
for src_name, out_name, width, jpeg_fallback in [
    ("MODERN NOSTALGIA ALBUM RELEASE_08:14:26.PNG", "modern-nostalgia-album-release-2026.webp", 900, None),
    ("MODERN NOSTALGIA ALBUM RELEASE_08:14:26_BANNER.PNG", "modern-nostalgia-album-release-2026-banner.webp", 1600, "modern-nostalgia-album-release-2026-banner.jpg"),
]:
    src = SRC / "posters" / src_name
    if not src.exists():
        print(f"  SKIP posters/{src_name} (missing)")
        continue
    dest = OUT_POSTERS_ROOT / out_name
    save_resized_webp(src, dest, width, quality=82)
    report(dest)
    if jpeg_fallback:
        with Image.open(src) as image:
            resized = resize_to_width(ImageOps.exif_transpose(image), width)
            jpeg_dest = OUT_POSTERS_ROOT / jpeg_fallback
            save_jpeg(resized, jpeg_dest, quality=82)
            report(jpeg_dest)

print("Page backgrounds")
# These were being served straight from assets/images/BACKGROUND/ as full-size
# JPEGs with no WebP variant — 500 KB and 672 KB on every EPK and Watch load.
for src_name, out_base in [("2.jpg", "epk-bg"), ("3.jpg", "watch-bg")]:
    src = SRC / "BACKGROUND" / src_name
    if not src.exists():
        print(f"  SKIP BACKGROUND/{src_name} (missing)")
        continue
    meta = process_raster(src, OUT_BACKGROUNDS, out_base, 1600, jpeg_q=80, webp_q=76)
    report(ROOT / meta["src"])
    report(ROOT / meta["webp"])

print("Logos")
# The wordmark shipped at 2657px wide for a 600px maximum display size, and the
# splat at 989px for a 48px one. Both load on every page.
#
# These are flat white-on-transparent artwork, so a palette PNG beats both the
# truecolour PNG and lossy WebP by a wide margin: the wordmark is 28 KB as a
# 256-colour palette against 133 KB truecolour and 67 KB WebP. Staying PNG also
# means the pages keep a plain <img src> with no <picture> fallback.
for rel_src, out_base, width in [
    ("DA_SPLAT/DA-OFF_WHITE.png", "da-splat", 240),
    ("FULL_NAME/FULL-OFF_WHITE.png", "da-wordmark", 1400),
]:
    src = ROOT / "assets" / "logos" / rel_src
    if not src.exists():
        print(f"  SKIP logos/{rel_src} (missing)")
        continue
    with Image.open(src) as image:
        art = ImageOps.exif_transpose(image).convert("RGBA")
        art = resize_to_width(art, width)
        dest = OUT_LOGOS / f"{out_base}.png"
        art.quantize(colors=256, method=Image.FASTOCTREE).save(dest, "PNG", optimize=True)
        report(dest)

print("Album / single covers")
# Only these open in the lightbox (index.html), so only these need the larger
# variant. The rest appear at grid size on music.html and nowhere else.
COVERS_WITH_LIGHTBOX = {
    "cover_LP_modern_nostalgia.png",
    "cover_back_to_me.jpg",
    "cover_irrational.jpg",
    "cover_sugar_on_the_rocks.jpg",
}
for src_name in [
    "cover_LP_modern_nostalgia.png",
    "cover_modern_nostalgia.jpg",
    "cover_back_to_me.jpg",
    "cover_irrational.jpg",
    "cover_sugar_on_the_rocks.jpg",
    "cover_sugar_bottom.jpg",
    "cover_blue_roses.jpg",
    "cover_while_i_wonder.jpg",
    "cover_run.jpg",
]:
    process_cover(src_name, target=1200, jpeg_q=85, webp_q=82,
                  lightbox=1600 if src_name in COVERS_WITH_LIGHTBOX else None)

print("Lineup portraits")
lineup_manifest = {}
for slug, names in LINEUP_SOURCES.items():
    src = find_source("LINEUP", names)
    if not src:
        print(f"  SKIP lineup/{slug} (missing source for {names})")
        continue
    print(f"  {slug} <= {src.relative_to(SRC)}")
    meta = process_raster(src, OUT_LINEUP, slug, 900, jpeg_q=84, webp_q=82,
                          lightbox_width=1600)
    lineup_manifest[slug] = meta
    report(OUT_LINEUP / Path(meta["src"]).name)
    report(OUT_LINEUP / Path(meta["webp"]).name)

print("Archived show posters")
poster_manifest = {}
shows_path = DATA / "shows.json"
if shows_path.exists():
    shows_data = json.loads(shows_path.read_text(encoding="utf-8"))
    for show in shows_data.get("past", []):
        poster_path = show.get("poster")
        if not poster_path:
            continue
        src = ROOT / poster_path
        if not src.exists():
            print(f"  SKIP poster/{poster_path} (missing source)")
            continue
        out_base = slugify(f"{show.get('date', '')}-{show.get('venue', src.stem)}")
        print(f"  {out_base} <= {src.relative_to(SRC)}")
        # Grid thumbnails render about 430px wide in a 3-column layout, and a
        # full-size version is one click away in the lightbox, so these do not
        # need archival quality.
        meta = process_raster(src, OUT_POSTERS, out_base, 900, jpeg_q=78, webp_q=72,
                              lightbox_width=1600)
        poster_manifest[poster_path] = meta
        report(OUT_POSTERS / Path(meta["src"]).name)
        report(OUT_POSTERS / Path(meta["webp"]).name)

poster_manifest_path = DATA / "poster-images.json"
poster_manifest_path.write_text(json.dumps(poster_manifest, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {poster_manifest_path.relative_to(ROOT)}")

print("Gallery photos")
gallery_manifest = []
for src in discover_gallery_sources():
    out_base = src.stem
    print(f"  {out_base} <= GALLERY/{src.name}")
    meta = process_gallery_item(src, OUT_GALLERY, out_base)
    gallery_manifest.append(meta)
    report(OUT_GALLERY / Path(meta["src"]).name)
    report(OUT_GALLERY / Path(meta["webp"]).name)
    report(OUT_GALLERY_FULL / Path(meta["fullWebp"]).name)

print("Merch")
merch_src = find_source("MERCH", ["MERCH_1", "merch-1", "MERCH_1.JPG"])
if merch_src:
    process_raster(merch_src, OUT_MERCH, "merch-1", 1400, jpeg_q=85, webp_q=82)
ldean_bg = SRC / "MERCH" / "LDEAN_MERCH.jpg"
if ldean_bg.exists():
    meta = process_raster(ldean_bg, OUT_MERCH, "ldean-merch-bg", 1920, jpeg_q=82, webp_q=78)
    report(OUT_MERCH / Path(meta["src"]).name)
    report(OUT_MERCH / Path(meta["webp"]).name)

manifest_path = DATA / "epk-images.json"
manifest = {"lineup": lineup_manifest, "gallery": gallery_manifest}
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"\nWrote {manifest_path.relative_to(ROOT)}")
print("Done.")
