"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Path, Group, Text } from "react-konva";
import bernabeuData from "@/data/Bernabeu.json";

// ── Types ──────────────────────────────────────────────
interface BlockData {
  dataBlock: string;
  path: string;
  label: string | null;
}

interface Props {
  activeBlockId?: string | null;
  hoveredBlockId?: string | null;
  setHoveredBlock?: (id: string | null) => void;
  setSelectedBlock?: (id: string | null) => void;
}

// ── Single Block (path + label) ────────────────────────
const BlockWithLabel: React.FC<{
  block: BlockData;
  isActive: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}> = ({ block, isActive, isHovered, onHover, onClick }) => {
  const pathRef = useRef<any>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (pathRef.current) {
      const rect = pathRef.current.getSelfRect();
      setCenter({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      });
    }
  }, []);

  // Blocks whose dataBlock starts with "0" are structural → non-interactive
  const isTechnical = block.dataBlock.startsWith("0");

  return (
    <Group>
      <Path
        ref={pathRef}
        data={block.path}
        fill={isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : "#1e293b"}
        stroke={isActive || isHovered ? "#ffffff" : "#334155"}
        strokeWidth={0.2}
        opacity={1}
        onMouseEnter={(e) => {
          if (isTechnical) return;
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "pointer";
          onHover(block.dataBlock);
        }}
        onMouseLeave={(e) => {
          if (isTechnical) return;
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "default";
          onHover(null);
        }}
        onClick={() => !isTechnical && onClick(block.dataBlock)}
        onTap={() => !isTechnical && onClick(block.dataBlock)}
        listening={!isTechnical}
      />
      {block.label && !isTechnical && center.x !== 0 && (
        <Text
          x={center.x}
          y={center.y}
          text={block.label}
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

// ── Main Stadium Component ──────────────────────────────
export default function BernabeuMap({
  activeBlockId,
  hoveredBlockId,
  setHoveredBlock,
  setSelectedBlock,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Measure the container so the canvas fills available space
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

  // Wait for a non-zero container size before rendering Konva
  if (stageSize.width === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 500 }}
      />
    );
  }

  // Parse the SVG viewBox from the JSON (e.g. "0 0 1500 1500")
  const [vbMinX, vbMinY, vbWidth, vbHeight] = bernabeuData.viewBox
    .split(" ")
    .map(Number);

  // Scale to fit the container with 10 % padding
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
            {bernabeuData.blocks.map((block, idx) => (
              <BlockWithLabel
                key={idx}
                block={block as BlockData}
                isActive={activeBlockId === block.dataBlock}
                isHovered={hoveredBlockId === block.dataBlock}
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
