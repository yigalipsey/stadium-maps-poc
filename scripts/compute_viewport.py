"""
compute_viewport.py — Scan all normalized stadium JSONs and print the
canonical viewport that covers every stadium with a given padding margin.

Usage:  python scripts/compute_viewport.py
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
NORMALIZED_DIR = PROJECT_ROOT / "src" / "data" / "normalized"
PADDING = 20  # same as normalize_stadiums.py


def main() -> None:
    files = sorted(NORMALIZED_DIR.glob("*.json"))
    if not files:
        print("❌ No normalized stadium JSONs found.")
        return

    all_x, all_y = [], []
    for fp in files:
        with open(fp) as f:
            data = json.load(f)
        for s in data["sections"]:
            coords = s["coords"]
            all_x.extend(coords[::2])
            all_y.extend(coords[1::2])
        print(f"  {fp.name}: {len(data['sections'])} sections")

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    # Square viewport centered at origin (0,0) — pitch center
    max_extent = max(abs(min_x), abs(max_x), abs(min_y), abs(max_y)) + PADDING
    size = 2 * max_extent

    print()
    print(f"Raw bounds:  X=[{min_x:.1f}, {max_x:.1f}]  Y=[{min_y:.1f}, {max_y:.1f}]")
    print(f"Max extent from origin: {max_extent - PADDING:.1f} + {PADDING} pad = {max_extent:.1f}")
    print()
    print("// Paste into GenericStadiumNormalized.tsx + BernabeuMapNormalized.tsx:")
    print(f"const CANONICAL_VIEWPORT = {{")
    print(f"  width: {size:.0f},")
    print(f"  height: {size:.0f},")
    print(f"}};")


if __name__ == "__main__":
    main()
