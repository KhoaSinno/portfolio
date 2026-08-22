"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { ResumePreview } from "./ResumePreview";
import { getDraftResume, publishResume, saveResumeDraft } from "./resume-api";
import { defaultResume, resumeSchema, type ResumeData } from "./resume-schema";

export function ResumeEditor() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("Loading resume from the backend...");
  const form = useForm<ResumeData>({ resolver: zodResolver(resumeSchema), defaultValues: defaultResume, mode: "onBlur" });
  const { control, handleSubmit, register, reset, formState: { errors } } = form;
  const skills = useFieldArray({ control, name: "technicalSkills" });
  const experience = useFieldArray({ control, name: "experience" });
  const projects = useFieldArray({ control, name: "projects" });
  const education = useFieldArray({ control, name: "education" });
  const resume = useWatch({ control, defaultValue: defaultResume }) as ResumeData;
  const printResume = useReactToPrint({ contentRef, documentTitle: "resume" });

  useEffect(() => {
    void getDraftResume()
      .then((draft) => {
        if (draft) reset(draft);
        setNotice(draft ? "Loaded the current backend draft." : "Professional Experience is optional — add it only after you have relevant experience.");
      })
      .catch(() => setNotice("Backend is unavailable. Start both frontend and backend, then refresh."));
  }, [reset]);

  const saveDraft = async (values: ResumeData) => {
    try { await saveResumeDraft(values); setNotice("Draft saved to Supabase."); }
    catch { setNotice("Could not save. Confirm the backend is running and retry."); }
  };
  const publish = async (values: ResumeData) => {
    try { await publishResume(values); setNotice("Resume published to Supabase. Open /resume to verify it."); }
    catch { setNotice("Could not publish. Confirm the backend is running and retry."); }
  };

  return <div className="min-h-screen bg-zinc-100 text-zinc-900">
    <header className="no-print border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Portfolio CMS</p><h1 className="text-xl font-semibold tracking-tight">Resume Editor</h1></div><div className="flex flex-wrap justify-end gap-2"><a href="/resume" className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Public resume</a><button type="button" onClick={() => printResume()} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Print / PDF</button><button type="button" onClick={handleSubmit(publish)} className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">Publish</button></div></div></header>
    <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 lg:grid-cols-[minmax(390px,0.8fr)_minmax(0,1.2fr)] lg:px-8">
      <form onSubmit={handleSubmit(saveDraft)} className="no-print space-y-5 self-start rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Content</h2><p className="mt-1 text-sm text-zinc-500">{notice}</p></div><button type="submit" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600">Save draft</button></div>
        <Section title="Basic information"><div className="grid gap-3 sm:grid-cols-2"><Field label="Full name" error={errors.basics?.name?.message} {...register("basics.name")} /><Field label="Headline" error={errors.basics?.headline?.message} {...register("basics.headline")} /><Field label="Email" type="email" error={errors.basics?.email?.message} {...register("basics.email")} /><Field label="Location" error={errors.basics?.location?.message} {...register("basics.location")} /><Field label="Website" {...register("basics.website")} /><Field label="LinkedIn" {...register("basics.linkedin")} /><Field label="GitHub" {...register("basics.github")} /></div></Section>
        <Section title="Professional summary"><textarea className="field min-h-28" {...register("summary")} /><Error message={errors.summary?.message} /></Section>
        <Section title="Technical skills" action="Add category" onAction={() => skills.append({ category: "", items: "" })}>{skills.fields.map((field, index) => <Card key={field.id}><Field label="Category" error={errors.technicalSkills?.[index]?.category?.message} {...register(`technicalSkills.${index}.category`)} /><label className="mt-3 block text-sm font-medium">Skills <span className="font-normal text-zinc-500">(comma-separated)</span></label><textarea className="field mt-1 min-h-20" {...register(`technicalSkills.${index}.items`)} /><Error message={errors.technicalSkills?.[index]?.items?.message} /><Remove onClick={() => skills.remove(index)} /></Card>)}</Section>
        <Section title="Professional experience" action="Add experience" onAction={() => experience.append({ company: "", role: "", period: "", highlights: "" })}><p className="mb-3 text-sm text-zinc-500">Leave this empty if you have not interned or worked yet. It will not appear on the CV.</p>{experience.fields.map((field, index) => <Card key={field.id}><div className="grid gap-3 sm:grid-cols-2"><Field label="Role" error={errors.experience?.[index]?.role?.message} {...register(`experience.${index}.role`)} /><Field label="Company" error={errors.experience?.[index]?.company?.message} {...register(`experience.${index}.company`)} /></div><Field className="mt-3" label="Period" placeholder="03/2026 — 06/2026" error={errors.experience?.[index]?.period?.message} {...register(`experience.${index}.period`)} /><label className="mt-3 block text-sm font-medium">Highlights <span className="font-normal text-zinc-500">(one bullet per line)</span></label><textarea className="field mt-1 min-h-24" {...register(`experience.${index}.highlights`)} /><Remove onClick={() => experience.remove(index)} /></Card>)}</Section>
        <Section title="Featured projects" action="Add project" onAction={() => projects.append({ name: "", role: "", period: "", techStack: "", repository: "", highlights: "" })}>{projects.fields.map((field, index) => <Card key={field.id}><div className="grid gap-3 sm:grid-cols-2"><Field label="Project name" error={errors.projects?.[index]?.name?.message} {...register(`projects.${index}.name`)} /><Field label="Role" placeholder="Solo Developer" {...register(`projects.${index}.role`)} /><Field label="Period" placeholder="01/2026 — 04/2026" {...register(`projects.${index}.period`)} /><Field label="Repository URL" placeholder="github.com/name/project" {...register(`projects.${index}.repository`)} /></div><Field className="mt-3" label="Tech stack" placeholder="Next.js · NestJS · PostgreSQL" {...register(`projects.${index}.techStack`)} /><label className="mt-3 block text-sm font-medium">Highlights <span className="font-normal text-zinc-500">(one bullet per line)</span></label><textarea className="field mt-1 min-h-28" {...register(`projects.${index}.highlights`)} /><Remove onClick={() => projects.remove(index)} /></Card>)}</Section>
        <Section title="Education" action="Add education" onAction={() => education.append({ institution: "", period: "", degree: "", details: "" })}>{education.fields.map((field, index) => <Card key={field.id}><div className="grid gap-3 sm:grid-cols-2"><Field label="University / school" error={errors.education?.[index]?.institution?.message} {...register(`education.${index}.institution`)} /><Field label="Period" placeholder="09/2022 — Present" error={errors.education?.[index]?.period?.message} {...register(`education.${index}.period`)} /><Field label="Degree" error={errors.education?.[index]?.degree?.message} {...register(`education.${index}.degree`)} /><Field label="Additional details" placeholder="Expected graduation: 2026" {...register(`education.${index}.details`)} /></div><Remove onClick={() => education.remove(index)} /></Card>)}</Section>
      </form>
      <section className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2"><p className="no-print mb-3 text-sm font-medium text-zinc-500">Live preview · Student / technical CV template</p><ResumePreview resume={resume} contentRef={contentRef} /></section>
    </main>
  </div>;
}

function Section({ title, children, action, onAction }: { title: string; children: React.ReactNode; action?: string; onAction?: () => void }) { return <fieldset className="border-t border-zinc-200 pt-5"><div className="mb-3 flex items-center justify-between gap-3"><legend className="font-semibold">{title}</legend>{action && <button type="button" onClick={onAction} className="text-sm font-medium text-blue-700 hover:text-blue-600">+ {action}</button>}</div>{children}</fieldset>; }
function Card({ children }: { children: React.ReactNode }) { return <div className="mb-4 rounded-lg border border-zinc-200 p-3">{children}</div>; }
function Field({ label, error, className = "", ...props }: React.ComponentProps<"input"> & { label: string; error?: string }) { return <label className={`block ${className}`}><span className="text-sm font-medium">{label}</span><input className="field mt-1" {...props} /><Error message={error} /></label>; }
function Error({ message }: { message?: string }) { return message ? <span className="mt-1 block text-xs font-medium text-red-600">{message}</span> : null; }
function Remove({ onClick }: { onClick: () => void }) { return <button type="button" className="mt-3 text-sm font-medium text-red-600 hover:text-red-700" onClick={onClick}>Remove</button>; }
