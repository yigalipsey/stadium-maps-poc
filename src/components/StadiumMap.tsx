"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Group, Text } from "react-konva";
import StadiumPitch from "./StadiumPitch";

// ── Props ──────────────────────────────────────────────
export interface StadiumData {
  stadium: string;
  viewBox: string;
  pitch: any;
  sections: { id: string; points: number[]; label: string | null; cx: number; cy: number }[];
}

interface Props {
  data: StadiumData;
}

// ── Section block ──────────────────────────────────────
const SectionBlock: React.FC<{
  section: { id: string; points: number[]; label: string | null; cx: number; cy: number };
  isActive: boolean;
  isHovered: boolean;
  scale: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ section, isActive, isHovered, scale, onHover, onClick }) => {
  const isTech = section.id.startsWith("0") || section.id.startsWith("technical");
  return (
    <Group>
      <Line
        points={section.points}
        closed={true}
        fill={isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : "#1e293b"}
        stroke={isActive || isHovered ? "#fff" : "#334155"}
        strokeWidth={1 / scale}
        onMouseEnter={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "pointer"; onHover(section.id); }}
        onMouseLeave={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "default"; onHover(null); }}
        onClick={() => !isTech && onClick(section.id)}
        listening={!isTech}
      />
      {section.label && !isTech && (
        <Text x={section.cx} y={section.cy} text={section.label} fontSize={16}
          fill="#facc15" fontStyle="bold" align="center" verticalAlign="middle"
          width={60} height={30} offsetX={30} offsetY={15} listening={false} />
      )}
    </Group>
  );
};

// ── Zoom limits ─────────────────────────────────────────
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 6.0;
const ZOOM_SPEED = 1.08;

// ── Generic Stadium Map ────────────────────────────────
export default function StadiumMap({ data }: Props) {
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
  const baseScale = Math.min(stageSize.width / vbW, stageSize.height / vbH) * 0.9;
  const baseX = (stageSize.width - vbW * baseScale) / 2 - vbMinX * baseScale;
  const baseY = (stageSize.height - vbH * baseScale) / 2 - vbMinY * baseScale;

  const totalScale = baseScale * zoom;

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

  // ── Double-click: reset ─────────────────────────────────
  const handleDoubleClick = () => {
    setZoom(1); setPanX(0); setPanY(0);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#000", borderRadius: 24, overflow: "hidden",
        cursor: isPanning ? "grabbing" : "grab",
        position: "relative",
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
      >
        <Layer>
          <Group x={baseX} y={baseY} scaleX={baseScale} scaleY={baseScale}>
            <StadiumPitch config={data.pitch} scale={totalScale} />
            {data.sections.map((s, i) => (
              <SectionBlock key={i} section={s} scale={totalScale}
                isActive={selected === s.id} isHovered={hovered === s.id}
                onHover={setHovered} onClick={setSelected} />
            ))}
          </Group>
        </Layer>
      </Stage>

      {/* Zoom badge */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontFamily: "monospace", pointerEvents: "none" }}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
