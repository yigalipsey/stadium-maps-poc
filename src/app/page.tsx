"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import bernabeu from "@/data/Bernabeu_flat.json";
import emirates from "@/data/Emirates_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

const STADIUMS = [
  { id: "bernabeu", name: "Santiago Bernabéu", city: "Madrid", country: "Spain", data: bernabeu },
  { id: "emirates", name: "Emirates Stadium", city: "London", country: "England", data: emirates },
];

const useMobile = () => {
  const [mobile, setMobile] = React.useState(false);
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

  return (
    <div className="layout">
      {/* Map panel */}
      <div className="map-panel">
        {current && <StadiumMap data={current.data} zoom={mobile ? 0.85 : 1} />}
      </div>

      {/* Side panel */}
      <div className="side-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? 16 : 40, color: "#f8fafc", gap: mobile ? 12 : 24 }}>
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: mobile ? 20 : 32, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, color: "#f8fafc" }}>
            {venue?.name}
          </h1>
          <p style={{ fontSize: mobile ? 12 : 14, color: "#64748b", fontWeight: 500 }}>
            {venue?.city}, {venue?.country}
          </p>
        </div>

        {/* Stadium selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
          {STADIUMS.map((s) => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              style={{
                padding: mobile ? "10px 16px" : "14px 20px",
                borderRadius: 12,
                border: selected === s.id ? "2px solid #3b82f6" : "2px solid transparent",
                fontSize: mobile ? 13 : 15,
                fontWeight: 700,
                cursor: "pointer",
                background: selected === s.id ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                color: selected === s.id ? "#60a5fa" : "#94a3b8",
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (selected !== s.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#cbd5e1";
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== s.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
            >
              <div style={{ fontSize: "inherit", fontWeight: "inherit" }}>{s.name}</div>
              <div style={{ fontSize: mobile ? 10 : 11, color: "#64748b", fontWeight: 400, marginTop: 2 }}>{s.city}, {s.country}</div>
            </button>
          ))}
        </div>

        {/* Hint */}
        <p style={{ fontSize: mobile ? 10 : 12, color: "#475569", textAlign: "center", marginTop: 8 }}>
          Scroll to zoom · Drag to pan · Double-click to reset
        </p>
      </div>
    </div>
  );
}
