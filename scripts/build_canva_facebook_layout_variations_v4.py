from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import math

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "canva-facebook-layout-variations-v4"
BG = PKG / "backgrounds"
OUT = PKG / "posts"
SRC = ROOT / "outputs" / "canva-facebook-landscape" / "source-frames"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
GREEN = "#0b342b"
DARK = "#041a15"
CREAM = "#f3eee2"
TAN = "#c9b88d"
GOLD = "#d9aa45"
WHITE = "#fffdf7"
RUST = "#913b2d"
SLATE = "#273732"

HEAD = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
BOLD = "/Library/Fonts/DejaVuLGCSansCondensed-Bold.ttf"
BODY = "/Library/Fonts/DejaVuLGCSansCondensed.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def cover(path, centering=(0.5, 0.5)):
    im = Image.open(path).convert("RGB")
    return ImageOps.fit(im, (W, H), Image.Resampling.LANCZOS, centering=centering).convert("RGBA")


def rgba(hex_color, alpha=255):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)


def logo(max_w=150):
    im = Image.open(ROOT / "public" / "blindiq-logo.png").convert("RGBA")
    if im.getbbox():
        im = im.crop(im.getbbox())
    im.thumbnail((max_w, max_w), Image.Resampling.LANCZOS)
    return im


def add_logo(c, x, y, max_w=130, backing=False):
    lg = logo(max_w)
    if backing:
        pad = 14
        panel = Image.new("RGBA", (lg.width + pad * 2, lg.height + pad * 2), (0, 0, 0, 0))
        ImageDraw.Draw(panel).rounded_rectangle((0, 0, panel.width - 1, panel.height - 1), 20,
                                               fill=rgba(DARK, 225), outline=rgba(GOLD, 210), width=2)
        c.alpha_composite(panel, (x - pad, y - pad))
    c.alpha_composite(lg, (x, y))


def gradient(c, side="left", strength=220, reach=0.65, color=DARK):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = layer.load()
    cr, cg, cb, _ = rgba(color)
    for x in range(W):
        t = x / max(1, W - 1)
        if side == "left":
            a = int(strength * max(0, 1 - t / reach))
        else:
            a = int(strength * max(0, 1 - (1 - t) / reach))
        for y in range(H):
            px[x, y] = (cr, cg, cb, a)
    return Image.alpha_composite(c, layer)


def fit_lines(draw, text, path, max_size, max_width, min_size=18):
    words = text.split()
    for size in range(max_size, min_size - 1, -1):
        f = font(path, size)
        lines, current = [], ""
        for word in words:
            test = f"{current} {word}".strip()
            if current and draw.textlength(test, font=f) > max_width:
                lines.append(current)
                current = word
            else:
                current = test
        if current:
            lines.append(current)
        if max(draw.textlength(line, font=f) for line in lines) <= max_width:
            return f, lines
    return font(path, min_size), [text]


def headline(c, text, x, y, max_width, max_size=82, fill=CREAM, spacing=-4):
    d = ImageDraw.Draw(c)
    f, lines = fit_lines(d, text, HEAD, max_size, max_width)
    line_h = int(f.size * 0.86)
    for i, line in enumerate(lines):
        d.text((x, y + i * line_h), line, font=f, fill=fill)
    return y + len(lines) * line_h


def subline(c, text, x, y, max_width, size=27, fill=GOLD):
    d = ImageDraw.Draw(c)
    f, lines = fit_lines(d, text, BOLD, size, max_width, 18)
    line_h = int(f.size * 1.18)
    for i, line in enumerate(lines):
        d.text((x, y + i * line_h), line, font=f, fill=fill)
    return y + len(lines) * line_h


def screen_crop(path, size, crop_top=76, centering=(0.5, 0.06)):
    im = Image.open(path).convert("RGB")
    top = min(crop_top, max(0, im.height - 30))
    im = im.crop((0, top, im.width, im.height))
    return ImageOps.fit(im, size, Image.Resampling.LANCZOS, centering=centering)


