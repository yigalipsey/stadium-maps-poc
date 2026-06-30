"use client";

import React from "react";
import StadiumPitch, { PitchConfig } from "./StadiumPitch";

// ── Emirates pitch config — exact SVG mirror ──
// SVG:  <g transform="matrix(1.6014 0 0 1.5401 -3.577 -2.782)">
// ─────────────────────────────────────────────────────────

export const EMIRATES_PITCH: PitchConfig = {
  transform: {
    scaleX: 1.6013657,
    scaleY: 1.5401302,
    x: -3.5770895,
    y: -2.7821801,
  },
  grass: { x: -57.5, y: -39, width: 115, height: 78, rx: 14 },
  boundary: { x: -51.5, y: -33, width: 103, height: 66, strokeWidth: 0.6 },
  centerLine: { x: 0, y1: -33, y2: 33 },
  centerCircle: { cx: 0, cy: 0, r: 9.15 },
  centerDot: { cx: 0, cy: 0, r: 0.5 },
  penaltyLeft: { x: -51.5, y: -14.4, width: 16.2, height: 28.8 },
  goalLeft: { x: -51.5, y: -8.1, width: 5.4, height: 16.2 },
  penaltyRight: { x: 35.3, y: -14.4, width: 16.2, height: 28.8 },
  goalRight: { x: 46.1, y: -8.1, width: 5.4, height: 16.2 },
  penaltySpotLeft: { cx: -40.3, cy: 0, r: 0.4 },
  penaltySpotRight: { cx: 40.3, cy: 0, r: 0.4 },
};

// Effective grass bounds (for external reference)
export const GRASS = {
  x: -95.66,
  y: -62.85,
  width: 184.2,
  height: 120.1,
  rx: 22.4,
  ry: 21.6,
};

const EmiratesGrass: React.FC<{ scale: number }> = ({ scale }) => (
  <StadiumPitch config={EMIRATES_PITCH} scale={scale} />
);

export default EmiratesGrass;
