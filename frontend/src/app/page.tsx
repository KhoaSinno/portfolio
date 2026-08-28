/* eslint-disable @next/next/no-html-link-for-pages */
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Battery,
  Briefcase,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  MapPin,
  Play,
  Server,
  Smartphone,
  Sparkles,
  Terminal,
  Video,
  Wifi,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { getPublishedResume } from "@/features/resume/resume-api";
import { defaultResume } from "@/features/resume/resume-schema";
import { CopyEmailButton } from "@/features/home/HomeClientEnhancements";
import { ContactForm } from "@/features/home/ContactForm";
import { getProjectRepositories, getProjectSlug, isVideoUrl, normalizeImageUrl } from "@/lib/image-url";
import { ProjectVisualFrame } from "@/features/projects/ProjectVisualFrame";
import { FloatingNavbar } from "@/components/ui/FloatingNavbar";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { TextShimmer } from "@/components/ui/TextShimmer";
import { TechStackMarquee } from "@/components/ui/TechStackMarquee";
import { getTechMeta } from "@/lib/tech-meta";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkedinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.02-3.3 1.65 1.65 0 0 0 .02 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

function getSkillCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (
    lower.includes("front") ||
    lower.includes("ui") ||
    lower.includes("web")
  ) {
    return <Code2 className="h-5 w-5 text-cyan-400" />;
  }
  if (
    lower.includes("back") ||
    lower.includes("api") ||
    lower.includes("server")
  ) {
    return <Server className="h-5 w-5 text-indigo-400" />;
  }
  if (lower.includes("data") || lower.includes("db") || lower.includes("sql")) {
    return <Database className="h-5 w-5 text-emerald-400" />;
  }
  if (
    lower.includes("ai") ||
    lower.includes("rag") ||
    lower.includes("ml") ||
    lower.includes("llm")
  ) {
    return <Sparkles className="h-5 w-5 text-purple-400" />;
  }
  if (
    lower.includes("devops") ||
    lower.includes("cloud") ||
    lower.includes("docker") ||
    lower.includes("tool")
  ) {
    return <Wrench className="h-5 w-5 text-amber-400" />;
  }
  return <Cpu className="h-5 w-5 text-blue-400" />;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nguyentrananhkhoa.id.vn";

export const revalidate = 30;

