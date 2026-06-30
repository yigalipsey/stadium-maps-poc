"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Group, Text, Rect, Circle } from "react-konva";
import normData from "@/data/normalized/bernabeu.json";

// ── Types ──────────────────────────────────────────────
interface SectionData {
  id: string;
  coords: number[];
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

// ── Static Football Pitch (centered at 0,0, standard 105×68) ──
const FootballPitch: React.FC<{ scale: number }> = ({ scale }) => {
  const w = 105; // FIFA standard width
  const h = 68;  // FIFA standard height
  const hw = w / 2;
  const hh = h / 2;

  const grass  = "#1e3a1d";
  const stripe = "#2a5424";
  const line   = "rgba(255,255,255,0.6)";
  const lw     = 1 / scale;

  const stripes = 12;
  const sw = w / stripes;

  return (
    <Group>
      {/* Grass base */}
      <Rect x={-hw} y={-hh} width={w} height={h} fill={grass} />
      {/* Stripes */}
      {Array.from({ length: stripes }, (_, i) =>
        i % 2 === 0 ? (
          <Rect
            key={i}
            x={-hw + i * sw}
            y={-hh}
            width={sw}
            height={h}
            fill={stripe}
            opacity={0.3}
          />
        ) : null
      )}
      {/* Boundary */}
      <Rect x={-hw} y={-hh} width={w} height={h} stroke={line} strokeWidth={lw} />
      {/* Center line */}
      <Line points={[0, -hh, 0, hh]} stroke={line} strokeWidth={lw} />
      {/* Center circle */}
      <Circle x={0} y={0} radius={h / 6} stroke={line} strokeWidth={lw} />
      <Circle x={0} y={0} radius={1} fill={line} />
      {/* Penalty areas */}
      <Rect x={-hw} y={-h * 0.22} width={w * 0.16} height={h * 0.44} stroke={line} strokeWidth={lw} />
      <Rect x={hw - w * 0.16} y={-h * 0.22} width={w * 0.16} height={h * 0.44} stroke={line} strokeWidth={lw} />
      {/* Goal areas */}
      <Rect x={-hw} y={-h * 0.12} width={w * 0.06} height={h * 0.24} stroke={line} strokeWidth={lw} />
      <Rect x={hw - w * 0.06} y={-h * 0.12} width={w * 0.06} height={h * 0.24} stroke={line} strokeWidth={lw} />
    </Group>
  );
};

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
        points={section.coords}
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
          fontSize={14 / scale}
          fill="#facc15"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={50 / scale}
          height={25 / scale}
          offsetX={(25 / scale)}
          offsetY={(12.5 / scale)}
          listening={false}
        />
      )}
    </Group>
  );
};

const VIEWPORT_PADDING = 0.92;

// ── Main Stadium Component ──────────────────────────────
export default function BernabeuMapNormalized({
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

  // Per-stadium viewBox → each stadium fills same screen area
  const [, , vbWidth, vbHeight] = normData.viewBox.split(" ").map(Number);
  const scale =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.min(stageSize.width / vbWidth, stageSize.height / vbHeight) * VIEWPORT_PADDING
      : 1;

  // Pitch center = SVG origin (0,0) → always at canvas center
  const groupX = stageSize.width / 2;
  const groupY = stageSize.height / 2;

  // ── Debug log (must be before any early return — Rules of Hooks) ──
  useEffect(() => {
    console.log("═══════════════════════════════════════");
    console.log("🎯 STADIUM NORMALIZED — RENDER DEBUG");
    console.log("═══════════════════════════════════════");

    // 1. Data from JSON
    console.group("📦 normData (from JSON)");
    console.log("  viewBox (DEBUG-ONLY):", normData.viewBox);
    console.log("  pitchAnchor:", JSON.stringify(normData.pitchAnchor));
    console.log("  sections count:", normData.sections.length);
    console.groupEnd();

    // 2. Camera
    console.group("📷 Camera");
    console.log("  viewBox (used for scale):", normData.viewBox);
    console.log("  scale:", scale.toFixed(4));
    console.log("  origin (0,0) → canvas center");
    console.groupEnd();

    // 3. Pitch geometry
    console.group("⚽ Pitch Geometry");
    console.log("  pitchAnchor:  ", { x: 0, y: 0, width: 105, height: 68 });
    console.log("  pitchRect:    ", { x: -52.5, y: -34, width: 105, height: 68 });
    console.log("  pitchCorners: ", {
      TL: [-52.5, -34],
      TR: [52.5, -34],
      BR: [52.5, 34],
      BL: [-52.5, 34],
    });
    console.log("  stageCenter:  ", { x: 0, y: 0 });
    console.groupEnd();

    // 3. ViewBox & stage
    console.group("🖼️  ViewBox & Stage");
    console.log("  stageSize:", stageSize);
    console.groupEnd();

    // 4. Transform pipeline
    console.group("📐 Transform Pipeline");
    console.log("  scale (uniform):", scale);
    console.log("  group.x:", groupX.toFixed(1));
    console.log("  group.y:", groupY.toFixed(1));
    console.log("  group.scaleX:", scale);
    console.log("  group.scaleY:", scale);
    console.log("  offsetX: none (pitch rendered at x=-52.5 natively)");
    console.log("  offsetY: none (pitch rendered at y=-34 natively)");
    console.groupEnd();

    // 5. SVG (0,0) = pitch center = canvas center (by construction)
    const originAt = {
      screenX: groupX.toFixed(1),
      screenY: groupY.toFixed(1),
    };
    const canvasCenter = {
      x: (stageSize.width / 2).toFixed(1),
      y: (stageSize.height / 2).toFixed(1),
    };
    console.group("📍 Origin (0,0) on screen");
    console.log("  SVG (0,0) → screen:", originAt);
    console.log("  Canvas center:       ", canvasCenter);
    console.log("  Match:", originAt.screenX === canvasCenter.x && originAt.screenY === canvasCenter.y ? "✅ YES" : "❌ NO");
    console.groupEnd();

    // 6. Verify a known section
    const first = normData.sections[0];
    if (first) {
      console.group("🔍 Sample section [0]");
      console.log("  id:", first.id);
      console.log("  coords[0..5]:", first.coords.slice(0, 6));
      console.log("  centroid:", { cx: first.cx, cy: first.cy });
      console.groupEnd();
    }

    console.log("═══════════════════════════════════════\n");
  }, [stageSize.width, stageSize.height]);

  // Early return AFTER all hooks (Rules of Hooks)
  if (stageSize.width === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 500 }}
      />
    );
  }

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
            {/* ⚽ The pitch — now static at (0,0), 105×68, identical for all stadiums */}
            <FootballPitch scale={scale} />

            {/* Stadium sections */}
            {normData.sections.map((section, idx) => (
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
