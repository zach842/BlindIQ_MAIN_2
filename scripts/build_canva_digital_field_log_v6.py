from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import build_canva_facebook_layout_variations_v4 as m


ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "canva-digital-field-log-v6"
OUT = PKG / "posts"
BG = PKG / "backgrounds"
SRC = ROOT / "outputs" / "canva-facebook-landscape" / "source-frames"
OUT.mkdir(parents=True, exist_ok=True)

m.W, m.H = 1080, 1350
m.PKG, m.OUT, m.BG, m.SRC = PKG, OUT, BG, SRC
W, H = m.W, m.H


def save(canvas, name):
    canvas.convert("RGB").save(OUT / name, quality=96, subsampling=0)


def footer(canvas, left):
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, H - 72, W, H), fill=m.rgba(m.DARK, 248))
    draw.text((30, H - 50), left.upper(), font=m.font(m.BOLD, 20), fill=m.CREAM)
    right = "WEBSITE APP  •  BLINDIQ.APP"
    f = m.font(m.BOLD, 20)
    draw.text((W - draw.textlength(right, font=f) - 30, H - 50), right, font=f, fill=m.GOLD)


def logo(canvas, x=42, y=35, width=138, backing=True):
    m.add_logo(canvas, x, y, width, backing)


def phone(canvas, source, x, y, w=350, h=700, angle=0, crop_top=76, centering=(0.5, 0.06)):
    m.paste_phone(canvas, source, x, y, w, h, angle, crop_top, centering)


def darken(image, alpha=100):
    return Image.alpha_composite(image, Image.new("RGBA", (W, H), m.rgba(m.DARK, alpha)))


def card(canvas, box, fill=m.CREAM, outline=m.GOLD, radius=26, width=3):
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius, fill=m.rgba(fill), outline=m.rgba(outline), width=width)


def browser_frame(canvas, source, box, crop_top=76):
    m.browser_card(canvas, source, box, crop_top=crop_top, address="BLINDIQ.APP  /  MY HUNTS")


def post_01():
    c = darken(m.cover(BG / "field-log-in-hand.png", centering=(0.5, 0.5)), 55)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 470), fill=m.rgba(m.DARK, 224))
    logo(c, 44, 34, 105, True)
    d.text((185, 53), "DIGITAL FIELD LOG", font=m.font(m.BOLD, 25), fill=m.GOLD)
    y = m.headline(c, "YOUR DUCK HUNT. LOGGED.", 45, 145, 970, 101)
    m.subline(c, "BLINDIQ SAVES THE DETAILS THAT MADE THE DAY.", 49, y + 22, 930, 31)
    app = m.screen_crop(SRC / "my-hunts.jpg", (250, 520), 4, (0.5, 0.04))
    mask = Image.new("L", app.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, app.width - 1, app.height - 1), 28, fill=255)
    c.paste(app, (310, 508), mask)
    d.rounded_rectangle((306, 501, 565, 1035), 34, outline=m.rgba("#111715"), width=8)
    d.rounded_rectangle((48, 1086, 1032, 1220), 24, fill=m.rgba(m.CREAM, 246), outline=m.rgba(m.GOLD), width=3)
    d.text((83, 1111), "DATE  •  STATE  •  ZONE  •  EVERY BIRD", font=m.font(m.HEAD, 40), fill=m.GREEN)
    d.text((83, 1167), "A field log on any internet-connected device.", font=m.font(m.BODY, 25), fill=m.SLATE)
    footer(c, "Save the day—not just the total")
    save(c, "FIELDLOGV6-01-your-duck-hunt-logged.jpg")


def post_02():
    c = Image.new("RGBA", (W, H), m.rgba("#0c2f27"))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 310), fill=m.rgba(m.DARK))
    d.text((48, 39), "LIVE IN THE BLIND", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "LOG EVERY BIRD AS IT HAPPENS.", 45, 92, 970, 93)
    m.subline(c, "SPECIES  •  SEX  •  COUNT", 50, y + 18, 900, 29)
    phone(c, SRC / "hunt-2-of-6.png", 346, 352, 390, 795, -1, 70)
    d.rounded_rectangle((55, 470, 315, 744), 24, fill=m.rgba(m.CREAM), outline=m.rgba(m.GOLD), width=3)
    d.text((88, 500), "01", font=m.font(m.HEAD, 54), fill=m.GOLD)
    d.text((88, 568), "CHOOSE", font=m.font(m.HEAD, 45), fill=m.GREEN)
    d.text((88, 624), "the bird", font=m.font(m.BODY, 25), fill=m.SLATE)
    d.rounded_rectangle((765, 720, 1026, 997), 24, fill=m.rgba(m.GOLD), outline=m.rgba(m.CREAM), width=3)
    d.text((798, 752), "02", font=m.font(m.HEAD, 54), fill=m.DARK)
    d.text((798, 820), "TAP", font=m.font(m.HEAD, 51), fill=m.DARK)
    d.text((798, 884), "+ to log it", font=m.font(m.BOLD, 25), fill=m.DARK)
    logo(c, 827, 1060, 145, True)
    footer(c, "Built for wet gloves and quick entries")
    save(c, "FIELDLOGV6-02-log-every-bird.jpg")


