import { z } from "zod";

const datedRole = z.object({
  company: z.string().min(1, "Company is required."),
  role: z.string().min(1, "Role is required."),
  period: z.string().min(1, "Period is required."),
  highlights: z.string(),
  isVisible: z.boolean().default(true),
});

export const RESUME_SECTION_KEYS = [
  "summary",
  "technicalSkills",
  "experience",
  "projects",
  "education",
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTION_KEYS)[number];

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Professional Summary",
  technicalSkills: "Technical Skills",
  experience: "Professional Experience",
  projects: "Featured Projects",
  education: "Education",
};

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "technicalSkills",
  "experience",
  "projects",
  "education",
];

export const resumeSchema = z.object({
  basics: z.object({
    name: z.string().min(2, "Enter your full name."),
    headline: z.string().min(2, "Enter a professional headline."),
    email: z.string().email("Enter a valid email address."),
    location: z.string().min(2, "Enter your location."),
    website: z.string(),
    linkedin: z.string(),
    github: z.string(),
  }),
  summary: z.string().min(30, "Write a short summary of at least 30 characters."),
  technicalSkills: z.array(z.object({
    category: z.string().min(1, "Skill category is required."),
    items: z.string().min(1, "Add skills for this category."),
    isVisible: z.boolean().default(true),
  })).min(1, "Add at least one skill category."),
  experience: z.array(datedRole),
  projects: z.array(z.object({
    name: z.string().min(1, "Project name is required."),
    role: z.string().optional(),
    period: z.string().optional(),
    techStack: z.string().optional(),
    repository: z.string().optional(),
    demoUrl: z.string().optional(),
    projectSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().or(z.literal("")),
    thumbnailUrl: z.string().url().optional().or(z.literal("")),
    thumbnailAlt: z.string().max(160).optional(),
    highlights: z.string().optional(),
    isVisible: z.boolean().default(true),
    hideRepository: z.boolean().default(false),
    hideDemoUrl: z.boolean().default(false),
  })).min(1, "Add at least one featured project."),
  education: z.array(z.object({
    institution: z.string().min(1, "Institution is required."),
    period: z.string().min(1, "Period is required."),
    degree: z.string().min(1, "Degree is required."),
    details: z.string().optional(),
    isVisible: z.boolean().default(true),
  })).min(1, "Add at least one education entry."),
  sectionOrder: z.array(z.enum(["summary", "technicalSkills", "experience", "projects", "education"])),
  hiddenSections: z.array(z.string()).default([]),
  hiddenBasicsFields: z.array(z.string()).default([]),
});

export type ResumeData = z.infer<typeof resumeSchema>;

export const defaultResume: ResumeData = {
  basics: {
    name: "Nguyen Tran Anh Khoa",
    headline: "Intern Fullstack Developer",
    email: "ntakhoa@gmail.com",
    location: "Can Tho City, Vietnam",
    website: "yourportfolio.com",
    linkedin: "linkedin.com/in/khoa-anh-7866b0351",
    github: "github.com/khoasinno",
  },
  summary:
    "Final-year IT student and aspiring fullstack developer with a strong foundation in modern web development. I enjoy turning ideas into useful products and continuously improving through hands-on projects.",
  technicalSkills: [
    {
      category: "Frontend",
      items: "TypeScript, Next.js, React, Tailwind CSS, responsive UI",
      isVisible: true,
    },
    {
      category: "Backend & Database",
      items: "NestJS, FastAPI, PostgreSQL, Prisma, Supabase",
      isVisible: true,
    },
    {
      category: "DevOps & Tools",
      items: "Git/GitHub, Docker, Postman, Vercel, Render, EC2",
      isVisible: true,
    },
    {
      category: "AI",
      items: "Hybrid RAG, RRF, Reranking, Vector database",
      isVisible: true,
    },
  ],
  experience: [],
  projects: [
    {
      name: "TRIAM audiobook with Agent assistant",
      role: "Capstone",
      period: "3/2026 - 8/2026",
      techStack:
        "Flutter · FastAPI · Hybrid RAG · Voice realtime with Livekit and OpenAI realtime API · Supabase",
      repository: "github.com/khoasinno",
      demoUrl: "",
      projectSlug: "triam-audiobook",
      thumbnailUrl: "",
      thumbnailAlt: "TRIAM audiobook application preview",
      highlights:
        "Built a Vietnamese audiobook application with intelligent voice conversational AI assistant.\nIntegrated LiveKit WebRTC and OpenAI Realtime API for low-latency voice streaming.\nImplemented Hybrid RAG with Vector Search and RRF reranking for accurate content discovery.",
      isVisible: true,
      hideRepository: false,
      hideDemoUrl: false,
    },
    {
      name: "Portfolio Platform",
      role: "Personal project",
      period: "5/2026 - 8/2026",
      techStack: "Next.js · TypeScript · NestJS · PostgreSQL",
      repository: "github.com/khoasinno/portfolio",
      demoUrl: "https://www.nguyentrananhkhoa.id.vn",
      projectSlug: "portfolio-platform",
      thumbnailUrl: "",
      thumbnailAlt: "Portfolio Platform preview",
      highlights:
        "Designed a fullstack portfolio with a structured resume editor.\nBuilt reusable resume templates with print-ready HTML and CSS.\nPlanned a scalable backend architecture for projects, AI chat, and content management.",
      isVisible: true,
      hideRepository: false,
      hideDemoUrl: false,
    },
  ],
  education: [
    {
      institution: "Can Tho University of Technology",
      period: "2022 — Now",
      degree: "Information Technology",
      details: "Major in Software Engineering · GPA: 3.6/4.0\nCapstone Project: Triam Audiobook with AI Voice Agent",
      isVisible: true,
    },
  ],
  sectionOrder: ["summary", "technicalSkills", "projects", "education"],
  hiddenSections: [],
  hiddenBasicsFields: [],
};

export const RESUME_DRAFT_KEY = "portfolio.resume.draft";
export const RESUME_PUBLISHED_KEY = "portfolio.resume.published";

export function parseStoredResume(value: string | null): ResumeData | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value);
    if (raw && typeof raw === "object") {
      if (!raw.sectionOrder) {
        raw.sectionOrder = [...DEFAULT_SECTION_ORDER];
      }
      if (!raw.hiddenSections) {
        raw.hiddenSections = [];
      }
    }
    const parsed = resumeSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
