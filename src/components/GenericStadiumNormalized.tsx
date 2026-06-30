"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Group, Text, Rect, Circle } from "react-konva";

// ── Types ──────────────────────────────────────────────
interface SectionData {
  id: string;
  coords: number[];
  label: string | null;
  cx: number;
  cy: number;
}

interface MapData {
  id: string;
  viewBox: string;
  pitchAnchor: { x: number; y: number; width: number; height: number };
  sections: SectionData[];
}

interface Props {
  data: MapData;
  activeBlockId?: string | null;
  hoveredBlockId?: string | null;
  setHoveredBlock?: (id: string | null) => void;
  setSelectedBlock?: (id: string | null) => void;
}

const VIEWPORT_PADDING = 0.92;

// ── Football Pitch — always at (0,0) 105×68 ────────────────────────
const FootballPitch: React.FC<{ scale: number }> = ({ scale }) => {
  const w = 105, h = 68, hw = w / 2, hh = h / 2;
  const grass = "#1e3a1d", stripe = "#2a5424";
  const line = "rgba(255,255,255,0.6)";
  const lw = 1 / scale;
  const stripes = 12, sw = w / stripes;

  return (
    <Group>
      <Rect x={-hw} y={-hh} width={w} height={h} fill={grass} />
      {Array.from({ length: stripes }, (_, i) =>
        i % 2 === 0 ? <Rect key={i} x={-hw + i * sw} y={-hh} width={sw} height={h} fill={stripe} opacity={0.3} /> : null
      )}
      <Rect x={-hw} y={-hh} width={w} height={h} stroke={line} strokeWidth={lw} />
      <Line points={[0, -hh, 0, hh]} stroke={line} strokeWidth={lw} />
      <Circle x={0} y={0} radius={h / 6} stroke={line} strokeWidth={lw} />
      <Circle x={0} y={0} radius={1} fill={line} />
      <Rect x={-hw} y={-h * 0.22} width={w * 0.16} height={h * 0.44} stroke={line} strokeWidth={lw} />
      <Rect x={hw - w * 0.16} y={-h * 0.22} width={w * 0.16} height={h * 0.44} stroke={line} strokeWidth={lw} />
      <Rect x={-hw} y={-h * 0.12} width={w * 0.06} height={h * 0.24} stroke={line} strokeWidth={lw} />
      <Rect x={hw - w * 0.06} y={-h * 0.12} width={w * 0.06} height={h * 0.24} stroke={line} strokeWidth={lw} />
    </Group>
  );
};

// ── Section Block ──────────────────────────────────────
const SectionBlock: React.FC<{
  section: SectionData;
  isActive: boolean;
  isHovered: boolean;
  scale: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ section, isActive, isHovered, scale, onHover, onClick }) => {
  const isTechnical = section.id.startsWith("0") || section.id.startsWith("technical");

  return (
    <Group>
      <Line
        points={section.coords}
        closed={true}
        fill={isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : "#1e293b"}
        stroke={isActive || isHovered ? "#ffffff" : "#334155"}
        strokeWidth={1 / scale}
        onMouseEnter={(e) => { if (isTechnical) return; e.target.getStage()!.container().style.cursor = "pointer"; onHover(section.id); }}
        onMouseLeave={(e) => { if (isTechnical) return; e.target.getStage()!.container().style.cursor = "default"; onHover(null); }}
        onClick={() => !isTechnical && onClick(section.id)}
        onTap={() => !isTechnical && onClick(section.id)}
        listening={!isTechnical}
      />
      {section.label && !isTechnical && (
        <Text x={section.cx} y={section.cy} text={section.label} fontSize={14 / scale}
          fill="#facc15" fontStyle="bold" align="center" verticalAlign="middle"
          width={50 / scale} height={25 / scale} offsetX={25 / scale} offsetY={12.5 / scale} listening={false} />
      )}
    </Group>
  );
};

// ── Generic Normalized Stadium Canvas ──────────────────
export default function GenericStadiumNormalized({
  data,
  activeBlockId,
  hoveredBlockId,
  setHoveredBlock,
  setSelectedBlock,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Per-stadium viewBox → each stadium fills same screen area
  const [, , vbWidth, vbHeight] = data.viewBox.split(" ").map(Number);
  const scale = stageSize.width > 0 && stageSize.height > 0
    ? Math.min(stageSize.width / vbWidth, stageSize.height / vbHeight) * VIEWPORT_PADDING
    : 1;
  const groupX = stageSize.width / 2;
  const groupY = stageSize.height / 2;

  if (stageSize.width === 0) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
      <Stage width={stageSize.width} height={stageSize.height}>
        <Layer>
          <Group x={groupX} y={groupY} scaleX={scale} scaleY={scale}>
            <FootballPitch scale={scale} />
            {data.sections.map((section, idx) => (
              <SectionBlock key={idx} section={section} scale={scale}
                isActive={activeBlockId === section.id}
                isHovered={hoveredBlockId === section.id}
                onHover={(id) => setHoveredBlock?.(id)}
                onClick={(id) => setSelectedBlock?.(id)} />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
