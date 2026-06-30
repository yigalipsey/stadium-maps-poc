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

// ── Generic Stadium Map ────────────────────────────────
export default function StadiumMap({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const h = () => { if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
    h(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  if (stageSize.width === 0) return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />;

  const [vbMinX, vbMinY, vbW, vbH] = data.viewBox.split(" ").map(Number);
  const scale = Math.min(stageSize.width / vbW, stageSize.height / vbH) * 0.9;
  const gx = (stageSize.width - vbW * scale) / 2 - vbMinX * scale;
  const gy = (stageSize.height - vbH * scale) / 2 - vbMinY * scale;

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: 24, overflow: "hidden" }}>
      <Stage width={stageSize.width} height={stageSize.height}>
        <Layer>
          <Group x={gx} y={gy} scaleX={scale} scaleY={scale}>
            <StadiumPitch config={data.pitch} scale={scale} />
            {data.sections.map((s, i) => (
              <SectionBlock key={i} section={s} scale={scale}
                isActive={selected === s.id} isHovered={hovered === s.id}
                onHover={setHovered} onClick={setSelected} />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
