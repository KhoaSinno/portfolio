import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  MapPin,
  Server,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { getPublishedResume } from "@/features/resume/resume-api";
import { defaultResume } from "@/features/resume/resume-schema";
import { CopyEmailButton } from "@/features/home/HomeClientEnhancements";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let resume = defaultResume;
  try {
    const published = await getPublishedResume();
    if (published) resume = published;
  } catch {
    resume = defaultResume;
  }

  const { basics, summary, projects, technicalSkills, experience, education } =
    resume;

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans">
      {/* Background Ambient Glows & Aurora Mesh Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[15%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600/25 via-blue-600/20 to-purple-600/10 blur-[130px]" />
        <div className="absolute top-[35%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-indigo-600/10 blur-[150px]" />
        <div className="absolute top-[70%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-cyan-600/20 via-emerald-600/15 to-blue-600/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d08_1px,transparent_1px),linear-gradient(to_bottom,#1f293d08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Sticky Glass Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="group flex items-center transition hover:opacity-90 active:scale-95"
            title="Sinoo Hub Portfolio"
          >
            <img
              src="/logo.png"
              alt="Sinoo Hub"
              className="h-9 w-auto rounded-xl object-contain shadow-lg shadow-indigo-500/20 transition-transform duration-200 group-hover:scale-105"
            />
          </a>

          {/* Nav Links */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#projects" className="transition hover:text-white">
              Projects
            </a>
            <a href="#skills" className="transition hover:text-white">
              Skills
            </a>
            {experience && experience.length > 0 && (
              <a href="#experience" className="transition hover:text-white">
                Experience
              </a>
            )}
            <a href="#education" className="transition hover:text-white">
              Education
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Admin Login Link */}
            <a
              href="/admin/resume"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              title="Admin Resume CMS"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">CMS</span>
            </a>

            {/* View Full A4 CV CTA */}
            <a
              href="/resume"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.02]"
            >
              <span className="flex items-center gap-1.5 rounded-[7px] bg-[#030712] px-3.5 py-1.5 transition duration-300 group-hover:bg-opacity-0">
                <FileText className="h-3.5 w-3.5 text-indigo-300 group-hover:text-white" />
                <span>View CV (A4)</span>
              </span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero Section */}
        <section id="top" className="pt-20 pb-16 sm:pt-28 sm:pb-24">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Available for Fullstack Internships & Engineering Roles</span>
          </div>

          {/* Main Title & Headline */}
          <h1 className="mt-8 text-balance text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Hi, I&apos;m{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {basics.name}
            </span>
          </h1>

          <p className="mt-4 text-xl font-semibold text-slate-300 sm:text-2xl">
            {basics.headline}
          </p>

          {basics.location && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-400">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <span>{basics.location}</span>
            </div>
          )}

          {/* Professional Summary */}
          {summary && (
            <p className="mt-6 max-w-3xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
              {summary}
            </p>
          )}

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition duration-200 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
            >
              <span>Explore Selected Work</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/resume"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur-md transition duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Open Printable CV</span>
            </a>

            {basics.github && (
              <a
                href={
                  basics.github.startsWith("http")
                    ? basics.github
                    : `https://${basics.github}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                title="GitHub Profile"
              >
                <GithubIcon className="h-5 w-5" />
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="h-5 w-5 text-blue-400" />
              </a>
            )}
          </div>
        </section>

        {/* Selected Work / Featured Projects */}
        <section
          id="projects"
          className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
        >
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

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, idx) => {
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

              return (
                <article
                  key={`${project.name}-${idx}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  <div>
                    {/* Role & Period Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      {project.role && (
                        <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-medium text-indigo-300 border border-indigo-500/30">
                          {project.role}
                        </span>
                      )}
                      {project.period && (
                        <span className="font-mono text-slate-400 text-[11.5px]">
                          {project.period}
                        </span>
                      )}
                    </div>

                    {/* Project Title */}
                    <h3 className="mt-4 text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {project.name}
                    </h3>

                    {/* Highlights / Description */}
                    {highlightLines.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-300">
                        {highlightLines.slice(0, 3).map((line, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Tech Stack & Repository Links */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    {techList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {techList.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {project.repository && (
                      <div className="mt-4 flex items-center justify-between">
                        <a
                          href={
                            project.repository.startsWith("http")
                              ? project.repository
                              : `https://${project.repository}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <GithubIcon className="h-3.5 w-3.5" />
                          <span>Source / Demo</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Technical Toolkit / Skills */}
        <section
          id="skills"
          className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
        >
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

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {technicalSkills.map((skillGroup, idx) => {
              const items = skillGroup.items
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean);

              return (
                <div
                  key={`${skillGroup.category}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-md transition duration-300 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
                      {getSkillCategoryIcon(skillGroup.category)}
                    </div>
                    <h3 className="font-bold text-white text-base">
                      {skillGroup.category}
                    </h3>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {items.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-white"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Experience Section (Conditionally rendered) */}
        {experience && experience.length > 0 && (
          <section
            id="experience"
            className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                <Briefcase className="h-3.5 w-3.5" />
                Work History
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Professional Experience
              </h2>
            </div>

            <div className="mt-10 space-y-6">
              {experience.map((exp, idx) => {
                const bullets = exp.highlights
                  ? exp.highlights
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <div
                    key={`${exp.company}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-md transition hover:border-blue-500/40"
                  >
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Education Section */}
        <section
          id="education"
          className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="h-3.5 w-3.5" />
              Academic Background
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Education & Degrees
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {education.map((edu, idx) => (
              <div
                key={`${edu.institution}-${idx}`}
                className="flex gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-md transition hover:border-emerald-500/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <h3 className="font-bold text-white text-base">
                      {edu.institution}
                    </h3>
                    {edu.period && (
                      <span className="font-mono text-xs text-slate-400">
                        {edu.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-emerald-300">
                    {edu.degree}
                  </p>
                  {edu.details && (
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {edu.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact & Connect Section */}
        <section
          id="contact"
          className="scroll-mt-24 border-t border-white/10 py-16 sm:py-24"
        >
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/20 p-8 sm:p-14 shadow-2xl backdrop-blur-xl">
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-md bg-indigo-500/20 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                Let&apos;s Connect
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Have a product problem worth solving?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                I am actively seeking Fullstack Developer Intern opportunities
                and exciting software engineering challenges. Feel free to reach
                out directly!
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-md transition hover:border-blue-400/40 hover:bg-white/10 hover:text-white"
                  >
                    <LinkedinIcon className="h-4 w-4 text-blue-400" />
                    <span>LinkedIn</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </a>
                )}

                <a
                  href="/resume"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:scale-105"
                >
                  <FileText className="h-4 w-4" />
                  <span>Read Full CV (A4)</span>
                </a>
              </div>
            </div>
          </div>
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
