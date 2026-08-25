from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFilter, ImageOps

import build_canva_facebook_layout_variations_v4 as m


ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "canva-rugged-launch-sale-v8"
OUT = PKG / "posts"
BG = PKG / "backgrounds"
SRC = PKG / "source-frames"
OUT.mkdir(parents=True, exist_ok=True)

m.W, m.H = 1200, 900
m.PKG, m.OUT, m.BG, m.SRC = PKG, OUT, BG, SRC
W, H = m.W, m.H

INK = "#061510"
PINE = "#0b342b"
MOSS = "#2d4638"
BARK = "#241a13"
RUST = "#8d3b28"
GOLD = "#d9aa3d"
PARCHMENT = "#f0e6d2"
WHITE = "#fffaf0"
FOG = "#c9cec7"


def rgba(color, alpha=255):
    return m.rgba(color, alpha)


def bg(name, centering=(0.5, 0.5)):
    return m.cover(BG / name, centering)


def darken(canvas, alpha=125):
    canvas.alpha_composite(Image.new("RGBA", (W, H), rgba(INK, alpha)))


def side_gradient(canvas, side="left", strength=238, reach=0.66):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = layer.load()
    cr, cg, cb, _ = rgba(INK)
    for x in range(W):
        t = x / (W - 1)
        if side == "left":
            amount = max(0, 1 - t / reach)
        else:
            amount = max(0, 1 - (1 - t) / reach)
        a = int(strength * amount)
        for y in range(H):
            px[x, y] = (cr, cg, cb, a)
    canvas.alpha_composite(layer)


def vignette(canvas, strength=170):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = layer.load()
    cx, cy = W / 2, H / 2
    maxd = (cx * cx + cy * cy) ** 0.5
    for y in range(H):
        for x in range(W):
            dist = (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / maxd
            a = int(max(0, dist - 0.37) ** 1.45 * strength)
            px[x, y] = (0, 0, 0, min(200, a))
    canvas.alpha_composite(layer)


def grain(canvas, seed=1, amount=6500):
    random.seed(seed)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(amount):
        x = random.randrange(W)
        y = random.randrange(H)
        v = random.choice((25, 35, 215, 235))
        d.point((x, y), fill=(v, v, v, random.randrange(2, 20)))
    canvas.alpha_composite(layer)


def rough_panel(canvas, box, fill=INK, alpha=226, outline=GOLD, width=3):
    x1, y1, x2, y2 = box
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle(box, 20, fill=rgba(fill, alpha), outline=rgba(outline, 220), width=width)
    random.seed(sum(box))
    for _ in range(25):
        y = random.randint(y1 + 6, y2 - 6)
        x = random.randint(x1 + 3, max(x1 + 3, x2 - 42))
        d.line((x, y, min(x2 - 3, x + random.randint(8, 60)), y + random.randint(-1, 1)),
               fill=rgba(PARCHMENT, random.randint(7, 20)), width=1)


def logo(canvas, x=42, y=32, width=88):
    m.add_logo(canvas, x, y, width, backing=True)


def headline(canvas, text, x, y, max_width, max_size=84, fill=WHITE):
    return m.headline(canvas, text, x, y, max_width, max_size, fill=fill)


def subline(canvas, text, x, y, max_width, size=27, fill=GOLD):
    return m.subline(canvas, text, x, y, max_width, size, fill=fill)


def phone(canvas, source, x, y, w=305, h=640, angle=0, crop_top=0, centering=(0.5, 0.05)):
    m.paste_phone(canvas, source, x, y, w, h, angle, crop_top, centering)


def screen_card(canvas, source, box, crop_top=0, centering=(0.5, 0.10)):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    shadow = Image.new("RGBA", (w + 70, h + 70), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((35, 35, w + 35, h + 35), 24, fill=(0, 0, 0, 185))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)), (x1 - 35, y1 - 28))
    panel = Image.new("RGBA", (w, h), rgba(PARCHMENT))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 24, fill=rgba(PARCHMENT), outline=rgba(GOLD), width=3)
    image = Image.open(source).convert("RGB")
    top = min(crop_top, max(0, image.height - 20))
    image = image.crop((0, top, image.width, image.height))
    image = ImageOps.fit(image, (w - 16, h - 16), Image.Resampling.LANCZOS, centering=centering)
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), 18, fill=255)
    panel.paste(image, (8, 8), mask)
    canvas.alpha_composite(panel, (x1, y1))