def phone(path, w=245, h=475, crop_top=76, centering=(0.5, 0.06), gold=True):
    outer = Image.new("RGBA", (w, h), rgba("#050b09"))
    inner = screen_crop(path, (w - 16, h - 18), crop_top, centering)
    mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, inner.width - 1, inner.height - 1), 25, fill=255)
    outer.paste(inner, (8, 9), mask)
    d = ImageDraw.Draw(outer)
    d.rounded_rectangle((1, 1, w - 2, h - 2), 31, outline=rgba(GOLD if gold else "#0f1715"), width=4)
    d.rounded_rectangle((w // 2 - 34, 8, w // 2 + 34, 15), 4, fill=rgba(DARK))
    return outer


def paste_phone(c, path, x, y, w=245, h=475, angle=0, crop_top=76, centering=(0.5, 0.06)):
    ph = phone(path, w, h, crop_top, centering)
    if angle:
        ph = ph.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    shadow = Image.new("RGBA", (ph.width + 80, ph.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((40, 40, ph.width + 40, ph.height + 40), 34, fill=(0, 0, 0, 185))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    c.alpha_composite(shadow, (x - 40, y - 28))
    c.alpha_composite(ph, (x, y))


def browser_card(c, path, box, crop_top=76, address="BLINDIQ.APP"):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    shadow = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((30, 30, w + 30, h + 30), 24, fill=(0, 0, 0, 170))
    c.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)), (x1 - 30, y1 - 20))
    panel = Image.new("RGBA", (w, h), rgba(CREAM, 255))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 24, fill=rgba(CREAM), outline=rgba(GOLD), width=3)
    d.rounded_rectangle((0, 0, w - 1, 46), 24, fill=rgba(DARK))
    d.rectangle((0, 24, w, 46), fill=rgba(DARK))
    for i, color in enumerate(("#d86555", "#e7b94b", "#7fb26e")):
        d.ellipse((17 + i * 22, 16, 27 + i * 22, 26), fill=rgba(color))
    d.rounded_rectangle((98, 11, w - 18, 34), 11, fill=rgba("#173c33"))
    d.text((112, 15), address, font=font(BOLD, 13), fill=CREAM)
    image = screen_crop(path, (w - 18, h - 60), crop_top)
    panel.paste(image, (9, 51))
    c.alpha_composite(panel, (x1, y1))


def footer(c, left):
    d = ImageDraw.Draw(c)
    d.rectangle((0, H - 42, W, H), fill=rgba(DARK, 245))
    d.text((24, H - 31), left.upper(), font=font(BOLD, 15), fill=CREAM)
    right = "WEBSITE APP  •  BLINDIQ.APP"
    f = font(BOLD, 15)
    d.text((W - d.textlength(right, font=f) - 24, H - 31), right, font=f, fill=GOLD)


def save(c, filename):
    c.convert("RGB").save(OUT / filename, quality=96, subsampling=0)


def p1():
    c = gradient(cover(BG / "hunter-phone.png"), "right", 235, 0.72)
    d = ImageDraw.Draw(c)
    d.rectangle((720, 0, W, H), fill=rgba(DARK, 152))
    add_logo(c, 1030, 32, 108)
    y = headline(c, "THE WEBSITE APP BUILT FOR DUCK HUNTERS.", 715, 98, 445, 66)
    d.rectangle((717, y + 10, 805, y + 14), fill=GOLD)
    subline(c, "OPEN BLINDIQ.APP IN ANY BROWSER.", 717, y + 31, 420, 25)
    d.rounded_rectangle((716, 438, 1138, 506), 16, fill=rgba(CREAM, 235))
    d.text((745, 455), "NO APP-STORE DOWNLOAD", font=font(BOLD, 24), fill=GREEN)
    footer(c, "Open the website app")
    save(c, "01-website-app-for-duck-hunters.jpg")


