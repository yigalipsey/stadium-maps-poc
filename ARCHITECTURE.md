# Stadium Maps Architecture

This document explains how interactive stadium seating maps work end-to-end, from source data to rendered canvas. The current repo is a proof-of-concept; this document is written so the architecture can be rebuilt in a production system where data comes from a secure backend API.

---

## 1. Philosophy

Every stadium has two pieces of data:

| What | Where | Example |
|------|-------|---------|
| **Section geometry** | Polygon outlines of every seating block | `sections[].points: [x1,y1, x2,y2, ...]` |
| **Pitch geometry** | Position & size of the football pitch | `pitch.grass: { x, y, width, height, rx }` |

**Both live in the same data file.** The frontend component (`StadiumMap`) is completely generic — it knows nothing about any specific stadium. It reads the data object and renders whatever it finds.

To add a new stadium: create one data file with sections + pitch config. No component changes needed.

---

## 2. The Data File Format

Each stadium is described by a single JSON object with this shape:

```typescript
interface StadiumMapData {
  /** Human-readable name (informational only) */
  stadium: string;

  /** The SVG viewBox string from the original source.
   *  Used by the renderer to compute scale and center the canvas. */
  viewBox: string;   // e.g. "0 0 1500 1500" or "-222 -180 445 360"

  /** Pitch geometry — tells the renderer where and how big the grass is. */
  pitch: PitchConfig;

  /** Every individual seating block in the stadium. */
  sections: SectionData[];
}
```

### 2.1 Sections

```typescript
interface SectionData {
  /** Unique block ID — matches the original SVG data-block attribute. */
  id: string;

  /** Flat coordinate array in Konva format: [x1, y1, x2, y2, ...].
   *  These are SVG-path coordinate pairs, pre-flattened from path strings.
   *  A rectangle might be: [0, 0, 100, 0, 100, 50, 0, 50]
   */
  points: number[];

  /** Visible label displayed on the block (section number). */
  label: string | null;

  /** Pre-computed centroid (average of all points) for label positioning. */
  cx: number;
  cy: number;
}
```

### 2.2 Pitch Configuration

```typescript
interface PitchConfig {
  /** Optional SVG transform for the pitch group.
   *  Some SVGs embed the pitch inside a <g transform="matrix(...)">.
   *  If provided, the renderer wraps the pitch in a Konva Group with this transform.
   *  If omitted, no transform is applied (the grass uses raw SVG coordinates). */
  transform?: {
    scaleX: number;
    scaleY: number;
    x: number;    // translateX
    y: number;    // translateY
  };

  /** The green grass rectangle (rounded). These are the ONLY dimensions
   *  that must be manually measured from the source SVG. Everything else
   *  (center line, penalty areas) is derived proportional to this rect. */
  grass: {
    x: number;       // left edge
    y: number;       // top edge
    width: number;
    height: number;
    rx: number;      // corner radius for rounded pitches
  };

  /** White boundary lines inside the grass. */
  boundary: { x: number; y: number; width: number; height: number; strokeWidth?: number };

  /** Center line, circle, dot */
  centerLine: { x: number; y1: number; y2: number };
  centerCircle: { cx: number; cy: number; r: number };
  centerDot: { cx: number; cy: number; r: number };

  /** Penalty areas */
  penaltyLeft: { x: number; y: number; width: number; height: number };
  goalLeft: { x: number; y: number; width: number; height: number };
  penaltyRight: { x: number; y: number; width: number; height: number };
  goalRight: { x: number; y: number; width: number; height: number };

  /** Penalty spots */
  penaltySpotLeft: { cx: number; cy: number; r: number };
  penaltySpotRight: { cx: number; cy: number; r: number };

  /** Optional zoom multiplier. 1.0 by default.
   *  Values > 1 make the stadium appear larger on screen.
   *  Values < 1 make it smaller (more padding around it). */
  zoom?: number;
}
```

---

## 3. The Data Pipeline (Source → JSON)

