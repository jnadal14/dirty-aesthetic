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
DATA = ROOT / "data"
for d in (OUT, OUT_COVERS, OUT_LINEUP, OUT_GALLERY, OUT_GALLERY_FULL, OUT_MERCH, OUT_POSTERS_ROOT, OUT_POSTERS, DATA):
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
    save_webp(out_jpg, out_webp, 76)

    lb = flatten_alpha(resize_to_width(img, lightbox_w))
    lb_jpg = OUT_GALLERY_FULL / f"{out_base}.jpg"
    save_jpeg(lb, lb_jpg, quality=84)
    lb_webp = OUT_GALLERY_FULL / f"{out_base}.webp"
    save_webp(lb_jpg, lb_webp, 80)

    return {
        "webp": rel(out_webp),
        "src": rel(out_jpg),
        "full": rel(lb_jpg),
        "fullWebp": rel(lb_webp),
        "type": "jpeg",
        "width": grid.width,
        "height": grid.height,
    }


def process_raster(src_path, out_dir, out_base, target_width, jpeg_q=82, webp_q=80):
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)
    resized = resize_to_width(img, target_width)
    has_alpha = "A" in resized.mode or (resized.mode == "P" and "transparency" in resized.info)

    if has_alpha:
        out_png = out_dir / f"{out_base}.png"
        resized.save(out_png, "PNG", optimize=True)
        out_webp = out_dir / f"{out_base}.webp"
        save_webp(out_png, out_webp, webp_q, alpha=True)
        return {
            "webp": rel(out_webp),
            "src": rel(out_png),
            "full": rel(src_path),
            "type": "png",
            "width": resized.width,
            "height": resized.height,
        }

    out_jpg = out_dir / f"{out_base}.jpg"
    save_jpeg(resized, out_jpg, jpeg_q)
    out_webp = out_jpg.with_suffix(".webp")
    save_webp(out_jpg, out_webp, webp_q)
    return {
        "webp": rel(out_webp),
        "src": rel(out_jpg),
        "full": rel(src_path),
        "type": "jpeg",
        "width": resized.width,
        "height": resized.height,
    }


def process(src_name, out_name, target_width, jpeg_q=82, webp_q=80):
    src = SRC / src_name
    if not src.exists():
        print(f"  SKIP {src_name} (missing)")
        return None
    meta = process_raster(src, OUT, out_name, target_width, jpeg_q, webp_q)
    report(OUT / Path(meta["src"]).name)
    report(OUT / Path(meta["webp"]).name)
    return meta


def process_cover(src_name, out_name=None, target=1200, jpeg_q=85, webp_q=82):
    src = SRC / "covers" / src_name
    if not src.exists():
        print(f"  SKIP covers/{src_name} (missing)")
        return None
    out_base = Path(out_name or src_name).stem
    meta = process_raster(src, OUT_COVERS, out_base, target, jpeg_q, webp_q)
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
for src_name, out_name, width in [
    ("MODERN NOSTALGIA ALBUM RELEASE_08:14:26.PNG", "modern-nostalgia-album-release-2026.webp", 1200),
    ("MODERN NOSTALGIA ALBUM RELEASE_08:14:26_BANNER.PNG", "modern-nostalgia-album-release-2026-banner.webp", 2000),
]:
    src = SRC / "posters" / src_name
    if not src.exists():
        print(f"  SKIP posters/{src_name} (missing)")
        continue
    dest = OUT_POSTERS_ROOT / out_name
    save_resized_webp(src, dest, width, quality=82)
    report(dest)

print("Album / single covers")
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
    process_cover(src_name, target=1200, jpeg_q=85, webp_q=82)

print("Lineup portraits")
lineup_manifest = {}
for slug, names in LINEUP_SOURCES.items():
    src = find_source("LINEUP", names)
    if not src:
        print(f"  SKIP lineup/{slug} (missing source for {names})")
        continue
    print(f"  {slug} <= {src.relative_to(SRC)}")
    meta = process_raster(src, OUT_LINEUP, slug, 900, jpeg_q=84, webp_q=82)
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
        meta = process_raster(src, OUT_POSTERS, out_base, 900, jpeg_q=82, webp_q=80)
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
