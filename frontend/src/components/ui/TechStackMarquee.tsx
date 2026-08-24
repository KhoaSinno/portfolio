"use client";

import React from "react";
import { InfiniteMarquee } from "./InfiniteMarquee";
import { getTechMeta } from "@/lib/tech-meta";

interface TechStackMarqueeProps {
  skills?: Array<{
    category: string;
    items?: string;
    skills?: string[];
  }>;
}

const defaultRow1 = [
  getTechMeta("Next.js"),
  getTechMeta("TypeScript"),
  getTechMeta("Python"),
  getTechMeta("FastAPI"),
  getTechMeta("NestJS"),
  getTechMeta("Flutter"),
  getTechMeta("React 19"),
  getTechMeta("Tailwind CSS"),
];

const defaultRow2 = [
  getTechMeta("Hybrid RAG"),
  getTechMeta("Vector database"),
  getTechMeta("PostgreSQL"),
  getTechMeta("Supabase"),
  getTechMeta("LiveKit WebRTC"),
  getTechMeta("Docker"),
  getTechMeta("Redis"),
  getTechMeta("Gemini AI"),
];

export function TechStackMarquee({ skills }: TechStackMarqueeProps) {
  let row1 = defaultRow1;
  let row2 = defaultRow2;

  if (skills && skills.length > 0) {
    const allSkills = skills.flatMap((cat) => {
      const skillList = Array.isArray(cat.skills)
        ? cat.skills
        : typeof cat.items === "string"
        ? cat.items.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      return skillList.map((s) => getTechMeta(s));
    });

    const half = Math.ceil(allSkills.length / 2);
    if (allSkills.length >= 6) {
      row1 = allSkills.slice(0, half);
      row2 = allSkills.slice(half);
    }
  }

  return (
    <div className="space-y-3.5 py-4">
      {/* Row 1: Left to Right */}
      <InfiniteMarquee direction="left" speed={32}>
        {row1.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`row1-${idx}-${item.name}`}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-violet-500/10 hover:scale-[1.03]"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${item.badgeBg}`}>
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <span>{item.name}</span>
            </div>
          );
        })}
      </InfiniteMarquee>

      {/* Row 2: Right to Left */}
      <InfiniteMarquee direction="right" speed={34}>
        {row2.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`row2-${idx}-${item.name}`}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-indigo-500/10 hover:scale-[1.03]"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${item.badgeBg}`}>
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <span>{item.name}</span>
            </div>
          );
        })}
      </InfiniteMarquee>
    </div>
  );
}
