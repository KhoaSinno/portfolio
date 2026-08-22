import type { ReactNode, RefObject } from "react";
import type { ResumeData } from "./resume-schema";

type ResumePreviewProps = { resume: ResumeData; contentRef?: RefObject<HTMLDivElement | null> };

function Link({ href, children }: { href: string; children: string }) {
  if (!href) return null;
  const safeHref = href.startsWith("http") ? href : `https://${href}`;
  return <a className="underline decoration-slate-300 underline-offset-2" href={safeHref} target="_blank" rel="noreferrer">{children}</a>;
}

function Bullets({ value }: { value: string }) {
  const items = value.split("\n").map((item) => item.trim()).filter(Boolean);
  return items.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-5 text-slate-700">{items.map((item) => <li key={item}>{item}</li>)}</ul> : null;
}

export function ResumePreview({ resume, contentRef }: ResumePreviewProps) {
  return (
    <div ref={contentRef} className="resume-paper mx-auto w-full max-w-[210mm] bg-white p-8 font-sans text-slate-800 shadow-xl sm:p-12">
      <header className="border-b-2 border-slate-700 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{resume.basics.name}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-700">{resume.basics.headline}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600"><span>{resume.basics.location}</span><span>{resume.basics.email}</span><Link href={resume.basics.website}>{resume.basics.website}</Link><Link href={resume.basics.linkedin}>{resume.basics.linkedin}</Link><Link href={resume.basics.github}>{resume.basics.github}</Link></div>
      </header>

      <ResumeSection title="Professional Summary"><p className="text-[13px] leading-5 text-slate-700">{resume.summary}</p></ResumeSection>

      <ResumeSection title="Technical Skills"><div className="space-y-1.5 text-[13px] leading-5 text-slate-700">{resume.technicalSkills.map((skill) => <p key={skill.category}><strong className="text-slate-950">{skill.category}: </strong>{skill.items}</p>)}</div></ResumeSection>

      {resume.experience.length > 0 && <ResumeSection title="Professional Experience"><div className="space-y-5">{resume.experience.map((item, index) => <article key={`${item.company}-${index}`} className="break-inside-avoid"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><h3 className="text-[14px] font-bold text-slate-950">{item.role} <span className="font-normal">— {item.company}</span></h3><span className="text-[13px] italic text-slate-600">{item.period}</span></div><Bullets value={item.highlights} /></article>)}</div></ResumeSection>}

      <ResumeSection title="Featured Projects"><div className="space-y-5">{resume.projects.map((project, index) => <article key={`${project.name}-${index}`} className="break-inside-avoid"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><h3 className="text-[14px] font-bold text-slate-950">{project.name} {project.role && <span className="font-normal">— {project.role}</span>}</h3>{project.period && <span className="text-[13px] italic text-slate-600">{project.period}</span>}</div>{project.techStack && <p className="mt-1 text-[13px] text-slate-700"><strong>Stack:</strong> <span className="italic">{project.techStack}</span></p>}{project.repository && <p className="mt-1 text-[13px] text-slate-700"><strong>Repository:</strong> <Link href={project.repository}>{project.repository}</Link></p>}<Bullets value={project.highlights} /></article>)}</div></ResumeSection>

      <ResumeSection title="Education"><div className="space-y-4">{resume.education.map((item, index) => <article key={`${item.institution}-${index}`} className="break-inside-avoid"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><h3 className="text-[14px] font-bold text-slate-950">{item.institution}</h3><span className="text-[13px] italic text-slate-600">{item.period}</span></div><p className="mt-1 text-[13px] italic text-slate-700">{item.degree}{item.details && ` · ${item.details}`}</p></article>)}</div></ResumeSection>
    </div>
  );
}

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-5"><h2 className="mb-2 border-b-2 border-slate-500 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-700">{title}</h2>{children}</section>;
}
