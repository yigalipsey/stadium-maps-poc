"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Konva needs browser APIs — load with ssr:false
const BernabeuMap = dynamic(
  () => import("@/components/BernabeuMap"),
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
        Loading Bernabéu…
      </div>
    ),
  }
);

export default function HomePage() {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* ── The Map ── */}
      <BernabeuMap
        activeBlockId={selectedBlock}
        hoveredBlockId={hoveredBlock}
        setHoveredBlock={setHoveredBlock}
        setSelectedBlock={setSelectedBlock}
      />

      {/* ── Top-left: title ── */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            color: "rgba(255,255,255,0.15)",
            fontSize: 48,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Santiago<br />Bernabéu
        </h1>
      </div>

      {/* ── Top-right: selected section info ── */}
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        {selectedBlock ? (
          <div
            style={{
              background: "#fff",
              color: "#0f172a",
              padding: "16px 24px",
              borderRadius: 16,
              boxShadow: "0 0 40px rgba(255,255,255,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                opacity: 0.5,
                marginBottom: 4,
              }}
            >
              Selected Section
            </div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>
              {selectedBlock}
            </div>
          </div>
        ) : hoveredBlock ? (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "8px 16px",
              borderRadius: 12,
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                opacity: 0.4,
              }}
            >
              Inspect
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{hoveredBlock}</div>
          </div>
        ) : null}
      </div>

      {/* ── Bottom-left: clear button ── */}
      {selectedBlock && (
        <div style={{ position: "absolute", bottom: 24, left: 24 }}>
          <button
            onClick={() => setSelectedBlock(null)}
            style={{
              background: "#1e293b",
              color: "#cbd5e1",
              border: "none",
              padding: "10px 20px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#334155")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#1e293b")
            }
          >
            ← Clear Selection
          </button>
        </div>
      )}

      {/* ── Bottom-right: hover hint ── */}
      {!selectedBlock && !hoveredBlock && (
        <div style={{ position: "absolute", bottom: 24, right: 24 }}>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            Hover over sections to explore
          </p>
        </div>
      )}
    </div>
  );
}
