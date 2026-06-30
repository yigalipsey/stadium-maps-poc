"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import emiratesData from "@/data/normalized/emirates.json";

const GenericStadiumNormalized = dynamic(
  () => import("@/components/GenericStadiumNormalized"),
  { ssr: false, loading: () => <div style={{ width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f172a",color:"#94a3b8",fontSize:18,fontFamily:"monospace" }}>Loading Emirates…</div> }
);

export default function EmiratesPage() {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <GenericStadiumNormalized
        data={emiratesData}
        activeBlockId={selectedBlock}
        hoveredBlockId={hoveredBlock}
        setHoveredBlock={setHoveredBlock}
        setSelectedBlock={setSelectedBlock}
      />

      <div style={{ position: "absolute", top: 24, left: 24, pointerEvents: "none" }}>
        <h1 style={{ color: "rgba(255,255,255,0.15)", fontSize: 48, fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
          Emirates<br />Stadium
        </h1>
        <span style={{ display:"inline-block",marginTop:8,background:"#a855f7",color:"#fff",fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:6 }}>
          NORMALIZED — SAME PITCH @ (0,0) 105×68
        </span>
      </div>

      <div style={{ position: "absolute", top: 24, right: 24 }}>
        {selectedBlock ? (
          <div style={{ background:"#fff",color:"#0f172a",padding:"16px 24px",borderRadius:16,boxShadow:"0 0 40px rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,opacity:0.5,marginBottom:4 }}>Selected Section</div>
            <div style={{ fontSize:40,fontWeight:900 }}>{selectedBlock}</div>
          </div>
        ) : hoveredBlock ? (
          <div style={{ background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.1)",padding:"8px 16px",borderRadius:12,color:"#fff" }}>
            <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,opacity:0.4 }}>Inspect</div>
            <div style={{ fontSize:18,fontWeight:700 }}>{hoveredBlock}</div>
          </div>
        ) : null}
      </div>

      <div style={{ position:"absolute",bottom:24,left:24,right:24,display:"flex",justifyContent:"space-between" }}>
        {selectedBlock && (
          <button onClick={() => setSelectedBlock(null)} style={{ background:"#1e293b",color:"#cbd5e1",border:"none",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer" }}>← Clear</button>
        )}
        <div style={{ display:"flex",gap:8 }}>
          <a href="/norm" style={{ color:"#94a3b8",fontSize:12,fontWeight:700,textDecoration:"none",background:"rgba(255,255,255,0.05)",padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)" }}>Bernabéu</a>
          <a href="/flat" style={{ color:"#94a3b8",fontSize:12,fontWeight:700,textDecoration:"none",background:"rgba(255,255,255,0.05)",padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)" }}>Flat</a>
        </div>
      </div>
    </div>
  );
}
