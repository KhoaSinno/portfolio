"use client";

import React from "react";
import {
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  Server,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { InfiniteMarquee } from "./InfiniteMarquee";

interface TechStackMarqueeProps {
  skills?: Array<{
    category: string;
    items?: string;
    skills?: string[];
  }>;
}

const defaultRow1 = [
  { name: "Next.js", icon: Globe, color: "text-white" },
  { name: "TypeScript", icon: Code2, color: "text-blue-400" },
  { name: "Python / FastAPI", icon: Terminal, color: "text-emerald-400" },
  { name: "NestJS", icon: Server, color: "text-rose-400" },
  { name: "Flutter", icon: Layers, color: "text-sky-400" },
  { name: "React 19", icon: Code2, color: "text-cyan-400" },
  { name: "Tailwind CSS", icon: Sparkles, color: "text-teal-300" },
];

const defaultRow2 = [
  { name: "AI & RAG Pipeline", icon: Sparkles, color: "text-amber-300" },
  { name: "PostgreSQL & Supabase", icon: Database, color: "text-indigo-400" },
  { name: "LiveKit WebRTC", icon: Cpu, color: "text-violet-400" },
  { name: "Firebase & Firestore", icon: Database, color: "text-amber-400" },
  { name: "Docker & Linux", icon: Wrench, color: "text-blue-300" },
  { name: "Gemini / OpenAI LLM", icon: Sparkles, color: "text-purple-300" },
  { name: "Redis & WebSockets", icon: Server, color: "text-red-400" },
];

export function TechStackMarquee({ skills }: TechStackMarqueeProps) {
  // If user has custom skills from DB, dynamically construct marquee items
  let row1 = defaultRow1;
  let row2 = defaultRow2;

  if (skills && skills.length > 0) {
    const allSkills = skills.flatMap((cat) => {
      const skillList = Array.isArray(cat.skills)
        ? cat.skills
        : typeof cat.items === "string"
        ? cat.items.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      return skillList.map((s) => ({
        name: s,
        icon: cat.category.toLowerCase().includes("ai")
          ? Sparkles
          : cat.category.toLowerCase().includes("data") || cat.category.toLowerCase().includes("db")
          ? Database
          : cat.category.toLowerCase().includes("back") || cat.category.toLowerCase().includes("server")
          ? Server
          : Code2,
        color: "text-indigo-300",
      }));
    });

    const half = Math.ceil(allSkills.length / 2);
    if (allSkills.length >= 6) {
      row1 = allSkills.slice(0, half);
      row2 = allSkills.slice(half);
    }
  }

  return (
    <div className="space-y-4 py-4">
      {/* Row 1: Left to Right */}
      <InfiniteMarquee direction="left" speed={35}>
        {row1.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`row1-${idx}-${item.name}`}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/10"
            >
              <Icon className={`h-4 w-4 ${item.color}`} />
              <span>{item.name}</span>
            </div>
          );
        })}
      </InfiniteMarquee>

      {/* Row 2: Right to Left */}
      <InfiniteMarquee direction="right" speed={38}>
        {row2.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`row2-${idx}-${item.name}`}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <Icon className={`h-4 w-4 ${item.color}`} />
              <span>{item.name}</span>
            </div>
          );
        })}
      </InfiniteMarquee>
    </div>
  );
}
