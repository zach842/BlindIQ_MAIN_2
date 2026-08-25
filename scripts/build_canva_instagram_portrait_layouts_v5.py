from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import build_canva_facebook_layout_variations_v4 as m

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "canva-instagram-portrait-layouts-v5"
OUT = PKG / "posts"
BG = ROOT / "outputs" / "canva-facebook-layout-variations-v4" / "backgrounds"
SRC = ROOT / "outputs" / "canva-facebook-landscape" / "source-frames"
OUT.mkdir(parents=True, exist_ok=True)

m.W, m.H = 1080, 1350
m.PKG, m.OUT, m.BG, m.SRC = PKG, OUT, BG, SRC
W, H = m.W, m.H


def save(c, name):
    c.convert("RGB").save(OUT / name, quality=96, subsampling=0)


def footer(c, left):
    d = ImageDraw.Draw(c)
    d.rectangle((0, H - 70, W, H), fill=m.rgba(m.DARK, 248))
    d.text((30, H - 49), left.upper(), font=m.font(m.BOLD, 20), fill=m.CREAM)
    right = "WEBSITE APP • BLINDIQ.APP"
    f = m.font(m.BOLD, 20)
    d.text((W - d.textlength(right, font=f) - 30, H - 49), right, font=f, fill=m.GOLD)


def logo(c, x, y, width=150, backing=False):
    m.add_logo(c, x, y, width, backing)


def full_phone(c, path, x, y, w=410, h=770, angle=0, crop_top=76):
    m.paste_phone(c, path, x, y, w, h, angle, crop_top)


def p1():
    c = m.cover(BG / "hunter-phone.png", centering=(0.26, 0.5))
    c = Image.alpha_composite(c, Image.new("RGBA", (W, H), m.rgba(m.DARK, 70)))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 670, W, H), fill=m.rgba(m.DARK, 238))
    logo(c, 45, 42, 150, True)
    d.text((46, 745), "OPEN IT. USE IT. HUNT.", font=m.font(m.BOLD, 27), fill=m.GOLD)
    y = m.headline(c, "THE WEBSITE APP BUILT FOR DUCK HUNTERS.", 44, 800, 960, 98)
    d.rectangle((47, y + 18, 175, y + 24), fill=m.GOLD)
    m.subline(c, "OPEN BLINDIQ.APP IN ANY BROWSER.", 47, y + 50, 930, 34)
    d.rounded_rectangle((47, 1165, 633, 1233), 18, fill=m.rgba(m.CREAM))
    d.text((83, 1184), "NO APP-STORE DOWNLOAD", font=m.font(m.BOLD, 26), fill=m.GREEN)
    footer(c, "Website app for waterfowl hunters")
    save(c, "01-website-app-for-duck-hunters.jpg")


def p2():
    c = Image.new("RGBA", (W, H), m.rgba(m.DARK))
    d = ImageDraw.Draw(c)
    bg = m.cover(BG / "workbench-phone.png", centering=(0.62, 0.5))
    c.alpha_composite(bg.crop((0, 0, W, 560)), (0, 0))
    d.rectangle((0, 0, W, 560), fill=m.rgba(m.DARK, 85))
    d.polygon([(0, 0), (790, 0), (595, 560), (0, 560)], fill=m.rgba(m.DARK, 205))
    d.text((48, 49), "02", font=m.font(m.HEAD, 42), fill=m.GOLD)
    y = m.headline(c, "LOG A BIRD. KNOW WHAT'S NEXT.", 47, 108, 680, 92)
    m.subline(c, "LIVE HARVEST GUIDANCE IN THE WEBSITE APP.", 50, y + 24, 650, 29)
    full_phone(c, SRC / "hunt-5-of-6.png", 550, 472, 380, 780, -3)
    d.text((47, 659), "THE FLOW", font=m.font(m.BOLD, 23), fill=m.GOLD)
    for i, label in enumerate(("START", "LOG", "UPDATE", "SAVE")):
        yy = 716 + i * 113
        d.ellipse((48, yy, 100, yy + 52), fill=m.rgba(m.GOLD))
        d.text((74, yy + 26), str(i + 1), font=m.font(m.BOLD, 22), fill=m.DARK, anchor="mm")
        d.text((126, yy + 7), label, font=m.font(m.HEAD, 40), fill=m.CREAM)
        if i < 3:
            d.line((74, yy + 58, 74, yy + 104), fill=m.rgba(m.GOLD), width=4)
    footer(c, "Tag the buddy who loses count")
    save(c, "02-log-a-bird-know-whats-next.jpg")


