import { getApiErrorMessage } from "@/lib/api/client";
import {
  getProjectCaseStudyUrl,
  parseProjectCaseStudy,
  type ProjectCaseStudyData,
} from "./project-case-study-api";

const CASE_STUDY_REVALIDATE_SECONDS = 300;

/** Fetches the initial case study on the server so its Markdown is SSR-visible. */
export async function getInitialProjectCaseStudy(
  slug: string,
): Promise<ProjectCaseStudyData> {
  const response = await fetch(getProjectCaseStudyUrl(slug), {
    next: { revalidate: CASE_STUDY_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Unable to load this case study."),
    );
  }

  const caseStudy = parseProjectCaseStudy(await response.json());
  if (!caseStudy) {
    throw new Error("The case-study API returned an invalid response.");
  }
  return caseStudy;
}
