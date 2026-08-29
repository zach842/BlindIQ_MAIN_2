from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "blindiq-reel-v1"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1920
GREEN = "#0d3b2e"
DEEP_GREEN = "#09271f"
GOLD = "#d9aa3c"
CREAM = "#f5f0e4"
WHITE = "#ffffff"
MUTED = "#d9ddd7"
FONT_HEAD = "/System/Library/Fonts/Supplemental/Impact.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BODY = "/System/Library/Fonts/Supplemental/Arial.ttf"

BACKGROUND = ROOT / "public" / "duck-home-page.png"
LOGO = ROOT / "public" / "blindiq-logo-hunt-log-share-closed-border.png"
APP_LOG = Path("/Users/zach.trautwein/Downloads/IMG_4560.PNG")
APP_SAVE = Path("/Users/zach.trautwein/Downloads/IMG_4561.PNG")
APP_MIGRATION = OUT / "migration-feature-clean.png"
APP_REGS = Path("/Users/zach.trautwein/Downloads/IMG_4556.PNG")


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


def cover(image: Image.Image, width=W, height=H):
    ratio = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def background(extra_dark=0):
    base = cover(Image.open(BACKGROUND).convert("RGB"))
    base = ImageEnhance.Color(base).enhance(0.78)
    base = base.filter(ImageFilter.GaussianBlur(3))
    overlay = Image.new("RGBA", (W, H), (3, 19, 15, 125 + extra_dark))
    base = Image.alpha_composite(base.convert("RGBA"), overlay)
    gradient = Image.new("L", (1, H))
    gp = gradient.load()
    for y in range(H):
        gp[0, y] = int(35 + 190 * (y / H) ** 1.55)
    gradient = gradient.resize((W, H))
    shade = Image.new("RGBA", (W, H), (1, 19, 14, 0))
    shade.putalpha(gradient)
    return Image.alpha_composite(base, shade)


def round_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def phone(canvas, source, x, y, width, height=None, crop_top=0):
    image = Image.open(source).convert("RGB")
    if crop_top:
        image = image.crop((0, crop_top, image.width, image.height))
    if height is None:
        height = round(width * image.height / image.width)
    ratio = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    resized = resized.crop((left, top, left + width, top + height))
    border = 22
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 18, y + 28, x + width + border * 2 + 18, y + height + border * 2 + 28), radius=62, fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(shadow)
    ImageDraw.Draw(canvas).rounded_rectangle((x, y, x + width + border * 2, y + height + border * 2), radius=62, fill="#080d0b", outline=GOLD, width=4)
    mask = round_mask((width, height), 42)
    canvas.paste(resized, (x + border, y + border), mask)


def logo(canvas, x, y, width):
    mark = Image.open(LOGO).convert("RGBA")
    mark.thumbnail((width, width), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, (x + (width - mark.width) // 2, y))


def text_center(draw, text, y, text_font, fill=WHITE, spacing=2):
    box = draw.multiline_textbbox((0, 0), text, font=text_font, spacing=spacing, align="center")
    tw = box[2] - box[0]
    draw.multiline_text(((W - tw) / 2, y), text, font=text_font, fill=fill, spacing=spacing, align="center")


def eyebrow(draw, text, y):
    f = font(FONT_BOLD, 28)
    box = draw.textbbox((0, 0), text, font=f)
    tw = box[2] - box[0]
    draw.text(((W - tw) / 2, y), text, font=f, fill=GOLD)


def pill(draw, text, y, width=760, fill=GOLD, text_fill=DEEP_GREEN):
    x = (W - width) // 2
    draw.rounded_rectangle((x, y, x + width, y + 96), radius=28, fill=fill)
    f = font(FONT_BOLD, 38)
    box = draw.textbbox((0, 0), text, font=f)
    draw.text(((W - (box[2] - box[0])) / 2, y + 24), text, font=f, fill=text_fill)


def footer(canvas, step):
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, H - 96, W, H), fill=DEEP_GREEN)
    draw.text((48, H - 66), "BLINDIQ.APP", font=font(FONT_BOLD, 28), fill=WHITE)
    draw.text((W - 240, H - 66), f"0{step} / 07", font=font(FONT_BOLD, 28), fill=GOLD)


def save_scene(number, canvas):
    footer(canvas, number)
    canvas.convert("RGB").save(OUT / f"scene-{number:02}.png", quality=95)