def post_03():
    c = Image.new("RGBA", (W, H), m.rgba(m.CREAM))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 356), fill=m.rgba(m.GREEN))
    d.text((47, 40), "THE COUNT CHANGES WITH YOU", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "WATCH YOUR BAG UPDATE.", 45, 96, 965, 104)
    m.subline(c, "SEE WHAT REMAINS AFTER EVERY BIRD.", 48, y + 16, 920, 30)
    d.text((117, 415), "EARLIER", font=m.font(m.BOLD, 23), fill=m.RUST)
    d.text((720, 415), "LATER", font=m.font(m.BOLD, 23), fill=m.RUST)
    phone(c, SRC / "hunt-2-of-6.png", 72, 460, 360, 720, -3, 74)
    phone(c, SRC / "hunt-5-of-6.png", 651, 460, 360, 720, 3, 74)
    d.ellipse((486, 684, 594, 792), fill=m.rgba(m.GOLD))
    d.text((540, 738), "→", font=m.font(m.BOLD, 55), fill=m.DARK, anchor="mm")
    d.rounded_rectangle((307, 1131, 773, 1218), 20, fill=m.rgba(m.DARK))
    d.text((540, 1154), "BLINDIQ KEEPS THE COUNT", font=m.font(m.BOLD, 25), fill=m.CREAM, anchor="ma")
    footer(c, "Log it. See what remains.")
    save(c, "FIELDLOGV6-03-watch-your-bag-update.jpg")


def post_04():
    bg = m.cover(BG / "field-log-finish.png", centering=(0.5, 0.5)).filter(ImageFilter.GaussianBlur(2))
    c = darken(bg, 125)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((42, 38, 1038, 1240), 34, fill=m.rgba(m.DARK, 223), outline=m.rgba(m.GOLD, 180), width=3)
    d.text((79, 75), "A COMPLETE FIELD-LOG WORKFLOW", font=m.font(m.BOLD, 23), fill=m.GOLD)
    y = m.headline(c, "FROM FIRST BIRD TO FINAL COUNT.", 75, 126, 920, 89)
    steps = [
        ("01", "START", "Choose state and hunting zone"),
        ("02", "LOG", "Add each species and sex"),
        ("03", "REVIEW", "Check the completed bag"),
        ("04", "SAVE", "Build your hunt history"),
    ]
    for i, (num, title, body) in enumerate(steps):
        yy = 458 + i * 177
        d.ellipse((82, yy, 158, yy + 76), fill=m.rgba(m.GOLD))
        d.text((120, yy + 38), num, font=m.font(m.BOLD, 26), fill=m.DARK, anchor="mm")
        d.text((198, yy - 4), title, font=m.font(m.HEAD, 52), fill=m.CREAM)
        d.text((201, yy + 59), body, font=m.font(m.BODY, 25), fill=m.TAN)
        if i < 3:
            d.line((120, yy + 87, 120, yy + 163), fill=m.rgba(m.GOLD), width=4)
    d.rounded_rectangle((189, 1136, 891, 1210), 18, fill=m.rgba(m.CREAM))
    d.text((540, 1157), "ONE WEBSITE APP. EVERY HUNT.", font=m.font(m.BOLD, 26), fill=m.GREEN, anchor="ma")
    footer(c, "Start → Log → Review → Save")
    save(c, "FIELDLOGV6-04-first-bird-to-final-count.jpg")