```
┌──────────────┐
│  Source SVG   │  (Inkscape / Illustrator — stadium seat plan)
│  Each path    │
│  = one block  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│  1. ingest.py (Python)       │
│                               │
│  - Parses every <path>       │
│  - Converts SVG commands     │
│    (M, L, C, Q, A, Z) to    │
│    flat point arrays          │
│  - Outputs sections[] with    │
│    points + centroids        │
│                               │
│  Uses: svg.path, shapely      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  2. Manual pitch measurement ├──┐
│                               │  │ Measure 4 corners of the
│  Open SVG in Inkscape.        │  │ pitch rectangle in SVG
│  Find the pitch <rect> or     │  │ coordinate space.
│  <path> element.              │  │ Write these into the JSON
│  Record its position & size.  │  │ pitch.grass field.
└───────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  3. Final JSON                │
│  {                           │
│    stadium, viewBox,          │
│    pitch: { grass, boundary,  │
│             centerLine, ... },│
│    sections: [...]            │
│  }                            │
└──────────────────────────────┘
```

### 3.1 Key Detail: ingest.py

The Python script `scripts/ingest.py` converts SVG path data into flat coordinate arrays:

1. Parse the SVG path string with `svg.path.parse_path()`
2. Sample 120 points uniformly along the path using `path.point(t)` for t = 0..1
3. Remove duplicate consecutive points
4. Build a Shapely `Polygon` from the points
5. Simplify with tolerance = 0.5 (removes redundant collinear points)
6. Extract the exterior coordinates into a flat array: `[x1, y1, x2, y2, ...]`
7. Compute the geometric centroid using Shapely

The output is a simple array of numbers — no SVG string remains.

---

## 4. Frontend Rendering

### 4.1 Component Tree

```
Page (app/page.tsx)
  │
  ├── Stadium selector bar (Bernabéu / Emirates / ...)
  │
  └── <StadiumMap data={...} />
        │
        ├── measures container div → stageSize (responsive)
        │
        ├── computes scale from viewBox + container size:
        │     scale = min(containerW / viewboxW,
        │                  containerH / viewboxH) * 0.9
        │     groupX = center via viewBox min + scale
        │     groupY = center via viewBox min + scale
        │
        └── <Stage width={...} height={...}>
              └── <Layer>
                    └── <Group x={groupX} y={groupY} scaleX={scale} scaleY={scale}>
                          ├── <StadiumPitch config={data.pitch} />
                          │     └── grass rect (rounded)
                          │     └── boundary lines
                          │     └── center line + circle
                          │     └── penalty areas + goals
                          │
                          └── <SectionBlock /> × N
                                └── <Line points={...} closed={true} />
                                └── <Text label at centroid />
```

### 4.2 Component Responsibilities

| Component | Role | Props |
|-----------|------|-------|
| `StadiumMap` | Generic canvas — measures container, computes scale, manages hover/select state, renders pitch + all sections | `data: StadiumMapData` |
| `StadiumPitch` | Renders the football pitch (grass, lines, circles) from a config object | `config: PitchConfig`, `scale: number` |
| `SectionBlock` | Renders a single seating block (polygon + label) with hover/click interaction | `section`, `isActive`, `isHovered`, `onHover`, `onClick` |

### 4.3 Visual States

Each section block has three visual states:

| State | Fill | Stroke |
|-------|------|--------|
| Default | `#1e293b` (dark slate) | `#334155` (dim gray) |
| Hovered | `#3b82f6` (blue-500) | `#ffffff` (white) |
| Selected | `#1d4ed8` (blue-700) | `#ffffff` (white) |

Blocks whose `id` starts with `"0"` or `"technical"` are non-interactive (structural elements only).

### 4.4 Dynamic Loading (SSR Bailout)

All canvas components use `next/dynamic` with `ssr: false` because Konva requires browser APIs (`window`, `canvas`, `requestAnimationFrame`) that do not exist on the server:

```tsx
const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });
```

