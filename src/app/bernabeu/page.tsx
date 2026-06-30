"use client";

import dynamic from "next/dynamic";
import data from "@/data/Bernabeu_flat.json";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

export default function BernabeuPage() {
  return <StadiumMap data={data} />;
}