def post_05():
    c = Image.new("RGBA", (W, H), m.rgba(m.CREAM))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 336), fill=m.rgba(m.DARK))
    d.text((47, 38), "WHEN THE HUNT ENDS", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "FINISH THE HUNT. SAVE THE STORY.", 45, 92, 970, 91)
    phone(c, SRC / "hunt-summary.png", 556, 360, 410, 820, 3, 70)
    d.text((61, 438), "YOUR SAVED LOG", font=m.font(m.HEAD, 51), fill=m.GREEN)
    fields = [("DATE", "When it happened"), ("STATE + ZONE", "Where you hunted"), ("HARVEST", "Every bird logged")]
    for i, (title, body) in enumerate(fields):
        yy = 542 + i * 155
        d.line((63, yy - 23, 490, yy - 23), fill=m.rgba(m.TAN), width=3)
        d.text((63, yy), title, font=m.font(m.BOLD, 26), fill=m.RUST)
        d.text((63, yy + 45), body, font=m.font(m.BODY, 25), fill=m.SLATE)
    d.rounded_rectangle((63, 1040, 493, 1128), 20, fill=m.rgba(m.GOLD))
    d.text((278, 1064), "SAVE TO MY HUNTS", font=m.font(m.BOLD, 25), fill=m.DARK, anchor="ma")
    footer(c, "Finish it. Save it. Remember it.")
    save(c, "FIELDLOGV6-05-finish-and-save.jpg")


def post_06():
    c = darken(m.cover(BG / "field-log-finish.png", centering=(0.5, 0.42)), 65)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 395), fill=m.rgba(m.DARK, 230))
    d.text((46, 41), "MY HUNTS", font=m.font(m.BOLD, 25), fill=m.GOLD)
    y = m.headline(c, "EVERY HUNT IN ONE PLACE.", 43, 102, 965, 102)
    m.subline(c, "YOUR DIGITAL FIELD LOG TRAVELS WITH YOU.", 47, y + 18, 930, 29)
    browser_frame(c, SRC / "my-hunts.jpg", (97, 449, 983, 1124), crop_top=4)
    d.rounded_rectangle((223, 1158, 857, 1225), 17, fill=m.rgba(m.GOLD))
    d.text((540, 1177), "OPEN YOUR HISTORY ANYTIME", font=m.font(m.BOLD, 25), fill=m.DARK, anchor="ma")
    footer(c, "Your season, organized")
    save(c, "FIELDLOGV6-06-every-hunt-in-one-place.jpg")


def post_07():
    c = Image.new("RGBA", (W, H), m.rgba("#0a2e26"))
    d = ImageDraw.Draw(c)
    d.text((47, 41), "SEASON AFTER SEASON", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "BUILD YOUR SEASON.", 45, 98, 970, 112)
    m.subline(c, "ONE SAVED HUNT AT A TIME.", 50, y + 10, 900, 33)
    phone(c, SRC / "my-hunts.jpg", 628, 372, 315, 690, 4, 4)
    stats = [("12", "HUNTS"), ("41", "BIRDS"), ("3", "STATES")]
    for i, (num, label) in enumerate(stats):
        yy = 458 + i * 198
        d.rounded_rectangle((60, yy, 524, yy + 156), 24, fill=m.rgba("#17483c"), outline=m.rgba(m.GOLD), width=3)
        d.text((101, yy + 25), num, font=m.font(m.HEAD, 79), fill=m.CREAM)
        d.text((286, yy + 57), label, font=m.font(m.BOLD, 26), fill=m.GOLD)
    d.rounded_rectangle((60, 1090, 962, 1202), 23, fill=m.rgba(m.CREAM))
    d.text((511, 1114), "LOOK BACK AT THE HUNTS", font=m.font(m.HEAD, 39), fill=m.GREEN, anchor="ma")
    d.text((511, 1160), "THAT BUILT YOUR SEASON.", font=m.font(m.BOLD, 25), fill=m.RUST, anchor="ma")
    footer(c, "The numbers shown are an example")
    save(c, "FIELDLOGV6-07-build-your-season.jpg")


def post_08():
    c = darken(m.cover(BG / "field-log-in-hand.png", centering=(0.5, 0.5)), 70)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 420), fill=m.rgba(m.DARK, 230))
    d.text((46, 40), "LEAVE THE PAPER LOG AT HOME", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "NO PAPER. NO GUESSING.", 44, 103, 970, 104)
    m.subline(c, "A FIELD LOG ON ANY INTERNET-CONNECTED DEVICE.", 48, y + 18, 940, 29)
    d.rounded_rectangle((53, 896, 1027, 1165), 28, fill=m.rgba(m.CREAM, 245), outline=m.rgba(m.GOLD), width=4)
    cols = [("PHONE", "In the blind"), ("TABLET", "Back at camp"), ("COMPUTER", "Review later")]
    for i, (name, desc) in enumerate(cols):
        xx = 82 + i * 315
        if i:
            d.line((xx - 31, 945, xx - 31, 1118), fill=m.rgba(m.TAN), width=3)
        d.text((xx, 941), name, font=m.font(m.HEAD, 44), fill=m.GREEN)
        d.text((xx, 1010), desc, font=m.font(m.BODY, 23), fill=m.SLATE)
        d.text((xx, 1064), "✓", font=m.font(m.BOLD, 38), fill=m.GOLD)
    footer(c, "Open BlindIQ.app in your browser")
    save(c, "FIELDLOGV6-08-no-paper-no-guessing.jpg")


