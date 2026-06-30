"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Group, Text } from "react-konva";
import StadiumPitch from "./StadiumPitch";

// ── Props ──────────────────────────────────────────────
export interface StadiumData {
  stadium: string;
  viewBox: string;
  pitch: any;
  sections: { id: string; points: number[]; label: string | null; cx: number; cy: number; technical?: boolean }[];
}

interface Props {
  data: StadiumData;
  zoom?: number;       // pre-zoom multiplier: 0.85 = smaller, 1 = default
  highlightRange?: [number, number] | null; // [min, max] for section-id range highlight
}

// ── Helpers ────────────────────────────────────────────
/** Parse numeric block ID: "703" → 703, "PALCO" → null */
const numericId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
};

/** Check if block's numeric ID falls in [min, max] */
const inRange = (id: string, range: [number, number] | null | undefined): boolean => {
  if (!range) return false;
  const n = numericId(id);
  return n !== null && n >= range[0] && n < range[1];
};

// ── Section block ──────────────────────────────────────
const SectionBlock: React.FC<{
  section: { id: string; points: number[]; label: string | null; cx: number; cy: number; technical?: boolean };
  isActive: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  scale: number;
  fontSize: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ section, isActive, isHovered, isHighlighted, scale, fontSize, onHover, onClick }) => {
  const isTech = section.technical === true;

  // Priority: active > hovered > highlighted > default
  const fill = isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : isHighlighted ? "#f59e0b" : "#1e293b";
  const stroke = isActive || isHovered ? "#fff" : isHighlighted ? "#fbbf24" : "#334155";

  return (
    <Group>
      <Line
        points={section.points}
        closed={true}
        fill={fill}
        stroke={stroke}
        strokeWidth={isHighlighted && !isActive && !isHovered ? 0.6 / scale : 1 / scale}
        onMouseEnter={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "pointer"; onHover(section.id); }}
        onMouseLeave={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "default"; onHover(null); }}
        onClick={() => !isTech && onClick(section.id)}
        onTap={() => !isTech && onClick(section.id)}
        listening={!isTech}
      />
      {section.label && !isTech && (
        <Text x={section.cx} y={section.cy} text={section.label} fontSize={fontSize}
          fill="#facc15" fontStyle="bold" align="center" verticalAlign="middle"
          width={fontSize * 3.5} height={fontSize * 1.8}
          offsetX={fontSize * 1.75} offsetY={fontSize * 0.9}
          listening={false} />
      )}
    </Group>
  );
};

// ── Zoom limits ─────────────────────────────────────────
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 6.0;
const ZOOM_SPEED = 1.08;

// ── Generic Stadium Map ────────────────────────────────
export default function StadiumMap({ data, zoom: preZoom = 1, highlightRange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Zoom + pan — all owned by React state (no imperative stage.x() calls)
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    const h = () => { if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
    h(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  if (stageSize.width === 0) return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />;

  // Fixed inner group: just the viewBox → screen mapping (never changes with zoom)
  const [vbMinX, vbMinY, vbW, vbH] = data.viewBox.split(" ").map(Number);
  const baseScale = Math.min(stageSize.width / vbW, stageSize.height / vbH) * 0.9 * preZoom;
  const baseX = (stageSize.width - vbW * baseScale) / 2 - vbMinX * baseScale;
  const baseY = (stageSize.height - vbH * baseScale) / 2 - vbMinY * baseScale;

  const totalScale = baseScale * zoom;

  // Per-stadium font size — proportional to viewBox so text fits blocks
  const fontSize = vbH * 0.011;

  // ── Wheel: zoom toward cursor ──────────────────────────
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newZoom = direction > 0 ? zoom * ZOOM_SPEED : zoom / ZOOM_SPEED;
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    // Keep the point under cursor fixed
    const ratio = newZoom / zoom;
    setPanX(pointer.x - (pointer.x - panX) * ratio);
    setPanY(pointer.y - (pointer.y - panY) * ratio);
    setZoom(newZoom);
  };

  // ── Drag: sync Konva → React when drag ends ────────────
  const handleDragEnd = (e: any) => {
    setPanX(e.target.x());
    setPanY(e.target.y());
    setIsPanning(false);
  };

  // ── Double-click / double-tap: reset ────────────────────
  const handleDoubleClick = () => {
    setZoom(1); setPanX(0); setPanY(0);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#000", overflow: "hidden",
        cursor: isPanning ? "grabbing" : "grab",
        position: "relative",
        touchAction: "none",
        WebkitUserSelect: "none" as any,
        userSelect: "none" as any,
      }}
    >
      <Stage
        width={stageSize.width} height={stageSize.height}
        scaleX={zoom} scaleY={zoom}
        x={panX} y={panY}
        draggable
        onWheel={handleWheel}
        onDragStart={() => setIsPanning(true)}
        onDragEnd={handleDragEnd}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
      >
        <Layer>
          <Group x={baseX} y={baseY} scaleX={baseScale} scaleY={baseScale}>
            <StadiumPitch config={data.pitch} scale={totalScale} />
            {data.sections.map((s, i) => (
              <SectionBlock key={i} section={s} scale={totalScale} fontSize={fontSize}
                isActive={selected === s.id} isHovered={hovered === s.id}
                isHighlighted={inRange(s.id, highlightRange)}
                onHover={setHovered} onClick={setSelected} />
            ))}
          </Group>
        </Layer>
      </Stage>

      {/* Zoom badge */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontFamily: "monospace", pointerEvents: "none" }}>
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom buttons */}
      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <button
          onClick={() => {
            const newZoom = Math.min(MAX_ZOOM, zoom * ZOOM_SPEED);
            setZoom(newZoom);
          }}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.6)", color: "#fff",
            fontSize: 20, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, padding: 0,
          }}
        >+</button>
        <button
          onClick={() => {
            const newZoom = Math.max(MIN_ZOOM, zoom / ZOOM_SPEED);
            setZoom(newZoom);
          }}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.6)", color: "#fff",
            fontSize: 20, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, padding: 0,
          }}
        >−</button>
      </div>
    </div>
  );
}