def p3():
    c = m.cover(BG / "blind-window.png", centering=(0.63, 0.5))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 250), fill=m.rgba(m.DARK, 232))
    d.text((43, 38), "BEFORE THE HUNT", font=m.font(m.BOLD, 24), fill=m.GOLD)
    m.headline(c, "CHECK WHAT'S OPEN.", 42, 84, 880, 94)
    d.rounded_rectangle((54, 278, 1026, 922), 32, fill=m.rgba(m.CREAM, 248), outline=m.rgba(m.GOLD), width=4)
    d.rounded_rectangle((54, 278, 1026, 344), 31, fill=m.rgba(m.DARK))
    d.rectangle((54, 311, 1026, 344), fill=m.rgba(m.DARK))
    for i, color in enumerate(("#d86555", "#e7b94b", "#7fb26e")):
        d.ellipse((78 + i * 30, 301, 92 + i * 30, 315), fill=m.rgba(color))
    d.rounded_rectangle((206, 295, 990, 327), 16, fill=m.rgba("#173c33"))
    d.text((232, 301), "BLINDIQ.APP", font=m.font(m.BOLD, 19), fill=m.CREAM)
    app = m.screen_crop(SRC / "dashboard-partially-open.png", (932, 556), 76)
    c.paste(app, (74, 352))
    d.rounded_rectangle((80, 973, 1000, 1182), 25, fill=m.rgba(m.DARK, 228), outline=m.rgba(m.GOLD, 170), width=3)
    d.text((117, 1008), "STATE • ZONE • SEASON", font=m.font(m.HEAD, 48), fill=m.CREAM)
    d.text((117, 1075), "Current hunting dates in one website app.", font=m.font(m.BODY, 27), fill=m.TAN)
    d.text((117, 1123), "CHECK ONLINE BEFORE YOU GO.", font=m.font(m.BOLD, 25), fill=m.GOLD)
    footer(c, "Know what's open")
    save(c, "03-check-whats-open-online.jpg")


def p4():
    c = Image.new("RGBA", (W, H), m.rgba("#0d3028"))
    d = ImageDraw.Draw(c)
    logo(c, 46, 39, 128)
    m.headline(c, "STOP DOING BAG-LIMIT MATH.", 210, 57, 790, 71)
    cards = [("1", "LOG", "Add every bird"), ("2", "COUNT", "See today's totals"), ("3", "KNOW", "What remains legal")]
    for i, (n, title, body) in enumerate(cards):
        y = 285 + i * 292
        d.rounded_rectangle((52, y, 1028, y + 246), 28, fill=m.rgba("#17483c"), outline=m.rgba(m.GOLD), width=3)
        d.ellipse((82, y + 45, 160, y + 123), fill=m.rgba(m.GOLD))
        d.text((121, y + 84), n, font=m.font(m.BOLD, 31), fill=m.DARK, anchor="mm")
        d.text((199, y + 35), title, font=m.font(m.HEAD, 67), fill=m.CREAM)
        d.text((202, y + 122), body, font=m.font(m.BODY, 29), fill=m.TAN)
        d.text((790, y + 84), "WEBSITE\nAPP", font=m.font(m.BOLD, 30), fill=m.GOLD, spacing=4)
    d.rounded_rectangle((170, 1177, 910, 1242), 17, fill=m.rgba(m.CREAM))
    d.text((540, 1194), "BLINDIQ KEEPS THE COUNT", font=m.font(m.BOLD, 27), fill=m.GREEN, anchor="ma")
    footer(c, "Log it. See what remains.")
    save(c, "04-stop-bag-limit-math.jpg")


def p5():
    c = m.cover(BG / "hunter-phone.png", centering=(0.25, 0.5))
    c = Image.alpha_composite(c, Image.new("RGBA", (W, H), m.rgba(m.DARK, 90)))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 185), fill=m.rgba(m.DARK, 225))
    logo(c, 43, 25, 130)
    d.text((214, 47), "THE BLINDIQ WEBSITE APP", font=m.font(m.HEAD, 53), fill=m.CREAM)
    d.ellipse((110, 258, 970, 1118), fill=m.rgba(m.CREAM, 248), outline=m.rgba(m.GOLD), width=12)
    d.text((540, 400), "ONLY", font=m.font(m.BOLD, 36), fill=m.GREEN, anchor="mm")
    d.text((540, 630), "$10.99", font=m.font(m.HEAD, 174), fill=m.GREEN, anchor="mm")
    d.text((540, 790), "/ YEAR", font=m.font(m.HEAD, 70), fill=m.GOLD, anchor="mm")
    d.rectangle((322, 855, 758, 861), fill=m.rgba(m.GOLD))
    d.text((540, 924), "LOG HUNTS. KNOW THE REGS.", font=m.font(m.BOLD, 31), fill=m.GREEN, anchor="mm")
    d.rounded_rectangle((210, 1030, 870, 1110), 18, fill=m.rgba(m.DARK))
    d.text((540, 1052), "NO APP-STORE DOWNLOAD", font=m.font(m.BOLD, 27), fill=m.CREAM, anchor="ma")
    footer(c, "Open BlindIQ.app")
    save(c, "05-only-10-99-year.jpg")


