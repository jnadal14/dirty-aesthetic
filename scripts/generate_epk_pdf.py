#!/usr/bin/env python3
"""Generate the downloadable Dirty Aesthetic electronic press kit."""

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets" / "downloads" / "dirtyaesthetic_epk.pdf"
GROUP_PHOTO = ROOT / "assets" / "images" / "optimized" / "header-desktop.jpg"
ALBUM_COVER = ROOT / "assets" / "images" / "optimized" / "covers" / "cover_LP_modern_nostalgia.jpg"
WORDMARK = ROOT / "assets" / "logos" / "FULL_NAME" / "FULL-OFF_WHITE.png"

PAGE_W, PAGE_H = A4
BLACK = HexColor("#060504")
INK = HexColor("#f0e6d8")
MUTED = HexColor("#c7b69e")
ACCENT = HexColor("#e0a169")
RULE = Color(1, 1, 1, alpha=0.13)


BIO_PARAGRAPHS = [
    (
        "Dirty Aesthetic is a five-piece indie-rock band from Vancouver, British Columbia. "
        "Formed in the summer of 2024, the band combines garage and surf energy with "
        "alternative and folk textures, moving between volatile live peaks and more exposed, "
        "emotionally direct songwriting."
    ),
    (
        "Their debut EP, <i>Sugar on the Rocks</i>, followed the excitement and eventual "
        "collapse of first love. Their debut full-length, <i>Modern Nostalgia</i>, begins in "
        "the aftermath. Across eleven songs, the album explores grief, longing, mental-health "
        "strain, changing relationships, and the decisions people make when they are trying "
        "to move forward."
    ),
    (
        "The album expands the band's sound without losing the immediacy of its live show. "
        "Guitars shift between sharp garage-rock movement, melodic surf colour, and quieter "
        "passages that leave more room for the songs' emotional weight."
    ),
    (
        "Dirty Aesthetic have built their early audience through Vancouver's independent "
        "music community, appearing at rooms including Green Auto, The Roxy, and the Biltmore "
        "Cabaret. <i>Modern Nostalgia</i> arrives August 12, 2026, with an album-release "
        "performance at the Biltmore and an official video for the title track following the "
        "release."
    ),
]


def draw_cover_image(pdf, image_path, x, y, width, height):
    """Draw an image cropped to fill a rectangle."""
    image = ImageReader(str(image_path))
    image_w, image_h = image.getSize()
    scale = max(width / image_w, height / image_h)
    draw_w, draw_h = image_w * scale, image_h * scale
    draw_x = x + (width - draw_w) / 2
    draw_y = y + (height - draw_h) / 2

    pdf.saveState()
    clip = pdf.beginPath()
    clip.rect(x, y, width, height)
    pdf.clipPath(clip, stroke=0, fill=0)
    pdf.drawImage(image, draw_x, draw_y, draw_w, draw_h, mask="auto")
    pdf.restoreState()


def draw_wordmark(pdf, x, y, width):
    image = ImageReader(str(WORDMARK))
    image_w, image_h = image.getSize()
    height = width * image_h / image_w
    pdf.drawImage(image, x, y, width, height, mask="auto")
    return height


def draw_label(pdf, text, x, y, size=7.2):
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", size)
    pdf.drawString(x, y, text.upper())


def draw_lines(pdf, lines, x, y, leading=14, size=9.2, color=INK):
    pdf.setFillColor(color)
    pdf.setFont("Helvetica", size)
    cursor_y = y
    for line in lines:
        pdf.drawString(x, cursor_y, line)
        cursor_y -= leading
    return cursor_y


def draw_footer(pdf, page_number):
    pdf.setStrokeColor(RULE)
    pdf.line(40, 35, PAGE_W - 40, 35)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 6.8)
    pdf.drawString(40, 22, "DIRTY AESTHETIC - ELECTRONIC PRESS KIT")
    page_label = f"{page_number:02d}"
    pdf.drawRightString(PAGE_W - 40, 22, page_label)


