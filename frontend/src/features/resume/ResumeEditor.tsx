"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react-hooks/set-state-in-effect */

import { zodResolver } from "@hookform/resolvers/zod";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Files,
  Globe,
  History,
  Image as ImageIcon,
  LogOut,
  Mail,
  Plus,
  Printer,
  Save,
  Send,
  Sparkles,
  Star,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ResumePreview, type FieldSelectTarget } from "./ResumePreview";
import {
  createResumeProfile,
  deleteResumeProfile,
  getAdminAccessContext,
  getResumeProfile,
  getResumeVersions,
  listResumes,
  publishResumeById,
  rollbackResumeVersion,
  resetDemoResume,
  saveResumeDraftById,
  setResumePrimary,
  type ResumeProfileItem,
  type ResumeVersionItem,
} from "./resume-api";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { CvManagerDrawer } from "./CvManagerDrawer";
import {
  DEFAULT_SECTION_ORDER,
  defaultResume,
  resumeSchema,
  SECTION_LABELS,
  type ResumeData,
  type ResumeSectionKey,
} from "./resume-schema";
import { getProjectRepositories } from "@/lib/image-url";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProjectType(
  value: unknown,
): value is ResumeData["projects"][number]["projectType"] {
  return (
    value === "auto" ||
    value === "web" ||
    value === "mobile" ||
    value === "system"
  );
}

function isProjectRepository(
  value: unknown,
): value is { label: string; url: string } {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.url === "string"
  );
}

