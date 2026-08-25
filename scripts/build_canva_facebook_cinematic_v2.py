from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageChops
import random

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / "outputs" / "social-package"
LAND = ROOT / "outputs" / "canva-facebook-landscape"
V2 = ROOT / "outputs" / "canva-facebook-cinematic-v2"
PKG = ROOT / "outputs" / "canva-facebook-cinematic-v3-website-app"
OUT = PKG / "posts"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
GREEN = "#0b342b"
DARK = "#041a15"
CREAM = "#f2eee3"
GOLD = "#d9aa45"
WHITE = "#fffdf7"

HEAD = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
BOLD = "/Library/Fonts/DejaVuLGCSansCondensed-Bold.ttf"
BODY = "/Library/Fonts/DejaVuLGCSansCondensed.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def cover(path, center=(0.5, 0.5)):
    im = Image.open(path).convert("RGB")
    return ImageOps.fit(im, (W, H), method=Image.Resampling.LANCZOS, centering=center).convert("RGBA")


def darken(im, alpha=88):
    return Image.alpha_composite(im, Image.new("RGBA", im.size, (2, 14, 11, alpha)))


def left_gradient(im, start=120, end=0):
    layer = Image.new("RGBA", im.size)
    px = layer.load()
    for x in range(W):
        a = int(start * max(0, 1 - x / (W * 0.68)) + end)
        for y in range(H):
            px[x, y] = (0, 10, 8, min(255, a))
    return Image.alpha_composite(im, layer)


def logo(width=142):
    im = Image.open(ROOT / "public" / "blindiq-logo.png").convert("RGBA")
    if im.getbbox():
        im = im.crop(im.getbbox())
    im.thumbnail((width, width), Image.Resampling.LANCZOS)
    return im


def add_logo(c, x=38, y=443, width=132):
    lg = logo(width)
    shadow = Image.new("RGBA", (lg.width + 34, lg.height + 34), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((17, 17, lg.width + 17, lg.height + 17), 22, fill=(0, 0, 0, 175))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    c.alpha_composite(shadow, (x - 17, y - 17))
    c.alpha_composite(lg, (x, y))


def distress_text(c, xy, text, size, fill=CREAM, stroke=0, max_width=None, spacing=-5, seed=7):
    f = font(HEAD, size)
    d = ImageDraw.Draw(c)
    lines = []
    if max_width:
        line = ""
        for word in text.split():
            test = (line + " " + word).strip()
            if line and d.textlength(test, font=f) > max_width:
                lines.append(line)
                line = word
            else:
                line = test
        if line:
            lines.append(line)
    else:
        lines = text.split("\n")
    block = "\n".join(lines)
    bbox = d.multiline_textbbox((0, 0), block, font=f, spacing=spacing, stroke_width=stroke)
    tw, th = bbox[2] - bbox[0] + 8, bbox[3] - bbox[1] + 8
    mask = Image.new("L", (tw, th), 0)
    md = ImageDraw.Draw(mask)
    md.multiline_text((4, 4 - bbox[1]), block, font=f, fill=255, spacing=spacing, stroke_width=stroke, stroke_fill=255)
    rnd = random.Random(seed)
    speckles = Image.new("L", mask.size, 255)
    sd = ImageDraw.Draw(speckles)
    for _ in range(max(80, tw * th // 1300)):
        x, y = rnd.randrange(max(1, tw)), rnd.randrange(max(1, th))
        r = rnd.choice((1, 1, 1, 2))
        sd.ellipse((x-r, y-r, x+r, y+r), fill=rnd.choice((35, 70, 110)))
    mask = ImageChops.multiply(mask, speckles)
    ink = Image.new("RGBA", mask.size, fill)
    ink.putalpha(mask)
    c.alpha_composite(ink, xy)
    return len(lines), th


def gold_sub(c, text, x, y, size=28, line=True):
    d = ImageDraw.Draw(c)
    if line:
        d.rectangle((x, y - 13, x + 82, y - 10), fill=GOLD)
    d.text((x, y), text, font=font(BOLD, size), fill=GOLD)


def cta(c, text):
    d = ImageDraw.Draw(c)
    y = H - 47
    d.rectangle((0, y, W, H), fill=(3, 26, 21, 242))
    d.text((28, y + 13), text.upper(), font=font(BOLD, 16), fill=CREAM)
    right = "WEBSITE APP  •  BLINDIQ.APP"
    rf = font(BOLD, 16)
    rw = d.textlength(right, font=rf)
    d.text((W - rw - 28, y + 12), right, font=rf, fill=GOLD)


def screen_crop(path, size, crop_top=82, center=(0.5, 0.05)):
    im = Image.open(path).convert("RGB")
    im = im.crop((0, min(crop_top, im.height - 20), im.width, im.height))
    return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=center)


def insert_master_screen(c, path, crop_top=82, center=(0.5, 0.05)):
    # Coordinates match the blank screen of the AI-generated landscape master.
    box = (801, 87, 1059, 555)
    w, h = box[2] - box[0], box[3] - box[1]
    im = screen_crop(path, (w, h), crop_top, center)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), 29, fill=255)
    c.paste(im, (box[0], box[1]), mask)
    # Subtle glass and border preserve the device realism.
    d = ImageDraw.Draw(c)
    d.rounded_rectangle(box, 30, outline=(219, 174, 84, 135), width=2)