export default async function Home() {
  let resume = defaultResume;
  try {
    const published = await getPublishedResume();
    if (published) resume = published;
  } catch {
    resume = defaultResume;
  }

  const { basics, summary, projects, technicalSkills, experience, education, hiddenSections = [], hiddenBasicsFields = [] } =
    resume;

  const visibleProjects = (projects || []).filter((p) => p.isVisible !== false && p.showOnWeb !== false);
  const visibleSkills = (technicalSkills || []).filter((s) => s.isVisible !== false);
  const visibleExperience = (experience || []).filter((e) => e.isVisible !== false && e.showOnWeb !== false);
  const visibleEducation = (education || []).filter((ed) => ed.isVisible !== false);

  const showSummary = !hiddenSections.includes("summary") && Boolean(summary);
  const showProjectsSection = !hiddenSections.includes("projects") && visibleProjects.length > 0;
  const showSkillsSection = !hiddenSections.includes("technicalSkills") && visibleSkills.length > 0;
  const showExperienceSection = !hiddenSections.includes("experience") && visibleExperience.length > 0;
  const showEducationSection = !hiddenSections.includes("education") && visibleEducation.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: basics?.name || "Nguyen Tran Anh Khoa",
        alternateName: ["KhoaSinno", "Sinoo"],
        jobTitle: basics?.headline || "Software Engineer & Fullstack Developer",
        description:
          summary ||
          "Fullstack Software Engineer specializing in Next.js, FastAPI, NestJS, Flutter, PostgreSQL, and AI Hybrid RAG Systems.",
        url: siteUrl,
        sameAs: [
          basics?.github
            ? basics.github.startsWith("http")
              ? basics.github
              : `https://${basics.github}`
            : "https://github.com/KhoaSinno",
          basics?.linkedin
            ? basics.linkedin.startsWith("http")
              ? basics.linkedin
              : `https://${basics.linkedin}`
            : undefined,
        ].filter(Boolean),
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Can Tho University of Technology",
        },
        knowsAbout: [
          "Next.js",
          "React",
          "TypeScript",
          "FastAPI",
          "Python",
          "NestJS",
          "Node.js",
          "Flutter",
          "PostgreSQL",
          "Supabase",
          "Prisma",
          "Docker",
          "Hybrid RAG",
          "Artificial Intelligence",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Nguyen Tran Anh Khoa Portfolio",
        description: "Official engineering portfolio of Nguyen Tran Anh Khoa",
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profilepage`,
        url: siteUrl,
        name: `${basics?.name || "Nguyen Tran Anh Khoa"} - Profile`,
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#person`,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background Ambient Glows & Aurora Mesh Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[15%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600/25 via-blue-600/20 to-purple-600/10 blur-[130px]" />
        <div className="absolute top-[35%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-indigo-600/10 blur-[150px]" />
        <div className="absolute top-[70%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-cyan-600/20 via-emerald-600/15 to-blue-600/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d08_1px,transparent_1px),linear-gradient(to_bottom,#1f293d08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating Glassmorphism Navbar */}
      <FloatingNavbar
        showProjects={showProjectsSection}
        showSkills={showSkillsSection}
        showExperience={showExperienceSection}
        showEducation={showEducationSection}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-4 sm:pt-6">
        {/* Hero / About Section */}
        <ScrollReveal direction="up" delay={0.05}>
          <section id="about" className="pt-16 pb-16 sm:pt-24 sm:pb-24 scroll-mt-24">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Available for Fullstack Internships & Engineering Roles</span>
            </div>

            {/* Main Title & Headline */}
            <h1 className="mt-8 text-balance text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {!hiddenBasicsFields.includes("name") ? (
                <>
                  Hi, I&apos;m{" "}
                  <span className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent font-extrabold">
                    {basics.name}
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent font-extrabold">
                  Fullstack Software Engineer
                </span>
              )}
            </h1>

            {!hiddenBasicsFields.includes("headline") && basics.headline && (
              <p className="mt-4 text-xl font-semibold text-slate-300 sm:text-2xl">
                {basics.headline}
              </p>
            )}

            {!hiddenBasicsFields.includes("location") && basics.location && (
              <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-400">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>{basics.location}</span>
              </div>
            )}

            {/* Professional Summary */}
            {showSummary && (
              <p className="mt-6 max-w-3xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
                {summary}
              </p>
            )}

            {/* Hero CTAs with Spring Feedback */}
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <a
                href="#projects"
                className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
              >
                <span>Explore Selected Work</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>

              <a
                href="/resume"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Open Printable CV</span>
              </a>

              {!hiddenBasicsFields.includes("github") && basics.github && (
                <a
                  href={
                    basics.github.startsWith("http")
                      ? basics.github
                      : `https://${basics.github}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                  title="GitHub Profile"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
              )}

              {!hiddenBasicsFields.includes("linkedin") && basics.linkedin && (
                <a
                  href={
                    basics.linkedin.startsWith("http")
                      ? basics.linkedin
                      : `https://${basics.linkedin}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                  title="LinkedIn Profile"
                >
                  <LinkedinIcon className="h-5 w-5 text-blue-400" />
                </a>
              )}

              {!hiddenBasicsFields.includes("website") && basics.website && (
                <a
                  href={
                    basics.website.startsWith("http")
                      ? basics.website
                      : `https://${basics.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                  title="Personal Website"
                >
                  <Globe className="h-5 w-5 text-emerald-400" />
                </a>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Selected Work / Featured Projects with Spotlight Cards */}
        {showProjectsSection && (
          <section
            id="projects"
            className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
          >
            <ScrollReveal direction="up">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                    <Terminal className="h-3.5 w-3.5" />
                    Featured Projects
                  </div>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Systems & Applications I&apos;ve Built
                  </h2>
                </div>
                <p className="max-w-md text-sm text-slate-400">
                  Hands-on engineering projects showcasing fullstack architecture,
                  AI integrations, and responsive UX.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 space-y-8">
              {visibleProjects.map((project, idx) => {
                const projectSlug = getProjectSlug(project);
                const techList = project.techStack
                  ? project.techStack
                      .split(/[·,]/)
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : [];
                const highlightLines = project.highlights
                  ? project.highlights
                      .split("\n")
                      .map((h) => h.trim())
                      .filter(Boolean)
                  : [];

                const isMobileApp =
                  project.techStack?.toLowerCase().includes("flutter") ||
                  project.techStack?.toLowerCase().includes("react native") ||
                  project.techStack?.toLowerCase().includes("riverpod") ||
                  project.techStack?.toLowerCase().includes("mobile") ||
                  project.role?.toLowerCase().includes("flutter") ||
                  project.name?.toLowerCase().includes("mobile") ||
                  project.name?.toLowerCase().includes("app");

                return (
                  <ScrollReveal key={`${project.name}-${idx}`} direction="up" delay={idx * 0.08}>
                    <SpotlightCard className="overflow-hidden border border-white/10 p-0 transition-all duration-300 hover:border-white/20">
                      <div className="grid lg:grid-cols-12">
                        {/* Left Column: Visual Media / Interactive Window Mockup */}
                        <div className="relative min-h-[260px] sm:min-h-[300px] lg:col-span-6 lg:min-h-[340px] flex flex-col justify-center bg-slate-950/80 p-3 sm:p-5 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
                          <ProjectVisualFrame project={project} />
                        </div>

                        {/* Right Column: Project Details & Tech Badges */}
                        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6">
                          <div>
                            {/* Role & Period Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {project.role && (
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-medium text-indigo-300 border border-indigo-500/20">
                                  <Code2 className="h-3.5 w-3.5" />
                                  {project.role}
                                </span>
                              )}
                              {project.period && (
                                <span className="font-mono text-xs text-slate-400">
                                  {project.period}
                                </span>
                              )}
                            </div>

                            {/* Project Name & Link to Case Study */}
                            <h3 className="mt-4 text-2xl font-bold text-white tracking-tight">
                              {projectSlug ? (
                                <Link
                                  href={`/projects/${projectSlug}`}
                                  className="group/title inline-flex items-center gap-2 hover:text-indigo-300 transition-colors"
                                  title={`Read ${project.name} Case Study`}
                                >
                                  <span>{project.name}</span>
                                  <ArrowUpRight className="h-5 w-5 text-indigo-400 opacity-60 transition-all duration-200 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5" />
                                </Link>
                              ) : (
                                project.name
                              )}
                            </h3>

                            {/* Highlight Bullet Points */}
                            {highlightLines.length > 0 && (
                              <ul className="mt-4 space-y-2 text-sm text-slate-300 leading-relaxed">
                                {highlightLines.map((bullet, bIdx) => (
                                  <li key={bIdx} className="flex items-start gap-2.5">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="mt-6 pt-5 border-t border-white/10">
                            {/* Tech Stack Chips with Dynamic Meta Icons */}
                            {techList.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {techList.map((tech, tIdx) => {
                                  const meta = getTechMeta(tech);
                                  const Icon = meta.icon;
                                  return (
                                    <span
                                      key={tIdx}
                                      className={`inline-flex items-center gap-1.5 rounded-lg border ${meta.borderColor} ${meta.badgeBg} px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:scale-105`}
                                    >
                                      <Icon className={`h-3 w-3 ${meta.color}`} />
                                      <span>{tech}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Links / CTAs */}
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                              {projectSlug && (
                                <Link
                                  href={`/projects/${projectSlug}`}
                                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 shadow-lg shadow-indigo-500/10 backdrop-blur-md transition hover:border-indigo-500/60 hover:bg-indigo-500/20 hover:text-white active:scale-95"
                                  title={`Read Case Study for ${project.name}`}
                                >
                                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>Case Study</span>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400/80" />
                                </Link>
                              )}

                              {!project.hideRepository && (() => {
                                const repos = getProjectRepositories(project);
                                if (repos.length === 0) return null;
                                return repos.map((repo, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={repo.cleanUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
                                    title={`Open ${repo.label} on GitHub`}
                                  >
                                    <GithubIcon className="h-4 w-4" />
                                    <span>{repo.label}</span>
                                  </a>
                                ));
                              })()}

                              {!project.hideDemoUrl && project.demoUrl && (() => {
                                const isVideo = isVideoUrl(project.demoUrl) || isMobileApp;
                                const cleanUrl = project.demoUrl.startsWith("http")
                                  ? project.demoUrl
                                  : `https://${project.demoUrl}`;

                                return isVideo ? (
                                  <a
                                    href={cleanUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 shadow-lg shadow-rose-500/10 backdrop-blur-md transition hover:border-rose-500/60 hover:bg-rose-500/20 hover:text-white active:scale-95"
                                  >
                                    <Play className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                                    <span>Watch Demo</span>
                                    <ExternalLink className="h-3.5 w-3.5 text-rose-400/80" />
                                  </a>
                                ) : (
                                  <a
                                    href={cleanUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-white active:scale-95"
                                  >
                                    <Globe className="h-4 w-4 text-emerald-400" />
                                    <span>Live Demo</span>
                                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                                  </a>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SpotlightCard>
                  </ScrollReveal>
                );
              })}
            </div>
          </section>
        )}

        {/* Technical Toolkit & Infinite Marquee */}
        {showSkillsSection && (
          <section
            id="skills"
            className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
          >
            <ScrollReveal direction="up">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20">
                    <Layers className="h-3.5 w-3.5" />
                    Technical Toolkit
                  </div>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Skills & Technologies
                  </h2>
                </div>
                <p className="max-w-md text-sm text-slate-400">
                  Modern frontend frameworks, scalable backend APIs, database
                  design, and generative AI toolchains.
                </p>
              </div>
            </ScrollReveal>

            {/* Dual-Direction Infinite Tech Marquee */}
            <div className="mt-8">
              <TechStackMarquee skills={visibleSkills} />
            </div>

            {/* Bento Grid Categorized Skills (Balanced 2x2 Grid) */}
            <StaggerContainer className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-2 items-stretch">
              {visibleSkills.map((skillGroup, idx) => {
                const items = skillGroup.items
                  .split(",")
                  .map((i) => i.trim())
                  .filter(Boolean);

                return (
                  <StaggerItem key={`${skillGroup.category}-${idx}`} className="h-full">
                    <SpotlightCard className="h-full flex flex-col justify-between p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-sm">
                              {getSkillCategoryIcon(skillGroup.category)}
                            </div>
                            <h3 className="font-bold text-white text-base tracking-tight">
                              {skillGroup.category}
                            </h3>
                          </div>
                          <span className="font-mono text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                            {items.length} skills
                          </span>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                          {items.map((skill, sIdx) => {
                            const meta = getTechMeta(skill);
                            const Icon = meta.icon;
                            return (
                              <span
                                key={sIdx}
                                className={`inline-flex items-center gap-2 rounded-xl border ${meta.borderColor} ${meta.badgeBg} px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition-all duration-200 hover:scale-105`}
                              >
                                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                                <span>{skill}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </section>
        )}

        {/* Experience Section (Conditionally rendered) */}
        {showExperienceSection && (
          <section
            id="experience"
            className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
          >
            <ScrollReveal direction="up">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                  <Briefcase className="h-3.5 w-3.5" />
                  Work History
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Professional Experience
                </h2>
              </div>
            </ScrollReveal>

            <StaggerContainer className="mt-10 space-y-6">
              {visibleExperience.map((exp, idx) => {
                const bullets = exp.highlights
                  ? exp.highlights
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <StaggerItem key={`${exp.company}-${idx}`}>
                    <SpotlightCard className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {exp.role}
                          </h3>
                          <p className="text-sm font-semibold text-indigo-400">
                            {exp.company}
                          </p>
                        </div>
                        {exp.period && (
                          <span className="font-mono text-xs font-medium text-slate-400">
                            {exp.period}
                          </span>
                        )}
                      </div>

                      {bullets.length > 0 && (
                        <ul className="mt-5 space-y-2 text-sm text-slate-300">
                          {bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </section>
        )}

        {/* Education Section */}
        {showEducationSection && (
          <section
            id="education"
            className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
          >
            <ScrollReveal direction="up">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Academic Background
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Education & Degrees
                </h2>
              </div>
            </ScrollReveal>

            <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-2 items-stretch">
              {visibleEducation.map((edu, idx) => {
                const isCertificate =
                  edu.institution.toLowerCase().includes("vstep") ||
                  edu.institution.toLowerCase().includes("ielts") ||
                  edu.institution.toLowerCase().includes("toeic") ||
                  edu.institution.toLowerCase().includes("certificate") ||
                  edu.degree.toLowerCase().includes("b1") ||
                  edu.degree.toLowerCase().includes("b2") ||
                  edu.degree.toLowerCase().includes("cefr") ||
                  edu.degree.toLowerCase().includes("certificate") ||
                  edu.degree.toLowerCase().includes("chứng chỉ") ||
                  edu.degree.toLowerCase().includes("proficiency") ||
                  edu.degree.toLowerCase().includes("english");

                const Icon = isCertificate ? Award : GraduationCap;
                const badgeLabel = isCertificate ? "Language Certificate" : "University Degree";
                const accentBg = isCertificate
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                const tagBg = isCertificate
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                const dotBg = isCertificate ? "bg-amber-400" : "bg-emerald-400";

                return (
                  <StaggerItem key={`${edu.institution}-${idx}`} className="h-full">
                    <SpotlightCard className="h-full flex flex-col justify-between p-6 sm:p-7 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <div>
                        {/* Top Header Row: Icon + Type Badge + Period */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accentBg} shadow-sm`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-medium ${tagBg}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>
                          {edu.period && (
                            <span className="font-mono text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full shrink-0">
                              {edu.period}
                            </span>
                          )}
                        </div>

                        {/* Institution / University */}
                        <h3 className="mt-5 text-lg font-bold text-white tracking-tight">
                          {edu.institution}
                        </h3>

                        {/* Degree / Program */}
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            isCertificate ? "text-amber-300" : "text-emerald-300"
                          }`}
                        >
                          {edu.degree}
                        </p>
                      </div>

                      {/* Details / Bullets */}
                      {edu.details && (
                        <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
                          {edu.details
                            .split("\n")
                            .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
                            .filter(Boolean)
                            .map((bullet, bIdx) => (
                              <div
                                key={bIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed"
                              >
                                <span
                                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotBg}`}
                                />
                                <span>{bullet}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </section>
        )}

        {/* Contact & Connect Section */}
        <section
          id="contact"
          className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
        >
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950/70 p-6 sm:p-12 shadow-2xl backdrop-blur-xl">
              {/* Ambient inner glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />

              <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
                {/* Left Column: Headline & Social Links */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-md bg-indigo-500/20 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    Let&apos;s Connect
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                    Have a product problem worth solving?
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-300">
                    I am actively seeking Fullstack Developer Intern opportunities
                    and high-impact software engineering challenges. Drop your JD or note, or connect directly through any platform below.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {basics.email && <CopyEmailButton email={basics.email} />}

                    {basics.github && (
                      <a
                        href={
                          basics.github.startsWith("http")
                            ? basics.github
                            : `https://${basics.github}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                      >
                        <GithubIcon className="h-4 w-4" />
                        <span>GitHub</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    )}

                    {basics.linkedin && (
                      <a
                        href={
                          basics.linkedin.startsWith("http")
                            ? basics.linkedin
                            : `https://${basics.linkedin}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md transition hover:border-blue-400/40 hover:bg-white/10 hover:text-white"
                      >
                        <LinkedinIcon className="h-4 w-4 text-blue-400" />
                        <span>LinkedIn</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    )}

                    <a
                      href="/resume"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Read Full CV (A4)</span>
                    </a>
                  </div>
                </div>

                {/* Right Column: Interactive Direct Message & JD Drop Form */}
                <div className="lg:col-span-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#030712] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {basics.name}. Built with Next.js,
            NestJS, Prisma & Supabase.
          </p>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-slate-300 transition">
              Back to top ↑
            </a>
            <a href="/resume" className="hover:text-slate-300 transition">
              Resume
            </a>
            <a href="/admin/resume" className="hover:text-slate-300 transition">
              Admin CMS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
