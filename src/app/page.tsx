"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import bernabeu from "@/data/Bernabeu_flat.json";
import emirates from "@/data/Emirates_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

const STADIUMS = [
  { id: "bernabeu", name: "Santiago Bernabéu", data: bernabeu },
  { id: "emirates", name: "Emirates Stadium", data: emirates },
];

export default function HomePage() {
  const [selected, setSelected] = useState<string>("bernabeu");
  const current = STADIUMS.find((s) => s.id === selected);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
      {/* Map */}
      {current && <StadiumMap data={current.data} />}

      {/* Stadium selector */}
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10, background: "rgba(0,0,0,0.7)", padding: "6px 8px", borderRadius: 12, backdropFilter: "blur(8px)" }}>
        {STADIUMS.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: selected === s.id ? "#3b82f6" : "rgba(255,255,255,0.08)", color: selected === s.id ? "#fff" : "#94a3b8", transition: "all 0.15s" }}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