def framed_phone(path, width=270, height=500, crop_top=82, center=(0.5, 0.05)):
    im = screen_crop(path, (width - 14, height - 14), crop_top, center)
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), 26, fill=255)
    phone = Image.new("RGBA", (width, height), (2, 8, 7, 255))
    phone.paste(im, (7, 7), mask)
    ImageDraw.Draw(phone).rounded_rectangle((1, 1, width - 2, height - 2), 31, outline=(222, 176, 83, 255), width=4)
    return phone


def add_phone(c, path, x=840, y=80, width=270, height=500, angle=0, crop_top=82, center=(0.5, 0.05)):
    ph = framed_phone(path, width, height, crop_top, center)
    if angle:
        ph = ph.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    sh = Image.new("RGBA", (ph.width + 50, ph.height + 50), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((25, 25, ph.width + 25, ph.height + 25), 35, fill=(0, 0, 0, 180))
    sh = sh.filter(ImageFilter.GaussianBlur(17))
    c.alpha_composite(sh, (x - 25, y - 20))
    c.alpha_composite(ph, (x, y))


def master(path):
    c = cover(V2 / "backgrounds" / "gloved-phone-master.png")
    c = left_gradient(darken(c, 32), 92)
    insert_master_screen(c, path)
    return c


def save(c, name):
    c.convert("RGB").save(OUT / name, quality=96, subsampling=0)


def p1():
    c = master(OLD / "selected-frames" / "dashboard-partially-open.png")
    distress_text(c, (40, 34), "LOOK WHAT THIS WEBSITE APP CAN DO.", 67, max_width=650, seed=11)
    gold_sub(c, "OPEN BLINDIQ.APP IN YOUR BROWSER.", 44, 257, 25)
    add_logo(c, 42, 398, 138)
    cta(c, "Know before you go")
    save(c, "01-look-what-this-app-can-do.jpg")


def p2():
    c = master(OLD / "selected-frames" / "hunt-5-of-6.png")
    distress_text(c, (40, 34), "LOG EVERY BIRD.", 88, max_width=650, seed=22)
    gold_sub(c, "THE WEBSITE APP SHOWS WHAT COMES NEXT.", 44, 171, 23)
    add_logo(c, 42, 398, 138)
    cta(c, "Tag the buddy who always loses count")
    save(c, "02-log-every-bird.jpg")


def p3():
    c = master(OLD / "selected-frames" / "dashboard-partially-open.png")
    distress_text(c, (40, 31), "KNOW WHAT'S OPEN.", 88, max_width=650, seed=33)
    gold_sub(c, "CHECK STATE • ZONE • SEASON ONLINE", 44, 171, 25)
    add_logo(c, 42, 398, 138)
    cta(c, "Check your state before the hunt")
    save(c, "03-know-whats-open.jpg")


def p4():
    c = master(OLD / "selected-frames" / "hunt-4-of-6.png")
    distress_text(c, (40, 31), "STOP DOING BAG-LIMIT MATH.", 69, max_width=670, seed=44)
    gold_sub(c, "THE WEBSITE APP KEEPS THE COUNT.", 44, 249, 25)
    add_logo(c, 42, 398, 138)
    cta(c, "Log it. See what remains.")
    save(c, "04-stop-bag-limit-math.jpg")


def p5():
    c = cover(OLD / "backgrounds" / "05-price.png", center=(0.5, 0.28))
    c = left_gradient(darken(c, 104), 130)
    distress_text(c, (45, 35), "ONLY", 78, max_width=320, seed=55)
    distress_text(c, (42, 122), "$10.99", 150, fill=GOLD, max_width=660, seed=56)
    d = ImageDraw.Draw(c)
    d.text((480, 235), "/ YEAR", font=font(HEAD, 49), fill=GOLD)
    d.text((48, 310), "THE BLINDIQ WEBSITE APP", font=font(BOLD, 27), fill=GOLD)
    d.text((48, 351), "LOG HUNTS. KNOW THE REGS.", font=font(BOLD, 29), fill=CREAM)
    add_logo(c, 870, 350, 176)
    cta(c, "Open in your browser • No app-store download")
    save(c, "05-only-10-99-year.jpg")


def p6():
    c = master(OLD / "selected-frames" / "hunt-summary.png")
    distress_text(c, (40, 32), "SHOT. LOGGED. UPDATED.", 75, max_width=660, seed=66)
    gold_sub(c, "LIVE GUIDANCE INSIDE THE WEBSITE APP.", 44, 246, 25)
    add_logo(c, 42, 398, 138)
    cta(c, "Start • Log • Save")
    save(c, "06-shot-logged-updated.jpg")


def p7():
    c = master(OLD / "selected-frames" / "test-hunt.png")
    distress_text(c, (40, 31), "TEST IT BEFORE OPENING DAY.", 71, max_width=660, seed=77)
    gold_sub(c, "PRACTICE IN THE WEBSITE APP FIRST.", 44, 246, 24)
    add_logo(c, 42, 398, 138)
    cta(c, "Send this to a first-time hunter")
    save(c, "07-test-before-opening-day.jpg")


def p8():
    c = cover(LAND / "backgrounds" / "08-hunt-history.png")
    c = left_gradient(darken(c, 70), 125)
    distress_text(c, (40, 32), "EVERY HUNT. SAVED.", 83, max_width=650, seed=88)
    gold_sub(c, "YOUR HUNT HISTORY — SAVED ONLINE", 44, 174, 25)
    add_phone(c, LAND / "source-frames" / "my-hunts.jpg", 845, 64, 265, 510, -2, crop_top=5)
    add_logo(c, 42, 398, 138)
    cta(c, "Build your waterfowl story")
    save(c, "08-every-hunt-saved.jpg")


def p9():
    c = cover(LAND / "backgrounds" / "09-waterfowl-guide.png")
    c = left_gradient(darken(c, 82), 140)
    distress_text(c, (40, 31), "NOT SURE? CHECK THE BIRD GUIDE.", 67, max_width=650, seed=99)
    gold_sub(c, "REFERENCE GUIDE IN THE WEBSITE APP", 44, 246, 25)
    add_phone(c, OLD / "selected-frames" / "bird-guide.png", 855, 68, 255, 505, 2)
    add_logo(c, 42, 398, 138)
    cta(c, "Save this for the blind")
    save(c, "09-waterfowl-id-guide.jpg")


def p10():
    c = cover(LAND / "backgrounds" / "10-connected-devices.png")
    c = left_gradient(darken(c, 62), 90)
    distress_text(c, (40, 31), "THE WEBSITE APP GOES WHERE YOU HUNT.", 61, max_width=650, seed=101)
    gold_sub(c, "USE ON ANY INTERNET-CONNECTED DEVICE.", 44, 247, 23)
    add_logo(c, 42, 398, 138)
    cta(c, "Share BlindIQ with your hunting crew")
    save(c, "10-any-connected-device.jpg")


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
    print(f"Created 10 cinematic Facebook posts in {OUT}")
