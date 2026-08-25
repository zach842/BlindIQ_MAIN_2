from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "outputs" / "social-package"
BACKGROUNDS = PKG / "backgrounds"
FRAMES = PKG / "selected-frames"
POSTS = PKG / "posts"
POSTS.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1350
GREEN = "#103b31"
DARK = "#071d18"
CREAM = "#f4f0e5"
GOLD = "#d9a82e"
OLIVE = "#65704d"
WHITE = "#fffdf6"
MUTED = "#d8d2c2"

FONT_HEAD = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_BODY_BOLD = "/Library/Fonts/DejaVuLGCSansCondensed-Bold.ttf"
FONT_BODY = "/Library/Fonts/DejaVuLGCSansCondensed.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def cover(image, size=(W, H)):
    image = image.convert("RGB")
    ratio = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    x = (resized.width - size[0]) // 2
    y = (resized.height - size[1]) // 2
    return resized.crop((x, y, x + size[0], y + size[1])).convert("RGBA")


def add_vertical_overlay(canvas, top_alpha=178, bottom_alpha=75):
    overlay = Image.new("RGBA", canvas.size)
    px = overlay.load()
    for y in range(canvas.height):
        t = y / max(1, canvas.height - 1)
        alpha = round(top_alpha * (1 - t) + bottom_alpha * t)
        for x in range(canvas.width):
            px[x, y] = (4, 18, 14, alpha)
    return Image.alpha_composite(canvas, overlay)


def add_top_band(canvas, height=260, alpha=200):
    band = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(band)
    draw.rectangle((0, 0, W, height), fill=(5, 28, 22, alpha))
    return Image.alpha_composite(canvas, band)


def add_logo(canvas, x=48, y=32, width=72):
    logo = Image.open(ROOT / "public" / "blindiq-logo.png").convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    logo.thumbnail((width, width), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, (x, y))


def draw_tracking(draw, xy, text, fnt, fill, tracking=4):
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=fnt, fill=fill)
        x += draw.textlength(char, font=fnt) + tracking


def add_kicker(draw, text, x=142, y=47):
    draw_tracking(draw, (x, y), text.upper(), font(FONT_BODY_BOLD, 24), GOLD, tracking=3)


def add_headline(draw, text, x=58, y=125, size=94, fill=WHITE, spacing=4, stroke=0):
    fnt = font(FONT_HEAD, size)
    draw.multiline_text((x, y), text, font=fnt, fill=fill, spacing=spacing,
                        stroke_width=stroke, stroke_fill=DARK)


def add_subhead(draw, text, x=60, y=320, size=29, fill=GOLD, max_width=760):
    fnt = font(FONT_BODY_BOLD, size)
    words = text.split()
    lines, line = [], ""
    for word in words:
        test = f"{line} {word}".strip()
        if draw.textlength(test, font=fnt) > max_width and line:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    draw.multiline_text((x, y), "\n".join(lines), font=fnt, fill=fill, spacing=8)


def rounded_screen(path, width, height, crop_top=72, border=12, radius=38):
    source = Image.open(path).convert("RGB")
    source = source.crop((0, crop_top, source.width, source.height))
    fitted = ImageOps.fit(source, (width - border * 2, height - border * 2), method=Image.Resampling.LANCZOS, centering=(0.5, 0.0))
    screen_mask = Image.new("L", fitted.size, 0)
    ImageDraw.Draw(screen_mask).rounded_rectangle((0, 0, fitted.width, fitted.height), radius=radius - border, fill=255)
    framed = Image.new("RGBA", (width, height), (5, 10, 9, 255))
    framed.paste(fitted, (border, border), screen_mask)
    rim = ImageDraw.Draw(framed)
    rim.rounded_rectangle((1, 1, width - 2, height - 2), radius=radius, outline=(214, 174, 91, 255), width=4)
    return framed