def p6():
    bg = m.cover(BG / "workbench-phone.png", centering=(0.60, 0.5)).filter(ImageFilter.GaussianBlur(3))
    c = Image.alpha_composite(bg, Image.new("RGBA", (W, H), m.rgba(m.DARK, 125)))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((50, 50, 1030, 1245), 34, fill=m.rgba(m.CREAM, 247))
    d.text((92, 92), "ONE WEBSITE APP.", font=m.font(m.HEAD, 70), fill=m.GREEN)
    d.text((92, 174), "ONE SIMPLE WORKFLOW.", font=m.font(m.HEAD, 60), fill=m.GOLD)
    steps = [("01", "START", "Choose your state"), ("02", "LOG", "Add the bird"), ("03", "UPDATE", "See what remains"), ("04", "SAVE", "Keep hunt history")]
    for i, (n, title, body) in enumerate(steps):
        y = 315 + i * 196
        d.ellipse((95, y, 165, y + 70), fill=m.rgba(m.GOLD))
        d.text((130, y + 35), n, font=m.font(m.BOLD, 26), fill=m.DARK, anchor="mm")
        d.text((207, y - 2), title, font=m.font(m.HEAD, 55), fill=m.GREEN)
        d.text((210, y + 69), body, font=m.font(m.BODY, 27), fill=m.SLATE)
        if i < 3:
            d.line((130, y + 82, 130, y + 184), fill=m.rgba(m.GOLD), width=5)
    d.rounded_rectangle((94, 1111, 986, 1191), 18, fill=m.rgba(m.GREEN))
    d.text((540, 1132), "OPEN BLINDIQ.APP IN YOUR BROWSER", font=m.font(m.BOLD, 28), fill=m.CREAM, anchor="ma")
    footer(c, "Start • Log • Update • Save")
    save(c, "06-simple-website-app-workflow.jpg")


def p7():
    c = m.cover(BG / "blind-window.png", centering=(0.65, 0.5))
    c = Image.alpha_composite(c, Image.new("RGBA", (W, H), m.rgba(m.DARK, 80)))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 390), fill=m.rgba(m.DARK, 228))
    d.text((45, 42), "PRACTICE", font=m.font(m.BOLD, 30), fill=m.GOLD)
    y = m.headline(c, "BEFORE OPENING DAY.", 43, 99, 970, 97)
    m.subline(c, "TEST HUNT RUNS IN YOUR BROWSER.", 46, y + 20, 900, 31)
    full_phone(c, SRC / "test-hunt.png", 334, 470, 412, 760, -2)
    d.rounded_rectangle((57, 1010, 363, 1145), 20, fill=m.rgba(m.CREAM, 240))
    d.text((88, 1030), "TEST HUNT", font=m.font(m.HEAD, 43), fill=m.GREEN)
    d.text((88, 1090), "Practice first.", font=m.font(m.BODY, 25), fill=m.SLATE)
    logo(c, 820, 1040, 165, True)
    footer(c, "Send this to a first-time hunter")
    save(c, "07-test-hunt-in-your-browser.jpg")


def p8():
    c = Image.new("RGBA", (W, H), m.rgba(m.CREAM))
    d = ImageDraw.Draw(c)
    d.polygon([(0, 0), (W, 0), (W, 465), (0, 610)], fill=m.rgba(m.GREEN))
    d.text((47, 44), "MY HUNTS", font=m.font(m.BOLD, 25), fill=m.GOLD)
    m.headline(c, "EVERY HUNT. SAVED ONLINE.", 43, 102, 940, 92)
    d.text((47, 355), "YOUR HISTORY TRAVELS WITH YOU.", font=m.font(m.BOLD, 29), fill=m.GOLD)
    full_phone(c, SRC / "my-hunts.jpg", 554, 455, 350, 720, 4, 4)
    d.text((48, 685), "RECENT HUNTS", font=m.font(m.HEAD, 47), fill=m.GREEN)
    rows = [("NOV 24", "6 BIRDS"), ("NOV 17", "4 BIRDS"), ("NOV 12", "3 BIRDS")]
    for i, (date, total) in enumerate(rows):
        y = 780 + i * 112
        d.line((49, y - 17, 480, y - 17), fill=m.rgba(m.TAN), width=3)
        d.text((49, y), date, font=m.font(m.BOLD, 27), fill=m.GREEN)
        d.text((265, y), total, font=m.font(m.BODY, 27), fill=m.SLATE)
    d.rounded_rectangle((48, 1135, 474, 1205), 17, fill=m.rgba(m.GOLD))
    d.text((261, 1155), "SAVED IN THE WEBSITE APP", font=m.font(m.BOLD, 21), fill=m.DARK, anchor="ma")
    footer(c, "Your online hunt history")
    save(c, "08-every-hunt-saved-online.jpg")


