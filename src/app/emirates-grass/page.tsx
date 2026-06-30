"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Stage, Layer, Line, Group, Text } from "react-konva";
import flatData from "@/data/Emirates_flat.json";
import EmiratesGrass, { GRASS } from "@/components/EmiratesGrass";

// ── Section block ──────────────────────────────────────
const SectionLabel: React.FC<{
  s: any; scale: number; isActive: boolean; isHovered: boolean;
  onHover: (id: string | null) => void; onClick: (id: string) => void;
}> = ({ s, scale, isActive, isHovered, onHover, onClick }) => {
  const isTech = s.id.startsWith("0") || s.id.startsWith("technical");
  return (
    <Group>
      <Line points={s.points} closed={true}
        fill={isActive ? "#1d4ed8" : isHovered ? "#3b82f6" : "#1e293b"}
        stroke={isActive || isHovered ? "#fff" : "#334155"} strokeWidth={1 / scale}
        onMouseEnter={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "pointer"; onHover(s.id); }}
        onMouseLeave={(e) => { if (isTech) return; e.target.getStage()!.container().style.cursor = "default"; onHover(null); }}
        onClick={() => !isTech && onClick(s.id)} onTap={() => !isTech && onClick(s.id)} listening={!isTech} />
      {s.label && !isTech && (
        <Text x={s.cx} y={s.cy} text={s.label} fontSize={16}
          fill="#facc15" fontStyle="bold" align="center" verticalAlign="middle"
          width={60} height={30} offsetX={30} offsetY={15} listening={false} />
      )}
    </Group>
  );
};

// ── Page ────────────────────────────────────────────────
export default function EmiratesGrassPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  useEffect(() => {
    const h = () => { if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
    h(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  if (stageSize.width === 0) return <div ref={containerRef} style={{ width:"100%",height:"100%",minHeight:500 }} />;

  const [vbMinX, vbMinY, vbWidth, vbHeight] = flatData.viewBox.split(" ").map(Number);
  const scale = Math.min(stageSize.width / vbWidth, stageSize.height / vbHeight) * 0.9;
  const gx = (stageSize.width - vbWidth * scale) / 2 - vbMinX * scale;
  const gy = (stageSize.height - vbHeight * scale) / 2 - vbMinY * scale;

  console.log("🌱 Emirates Grass", {
    grass: GRASS,
    viewBox: flatData.viewBox,
    scale,
    group: { x: gx, y: gy },
    stageSize,
  });

  return (
    <div style={{ width:"100vw",height:"100vh",position:"relative" }}>
      <div ref={containerRef} style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#000",borderRadius:24,overflow:"hidden" }}>
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            <Group x={gx} y={gy} scaleX={scale} scaleY={scale}>
              {/* 🌱 Measured rounded-rect grass */}
              <EmiratesGrass scale={scale} />
              {/* Sections on top */}
              {flatData.sections.map((s: any, i: number) => (
                <SectionLabel key={i} s={s} scale={scale}
                  isActive={selectedBlock === s.id} isHovered={hoveredBlock === s.id}
                  onHover={(id) => setHoveredBlock(id)} onClick={(id) => setSelectedBlock(id)} />
              ))}
            </Group>
          </Layer>
        </Stage>
      </div>

      <div style={{ position:"absolute",top:24,left:24,pointerEvents:"none" }}>
        <h1 style={{ color:"rgba(255,255,255,0.15)",fontSize:48,fontWeight:900,textTransform:"uppercase",lineHeight:1 }}>Emirates<br />Measured Grass</h1>
        <span style={{ display:"inline-block",marginTop:8,background:"#22c55e",color:"#000",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:6 }}>
          ROUNDED RECT — SVG MEASURED
        </span>
      </div>

      <div style={{ position:"absolute",top:24,right:24 }}>
        {selectedBlock ? (
          <div style={{ background:"#fff",color:"#0f172a",padding:"16px 24px",borderRadius:16 }}>
            <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",opacity:0.5 }}>Section</div>
            <div style={{ fontSize:40,fontWeight:900 }}>{selectedBlock}</div>
          </div>
        ) : hoveredBlock ? (
          <div style={{ background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.1)",padding:"8px 16px",borderRadius:12,color:"#fff" }}>
            <div style={{ fontSize:10,fontWeight:700,opacity:0.4 }}>Inspect</div>
            <div style={{ fontSize:18,fontWeight:700 }}>{hoveredBlock}</div>
          </div>
        ) : null}
      </div>

      <div style={{ position:"absolute",bottom:24,left:24,right:24,display:"flex",justifyContent:"space-between" }}>
        {selectedBlock && <button onClick={() => setSelectedBlock(null)} style={{ background:"#1e293b",color:"#cbd5e1",border:"none",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer" }}>← Clear</button>}
        <a href="/emirates" style={{ color:"#94a3b8",fontSize:12,fontWeight:700,textDecoration:"none",background:"rgba(255,255,255,0.05)",padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)" }}>Normalized</a>
      </div>
    </div>
  );
}