def campaign_sale(canvas, dark=False):
    d = ImageDraw.Draw(canvas)
    y = 790
    d.rectangle((0, y, W, H), fill=rgba(INK if dark else GOLD, 248))
    main_fill = WHITE if dark else INK
    accent_fill = GOLD if dark else RUST
    d.text((34, y + 13), "LAUNCH SALE", font=m.font(m.BOLD, 22), fill=accent_fill)
    d.text((34, y + 42), "50% OFF", font=m.font(m.HEAD, 49), fill=main_fill)
    d.line((268, y + 19, 268, y + 88), fill=rgba(accent_fill), width=3)
    d.text((296, y + 15), "CODE", font=m.font(m.BOLD, 18), fill=accent_fill)
    d.text((296, y + 39), "50ducks", font=m.font(m.HEAD, 42), fill=main_fill)
    d.line((566, y + 19, 566, y + 88), fill=rgba(accent_fill), width=3)
    d.text((594, y + 15), "ENDS", font=m.font(m.BOLD, 18), fill=accent_fill)
    d.text((594, y + 39), "SEPTEMBER 11", font=m.font(m.HEAD, 42), fill=main_fill)
    right = "BLINDIQ.APP"
    f = m.font(m.BOLD, 22)
    d.text((W - d.textlength(right, font=f) - 35, y + 50), right, font=f, fill=main_fill)


def save(canvas, filename, seed):
    grain(canvas, seed)
    canvas.convert("RGB").save(OUT / filename, quality=97, subsampling=0)


def p01():
    c = bg("flooded-timber-sunrise.png", (0.5, 0.48))
    side_gradient(c, "left", 245, 0.67)
    vignette(c, 185)
    logo(c, 42, 34, 84)
    d = ImageDraw.Draw(c)
    d.text((151, 50), "BLINDIQ  •  WEBSITE APP", font=m.font(m.BOLD, 20), fill=GOLD)
    y = headline(c, "YOUR DIGITAL FIELD GUIDE + FIELD LOG.", 44, 126, 575, 76)
    subline(c, "KNOW THE REGULATIONS. LOG THE BIRDS. SAVE THE HUNTS.", 48, y + 15, 555, 24)
    phone(c, SRC / "01-dashboard-state.png", 757, 93, 320, 650, -2, 0, (0.5, 0.08))
    rough_panel(c, (44, 570, 620, 735), BARK, 226)
    d.text((74, 597), "STATE  •  ZONE  •  SEASON", font=m.font(m.BOLD, 22), fill=GOLD)
    d.text((74, 643), "ONE FIELD-READY HOME.", font=m.font(m.HEAD, 44), fill=WHITE)
    d.text((74, 697), "Open on any internet-connected device.", font=m.font(m.BODY, 21), fill=PARCHMENT)
    campaign_sale(c)
    save(c, "01-digital-field-guide-and-log.jpg", 101)


def p02():
    c = bg("flooded-timber-phone.png", (0.5, 0.52))
    side_gradient(c, "right", 245, 0.63)
    vignette(c, 175)
    phone(c, SRC / "02-season-overview.png", 112, 92, 316, 650, 2, 0, (0.5, 0.13))
    d = ImageDraw.Draw(c)
    d.text((515, 55), "BEFORE FIRST LIGHT", font=m.font(m.BOLD, 22), fill=GOLD)
    y = headline(c, "KNOW THE SEASON BEFORE YOU GO.", 512, 103, 635, 79)
    subline(c, "DATES. ZONES. DUCKS. GEESE.", 517, y + 16, 585, 27)
    rough_panel(c, (515, 485, 1134, 698), INK, 223)
    d.text((547, 516), "THE DIGITAL FIELD GUIDE", font=m.font(m.BOLD, 22), fill=GOLD)
    d.text((547, 557), "CLEARER INFORMATION.", font=m.font(m.HEAD, 48), fill=WHITE)
    d.text((547, 611), "Official-source links stay within reach.", font=m.font(m.BODY, 22), fill=PARCHMENT)
    campaign_sale(c)
    save(c, "02-know-the-season-before-you-go.jpg", 202)