def add_phone(canvas, path, box, crop_top=72, angle=0):
    x, y, width, height = box
    phone = rounded_screen(path, width, height, crop_top=crop_top)
    if angle:
        phone = phone.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    shadow = Image.new("RGBA", (phone.width + 80, phone.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((35, 35, phone.width + 35, phone.height + 35), radius=45, fill=(0, 0, 0, 185))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    canvas.alpha_composite(shadow, (x - 35, y - 30))
    canvas.alpha_composite(phone, (x, y))


def add_footer(canvas, label="BLINDIQ.APP", secondary="HUNT WITH CONFIDENCE"):
    footer = Image.new("RGBA", (W, 92), (7, 29, 24, 236))
    d = ImageDraw.Draw(footer)
    draw_tracking(d, (36, 28), label, font(FONT_BODY_BOLD, 25), GOLD, tracking=2)
    right = font(FONT_BODY_BOLD, 22)
    rw = d.textlength(secondary, font=right)
    d.text((W - rw - 36, 30), secondary, font=right, fill=CREAM)
    canvas.alpha_composite(footer, (0, H - 92))


def base(bg_name, top_alpha=178, bottom_alpha=70):
    canvas = cover(Image.open(BACKGROUNDS / bg_name))
    canvas = add_vertical_overlay(canvas, top_alpha, bottom_alpha)
    canvas = add_top_band(canvas, 285, 185)
    return canvas


def save(canvas, name):
    canvas.convert("RGB").save(POSTS / name, quality=95, subsampling=0)


def post_1():
    canvas = base("01-season-status.png", 178, 66)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "Season status at a glance")
    add_headline(draw, "WHAT'S OPEN\nTODAY?", y=112, size=100)
    add_subhead(draw, "STATE • SEASON • STATUS", y=325, size=27)
    add_phone(canvas, FRAMES / "dashboard-partially-open.png", (566, 312, 440, 880), crop_top=86, angle=-2)
    badge = (52, 954, 508, 1137)
    draw.rounded_rectangle(badge, radius=28, fill=(12, 55, 44, 235), outline=GOLD, width=3)
    draw.text((84, 984), "SEE IT BEFORE\nYOU SET THE DECOYS.", font=font(FONT_HEAD, 47), fill=CREAM, spacing=2)
    add_footer(canvas)
    save(canvas, "01-whats-open-today.jpg")


def post_2():
    canvas = base("02-log-every-bird.png", 198, 92)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "Your bag updates live")
    add_headline(draw, "LOG EVERY BIRD.", y=116, size=90)
    draw.text((62, 247), "KNOW WHAT YOU CAN SHOOT NEXT.", font=font(FONT_BODY_BOLD, 30), fill=GOLD)
    add_phone(canvas, FRAMES / "hunt-5-of-6.png", (568, 317, 430, 887), crop_top=88, angle=2)
    draw.rounded_rectangle((46, 852, 520, 1128), radius=30, fill=(8, 36, 29, 235), outline=(217, 168, 46, 255), width=3)
    draw.text((78, 887), "5 / 6", font=font(FONT_HEAD, 102), fill=GOLD)
    draw.text((80, 1000), "ONE DUCK REMAINS\nIN THE DAILY BAG.", font=font(FONT_BODY_BOLD, 28), fill=CREAM, spacing=7)
    add_footer(canvas)
    save(canvas, "02-log-every-bird.jpg")


def post_3():
    canvas = base("03-bag-limit.png", 190, 82)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "Keep the rules within reach")
    add_headline(draw, "STOP DOING\nBAG-LIMIT MATH\nIN THE BLIND.", y=118, size=77)
    add_phone(canvas, FRAMES / "hunt-4-of-6.png", (600, 405, 402, 800), crop_top=88, angle=-3)
    draw.rounded_rectangle((48, 745, 553, 1086), radius=30, fill=(245, 240, 225, 238), outline=GOLD, width=4)
    draw.text((82, 782), "BLINDIQ\nKEEPS THE COUNT.", font=font(FONT_HEAD, 63), fill=GREEN, spacing=3)
    draw.text((84, 946), "Log each bird and watch your\nremaining bag update.", font=font(FONT_BODY, 27), fill=DARK, spacing=7)
    add_footer(canvas)
    save(canvas, "03-stop-doing-bag-limit-math.jpg")


def post_4():
    canvas = base("04-test-hunt.png", 188, 74)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "Practice the workflow")
    add_headline(draw, "LEARN IT BEFORE\nOPENING DAY.", y=114, size=90)
    add_phone(canvas, FRAMES / "dashboard-partially-open.png", (67, 390, 365, 745), crop_top=90, angle=-5)
    add_phone(canvas, FRAMES / "test-hunt.png", (606, 386, 365, 760), crop_top=88, angle=4)
    draw.rounded_rectangle((326, 809, 755, 937), radius=32, fill=(217, 168, 46, 248), outline=CREAM, width=4)
    tw = draw.textlength("TEST HUNT MODE", font=font(FONT_HEAD, 45))
    draw.text(((W-tw)/2, 842), "TEST HUNT MODE", font=font(FONT_HEAD, 45), fill=DARK)
    add_footer(canvas)
    save(canvas, "04-learn-before-opening-day.jpg")


