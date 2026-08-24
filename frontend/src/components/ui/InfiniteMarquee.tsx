"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: number; // Duration in seconds
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * OriginKit-style Infinite Marquee
 * Continuous seamless horizontal scrolling with pause-on-hover and edge fade masks.
 */
export function InfiniteMarquee({
  children,
  direction = "left",
  speed = 30,
  pauseOnHover = true,
  className = "",
}: InfiniteMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  const initialX = direction === "left" ? "0%" : "-50%";
  const targetX = direction === "left" ? "-50%" : "0%";

  return (
    <div
      className={`relative w-full overflow-hidden mask-gradient-x py-2 ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        className="flex w-max items-center gap-4"
        animate={{
          x: [initialX, targetX],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {/* Render content twice for a seamless infinite loop */}
        <div className="flex items-center gap-4 shrink-0">{children}</div>
        <div className="flex items-center gap-4 shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
