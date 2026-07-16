from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
ICON_DIR.mkdir(exist_ok=True)


def create_icon(size: int) -> None:
    scale = size / 512
    image = Image.new("RGBA", (size, size), "#07100b")
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    box = tuple(round(value * scale) for value in (110, 59, 403, 453))
    radius = round(58 * scale)
    shadow_draw.rounded_rectangle(box, radius=radius, fill=(0, 20, 10, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(round(18 * scale)))
    image.alpha_composite(shadow, (0, round(12 * scale)))

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(box, radius=radius, fill="#9cf25d")
    color = "#0a1510"
    draw.rectangle(tuple(round(value * scale) for value in (178, 149, 239, 423)), fill=color)
    draw.rectangle(tuple(round(value * scale) for value in (178, 149, 344, 207)), fill=color)
    draw.rectangle(tuple(round(value * scale) for value in (178, 255, 331, 310)), fill=color)
    draw.rectangle(tuple(round(value * scale) for value in (178, 365, 348, 423)), fill=color)
    image.save(ICON_DIR / f"elog-{size}.png", optimize=True)


for icon_size in (192, 512):
    create_icon(icon_size)
