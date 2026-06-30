"use client";

import React from "react";
import { Group, Rect, Line, Circle } from "react-konva";

// ── Types ──────────────────────────────────────────────
export interface PitchConfig {
  /** SVG <g> transform matrix (a,d=scale, e,f=translate) — omit if none */
  transform?: {
    scaleX: number;
    scaleY: number;
    x: number;
    y: number;
  };
  /** Rounded green grass rectangle (raw SVG coords, pre-transform) */
  grass: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
  };
  /** White boundary rectangle */
  boundary: {
    x: number;
    y: number;
    width: number;
    height: number;
    strokeWidth: number;
  };
  /** Center line */
  centerLine: {
    x: number;
    y1: number;
    y2: number;
  };
  /** Center circle */
  centerCircle: {
    cx: number;
    cy: number;
    r: number;
  };
  /** Center dot */
  centerDot: {
    cx: number;
    cy: number;
    r: number;
  };
  /** Left penalty area */
  penaltyLeft: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Left goal area */
  goalLeft: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Right penalty area */
  penaltyRight: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Right goal area */
  goalRight: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Left penalty spot */
  penaltySpotLeft: {
    cx: number;
    cy: number;
    r: number;
  };
  /** Right penalty spot */
  penaltySpotRight: {
    cx: number;
    cy: number;
    r: number;
  };
  /** Optional grass stripes */
  stripes?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

// ── Props ──────────────────────────────────────────────
interface Props {
  config: PitchConfig;
  scale: number; // uniform viewport scale (for stroke-width compensation)
}

// ── Component ──────────────────────────────────────────
const StadiumPitch: React.FC<Props> = ({ config, scale }) => {
  const {
    transform,
    grass,
    boundary,
    centerLine,
    centerCircle,
    centerDot,
    penaltyLeft,
    goalLeft,
    penaltyRight,
    goalRight,
    penaltySpotLeft,
    penaltySpotRight,
    stripes,
  } = config;

  // Scale-compensated — thinner than section strokes (which use 1/scale)
  const lineStrokeWidth = (0.65 / scale);
  const lineOpacity = 0.85;

  const inner = (
    <>
      {/* 🌱 Grass base */}
      <Rect
        x={grass.x}
        y={grass.y}
        width={grass.width}
        height={grass.height}
        cornerRadius={grass.rx}
        fill="#1e7a1d"
      />

      {/* 🌿 Grass stripes (optional) */}
      {stripes?.map((s, i) => (
        <Rect
          key={`stripe-${i}`}
          x={s.x}
          y={s.y}
          width={s.width}
          height={s.height}
          fill="#268a24"
          opacity={0.4}
          listening={false}
        />
      ))}

      {/* ⚪ Pitch boundary */}
      <Rect
        x={boundary.x}
        y={boundary.y}
        width={boundary.width}
        height={boundary.height}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Center line */}
      <Line
        points={[centerLine.x, centerLine.y1, centerLine.x, centerLine.y2]}
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Center circle */}
      <Circle
        x={centerCircle.cx}
        y={centerCircle.cy}
        radius={centerCircle.r}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Center dot */}
      <Circle
        x={centerDot.cx}
        y={centerDot.cy}
        radius={centerDot.r}
        fill="white"
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Left penalty area */}
      <Rect
        x={penaltyLeft.x}
        y={penaltyLeft.y}
        width={penaltyLeft.width}
        height={penaltyLeft.height}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Left goal area */}
      <Rect
        x={goalLeft.x}
        y={goalLeft.y}
        width={goalLeft.width}
        height={goalLeft.height}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Right penalty area */}
      <Rect
        x={penaltyRight.x}
        y={penaltyRight.y}
        width={penaltyRight.width}
        height={penaltyRight.height}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Right goal area */}
      <Rect
        x={goalRight.x}
        y={goalRight.y}
        width={goalRight.width}
        height={goalRight.height}
        fill="transparent"
        stroke="white"
        strokeWidth={lineStrokeWidth}
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Left penalty spot */}
      <Circle
        x={penaltySpotLeft.cx}
        y={penaltySpotLeft.cy}
        radius={penaltySpotLeft.r}
        fill="white"
        opacity={lineOpacity}
        listening={false}
      />

      {/* ⚪ Right penalty spot */}
      <Circle
        x={penaltySpotRight.cx}
        y={penaltySpotRight.cy}
        radius={penaltySpotRight.r}
        fill="white"
        opacity={lineOpacity}
        listening={false}
      />
    </>
  );

  // ── Render with or without SVG transform ──
  if (transform) {
    return (
      <Group
        scaleX={transform.scaleX}
        scaleY={transform.scaleY}
        x={transform.x}
        y={transform.y}
      >
        {inner}
      </Group>
    );
  }

  return <Group>{inner}</Group>;
};

export default StadiumPitch;
