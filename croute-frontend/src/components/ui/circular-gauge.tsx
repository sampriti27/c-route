"use client";

import React from "react";

interface CircularGaugeProps {
  score: number; // 0 to 100 or 0 to 1 (e.g. 51.6 or 0.516)
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  color?: string;
  className?: string;
}

export function CircularGauge({
  score,
  size = "md",
  label = "Route Fit",
  color,
  className = "",
}: CircularGaugeProps) {
  // Normalize score to percentage (0 - 100)
  const normalizedScore = score > 1 ? score : score * 100;
  const scoreFormatted = normalizedScore.toFixed(1);

  // Default color determination if not provided
  let strokeColor = color;
  if (!strokeColor) {
    if (normalizedScore >= 45) {
      strokeColor = "#22c55e"; // Emerald green
    } else if (normalizedScore >= 38) {
      strokeColor = "#38bdf8"; // Sky blue
    } else if (normalizedScore >= 30) {
      strokeColor = "#fbbf24"; // Amber
    } else {
      strokeColor = "#a855f7"; // Purple
    }
  }

  // Size dimensions
  const dimensions = {
    sm: { width: 56, height: 56, strokeWidth: 4.5, radius: 23, textClass: "text-xs font-bold", labelClass: "text-[9px]" },
    md: { width: 72, height: 72, strokeWidth: 5.5, radius: 30, textClass: "text-sm font-extrabold", labelClass: "text-[10px]" },
    lg: { width: 96, height: 96, strokeWidth: 7, radius: 40, textClass: "text-lg font-black", labelClass: "text-xs" },
    xl: { width: 112, height: 112, strokeWidth: 8, radius: 46, textClass: "text-2xl font-black", labelClass: "text-xs" },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="-rotate-90 transform"
      >
        <defs>
          <filter id={`glow-${size}-${strokeColor.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={strokeColor} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Track circle */}
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={dimensions.radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={dimensions.strokeWidth}
          fill="transparent"
        />

        {/* Progress meter */}
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={dimensions.radius}
          stroke={strokeColor}
          strokeWidth={dimensions.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: "stroke-dashoffset 0.8s ease-in-out",
            filter: `url(#glow-${size}-${strokeColor.replace('#', '')})`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`leading-none text-white tracking-tight ${dimensions.textClass}`}
          style={{ color: "#ffffff" }}
        >
          {scoreFormatted}%
        </span>
        {label && (
          <span className={`mt-0.5 font-medium leading-none text-slate-400 ${dimensions.labelClass}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