The fallback while loading is an empty filled div (no loading spinner needed — the user sees a black background expanding to fill the container, then the canvas appears).

### 4.5 Responsive Sizing

The container div is measured with `useRef` + `useEffect` + `resize` event listener:

```ts
useEffect(() => {
  const handleResize = () => {
    if (containerRef.current) {
      setStageSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  };
  handleResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

On the first render (before any resize event fires), stageSize is `{ width: 0, height: 0 }`. The component returns a placeholder div with `minHeight: 500px` to reserve space. Once the resize handler fires, the Konva Stage renders at the actual container dimensions.

---

## 5. Scaling to Many Stadiums

### 5.1 Adding a New Stadium

```
Steps:
  1. Get the source SVG (from ticket vendor, Inkscape, etc.)
  2. Run:  python scripts/ingest.py --input stadium.svg --name "StadiumName"
  3. Open SVG in Inkscape, measure the pitch rectangle →
     Write pitch.grass, pitch.boundary, and other fields into the JSON.
  4. Add the JSON file to data/StadiumName_flat.json
  5. Add one entry in app/page.tsx:
       import stadiumName from "@/data/StadiumName_flat.json";
       { id: "stadium-name", name: "Stadium Name", data: stadiumName },
  6. Done — no code changes needed.
```

### 5.2 Measuring the Pitch (The Manual Step)

The only manual work is measuring the pitch rectangle in the source SVG. This is required because stadium SVGs come from various sources with inconsistent structure (some have `<rect>`, some have `<path>`, some have `<g transform>`).

**How to measure:**
1. Open the SVG in Inkscape.
2. Find the grass / field rectangle (usually a green-filled `<path>` or `<rect>`).
3. Use Inkscape's XML Editor (Ctrl+Shift+X) to inspect the element's attributes.
4. Record its `x`, `y`, `width`, `height`, and `rx` (if rounded).
5. If the pitch is inside a `<g transform="matrix(a,b,c,d,e,f)">`, also record the matrix values.

---

## 6. Requirements for Production

This POC reads JSON files directly from the filesystem. In a production system:

### 6.1 Data Delivery (Backend API)

Replace the static JSON import with a secure API call. The data structure stays the same.

```typescript
// Client (Next.js BFF route)
// app/api/venues/[slug]/map/route.ts
export async function GET(req, { params }) {
  const { slug } = params;
  const res = await fetch(`https://api.ticketagent.com/venues/${slug}/map`, {
    headers: { "Authorization": `Bearer ${BACKEND_API_KEY}` },
  });
  const data = await res.json();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      "Cache-Tag": `venue-map-${slug}`,
    },
  });
}

// Client component
const res = await fetch(`/api/venues/bernabeu`);
const data = await res.json();
```

### 6.2 Caching

Stadium map data is static (it only changes when a stadium is renovated or the SVG is re-exported). Cache aggressively:

| Layer | Strategy | TTL |
|-------|----------|-----|
| CDN / Vercel Edge | `stale-while-revalidate` | 24 hours |
| Browser | `Cache-Control` | 1 hour |
| Backend | Redis or in-memory | Until deployment |

### 6.3 Security (SVG Injection)

The original SVG path strings (`M446.83,205.58h28.63...`) are never sent to the client. Only pre-computed numeric arrays (`[446.83, 205.58, 475.45, 205.58, ...]`) leave the server. This means:

- No SVG parser is needed on the frontend.
- No SVG injection attack vector.
- The data is validatable (every other number is an x-coordinate, etc.).

### 6.4 TypeScript Types

Shared between frontend and backend:

```typescript
// shared/types/stadium-map.ts

export interface StadiumMapData {
  stadium: string;
  viewBox: string;
  pitch: PitchConfig;
  sections: SectionData[];
}

export interface SectionData {
  id: string;
  points: number[];      // [x1, y1, x2, y2, ...]
  label: string | null;
  cx: number;
  cy: number;
}

