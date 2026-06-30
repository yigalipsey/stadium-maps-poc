"use client";

import React, { useRef, useEffect } from "react";
import { Stage, Layer, Line, Group, Text } from "react-konva";
import flatData from "@/data/Emirates_flat.json";
import EmiratesGrass from "@/components/EmiratesGrass";

// ── Section block (simplified, no interactivity) ───────
const SectionShape: React.FC<{ s: any }> = ({ s }) => {
  const isTech = s.id.startsWith("0") || s.id.startsWith("technical");
  return (
    <Group>
      <Line points={s.points} closed={true}
        fill={isTech ? "#0f172a" : "#1e293b"}
        stroke="#334155" strokeWidth={0.15} listening={false} />
      {s.label && !isTech && (
        <Text x={s.cx} y={s.cy} text={s.label} fontSize={8}
          fill="#facc15" fontStyle="bold" align="center" verticalAlign="middle"
          width={30} height={15} offsetX={15} offsetY={7.5} listening={false} />
      )}
    </Group>
  );
};

// ── Mini Emirates Page ─────────────────────────────────
export default function EmiratesMiniPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fixed small card size
  const CARD = 320;

  const [vbMinX, vbMinY, vbWidth, vbHeight] = flatData.viewBox.split(" ").map(Number);
  const scale = Math.min(CARD / vbWidth, CARD / vbHeight) * 0.82;
  const gx = (CARD - vbWidth * scale) / 2 - vbMinX * scale;
  const gy = (CARD - vbHeight * scale) / 2 - vbMinY * scale;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f172a",
    }}>
      <div ref={containerRef} style={{
        width: CARD, height: CARD,
        background: "#000",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <Stage width={CARD} height={CARD}>
          <Layer>
            <Group x={gx} y={gy} scaleX={scale} scaleY={scale}>
              <EmiratesGrass scale={scale} />
              {flatData.sections.map((s: any, i: number) => (
                <SectionShape key={i} s={s} />
              ))}
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
