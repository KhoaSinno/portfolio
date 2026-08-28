import {
  DEFAULT_SECTION_ORDER,
  resumeSchema,
  type ResumeData,
} from "./resume-schema";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Validates persisted JSON and fills defaults introduced after older resume versions. */
export function parseResumeContent(
  response: { content: unknown } | null | undefined,
): ResumeData | null {
  if (!response || !isRecord(response.content)) return null;

  const content = { ...response.content };
  if (!content.sectionOrder) content.sectionOrder = [...DEFAULT_SECTION_ORDER];
  if (!content.hiddenSections) content.hiddenSections = [];
  if (!content.hiddenBasicsFields) content.hiddenBasicsFields = [];

  const parsed = resumeSchema.safeParse(content);
  return parsed.success ? parsed.data : null;
}