def p2():
    c = gradient(cover(BG / "workbench-phone.png"), "left", 238, 0.70)
    d = ImageDraw.Draw(c)
    d.polygon([(0, 0), (685, 0), (555, H), (0, H)], fill=rgba(DARK, 228))
    d.text((44, 22), "02", font=font(HEAD, 34), fill=GOLD)
    y = headline(c, "LOG A BIRD. KNOW WHAT'S NEXT.", 44, 72, 510, 84)
    subline(c, "LIVE HARVEST GUIDANCE IN THE WEBSITE APP.", 48, y + 18, 470, 24)
    d.rounded_rectangle((45, 426, 500, 490), 12, outline=rgba(GOLD), width=2, fill=rgba(GREEN, 210))
    d.text((69, 445), "START  →  LOG  →  UPDATE", font=font(BOLD, 22), fill=CREAM)
    add_logo(c, 1025, 33, 112, True)
    footer(c, "Tag the buddy who loses count")
    save(c, "02-log-a-bird-know-whats-next.jpg")


def p3():
    c = cover(BG / "blind-window.png")
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((42, 51, 505, 531), 28, fill=rgba(DARK, 222), outline=rgba(GOLD, 150), width=2)
    d.text((72, 73), "BEFORE THE HUNT", font=font(BOLD, 18), fill=GOLD)
    y = headline(c, "CHECK WHAT'S OPEN.", 70, 112, 392, 76)
    subline(c, "STATE • ZONE • SEASON DATES", 72, y + 14, 370, 23)
    d.text((72, 365), "Available online at", font=font(BODY, 22), fill=CREAM)
    d.text((72, 395), "BLINDIQ.APP", font=font(HEAD, 44), fill=GOLD)
    browser_card(c, SRC / "dashboard-partially-open.png", (720, 105, 1148, 520))
    footer(c, "Check before you go")
    save(c, "03-check-whats-open-online.jpg")


def p4():
    c = Image.new("RGBA", (W, H), rgba(DARK))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, W, 86), fill=rgba(GREEN))
    add_logo(c, 29, 13, 67)
    d.text((121, 20), "STOP DOING BAG-LIMIT MATH.", font=font(HEAD, 47), fill=CREAM)
    labels = [("1", "LOG", "Add every bird"), ("2", "COUNT", "See today's totals"), ("3", "KNOW", "What remains legal")]
    for i, (num, title, body) in enumerate(labels):
        x = 36 + i * 385
        d.rounded_rectangle((x, 123, x + 352, 512), 24, fill=rgba("#123f35"), outline=rgba(GOLD), width=2)
        d.ellipse((x + 24, 147, x + 84, 207), fill=rgba(GOLD))
        d.text((x + 45, 156), num, font=font(BOLD, 26), fill=DARK, anchor="mm")
        d.text((x + 26, 238), title, font=font(HEAD, 63), fill=CREAM)
        d.rectangle((x + 26, 315, x + 108, 320), fill=rgba(GOLD))
        d.text((x + 26, 343), body, font=font(BODY, 23), fill=TAN)
        if i == 1:
            mini = screen_crop(SRC / "hunt-4-of-6.png", (150, 116), 95)
            c.paste(mini, (x + 176, 372))
        else:
            d.text((x + 26, 412), "WEBSITE\nAPP", font=font(BOLD, 26), fill=GOLD, spacing=2)
    footer(c, "BlindIQ keeps the count")
    save(c, "04-stop-bag-limit-math.jpg")


def p5():
    c = gradient(cover(BG / "hunter-phone.png"), "right", 215, 0.65)
    d = ImageDraw.Draw(c)
    d.polygon([(590, 0), (W, 0), (W, H), (720, H)], fill=rgba(GREEN, 230))
    add_logo(c, 44, 36, 142, True)
    d.text((44, 224), "THE WEBSITE APP", font=font(BOLD, 26), fill=CREAM)
    d.text((44, 266), "FOR WATERFOWL HUNTERS", font=font(HEAD, 50), fill=GOLD)
    d.ellipse((728, 62, 1128, 462), fill=rgba(CREAM), outline=rgba(GOLD), width=8)
    d.text((928, 124), "ONLY", font=font(BOLD, 27), fill=GREEN, anchor="mm")
    d.text((928, 242), "$10.99", font=font(HEAD, 116), fill=GREEN, anchor="mm")
    d.text((928, 340), "/ YEAR", font=font(HEAD, 48), fill=GOLD, anchor="mm")
    d.rounded_rectangle((764, 486, 1117, 540), 14, fill=rgba(DARK))
    d.text((940, 503), "NO DOWNLOAD REQUIRED", font=font(BOLD, 19), fill=CREAM, anchor="ma")
    footer(c, "Open BlindIQ.app")
    save(c, "05-only-10-99-website-app.jpg")


