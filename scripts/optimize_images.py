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

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
# Full-resolution masters live in _source/ and are never committed; assets/
# holds only what the site actually serves. Keeping the two apart is what stops
# camera originals from ending up in git history again.
SRC = ROOT / "_source"
OUT = ROOT / "assets" / "images"
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

# Aliases, not renames: the shoot arrives named however the photographer named
# it, and the two Joshes are told apart by surname there and by initial here.
# Masters are named PHOTOGRAPHER__MEMBER so the credit travels with the file.
# The untagged names stay as fallbacks for a master dropped in without one.
LINEUP_SOURCES = {
    "bardia": ["JACKSON-ISELI__BARDIA", "BARDIA"],
    "dylan": ["JACKSON-ISELI__DYLAN", "DYLAN"],
    "jacob": ["JACKSON-ISELI__JACOB", "JACOB"],
    "josh-c": ["JACKSON-ISELI__CHAPMAN", "CHAPMAN", "JOSH C", "JOSH-C", "JOSH_C"],
    "josh-s": ["JACKSON-ISELI__SEAMAN", "SEAMAN", "JOSH S", "JOSH-S", "JOSH_S"],
}

# Who shot each master, and how that is known. Read by the gallery and lineup
# builds so every manifest entry carries a credit ready for display later.
PHOTO_CREDITS = ROOT / "data" / "photo-credits.json"
GALLERY_ORDER = ROOT / "data" / "gallery-order.json"


def load_photo_credits():
    if PHOTO_CREDITS.exists():
        return json.loads(PHOTO_CREDITS.read_text(encoding="utf-8"))
    return {}


def credit_slug(stem):
    """'micah-pattern__aug14-2026-22' -> ('micah-pattern', 'aug14-2026-22')."""
    if "__" in stem:
        who, _, shot = stem.partition("__")
        return who.lower(), shot.lower()
    return "uncredited", stem.lower()


def resize_to_width(img, target_w):
    if img.width <= target_w:
        return img.copy()
    ratio = target_w / img.width
    return img.resize((target_w, round(img.height * ratio)), Image.LANCZOS)


def crop_to_aspect(img, aspect, focus=0.5, focus_x=0.5):
    """Crop to `aspect` (width/height), centred on `focus` / `focus_x`.

    Both are 0..1 fractions of the source. The stage photographs are 4:5
    portrait and all of them are used full bleed, where `cover` would otherwise
    crop them blind: on a viewport shaped differently to the frame it throws
    most of the picture away, and which part it keeps depends on the visitor's
    window. Choosing the crop here is what keeps the subject in, and it means
    the bytes we ship are bytes that actually get shown.

    `focus_x` matters when the subject is off centre. The singer on the watch
    page stands in the right third, so a centred phone crop kept the curtain
    and lost him.
    """
    width, height = img.size
    if width / height > aspect:
        keep_w = round(height * aspect)
        left = round(focus_x * width - keep_w / 2)
        left = max(0, min(left, width - keep_w))
        return img.crop((left, 0, left + keep_w, height))
    keep_h = round(width / aspect)
    top = round(focus * height - keep_h / 2)
    top = max(0, min(top, height - keep_h))
    return img.crop((0, top, width, top + keep_h))


def roll_highlights(img, threshold, slope):
    """Compress everything above `threshold`, leaving the rest untouched.

    The drums photograph has a stage light burst in it, and the EPK intro sets
    its band name in the accent brown directly over that spot. Measured against
    the brightest pixel, that text came out at 1.08:1 — invisible. Darkening the
    whole frame enough to fix it would have thrown away the picture, so only the
    highlights are pulled down, and the scrim covers the rest.
    """
    lut = [v if v <= threshold else round(threshold + (v - threshold) * slope)
           for v in range(256)]
    return img.point(lut * len(img.getbands()))


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


