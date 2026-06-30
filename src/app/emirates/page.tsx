"use client";

import dynamic from "next/dynamic";
import data from "@/data/Emirates_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

export default function EmiratesPage() {
  return <StadiumMap data={data} />;
}
