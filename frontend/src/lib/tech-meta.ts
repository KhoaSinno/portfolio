import React from "react";
import {
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiTypescript,
  SiJavascript,
  SiFlutter,
  SiPython,
  SiFastapi,
  SiNestjs,
  SiNodedotjs,
  SiExpress,
  SiPostgresql,
  SiSupabase,
  SiPrisma,
  SiFirebase,
  SiMongodb,
  SiRedis,
  SiDocker,
  SiGit,
  SiGithub,
  SiPostman,
  SiVercel,
  SiRender,
  SiCss,
  SiHtml5,
} from "react-icons/si";
import {
  Brain,
  Cloud,
  Cpu,
  Database,
  Layout,
  Radio,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";

export interface TechMeta {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  borderColor: string;
}

export function getTechMeta(techName: string): TechMeta {
  const lower = techName.toLowerCase().trim();

  // 1. Frontend & Core Web
  if (lower.includes("react")) {
    return {
      name: techName,
      icon: SiReact,
      color: "text-[#61DAFB]",
      badgeBg: "bg-[#61DAFB]/10",
      borderColor: "border-[#61DAFB]/30",
    };
  }
  if (lower.includes("next")) {
    return {
      name: techName,
      icon: SiNextdotjs,
      color: "text-white",
      badgeBg: "bg-white/10",
      borderColor: "border-white/25",
    };
  }
  if (lower.includes("tailwind")) {
    return {
      name: techName,
      icon: SiTailwindcss,
      color: "text-[#06B6D4]",
      badgeBg: "bg-[#06B6D4]/10",
      borderColor: "border-[#06B6D4]/30",
    };
  }
  if (lower.includes("typescript") || lower === "ts") {
    return {
      name: techName,
      icon: SiTypescript,
      color: "text-[#3178C6]",
      badgeBg: "bg-[#3178C6]/10",
      borderColor: "border-[#3178C6]/30",
    };
  }
  if (lower.includes("javascript") || lower === "js") {
    return {
      name: techName,
      icon: SiJavascript,
      color: "text-[#F7DF1E]",
      badgeBg: "bg-[#F7DF1E]/10",
      borderColor: "border-[#F7DF1E]/30",
    };
  }
  if (lower.includes("flutter")) {
    return {
      name: techName,
      icon: SiFlutter,
      color: "text-[#02569B]",
      badgeBg: "bg-[#02569B]/10",
      borderColor: "border-[#02569B]/30",
    };
  }
  if (lower.includes("css")) {
    return {
      name: techName,
      icon: SiCss,
      color: "text-[#1572B6]",
      badgeBg: "bg-[#1572B6]/10",
      borderColor: "border-[#1572B6]/30",
    };
  }
  if (lower.includes("html")) {
    return {
      name: techName,
      icon: SiHtml5,
      color: "text-[#E34F26]",
      badgeBg: "bg-[#E34F26]/10",
      borderColor: "border-[#E34F26]/30",
    };
  }
  if (lower.includes("ui") || lower.includes("responsive") || lower.includes("ux")) {
    return {
      name: techName,
      icon: Layout,
      color: "text-indigo-400",
      badgeBg: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
    };
  }

  // 2. Backend & Languages
  if (lower.includes("python")) {
    return {
      name: techName,
      icon: SiPython,
      color: "text-[#3776AB]",
      badgeBg: "bg-[#3776AB]/10",
      borderColor: "border-[#3776AB]/30",
    };
  }
  if (lower.includes("fastapi")) {
    return {
      name: techName,
      icon: SiFastapi,
      color: "text-[#05998B]",
      badgeBg: "bg-[#05998B]/10",
      borderColor: "border-[#05998B]/30",
    };
  }
  if (lower.includes("nest")) {
    return {
      name: techName,
      icon: SiNestjs,
      color: "text-[#E0234E]",
      badgeBg: "bg-[#E0234E]/10",
      borderColor: "border-[#E0234E]/30",
    };
  }
  if (lower.includes("node")) {
    return {
      name: techName,
      icon: SiNodedotjs,
      color: "text-[#5FA04E]",
      badgeBg: "bg-[#5FA04E]/10",
      borderColor: "border-[#5FA04E]/30",
    };
  }
  if (lower.includes("express")) {
    return {
      name: techName,
      icon: SiExpress,
      color: "text-slate-200",
      badgeBg: "bg-white/10",
      borderColor: "border-white/25",
    };
  }

  // 3. Databases & ORMs
  if (lower.includes("postgres") || lower.includes("sql") || lower.includes("psql")) {
    return {
      name: techName,
      icon: SiPostgresql,
      color: "text-[#4169E1]",
      badgeBg: "bg-[#4169E1]/10",
      borderColor: "border-[#4169E1]/30",
    };
  }
  if (lower.includes("supabase")) {
    return {
      name: techName,
      icon: SiSupabase,
      color: "text-[#3ECF8E]",
      badgeBg: "bg-[#3ECF8E]/10",
      borderColor: "border-[#3ECF8E]/30",
    };
  }
  if (lower.includes("prisma")) {
    return {
      name: techName,
      icon: SiPrisma,
      color: "text-cyan-300",
      badgeBg: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
    };
  }
  if (lower.includes("firebase") || lower.includes("firestore")) {
    return {
      name: techName,
      icon: SiFirebase,
      color: "text-[#FFCA28]",
      badgeBg: "bg-[#FFCA28]/10",
      borderColor: "border-[#FFCA28]/30",
    };
  }
  if (lower.includes("mongo")) {
    return {
      name: techName,
      icon: SiMongodb,
      color: "text-[#47A248]",
      badgeBg: "bg-[#47A248]/10",
      borderColor: "border-[#47A248]/30",
    };
  }
  if (lower.includes("redis")) {
    return {
      name: techName,
      icon: SiRedis,
      color: "text-[#FF4438]",
      badgeBg: "bg-[#FF4438]/10",
      borderColor: "border-[#FF4438]/30",
    };
  }

  // 4. AI / RAG / Machine Learning
  if (lower.includes("gemini") || lower.includes("google")) {
    return {
      name: techName,
      icon: Sparkles,
      color: "text-[#8E75FF]",
      badgeBg: "bg-[#8E75FF]/10",
      borderColor: "border-[#8E75FF]/30",
    };
  }
  if (lower.includes("openai") || lower.includes("gpt")) {
    return {
      name: techName,
      icon: Brain,
      color: "text-[#10A37F]",
      badgeBg: "bg-[#10A37F]/10",
      borderColor: "border-[#10A37F]/30",
    };
  }
  if (lower.includes("rrf") || lower.includes("rerank")) {
    return {
      name: techName,
      icon: Search,
      color: "text-purple-300",
      badgeBg: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    };
  }
  if (lower.includes("vector")) {
    return {
      name: techName,
      icon: Database,
      color: "text-violet-400",
      badgeBg: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
    };
  }
  if (lower.includes("rag") || lower.includes("ai") || lower.includes("llm")) {
    return {
      name: techName,
      icon: Brain,
      color: "text-purple-300",
      badgeBg: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    };
  }

  // 5. DevOps, Cloud & Tools
  if (lower.includes("docker")) {
    return {
      name: techName,
      icon: SiDocker,
      color: "text-[#2496ED]",
      badgeBg: "bg-[#2496ED]/10",
      borderColor: "border-[#2496ED]/30",
    };
  }
  if (lower.includes("github")) {
    return {
      name: techName,
      icon: SiGithub,
      color: "text-white",
      badgeBg: "bg-white/10",
      borderColor: "border-white/25",
    };
  }
  if (lower.includes("git")) {
    return {
      name: techName,
      icon: SiGit,
      color: "text-[#F05032]",
      badgeBg: "bg-[#F05032]/10",
      borderColor: "border-[#F05032]/30",
    };
  }
  if (lower.includes("postman")) {
    return {
      name: techName,
      icon: SiPostman,
      color: "text-[#FF6C37]",
      badgeBg: "bg-[#FF6C37]/10",
      borderColor: "border-[#FF6C37]/30",
    };
  }
  if (lower.includes("vercel")) {
    return {
      name: techName,
      icon: SiVercel,
      color: "text-white",
      badgeBg: "bg-white/10",
      borderColor: "border-white/25",
    };
  }
  if (lower.includes("render")) {
    return {
      name: techName,
      icon: SiRender,
      color: "text-[#46E3B7]",
      badgeBg: "bg-[#46E3B7]/10",
      borderColor: "border-[#46E3B7]/30",
    };
  }
  if (lower.includes("aws") || lower.includes("ec2") || lower.includes("s3")) {
    return {
      name: techName,
      icon: Cloud,
      color: "text-[#FF9900]",
      badgeBg: "bg-[#FF9900]/10",
      borderColor: "border-[#FF9900]/30",
    };
  }
  if (lower.includes("livekit") || lower.includes("webrtc") || lower.includes("socket")) {
    return {
      name: techName,
      icon: Radio,
      color: "text-violet-400",
      badgeBg: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
    };
  }

  // Fallback
  return {
    name: techName,
    icon: Wrench,
    color: "text-slate-300",
    badgeBg: "bg-white/[0.04]",
    borderColor: "border-white/10",
  };
}
