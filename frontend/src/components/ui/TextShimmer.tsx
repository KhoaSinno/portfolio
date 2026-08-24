"use client";

import React from "react";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
}

/**
 * OriginKit-style TextShimmer
 * Sweeping luminous gradient light that runs across text characters.
 */
export function TextShimmer({
  children,
  className = "",
}: TextShimmerProps) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent animate-text-shimmer ${className}`}
    >
      {children}
    </span>
  );
}
