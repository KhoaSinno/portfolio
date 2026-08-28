import { NotFoundException } from '@nestjs/common';
import { ProjectCaseStudyService } from './project-case-study.service';
import type {
  ProjectCaseStudyRepository,
  ProjectCaseStudyResume,
  ProjectReadme,
  ProjectReadmeClient,
} from '../domain/project-case-study.port';

describe('ProjectCaseStudyService', () => {
  let resumes: ProjectCaseStudyResume[] = [];
  let readme: ProjectReadme | null = null;
  let requestedRepository: { owner: string; repository: string } | null = null;
  const repository: ProjectCaseStudyRepository = {
    findAll: () => Promise.resolve(resumes),
  };
  const readmeClient: ProjectReadmeClient = {
    fetchReadme: (owner, repository) => {
      requestedRepository = { owner, repository };
      return Promise.resolve(readme);
    },
  };
  const service = new ProjectCaseStudyService(repository, readmeClient);

  beforeEach(() => {
    resumes = [];
    readme = null;
    requestedRepository = null;
  });

  it('returns the existing API payload with the selected repository README', async () => {
    resumes = [
      {
        content: {
          projects: [
            {
              name: 'Safe News Crawl Tool RSS',
              projectSlug: 'safe-news-crawl-tool-rss',
              demoUrl: 'https://example.com/demo',
              repositories: [
                { label: 'Frontend', url: 'https://github.com/acme/web' },
                { label: 'Crawler', url: 'https://github.com/acme/crawler' },
              ],
            },
          ],
        },
      },
    ];
    readme = {
      markdown: '# Crawler',
      baseUrl: 'https://raw.githubusercontent.com/acme/crawler/main/',
    };

    await expect(
      service.getProjectCaseStudy('safe-news-crawl-tool-rss', '1'),
    ).resolves.toEqual({
      title: 'Safe News Crawl Tool RSS',
      repositoryUrl: 'https://github.com/acme/crawler',
      repositories: [
        {
          label: 'Frontend',
          url: 'https://github.com/acme/web',
          index: 0,
          isActive: false,
        },
        {
          label: 'Crawler',
          url: 'https://github.com/acme/crawler',
          index: 1,
          isActive: true,
        },
      ],
      selectedRepoIndex: 1,
      selectedRepoLabel: 'Crawler',
      demoUrl: 'https://example.com/demo',
      markdown: '# Crawler',
      baseUrl: 'https://raw.githubusercontent.com/acme/crawler/main/',
    });
    expect(requestedRepository).toEqual({
      owner: 'acme',
      repository: 'crawler',
    });
  });

  it('reports a not-found project before calling GitHub', async () => {
    resumes = [{ content: { projects: [] } }];

    await expect(
      service.getProjectCaseStudy('missing-project'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(requestedRepository).toBeNull();
  });
});
