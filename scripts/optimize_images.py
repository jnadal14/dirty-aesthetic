#!/usr/bin/env python3
"""Generate web-optimized image variants for the Dirty Aesthetic site.

Originals stay untouched in assets/images/.
Outputs go to assets/images/optimized/.
"""

import os
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
for d in (OUT, OUT_COVERS, OUT_LINEUP, OUT_GALLERY):
    d.mkdir(parents=True, exist_ok=True)

CWEBP = (
    shutil.which("cwebp")
    or ("/opt/homebrew/bin/cwebp" if Path("/opt/homebrew/bin/cwebp").exists() else None)
    or ("/usr/local/bin/cwebp" if Path("/usr/local/bin/cwebp").exists() else None)
)
if not CWEBP:
    raise SystemExit("cwebp not found")


def resize_to_width(img, target_w):
    if img.width <= target_w:
        return img.copy()
    ratio = target_w / img.width
    return img.resize((target_w, round(img.height * ratio)), Image.LANCZOS)


def save_jpeg(img, dest, quality=82):
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)


def save_webp(src_jpeg, dest_webp, quality=80):
    """Use cwebp for best WebP quality/size balance."""
    subprocess.run(
        [CWEBP, "-q", str(quality), "-m", "6", "-mt", "-quiet",
         str(src_jpeg), "-o", str(dest_webp)],
        check=True,
    )


def process(src_name, out_name, target_width, jpeg_q=82, webp_q=80):
    src = SRC / src_name
    if not src.exists():
        print(f"  SKIP {src_name} (missing)")
        return None
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)
    resized = resize_to_width(img, target_width)
    out_jpg = OUT / out_name
    save_jpeg(resized, out_jpg, jpeg_q)
    out_webp = out_jpg.with_suffix(".webp")
    save_webp(out_jpg, out_webp, webp_q)
    return out_jpg, out_webp


def process_cover(src_name, out_name=None, target=1200, jpeg_q=85, webp_q=82):
    src = SRC / "covers" / src_name
    if not src.exists():
        print(f"  SKIP covers/{src_name} (missing)")
        return None
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)
    resized = resize_to_width(img, target)
    out_jpg = OUT_COVERS / (out_name or src_name)
    save_jpeg(resized, out_jpg, jpeg_q)
    out_webp = out_jpg.with_suffix(".webp")
    save_webp(out_jpg, out_webp, webp_q)
    return out_jpg, out_webp


def report(path):
    if not path or not path.exists():
        return
    size_kb = path.stat().st_size / 1024
    print(f"  {path.relative_to(ROOT)}  {size_kb:.0f} KB")


print("Hero / background images")
for r in [
    process("HEADER.jpg", "header-desktop.jpg", 1920, jpeg_q=82, webp_q=78),
    process("HEADER_MOBILE.jpg", "header-mobile.jpg", 1080, jpeg_q=82, webp_q=78),
    process("FULL_PROFILE.jpg", "full-profile.jpg", 900, jpeg_q=82, webp_q=80),
]:
    if r:
        for p in r: report(p)

print("Section background")
for r in [
    process("BACKGROUND/BACK_EP.jpg", "back-ep.jpg", 1600, jpeg_q=80, webp_q=78),
]:
    if r:
        for p in r: report(p)

print("Album / single covers")
for src_name in [
    "cover_irrational.jpg",
    "cover_sugar_on_the_rocks.jpg",
    "cover_sugar_bottom.jpg",
    "cover_blue_roses.jpg",
    "cover_while_i_wonder.jpg",
    "cover_run.jpg",
]:
    r = process_cover(src_name, target=1200, jpeg_q=85, webp_q=82)
    if r:
        for p in r: report(p)


def process_subdir(src_subdir, out_dir, file_map, *, target=1400, jpeg_q=82, webp_q=80, png_to_webp_only=True):
    """Process a directory of images.

    file_map: dict mapping source filename → out base name (without extension).
    """
    for src_name, out_base in file_map.items():
        src = SRC / src_subdir / src_name
        if not src.exists():
            print(f"  SKIP {src_subdir}/{src_name} (missing)")
            continue
        img = Image.open(src)
        img = ImageOps.exif_transpose(img)
        resized = resize_to_width(img, target)
        has_alpha = "A" in resized.mode or (resized.mode == "P" and "transparency" in resized.info)
        if has_alpha:
            out_png = out_dir / f"{out_base}.png"
            resized.save(out_png, "PNG", optimize=True)
            out_webp = out_dir / f"{out_base}.webp"
            subprocess.run(
                [CWEBP, "-q", str(webp_q), "-m", "6", "-mt", "-quiet",
                 "-alpha_q", "100", str(out_png), "-o", str(out_webp)],
                check=True,
            )
            report(out_png)
            report(out_webp)
        else:
            out_jpg = out_dir / f"{out_base}.jpg"
            save_jpeg(resized, out_jpg, jpeg_q)
            out_webp = out_jpg.with_suffix(".webp")
            save_webp(out_jpg, out_webp, webp_q)
            report(out_jpg)
            report(out_webp)


print("Lineup portraits")
lineup_map = {
    "BARDIA.jpg":  "bardia",
    "DYLAN.jpg":   "dylan",
    "ETHAN.jpg":   "ethan",
    "JACOB.jpg":   "jacob",
    "JOSH C.jpg":  "josh-c",
    "JOSH S.jpg":  "josh-s",
}
process_subdir("LINEUP", OUT_LINEUP, lineup_map, target=900, jpeg_q=84, webp_q=82)

print("Gallery photos")
gallery_map = {f"{i}.jpg": str(i) for i in range(1, 17) if i not in (8, 16)}
gallery_map["8.png"] = "8"
gallery_map["16.png"] = "16"
process_subdir("GALLERY", OUT_GALLERY, gallery_map, target=1400, jpeg_q=82, webp_q=78)

print("\nDone.")
