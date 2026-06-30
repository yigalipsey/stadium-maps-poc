"""
normalize_stadiums.py — Scale+translate every stadium so the pitch
is always centered at (0,0) with FIFA standard 105×68 dimensions.

Only scale+translate is used (NO rotation, NO shear) because the
stadium SVGs are already axis-aligned.  A full affine solve from
4 corner correspondences can introduce unwanted shear when the
source corners don't form a perfect rectangle.

Usage:
    python scripts/normalize_stadiums.py

Input:  src/data/{stadium_id}_flat.json   (flat point arrays)
Output: src/data/normalized/{stadium_id}.json

Depends on: numpy, shapely   (pip install numpy shapely)
"""

import json
from pathlib import Path

import numpy as np
from shapely.affinity import affine_transform
from shapely.geometry import Polygon

# ── Config ────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
OUTPUT_DIR = DATA_DIR / "normalized"
TOLERANCE = 0.01

# FIFA standard pitch (the geometric anchor – center at origin)
FIFA_WIDTH = 105.0
FIFA_HEIGHT = 68.0
FIFA_ASPECT = FIFA_WIDTH / FIFA_HEIGHT  # ≈ 1.544

TARGET_TL = np.array([-FIFA_WIDTH / 2, -FIFA_HEIGHT / 2])  # [-52.5, -34]
TARGET_TR = np.array([FIFA_WIDTH / 2, -FIFA_HEIGHT / 2])  # [ 52.5, -34]

# ── Per-stadium pitch corners in ORIGINAL SVG coordinates ─────────────
# Order: top-left, top-right, bottom-right, bottom-left
# These must be the 4 corners of the football pitch rectangle.
# For rounded-corner pitches: use the bounding-box corners of the
# full rectangle, NOT the rounded-off points.
STADIUM_PITCH_CORNERS: dict[str, list[list[float]]] = {
    "bernabeu": [
        [465.0, 609.5],   # top-left
        [1033.0, 609.5],  # top-right
        [1033.0, 987.0],  # bottom-right
        [465.0, 987.0],   # bottom-left
    ],
    "emirates": [
        [-95.0, -65.0],   # top-left
        [95.0, -65.0],    # top-right
        [95.0, 65.0],     # bottom-right
        [-95.0, 65.0],    # bottom-left
    ],
    "etihad": [
        [-140.9, -83.3],  # top-left    (measured from SVG: effective coords)
        [91.2, -83.3],    # top-right
        [91.2, 77.1],     # bottom-right
        [-140.9, 77.1],   # bottom-left
    ],
}