def draw_page_one(pdf):
    pdf.setFillColor(BLACK)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    photo_y = PAGE_H * 0.45
    draw_cover_image(pdf, GROUP_PHOTO, 0, photo_y, PAGE_W, PAGE_H - photo_y)

    logo_w = 420
    logo_x = (PAGE_W - logo_w) / 2
    draw_wordmark(pdf, logo_x, PAGE_H - 112, logo_w)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 8)
    subtitle = "ELECTRONIC PRESS KIT / VANCOUVER, BC / 2026"
    subtitle_x = (PAGE_W - stringWidth(subtitle, "Helvetica-Bold", 8)) / 2
    pdf.drawString(subtitle_x, PAGE_H - 132, subtitle)

    cover_size = 250
    cover_x, cover_y = 42, 72
    pdf.drawImage(
        ImageReader(str(ALBUM_COVER)),
        cover_x,
        cover_y,
        cover_size,
        cover_size,
        mask="auto",
        preserveAspectRatio=True,
    )
    pdf.setStrokeColor(RULE)
    pdf.rect(cover_x, cover_y, cover_size, cover_size, stroke=1, fill=0)

    info_x = 326
    draw_label(pdf, "Debut full-length", info_x, 306)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 25)
    pdf.drawString(info_x, 272, "MODERN")
    pdf.drawString(info_x, 244, "NOSTALGIA")
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(info_x, 219, "AUGUST 12, 2026")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 8.8)
    pdf.drawString(info_x, 194, "11 songs / debut album")

    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawString(info_x, 159, "PRE-SAVE")
    presave = "distrokid.com/hyperfollow/dirtyaesthetic/modern-nostalgia-2"
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 6.8)
    pdf.drawString(info_x, 145, presave)
    pdf.linkURL(
        "https://distrokid.com/hyperfollow/dirtyaesthetic/modern-nostalgia-2?ref=release",
        (info_x, 140, PAGE_W - 38, 154),
        relative=0,
    )

    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawString(info_x, 111, "CONTACT")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 7.4)
    pdf.drawString(info_x, 97, "dirtyaestheticmusic@gmail.com")
    pdf.drawString(info_x, 84, "dirtyaesthetic.com")

    draw_footer(pdf, 1)
    pdf.showPage()


def draw_page_two(pdf):
    pdf.setFillColor(BLACK)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(ACCENT)
    pdf.rect(0, PAGE_H - 8, PAGE_W, 8, stroke=0, fill=1)

    draw_wordmark(pdf, 40, PAGE_H - 70, 190)
    draw_label(pdf, "Biography", 40, PAGE_H - 102, 8)

    body_style = ParagraphStyle(
        "Bio",
        fontName="Helvetica",
        fontSize=9.15,
        leading=13.4,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=9,
    )
    y = PAGE_H - 126
    bio_width = 338
    for body in BIO_PARAGRAPHS:
        paragraph = Paragraph(body, body_style)
        paragraph_w, paragraph_h = paragraph.wrap(bio_width, y - 54)
        y -= paragraph_h
        paragraph.drawOn(pdf, 40, y)
        y -= 11

    sidebar_x = 406
    sidebar_w = PAGE_W - sidebar_x - 40
    pdf.drawImage(
        ImageReader(str(ALBUM_COVER)),
        sidebar_x,
        PAGE_H - 218,
        sidebar_w,
        sidebar_w,
        mask="auto",
        preserveAspectRatio=True,
    )

    side_y = PAGE_H - 242
    draw_label(pdf, "Lineup", sidebar_x, side_y)
    side_y = draw_lines(
        pdf,
        [
            "Bardia Tarjoman - lead guitar",
            "Dylan Iwaschuk - lead vocals",
            "Jacob Nadal - rhythm guitar, vocals",
            "Josh Chapman - drums",
            "Josh Seaman - bass",
        ],
        sidebar_x,
        side_y - 17,
        leading=13,
        size=7.2,
        color=INK,
    )

    side_y -= 12
    draw_label(pdf, "Selected releases", sidebar_x, side_y)
    side_y = draw_lines(
        pdf,
        [
            "Modern Nostalgia - album - Aug 12, 2026",
            "Modern Nostalgia - single - Jul 23, 2026",
            "Back to Me - single - Jun 18, 2026",
            "Irrational - single - May 23, 2026",
            "Sugar on the Rocks - EP - Jan 9, 2026",
        ],
        sidebar_x,
        side_y - 17,
        leading=13,
        size=6.9,
        color=INK,
    )

    side_y -= 12
    draw_label(pdf, "Selected rooms", sidebar_x, side_y)
    side_y = draw_lines(
        pdf,
        ["Green Auto", "The Roxy Cabaret", "The Biltmore Cabaret"],
        sidebar_x,
        side_y - 17,
        leading=13,
        size=7.2,
        color=INK,
    )

    side_y -= 12
    draw_label(pdf, "Press and contact", sidebar_x, side_y)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica", 7.2)
    pdf.drawString(sidebar_x, side_y - 17, "dirtyaesthetic.com/epk.html")
    pdf.drawString(sidebar_x, side_y - 30, "dirtyaestheticmusic@gmail.com")
    pdf.linkURL(
        "https://www.dirtyaesthetic.com/epk.html",
        (sidebar_x, side_y - 21, PAGE_W - 40, side_y - 7),
        relative=0,
    )
    pdf.linkURL(
        "mailto:dirtyaestheticmusic@gmail.com",
        (sidebar_x, side_y - 34, PAGE_W - 40, side_y - 22),
        relative=0,
    )

    draw_footer(pdf, 2)
    pdf.showPage()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    pdf.setTitle("Dirty Aesthetic - Electronic Press Kit")
    pdf.setAuthor("Dirty Aesthetic")
    pdf.setSubject("Biography, lineup, releases, venues, press photos, and contact information")
    draw_page_one(pdf)
    draw_page_two(pdf)
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