def p6():
    bg = cover(BG / "workbench-phone.png").filter(ImageFilter.GaussianBlur(3))
    c = Image.alpha_composite(bg, Image.new("RGBA", (W, H), rgba(DARK, 108)))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((70, 60, 1130, 540), 30, fill=rgba(CREAM, 246))
    d.text((108, 82), "ONE WEBSITE APP. ONE SIMPLE WORKFLOW.", font=font(HEAD, 46), fill=GREEN)
    steps = [("01", "START", "Choose your state"), ("02", "LOG", "Add the bird"), ("03", "UPDATE", "See what remains"), ("04", "SAVE", "Keep hunt history")]
    for i, (num, title, body) in enumerate(steps):
        x = 108 + i * 250
        d.text((x, 178), num, font=font(HEAD, 29), fill=GOLD)
        d.text((x, 223), title, font=font(HEAD, 47), fill=GREEN)
        d.rectangle((x, 283, x + 72, 287), fill=rgba(GOLD))
        f, lines = fit_lines(d, body, BODY, 21, 190)
        for j, line in enumerate(lines):
            d.text((x, 311 + j * 27), line, font=f, fill=SLATE)
        if i < 3:
            d.text((x + 203, 236), "→", font=font(BOLD, 32), fill=GOLD)
    d.rounded_rectangle((107, 414, 1092, 493), 18, fill=rgba(GREEN))
    d.text((598, 437), "OPEN BLINDIQ.APP IN YOUR BROWSER", font=font(BOLD, 27), fill=CREAM, anchor="ma")
    footer(c, "Start • Log • Update • Save")
    save(c, "06-simple-website-app-workflow.jpg")


def p7():
    c = gradient(cover(BG / "blind-window.png"), "left", 218, 0.64)
    d = ImageDraw.Draw(c)
    d.text((45, 30), "PRACTICE", font=font(HEAD, 39), fill=GOLD)
    y = headline(c, "BEFORE OPENING DAY.", 45, 79, 520, 84)
    subline(c, "TEST HUNT RUNS IN YOUR BROWSER.", 48, y + 17, 505, 25)
    d.rounded_rectangle((48, 380, 490, 486), 18, fill=rgba(CREAM, 235))
    d.text((78, 398), "TEST HUNT", font=font(HEAD, 44), fill=GREEN)
    d.text((78, 447), "Practice without changing live totals", font=font(BODY, 18), fill=SLATE)
    paste_phone(c, SRC / "test-hunt.png", 845, 65, 240, 485, -4, 76)
    add_logo(c, 1080, 28, 91)
    footer(c, "Send this to a first-time hunter")
    save(c, "07-test-hunt-in-your-browser.jpg")


def p8():
    c = cover(BG / "workbench-phone.png")
    d = ImageDraw.Draw(c)
    d.polygon([(0, 0), (750, 0), (655, H), (0, H)], fill=rgba(CREAM, 246))
    d.text((42, 32), "MY HUNTS", font=font(BOLD, 19), fill=GOLD)
    y = headline(c, "EVERY HUNT. SAVED ONLINE.", 42, 79, 550, 78, GREEN)
    subline(c, "YOUR HISTORY TRAVELS WITH YOU.", 45, y + 13, 510, 25, RUST)
    rows = [("NOV 24", "6 birds", "Maryland"), ("NOV 17", "4 birds", "Virginia"), ("NOV 12", "3 birds", "Delaware")]
    for i, row in enumerate(rows):
        yy = 340 + i * 59
        d.line((45, yy - 8, 594, yy - 8), fill=rgba(TAN), width=2)
        d.text((45, yy), row[0], font=font(BOLD, 19), fill=GREEN)
        d.text((210, yy), row[1], font=font(BODY, 19), fill=SLATE)
        d.text((400, yy), row[2], font=font(BODY, 19), fill=SLATE)
    paste_phone(c, SRC / "my-hunts.jpg", 865, 66, 235, 485, 3, 4)
    footer(c, "Your online hunt history")
    save(c, "08-every-hunt-saved-online.jpg")


