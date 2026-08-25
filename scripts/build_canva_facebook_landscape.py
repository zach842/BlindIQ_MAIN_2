from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "outputs" / "social-package"
PKG = ROOT / "outputs" / "canva-facebook-landscape"
OUT = PKG / "posts"
FRAMES = PKG / "source-frames"
NEW_BG = PKG / "backgrounds"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
GREEN = "#0f3b31"
DARK = "#061e18"
CREAM = "#f5f0e4"
GOLD = "#d9a82e"
WHITE = "#fffdf7"
RUST = "#913827"

FONT_HEAD = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_BOLD = "/Library/Fonts/DejaVuLGCSansCondensed-Bold.ttf"
FONT_BODY = "/Library/Fonts/DejaVuLGCSansCondensed.ttf"


def f(path, size):
    return ImageFont.truetype(path, size)


def cover(path):
    image = Image.open(path).convert("RGB")
    ratio = max(W / image.width, H / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    x = max(0, (resized.width - W) // 2)
    y = max(0, (resized.height - H) // 2)
    return resized.crop((x, y, x + W, y + H)).convert("RGBA")


def shade(canvas, left=220, right=70, top=35):
    overlay = Image.new("RGBA", canvas.size)
    p = overlay.load()
    for x in range(W):
        tx = x / (W - 1)
        a = int(left * (1 - tx) + right * tx)
        for y in range(H):
            ty = y / (H - 1)
            p[x, y] = (3, 20, 15, min(255, a + int(top * (1 - ty))))
    return Image.alpha_composite(canvas, overlay)


def crop_logo(width=64):
    logo = Image.open(ROOT / "public" / "blindiq-logo.png").convert("RGBA")
    if logo.getbbox():
        logo = logo.crop(logo.getbbox())
    logo.thumbnail((width, width), Image.Resampling.LANCZOS)
    return logo


def tracking(draw, xy, text, font, fill, spacing=2):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + spacing


def brand_header(canvas, kicker):
    d = ImageDraw.Draw(canvas)
    logo = crop_logo(64)
    canvas.alpha_composite(logo, (28, 19))
    tracking(d, (104, 28), kicker.upper(), f(FONT_BOLD, 18), GOLD, 2)
    d.line((104, 58, 430, 58), fill=(217, 168, 46, 145), width=2)


def headline(d, text, x=40, y=86, size=70, width=545, fill=WHITE, spacing=-2):
    font = f(FONT_HEAD, size)
    words = text.split()
    lines, line = [], ""
    for word in words:
        test = (line + " " + word).strip()
        if line and d.textlength(test, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    d.multiline_text((x, y), "\n".join(lines), font=font, fill=fill, spacing=spacing)
    return y + len(lines) * (size - 5)


def subhead(d, text, x, y, size=22, width=520, fill=GOLD):
    font = f(FONT_BOLD, size)
    words = text.split()
    lines, line = [], ""
    for word in words:
        test = (line + " " + word).strip()
        if line and d.textlength(test, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    d.multiline_text((x, y), "\n".join(lines), font=font, fill=fill, spacing=5)


def phone(path, width, height, crop_top=82, focus_y=0.0, radius=30):
    source = Image.open(path).convert("RGB")
    source = source.crop((0, min(crop_top, source.height - 10), source.width, source.height))
    fitted = ImageOps.fit(
        source,
        (width - 14, height - 14),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, focus_y),
    )
    mask = Image.new("L", fitted.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, fitted.width, fitted.height), radius=radius - 8, fill=255)
    framed = Image.new("RGBA", (width, height), (4, 13, 11, 255))
    framed.paste(fitted, (7, 7), mask)
    ImageDraw.Draw(framed).rounded_rectangle((1, 1, width - 2, height - 2), radius=radius, outline=(221, 180, 88, 255), width=4)
    return framed


def place_phone(canvas, path, x, y, width, height, angle=0, crop_top=82, focus_y=0.0):
    ph = phone(path, width, height, crop_top, focus_y)
    if angle:
        ph = ph.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    sh = Image.new("RGBA", (ph.width + 60, ph.height + 60), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((25, 25, ph.width + 25, ph.height + 25), radius=34, fill=(0, 0, 0, 180))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(sh, (x - 25, y - 20))
    canvas.alpha_composite(ph, (x, y))


def panel(d, box, fill=(7, 32, 26, 235), outline=GOLD, radius=23, width=3):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def footer(canvas, left, right="BLINDIQ.APP"):
    ft = Image.new("RGBA", (W, 49), (5, 29, 23, 245))
    d = ImageDraw.Draw(ft)
    tracking(d, (28, 15), left.upper(), f(FONT_BOLD, 15), CREAM, 1)
    rf = f(FONT_BOLD, 17)
    rw = d.textlength(right, font=rf)
    d.text((W - rw - 28, 14), right, font=rf, fill=GOLD)
    canvas.alpha_composite(ft, (0, H - 49))


def save(canvas, name):
    canvas.convert("RGB").save(OUT / name, quality=96, subsampling=0)


def bg_old(name, left=225, right=65):
    return shade(cover(SRC / "backgrounds" / name), left, right)


def post1():
    c = bg_old("01-season-status.png")
    d = ImageDraw.Draw(c)
    brand_header(c, "Season status at a glance")
    y = headline(d, "WHAT'S OPEN TODAY?", y=84, size=77, width=500)
    subhead(d, "STATE • SEASON • STATUS", 42, y + 7, size=20)
    place_phone(c, FRAMES / "dashboard-partially-open.png", 790, 68, 300, 515, angle=-2, focus_y=0.0)
    panel(d, (40, 350, 520, 493))
    d.text((67, 377), "SEE IT BEFORE YOU\nSET THE DECOYS.", font=f(FONT_HEAD, 42), fill=CREAM, spacing=-1)
    footer(c, "CHECK YOUR STATE BEFORE THE HUNT")
    save(c, "01-whats-open-today.jpg")


def post2():
    c = bg_old("02-log-every-bird.png", 235, 80)
    d = ImageDraw.Draw(c)
    brand_header(c, "Your bag updates live")
    y = headline(d, "LOG EVERY BIRD.", y=84, size=75, width=520)
    subhead(d, "KNOW WHAT YOU CAN SHOOT NEXT.", 42, y + 7, size=21)
    place_phone(c, FRAMES / "hunt-5-of-6.png", 785, 62, 300, 520, angle=2, focus_y=0.0)
    panel(d, (40, 322, 520, 500))
    d.text((69, 345), "5 / 6", font=f(FONT_HEAD, 89), fill=GOLD)
    d.text((255, 362), "ONE DUCK REMAINS\nIN THE DAILY BAG.", font=f(FONT_BOLD, 25), fill=CREAM, spacing=5)
    footer(c, "TAG THE BUDDY WHO ALWAYS LOSES COUNT")
    save(c, "02-log-every-bird.jpg")


def post3():
    c = bg_old("03-bag-limit.png", 240, 88)
    d = ImageDraw.Draw(c)
    brand_header(c, "Keep the regs within reach")
    headline(d, "STOP DOING BAG-LIMIT MATH IN THE BLIND.", y=82, size=62, width=560)
    place_phone(c, FRAMES / "hunt-4-of-6.png", 815, 59, 280, 520, angle=-2, focus_y=0.0)
    panel(d, (40, 358, 565, 505), fill=(245, 240, 226, 240), outline=GOLD)
    d.text((67, 382), "BLINDIQ KEEPS THE COUNT.", font=f(FONT_HEAD, 39), fill=GREEN)
    d.text((68, 438), "Log each bird. Watch your remaining bag update.", font=f(FONT_BOLD, 19), fill=DARK)
    footer(c, "SAVE THE MATH FOR AFTER THE HUNT")
    save(c, "03-stop-bag-limit-math.jpg")


def post4():
    c = bg_old("04-test-hunt.png", 230, 80)
    d = ImageDraw.Draw(c)
    brand_header(c, "Practice the workflow")
    headline(d, "LEARN IT BEFORE OPENING DAY.", y=82, size=64, width=510)
    place_phone(c, FRAMES / "dashboard-partially-open.png", 640, 91, 245, 460, angle=-4, focus_y=0.0)
    place_phone(c, FRAMES / "test-hunt.png", 910, 82, 245, 470, angle=3, focus_y=0.0)
    panel(d, (42, 363, 495, 461), fill=(217, 168, 46, 245), outline=CREAM)
    d.text((69, 389), "TEST HUNT MODE", font=f(FONT_HEAD, 45), fill=DARK)
    footer(c, "SEND THIS TO A FIRST-TIME HUNTER")
    save(c, "04-learn-before-opening-day.jpg")


def post5():
    c = bg_old("05-price.png", 240, 90)
    d = ImageDraw.Draw(c)
    brand_header(c, "The waterfowl hunt log")
    headline(d, "YOUR HUNTING COMPANION.", y=82, size=64, width=530)
    place_phone(c, FRAMES / "account-price-top-v2.png", 810, 75, 280, 500, angle=2, focus_y=0.0)
    panel(d, (40, 323, 545, 504))
    d.text((70, 336), "$10.99", font=f(FONT_HEAD, 89), fill=GOLD)
    d.text((269, 359), "/ YEAR", font=f(FONT_BOLD, 26), fill=CREAM)
    d.line((70, 429, 510, 429), fill=(217, 168, 46, 175), width=2)
    d.text((70, 449), "ON ANY INTERNET-CONNECTED DEVICE", font=f(FONT_BOLD, 20), fill=CREAM)
    footer(c, "ONE YEAR. ONE CLEAR HUNT LOG.")
    save(c, "05-only-10-99-year.jpg")


def post6():
    c = bg_old("06-workflow.png", 245, 95)
    d = ImageDraw.Draw(c)
    brand_header(c, "One simple workflow")
    headline(d, "SHOT. LOGGED. UPDATED.", y=82, size=66, width=490)
    items = [
        (FRAMES / "dashboard-partially-open.png", 600, -3, "1  START"),
        (FRAMES / "hunt-2-of-6.png", 795, 0, "2  LOG"),
        (FRAMES / "hunt-summary.png", 990, 3, "3  SAVE"),
    ]
    for path, x, angle, label in items:
        place_phone(c, path, x, 118, 205, 390, angle=angle, focus_y=0.0)
        d.rounded_rectangle((x + 13, 505, x + 192, 550), radius=14, fill=GOLD)
        lw = d.textlength(label, font=f(FONT_BOLD, 17))
        d.text((x + (205 - lw) / 2, 518), label, font=f(FONT_BOLD, 17), fill=DARK)
    panel(d, (40, 354, 520, 473))
    d.text((68, 379), "EVERY BIRD CHANGES\nWHAT COMES NEXT.", font=f(FONT_HEAD, 37), fill=CREAM, spacing=-1)
    footer(c, "START • LOG • SAVE")
    save(c, "06-shot-logged-updated.jpg")


def post7():
    c = shade(cover(SRC / "backgrounds" / "07-brand-promise.png"), 170, 150, 55)
    d = ImageDraw.Draw(c)
    logo = crop_logo(150)
    c.alpha_composite(logo, (72, 80))
    panel(d, (270, 70, 1125, 520), fill=(5, 30, 24, 222), outline=GOLD, radius=30, width=4)
    d.text((325, 116), "HUNT WITH CONFIDENCE.", font=f(FONT_HEAD, 75), fill=CREAM)
    d.text((329, 222), "LOG HUNTS. KNOW THE REGS.", font=f(FONT_BOLD, 26), fill=GOLD)
    d.line((329, 275, 1050, 275), fill=(217, 168, 46, 165), width=2)
    d.text((329, 313), "$10.99 / YEAR", font=f(FONT_HEAD, 61), fill=WHITE)
    d.rounded_rectangle((329, 411, 758, 478), radius=19, fill=GOLD)
    d.text((371, 430), "START YOUR HUNT LOG", font=f(FONT_BOLD, 22), fill=DARK)
    footer(c, "THE WATERFOWL HUNT LOG")
    save(c, "07-hunt-with-confidence.jpg")


def post8():
    c = shade(cover(NEW_BG / "08-hunt-history.png"), 230, 50)
    d = ImageDraw.Draw(c)
    brand_header(c, "Your season in one place")
    y = headline(d, "EVERY HUNT. SAVED.", y=84, size=70, width=520)
    subhead(d, "DATES • ZONES • BIRDS • TOTALS", 42, y + 5, size=20)
    place_phone(c, FRAMES / "my-hunts.jpg", 820, 64, 275, 515, angle=-2, crop_top=5, focus_y=0.0)
    panel(d, (40, 340, 548, 494))
    d.text((68, 366), "BUILD YOUR\nWATERFOWL STORY.", font=f(FONT_HEAD, 43), fill=CREAM, spacing=-1)
    footer(c, "TAG THE PARTNER IN YOUR BEST HUNT")
    save(c, "08-every-hunt-saved.jpg")


def post9():
    c = shade(cover(NEW_BG / "09-waterfowl-guide.png"), 238, 35)
    d = ImageDraw.Draw(c)
    brand_header(c, "Field reference built in")
    headline(d, "NOT SURE WHAT YOU SHOT?", y=82, size=65, width=525)
    subhead(d, "OPEN THE WATERFOWL ID GUIDE.", 42, 270, size=22)
    place_phone(c, FRAMES / "bird-guide.png", 850, 70, 260, 500, angle=2, focus_y=0.0)
    panel(d, (40, 355, 560, 493))
    d.text((67, 382), "REFERENCE PHOTOS +\nIDENTIFYING MARKERS", font=f(FONT_HEAD, 37), fill=CREAM, spacing=-1)
    footer(c, "SAVE THIS FOR THE BLIND")
    save(c, "09-waterfowl-id-guide.jpg")


def post10():
    c = shade(cover(NEW_BG / "10-connected-devices.png"), 105, 55)
    d = ImageDraw.Draw(c)
    brand_header(c, "Use it wherever you hunt")
    headline(d, "BLINDIQ GOES WHERE YOU HUNT.", y=82, size=64, width=540)
    subhead(d, "ON ANY INTERNET-CONNECTED DEVICE.", 42, 292, size=21)
    place_phone(c, FRAMES / "login.png", 865, 148, 230, 420, angle=-2, focus_y=0.0)
    panel(d, (40, 372, 570, 501))
    d.text((68, 396), "PHONE. TABLET. COMPUTER.", font=f(FONT_HEAD, 37), fill=CREAM)
    d.text((70, 451), "Add BlindIQ to your home screen.", font=f(FONT_BOLD, 20), fill=GOLD)
    footer(c, "SHARE BLINDIQ WITH YOUR HUNTING CREW")
    save(c, "10-any-connected-device.jpg")


def contact_sheet():
    paths = sorted(OUT.glob("*.jpg"))
    thumb_w, thumb_h = 480, 252
    sheet = Image.new("RGB", (thumb_w * 2 + 36, (thumb_h + 42) * 5 + 22), "#eceae4")
    d = ImageDraw.Draw(sheet)
    for i, path in enumerate(paths):
        x = 12 + (i % 2) * (thumb_w + 12)
        y = 12 + (i // 2) * (thumb_h + 42)
        im = Image.open(path).resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(im, (x, y + 22))
        d.text((x, y), path.name, font=f(FONT_BODY, 15), fill="#222222")
    sheet.save(PKG / "contact-sheet.jpg", quality=93)


if __name__ == "__main__":
    for build in (post1, post2, post3, post4, post5, post6, post7, post8, post9, post10):
        build()
    contact_sheet()
    print(f"Created 10 landscape Facebook posts in {OUT}")