# ── Scale + translate matrix (NO rotation, NO shear) ─────────────────
def compute_scale_translate(
    src: np.ndarray,
) -> tuple[np.ndarray, float, float, float, float]:
    """
    Compute a 3×3 homogeneous matrix that maps the source pitch
    rectangle → FIFA-standard pitch centered at (0,0).

    Uses ONLY uniform scale+translate.  No rotation, no shear.
    Returns (matrix, src_w, src_h, scale_x, scale_y).
    """
    tl, tr, br, bl = src  # top-left, top-right, bottom-right, bottom-left

    src_w = float(np.linalg.norm(tr - tl))   # pitch width in SVG units
    src_h = float(np.linalg.norm(bl - tl))   # pitch height in SVG units

    scale_x = FIFA_WIDTH / src_w
    scale_y = FIFA_HEIGHT / src_h

    # Center of source pitch
    cx = float((tl[0] + br[0]) / 2.0)
    cy = float((tl[1] + br[1]) / 2.0)

    # Translation: move source center → origin, already scaled
    tx = -cx * scale_x
    ty = -cy * scale_y

    matrix = np.array(
        [
            [scale_x, 0.0, tx],
            [0.0, scale_y, ty],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )
    return matrix, src_w, src_h, scale_x, scale_y


# ── Matrix conversion for Shapely ────────────────────────────────────
def matrix3x3_to_shapely(m: np.ndarray) -> list[float]:
    """Convert our 3×3 matrix → Shapely's [a, b, d, e, xoff, yoff]."""
    return [
        float(m[0, 0]),  # a  = scale_x
        float(m[0, 1]),  # b  = 0
        float(m[1, 0]),  # d  = 0
        float(m[1, 1]),  # e  = scale_y
        float(m[0, 2]),  # xoff = tx
        float(m[1, 2]),  # yoff = ty
    ]


# ── Transform one coordinate array through Shapely ────────────────────
def apply_affine_to_coords(
    matrix: np.ndarray, coords: list[float]
) -> tuple[list[float], float, float]:
    """
    Transform a flat Konva coordinate array [x1,y1, x2,y2, ...]
    through the affine matrix.  Uses Shapely for proper geometric
    centroid computation.
    Returns (new_flat_coords, centroid_x, centroid_y).
    """
    pairs = [(coords[i], coords[i + 1]) for i in range(0, len(coords), 2)]
    if len(pairs) < 3:
        return coords, 0.0, 0.0

    poly = Polygon(pairs)
    transformed = affine_transform(poly, matrix3x3_to_shapely(matrix))

    centroid = transformed.centroid
    exterior_coords = list(transformed.exterior.coords)

    # Shapely closes the ring — remove duplicate last point
    if len(exterior_coords) >= 2 and exterior_coords[0] == exterior_coords[-1]:
        exterior_coords = exterior_coords[:-1]

    flat = []
    for x, y in exterior_coords:
        flat.extend([round(x, 3), round(y, 3)])

    return flat, round(centroid.x, 3), round(centroid.y, 3)


# ── Validate ──────────────────────────────────────────────────────────
def validate(
    matrix: np.ndarray, src: np.ndarray, name: str
) -> bool:
    """Check that source corners map to exactly FIFA target corners."""
    src_h = np.hstack([src, np.ones((4, 1))])
    predicted = src_h @ matrix.T
    target = np.array(
        [
            [-52.5, -34.0],
            [52.5, -34.0],
            [52.5, 34.0],
            [-52.5, 34.0],
        ]
    )
    errors = np.abs(predicted[:, :2] - target)
    max_err = errors.max()
    if max_err > TOLERANCE:
        print(
            f"  ⚠️  WARNING [{name}]: max residual = {max_err:.4f} "
            f"(tolerance={TOLERANCE})"
        )
        for i, corner in enumerate(["TL", "TR", "BR", "BL"]):
            print(
                f"      {corner}: expected {target[i]}, "
                f"got {np.round(predicted[i, :2], 4)}"
            )
        return False
    print(f"  ✅ Validation passed (max residual: {max_err:.6f})")
    return True


# ── Compute viewBox ──────────────────────────────────────────────────
def compute_viewbox(all_sections: list[dict], padding: float = 20.0) -> str:
    """Compute tight viewBox from bounding box of all transformed sections."""
    xs, ys = [], []
    for s in all_sections:
        pts = s["coords"]
        xs.extend(pts[::2])
        ys.extend(pts[1::2])
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    w = max_x - min_x + 2 * padding
    h = max_y - min_y + 2 * padding
    return f"{min_x - padding:.1f} {min_y - padding:.1f} {w:.1f} {h:.1f}"


# ── Main ───────────────────────────────────────────────────────────────
def main() -> None:
    print("=" * 60)
    print(" Stadium Normalizer — scale+translate pitch anchor")
    print(f" Target: FIFA {FIFA_WIDTH:.0f}×{FIFA_HEIGHT:.0f}, center (0,0)")
    print("=" * 60)

    if not STADIUM_PITCH_CORNERS:
        print(
            "\n❌ No stadiums configured in STADIUM_PITCH_CORNERS. "
            "Add entries and re-run."
        )
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for stadium_id, src_corners in STADIUM_PITCH_CORNERS.items():
        print(f"\n── {stadium_id} ──")

        # ── Load source data ──
        src_file = DATA_DIR / f"{stadium_id}_flat.json"
        if not src_file.exists():
            src_file = DATA_DIR / f"Bernabeu_flat.json"
        if not src_file or not src_file.exists():
            print(f"  ❌ Source file not found: {src_file}")
            continue

        with open(src_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        sections = data.get("sections", data.get("blocks", []))
        print(f"  Loaded {len(sections)} sections from {src_file.name}")

        # ── Compute scale+translate matrix ──
        src = np.array(src_corners, dtype=np.float64)
        matrix, src_w, src_h, scale_x, scale_y = compute_scale_translate(src)

        # ── Pitch aspect-ratio check ──
        src_aspect = src_w / src_h
        print(f"  Source pitch:  {src_w:.1f} × {src_h:.1f}  (aspect {src_aspect:.4f})")
        print(f"  Target pitch:  {FIFA_WIDTH:.0f} × {FIFA_HEIGHT:.0f}  (aspect {FIFA_ASPECT:.4f})")
        if abs(src_aspect - FIFA_ASPECT) > 0.05:
            print(
                f"  ⚠️  ASPECT WARNING: source aspect ({src_aspect:.4f}) "
                f"≠ FIFA ({FIFA_ASPECT:.4f}).  Pitch corners may be inaccurate.  "
                f"Non-uniform scale X={scale_x:.6f} Y={scale_y:.6f} will be applied."
            )

        print(
            f"  Scale:  X={scale_x:.6f}  Y={scale_y:.6f}"
        )

        # ── Validate ──
        ok = validate(matrix, src, stadium_id)

        # ── Transform each section ──
        transformed = []
        for s in sections:
            sid = s.get("id", s.get("dataBlock", "?"))
            label = s.get("label")
            coords = s.get("points", s.get("coords", []))

            if not coords:
                continue

            new_coords, cx, cy = apply_affine_to_coords(matrix, coords)

            transformed.append(
                {
                    "id": sid,
                    "label": label,
                    "coords": new_coords,
                    "cx": cx,
                    "cy": cy,
                }
            )

        # ── Compute viewBox ──
        viewbox = compute_viewbox(transformed)

        # ── Output ──
        output = {
            "id": stadium_id,
            "viewBox": viewbox,
            "pitchAnchor": {
                "x": 0,
                "y": 0,
                "width": FIFA_WIDTH,
                "height": FIFA_HEIGHT,
            },
            "sections": transformed,
        }

        out_path = OUTPUT_DIR / f"{stadium_id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        # ── Summary ──
        print(f"  Output viewBox:     {viewbox}")
        print(f"  Sections:           {len(transformed)}/{len(sections)}")
        print(f"  Output:             {out_path}")
        if not ok:
            print(f"  ⚠️  VALIDATION FAILED — check pitch corner config")

    print(f"\n{'=' * 60}")
    print(" ✅ Done.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