def p9():
    c = Image.new("RGBA", (W, H), m.rgba("#102f28"))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 440), fill=m.rgba(m.GOLD))
    d.text((45, 43), "NOT SURE?", font=m.font(m.HEAD, 102), fill=m.DARK)
    d.text((45, 162), "CHECK THE", font=m.font(m.HEAD, 72), fill=m.DARK)
    d.text((45, 247), "BIRD GUIDE.", font=m.font(m.HEAD, 91), fill=m.CREAM)
    d.rounded_rectangle((55, 485, 1025, 1055), 30, fill=m.rgba(m.CREAM), outline=m.rgba(m.GOLD), width=4)
    d.rounded_rectangle((55, 485, 1025, 550), 28, fill=m.rgba(m.DARK))
    d.rectangle((55, 520, 1025, 550), fill=m.rgba(m.DARK))
    d.text((89, 505), "BLINDIQ.APP  •  WATERFOWL GUIDE", font=m.font(m.BOLD, 20), fill=m.CREAM)
    app = m.screen_crop(SRC / "bird-guide.png", (930, 475), 74)
    c.paste(app, (75, 565))
    d.rounded_rectangle((98, 1096, 982, 1210), 20, fill=m.rgba(m.GOLD))
    d.text((540, 1118), "WATERFOWL REFERENCE", font=m.font(m.BOLD, 27), fill=m.DARK, anchor="ma")
    d.text((540, 1162), "INSIDE THE WEBSITE APP", font=m.font(m.BOLD, 27), fill=m.CREAM, anchor="ma")
    footer(c, "Save this for the blind")
    save(c, "09-waterfowl-guide-online.jpg")


def p10():
    c = m.cover(BG / "hunter-phone.png", centering=(0.28, 0.5))
    c = Image.alpha_composite(c, Image.new("RGBA", (W, H), m.rgba(m.DARK, 92)))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((43, 42, 1037, 1238), 34, fill=m.rgba(m.DARK, 220), outline=m.rgba(m.GOLD, 170), width=3)
    y = m.headline(c, "ANY DEVICE. ANY BLIND.", 81, 80, 900, 101)
    m.subline(c, "USE THE WEBSITE APP WHEREVER YOU HUNT.", 84, y + 19, 870, 31)
    d.text((84, 421), "PHONE  •  TABLET  •  COMPUTER", font=m.font(m.BOLD, 28), fill=m.CREAM)
    d.text((84, 475), "No app-store download required.", font=m.font(m.BODY, 27), fill=m.TAN)
    full_phone(c, SRC / "dashboard-partially-open.png", 104, 596, 268, 545, -4)
    d.rounded_rectangle((408, 610, 944, 1035), 25, fill=m.rgba("#060b09"), outline=m.rgba(m.GOLD), width=4)
    app = m.screen_crop(SRC / "dashboard-partially-open.png", (506, 366), 76)
    c.paste(app, (423, 625))
    d.polygon([(374, 1035), (978, 1035), (940, 1085), (414, 1085)], fill=m.rgba("#29332f"))
    d.rounded_rectangle((219, 1152, 861, 1222), 18, fill=m.rgba(m.GOLD))
    d.text((540, 1172), "OPEN BLINDIQ.APP", font=m.font(m.HEAD, 35), fill=m.DARK, anchor="ma")
    footer(c, "Share the website app with your crew")
    save(c, "10-any-device-any-blind.jpg")


def contact_sheet():
    paths = sorted(OUT.glob("*.jpg"))
    tw, th = 324, 405
    sheet = Image.new("RGB", (tw * 2 + 42, (th + 42) * 5 + 22), "#e9e6dd")
    d = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        x = 14 + (i % 2) * (tw + 14)
        y = 12 + (i // 2) * (th + 42)
        d.text((x, y), path.name, font=m.font(m.BODY, 13), fill="#202020")
        sheet.paste(Image.open(path).resize((tw, th), Image.Resampling.LANCZOS), (x, y + 22))
    sheet.save(PKG / "contact-sheet.jpg", quality=94)


if __name__ == "__main__":
    for fn in (p1, p2, p3, p4, p5, p6, p7, p8, p9, p10):
        fn()
    contact_sheet()
    print(f"Created 10 portrait website-app campaign posts in {OUT}")
