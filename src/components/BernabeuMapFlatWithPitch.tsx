"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Group, Text } from "react-konva";
import flatData from "@/data/Bernabeu_flat.json";
import StadiumPitch from "./StadiumPitch";

// ── Types ──────────────────────────────────────────────
interface SectionData {
  id: string;
  points: number[];
  label: string | null;
  cx: number;
  cy: number;
}

interface Props {
  activeBlockId?: string | null;
  hoveredBlockId?: string | null;
  setHoveredBlock?: (id: string | null) => void;
  setSelectedBlock?: (id: string | null) => void;
}

// Pitch config now lives IN the JSON file — data.pitch
const pitchConfig = (flatData as any).pitch;

// ── Single Section ─────────────────────────────────────
const SectionWithLabel: React.FC<{
  section: SectionData;
  isActive: boolean;
  isHovered: boolean;
  scale: number;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ section, isActive, isHovered, scale, onHover, onClick }) => {
  const isTechnical =
    section.id.startsWith("0") || section.id.startsWith("technical");

  return (
    <Group>
      <Line
        points={section.points}
        closed={true}
        fill={isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : "#1e293b"}
        stroke={isActive || isHovered ? "#ffffff" : "#334155"}
        strokeWidth={1 / scale}
        onMouseEnter={(e) => {
          if (isTechnical) return;
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "pointer";
          onHover(section.id);
        }}
        onMouseLeave={(e) => {
          if (isTechnical) return;
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "default";
          onHover(null);
        }}
        onClick={() => !isTechnical && onClick(section.id)}
        onTap={() => !isTechnical && onClick(section.id)}
        listening={!isTechnical}
      />
      {section.label && !isTechnical && (
        <Text
          x={section.cx}
          y={section.cy}
          text={section.label}
          fontSize={16}
          fill="#facc15"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={60}
          height={30}
          offsetX={30}
          offsetY={15}
          listening={false}
        />
      )}
    </Group>
  );
};

// ── Main Component ─────────────────────────────────────
export default function BernabeuMapFlatWithPitch({
  activeBlockId,
  hoveredBlockId,
  setHoveredBlock,
  setSelectedBlock,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

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

  if (stageSize.width === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 500 }}
      />
    );
  }

  const [vbMinX, vbMinY, vbWidth, vbHeight] = flatData.viewBox
    .split(" ")
    .map(Number);

  const scale =
    Math.min(stageSize.width / vbWidth, stageSize.height / vbHeight) * 0.9;

  const groupX = (stageSize.width - vbWidth * scale) / 2 - vbMinX * scale;
  const groupY = (stageSize.height - vbHeight * scale) / 2 - vbMinY * scale;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      }}
    >
      <Stage width={stageSize.width} height={stageSize.height}>
        <Layer>
          <Group x={groupX} y={groupY} scaleX={scale} scaleY={scale}>
            {/* ⚽ Pitch config from JSON data */}
            <StadiumPitch config={pitchConfig} scale={scale} />
            {/* Sections on top */}
            {flatData.sections.map((section, idx) => (
              <SectionWithLabel
                key={idx}
                section={section as SectionData}
                scale={scale}
                isActive={activeBlockId === section.id}
                isHovered={hoveredBlockId === section.id}
                onHover={(id) => setHoveredBlock?.(id)}
                onClick={(id) => setSelectedBlock?.(id)}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
