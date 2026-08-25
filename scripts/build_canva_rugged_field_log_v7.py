from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFilter, ImageOps

import build_canva_facebook_layout_variations_v4 as m


ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "canva-rugged-field-log-v7"
OUT = PKG / "posts"
BG = PKG / "backgrounds"
SRC = ROOT / "outputs" / "canva-facebook-landscape" / "source-frames"
OUT.mkdir(parents=True, exist_ok=True)

m.W, m.H = 1080, 1350
m.PKG, m.OUT, m.BG, m.SRC = PKG, OUT, BG, SRC
W, H = m.W, m.H

INK = "#07130f"
PINE = "#0b3027"
MOSS = "#284237"
BARK = "#241a13"
RUST = "#8d3b28"
GOLD = "#d8a83d"
PARCHMENT = "#eee5d2"
FOG = "#c9c9bd"
WHITE = "#fffaf0"


def rgba(color, alpha=255):
    return m.rgba(color, alpha)


def cover(name, centering=(0.5, 0.5)):
    return m.cover(BG / name, centering)


def grain(canvas, seed=7, amount=9500, opacity=22):
    random.seed(seed)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(amount):
        x = random.randrange(W)
        y = random.randrange(H)
        v = random.choice((20, 35, 215, 235))
        d.point((x, y), fill=(v, v, v, random.randrange(2, opacity + 1)))
    canvas.alpha_composite(layer)