def p03():
    c = bg("cedar-blind-field-log.png", (0.48, 0.56))
    side_gradient(c, "left", 236, 0.58)
    vignette(c, 190)
    d = ImageDraw.Draw(c)
    d.text((44, 40), "DETAILS MATTER", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "THE RESTRICTIONS. WITHOUT THE SEARCH.", 42, 88, 540, 72)
    subline(c, "KEEP THE IMPORTANT DETAILS CLOSE.", 46, y + 14, 500, 24)
    phone(c, SRC / "03-restrictions.png", 765, 72, 316, 660, -2, 0, (0.5, 0.13))
    rough_panel(c, (44, 505, 600, 705), BARK, 229)
    d.text((75, 536), "BEFORE YOU HUNT", font=m.font(m.BOLD, 22), fill=GOLD)
    d.text((75, 580), "REVIEW THE RULES.", font=m.font(m.HEAD, 50), fill=WHITE)
    d.line((76, 639, 522, 639), fill=rgba(GOLD), width=3)
    d.text((75, 657), "Always verify with official sources.", font=m.font(m.BODY, 21), fill=PARCHMENT)
    campaign_sale(c)
    save(c, "03-important-restrictions-close-at-hand.jpg", 303)


def p04():
    c = bg("cedar-blind-field-log.png", (0.55, 0.46))
    darken(c, 68)
    side_gradient(c, "left", 242, 0.64)
    vignette(c, 180)
    d = ImageDraw.Draw(c)
    d.text((46, 40), "LIVE FROM THE BLIND", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "BIRD DOWN. TAP +.", 43, 91, 560, 88)
    subline(c, "LOG SPECIES AND SEX IN SECONDS.", 47, y + 14, 535, 25)
    rough_panel(c, (44, 385, 566, 686), INK, 228)
    d.text((73, 416), "01", font=m.font(m.HEAD, 49), fill=GOLD)
    d.text((140, 421), "CHOOSE THE BIRD", font=m.font(m.BOLD, 27), fill=WHITE)
    d.line((73, 479, 527, 479), fill=rgba(GOLD), width=2)
    d.text((73, 503), "02", font=m.font(m.HEAD, 49), fill=GOLD)
    d.text((140, 508), "TAP +", font=m.font(m.BOLD, 27), fill=WHITE)
    d.line((73, 566, 527, 566), fill=rgba(GOLD), width=2)
    d.text((73, 590), "03", font=m.font(m.HEAD, 49), fill=GOLD)
    d.text((140, 595), "KEEP HUNTING", font=m.font(m.BOLD, 27), fill=WHITE)
    phone(c, SRC / "04-hunt-empty.png", 760, 73, 320, 662, 2, 0, (0.5, 0.15))
    campaign_sale(c)
    save(c, "04-bird-down-tap-plus.jpg", 404)


def p05():
    c = bg("end-of-hunt-blind.png", (0.5, 0.5))
    darken(c, 80)
    vignette(c, 190)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 226), fill=rgba(INK, 226))
    d.text((44, 36), "THE COUNT MOVES WITH YOU", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "YOUR BAG UPDATES WITH EVERY BIRD.", 43, 78, 1110, 76)
    subline(c, "SEE WHAT REMAINS WHILE THE HUNT IS STILL ACTIVE.", 47, y + 8, 1060, 23)
    phone(c, SRC / "04-hunt-empty.png", 142, 260, 275, 500, -3, 0, (0.5, 0.14))
    phone(c, SRC / "05-hunt-live.png", 765, 260, 275, 500, 3, 0, (0.5, 0.14))
    d.ellipse((526, 442, 656, 572), fill=rgba(GOLD))
    d.text((591, 505), "→", font=m.font(m.BOLD, 70), fill=INK, anchor="mm")
    d.text((591, 610), "LOG IT. SEE WHAT REMAINS.", font=m.font(m.BOLD, 23), fill=WHITE, anchor="mm")
    campaign_sale(c)
    save(c, "05-your-bag-updates-live.jpg", 505)


