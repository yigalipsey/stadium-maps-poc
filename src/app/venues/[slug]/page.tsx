"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import bernabeu from "@/data/Bernabeu_flat.json";
import emirates from "@/data/Emirates_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

const DATA: Record<string, any> = {
  bernabeu,
  emirates,
};

export default function VenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const data = DATA[slug];

  if (!data) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.1)", marginBottom: 8 }}>404</h1>
      <p>Stadium &quot;{slug}&quot; not found</p>
      <a href="/" style={{ marginTop: 20, color: "#3b82f6" }}>← Back</a>
    </div>
  );

  return <StadiumMap data={data} />;
}
