"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const BernabeuMapFlatWithPitch = dynamic(
  () => import("@/components/BernabeuMapFlatWithPitch"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#94a3b8",
          fontSize: 18,
          fontFamily: "monospace",
        }}
      >
        Loading Bernabéu + Pitch…
      </div>
    ),
  }
);

export default function BernabeuPage() {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <BernabeuMapFlatWithPitch
        activeBlockId={selectedBlock}
        hoveredBlockId={hoveredBlock}
        setHoveredBlock={setHoveredBlock}
        setSelectedBlock={setSelectedBlock}
      />

      {/* Title */}
      <div style={{ position: "absolute", top: 24, left: 24, pointerEvents: "none" }}>
        <h1 style={{ color: "rgba(255,255,255,0.15)", fontSize: 48, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-1px", lineHeight: 1 }}>
          Bernabéu<br />+ Pitch
        </h1>
        <span style={{ display: "inline-block", marginTop: 8, background: "#22c55e", color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>
          FLAT POINTS + PITCH OVERLAY
        </span>
      </div>

      {/* Selected section */}
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        {selectedBlock ? (
          <div style={{ background: "#fff", color: "#0f172a", padding: "16px 24px", borderRadius: 16, boxShadow: "0 0 40px rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, opacity: 0.5, marginBottom: 4 }}>Selected Section</div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>{selectedBlock}</div>
          </div>
        ) : hoveredBlock ? (
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 12, color: "#fff" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, opacity: 0.4 }}>Inspect</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{hoveredBlock}</div>
          </div>
        ) : null}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, display: "flex", justifyContent: "space-between" }}>
        <div>
          {selectedBlock && (
            <button onClick={() => setSelectedBlock(null)} style={{ background: "#1e293b", color: "#cbd5e1", border: "none", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ← Clear
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/emirates" style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,0.05)", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>Emirates</a>
        </div>
      </div>
    </div>
  );
}
