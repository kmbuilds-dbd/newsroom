#!/usr/bin/env python3
"""Regenerate the Newsroom PWA icons.

Pure Python standard library only (zlib + struct) — no Pillow dependency,
so it runs in any build environment with python3 (including Vercel).

Design: dark #0f0f1a background with a teal (#4da6a6) "N" monogram, drawn
as vector shapes with 4x4 supersampling for smooth edges. The N stays
inside the center 80% safe zone, so the 512px file works as a maskable icon.

Outputs (relative to the repo root):
  public/icon-192.png       (192x192, manifest "any")
  public/icon-512.png       (512x512, manifest "any maskable")
  public/apple-touch-icon.png (180x180)

The generated PNGs are gitignored — they are rebuilt on every build via
the "prebuild" script in package.json, so the branch never carries binaries.

Usage: python3 scripts/generate-icons.py
"""

import math
import struct
import sys
import zlib
from pathlib import Path

BG = (15, 15, 26)        # #0f0f1a — matches the app's dark theme
LETTER = (77, 166, 166)  # #4da6a6 — teal accent

# "N" geometry in unit coordinates (0..1 across the canvas).
# Left stem, right stem, and a diagonal band from top-left to bottom-right.
LEFT_STEM = (0.24, 0.38)    # x range
RIGHT_STEM = (0.62, 0.76)   # x range
TOP, BOTTOM = 0.22, 0.78    # y range
DIAG_HALF_THICK = 0.055     # half-thickness of the diagonal band
SUPERSAMPLE = 4


def _dist_to_segment(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / seg_len_sq))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))


def _in_letter(x, y):
    """True if unit point (x, y) is inside the N monogram."""
    if not (TOP <= y <= BOTTOM):
        return False
    if LEFT_STEM[0] <= x <= LEFT_STEM[1]:
        return True
    if RIGHT_STEM[0] <= x <= RIGHT_STEM[1]:
        return True
    # Diagonal: from inner-top-left to inner-bottom-right.
    d = _dist_to_segment(x, y, LEFT_STEM[1], TOP, RIGHT_STEM[0], BOTTOM)
    return d <= DIAG_HALF_THICK


def _encode_png(size):
    """Render the icon at `size`x`size` and return PNG bytes (RGB, no filter)."""
    step = 1.0 / SUPERSAMPLE
    raw = bytearray()
    for py in range(size):
        raw.append(0)  # filter type 0 (None) for this scanline
        for px in range(size):
            inside = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    ux = (px + (sx + 0.5) * step) / size
                    uy = (py + (sy + 0.5) * step) / size
                    if _in_letter(ux, uy):
                        inside += 1
            frac = inside / (SUPERSAMPLE * SUPERSAMPLE)
            r = round(BG[0] + (LETTER[0] - BG[0]) * frac)
            g = round(BG[1] + (LETTER[1] - BG[1]) * frac)
            b = round(BG[2] + (LETTER[2] - BG[2]) * frac)
            raw.extend((r, g, b))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)

    def chunk(ctype, payload):
        c = struct.pack(">I", len(payload)) + ctype + payload
        return c + struct.pack(">I", zlib.crc32(ctype + payload) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
        + chunk(b"IEND", b"")
    )


def main():
    root = Path(__file__).resolve().parent.parent
    out_dir = root / "public"
    out_dir.mkdir(exist_ok=True)
    targets = [
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("apple-touch-icon.png", 180),
    ]
    for filename, size in targets:
        path = out_dir / filename
        path.write_bytes(_encode_png(size))
        print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    sys.exit(main())