def p06():
    c = bg("hunters-in-timber.png", (0.5, 0.48))
    side_gradient(c, "right", 242, 0.64)
    vignette(c, 185)
    phone(c, SRC / "06-hunt-summary.png", 90, 83, 316, 650, 2, 0, (0.5, 0.12))
    d = ImageDraw.Draw(c)
    d.text((505, 46), "WHEN THE HUNT ENDS", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "THE RECORD STAYS.", 502, 96, 640, 92)
    subline(c, "SAVE EVERY BIRD TO MY HUNTS.", 507, y + 14, 580, 25)
    rough_panel(c, (505, 420, 1134, 698), BARK, 230)
    d.text((540, 454), "FIELD LOG COMPLETE", font=m.font(m.BOLD, 22), fill=GOLD)
    d.text((540, 500), "DATE  •  STATE  •  ZONE", font=m.font(m.HEAD, 38), fill=WHITE)
    d.text((540, 548), "SPECIES  •  SEX  •  COUNT", font=m.font(m.HEAD, 38), fill=WHITE)
    d.line((540, 606, 1084, 606), fill=rgba(GOLD), width=3)
    d.text((540, 630), "A season worth remembering starts here.", font=m.font(m.BODY, 21), fill=PARCHMENT)
    campaign_sale(c)
    save(c, "06-the-record-stays.jpg", 606)


def p07():
    c = bg("flooded-timber-sunrise.png", (0.55, 0.5))
    side_gradient(c, "left", 242, 0.67)
    vignette(c, 175)
    d = ImageDraw.Draw(c)
    d.text((44, 38), "BLINDIQ FIELD GUIDE", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "NOT SURE? CHECK THE FIELD GUIDE.", 42, 84, 590, 77)
    subline(c, "REFERENCE PHOTOS + IDENTIFYING MARKERS.", 46, y + 14, 545, 23)
    phone(c, SRC / "07-bird-guide.png", 765, 72, 316, 660, -2, 0, (0.5, 0.10))
    rough_panel(c, (44, 480, 610, 705), INK, 227)
    d.text((75, 512), "DUCKS  •  GEESE  •  OTHER", font=m.font(m.BOLD, 22), fill=GOLD)
    d.text((75, 560), "CHECK THE BIRD.", font=m.font(m.HEAD, 50), fill=WHITE)
    d.text((75, 615), "THEN LOG IT.", font=m.font(m.HEAD, 50), fill=WHITE)
    campaign_sale(c)
    save(c, "07-check-the-field-guide.jpg", 707)


def p08():
    c = bg("flooded-timber-phone.png", (0.5, 0.52))
    darken(c, 112)
    vignette(c, 185)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 205), fill=rgba(INK, 230))
    d.text((42, 32), "ONE COMPLETE FIELD-LOG WORKFLOW", font=m.font(m.BOLD, 20), fill=GOLD)
    y = headline(c, "CHECK. HUNT. SAVE.", 41, 73, 1110, 85)
    subline(c, "FROM THE FIRST PLAN TO THE FINAL COUNT.", 45, y + 6, 1020, 23)
    screen_card(c, SRC / "01-dashboard-state.png", (55, 248, 348, 694), 0, (0.5, 0.11))
    screen_card(c, SRC / "05-hunt-live.png", (454, 248, 747, 694), 0, (0.5, 0.15))
    screen_card(c, SRC / "06-hunt-summary.png", (853, 248, 1146, 694), 0, (0.5, 0.12))
    for x in (380, 779):
        d.ellipse((x - 31, 435, x + 31, 497), fill=rgba(GOLD))
        d.text((x, 465), "→", font=m.font(m.BOLD, 38), fill=INK, anchor="mm")
    d.text((201, 721), "KNOW", font=m.font(m.BOLD, 20), fill=WHITE, anchor="mm")
    d.text((600, 721), "LOG", font=m.font(m.BOLD, 20), fill=WHITE, anchor="mm")
    d.text((999, 721), "SAVE", font=m.font(m.BOLD, 20), fill=WHITE, anchor="mm")
    campaign_sale(c)
    save(c, "08-check-hunt-save.jpg", 808)