def p9():
    c = Image.new("RGBA", (W, H), rgba("#0e2b25"))
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, 518, H), fill=rgba(GOLD))
    d.text((42, 30), "NOT SURE?", font=font(HEAD, 84), fill=DARK)
    d.text((42, 126), "CHECK THE", font=font(HEAD, 63), fill=DARK)
    d.text((42, 198), "BIRD GUIDE.", font=font(HEAD, 75), fill=CREAM)
    d.rounded_rectangle((43, 335, 468, 449), 18, fill=rgba(DARK))
    d.text((72, 355), "WATERFOWL REFERENCE", font=font(BOLD, 22), fill=GOLD)
    d.text((72, 393), "INSIDE THE WEBSITE APP", font=font(BOLD, 22), fill=CREAM)
    browser_card(c, SRC / "bird-guide.png", (596, 65, 1137, 543), 74)
    add_logo(c, 405, 487, 88)
    footer(c, "Save this for the blind")
    save(c, "09-waterfowl-guide-online.jpg")


def device_frame(c, path, box, kind="phone"):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    if kind == "laptop":
        d = ImageDraw.Draw(c)
        d.rounded_rectangle((x1, y1, x2, y2 - 22), 18, fill=rgba("#050907"), outline=rgba(GOLD), width=3)
        im = screen_crop(path, (w - 18, h - 42), 76)
        c.paste(im, (x1 + 9, y1 + 9))
        d.polygon([(x1 - 22, y2 - 22), (x2 + 22, y2 - 22), (x2, y2), (x1, y2)], fill=rgba("#28322f"))
    else:
        ph = phone(path, w, h, 76)
        c.alpha_composite(ph, (x1, y1))


def p10():
    c = gradient(cover(BG / "hunter-phone.png"), "right", 205, 0.72)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((38, 35, 628, 548), 26, fill=rgba(DARK, 226), outline=rgba(GOLD, 135), width=2)
    y = headline(c, "ANY DEVICE. ANY BLIND.", 70, 72, 500, 82)
    subline(c, "USE THE WEBSITE APP WHEREVER YOU HUNT.", 72, y + 14, 485, 24)
    d.text((72, 353), "PHONE  •  TABLET  •  COMPUTER", font=font(BOLD, 22), fill=CREAM)
    d.text((72, 397), "No app-store download required.", font=font(BODY, 22), fill=TAN)
    d.rounded_rectangle((70, 454, 522, 509), 15, fill=rgba(GOLD))
    d.text((296, 470), "BLINDIQ.APP", font=font(HEAD, 31), fill=DARK, anchor="ma")
    device_frame(c, SRC / "dashboard-partially-open.png", (731, 208, 1128, 486), "laptop")
    paste_phone(c, SRC / "dashboard-partially-open.png", 663, 123, 145, 330, -5, 76)
    footer(c, "Share the website app with your crew")
    save(c, "10-any-device-any-blind.jpg")


def contact_sheet():
    paths = sorted(OUT.glob("*.jpg"))
    tw, th = 480, 252
    sheet = Image.new("RGB", (tw * 2 + 36, (th + 42) * 5 + 22), "#e8e5dd")
    d = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        x = 12 + (i % 2) * (tw + 12)
        y = 12 + (i // 2) * (th + 42)
        d.text((x, y), path.name, font=font(BODY, 15), fill="#202020")
        sheet.paste(Image.open(path).resize((tw, th), Image.Resampling.LANCZOS), (x, y + 22))
    sheet.save(PKG / "contact-sheet.jpg", quality=94)


if __name__ == "__main__":
    for fn in (p1, p2, p3, p4, p5, p6, p7, p8, p9, p10):
        fn()
    contact_sheet()
    print(f"Created 10 alternate-layout Facebook posts in {OUT}")