def post_09():
    c = Image.new("RGBA", (W, H), m.rgba(m.CREAM))
    d = ImageDraw.Draw(c)
    d.polygon([(0, 0), (W, 0), (W, 415), (0, 520)], fill=m.rgba(m.GREEN))
    d.text((47, 38), "TEST HUNT", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "PRACTICE THE LOGGER BEFORE OPENING DAY.", 44, 94, 960, 83)
    m.subline(c, "THE SAME WORKFLOW. ZERO LIVE-TOTAL IMPACT.", 48, y + 20, 930, 28)
    phone(c, SRC / "test-hunt.png", 594, 474, 340, 695, 2, 76)
    d.text((59, 588), "LEARN THE FLOW", font=m.font(m.HEAD, 49), fill=m.GREEN)
    steps = ["START A TEST HUNT", "LOG A FEW BIRDS", "REVIEW THE COUNT", "SAVE AS TEST"]
    for i, text in enumerate(steps):
        yy = 688 + i * 114
        d.ellipse((61, yy, 113, yy + 52), fill=m.rgba(m.GOLD))
        d.text((87, yy + 26), str(i + 1), font=m.font(m.BOLD, 21), fill=m.DARK, anchor="mm")
        d.text((140, yy + 8), text, font=m.font(m.BOLD, 23), fill=m.SLATE)
        if i < 3:
            d.line((87, yy + 58, 87, yy + 102), fill=m.rgba(m.GOLD), width=4)
    footer(c, "Test hunts stay separate from live totals")
    save(c, "FIELDLOGV6-09-practice-the-logger.jpg")


def post_10():
    bg = m.cover(BG / "field-log-finish.png", centering=(0.5, 0.5)).filter(ImageFilter.GaussianBlur(3))
    c = darken(bg, 145)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 360), fill=m.rgba(m.DARK, 220))
    d.text((45, 40), "YOUR HUNT HISTORY", font=m.font(m.BOLD, 24), fill=m.GOLD)
    y = m.headline(c, "LOOK BACK. PLAN FORWARD.", 43, 98, 970, 104)
    m.subline(c, "REVIEW SAVED HUNTS ANYTIME.", 48, y + 18, 900, 30)
    d.rounded_rectangle((47, 415, 521, 1090), 28, fill=m.rgba(m.CREAM), outline=m.rgba(m.GOLD), width=4)
    app1 = m.screen_crop(SRC / "hunt-summary.png", (434, 635), 72, (0.5, 0.12))
    c.paste(app1, (67, 435))
    d.rounded_rectangle((559, 415, 1033, 1090), 28, fill=m.rgba(m.CREAM), outline=m.rgba(m.GOLD), width=4)
    app2 = m.screen_crop(SRC / "my-hunts.jpg", (434, 635), 4, (0.5, 0.05))
    c.paste(app2, (579, 435))
    d.text((282, 1115), "SAVE TODAY", font=m.font(m.HEAD, 39), fill=m.CREAM, anchor="ma")
    d.text((798, 1115), "REVIEW ALL SEASON", font=m.font(m.HEAD, 39), fill=m.CREAM, anchor="ma")
    d.rounded_rectangle((219, 1190, 861, 1250), 16, fill=m.rgba(m.GOLD))
    d.text((540, 1205), "OPEN BLINDIQ.APP", font=m.font(m.BOLD, 25), fill=m.DARK, anchor="ma")
    footer(c, "Make every hunt part of the record")
    save(c, "FIELDLOGV6-10-look-back-plan-forward.jpg")


def contact_sheet():
    paths = sorted(OUT.glob("FIELDLOGV6-*.jpg"))
    tw, th = 324, 405
    sheet = Image.new("RGB", (tw * 2 + 42, (th + 42) * 5 + 22), "#e9e6dd")
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        x = 14 + (i % 2) * (tw + 14)
        y = 12 + (i // 2) * (th + 42)
        draw.text((x, y), path.name, font=m.font(m.BODY, 12), fill="#202020")
        sheet.paste(Image.open(path).resize((tw, th), Image.Resampling.LANCZOS), (x, y + 22))
    sheet.save(PKG / "contact-sheet.jpg", quality=94)


if __name__ == "__main__":
    for fn in (post_01, post_02, post_03, post_04, post_05, post_06, post_07, post_08, post_09, post_10):
        fn()
    contact_sheet()
    print(f"Created 10 BlindIQ digital field-log posts in {OUT}")
