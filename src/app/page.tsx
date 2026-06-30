"use client";

import Link from "next/link";

const STADIUMS = [
  { slug: "bernabeu", name: "Santiago Bernabéu", city: "Madrid" },
  { slug: "emirates", name: "Emirates Stadium", city: "London" },
];

export default function HomePage() {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff", fontFamily: "system-ui, sans-serif", gap: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.15)" }}>Stadium Maps</h1>
      <div style={{ display: "flex", gap: 16 }}>
        {STADIUMS.map((s) => (
          <Link key={s.slug} href={`/venues/${s.slug}`} style={{ textDecoration: "none" }}>
            <div style={{ width: 220, padding: "24px 32px", background: "#1e293b", borderRadius: 16, border: "1px solid #334155", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#334155"; e.currentTarget.style.borderColor = "#475569"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.borderColor = "#334155"; }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{s.city}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
