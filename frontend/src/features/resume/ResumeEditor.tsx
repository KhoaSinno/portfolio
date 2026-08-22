"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogOut,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ResumePreview } from "./ResumePreview";
import { getDraftResume, publishResume, saveResumeDraft } from "./resume-api";
import {
  DEFAULT_SECTION_ORDER,
  defaultResume,
  resumeSchema,
  SECTION_LABELS,
  type ResumeData,
  type ResumeSectionKey,
} from "./resume-schema";

export function ResumeEditor() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("Loading resume from the backend...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const form = useForm<ResumeData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: defaultResume,
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = form;

  const skills = useFieldArray({ control, name: "technicalSkills" });
  const experience = useFieldArray({ control, name: "experience" });
  const projects = useFieldArray({ control, name: "projects" });
  const education = useFieldArray({ control, name: "education" });

  const resume = useWatch({ control, defaultValue: defaultResume }) as ResumeData;
  const printResume = useReactToPrint({ contentRef, documentTitle: "resume" });

  const sectionOrder: ResumeSectionKey[] =
    resume.sectionOrder && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : DEFAULT_SECTION_ORDER;

  useEffect(() => {
    void getDraftResume()
      .then((draft) => {
        if (draft) reset(draft);
        setNotice(
          draft
            ? "Loaded the current backend draft."
            : "Professional Experience is optional — add it only after you have relevant experience."
        );
      })
      .catch(() =>
        setNotice("Backend is unavailable. Start both frontend and backend, then refresh.")
      );
  }, [reset]);

  const saveDraft = async (values: ResumeData) => {
    setSaving(true);
    try {
      await saveResumeDraft(values);
      setNotice("Draft saved to Supabase.");
    } catch {
      setNotice("Could not save. Confirm the backend is running and retry.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async (values: ResumeData) => {
    setPublishing(true);
    try {
      await publishResume(values);
      setNotice("Resume published to Supabase. Open /resume to verify it.");
    } catch {
      setNotice("Could not publish. Confirm the backend is running and retry.");
    } finally {
      setPublishing(false);
    }
  };

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/admin/login");
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setValue("sectionOrder", newOrder, { shouldDirty: true, shouldValidate: true });
  };

  const renderSectionForm = (key: ResumeSectionKey, sectionIdx: number) => {
    switch (key) {
      case "summary":
        return (
          <SectionHeader
            key="summary"
            title="Professional summary"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
          >
            <textarea
              className="field min-h-28"
              placeholder="Brief summary of your background, tech skills, and career goals..."
              {...register("summary")}
            />
            <Error message={errors.summary?.message} />
          </SectionHeader>
        );

      case "technicalSkills":
        return (
          <SectionHeader
            key="technicalSkills"
            title="Technical skills"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add category"
            onAction={() => skills.append({ category: "", items: "" })}
          >
            {skills.fields.map((field, index) => (
              <Card
                key={field.id}
                itemLabel={`Skill Category #${index + 1}`}
                index={index}
                total={skills.fields.length}
                onMoveUp={() => skills.move(index, index - 1)}
                onMoveDown={() => skills.move(index, index + 1)}
                onRemove={() => skills.remove(index)}
              >
                <Field
                  label="Category name"
                  placeholder="e.g. Frontend, Backend, Tools..."
                  error={errors.technicalSkills?.[index]?.category?.message}
                  {...register(`technicalSkills.${index}.category`)}
                />
                <label className="mt-3 block text-sm font-medium">
                  Skills <span className="font-normal text-zinc-500">(comma-separated)</span>
                </label>
                <textarea
                  className="field mt-1 min-h-20"
                  placeholder="TypeScript, Next.js, React, Tailwind CSS..."
                  {...register(`technicalSkills.${index}.items`)}
                />
                <Error message={errors.technicalSkills?.[index]?.items?.message} />
              </Card>
            ))}
          </SectionHeader>
        );

      case "experience":
        return (
          <SectionHeader
            key="experience"
            title="Professional experience"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add experience"
            onAction={() =>
              experience.append({ company: "", role: "", period: "", highlights: "" })
            }
          >
            <p className="mb-3 text-sm text-zinc-500">
              Leave this empty if you have not interned or worked yet. It will automatically hide on the CV.
            </p>
            {experience.fields.map((field, index) => (
              <Card
                key={field.id}
                itemLabel={`Experience #${index + 1}`}
                index={index}
                total={experience.fields.length}
                onMoveUp={() => experience.move(index, index - 1)}
                onMoveDown={() => experience.move(index, index + 1)}
                onRemove={() => experience.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Role"
                    placeholder="Fullstack Intern"
                    error={errors.experience?.[index]?.role?.message}
                    {...register(`experience.${index}.role`)}
                  />
                  <Field
                    label="Company"
                    placeholder="Company Name"
                    error={errors.experience?.[index]?.company?.message}
                    {...register(`experience.${index}.company`)}
                  />
                </div>
                <Field
                  className="mt-3"
                  label="Period"
                  placeholder="03/2026 — 06/2026"
                  error={errors.experience?.[index]?.period?.message}
                  {...register(`experience.${index}.period`)}
                />
                <label className="mt-3 block text-sm font-medium">
                  Highlights <span className="font-normal text-zinc-500">(one bullet per line)</span>
                </label>
                <textarea
                  className="field mt-1 min-h-24"
                  placeholder="Developed responsive UI components...&#10;Integrated REST API endpoints..."
                  {...register(`experience.${index}.highlights`)}
                />
              </Card>
            ))}
          </SectionHeader>
        );

      case "projects":
        return (
          <SectionHeader
            key="projects"
            title="Featured projects"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add project"
            onAction={() =>
              projects.append({
                name: "",
                role: "",
                period: "",
                techStack: "",
                repository: "",
                highlights: "",
              })
            }
          >
            {projects.fields.map((field, index) => (
              <Card
                key={field.id}
                itemLabel={`Project #${index + 1}${field.name ? `: ${field.name}` : ""}`}
                index={index}
                total={projects.fields.length}
                onMoveUp={() => projects.move(index, index - 1)}
                onMoveDown={() => projects.move(index, index + 1)}
                onRemove={() => projects.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Project name"
                    placeholder="Portfolio Platform"
                    error={errors.projects?.[index]?.name?.message}
                    {...register(`projects.${index}.name`)}
                  />
                  <Field
                    label="Role"
                    placeholder="Solo Developer"
                    {...register(`projects.${index}.role`)}
                  />
                  <Field
                    label="Period"
                    placeholder="01/2026 — 04/2026"
                    {...register(`projects.${index}.period`)}
                  />
                  <Field
                    label="Repository URL"
                    placeholder="github.com/name/project"
                    {...register(`projects.${index}.repository`)}
                  />
                </div>
                <Field
                  className="mt-3"
                  label="Tech stack"
                  placeholder="Next.js · NestJS · PostgreSQL"
                  {...register(`projects.${index}.techStack`)}
                />
                <label className="mt-3 block text-sm font-medium">
                  Highlights <span className="font-normal text-zinc-500">(one bullet per line)</span>
                </label>
                <textarea
                  className="field mt-1 min-h-28"
                  placeholder="Designed fullstack portfolio...&#10;Built reusable CV templates..."
                  {...register(`projects.${index}.highlights`)}
                />
              </Card>
            ))}
          </SectionHeader>
        );

      case "education":
        return (
          <SectionHeader
            key="education"
            title="Education"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add education"
            onAction={() =>
              education.append({ institution: "", period: "", degree: "", details: "" })
            }
          >
            {education.fields.map((field, index) => (
              <Card
                key={field.id}
                itemLabel={`Education #${index + 1}`}
                index={index}
                total={education.fields.length}
                onMoveUp={() => education.move(index, index - 1)}
                onMoveDown={() => education.move(index, index + 1)}
                onRemove={() => education.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="University / School"
                    placeholder="University Name"
                    error={errors.education?.[index]?.institution?.message}
                    {...register(`education.${index}.institution`)}
                  />
                  <Field
                    label="Period"
                    placeholder="09/2022 — Present"
                    error={errors.education?.[index]?.period?.message}
                    {...register(`education.${index}.period`)}
                  />
                  <Field
                    label="Degree"
                    placeholder="B.Sc. in Information Technology"
                    error={errors.education?.[index]?.degree?.message}
                    {...register(`education.${index}.degree`)}
                  />
                  <Field
                    label="Additional details"
                    placeholder="Expected graduation: 2026 · GPA: 3.6/4.0"
                    {...register(`education.${index}.details`)}
                  />
                </div>
              </Card>
            ))}
          </SectionHeader>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="no-print border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Portfolio CMS
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Resume Editor</h1>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <a
              href="/resume"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Public resume</span>
            </a>
            <button
              type="button"
              onClick={() => printResume()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Printer className="h-4 w-4" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handleSubmit(publish)}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{publishing ? "Publishing…" : "Publish"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 lg:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.15fr)] lg:px-8">
        <form
          onSubmit={handleSubmit(saveDraft)}
          className="no-print space-y-5 self-start rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          {/* Top action bar */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-semibold">Content & Sections</h2>
              <p className="mt-0.5 text-xs text-zinc-500">{notice}</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving…" : "Save draft"}</span>
            </button>
          </div>

          {/* Section Order Organizer */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-700" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                  CV Section Order
                </span>
              </div>
              <span className="text-xs text-zinc-500">Use ↑ ↓ to reorder</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {sectionOrder.map((key, index) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 shadow-2xs"
                >
                  <span className="text-zinc-400">{index + 1}.</span>
                  <span>{SECTION_LABELS[key]}</span>
                  <div className="ml-1 flex items-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(index, "up")}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move section up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => moveSection(index, "down")}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move section down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basics (Always fixed at the top of the CV) */}
          <fieldset className="border-t border-zinc-200 pt-4">
            <legend className="font-semibold text-zinc-900">Basic information</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                placeholder="John Doe"
                error={errors.basics?.name?.message}
                {...register("basics.name")}
              />
              <Field
                label="Headline"
                placeholder="Aspiring Fullstack Developer"
                error={errors.basics?.headline?.message}
                {...register("basics.headline")}
              />
              <Field
                label="Email"
                type="email"
                placeholder="john@example.com"
                error={errors.basics?.email?.message}
                {...register("basics.email")}
              />
              <Field
                label="Location"
                placeholder="Ho Chi Minh City, Vietnam"
                error={errors.basics?.location?.message}
                {...register("basics.location")}
              />
              <Field
                label="Website"
                placeholder="portfolio.com"
                {...register("basics.website")}
              />
              <Field
                label="LinkedIn"
                placeholder="linkedin.com/in/username"
                {...register("basics.linkedin")}
              />
              <Field
                label="GitHub"
                placeholder="github.com/username"
                {...register("basics.github")}
              />
            </div>
          </fieldset>

          {/* Dynamic Reorderable Sections */}
          {sectionOrder.map((sectionKey, sectionIdx) =>
            renderSectionForm(sectionKey, sectionIdx)
          )}
        </form>

        {/* Live Preview Column */}
        <section className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
          <div className="no-print mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Live Preview · Technical CV Template
            </p>
            <span className="text-xs text-zinc-400">Updates in real-time</span>
          </div>
          <ResumePreview resume={resume} contentRef={contentRef} />
        </section>
      </main>
    </div>
  );
}

function SectionHeader({
  title,
  children,
  action,
  onAction,
  sectionIndex,
  totalSections,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  sectionIndex: number;
  totalSections: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <fieldset className="border-t border-zinc-200 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <legend className="font-semibold text-zinc-900">{title}</legend>
          <div className="flex items-center gap-0.5 rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5">
            <button
              type="button"
              disabled={sectionIndex === 0}
              onClick={onMoveUp}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Move section up in CV"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={sectionIndex === totalSections - 1}
              onClick={onMoveDown}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Move section down in CV"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{action}</span>
          </button>
        )}
      </div>
      {children}
    </fieldset>
  );
}

function Card({
  children,
  itemLabel,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  children: React.ReactNode;
  itemLabel: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50/40 p-3.5 shadow-2xs">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200/80 pb-2">
        <span className="text-xs font-semibold text-zinc-600">{itemLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed"
            title="Move item up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed"
            title="Move item down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-3.5 w-[1px] bg-zinc-200" />
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
            title="Delete this item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  ...props
}: React.ComponentProps<"input"> & { label: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <input className="field mt-1" {...props} />
      <Error message={error} />
    </label>
  );
}

function Error({ message }: { message?: string }) {
  return message ? (
    <span className="mt-1 block text-xs font-medium text-red-600">{message}</span>
  ) : null;
}