export function ResumeEditor() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("Loading resume from the backend...");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showPageGuide, setShowPageGuide] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCvManagerOpen, setIsCvManagerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeProfileItem[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [activeResumeTitle, setActiveResumeTitle] = useState("Main Resume");
  const [activeResumeIsPrimary, setActiveResumeIsPrimary] = useState(true);
  const [isPortfolioOwner, setIsPortfolioOwner] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion collapsed state IDs
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    {},
  );

  const toggleCollapse = (id: string) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const form = useForm<ResumeData>({
    resolver: zodResolver(resumeSchema) as Resolver<ResumeData>,
    defaultValues: defaultResume,
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const skills = useFieldArray({ control, name: "technicalSkills" });
  const experience = useFieldArray({ control, name: "experience" });
  const projects = useFieldArray({ control, name: "projects" });
  const education = useFieldArray({ control, name: "education" });

  const resume = useWatch({
    control,
    defaultValue: defaultResume,
  }) as ResumeData;
  const previewResume = useDeferredValue(resume);
  const [exportingImage, setExportingImage] = useState(false);

  const printResume = useReactToPrint({
    contentRef,
    documentTitle: `${(resume.basics.name || "Resume").replace(/\s+/g, "_")}_CV`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm !important;
      }
      @media print {
        *, *::before, *::after {
          box-sizing: border-box !important;
        }
        html, body {
          width: 210mm !important;
          margin: 0mm !important;
          padding: 0mm !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .resume-paper {
          width: 210mm !important;
          max-width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 auto !important;
          padding: 6mm 8mm !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
        }
        section, article {
          break-inside: avoid-page !important;
          page-break-inside: avoid !important;
        }
        h1, h2, h3 {
          break-after: avoid !important;
          page-break-after: avoid !important;
        }
        .page-break-line {
          display: none !important;
        }
        a {
          text-decoration: none !important;
          color: inherit !important;
        }
      }
    `,
  });

  const exportAsImage = async () => {
    if (!contentRef.current) return;
    try {
      setExportingImage(true);
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(contentRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${(resume.basics.name || "Resume").replace(/\s+/g, "_")}_CV.png`;
      link.href = dataUrl;
      link.click();
      setNotice("Exported resume PNG image successfully.");
    } catch {
      setNotice("Failed to export image. Please try again.");
    } finally {
      setExportingImage(false);
    }
  };

  const sectionOrder: ResumeSectionKey[] =
    resume.sectionOrder && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : DEFAULT_SECTION_ORDER;

  const fetchResumesList = async () => {
    try {
      const list = await listResumes();
      setResumes(list);
      return list;
    } catch (err) {
      console.error("Failed to load resumes list:", err);
      return [];
    }
  };

  const normalizeResumeData = (content: unknown): ResumeData => {
    if (!isRecord(content)) return defaultResume;
    const projects = Array.isArray(content.projects)
      ? content.projects.flatMap((project) => {
          if (!isRecord(project)) return [];
          const repositories = Array.isArray(project.repositories)
            ? project.repositories.filter(isProjectRepository)
            : [];
          const fallbackRepositories = getProjectRepositories({
            repository:
              typeof project.repository === "string"
                ? project.repository
                : null,
          }).map(({ label, url }) => ({ label, url }));

          return [
            {
              ...project,
              repositories:
                repositories.length > 0 ? repositories : fallbackRepositories,
              projectType: isProjectType(project.projectType)
                ? project.projectType
                : "auto",
            },
          ];
        })
      : defaultResume.projects;

    const parsed = resumeSchema.safeParse({
      ...defaultResume,
      ...content,
      projects,
    });
    return parsed.success ? parsed.data : defaultResume;
  };

  const handleSelectResume = async (id: string) => {
    try {
      setNotice("Loading CV profile...");
      const profile = await getResumeProfile(id);
      if (profile) {
        setActiveResumeId(profile.id);
        setActiveResumeTitle(profile.title);
        setActiveResumeIsPrimary(profile.isPrimary);
        setPublicSlug(profile.slug ?? null);
        reset(normalizeResumeData(profile.content));
        setNotice(`Loaded CV profile "${profile.title}".`);
      }
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to load CV profile.",
      );
    }
  };

  useEffect(() => {
    void getAdminAccessContext()
      .then((context) => setIsPortfolioOwner(context.isPortfolioOwner))
      .catch(() => setIsPortfolioOwner(false));
  }, []);

  useEffect(() => {
    void fetchResumesList().then(async (list) => {
      if (list && list.length > 0) {
        const primary = list.find((item) => item.isPrimary) || list[0];
        await handleSelectResume(primary.id);
      }
    });
  }, [reset]);

  const handleCreateOrDuplicate = async (dto: {
    title: string;
    slug?: string;
    sourceResumeId?: string;
  }) => {
    const created = await createResumeProfile(dto);
    await fetchResumesList();
    if (created?.id) {
      await handleSelectResume(created.id);
      setIsCvManagerOpen(false);
      setNotice(`Created and switched to "${created.title}".`);
    }
  };

  const handleSetPrimary = async (id: string) => {
    await setResumePrimary(id);
    const updatedList = await fetchResumesList();
    if (activeResumeId === id) {
      setActiveResumeIsPrimary(true);
    } else {
      const active = updatedList.find((r) => r.id === activeResumeId);
      if (active) setActiveResumeIsPrimary(active.isPrimary);
    }
    setNotice("Updated Primary CV successfully.");
  };

  const handleDeleteResume = async (id: string) => {
    await deleteResumeProfile(id);
    const updatedList = await fetchResumesList();
    if (activeResumeId === id) {
      const primary = updatedList.find((r) => r.isPrimary) || updatedList[0];
      if (primary) {
        await handleSelectResume(primary.id);
      }
    }
    setNotice("CV profile deleted successfully.");
  };

  const saveDraft = async (values: ResumeData) => {
    setSaving(true);
    try {
      if (activeResumeId) {
        await saveResumeDraftById(activeResumeId, values);
      }
      setNotice(`Draft saved to Supabase (${activeResumeTitle}).`);
      reset(values);
      void fetchResumesList();
    } catch {
      setNotice("Could not save. Confirm the backend is running and retry.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async (values: ResumeData) => {
    setPublishing(true);
    try {
      if (activeResumeId) {
        await publishResumeById(activeResumeId, values);
      }
      setNotice(`CV "${activeResumeTitle}" published! Ready to share.`);
      reset(values);
      void fetchResumesList();
    } catch {
      setNotice("Could not publish. Confirm the backend is running and retry.");
    } finally {
      setPublishing(false);
    }
  };

  const handleRollback = async (version: ResumeVersionItem) => {
    try {
      const restored = await rollbackResumeVersion(
        version.id,
        activeResumeId || undefined,
      );
      reset(restored);
      setNotice(`Restored successfully from Snapshot v${version.version}.`);
      void fetchResumesList();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to restore version.";
      setNotice(msg);
    }
  };

  const copyShareableLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = publicSlug
      ? `${origin}/resume/${publicSlug}`
      : activeResumeIsPrimary
        ? `${origin}/resume`
        : `${origin}/resume/${activeResumeId}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/admin/login");
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all demo CV data to the default fixture?"))
      return;
    setResettingDemo(true);
    try {
      const result = await resetDemoResume();
      setNotice(`Reset ${result.deletedCount} demo CV(s): ${result.title}.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to reset demo data.",
      );
    } finally {
      setResettingDemo(false);
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setValue("sectionOrder", newOrder, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const hiddenSections = resume.hiddenSections || [];
  const hiddenBasicsFields = resume.hiddenBasicsFields || [];

  const toggleSectionVisibility = (sectionKey: ResumeSectionKey) => {
    const current = resume.hiddenSections || [];
    const isHidden = current.includes(sectionKey);
    const updated = isHidden
      ? current.filter((k) => k !== sectionKey)
      : [...current, sectionKey];
    setValue("hiddenSections", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleBasicsFieldVisibility = (fieldKey: string) => {
    const current = resume.hiddenBasicsFields || [];
    const isHidden = current.includes(fieldKey);
    const updated = isHidden
      ? current.filter((k) => k !== fieldKey)
      : [...current, fieldKey];
    setValue("hiddenBasicsFields", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const toggleItemVisibility = (
    arrayName: "technicalSkills" | "experience" | "projects" | "education",
    index: number,
  ) => {
    const items = resume[arrayName] as Array<{ isVisible?: boolean }>;
    if (!items || !items[index]) return;
    const currentVal = items[index].isVisible !== false; // defaults to true
    setValue(
      `${arrayName}.${index}.isVisible` as FieldPath<ResumeData>,
      !currentVal,
      {
        shouldDirty: true,
      },
    );
  };

  const toggleTargetVisibility = (
    arrayName: "experience" | "projects",
    index: number,
    target: "showOnWeb" | "showOnCv",
  ) => {
    const items = resume[arrayName] as Array<{
      showOnWeb?: boolean;
      showOnCv?: boolean;
    }>;
    if (!items || !items[index]) return;
    const currentVal = items[index][target] !== false; // defaults to true
    setValue(
      `${arrayName}.${index}.${target}` as FieldPath<ResumeData>,
      !currentVal,
      {
        shouldDirty: true,
      },
    );
  };

  const handleSelectFieldFromPreview = (target: FieldSelectTarget) => {
    // 1. Auto-expand if the target item is currently collapsed
    if (target.section === "technicalSkills" && target.index !== undefined) {
      const fieldId = skills.fields[target.index]?.id;
      if (fieldId) setCollapsedItems((prev) => ({ ...prev, [fieldId]: false }));
    } else if (target.section === "experience" && target.index !== undefined) {
      const fieldId = experience.fields[target.index]?.id;
      if (fieldId) setCollapsedItems((prev) => ({ ...prev, [fieldId]: false }));
    } else if (target.section === "projects" && target.index !== undefined) {
      const fieldId = projects.fields[target.index]?.id;
      if (fieldId) setCollapsedItems((prev) => ({ ...prev, [fieldId]: false }));
    } else if (target.section === "education" && target.index !== undefined) {
      const fieldId = education.fields[target.index]?.id;
      if (fieldId) setCollapsedItems((prev) => ({ ...prev, [fieldId]: false }));
    }

    // 2. Smooth scroll & focus with highlight flash animation after DOM renders
    setTimeout(() => {
      let element: HTMLElement | null = null;

      if (target.field) {
        element = document.querySelector(
          `[name="${target.field}"]`,
        ) as HTMLElement;
      }

      if (!element && target.section) {
        element = document.getElementById(
          `section-${target.section}`,
        ) as HTMLElement;
      }

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();

        // Flash highlight ring and subtle background
        element.classList.add(
          "!border-blue-600",
          "ring-4",
          "ring-blue-500/40",
          "bg-blue-50/70",
          "transition-all",
          "duration-300",
        );
        setTimeout(() => {
          element?.classList.remove(
            "!border-blue-600",
            "ring-4",
            "ring-blue-500/40",
            "bg-blue-50/70",
          );
        }, 1500);
      }
    }, 100);
  };

  /**
   * Highlights and scrolls to the corresponding section/field in the Live Preview
   * when any input in the Editor is focused or typed into.
   */
  const highlightPreviewElement = (fieldName: string) => {
    if (!fieldName) return;

    // 1. Try finding exact preview field
    const exactField = document.querySelector(
      `[data-preview-field="${fieldName}"]`,
    );
    // 2. Or fallback to array item (e.g. projects.0)
    const arrayItemKey = fieldName.split(".").slice(0, 2).join(".");
    const arrayItem = document.querySelector(
      `[data-preview-item="${arrayItemKey}"]`,
    );
    // 3. Or fallback to section container (e.g. projects, basics, summary)
    const sectionKey = fieldName.split(".")[0];
    const section = document.querySelector(
      `[data-preview-section="${sectionKey}"]`,
    );

    const targetEl = exactField || arrayItem || section;

    if (targetEl && targetEl instanceof HTMLElement) {
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
      targetEl.classList.remove("preview-flash-highlight");
      // Force DOM reflow to restart CSS animation
      void targetEl.offsetWidth;
      targetEl.classList.add("preview-flash-highlight");
      setTimeout(() => {
        targetEl.classList.remove("preview-flash-highlight");
      }, 2000);
    }
  };

  const handleEditorFocusCapture = (e: React.FocusEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const name = target.getAttribute("name");
    if (name) {
      highlightPreviewElement(name);
    }
  };

  const handleEditorInputCapture = (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const name = target.getAttribute("name");
    if (name) {
      highlightPreviewElement(name);
    }
  };

  const renderSectionForm = (key: ResumeSectionKey, sectionIdx: number) => {
    switch (key) {
      case "summary":
        return (
          <SectionHeader
            key="summary"
            id="section-summary"
            title="Professional summary"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            isHidden={hiddenSections.includes("summary")}
            onToggleVisibility={() => toggleSectionVisibility("summary")}
          >
            <p className="mb-2 text-xs text-zinc-500">
              Highlight your strongest skills, background, and career objectives
              (aim for 2-3 concise sentences).
            </p>
            <textarea
              className="field min-h-24"
              placeholder="Final-year IT student and aspiring fullstack developer with a strong foundation in modern web development..."
              {...register("summary")}
            />
            <FieldError message={errors.summary?.message} />
          </SectionHeader>
        );

      case "technicalSkills":
        return (
          <SectionHeader
            key="technicalSkills"
            id="section-technicalSkills"
            title="Technical skills"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add category"
            onAction={() =>
              skills.append({ category: "", items: "", isVisible: true })
            }
            isHidden={hiddenSections.includes("technicalSkills")}
            onToggleVisibility={() =>
              toggleSectionVisibility("technicalSkills")
            }
          >
            {skills.fields.map((field, index) => {
              const isCollapsed = collapsedItems[field.id];
              const categoryValue =
                resume.technicalSkills?.[index]?.category || "New Category";
              const itemsValue = resume.technicalSkills?.[index]?.items || "";
              const isItemHidden =
                resume.technicalSkills?.[index]?.isVisible === false;

              return (
                <CollapsibleCard
                  key={field.id}
                  id={field.id}
                  title={categoryValue}
                  subtitle={
                    itemsValue
                      ? itemsValue.slice(0, 45) +
                        (itemsValue.length > 45 ? "…" : "")
                      : "No skills added yet"
                  }
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(field.id)}
                  index={index}
                  total={skills.fields.length}
                  onMoveUp={() => skills.move(index, index - 1)}
                  onMoveDown={() => skills.move(index, index + 1)}
                  onRemove={() => skills.remove(index)}
                  isHidden={isItemHidden}
                  onToggleVisibility={() =>
                    toggleItemVisibility("technicalSkills", index)
                  }
                >
                  <Field
                    label="Category name"
                    placeholder="e.g. Frontend, Backend, Tools & DevOps..."
                    error={errors.technicalSkills?.[index]?.category?.message}
                    {...register(`technicalSkills.${index}.category`)}
                  />
                  <label className="mt-3 block text-xs font-medium text-zinc-700">
                    Skills{" "}
                    <span className="font-normal text-zinc-500">
                      (comma-separated)
                    </span>
                  </label>
                  <textarea
                    className="field mt-1 min-h-18"
                    placeholder="TypeScript, Next.js, React, Tailwind CSS, REST API..."
                    {...register(`technicalSkills.${index}.items`)}
                  />
                  <FieldError
                    message={errors.technicalSkills?.[index]?.items?.message}
                  />
                </CollapsibleCard>
              );
            })}
          </SectionHeader>
        );

      case "experience":
        return (
          <SectionHeader
            key="experience"
            id="section-experience"
            title="Professional experience"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add experience"
            onAction={() =>
              experience.append({
                company: "",
                role: "",
                period: "",
                highlights: "",
                isVisible: true,
                showOnWeb: true,
                showOnCv: true,
              })
            }
            isHidden={hiddenSections.includes("experience")}
            onToggleVisibility={() => toggleSectionVisibility("experience")}
          >
            <p className="mb-3 text-xs text-zinc-500">
              Leave this empty if you do not have work experience yet. It will
              automatically hide on your CV.
            </p>
            {experience.fields.map((field, index) => {
              const isCollapsed = collapsedItems[field.id];
              const roleValue = resume.experience?.[index]?.role || "New Role";
              const companyValue = resume.experience?.[index]?.company || "";
              const isItemHidden =
                resume.experience?.[index]?.isVisible === false;

              return (
                <CollapsibleCard
                  key={field.id}
                  id={field.id}
                  title={`${roleValue}${companyValue ? ` — ${companyValue}` : ""}`}
                  subtitle={
                    resume.experience?.[index]?.period || "Period not set"
                  }
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(field.id)}
                  index={index}
                  total={experience.fields.length}
                  onMoveUp={() => experience.move(index, index - 1)}
                  onMoveDown={() => experience.move(index, index + 1)}
                  onRemove={() => experience.remove(index)}
                  isHidden={isItemHidden}
                  onToggleVisibility={() =>
                    toggleItemVisibility("experience", index)
                  }
                  showOnWeb={resume.experience?.[index]?.showOnWeb !== false}
                  onToggleShowOnWeb={() =>
                    toggleTargetVisibility("experience", index, "showOnWeb")
                  }
                  showOnCv={resume.experience?.[index]?.showOnCv !== false}
                  onToggleShowOnCv={() =>
                    toggleTargetVisibility("experience", index, "showOnCv")
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Role / Title"
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
                  <label className="mt-3 block text-xs font-medium text-zinc-700">
                    Key Highlights{" "}
                    <span className="font-normal text-zinc-500">
                      (one bullet per line)
                    </span>
                  </label>
                  <textarea
                    className="field mt-1 min-h-24"
                    placeholder="Developed responsive web features with Next.js...&#10;Integrated REST API endpoints using NestJS and Prisma..."
                    {...register(`experience.${index}.highlights`)}
                  />
                </CollapsibleCard>
              );
            })}
          </SectionHeader>
        );

      case "projects":
        return (
          <SectionHeader
            key="projects"
            id="section-projects"
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
                repositories: [{ label: "Source Code", url: "" }],
                projectType: "auto",
                demoUrl: "",
                projectSlug: "",
                thumbnailUrl: "",
                thumbnailAlt: "",
                highlights: "",
                isVisible: true,
                showOnWeb: true,
                showOnCv: true,
                hideRepository: false,
                hideDemoUrl: false,
              })
            }
            isHidden={hiddenSections.includes("projects")}
            onToggleVisibility={() => toggleSectionVisibility("projects")}
          >
            {projects.fields.map((field, index) => {
              const isCollapsed = collapsedItems[field.id];
              const nameValue =
                resume.projects?.[index]?.name || `Project #${index + 1}`;
              const stackValue = resume.projects?.[index]?.techStack || "";
              const isItemHidden =
                resume.projects?.[index]?.isVisible === false;

              return (
                <CollapsibleCard
                  key={field.id}
                  id={field.id}
                  title={nameValue}
                  subtitle={stackValue || "No tech stack specified"}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(field.id)}
                  index={index}
                  total={projects.fields.length}
                  onMoveUp={() => projects.move(index, index - 1)}
                  onMoveDown={() => projects.move(index, index + 1)}
                  onRemove={() => projects.remove(index)}
                  isHidden={isItemHidden}
                  onToggleVisibility={() =>
                    toggleItemVisibility("projects", index)
                  }
                  showOnWeb={resume.projects?.[index]?.showOnWeb !== false}
                  onToggleShowOnWeb={() =>
                    toggleTargetVisibility("projects", index, "showOnWeb")
                  }
                  showOnCv={resume.projects?.[index]?.showOnCv !== false}
                  onToggleShowOnCv={() =>
                    toggleTargetVisibility("projects", index, "showOnCv")
                  }
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
                      placeholder="Solo Developer / Team Lead"
                      {...register(`projects.${index}.role`)}
                    />
                    <Field
                      label="Period"
                      placeholder="01/2026 — 04/2026"
                      {...register(`projects.${index}.period`)}
                    />
                    <Field
                      label="Tech stack"
                      placeholder="Next.js · TypeScript · NestJS · PostgreSQL"
                      {...register(`projects.${index}.techStack`)}
                    />
                    <ProjectRepositoriesEditor
                      projectIndex={index}
                      register={register}
                      control={control}
                      isHidden={Boolean(
                        resume.projects?.[index]?.hideRepository,
                      )}
                      onToggleVisibility={() => {
                        const current = Boolean(
                          resume.projects?.[index]?.hideRepository,
                        );
                        setValue(
                          `projects.${index}.hideRepository` as FieldPath<ResumeData>,
                          !current,
                          {
                            shouldDirty: true,
                          },
                        );
                      }}
                    />

                    <div className="sm:col-span-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3">
                      <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                        Kiểu hiển thị khung Preview (Mockup Frame)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            value: "auto",
                            label: "Tự động ⚡",
                            desc: "Theo tech stack",
                          },
                          {
                            value: "mobile",
                            label: "Mobile App 📱",
                            desc: "Khung điện thoại",
                          },
                          {
                            value: "web",
                            label: "Web Browser 💻",
                            desc: "Cửa sổ trình duyệt",
                          },
                          {
                            value: "system",
                            label: "System / API ⚙️",
                            desc: "Hệ thống backend",
                          },
                        ].map((item) => {
                          const current =
                            resume.projects?.[index]?.projectType || "auto";
                          const isSelected = current === item.value;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setValue(
                                  `projects.${index}.projectType` as FieldPath<ResumeData>,
                                  item.value as ResumeData["projects"][number]["projectType"],
                                  {
                                    shouldDirty: true,
                                  },
                                );
                              }}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                              }`}
                            >
                              <span className="text-xs font-semibold">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-zinc-400 mt-0.5">
                                {item.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Field
                      label="Live Demo / Video URL"
                      placeholder="myproject.vercel.app or youtu.be/..."
                      isHidden={Boolean(resume.projects?.[index]?.hideDemoUrl)}
                      onToggleVisibility={() => {
                        const current = Boolean(
                          resume.projects?.[index]?.hideDemoUrl,
                        );
                        setValue(
                          `projects.${index}.hideDemoUrl` as FieldPath<ResumeData>,
                          !current,
                          {
                            shouldDirty: true,
                          },
                        );
                      }}
                      {...register(`projects.${index}.demoUrl`)}
                    />
                    <Field
                      label="Case study slug"
                      placeholder="portfolio-platform"
                      error={errors.projects?.[index]?.projectSlug?.message}
                      {...register(`projects.${index}.projectSlug`)}
                    />
                    <Field
                      label="Thumbnail image URL (Optional)"
                      placeholder="https://.../project-cover.webp"
                      error={errors.projects?.[index]?.thumbnailUrl?.message}
                      {...register(`projects.${index}.thumbnailUrl`)}
                    />
                  </div>
                  <Field
                    className="mt-3"
                    label="Thumbnail alt text"
                    placeholder="Briefly describe the project cover image"
                    {...register(`projects.${index}.thumbnailAlt`)}
                  />
                  <p className="mt-2 text-[11px] text-zinc-500">
                    💡 <strong>Smart Preview:</strong> If Thumbnail URL is left
                    blank, Web projects will generate a live screenshot, while
                    YouTube video links will automatically fetch their HD video
                    cover. Mobile apps will render the high-tech mobile UI
                    frame.
                  </p>
                  <label className="mt-3 block text-xs font-medium text-zinc-700">
                    Key Highlights{" "}
                    <span className="font-normal text-zinc-500">
                      (one bullet per line)
                    </span>
                  </label>
                  <textarea
                    className="field mt-1 min-h-24"
                    placeholder="Designed and built a structured resume editor with live preview...&#10;Optimized PDF export using native print stylesheets..."
                    {...register(`projects.${index}.highlights`)}
                  />
                </CollapsibleCard>
              );
            })}
          </SectionHeader>
        );

      case "education":
        return (
          <SectionHeader
            key="education"
            id="section-education"
            title="Education"
            sectionIndex={sectionIdx}
            totalSections={sectionOrder.length}
            onMoveUp={() => moveSection(sectionIdx, "up")}
            onMoveDown={() => moveSection(sectionIdx, "down")}
            action="Add education"
            onAction={() =>
              education.append({
                institution: "",
                period: "",
                degree: "",
                details: "",
                isVisible: true,
              })
            }
            isHidden={hiddenSections.includes("education")}
            onToggleVisibility={() => toggleSectionVisibility("education")}
          >
            {education.fields.map((field, index) => {
              const isCollapsed = collapsedItems[field.id];
              const instValue =
                resume.education?.[index]?.institution || "University Name";
              const degreeValue = resume.education?.[index]?.degree || "";
              const isItemHidden =
                resume.education?.[index]?.isVisible === false;

              return (
                <CollapsibleCard
                  key={field.id}
                  id={field.id}
                  title={instValue}
                  subtitle={degreeValue || "Degree not set"}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(field.id)}
                  index={index}
                  total={education.fields.length}
                  onMoveUp={() => education.move(index, index - 1)}
                  onMoveDown={() => education.move(index, index + 1)}
                  onRemove={() => education.remove(index)}
                  isHidden={isItemHidden}
                  onToggleVisibility={() =>
                    toggleItemVisibility("education", index)
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="University / School"
                      placeholder="University of Technology"
                      error={errors.education?.[index]?.institution?.message}
                      {...register(`education.${index}.institution`)}
                    />
                    <Field
                      label="Period"
                      placeholder="09/2022 — 06/2026"
                      error={errors.education?.[index]?.period?.message}
                      {...register(`education.${index}.period`)}
                    />
                  </div>
                  <Field
                    className="mt-3"
                    label="Degree / Major"
                    placeholder="B.Sc. in Information Technology"
                    error={errors.education?.[index]?.degree?.message}
                    {...register(`education.${index}.degree`)}
                  />
                  <label className="mt-3 block text-xs font-medium text-zinc-700">
                    Additional details{" "}
                    <span className="font-normal text-zinc-500">
                      (GPA, Capstone, Scholarships — one bullet per line)
                    </span>
                  </label>
                  <textarea
                    className="field mt-1 min-h-20"
                    placeholder="Major in Software Engineering · GPA: 3.6/4.0&#10;Capstone Project: Triam Audiobook with AI Voice Agent&#10;Academic Excellence Scholarship 2024"
                    {...register(`education.${index}.details`)}
                  />
                </CollapsibleCard>
              );
            })}
          </SectionHeader>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100/90 text-zinc-900">
      {/* Header bar */}
      <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex items-center gap-3">
            <a
              href="/"
              title="Back to Portfolio"
              className="group flex items-center"
            >
              <div className="flex items-center rounded-xl bg-[#090d16] px-3 py-1.5 border border-slate-800 shadow-sm transition group-hover:border-indigo-500/50 group-hover:shadow-md group-hover:shadow-indigo-500/10">
                <img
                  src="/logo.png"
                  alt="Sinoo Hub"
                  className="h-6 w-auto object-contain"
                />
              </div>
            </a>

            {/* CV Profile Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-100 hover:border-zinc-300 transition"
                title="Switch active CV or manage profiles"
              >
                <Files className="h-3.5 w-3.5 text-indigo-600" />
                <span className="max-w-[110px] sm:max-w-[180px] truncate">
                  {activeResumeTitle}
                </span>
                {activeResumeIsPrimary && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold">
                    <Star className="h-2 w-2 fill-emerald-600 text-emerald-600" />
                    Primary
                  </span>
                )}
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Switch CV Profile ({resumes.length})
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {resumes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          void handleSelectResume(item.id);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                          item.id === activeResumeId
                            ? "bg-indigo-50 font-bold text-indigo-900 ring-1 ring-indigo-200"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{item.title}</span>
                            {item.isPrimary && (
                              <Star className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400 truncate block">
                            {item.isPrimary
                              ? "/resume"
                              : `/resume/${item.slug || item.id}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0 flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5 text-zinc-400" />
                          {item.viewsCount}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-1.5 border-t border-zinc-100 pt-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsCvManagerOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Manage All CVs / New Profile...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden xl:flex items-center gap-2 border-l border-zinc-200 pl-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Resume CMS
                  </span>
                  {isDirty ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      <CircleAlert className="h-2.5 w-2.5" />
                      Unsaved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Saved
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 truncate max-w-xs">
                  {notice}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href="/admin/inbox"
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-2xs hover:bg-indigo-100 transition"
              title="Open private portfolio contact inbox"
            >
              <Mail className="h-3.5 w-3.5 text-indigo-600" />
              <span>Inbox</span>
            </a>
            {/* 1-Click Copy Public URL Button */}
            <button
              type="button"
              onClick={copyShareableLink}
              className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs font-mono text-zinc-600 hover:bg-zinc-100 transition"
              title="Copy shareable public link for this CV profile"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold font-sans text-[11px]">
                    Copied URL!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[11px] text-zinc-500">
                    {activeResumeIsPrimary
                      ? "/resume"
                      : `/resume/${publicSlug || "custom"}`}
                  </span>
                </>
              )}
            </button>

            {/* Manage CVs Button */}
            <button
              type="button"
              onClick={() => setIsCvManagerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-2xs hover:bg-indigo-100 active:scale-95 transition"
              title="Open CV Manager Drawer"
            >
              <Files className="h-3.5 w-3.5 text-indigo-600" />
              <span>CVs ({resumes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-95 transition"
              title="View snapshot history and rollback previous versions"
            >
              <History className="h-3.5 w-3.5 text-indigo-600" />
              <span>History</span>
            </button>
            <button
              type="button"
              onClick={() => printResume()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
              title="Print or Save Clean PDF (Without browser headers/footers)"
            >
              <Printer className="h-3.5 w-3.5 text-zinc-500" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              disabled={exportingImage}
              onClick={() => void exportAsImage()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-95 transition disabled:opacity-50"
              title="Export high-resolution PNG image of the resume"
            >
              <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span>{exportingImage ? "Exporting..." : "Export PNG"}</span>
            </button>
            <a
              href={
                publicSlug
                  ? `/resume/${publicSlug}`
                  : activeResumeIsPrimary
                    ? "/resume"
                    : `/resume/${activeResumeId}`
              }
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/35 hover:brightness-110 active:scale-95"
              title="Open public Live CV profile in new tab"
            >
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-300 transition-transform group-hover:rotate-12" />
              <span className="tracking-wide">Sinoo&apos;s CV</span>
              <ExternalLink className="h-3 w-3 text-indigo-200 transition-transform group-hover:translate-x-0.5" />
            </a>
            {isPortfolioOwner && (
              <button
                type="button"
                disabled={resettingDemo}
                onClick={() => void handleResetDemo()}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-2xs hover:bg-amber-100 disabled:opacity-60"
                title="Reset demo@gmail.com to the default CV fixture"
              >
                <span>{resettingDemo ? "Resetting…" : "Reset Demo"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400" />
              <span>Sign out</span>
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handleSubmit(publish)}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{publishing ? "Publishing…" : "Publish"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Left Form, Right Preview */}
      <main className="mx-auto grid max-w-[1900px] gap-4 px-2 py-3 lg:grid-cols-[1fr_minmax(auto,215mm)] sm:px-4 sm:py-3.5">
        {/* Left Column: Form */}
        <form
          onSubmit={handleSubmit(saveDraft)}
          onFocusCapture={handleEditorFocusCapture}
          onInputCapture={handleEditorInputCapture}
          className="no-print space-y-3.5 self-start rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs"
        >
          {/* Top action row */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                Resume Content
              </h2>
              <p className="text-[11px] text-zinc-500">
                Edit information and arrange sections
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-blue-600 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving…" : "Save draft"}</span>
            </button>
          </div>

          {/* Section Order Organizer */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-blue-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  CV Section Order
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Use ↑ ↓ to reorder on CV
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sectionOrder.map((key, index) => {
                const isSectionHidden = hiddenSections.includes(key);
                return (
                  <div
                    key={key}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium shadow-2xs transition ${
                      isSectionHidden
                        ? "border-dashed border-amber-300 bg-amber-50/70 text-zinc-500 opacity-75"
                        : "border-zinc-200 bg-white text-zinc-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(key)}
                      className={`rounded p-0.5 transition ${
                        isSectionHidden
                          ? "text-amber-600 hover:bg-amber-100"
                          : "text-blue-600 hover:bg-blue-50"
                      }`}
                      title={
                        isSectionHidden
                          ? `Section ${SECTION_LABELS[key]} is Hidden. Click to Show on CV.`
                          : `Section ${SECTION_LABELS[key]} is Visible. Click to Hide on CV.`
                      }
                    >
                      {isSectionHidden ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                    <span className="text-[11px] text-zinc-400">
                      {index + 1}.
                    </span>
                    <span
                      className={`text-xs ${isSectionHidden ? "line-through text-zinc-500" : ""}`}
                    >
                      {SECTION_LABELS[key]}
                    </span>
                    <div className="ml-1 flex items-center">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSection(index, "up")}
                        className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move section up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sectionOrder.length - 1}
                        onClick={() => moveSection(index, "down")}
                        className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move section down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Basics (Fixed at top) */}
          <fieldset
            id="section-basics"
            className="border-t border-zinc-200 pt-4 scroll-mt-20"
          >
            <legend className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Basic information
            </legend>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                placeholder="John Doe"
                error={errors.basics?.name?.message}
                isHidden={hiddenBasicsFields.includes("name")}
                onToggleVisibility={() => toggleBasicsFieldVisibility("name")}
                {...register("basics.name")}
              />
              <Field
                label="Professional headline"
                placeholder="Final-year IT Student | Aspiring Fullstack Developer"
                error={errors.basics?.headline?.message}
                isHidden={hiddenBasicsFields.includes("headline")}
                onToggleVisibility={() =>
                  toggleBasicsFieldVisibility("headline")
                }
                {...register("basics.headline")}
              />
              <Field
                label="Email address"
                type="email"
                placeholder="john@example.com"
                error={errors.basics?.email?.message}
                isHidden={hiddenBasicsFields.includes("email")}
                onToggleVisibility={() => toggleBasicsFieldVisibility("email")}
                {...register("basics.email")}
              />
              <Field
                label="Location"
                placeholder="Ho Chi Minh City, Vietnam"
                error={errors.basics?.location?.message}
                isHidden={hiddenBasicsFields.includes("location")}
                onToggleVisibility={() =>
                  toggleBasicsFieldVisibility("location")
                }
                {...register("basics.location")}
              />
              <Field
                label="Personal website"
                placeholder="portfolio.com"
                isHidden={hiddenBasicsFields.includes("website")}
                onToggleVisibility={() =>
                  toggleBasicsFieldVisibility("website")
                }
                {...register("basics.website")}
              />
              <Field
                label="LinkedIn profile"
                placeholder="linkedin.com/in/username"
                isHidden={hiddenBasicsFields.includes("linkedin")}
                onToggleVisibility={() =>
                  toggleBasicsFieldVisibility("linkedin")
                }
                {...register("basics.linkedin")}
              />
              <Field
                label="GitHub profile"
                placeholder="github.com/username"
                isHidden={hiddenBasicsFields.includes("github")}
                onToggleVisibility={() => toggleBasicsFieldVisibility("github")}
                {...register("basics.github")}
              />
            </div>
          </fieldset>

          {/* Dynamic Reorderable Sections */}
          {sectionOrder.map((sectionKey, sectionIdx) =>
            renderSectionForm(sectionKey, sectionIdx),
          )}
        </form>

        {/* Right Column: Live Preview */}
        <section className="min-w-0 lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto">
          {/* Preview Toolbar */}
          <div className="no-print mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                A4 Live Preview
              </span>
              <button
                type="button"
                onClick={() => setShowPageGuide(!showPageGuide)}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition ${
                  showPageGuide
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
                title="Toggle A4 Page 1 boundary line & full height"
              >
                <Eye className="h-3 w-3" />
                <span>Page 1 Guide: {showPageGuide ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                disabled={zoomLevel <= 70}
                onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[36px] text-center font-mono text-[11px] font-semibold text-zinc-700">
                {zoomLevel}%
              </span>
              <button
                type="button"
                disabled={zoomLevel >= 120}
                onClick={() => setZoomLevel((prev) => Math.min(120, prev + 10))}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="ml-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                100%
              </button>
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div
            className="flex justify-center transition-transform duration-150 origin-top"
            style={{
              transform:
                zoomLevel === 100 ? undefined : `scale(${zoomLevel / 100})`,
            }}
          >
            <ResumePreview
              resume={previewResume}
              contentRef={contentRef}
              showPageGuide={showPageGuide}
              onSelectField={handleSelectFieldFromPreview}
            />
          </div>
        </section>
      </main>

      <VersionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRollback={handleRollback}
        resumeId={activeResumeId || undefined}
        resumeTitle={activeResumeTitle}
      />

      <CvManagerDrawer
        isOpen={isCvManagerOpen}
        onClose={() => setIsCvManagerOpen(false)}
        resumes={resumes}
        activeResumeId={activeResumeId}
        onSelectResume={handleSelectResume}
        onCreateOrDuplicate={handleCreateOrDuplicate}
        onSetPrimary={handleSetPrimary}
        onDeleteResume={handleDeleteResume}
      />
    </div>
  );
}

function SectionHeader({
  id,
  title,
  children,
  action,
  onAction,
  sectionIndex,
  totalSections,
  onMoveUp,
  onMoveDown,
  isHidden = false,
  onToggleVisibility,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  sectionIndex: number;
  totalSections: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
}) {
  return (
    <fieldset
      id={id}
      className={`border-t border-zinc-200 pt-4 scroll-mt-20 transition-opacity ${
        isHidden ? "opacity-65" : "opacity-100"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-2">
            <span className={isHidden ? "line-through text-zinc-500" : ""}>
              {title}
            </span>
            {isHidden && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 normal-case tracking-normal">
                Hidden on CV & Web
              </span>
            )}
          </legend>
          <div className="flex items-center gap-0.5 rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5">
            {onToggleVisibility && (
              <button
                type="button"
                onClick={onToggleVisibility}
                className={`rounded p-0.5 transition ${
                  isHidden
                    ? "text-amber-600 hover:bg-amber-100"
                    : "text-blue-600 hover:bg-blue-100"
                }`}
                title={
                  isHidden
                    ? "Section is currently Hidden. Click to Show on CV & Web"
                    : "Section is currently Visible. Click to Hide on CV & Web"
                }
              >
                {isHidden ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </button>
            )}
            <div className="mx-0.5 h-3 w-[1px] bg-zinc-200" />
            <button
              type="button"
              disabled={sectionIndex === 0}
              onClick={onMoveUp}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-20 disabled:hover:bg-transparent"
              title="Move section up on CV"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={sectionIndex === totalSections - 1}
              onClick={onMoveDown}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-20 disabled:hover:bg-transparent"
              title="Move section down on CV"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Plus className="h-3 w-3" />
            <span>{action}</span>
          </button>
        )}
      </div>
      {children}
    </fieldset>
  );
}

function CollapsibleCard({
  id,
  title,
  subtitle,
  isCollapsed,
  onToggleCollapse,
  children,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  isHidden = false,
  onToggleVisibility,
  showOnWeb,
  onToggleShowOnWeb,
  showOnCv,
  onToggleShowOnCv,
}: {
  id: string;
  title: string;
  subtitle?: string;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
  showOnWeb?: boolean;
  onToggleShowOnWeb?: () => void;
  showOnCv?: boolean;
  onToggleShowOnCv?: () => void;
}) {
  const isCompletelyHidden =
    isHidden || (showOnWeb === false && showOnCv === false);

  return (
    <div
      className={`mb-3 rounded-lg border shadow-2xs transition ${
        isCompletelyHidden
          ? "border-dashed border-amber-200 bg-amber-50/30 opacity-80"
          : "border-zinc-200 bg-zinc-50/50"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold ${
                isCompletelyHidden
                  ? "text-zinc-500 line-through"
                  : "text-zinc-800"
              }`}
            >
              {title}
            </span>
            {isCompletelyHidden && (
              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                Hidden
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-zinc-500 truncate max-w-[200px] inline-block align-bottom">
                {subtitle}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Target destination pills for Web & CV */}
          {onToggleShowOnWeb && (
            <button
              type="button"
              onClick={onToggleShowOnWeb}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition ${
                showOnWeb !== false
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-zinc-100 text-zinc-400 border-zinc-200 line-through hover:bg-zinc-200"
              }`}
              title={
                showOnWeb !== false
                  ? "Visible on Web Portfolio. Click to Hide on Web."
                  : "Hidden from Web Portfolio. Click to Show on Web."
              }
            >
              <Globe className="h-2.5 w-2.5" />
              <span>Web</span>
            </button>
          )}

          {onToggleShowOnCv && (
            <button
              type="button"
              onClick={onToggleShowOnCv}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition ${
                showOnCv !== false
                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  : "bg-zinc-100 text-zinc-400 border-zinc-200 line-through hover:bg-zinc-200"
              }`}
              title={
                showOnCv !== false
                  ? "Visible on Printable CV. Click to Hide on CV."
                  : "Hidden from Printable CV. Click to Show on CV."
              }
            >
              <FileText className="h-2.5 w-2.5" />
              <span>CV</span>
            </button>
          )}

          {onToggleVisibility && !onToggleShowOnWeb && !onToggleShowOnCv && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className={`rounded p-1 transition ${
                isHidden
                  ? "text-amber-600 hover:bg-amber-100"
                  : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              }`}
              title={
                isHidden
                  ? "Item is currently Hidden. Click to Show"
                  : "Item is currently Visible. Click to Hide"
              }
            >
              {isHidden ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed"
            title="Move item up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed"
            title="Move item down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-3.5 w-[1px] bg-zinc-200" />
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Delete item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="border-t border-zinc-200/80 p-3.5">{children}</div>
      )}
    </div>
  );
}

function ProjectRepositoriesEditor({
  projectIndex,
  register,
  control,
  isHidden,
  onToggleVisibility,
}: {
  projectIndex: number;
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
  isHidden: boolean;
  onToggleVisibility: () => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `projects.${projectIndex}.repositories`,
  });

  const PRESETS = [
    { label: "Mobile App", icon: "📱" },
    { label: "Crawler Service", icon: "⚙️" },
    { label: "Frontend", icon: "💻" },
    { label: "Backend API", icon: "🔌" },
    { label: "Source Code", icon: "📦" },
  ];

  return (
    <div
      className={`sm:col-span-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 ${isHidden ? "opacity-65" : "opacity-100"} transition-opacity`}
    >
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
          <span className={isHidden ? "line-through text-zinc-400" : ""}>
            GitHub Repositories (Multi-Repo Support)
          </span>
          {isHidden && (
            <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
              Hidden
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`rounded p-0.5 transition ${
            isHidden
              ? "text-amber-600 hover:bg-amber-100"
              : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
          }`}
          title={
            isHidden
              ? "Repositories are Hidden. Click to Show."
              : "Repositories are Visible. Click to Hide."
          }
        >
          {isHidden ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* List of Repositories */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white/50 p-3 text-center">
            <p className="text-xs text-zinc-500">
              Chưa có repository nào. Bấm nút bên dưới để thêm repo cho dự án
              này.
            </p>
          </div>
        ) : (
          fields.map((field, rIdx) => (
            <div
              key={field.id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-xs"
            >
              <div className="w-full sm:w-1/3">
                <input
                  className="field text-xs py-1.5 px-2 font-medium"
                  placeholder="Label (vd: Mobile App)"
                  {...register(
                    `projects.${projectIndex}.repositories.${rIdx}.label`,
                  )}
                />
              </div>
              <div className="w-full sm:flex-1">
                <input
                  className="field text-xs py-1.5 px-2 font-mono"
                  placeholder="github.com/username/repo"
                  {...register(
                    `projects.${projectIndex}.repositories.${rIdx}.url`,
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(rIdx)}
                className="self-end sm:self-center p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                title="Xóa repository này"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Presets & Add Button */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">
            Thêm nhanh nhãn:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                append({ label: preset.label, url: "" });
              }}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition active:scale-95"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            append({
              label:
                fields.length === 0
                  ? "Source Code"
                  : `Repo ${fields.length + 1}`,
              url: "",
            })
          }
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-95 transition"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-600" />
          <span>+ Add Repo</span>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  isHidden = false,
  onToggleVisibility,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
}) {
  return (
    <div
      className={`block ${className} ${isHidden ? "opacity-65" : "opacity-100"} transition-opacity`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
          <span className={isHidden ? "line-through text-zinc-400" : ""}>
            {label}
          </span>
          {isHidden && (
            <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
              Hidden
            </span>
          )}
        </label>
        {onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`rounded p-0.5 transition ${
              isHidden
                ? "text-amber-600 hover:bg-amber-100"
                : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
            }`}
            title={
              isHidden
                ? `Field "${label}" is Hidden. Click to Show on CV & Web.`
                : `Field "${label}" is Visible. Click to Hide on CV & Web.`
            }
          >
            {isHidden ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
      <input
        className={`field mt-1 transition ${
          isHidden
            ? "border-dashed border-amber-300 bg-amber-50/25 text-zinc-500"
            : ""
        }`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

function TextAreaField({
  label,
  error,
  className = "",
  isHidden = false,
  onToggleVisibility,
  ...props
}: React.ComponentProps<"textarea"> & {
  label: string;
  error?: string;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
}) {
  return (
    <div
      className={`block ${className} ${isHidden ? "opacity-65" : "opacity-100"} transition-opacity`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
          <span className={isHidden ? "line-through text-zinc-400" : ""}>
            {label}
          </span>
          {isHidden && (
            <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700">
              Hidden
            </span>
          )}
        </label>
        {onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`rounded p-0.5 transition ${
              isHidden
                ? "text-amber-600 hover:bg-amber-100"
                : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
            }`}
            title={
              isHidden
                ? `Field "${label}" is Hidden. Click to Show on CV & Web.`
                : `Field "${label}" is Visible. Click to Hide on CV & Web.`
            }
          >
            {isHidden ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
      <textarea
        className={`field mt-1 font-mono text-xs transition ${
          isHidden
            ? "border-dashed border-amber-300 bg-amber-50/25 text-zinc-500"
            : ""
        }`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span className="mt-1 block text-[11px] font-medium text-red-600">
      {message}
    </span>
  ) : null;
}
