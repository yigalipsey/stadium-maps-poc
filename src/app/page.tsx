"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import bernabeu from "@/data/Bernabeu_flat.json";
import emirates from "@/data/Emirates_flat.json";
import etihad from "@/data/Etihad_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

const STADIUMS = [
  { id: "bernabeu", name: "Santiago Bernabéu", city: "Madrid", country: "Spain", data: bernabeu },
  { id: "emirates", name: "Emirates Stadium", city: "London", country: "England", data: emirates },
  { id: "etihad", name: "Etihad Stadium", city: "Manchester", country: "England", data: etihad },
];

const RANGES: [number, number][] = [
  [0, 100], [100, 200], [200, 300], [300, 400],
  [400, 500], [500, 600], [600, 700], [700, 800],
];

const useMobile = () => {
  const [mobile, setMobile] = useState(false);
  React.useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
};

export default function HomePage() {
  const [selected, setSelected] = useState<string>("bernabeu");
  const current = STADIUMS.find((s) => s.id === selected);
  const venue = current;
  const mobile = useMobile();

  // Range filter: hover = preview, click = lock
  const [hoverRange, setHoverRange] = useState<[number, number] | null>(null);
  const [lockedRange, setLockedRange] = useState<[number, number] | null>(null);
  const activeRange = lockedRange || hoverRange;

  return (
    <div className="layout">
      {/* Map panel */}
      <div className="map-panel">
        {current && (
          <StadiumMap
            data={current.data}
            zoom={mobile ? 0.85 : 1}
            highlightRange={activeRange}
          />
        )}
      </div>

      {/* Side panel */}
      <div className="side-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? 12 : 32, color: "#f8fafc", gap: mobile ? 8 : 16 }}>
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: mobile ? 18 : 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, color: "#f8fafc" }}>
            {venue?.name}
          </h1>
          <p style={{ fontSize: mobile ? 11 : 13, color: "#64748b", fontWeight: 500 }}>
            {venue?.city}, {venue?.country}
          </p>
        </div>

        {/* Stadium selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 260 }}>
          {STADIUMS.map((s) => (
            <button key={s.id} onClick={() => { setSelected(s.id); setLockedRange(null); }}
              style={{
                padding: mobile ? "8px 14px" : "10px 16px",
                borderRadius: 10,
                border: selected === s.id ? "2px solid #3b82f6" : "2px solid transparent",
                fontSize: mobile ? 12 : 14,
                fontWeight: 700,
                cursor: "pointer",
                background: selected === s.id ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                color: selected === s.id ? "#60a5fa" : "#94a3b8",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              {s.name}
              <div style={{ fontSize: mobile ? 10 : 11, color: "#64748b", fontWeight: 400, marginTop: 2 }}>{s.city}, {s.country}</div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: "60%", height: 1, background: "#1e293b" }} />

        {/* Range filter — 8 buttons in 2 rows × 4 cols */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: mobile ? 10 : 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Section Ranges
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RANGES.map(([lo, hi]) => {
              const isHovered = hoverRange?.[0] === lo && hoverRange?.[1] === hi;
              const isLocked = lockedRange?.[0] === lo && lockedRange?.[1] === hi;
              const isActive = isHovered || isLocked;
              return (
                <button key={lo}
                  style={{
                    padding: mobile ? "8px 16px" : "10px 20px",
                    borderRadius: 8,
                    border: isActive ? "2px solid #f59e0b" : "2px solid #1e293b",
                    fontSize: mobile ? 11 : 13,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    cursor: "pointer",
                    background: isLocked ? "rgba(245,158,11,0.2)"
                      : isHovered ? "rgba(245,158,11,0.1)"
                      : "rgba(255,255,255,0.03)",
                    color: isActive ? "#fbbf24" : "#64748b",
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={() => setHoverRange([lo, hi])}
                  onMouseLeave={() => setHoverRange(null)}
                  onClick={() => setLockedRange(isLocked ? null : [lo, hi])}
                >
                  {lo}–{hi}
                </button>
              );
            })}
          </div>
          {lockedRange && (
            <button onClick={() => setLockedRange(null)}
              style={{ marginTop: 8, padding: "4px 12px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>
              Clear filter
            </button>
          )}
        </div>

        {/* Hint */}
        <p style={{ fontSize: mobile ? 10 : 11, color: "#475569", textAlign: "center", marginTop: "auto" }}>
          Hover range → preview · Click → lock
        </p>
      </div>
    </div>
  );
}
