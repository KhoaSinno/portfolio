export const PROJECT_CASE_STUDY_REPOSITORY = Symbol(
  'PROJECT_CASE_STUDY_REPOSITORY',
);
export const PROJECT_README_CLIENT = Symbol('PROJECT_README_CLIENT');

export interface ProjectCaseStudyResume {
  content: unknown;
}

export interface ProjectCaseStudyRepository {
  findAll(): Promise<ProjectCaseStudyResume[]>;
}

export interface ProjectReadme {
  markdown: string;
  baseUrl: string;
}

export interface ProjectReadmeClient {
  fetchReadme(owner: string, repository: string): Promise<ProjectReadme | null>;
}
