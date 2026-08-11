"""Готує веб-версії фотографій: jpg + webp, два розміри для srcset."""
from PIL import Image, ImageFilter
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "_source"          # оригінали з OLX (не публікуються)
OUT = ROOT / "assets" / "img"   # веб-версії

# вихідний файл -> ім'я на сайті
MAP = {
    "raw_ijl6qqzpmclp1": "hero",
    "raw_1kwig7rj7vug2": "exterior-1",
    "raw_gvt52mgvcftp1": "interior-1",
    "raw_j620ayvn0cx22": "interior-2",
    "raw_wakwf7hc1ax43": "interior-3",
    "c_top": "frame-1",
    "c_b2": "frame-2",
    "raw_4c94jbmlim221": "frame-3",
    "c_b1": "model-3d",
    "c_b3": "model-red",
    "raw_lw34hzbuap7n1": "dusk-vertical",
}

# фото з малим оригіналом — м'яко збільшуємо
UPSCALE = {"hero": 2.0, "frame-2": 1.8, "frame-3": 2.0, "model-3d": 1.8,
           "model-red": 1.8, "dusk-vertical": 2.0}

FULL, SMALL = 1600, 600


def save(im, stem, width):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{stem}.jpg", quality=84, optimize=True, progressive=True)
    im.save(OUT / f"{stem}.webp", quality=82, method=6)
    return im.size


for src, name in MAP.items():
    im = Image.open(SRC / f"{src}.jpg").convert("RGB")
    if name in UPSCALE:
        k = UPSCALE[name]
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=105, threshold=3))
    full = save(im, name, FULL)
    small = save(im, f"{name}-600", SMALL) if im.width > 700 else None
    print(f"{name:14s} full={full} small={small}")
