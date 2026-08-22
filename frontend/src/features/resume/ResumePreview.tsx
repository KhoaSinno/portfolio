import type { ReactNode, RefObject } from "react";
import {
  ExternalLink,
  Globe,
  Mail,
  MapPin,
} from "lucide-react";
import {
  DEFAULT_SECTION_ORDER,
  type ResumeData,
  type ResumeSectionKey,
} from "./resume-schema";

function GithubIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkedinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.02-3.3 1.65 1.65 0 0 0 .02 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

type ResumePreviewProps = {
  resume: ResumeData;
  contentRef?: RefObject<HTMLDivElement | null>;
  showPageGuide?: boolean;
};

function CleanLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: string;
  icon?: ReactNode;
}) {
  if (!href) return null;
  const safeHref = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 hover:underline"
      href={safeHref}
      target="_blank"
      rel="noreferrer"
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

function Bullets({ value }: { value: string }) {
  if (!value) return null;
  const items = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? (
    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12.5px] leading-[1.45] text-slate-700">
      {items.map((item, idx) => (
        <li key={idx} className="pl-0.5">
          {item}
        </li>
      ))}
    </ul>
  ) : null;
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 first:mt-3">
      <h2 className="mb-2 border-b border-slate-300 pb-0.5 text-[13px] font-bold uppercase tracking-wider text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ResumePreview({
  resume,
  contentRef,
  showPageGuide = false,
}: ResumePreviewProps) {
  const sectionOrder: ResumeSectionKey[] =
    resume.sectionOrder && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : DEFAULT_SECTION_ORDER;

  const renderSection = (key: ResumeSectionKey) => {
    switch (key) {
      case "summary":
        if (!resume.summary) return null;
        return (
          <ResumeSection key="summary" title="Professional Summary">
            <p className="text-[12.5px] leading-relaxed text-slate-700 text-justify">
              {resume.summary}
            </p>
          </ResumeSection>
        );

      case "technicalSkills":
        if (!resume.technicalSkills || resume.technicalSkills.length === 0)
          return null;
        return (
          <ResumeSection key="technicalSkills" title="Technical Skills">
            <div className="space-y-1 text-[12.5px] leading-snug text-slate-700">
              {resume.technicalSkills.map((skill, index) => (
                <div
                  key={`${skill.category}-${index}`}
                  className="flex items-baseline gap-1"
                >
                  <strong className="min-w-fit font-semibold text-slate-950">
                    {skill.category}:
                  </strong>
                  <span>{skill.items}</span>
                </div>
              ))}
            </div>
          </ResumeSection>
        );

      case "experience":
        if (!resume.experience || resume.experience.length === 0) return null;
        return (
          <ResumeSection key="experience" title="Professional Experience">
            <div className="space-y-3.5">
              {resume.experience.map((item, index) => (
                <article
                  key={`${item.company}-${index}`}
                  className="break-inside-avoid"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <h3 className="text-[13px] font-bold text-slate-950">
                      {item.role}{" "}
                      <span className="font-normal text-slate-700">
                        — {item.company}
                      </span>
                    </h3>
                    <span className="text-[11.5px] font-medium text-slate-500">
                      {item.period}
                    </span>
                  </div>
                  <Bullets value={item.highlights} />
                </article>
              ))}
            </div>
          </ResumeSection>
        );

      case "projects":
        if (!resume.projects || resume.projects.length === 0) return null;
        return (
          <ResumeSection key="projects" title="Featured Projects">
            <div className="space-y-3.5">
              {resume.projects.map((project, index) => (
                <article
                  key={`${project.name}-${index}`}
                  className="break-inside-avoid"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <h3 className="text-[13px] font-bold text-slate-950">
                      {project.name}
                      {project.role && (
                        <span className="font-normal text-slate-700">
                          {" "}
                          · {project.role}
                        </span>
                      )}
                    </h3>
                    {project.period && (
                      <span className="text-[11.5px] font-medium text-slate-500">
                        {project.period}
                      </span>
                    )}
                  </div>
                  {project.techStack && (
                    <p className="mt-0.5 text-[12px] text-slate-600">
                      <strong className="font-semibold text-slate-800">
                        Tech Stack:
                      </strong>{" "}
                      <span className="italic">{project.techStack}</span>
                    </p>
                  )}
                  {project.repository && (
                    <div className="mt-0.5 text-[12px]">
                      <CleanLink
                        href={project.repository}
                        icon={<ExternalLink className="h-3 w-3" />}
                      >
                        {project.repository}
                      </CleanLink>
                    </div>
                  )}
                  <Bullets value={project.highlights} />
                </article>
              ))}
            </div>
          </ResumeSection>
        );

      case "education":
        if (!resume.education || resume.education.length === 0) return null;
        return (
          <ResumeSection key="education" title="Education">
            <div className="space-y-2.5">
              {resume.education.map((item, index) => (
                <article
                  key={`${item.institution}-${index}`}
                  className="break-inside-avoid"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <h3 className="text-[13px] font-bold text-slate-950">
                      {item.institution}
                    </h3>
                    <span className="text-[11.5px] font-medium text-slate-500">
                      {item.period}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-700">
                    <span className="font-medium text-slate-900">
                      {item.degree}
                    </span>
                    {item.details && (
                      <span className="text-slate-600"> · {item.details}</span>
                    )}
                  </p>
                </article>
              ))}
            </div>
          </ResumeSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full flex justify-center">
      <div
        ref={contentRef}
        className="resume-paper relative w-full max-w-[210mm] rounded-sm bg-white p-5 font-sans text-slate-800 shadow-xl ring-1 ring-black/5 sm:p-7"
        style={{ minHeight: showPageGuide ? "297mm" : "auto" }}
      >
        {/* Header */}
        <header className="border-b-2 border-slate-800 pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {resume.basics.name}
              </h1>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {resume.basics.headline}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {resume.basics.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{resume.basics.location}</span>
              </span>
            )}
            {resume.basics.email && (
              <a
                href={`mailto:${resume.basics.email}`}
                className="inline-flex items-center gap-1 hover:text-slate-950"
              >
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{resume.basics.email}</span>
              </a>
            )}
            {resume.basics.website && (
              <CleanLink
                href={resume.basics.website}
                icon={<Globe className="h-3.5 w-3.5 text-slate-400" />}
              >
                {resume.basics.website}
              </CleanLink>
            )}
            {resume.basics.linkedin && (
              <CleanLink
                href={resume.basics.linkedin}
                icon={<LinkedinIcon className="h-3.5 w-3.5 text-slate-400" />}
              >
                {resume.basics.linkedin}
              </CleanLink>
            )}
            {resume.basics.github && (
              <CleanLink
                href={resume.basics.github}
                icon={<GithubIcon className="h-3.5 w-3.5 text-slate-400" />}
              >
                {resume.basics.github}
              </CleanLink>
            )}
          </div>
        </header>

        {/* Dynamic Sections */}
        {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
      </div>

      {/* Visual Page 1 Boundary Indicator */}
      {showPageGuide && (
        <div
          className="page-break-line pointer-events-none absolute left-0 right-0 z-10 flex items-center justify-center border-b-2 border-dashed border-red-400/80"
          style={{ top: "297mm" }}
        >
          <span className="rounded bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
            A4 Page 1 Boundary (297mm)
          </span>
        </div>
      )}
    </div>
  );
}
