import { Injectable } from '@nestjs/common';
import {
  type ProjectReadme,
  type ProjectReadmeClient,
} from '../domain/project-case-study.port';

type GitHubReadmeResponse = {
  content?: string;
  download_url?: string;
  encoding?: string;
};

@Injectable()
export class GitHubProjectReadmeClient implements ProjectReadmeClient {
  async fetchReadme(
    owner: string,
    repository: string,
  ): Promise<ProjectReadme | null> {
    const apiReadme = await this.fetchFromGitHubApi(owner, repository);
    if (apiReadme) return apiReadme;

    return this.fetchFromRawContent(owner, repository);
  }

  private async fetchFromGitHubApi(
    owner: string,
    repository: string,
  ): Promise<ProjectReadme | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/readme`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'portfolio-case-study',
          },
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!response.ok) return null;

      const readme = (await response.json()) as GitHubReadmeResponse;
      if (readme.encoding !== 'base64' || !readme.content) return null;

      return {
        markdown: Buffer.from(readme.content, 'base64').toString('utf8'),
        baseUrl: readme.download_url
          ? readme.download_url.replace(/[^/]+$/, '')
          : `https://raw.githubusercontent.com/${owner}/${repository}/main/`,
      };
    } catch {
      return null;
    }
  }

  private async fetchFromRawContent(
    owner: string,
    repository: string,
  ): Promise<ProjectReadme | null> {
    const rawCandidates = [
      `https://raw.githubusercontent.com/${owner}/${repository}/main/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repository}/main/readme.md`,
      `https://raw.githubusercontent.com/${owner}/${repository}/master/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repository}/master/readme.md`,
      `https://raw.githubusercontent.com/${owner}/${repository}/HEAD/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repository}/HEAD/readme.md`,
    ];

    for (const rawUrl of rawCandidates) {
      try {
        const response = await fetch(rawUrl, {
          signal: AbortSignal.timeout(5_000),
        });
        if (response.ok) {
          return {
            markdown: await response.text(),
            baseUrl: rawUrl.replace(/[^/]+$/, ''),
          };
        }
      } catch {
        // Try the next branch/file-name combination.
      }
    }

    return null;
  }
}
