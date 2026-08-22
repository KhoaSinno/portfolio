import { z } from "zod";

const datedRole = z.object({
  company: z.string().min(1, "Company is required."),
  role: z.string().min(1, "Role is required."),
  period: z.string().min(1, "Period is required."),
  highlights: z.string(),
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
  })).min(1, "Add at least one skill category."),
  experience: z.array(datedRole),
  projects: z.array(z.object({
    name: z.string().min(1, "Project name is required."),
    role: z.string(),
    period: z.string(),
    techStack: z.string(),
    repository: z.string(),
    highlights: z.string(),
  })).min(1, "Add at least one featured project."),
  education: z.array(z.object({
    institution: z.string().min(1, "Institution is required."),
    period: z.string().min(1, "Period is required."),
    degree: z.string().min(1, "Degree is required."),
    details: z.string(),
  })).min(1, "Add at least one education entry."),
  sectionOrder: z.array(z.enum(["summary", "technicalSkills", "experience", "projects", "education"])),
});

export type ResumeData = z.infer<typeof resumeSchema>;

export const defaultResume: ResumeData = {
  basics: {
    name: "Your Name",
    headline: "Final-year IT Student | Aspiring Fullstack Developer",
    email: "you@example.com",
    location: "Ho Chi Minh City, Vietnam",
    website: "yourportfolio.com",
    linkedin: "linkedin.com/in/your-name",
    github: "github.com/your-name",
  },
  summary: "Final-year IT student and aspiring fullstack developer with a strong foundation in modern web development. I enjoy turning ideas into useful products and continuously improving through hands-on projects.",
  technicalSkills: [
    { category: "Frontend", items: "TypeScript, Next.js, React, Tailwind CSS, responsive UI" },
    { category: "Backend & Database", items: "NestJS, REST API, PostgreSQL, Prisma, Supabase" },
    { category: "DevOps & Tools", items: "Git/GitHub, Docker, Postman, Vercel, Render" },
  ],
  experience: [],
  projects: [{
    name: "Portfolio Platform",
    role: "Solo Developer",
    period: "2026",
    techStack: "Next.js · TypeScript · NestJS · PostgreSQL",
    repository: "github.com/your-name/portfolio",
    highlights: "Designed a fullstack portfolio with a structured resume editor.\nBuilt reusable resume templates with print-ready HTML and CSS.\nPlanned a scalable backend architecture for projects, AI chat, and content management.",
  }],
  education: [{
    institution: "Your University",
    period: "2022 — 2026",
    degree: "B.Sc. in Information Technology",
    details: "Expected graduation: 2026",
  }],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export const RESUME_DRAFT_KEY = "portfolio.resume.draft";
export const RESUME_PUBLISHED_KEY = "portfolio.resume.published";

export function parseStoredResume(value: string | null): ResumeData | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value);
    if (raw && typeof raw === "object" && !raw.sectionOrder) {
      raw.sectionOrder = [...DEFAULT_SECTION_ORDER];
    }
    const parsed = resumeSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