def vignette(canvas, strength=190):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = layer.load()
    cx, cy = W / 2, H / 2
    maxd = (cx * cx + cy * cy) ** 0.5
    for y in range(H):
        for x in range(W):
            dist = (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / maxd
            a = int(max(0, dist - 0.38) ** 1.45 * strength)
            px[x, y] = (0, 0, 0, min(215, a))
    canvas.alpha_composite(layer)


def rough_panel(canvas, box, fill=INK, alpha=225, outline=GOLD, width=3, scratches=True):
    x1, y1, x2, y2 = box
    d = ImageDraw.Draw(canvas)
    d.rectangle(box, fill=rgba(fill, alpha), outline=rgba(outline, 210), width=width)
    if scratches:
        random.seed(x1 + y1 + x2 + y2)
        for _ in range(38):
            y = random.randint(y1 + 5, y2 - 5)
            x = random.randint(x1 + 2, x2 - 35)
            length = random.randint(8, 70)
            d.line((x, y, min(x2 - 2, x + length), y + random.randint(-2, 2)), fill=rgba(PARCHMENT, random.randint(8, 24)), width=1)


def torn_band(canvas, y, h, fill=INK, alpha=238):
    random.seed(y + h)
    top = [(0, y)]
    bottom = [(W, y + h)]
    for x in range(0, W + 1, 45):
        top.append((x, y + random.randint(-8, 8)))
        bottom.append((W - x, y + h + random.randint(-7, 7)))
    ImageDraw.Draw(canvas).polygon(top + bottom, fill=rgba(fill, alpha))


def logo(canvas, x=44, y=38, width=105):
    m.add_logo(canvas, x, y, width, backing=True)


def headline(canvas, text, x, y, max_width=960, max_size=100, fill=WHITE):
    return m.headline(canvas, text, x, y, max_width, max_size, fill=fill)


def subline(canvas, text, x, y, max_width=940, size=30, fill=GOLD):
    return m.subline(canvas, text, x, y, max_width, size, fill=fill)


def phone(canvas, source, x, y, w, h, angle=0, crop_top=76, centering=(0.5, 0.06)):
    m.paste_phone(canvas, source, x, y, w, h, angle, crop_top, centering)


def browser(canvas, source, box, crop_top=4, address="BLINDIQ.APP  /  MY HUNTS"):
    m.browser_card(canvas, source, box, crop_top=crop_top, address=address)


def footer(canvas, left):
    d = ImageDraw.Draw(canvas)
    d.rectangle((0, H - 70, W, H), fill=rgba(INK, 250))
    d.text((30, H - 48), left.upper(), font=m.font(m.BOLD, 19), fill=PARCHMENT)
    right = "WEBSITE APP  •  BLINDIQ.APP"
    f = m.font(m.BOLD, 19)
    d.text((W - d.textlength(right, font=f) - 30, H - 48), right, font=f, fill=GOLD)


def save(canvas, filename, seed):
    grain(canvas, seed=seed)
    canvas.convert("RGB").save(OUT / filename, quality=96, subsampling=0)


def post_01():
    c = cover("flooded-timber-phone.png", (0.5, 0.48))
    vignette(c, 205)
    torn_band(c, 0, 390, INK, 224)
    d = ImageDraw.Draw(c)
    logo(c, 46, 38, 95)
    d.text((168, 58), "THE DIGITAL FIELD LOG", font=m.font(m.BOLD, 24), fill=GOLD)
    y = headline(c, "EVERY HUNT LEAVES A STORY.", 48, 132, 965, 102)
    subline(c, "MAKE SURE YOURS IS LOGGED.", 52, y + 20, 900, 33)
    rough_panel(c, (62, 933, 1018, 1198), BARK, 232, GOLD, 3)
    d.text((94, 965), "DATE  •  STATE  •  ZONE", font=m.font(m.BOLD, 24), fill=GOLD)
    d.text((94, 1017), "SPECIES  •  SEX  •  COUNT", font=m.font(m.HEAD, 46), fill=WHITE)
    d.line((94, 1083, 935, 1083), fill=rgba(GOLD), width=3)
    d.text((94, 1114), "Save the details that made the day.", font=m.font(m.BODY, 27), fill=PARCHMENT)
    footer(c, "Your hunt. Your record.")
    save(c, "RUGGEDV7-01-every-hunt-leaves-a-story.jpg", 101)


def post_02():
    c = cover("cedar-blind-field-log.png", (0.5, 0.52))
    vignette(c, 205)
    torn_band(c, 0, 350, INK, 225)
    d = ImageDraw.Draw(c)
    d.text((48, 38), "LIVE FROM THE BLIND", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "BIRD DOWN. LOG IT.", 47, 91, 965, 110)
    subline(c, "SPECIES  •  SEX  •  COUNT", 51, y + 15, 900, 30)
    phone(c, SRC / "hunt-2-of-6.png", 595, 474, 375, 744, -2, 72)
    rough_panel(c, (45, 552, 500, 995), INK, 228, GOLD, 3)
    d.text((79, 585), "01", font=m.font(m.HEAD, 63), fill=GOLD)
    d.text((79, 654), "CHOOSE", font=m.font(m.HEAD, 50), fill=WHITE)
    d.text((79, 713), "the bird", font=m.font(m.BODY, 27), fill=PARCHMENT)
    d.line((79, 774, 460, 774), fill=rgba(GOLD), width=3)
    d.text((79, 806), "02", font=m.font(m.HEAD, 63), fill=GOLD)
    d.text((79, 875), "TAP +", font=m.font(m.HEAD, 50), fill=WHITE)
    d.text((79, 934), "and keep hunting", font=m.font(m.BODY, 27), fill=PARCHMENT)
    footer(c, "Fast entries. Real hunt record.")
    save(c, "RUGGEDV7-02-bird-down-log-it.jpg", 202)


def post_03():
    c = cover("end-of-hunt-blind.png", (0.5, 0.5))
    vignette(c, 180)
    torn_band(c, 0, 355, PINE, 225)
    d = ImageDraw.Draw(c)
    d.text((48, 38), "THE COUNT MOVES WITH YOU", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "YOUR BAG. LIVE IN THE BLIND.", 46, 92, 970, 91)
    subline(c, "SEE WHAT REMAINS AFTER EVERY BIRD.", 50, y + 16, 930, 29)
    phone(c, SRC / "hunt-2-of-6.png", 75, 443, 350, 700, -3, 72)
    phone(c, SRC / "hunt-5-of-6.png", 650, 443, 350, 700, 3, 72)
    d.ellipse((477, 680, 603, 806), fill=rgba(GOLD))
    d.text((540, 742), "→", font=m.font(m.BOLD, 64), fill=INK, anchor="mm")
    rough_panel(c, (236, 1145, 844, 1234), BARK, 230, GOLD, 2)
    d.text((540, 1170), "LOG IT. SEE WHAT REMAINS.", font=m.font(m.BOLD, 25), fill=WHITE, anchor="ma")
    footer(c, "Live harvest guidance")
    save(c, "RUGGEDV7-03-your-bag-live.jpg", 303)


def post_04():
    c = cover("hunters-in-timber.png", (0.5, 0.45))
    vignette(c, 210)
    d = ImageDraw.Draw(c)
    rough_panel(c, (38, 34, 1042, 464), INK, 220, GOLD, 3)
    d.text((73, 70), "A COMPLETE FIELD-LOG WORKFLOW", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "FROM FIRST LIGHT TO FINAL COUNT.", 69, 122, 930, 88)
    subline(c, "START  →  LOG  →  REVIEW  →  SAVE", 73, y + 18, 900, 28)
    steps = [("01", "START"), ("02", "LOG"), ("03", "REVIEW"), ("04", "SAVE")]
    for i, (num, word) in enumerate(steps):
        x = 55 + i * 253
        rough_panel(c, (x, 960, x + 220, 1152), BARK, 226, GOLD, 2, False)
        d.text((x + 24, 983), num, font=m.font(m.HEAD, 45), fill=GOLD)
        d.text((x + 24, 1044), word, font=m.font(m.HEAD, 43), fill=WHITE)
    footer(c, "One website app. Every hunt.")
    save(c, "RUGGEDV7-04-first-light-final-count.jpg", 404)


def post_05():
    c = cover("end-of-hunt-blind.png", (0.5, 0.46))
    vignette(c, 220)
    torn_band(c, 0, 392, INK, 226)
    d = ImageDraw.Draw(c)
    d.text((47, 38), "WHEN THE HUNT ENDS", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "THE RECORD STAYS.", 46, 96, 960, 118)
    subline(c, "FINISH THE HUNT. SAVE THE STORY.", 50, y + 17, 930, 29)
    phone(c, SRC / "hunt-summary.png", 548, 420, 410, 810, 2, 72)
    rough_panel(c, (48, 504, 500, 1050), BARK, 230, GOLD, 3)
    d.text((82, 541), "SAVED", font=m.font(m.HEAD, 54), fill=WHITE)
    fields = [("DATE", "When it happened"), ("STATE + ZONE", "Where you hunted"), ("HARVEST", "Every bird logged")]
    for i, (label, body) in enumerate(fields):
        yy = 633 + i * 130
        d.text((82, yy), label, font=m.font(m.BOLD, 24), fill=GOLD)
        d.text((82, yy + 40), body, font=m.font(m.BODY, 25), fill=PARCHMENT)
        d.line((82, yy + 84, 457, yy + 84), fill=rgba(FOG, 90), width=2)
    footer(c, "Finish it. Save it. Remember it.")
    save(c, "RUGGEDV7-05-the-record-stays.jpg", 505)


def post_06():
    c = cover("cedar-blind-field-log.png", (0.5, 0.45))
    vignette(c, 215)
    torn_band(c, 0, 385, PINE, 230)
    d = ImageDraw.Draw(c)
    d.text((47, 39), "MY HUNTS", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "EVERY HUNT. ONE FIELD LOG.", 46, 92, 970, 98)
    subline(c, "YOUR SEASON, ORGANIZED.", 50, y + 17, 900, 30)
    browser(c, SRC / "my-hunts.jpg", (78, 438, 1002, 1122), 4)
    rough_panel(c, (193, 1156, 887, 1235), INK, 235, GOLD, 2, False)
    d.text((540, 1178), "OPEN YOUR HISTORY ANYTIME", font=m.font(m.BOLD, 25), fill=WHITE, anchor="ma")
    footer(c, "Every hunt in one place")
    save(c, "RUGGEDV7-06-every-hunt-one-log.jpg", 606)


def post_07():
    c = cover("hunters-in-timber.png", (0.5, 0.48))
    vignette(c, 220)
    rough_panel(c, (35, 35, 1045, 405), INK, 216, GOLD, 3)
    d = ImageDraw.Draw(c)
    d.text((68, 69), "SEASON AFTER SEASON", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "BUILD A SEASON WORTH REMEMBERING.", 66, 120, 940, 86)
    phone(c, SRC / "my-hunts.jpg", 640, 455, 320, 694, 3, 4)
    stats = [("12", "HUNTS"), ("41", "BIRDS"), ("3", "STATES")]
    for i, (num, label) in enumerate(stats):
        yy = 498 + i * 191
        rough_panel(c, (55, yy, 523, yy + 148), BARK, 224, GOLD, 2)
        d.text((86, yy + 18), num, font=m.font(m.HEAD, 76), fill=WHITE)
        d.text((275, yy + 52), label, font=m.font(m.BOLD, 26), fill=GOLD)
    d.text((55, 1110), "EXAMPLE TOTALS", font=m.font(m.BOLD, 18), fill=FOG)
    footer(c, "Make every hunt part of the record")
    save(c, "RUGGEDV7-07-season-worth-remembering.jpg", 707)


def post_08():
    c = cover("cedar-blind-field-log.png", (0.5, 0.56))
    vignette(c, 215)
    torn_band(c, 0, 420, INK, 224)
    d = ImageDraw.Draw(c)
    d.text((46, 40), "THE OLD WAY HAD ITS DAY", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "DITCH THE PAPER LOG.", 45, 100, 970, 108)
    subline(c, "YOUR DIGITAL FIELD LOG GOES WHERE YOU GO.", 49, y + 19, 940, 29)
    rough_panel(c, (58, 890, 1022, 1178), BARK, 230, GOLD, 3)
    cols = [("PHONE", "In the blind"), ("TABLET", "Back at camp"), ("COMPUTER", "Review later")]
    for i, (name, body) in enumerate(cols):
        x = 91 + i * 313
        if i:
            d.line((x - 33, 938, x - 33, 1128), fill=rgba(GOLD, 125), width=2)
        d.text((x, 933), name, font=m.font(m.HEAD, 43), fill=WHITE)
        d.text((x, 1001), body, font=m.font(m.BODY, 23), fill=PARCHMENT)
        d.text((x, 1061), "✓", font=m.font(m.BOLD, 39), fill=GOLD)
    footer(c, "On any internet-connected device")
    save(c, "RUGGEDV7-08-ditch-the-paper-log.jpg", 808)


def post_09():
    c = cover("flooded-timber-phone.png", (0.5, 0.48))
    vignette(c, 210)
    torn_band(c, 0, 390, PINE, 228)
    d = ImageDraw.Draw(c)
    d.text((47, 38), "TEST HUNT", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "RUN THE LOGGER BEFORE OPENING DAY.", 46, 92, 970, 91)
    subline(c, "THE SAME WORKFLOW. ZERO LIVE-TOTAL IMPACT.", 50, y + 18, 940, 27)
    phone(c, SRC / "test-hunt.png", 594, 480, 340, 700, 2, 76)
    rough_panel(c, (48, 560, 520, 1060), BARK, 230, GOLD, 3)
    d.text((81, 598), "LEARN THE FLOW", font=m.font(m.HEAD, 50), fill=WHITE)
    steps = ["START A TEST HUNT", "LOG A FEW BIRDS", "REVIEW THE COUNT", "SAVE AS TEST"]
    for i, label in enumerate(steps):
        yy = 698 + i * 86
        d.ellipse((82, yy, 132, yy + 50), fill=rgba(GOLD))
        d.text((107, yy + 25), str(i + 1), font=m.font(m.BOLD, 20), fill=INK, anchor="mm")
        d.text((154, yy + 10), label, font=m.font(m.BOLD, 21), fill=PARCHMENT)
    footer(c, "Practice before first light")
    save(c, "RUGGEDV7-09-run-the-logger.jpg", 909)


def post_10():
    c = cover("end-of-hunt-blind.png", (0.5, 0.50))
    vignette(c, 220)
    torn_band(c, 0, 377, INK, 230)
    d = ImageDraw.Draw(c)
    d.text((46, 38), "YOUR HUNT HISTORY", font=m.font(m.BOLD, 23), fill=GOLD)
    y = headline(c, "EVERY MILE. EVERY BIRD. EVERY HUNT.", 45, 91, 970, 88)
    subline(c, "LOOK BACK. PLAN FORWARD.", 49, y + 16, 900, 29)
    rough_panel(c, (42, 419, 527, 1088), BARK, 225, GOLD, 3, False)
    app1 = m.screen_crop(SRC / "hunt-summary.png", (441, 621), 72, (0.5, 0.12))
    c.paste(app1, (64, 442))
    rough_panel(c, (553, 419, 1038, 1088), BARK, 225, GOLD, 3, False)
    app2 = m.screen_crop(SRC / "my-hunts.jpg", (441, 621), 4, (0.5, 0.05))
    c.paste(app2, (575, 442))
    d.text((285, 1115), "SAVE TODAY", font=m.font(m.HEAD, 38), fill=WHITE, anchor="ma")
    d.text((796, 1115), "REVIEW ALL SEASON", font=m.font(m.HEAD, 38), fill=WHITE, anchor="ma")
    rough_panel(c, (243, 1192, 837, 1253), PINE, 240, GOLD, 2, False)
    d.text((540, 1207), "OPEN BLINDIQ.APP", font=m.font(m.BOLD, 24), fill=GOLD, anchor="ma")
    footer(c, "The hunt ends. The record stays.")
    save(c, "RUGGEDV7-10-every-mile-every-bird.jpg", 1010)


def contact_sheet():
    paths = sorted(OUT.glob("RUGGEDV7-*.jpg"))
    tw, th = 324, 405
    sheet = Image.new("RGB", (tw * 2 + 42, (th + 42) * 5 + 22), "#181712")
    d = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        x = 14 + (i % 2) * (tw + 14)
        y = 12 + (i // 2) * (th + 42)
        d.text((x, y), path.name, font=m.font(m.BODY, 12), fill="#e8dfcc")
        sheet.paste(Image.open(path).resize((tw, th), Image.Resampling.LANCZOS), (x, y + 22))
    sheet.save(PKG / "contact-sheet.jpg", quality=94)


if __name__ == "__main__":
    for fn in (post_01, post_02, post_03, post_04, post_05, post_06, post_07, post_08, post_09, post_10):
        fn()
    contact_sheet()
    print(f"Created 10 rugged BlindIQ field-log posts in {OUT}")