def post_5():
    canvas = base("05-price.png", 204, 102)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "The waterfowl hunt log")
    add_headline(draw, "YOUR HUNTING\nCOMPANION.", y=118, size=91)
    add_phone(canvas, FRAMES / "account-price-top-v2.png", (605, 341, 370, 780), crop_top=85, angle=2)
    draw.rounded_rectangle((48, 713, 542, 1077), radius=34, fill=(10, 50, 40, 240), outline=GOLD, width=4)
    draw.text((78, 742), "$10.99", font=font(FONT_HEAD, 116), fill=GOLD)
    draw.text((84, 862), "/ YEAR", font=font(FONT_BODY_BOLD, 29), fill=CREAM)
    draw.line((82, 919, 500, 919), fill=(217, 168, 46, 170), width=3)
    draw.text((82, 947), "ON ANY INTERNET-\nCONNECTED DEVICE", font=font(FONT_BODY_BOLD, 28), fill=CREAM, spacing=7)
    add_footer(canvas)
    save(canvas, "05-only-10-99-year.jpg")


def post_6():
    canvas = base("06-workflow.png", 198, 92)
    draw = ImageDraw.Draw(canvas)
    add_logo(canvas)
    add_kicker(draw, "One simple workflow")
    add_headline(draw, "SHOT. LOGGED.\nUPDATED.", y=116, size=96)
    items = [
        (FRAMES / "dashboard-partially-open.png", 56, 420, -4, "1  START"),
        (FRAMES / "hunt-2-of-6.png", 370, 382, 0, "2  LOG"),
        (FRAMES / "hunt-summary.png", 684, 420, 4, "3  SAVE"),
    ]
    for path, x, y, angle, label in items:
        add_phone(canvas, path, (x, y, 340, 690), crop_top=88, angle=angle)
        draw.rounded_rectangle((x + 25, 1083, x + 315, 1160), radius=22, fill=(217, 168, 46, 245))
        lw = draw.textlength(label, font=font(FONT_BODY_BOLD, 26))
        draw.text((x + (340-lw)/2, 1106), label, font=font(FONT_BODY_BOLD, 26), fill=DARK)
    add_footer(canvas)
    save(canvas, "06-shot-logged-updated.jpg")


def post_7():
    canvas = cover(Image.open(BACKGROUNDS / "07-brand-promise.png"))
    canvas = add_vertical_overlay(canvas, 155, 120)
    draw = ImageDraw.Draw(canvas)
    logo = Image.open(ROOT / "public" / "blindiq-logo.png").convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    logo.thumbnail((330, 330), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((W-logo.width)//2, 68))
    draw.rounded_rectangle((78, 405, 1002, 1017), radius=38, fill=(5, 30, 24, 190), outline=(217, 168, 46, 210), width=4)
    headline = "HUNT WITH\nCONFIDENCE."
    hb = draw.multiline_textbbox((0,0), headline, font=font(FONT_HEAD, 112), spacing=1)
    hw = hb[2]-hb[0]
    draw.multiline_text(((W-hw)/2, 470), headline, font=font(FONT_HEAD, 112), fill=CREAM, spacing=1, align="center")
    sub = "LOG HUNTS. KNOW THE REGS."
    sw = draw.textlength(sub, font=font(FONT_BODY_BOLD, 31))
    draw.text(((W-sw)/2, 742), sub, font=font(FONT_BODY_BOLD, 31), fill=GOLD)
    draw.line((250, 807, 830, 807), fill=(217, 168, 46, 185), width=3)
    price = "$10.99 / YEAR"
    pw = draw.textlength(price, font=font(FONT_HEAD, 66))
    draw.text(((W-pw)/2, 840), price, font=font(FONT_HEAD, 66), fill=WHITE)
    draw.rounded_rectangle((275, 1052, 805, 1151), radius=29, fill=(217, 168, 46, 245))
    cta = "START YOUR HUNT LOG"
    cw = draw.textlength(cta, font=font(FONT_BODY_BOLD, 27))
    draw.text(((W-cw)/2, 1084), cta, font=font(FONT_BODY_BOLD, 27), fill=DARK)
    add_footer(canvas, "BLINDIQ.APP", "HUNT WITH CONFIDENCE")
    save(canvas, "07-hunt-with-confidence.jpg")


if __name__ == "__main__":
    post_1()
    post_2()
    post_3()
    post_4()
    post_5()
    post_6()
    post_7()
    print(f"Created 7 posts in {POSTS}")
