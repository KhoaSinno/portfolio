import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PROJECT_CASE_STUDY_REPOSITORY,
  PROJECT_README_CLIENT,
  type ProjectCaseStudyRepository,
  type ProjectReadmeClient,
} from '../domain/project-case-study.port';

type ProjectRecord = Record<string, unknown>;
type RepositoryLink = { label: string; url: string };

@Injectable()
export class ProjectCaseStudyService {
  constructor(
    @Inject(PROJECT_CASE_STUDY_REPOSITORY)
    private readonly projectRepository: ProjectCaseStudyRepository,
    @Inject(PROJECT_README_CLIENT)
    private readonly readmeClient: ProjectReadmeClient,
  ) {}

  async getProjectCaseStudy(slug: string, repoParam?: string) {
    const matchedProject = await this.findProject(slug);
    const repositories = this.getRepositories(matchedProject);
    const selectedIndex = this.selectRepository(repositories, repoParam);
    const activeRepository = repositories[selectedIndex];
    const { owner, repository } = this.parseGitHubRepository(activeRepository);
    const readme = await this.readmeClient.fetchReadme(owner, repository);

    if (!readme?.markdown) {
      throw new NotFoundException(
        `Could not retrieve README from GitHub repository '${owner}/${repository}' for module '${activeRepository.label}'. Please ensure the repository is public and contains a README.md file.`,
      );
    }

    return {
      title: this.getString(matchedProject, 'name') ?? 'Project case study',
      repositoryUrl: `https://github.com/${owner}/${repository}`,
      repositories: repositories.map((item, index) => ({
        label: item.label,
        url: item.url.startsWith('http') ? item.url : `https://${item.url}`,
        index,
        isActive: index === selectedIndex,
      })),
      selectedRepoIndex: selectedIndex,
      selectedRepoLabel: activeRepository.label,
      demoUrl: this.getString(matchedProject, 'demoUrl') ?? '',
      markdown: readme.markdown,
      baseUrl: readme.baseUrl,
    };
  }

  private async findProject(slug: string): Promise<ProjectRecord> {
    const resumes = await this.projectRepository.findAll();
    if (resumes.length === 0) {
      throw new NotFoundException('No resume data found in the system.');
    }

    const targetSlug = slug.toLowerCase().trim();
    for (const resume of resumes) {
      const projects = this.getProjects(resume.content);
      const project = projects.find((candidate) =>
        this.matchesSlug(candidate, targetSlug),
      );
      if (project) return project;
    }

    throw new NotFoundException(
      `Project case study for '${slug}' was not found in any CV profile.`,
    );
  }

  private getProjects(content: unknown): ProjectRecord[] {
    if (!this.isRecord(content) || !Array.isArray(content.projects)) return [];
    return content.projects.filter((project) => this.isRecord(project));
  }

  private matchesSlug(project: ProjectRecord, targetSlug: string): boolean {
    const projectSlug = this.getString(project, 'projectSlug')
      ?.toLowerCase()
      .trim();
    const name = this.getString(project, 'name') ?? '';
    const repository = this.getString(project, 'repository') ?? '';
    const repositoryName = repository
      .split('/')
      .filter(Boolean)
      .pop()
      ?.toLowerCase();
    const fullNameSlug = this.toFullSlug(name);
    const shortNameSlug = this.toShortSlug(name);
    const repositorySlug = this.toFullSlug(repositoryName ?? '');

    return Boolean(
      (projectSlug && projectSlug === targetSlug) ||
      (projectSlug && this.toFullSlug(projectSlug) === targetSlug) ||
      fullNameSlug === targetSlug ||
      shortNameSlug === targetSlug ||
      repositoryName === targetSlug ||
      repositorySlug === targetSlug ||
      (targetSlug.length >= 10 &&
        (fullNameSlug.startsWith(targetSlug) ||
          targetSlug.startsWith(fullNameSlug))) ||
      (targetSlug.length >= 10 &&
        (shortNameSlug.startsWith(targetSlug) ||
          targetSlug.startsWith(shortNameSlug))),
    );
  }

  private getRepositories(project: ProjectRecord): RepositoryLink[] {
    const repositoryLinks: RepositoryLink[] = [];
    const repositories = project.repositories;
    if (Array.isArray(repositories)) {
      for (const repository of repositories) {
        if (!this.isRecord(repository)) continue;
        const url = this.getString(repository, 'url')?.trim();
        if (!url) continue;
        repositoryLinks.push({
          label: this.getString(repository, 'label')?.trim() || 'Source Code',
          url,
        });
      }
    }

    if (repositoryLinks.length === 0) {
      const repository = this.getString(project, 'repository')?.trim();
      if (repository) {
        for (const line of repository
          .split(/\r?\n/)
          .map((item) => item.trim())) {
          if (!line) continue;
          const match = line.match(
            /^([^:]+?)\s*[:-]\s*(https?:\/\/.+|github\.com\/.+|gitlab\.com\/.+)$/i,
          );
          repositoryLinks.push({
            label: match?.[1].trim() || 'Source Code',
            url: match?.[2].trim() || line,
          });
        }
      }
    }

    if (repositoryLinks.length === 0) {
      throw new BadRequestException(
        'This project does not have any GitHub repository URLs configured.',
      );
    }
    return repositoryLinks;
  }

  private selectRepository(
    repositories: RepositoryLink[],
    repoParam?: string,
  ): number {
    const candidate = repoParam?.trim().toLowerCase();
    if (!candidate) return 0;

    const requestedIndex = Number.parseInt(candidate, 10);
    if (
      Number.isInteger(requestedIndex) &&
      requestedIndex >= 0 &&
      requestedIndex < repositories.length
    ) {
      return requestedIndex;
    }

    const matchedIndex = repositories.findIndex(
      (repository) =>
        repository.label.toLowerCase() === candidate ||
        repository.url.toLowerCase().includes(candidate),
    );
    return matchedIndex === -1 ? 0 : matchedIndex;
  }

  private parseGitHubRepository(repository: RepositoryLink) {
    const cleanUrl = repository.url
      .replace(/^git\+/, '')
      .replace(/\.git$/i, '')
      .trim();
    const match = cleanUrl.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i,
    );
    if (!match) {
      throw new BadRequestException(
        `Repository '${repository.label}' requires a valid GitHub repository URL (e.g. github.com/username/project), but got '${repository.url}'.`,
      );
    }
    return { owner: match[1], repository: match[2] };
  }

  private getString(record: ProjectRecord, key: string): string | undefined {
    const value = record[key];
    return typeof value === 'string' ? value : undefined;
  }

  private isRecord(value: unknown): value is ProjectRecord {
    return typeof value === 'object' && value !== null;
  }

  private toFullSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private toShortSlug(value: string): string {
    return this.toFullSlug(value).slice(0, 50);
  }
}