def build_clean_migration_screen():
    """Create a clean, faithful app-style migration screen for the Reel."""
    sw, sh = 945, 2048
    screen = Image.new("RGB", (sw, sh), CREAM)
    d = ImageDraw.Draw(screen)

    d.rectangle((0, 0, sw, 260), fill="#123d31")
    d.text((68, 84), "BLIND", font=font(FONT_HEAD, 68), fill=WHITE)
    d.text((250, 84), "IQ", font=font(FONT_HEAD, 68), fill=GOLD)
    d.rounded_rectangle((620, 70, 860, 170), radius=50, outline="#dac797", width=4)
    d.text((665, 103), "MIGRATION", font=font(FONT_BOLD, 28), fill=CREAM)

    d.text((44, 330), "BLINDIQ MIGRATION PULSE", font=font(FONT_BOLD, 29), fill=GOLD)
    d.text((44, 395), "Follow the\nflyways.", font=font(FONT_HEAD, 92), fill="#123d31", spacing=-6)
    d.text((44, 595), "Daily movement potential for the Atlantic and\nMississippi Flyways.", font=font(FONT_BODY, 31), fill="#6f7772", spacing=10)

    d.rounded_rectangle((628, 330, 892, 672), radius=28, fill="#09271f", outline=GOLD, width=4)
    d.text((681, 388), "FLYWAY PULSE", font=font(FONT_BOLD, 24), fill=GOLD)
    d.text((674, 458), "26", font=font(FONT_HEAD, 110), fill=WHITE)
    d.text((790, 520), "/100", font=font(FONT_BOLD, 32), fill=MUTED)
    d.text((702, 590), "BUILDING", font=font(FONT_BOLD, 27), fill=MUTED)

    d.rounded_rectangle((44, 720, 456, 840), radius=22, fill="#123d31", outline=GOLD, width=4)
    d.text((105, 752), "Atlantic", font=font(FONT_HEAD, 48), fill=WHITE)
    d.rounded_rectangle((489, 720, 901, 840), radius=22, fill="#fbfaf6", outline="#b8b8ae", width=3)
    d.text((524, 752), "Mississippi", font=font(FONT_HEAD, 46), fill="#123d31")

    d.rounded_rectangle((44, 895, 901, 1900), radius=28, fill="#123d31", outline="#806f40", width=4)
    d.text((86, 948), "REGIONAL MOVEMENT MAP", font=font(FONT_BOLD, 28), fill=GOLD)
    d.text((86, 1010), "Atlantic Flyway", font=font(FONT_HEAD, 72), fill=WHITE)
    d.rounded_rectangle((700, 956, 850, 1014), radius=28, outline="#aa9f77", width=3)
    d.text((725, 972), "SOUTHBOUND", font=font(FONT_BOLD, 18), fill=CREAM)

    regions = [
        ("38", "Northern Atlantic", "ME • NH • VT • MA • NY • PA • NJ"),
        ("31", "Mid Atlantic", "MD • DE • VA • WV"),
        ("22", "South Atlantic", "NC • SC • GA • FL"),
    ]
    y = 1130
    for score, name, states in regions:
        d.rounded_rectangle((88, y, 860, y + 210), radius=25, fill="#244d41", outline="#a09570", width=3)
        d.ellipse((118, y + 42, 250, y + 174), fill="#16392f", outline="#6f897f", width=8)
        d.text((151, y + 73), score, font=font(FONT_HEAD, 52), fill=WHITE)
        d.text((290, y + 52), name, font=font(FONT_BOLD, 34), fill=WHITE)
        d.text((290, y + 112), states, font=font(FONT_BODY, 24), fill=MUTED)
        y += 245

    d.text((82, 1950), "Movement potential, not a guarantee of birds.", font=font(FONT_BOLD, 24), fill="#6f7772")
    screen.save(APP_MIGRATION, quality=95)


def scene_one():
    c = background(5)
    d = ImageDraw.Draw(c)
    logo(c, 390, 95, 300)
    eyebrow(d, "THE WATERFOWL WEBSITE APP", 505)
    text_center(d, "SEND THIS TO A\nDUCK HUNTER.", 565, font(FONT_HEAD, 128), spacing=-4)
    d.line((170, 910, 910, 910), fill=GOLD, width=5)
    text_center(d, "HUNT. LOG. SHARE", 962, font(FONT_BOLD, 52), fill=CREAM)
    text_center(d, "A digital field guide and field log\nbuilt for the blind.", 1090, font(FONT_BODY, 42), fill=MUTED, spacing=14)
    pill(d, "KEEP WATCHING  ↓", 1390, width=680)
    save_scene(1, c)