export interface PitchConfig {
  transform?: { scaleX: number; scaleY: number; x: number; y: number };
  grass: { x: number; y: number; width: number; height: number; rx: number };
  boundary: { x: number; y: number; width: number; height: number; strokeWidth?: number };
  centerLine: { x: number; y1: number; y2: number };
  centerCircle: { cx: number; cy: number; r: number };
  centerDot: { cx: number; cy: number; r: number };
  penaltyLeft: { x: number; y: number; width: number; height: number };
  goalLeft: { x: number; y: number; width: number; height: number };
  penaltyRight: { x: number; y: number; width: number; height: number };
  goalRight: { x: number; y: number; width: number; height: number };
  penaltySpotLeft: { cx: number; cy: number; r: number };
  penaltySpotRight: { cx: number; cy: number; r: number };
  zoom?: number;
}
```

---

## 7. Normalization (Optional)

For multi-stadium comparison views (not yet implemented in this POC), the `scripts/normalize_stadiums.py` script transforms every stadium's coordinate system so the pitch is always centered at `(0,0)` with FIFA-standard dimensions `105×68`.

This allows:

- Rendering all stadiums with the SAME `FootballPitch` component at identical pixel size.
- Switching between stadiums without jarring scale changes.
- Using a fixed canonical viewport for the camera.

The normalization pipeline:

```
SVG with pitch corners →  scale + translate matrix  →  normalized JSON
                              │
                              ▼
                        pitch center = (0,0)
                        pitch size   = 105 × 68
                        all sections  transformed by same matrix
```

The normalization uses only scale + translate (no rotation, no shear) and validates that the 4 source pitch corners map to exactly `±(52.5, 34)` within 0.01 tolerance.

---

## 8. File Inventory (This POC)

| File | Role |
|------|------|
| `src/app/page.tsx` | Root page — stadium selector + renders StadiumMap |
| `src/app/layout.tsx` | Minimal Next.js root layout |
| `src/components/StadiumMap.tsx` | Generic canvas — responsive, hover/select, renders pitch + sections |
| `src/components/StadiumPitch.tsx` | Config-driven pitch renderer (grass, lines, penalties) |
| `src/data/Bernabeu_flat.json` | Bernabéu data — 263 sections |
| `src/data/Emirates_flat.json` | Emirates data — 120 sections |
| `scripts/ingest.py` | Python SVG → flat coordinate converter |
| `scripts/normalize_stadiums.py` | Python normalizer (pitch center = 0,0, 105×68) |
| `scripts/compute_viewport.py` | Python utility to compute canonical viewport from all normalised JSONs |

---

## 9. Production Feature Structure (Recommended)

For the real application using Feature-Sliced Design:

```
features/stadium-map/
├── index.ts                         # barrel — exports GenericStadiumCanvas
├── types.ts                         # StadiumMapData, SectionData, PitchConfig
├── components/
│   ├── GenericStadiumCanvas.tsx      # main "use client" component (dynamic import target)
│   ├── SectionBlock.tsx             # individual section (Line + Text label)
│   ├── FootballPitch.tsx            # pitch overlay (config-driven, same as StadiumPitch)
│   └── StadiumSelector.tsx          # top bar for switching venues
├── server/
│   └── get-venue-map.ts            # server-only: fetches from BFF with caching
└── queries/
    └── use-venue-map.ts            # React Query hook (or similar) with stale-while-revalidate

app/api/venues/[slug]/map/route.ts   # BFF proxy → NestJS backend
shared/lib/api/venues.ts             # server-only fetcher (fetchVenueMap)
shared/lib/types/venue.ts            # VenueDto, VenueMapResponse
```

---

## 10. Dependencies

| Library | Purpose |
|---------|---------|
| `react-konva` | React wrapper for Konva.js (2D canvas library) |
| `konva` | GPU-accelerated canvas rendering engine |
| `svg.path` (Python) | Robust SVG path parser (handles M, L, C, Q, A, Z) |
| `shapely` (Python) | Polygon simplification + geometry operations |
