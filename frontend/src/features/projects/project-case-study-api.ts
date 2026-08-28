import { API_BASE_URL, getApiErrorMessage } from "@/lib/api/client";

export interface ProjectRepository {
  label: string;
  url: string;
  index: number;
  isActive: boolean;
}

export interface ProjectCaseStudyData {
  title: string;
  repositoryUrl: string;
  repositories: ProjectRepository[];
  selectedRepoIndex: number;
  selectedRepoLabel: string;
  demoUrl: string;
  markdown: string;
  baseUrl: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function parseRepository(value: unknown): ProjectRepository | null {
  if (!isRecord(value)) return null;
  const index = value.index;
  if (typeof index !== "number" || !Number.isInteger(index)) return null;

  const label = getString(value, "label");
  const url = getString(value, "url");
  if (!label || !url) return null;

  return {
    label,
    url,
    index,
    isActive: value.isActive === true,
  };
}

function parseCaseStudy(value: unknown): ProjectCaseStudyData | null {
  if (!isRecord(value)) return null;
  const selectedRepoIndex = value.selectedRepoIndex;
  if (
    typeof selectedRepoIndex !== "number" ||
    !Number.isInteger(selectedRepoIndex)
  ) {
    return null;
  }

  const repositories = Array.isArray(value.repositories)
    ? value.repositories
        .map(parseRepository)
        .filter(
          (repository): repository is ProjectRepository => repository !== null,
        )
    : [];
  const title = getString(value, "title");
  const repositoryUrl = getString(value, "repositoryUrl");
  const selectedRepoLabel = getString(value, "selectedRepoLabel");
  const markdown = getString(value, "markdown");
  const baseUrl = getString(value, "baseUrl");

  if (!title || !repositoryUrl || !selectedRepoLabel || !markdown || !baseUrl) {
    return null;
  }

  return {
    title,
    repositoryUrl,
    repositories,
    selectedRepoIndex,
    selectedRepoLabel,
    demoUrl: getString(value, "demoUrl"),
    markdown,
    baseUrl,
  };
}

export async function getProjectCaseStudy(
  slug: string,
  repositoryIndex?: number,
  signal?: AbortSignal,
): Promise<ProjectCaseStudyData> {
  const repositoryQuery =
    repositoryIndex === undefined ? "" : `?repo=${repositoryIndex}`;
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(slug)}/case-study${repositoryQuery}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Unable to load this case study."),
    );
  }

  const caseStudy = parseCaseStudy(await response.json());
  if (!caseStudy) {
    throw new Error("The case-study API returned an invalid response.");
  }
  return caseStudy;
}