def scene_two():
    c = background(30)
    d = ImageDraw.Draw(c)
    eyebrow(d, "START THE HUNT", 72)
    text_center(d, "LOG EVERY BIRD.", 116, font(FONT_HEAD, 102))
    text_center(d, "Live bag guidance updates as you go.", 260, font(FONT_BOLD, 34), fill=GOLD)
    phone(c, APP_LOG, 190, 345, 656, 1420)
    save_scene(2, c)


def scene_three():
    c = background(25)
    d = ImageDraw.Draw(c)
    eyebrow(d, "CAPTURE THE DAY", 70)
    text_center(d, "ADD THE\nHARVEST PHOTO.", 112, font(FONT_HEAD, 95), spacing=-5)
    text_center(d, "Your birds. Your hunt. Your field log.", 355, font(FONT_BOLD, 31), fill=GOLD)
    phone(c, APP_SAVE, 202, 435, 632, 1290)
    d.rounded_rectangle((255, 1440, 825, 1584), radius=34, fill=CREAM, outline=GOLD, width=5)
    d.ellipse((292, 1472, 370, 1550), fill=DEEP_GREEN)
    d.rectangle((315, 1491, 348, 1533), outline=GOLD, width=5)
    d.ellipse((324, 1500, 340, 1516), outline=GOLD, width=4)
    d.text((395, 1470), "HARVEST PHOTO", font=font(FONT_BOLD, 30), fill=DEEP_GREEN)
    d.text((395, 1512), "Attach it before saving", font=font(FONT_BODY, 27), fill="#59635f")
    save_scene(3, c)


def scene_four():
    c = background(20)
    d = ImageDraw.Draw(c)
    eyebrow(d, "YOUR DIGITAL FIELD LOG", 70)
    text_center(d, "SAVE THE HUNT.\nSHARE THE STORY.", 112, font(FONT_HEAD, 88), spacing=-5)
    text_center(d, "Photo • harvest • zone • date", 322, font(FONT_BOLD, 31), fill=GOLD)
    phone(c, APP_SAVE, 202, 410, 632, 1360)
    save_scene(4, c)


def scene_five():
    c = background(20)
    d = ImageDraw.Draw(c)
    eyebrow(d, "MIGRATION PULSE", 72)
    text_center(d, "FOLLOW THE\nFLYWAYS.", 118, font(FONT_HEAD, 112), spacing=-8)
    text_center(d, "Atlantic + Mississippi movement potential", 392, font(FONT_BOLD, 31), fill=GOLD)
    phone(c, APP_MIGRATION, 205, 475, 626, 1285)
    save_scene(5, c)


def scene_six():
    c = background(28)
    d = ImageDraw.Draw(c)
    eyebrow(d, "FIELD-READY INFORMATION", 72)
    text_center(d, "DATES + REGS.\nRIGHT THERE.", 118, font(FONT_HEAD, 103), spacing=-8)
    text_center(d, "Choose your state. See the loaded seasons.", 370, font(FONT_BOLD, 31), fill=GOLD)
    phone(c, APP_REGS, 205, 455, 626, 1305)
    save_scene(6, c)


def scene_seven():
    c = background(42)
    d = ImageDraw.Draw(c)
    logo(c, 310, 70, 460)
    text_center(d, "HUNT. LOG. SHARE", 630, font(FONT_HEAD, 100))
    text_center(d, "The digital field guide + field log\nfor waterfowl hunters.", 785, font(FONT_BOLD, 42), fill=CREAM, spacing=12)
    pill(d, "START 7 DAYS FREE", 1095, width=780)
    text_center(d, "THEN ONLY $10.99 / YEAR", 1225, font(FONT_BOLD, 42), fill=WHITE)
    text_center(d, "OPEN BLINDIQ.APP", 1380, font(FONT_HEAD, 72), fill=GOLD)
    text_center(d, "SEND THIS TO A DUCK HUNTER.", 1500, font(FONT_BOLD, 34), fill=MUTED)
    save_scene(7, c)


build_clean_migration_screen()

for creator in (scene_one, scene_two, scene_three, scene_four, scene_five, scene_six, scene_seven):
    creator()

print(OUT)