def p09():
    c = bg("cedar-blind-field-log.png", (0.5, 0.52))
    darken(c, 84)
    vignette(c, 188)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 220), fill=rgba(PINE, 232))
    d.text((44, 34), "YOUR SEASON. ORGANIZED.", font=m.font(m.BOLD, 21), fill=GOLD)
    y = headline(c, "ONE DIGITAL FIELD LOG.", 42, 78, 1110, 86)
    subline(c, "YOUR HUNTS STAY TOGETHER LONG AFTER THE DECOYS ARE PACKED.", 46, y + 6, 1070, 22)
    phone(c, SRC / "06-hunt-summary.png", 756, 255, 305, 500, 2, 0, (0.5, 0.12))
    rough_panel(c, (64, 292, 646, 692), BARK, 232)
    d.text((100, 327), "THE DIGITAL RECORD", font=m.font(m.BOLD, 22), fill=GOLD)
    for idx, (title, copy) in enumerate((
        ("DATE + PLACE", "Remember when and where."),
        ("EVERY BIRD", "Species, sex, and count."),
        ("EVERY HUNT", "Saved to My Hunts."),
    ), start=1):
        yy = 383 + (idx - 1) * 94
        d.text((100, yy), f"0{idx}", font=m.font(m.HEAD, 38), fill=GOLD)
        d.text((165, yy + 2), title, font=m.font(m.BOLD, 25), fill=WHITE)
        d.text((165, yy + 36), copy, font=m.font(m.BODY, 19), fill=PARCHMENT)
    campaign_sale(c)
    save(c, "09-one-digital-field-log.jpg", 909)


def p10():
    c = bg("hunters-in-timber.png", (0.5, 0.42))
    darken(c, 115)
    vignette(c, 210)
    d = ImageDraw.Draw(c)
    logo(c, 48, 36, 94)
    d.text((170, 56), "BLINDIQ  •  LAUNCH OFFER", font=m.font(m.BOLD, 21), fill=GOLD)
    d.rectangle((45, 154, 1145, 710), fill=rgba(INK, 224), outline=rgba(GOLD), width=4)
    d.text((595, 202), "LAUNCH SALE", font=m.font(m.BOLD, 30), fill=WHITE, anchor="ma")
    d.text((595, 250), "50% OFF", font=m.font(m.HEAD, 150), fill=GOLD, anchor="ma")
    d.line((210, 423, 980, 423), fill=rgba(GOLD), width=4)
    d.text((595, 450), "USE CODE", font=m.font(m.BOLD, 24), fill=FOG, anchor="ma")
    d.text((595, 487), "50ducks", font=m.font(m.HEAD, 72), fill=WHITE, anchor="ma")
    d.text((595, 578), "ENDS SEPTEMBER 11", font=m.font(m.BOLD, 30), fill=GOLD, anchor="ma")
    d.text((595, 632), "DIGITAL FIELD GUIDE + FIELD LOG  •  BLINDIQ.APP",
           font=m.font(m.BOLD, 20), fill=PARCHMENT, anchor="ma")
    d.rectangle((0, 790, W, H), fill=rgba(GOLD, 248))
    d.text((600, 818), "KNOW THE REGULATIONS. LOG THE BIRDS. SAVE THE HUNTS.",
           font=m.font(m.BOLD, 24), fill=INK, anchor="ma")
    d.text((600, 857), "AVAILABLE ON ANY INTERNET-CONNECTED DEVICE",
           font=m.font(m.BOLD, 18), fill=RUST, anchor="ma")
    save(c, "10-launch-sale-50-percent-off.jpg", 1010)


def contact_sheet():
    files = sorted(OUT.glob("*.jpg"))
    thumb_w, thumb_h = 480, 360
    sheet = Image.new("RGB", (thumb_w * 2, thumb_h * 5), "#161b18")
    for idx, path in enumerate(files):
        im = Image.open(path).convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(im, ((idx % 2) * thumb_w, (idx // 2) * thumb_h))
    sheet.save(PKG / "contact-sheet.jpg", quality=94)


def main():
    for fn in (p01, p02, p03, p04, p05, p06, p07, p08, p09, p10):
        fn()
    contact_sheet()
    print(f"Built 10 posts in {OUT}")


if __name__ == "__main__":
    main()