def process_gallery_item(src_path, out_dir, out_base, grid_w=800, small_w=600, lightbox_w=1600):
    """Grid-sized JPEG/WebP for masonry + separate lightbox variants."""
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)

    grid = flatten_alpha(resize_to_width(img, grid_w))
    out_jpg = out_dir / f"{out_base}.jpg"
    save_jpeg(grid, out_jpg, quality=80)
    out_webp = out_dir / f"{out_base}.webp"
    save_webp_from_image(grid, out_webp, 76)

    # On a phone the gallery is two columns about 190 CSS px wide, so even a 3x
    # screen draws each photo under 600 real pixels. The page offers this smaller
    # WebP through srcset and phones skip roughly half the bytes of the 800.
    small = flatten_alpha(resize_to_width(img, small_w))
    out_small = out_dir / f"{out_base}-{small_w}.webp"
    save_webp_from_image(small, out_small, 76)

    lb = flatten_alpha(resize_to_width(img, lightbox_w))
    lb_jpg = OUT_GALLERY_FULL / f"{out_base}.jpg"
    save_jpeg(lb, lb_jpg, quality=84)
    lb_webp = OUT_GALLERY_FULL / f"{out_base}.webp"
    save_webp_from_image(lb, lb_webp, 80)

    return {
        "webp": rel(out_webp),
        "webpSmall": rel(out_small),
        "smallWidth": small.width,
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


def process(src_name, out_name, target_width, jpeg_q=82, webp_q=80, out_dir=None):
    src = SRC / src_name
    if not src.exists():
        print(f"  SKIP {src_name} (missing)")
        return None
    out_dir = OUT if out_dir is None else out_dir
    # Strip any extension from out_name. Passing "header-desktop.jpg" through
    # produced header-desktop.jpg.jpg while the pages referenced
    # header-desktop.jpg, so the file the site actually served stopped being
    # regenerated and silently went stale.
    out_base = Path(out_name).stem
    meta = process_raster(src, out_dir, out_base, target_width, jpeg_q, webp_q)
    report(out_dir / Path(meta["src"]).name)
    report(out_dir / Path(meta["webp"]).name)
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
    """Gallery masters in display order, each with its chosen alt text.

    The order lives in data/gallery-order.json rather than in the filenames,
    because the filenames now carry who shot each photo. A master sitting in
    _source/gallery that the order file does not mention is appended at the end
    and reported, so a new photo is never silently left off the page. An order
    entry naming a master that is gone stops the build instead of shipping a gap.
    """
    gallery_dir = SRC / "gallery"
    masters = sorted(
        p for p in gallery_dir.iterdir()
        if p.is_file() and not p.name.startswith(".") and p.suffix.lower() in (".jpg", ".jpeg", ".png")
    )
    by_name = {p.name: p for p in masters}
    ordered = []
    if GALLERY_ORDER.exists():
        for entry in json.loads(GALLERY_ORDER.read_text(encoding="utf-8")).get("order", []):
            path = by_name.pop(entry["master"], None)
            if path is None:
                raise SystemExit(f"gallery-order.json names a master that is not in _source/gallery: {entry['master']}")
            ordered.append((path, entry.get("alt")))
    for path in by_name.values():
        print(f"  NOTE {path.name} is not in gallery-order.json, appended at the end")
        ordered.append((path, None))
    return ordered


print("Hero / background images")
for r in [
    process("misc/HEADER.jpg", "header-desktop.jpg", 1920, jpeg_q=82, webp_q=78,
            out_dir=OUT_BACKGROUNDS),
    process("misc/HEADER_MOBILE.jpg", "header-mobile.jpg", 1080, jpeg_q=82, webp_q=78,
            out_dir=OUT_BACKGROUNDS),
    # FULL_PROFILE was the press kit's vertical strip. The strip is gone, so the
    # variant is not built; the master stays in _source if it is ever wanted.
]:
    if r:
        report(ROOT / r["src"])
        report(ROOT / r["webp"])

print("Section background")
r = process("backgrounds/BACK_EP.jpg", "back-ep.jpg", 1600, jpeg_q=80, webp_q=78,
            out_dir=OUT_BACKGROUNDS)
if r:
    report(ROOT / r["src"])
    report(ROOT / r["webp"])
# The album artwork is square, and both the hero and the tracklist section paint
# it full-viewport with `cover` and `center 50%`. That means neither one ever
# shows the whole thing: a desktop window sees a horizontal band and a phone a
# vertical slice, and on the square master every pixel outside that was decoded
# and then thrown away — 44% of a 3.69 megapixel picture, on the frame the
# chapter first scrolls into view.
#
# So each shape gets the cut it actually paints, taken from the 3000px master so
# neither loses sharpness. 16:10 covers any desktop window at least that wide,
# which is all of them in practice; a taller one zooms exactly as `cover` always
# did. The phone keeps full height and drops the sides.
_album_master_name = "backgrounds/modern nostalgia full cover no text.png"
_album_master = SRC / _album_master_name
if _album_master.exists():
    with Image.open(_album_master) as _album_src:
        _album_art = ImageOps.exif_transpose(_album_src).convert("RGB")

    for _label, _aspect, _width, _suffix in (
        ("desktop", 16 / 10, 1920, ""),
        ("phone", 9 / 16, 1080, "-mobile"),
    ):
        _variant = resize_to_width(crop_to_aspect(_album_art, _aspect), _width)
        _variant_jpg = OUT_BACKGROUNDS / f"modern-nostalgia-album-bg{_suffix}.jpg"
        _variant_webp = OUT_BACKGROUNDS / f"modern-nostalgia-album-bg{_suffix}.webp"
        save_jpeg(_variant, _variant_jpg, quality=84)
        save_webp_from_image(_variant, _variant_webp, quality=82)
        print(f"  modern-nostalgia-album-bg{_suffix} {_variant.width}x{_variant.height} ({_label})")
        report(_variant_jpg)
        report(_variant_webp)
else:
    print(f"  SKIP modern-nostalgia-album-bg (missing {_album_master_name})")

print("Featured show artwork")
# Upcoming-show artwork, driven by data/shows.json rather than named here, so
# adding a show is a data edit. Each entry needs posterSource (a path under
# _source/) and posterSlug.
#
# The poster now hangs beside its row and nothing sits behind it, so there is no
# wide banner variant to cut. The next show simply gets a larger one.

# Width of the thumbnail variant every poster also gets. main.js hard-codes the
# same number in the srcset it builds, so the two move together.
POSTER_SMALL_W = 400

upcoming_shows = []
_shows_path = DATA / "shows.json"
if _shows_path.exists():
    upcoming_shows = json.loads(_shows_path.read_text(encoding="utf-8")).get("upcoming", [])

for index, show in enumerate(upcoming_shows):
    source = show.get("posterSource")
    slug = show.get("posterSlug")
    if not source or not slug:
        print(f"  SKIP upcoming[{index}] (no posterSource/posterSlug)")
        continue
    src_path = ROOT / source
    if not src_path.exists():
        print(f"  SKIP {slug} (missing {source})")
        continue

    with Image.open(src_path) as image:
        art = ImageOps.exif_transpose(image).convert("RGB")

        # The featured card renders its poster around 420px wide and opens it in
        # the lightbox, so 900px of q78 is right. A secondary row shows a 74px
        # thumbnail and hides it entirely on phones — the only thing asking for
        # size there is the lightbox, and 700px covers that at half the bytes.
        if index == 0:
            poster = resize_to_width(art, 900)
            poster_q, jpeg_q = 78, 80
        else:
            poster = resize_to_width(art, 700)
            poster_q, jpeg_q = 72, 76
        poster_webp = OUT_POSTERS_ROOT / f"{slug}.webp"
        poster_jpeg = OUT_POSTERS_ROOT / f"{slug}.jpg"
        save_webp_from_image(poster, poster_webp, quality=poster_q)
        save_jpeg(poster, poster_jpeg, quality=jpeg_q)
        print(f"  {slug} {poster.width}x{poster.height}")
        report(poster_webp)
        report(poster_jpeg)

        # The row beside the date paints this poster at anywhere from 66 to 330
        # CSS px depending on the layout in force, never at the size the lightbox
        # wants. Measured on the homepage the next show's poster sits in a 66px
        # box and was decoding the 900px file above to fill it. That file stays,
        # because the lightbox does want it; the page offers this one through
        # srcset so the thumbnail stops paying for pixels it cannot show.
        small = resize_to_width(art, POSTER_SMALL_W)
        small_webp = OUT_POSTERS_ROOT / f"{slug}-sm.webp"
        save_webp_from_image(small, small_webp, quality=poster_q)
        print(f"  {slug}-sm {small.width}x{small.height}")
        report(small_webp)


print("Scene backgrounds")
# Photographs used as full-bleed section backgrounds.
#
# `wide_ar` is not a house style, it is the shape of the box the picture lands
# in, measured in the browser. The EPK intro is 1425x1671 on a desktop: handing
# it a 16:9 frame made `cover` scale the image up 1.86x and throw away 1546px of
# width, which is where the drummer was standing. A portrait crop for a portrait
# box crops almost nothing and needs no upscaling, which is also what stops it
# looking soft.
#
# `blur` buys file size back on grainy frames, where WebP otherwise spends its
# whole bitrate on noise. It is set per photograph because it costs sharpness,
# and a frame that is already clean should not pay for it.
#
# `highlights` (threshold, slope) tames a hot spot that would otherwise leave
# text unreadable over it. See roll_highlights.
for cfg in [
    {"src": "BW DYL + CROWD.jpg", "out": "shows-bg",
     "focus": 0.58, "wide_ar": 16 / 9, "wide_w": 1920, "blur": 0.7, "highlights": None},
    # The watch background covers the whole phone screen rather than a section,
    # so its phone crop is screen shaped (9:16) rather than 3:4, and framed on
    # the singer instead of the middle of the curtain.
    {"src": "watch.jpg", "out": "watch-bg",
     "focus": 0.66, "focus_x": 0.73, "tall_ar": 9 / 16,
     "wide_ar": 16 / 9, "wide_w": 1920, "tall_w": 1000, "blur": 0.6, "highlights": None},
    # Shot from inside the crowd, tilted, looking past a raised phone at the
    # singer. The wide crop sits at 0.58 rather than centre: lower and his head
    # clips the top edge, higher and the foreground hands that make the shot go.
    # Its right third is near black, which is where the page's text lands.
    {"src": "crowdddd.jpg", "out": "music-bg",
     "focus": 0.58, "wide_ar": 16 / 9, "wide_w": 1920,
     "tall_ar": 9 / 16, "tall_w": 1000, "blur": 0.6, "highlights": None},
    # Behind the lineup grid on the press kit. The standing players sit right of
    # centre and the drummer's arm crosses the foreground left, so the phone crop
    # is pulled right to keep the band rather than the cymbals.
    {"src": "band members.jpg", "out": "members-bg",
     "focus": 0.42, "focus_x": 0.60, "wide_ar": 16 / 9, "wide_w": 1920,
     "tall_ar": 3 / 4, "tall_w": 900, "blur": 0.6, "highlights": None},
    {"src": "band from drums.jpg", "out": "epk-bg",
     "focus": 0.50, "wide_ar": 4 / 5, "wide_w": 1800, "blur": 0.3, "highlights": (95, 0.30),
     "q": 62},
]:
    src = SRC / "backgrounds" / cfg["src"]
    if not src.exists():
        print(f"  SKIP backgrounds/{cfg['src']} (missing)")
        continue
    master = flatten_alpha(ImageOps.exif_transpose(Image.open(src)))
    out_base = cfg["out"]

    def finish(img, blur):
        if blur:
            img = img.filter(ImageFilter.GaussianBlur(blur))
        return roll_highlights(img, *cfg["highlights"]) if cfg["highlights"] else img

    focus_x = cfg.get("focus_x", 0.5)
    wide = finish(
        resize_to_width(
            crop_to_aspect(master, cfg["wide_ar"], cfg["focus"], focus_x), cfg["wide_w"]
        ),
        cfg["blur"],
    )
    save_jpeg(wide, OUT_BACKGROUNDS / f"{out_base}.jpg", 76)
    save_webp_from_image(wide, OUT_BACKGROUNDS / f"{out_base}.webp", cfg.get("q", 66))

    # Phones get a 3:4 frame whatever the desktop shape is: a wide crop under a
    # portrait viewport keeps only a narrow strip, and not the strip with the
    # subject in it.
    tall = finish(
        resize_to_width(
            crop_to_aspect(master, cfg.get("tall_ar", 3 / 4), cfg["focus"], focus_x),
            cfg.get("tall_w", 900),
        ),
        cfg["blur"] * 0.6,
    )
    save_jpeg(tall, OUT_BACKGROUNDS / f"{out_base}-mobile.jpg", 74)
    save_webp_from_image(tall, OUT_BACKGROUNDS / f"{out_base}-mobile.webp", 66)

    print(f"  {out_base} wide {wide.width}x{wide.height} / tall {tall.width}x{tall.height}")
    for suffix in (".jpg", ".webp", "-mobile.jpg", "-mobile.webp"):
        report(OUT_BACKGROUNDS / f"{out_base}{suffix}")

print("Favicon")
# Two transparent tab icons, picked by the page through prefers-color-scheme:
# the black mark for light tab bars, the off-white one for dark. Each is only
# shown against a tab that contrasts with it, so neither needs a tile.
#
# Framing. Fitting the whole splat into a 32px square leaves the D and A a few
# pixels tall, because the long arms and the loose droplets set the bounding box.
# So the tab icons trim the droplets and crop to a square centred on the ink,
# FAVICON_ZOOM of the splat's own size, letting the arm tips run off the edge.
# The arms still radiate, so it reads as the splat, and the letters get the room.
#
# The home-screen icon keeps the whole splat with a margin: iOS shows it large and
# rounds its corners, and it keeps a ground because iOS paints transparency black.
FAVICON_BG = (10, 7, 5)   # matches the theme-color every page declares
FAVICON_ZOOM = 0.86
DA = SRC / "logos" / "DA_SPLAT"

def splat_body(mark):
    """Bounding box of the largest connected shape: the splat without droplets."""
    step = 4
    alpha = mark.getchannel("A").resize((mark.width // step, mark.height // step))
    w, h = alpha.size
    px = alpha.load()
    seen = bytearray(w * h)
    best = (0, None)
    for y in range(h):
        for x in range(w):
            if px[x, y] <= 60 or seen[y * w + x]:
                continue
            stack = [(x, y)]
            seen[y * w + x] = 1
            n, x0, y0, x1, y1 = 0, x, y, x, y
            while stack:
                cx, cy = stack.pop()
                n += 1
                x0, y0, x1, y1 = min(x0, cx), min(y0, cy), max(x1, cx), max(y1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny] > 60:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if n > best[0]:
                best = (n, (x0 * step, y0 * step, (x1 + 1) * step, (y1 + 1) * step))
    return best[1]

def favicon_art(path):
    mark = ImageOps.exif_transpose(Image.open(path)).convert("RGBA")
    mark = mark.crop(mark.getchannel("A").getbbox())
    body = splat_body(mark)
    trimmed = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    trimmed.paste(mark.crop(body), body[:2])
    return trimmed, body

def centred_square(img, cx, cy, side):
    box = (round(cx - side / 2), round(cy - side / 2))
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(img, (-box[0], -box[1]), img)
    return square

for master, suffix in (("DA-BLACK-2000.png", ""), ("DA-OFF_WHITE-2000.png", "-dark")):
    src = DA / master
    if not src.exists():
        print(f"  SKIP {master} (missing)")
        continue
    art, body = favicon_art(src)
    ink = art.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    # centre of mass of the ink, so the crop sits on the splat's weight, not its box
    xs = sum(x * v for x, v in enumerate(ink.resize((art.width, 1), Image.BOX).getdata()))
    ys = sum(y * v for y, v in enumerate(ink.resize((1, art.height), Image.BOX).getdata()))
    cx = xs / max(sum(ink.resize((art.width, 1), Image.BOX).getdata()), 1)
    cy = ys / max(sum(ink.resize((1, art.height), Image.BOX).getdata()), 1)
    side = round(max(body[2] - body[0], body[3] - body[1]) * FAVICON_ZOOM)
    square = centred_square(art, cx, cy, side)
    for px, base in ((32, "favicon-32"), (180, "favicon")):
        name = f"{base}{suffix}.png"
        square.resize((px, px), Image.LANCZOS).save(OUT / name, "PNG", optimize=True)
        print(f"  {name} {px}x{px} transparent, zoom {FAVICON_ZOOM}")
        report(OUT / name)

touch_src = DA / "DA-OFF_WHITE-2000.png"
if touch_src.exists():
    art, body = favicon_art(touch_src)
    art = art.crop(body)
    side = round(max(art.size) * 1.14)
    ground = Image.new("RGB", (side, side), FAVICON_BG)
    ground.paste(art, ((side - art.width) // 2, (side - art.height) // 2), art)
    ground.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    print("  apple-touch-icon.png 180x180 on ground, whole splat")
    report(OUT / "apple-touch-icon.png")

print("Partner logos")
# Logos belonging to the rooms and series the band plays, shown beside those
# dates. They arrive as flat black-on-transparent artwork, which is invisible on
# this site, so the RGB is replaced and the alpha kept: the standard reversed
# colourway of a one-colour mark, not a redraw. Cropped to the artwork first,
# because the supplied files carry their own margins and the row sets its own.
PARTNER_INK = (240, 230, 216)   # --ink
for rel_src, out_base, width in [
    # None in use right now: The Shelf date carries its session graphic instead,
    # and the Batch set came off the list. Masters stay in _source/logos/PARTNERS.
    # ("PARTNERS/THE-SHELF-CONCERTS.png", "the-shelf-concerts", 620),
    # ("PARTNERS/BATCH.png", "batch", 620),
]:
    src = SRC / "logos" / rel_src
    if not src.exists():
        print(f"  SKIP logos/{rel_src} (missing)")
        continue
    with Image.open(src) as image:
        art = ImageOps.exif_transpose(image).convert("RGBA")
        art = art.crop(art.getchannel("A").getbbox())
        alpha = art.getchannel("A")
        art = Image.new("RGBA", art.size, PARTNER_INK + (255,))
        art.putalpha(alpha)
        art = resize_to_width(art, width)
        dest = OUT_LOGOS / f"{out_base}.png"
        art.quantize(colors=256, method=Image.FASTOCTREE).save(dest, "PNG", optimize=True)
        print(f"  {out_base} {art.width}x{art.height}")
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
photo_credits = load_photo_credits()
for slug, names in LINEUP_SOURCES.items():
    src = find_source("lineup", names)
    if not src:
        print(f"  SKIP lineup/{slug} (missing source for {names})")
        continue
    print(f"  {slug} <= {src.relative_to(SRC)}")
    who, _ = credit_slug(src.stem)
    meta = process_raster(src, OUT_LINEUP, f"{who}--{slug}", 900, jpeg_q=84, webp_q=82,
                          lightbox_width=1600)
    meta["credit"] = (photo_credits.get(f"lineup/{src.name}") or {}).get("photographer")
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
for src, alt in discover_gallery_sources():
    who, shot = credit_slug(src.stem)
    out_base = f"{who}--{shot}"
    print(f"  {out_base} <= gallery/{src.name}")
    meta = process_gallery_item(src, OUT_GALLERY, out_base)
    meta["credit"] = (photo_credits.get(src.name) or {}).get("photographer")
    if alt:
        meta["alt"] = alt
    gallery_manifest.append(meta)
    report(OUT_GALLERY / Path(meta["src"]).name)
    report(OUT_GALLERY / Path(meta["webp"]).name)
    report(OUT_GALLERY / Path(meta["webpSmall"]).name)
    report(OUT_GALLERY_FULL / Path(meta["fullWebp"]).name)

print("Merch")
merch_src = find_source("merch", ["MERCH_1", "merch-1", "MERCH_1.JPG"])
if merch_src:
    process_raster(merch_src, OUT_MERCH, "merch-1", 1400, jpeg_q=85, webp_q=82)
ldean_bg = SRC / "merch" / "LDEAN_MERCH.jpg"
if ldean_bg.exists():
    meta = process_raster(ldean_bg, OUT_MERCH, "ldean-merch-bg", 1920, jpeg_q=82, webp_q=78)
    report(OUT_MERCH / Path(meta["src"]).name)
    report(OUT_MERCH / Path(meta["webp"]).name)

manifest_path = DATA / "epk-images.json"
manifest = {"lineup": lineup_manifest, "gallery": gallery_manifest}
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"\nWrote {manifest_path.relative_to(ROOT)}")

# Built gallery and lineup photos are named after their masters, so renaming or
# archiving a master leaves the old derivative behind. Anything in those two
# output folders that the manifest no longer references is removed here; the
# masters in _source are never touched.
keep = set()
for entry in list(manifest["gallery"]) + list(manifest["lineup"].values()):
    for key in ("src", "webp", "webpSmall", "full", "fullWebp"):
        if entry.get(key):
            keep.add((ROOT / entry[key]).resolve())
swept = 0
for out_dir in (OUT_GALLERY, OUT_LINEUP):
    for path in sorted(out_dir.rglob("*"), reverse=True):
        if path.is_file() and path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and path.resolve() not in keep:
            path.unlink()
            swept += 1
        elif path.is_dir() and path.name != "full" and all(p.name == ".DS_Store" for p in path.iterdir()):
            # Finder drops a .DS_Store into any folder it has shown, which would
            # otherwise keep an emptied folder alive forever.
            for junk in path.iterdir():
                junk.unlink()
            path.rmdir()
print(f"Removed {swept} built photos no longer in the manifest")
print("Done.")
