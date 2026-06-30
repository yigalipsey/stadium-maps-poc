"""
ingest.py — Convert stadium SVG paths to flat coordinate arrays.

Reads:  src/data/Bernabeu.json   (original: SVG path strings)
Writes: src/data/Bernabeu_flat.json  (new: flat number arrays, zero SVG)

Depends on: svg.path (SVG path parser), shapely (geometry simplification)
Install:    pip install svg.path shapely
"""

import json
import os
import sys
from svg.path import parse_path, Line as SvgLine, CubicBezier, QuadraticBezier, Arc, Close
from shapely.geometry import Polygon, LineString
from shapely import simplify


# ── Config ──────────────────────────────────────────────
INPUT_FILE  = os.path.join(os.path.dirname(__file__), "..", "src", "data", "Bernabeu.json")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "Bernabeu_flat.json")
SAMPLE_COUNT = 120       # points sampled along each SVG path
SIMPLIFY_TOLERANCE = 0.5  # Shapely simplification tolerance (in SVG units)


def sample_path_points(raw_path_str: str, num_samples: int = SAMPLE_COUNT):
    """
    Parse an SVG path string and return a list of (x, y) points
    sampled uniformly in parameter space.
    """
    parsed = parse_path(raw_path_str)

    # svg.path returns a list of path segments; we sample across all of them
    # by walking the parameter t from 0 to 1
    points = []
    for i in range(num_samples + 1):
        t = i / num_samples
        pt = parsed.point(t)
        points.append((pt.real, pt.imag))
    return points


def process_block(block: dict) -> dict | None:
    """Convert one block from SVG-path format to flat-points format."""
    block_id  = block.get("dataBlock", block.get("id", "unknown"))
    raw_path  = block.get("path", "")
    label     = block.get("label")

    if not raw_path:
        print(f"  ⚠️  Block {block_id}: empty path — skipping")
        return None

    try:
        # ── 1. Sample points along the SVG path ──
        sampled = sample_path_points(raw_path)

        # Deduplicate consecutive identical points (svg.path sometimes
        # produces duplicates at segment boundaries)
        deduped = [sampled[0]]
        for pt in sampled[1:]:
            if pt != deduped[-1]:
                deduped.append(pt)

        if len(deduped) < 3:
            print(f"  ⚠️  Block {block_id}: too few unique points ({len(deduped)}) — skipping")
            return None

        # ── 2. Build Shapely geometry & simplify ──
        # Try Polygon first (closed shape); fall back to LineString for open paths
        try:
            geom = Polygon(deduped)
            if not geom.is_valid:
                geom = geom.buffer(0)  # fix self-intersections
        except Exception:
            # Path is likely open / degenerate → use LineString
            geom = LineString(deduped)

        simplified = simplify(geom, tolerance=SIMPLIFY_TOLERANCE, preserve_topology=True)

        # ── 3. Extract flat coordinates ──
        if isinstance(simplified, Polygon) and not simplified.is_empty:
            coords = list(simplified.exterior.coords)
        elif hasattr(simplified, "coords"):
            coords = list(simplified.coords)
        else:
            print(f"  ⚠️  Block {block_id}: simplified geometry is empty — skipping")
            return None

        # Remove the closing duplicate point from Shapely polygons
        # (Konva.Line auto-closes with closed={true})
        if len(coords) >= 3 and coords[0] == coords[-1]:
            coords = coords[:-1]

        # Flatten to [x1, y1, x2, y2, ...]
        flat = []
        for x, y in coords:
            flat.extend([round(x, 2), round(y, 2)])

        # ── 4. Compute centroid ──
        centroid = Polygon(coords).centroid if len(coords) >= 3 else LineString(coords).centroid

        return {
            "id": block_id,
            "label": label,
            "points": flat,
            "cx": round(centroid.x, 2),
            "cy": round(centroid.y, 2),
        }

    except Exception as e:
        print(f"  ❌ Block {block_id}: error — {e}")
        return None


# ── Main ────────────────────────────────────────────────
def main():
    print(f"📂 Reading: {INPUT_FILE}")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    blocks_in  = data.get("blocks", [])
    print(f"   Found {len(blocks_in)} blocks\n")

    new_blocks = []
    errors = 0
    skipped = 0

    for i, block in enumerate(blocks_in):
        bid = block.get("dataBlock", block.get("id", f"block_{i}"))
        print(f"[{i+1}/{len(blocks_in)}] Block {bid} ...", end=" ")
        result = process_block(block)
        if result:
            new_blocks.append(result)
            print(f"✅ {len(result['points'])} coords  |  centroid ({result['cx']}, {result['cy']})")
        else:
            skipped += 1

    output = {
        "stadium": data.get("stadium", "Unknown"),
        "viewBox": data.get("viewBox", "0 0 1500 1500"),
        "sections": new_blocks,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # ── Summary ──
    print(f"\n{'─'*60}")
    print(f"📊 Summary")
    print(f"   Input blocks:  {len(blocks_in)}")
    print(f"   Output blocks: {len(new_blocks)}")
    print(f"   Skipped:       {skipped}")
    print(f"   Output file:   {OUTPUT_FILE}")

    # Size comparison
    old_size = os.path.getsize(INPUT_FILE)
    new_size = os.path.getsize(OUTPUT_FILE)
    print(f"   Old size: {old_size:,} bytes")
    print(f"   New size: {new_size:,} bytes ({new_size/old_size:.0%})")
    print(f"{'─'*60}")
    print("✅ Done.")


if __name__ == "__main__":
    main()
