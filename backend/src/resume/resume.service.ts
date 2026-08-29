import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Prisma, ResumeStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertResumeDto } from './dto/upsert-resume.dto';
import {
  CreateResumeProfileDto,
  UpdateResumeMetaDto,
} from './dto/create-resume-profile.dto';

@Injectable()
export class ResumeService {
  private readonly legacyResumeId = 'portfolio-resume';
  private readonly reservedSlugs = new Set(['admin', 'api', 'login', 'resume']);
  private readonly portfolioOwnerId: string;
  private readonly supabaseUrl?: string;
  private readonly serviceRoleKey?: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.portfolioOwnerId =
      config.get<string>('PORTFOLIO_OWNER_ID')?.trim() ?? '';
    this.supabaseUrl = config.get<string>('SUPABASE_URL');
    this.serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  private getPortfolioOwnerId() {
    if (!this.portfolioOwnerId) {
      throw new ServiceUnavailableException(
        'Portfolio owner has not been configured.',
      );
    }
    return this.portfolioOwnerId;
  }

  isPortfolioOwner(ownerId: string) {
    return ownerId === this.getPortfolioOwnerId();
  }

  async resetDemoResume(requesterId: string) {
    if (!this.isPortfolioOwner(requesterId)) {
      throw new ForbiddenException(
        'Only the portfolio owner can reset demo data.',
      );
    }
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Demo reset has not been configured on this server.',
      );
    }

    const supabase = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error) {
      throw new ServiceUnavailableException(
        'Could not look up the demo account.',
      );
    }
    const demoEmail = 'demo@gmail.com';
    const demoUser = data.users.find(
      (user) => user.email?.toLowerCase() === demoEmail,
    );
    if (!demoUser) throw new NotFoundException('Demo account was not found.');

    const deleted = await this.prisma.resume.deleteMany({
      where: { ownerId: demoUser.id },
    });
    const resumes = await this.listResumes(demoUser.id, demoEmail);
    const seeded = resumes[0];
    if (!seeded) {
      throw new ServiceUnavailableException('Could not seed the demo resume.');
    }

    return { deletedCount: deleted.count, title: seeded.title };
  }

  /**
   * Helper to slugify a title into a clean URL slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  /**
   * Generates an available unique slug
   */
  private async generateUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    const slug = this.slugify(base) || 'cv';
    let counter = 1;
    while (true) {
      const candidate = counter === 1 ? slug : `${slug}-${counter}`;
      const existing = await this.prisma.resume.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return candidate;
      counter++;
    }
  }

  private assertAllowedSlug(slug: string) {
    if (this.reservedSlugs.has(slug)) {
      throw new BadRequestException(
        `Slug '${slug}' is reserved by the system.`,
      );
    }
  }

  /** Ensure every allowed user has an isolated primary resume. */
  private async ensurePrimaryResume(ownerId: string, userEmail?: string) {
    const portfolioOwnerId = this.getPortfolioOwnerId();
    const existing = await this.prisma.resume.findFirst({
      where: { ownerId },
    });

    if (existing) {
      const hasPrimary = await this.prisma.resume.findFirst({
        where: { ownerId, isPrimary: true },
      });
      if (!hasPrimary) {
        await this.prisma.resume.update({
          where: { id: existing.id },
          data: { isPrimary: true },
        });
      }
      return;
    }

    if (ownerId === portfolioOwnerId) {
      const legacy = await this.prisma.resume.findUnique({
        where: { id: this.legacyResumeId },
      });
      if (legacy) {
        await this.prisma.resume.update({
          where: { id: legacy.id },
          data: { ownerId, isPrimary: true },
        });
        return;
      }
    }

    const isDemoUser = userEmail?.toLowerCase() === 'demo@gmail.com';
    const content = this.getDefaultMockResumeContent();
    const suffix = ownerId.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'cv';
    const slug = await this.generateUniqueSlug(
      `${isDemoUser ? 'demo' : 'resume'}-${suffix}`,
    );

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.resume.create({
        data: {
          ownerId,
          title: isDemoUser
            ? 'Candidate Profile (Demo Test)'
            : 'Fullstack Developer Profile',
          slug,
          isPrimary: true,
          status: ResumeStatus.DRAFT,
          template: 'technical',
          content,
        },
      });
      await tx.resumeVersion.create({
        data: {
          resumeId: created.id,
          version: 1,
          template: 'technical',
          content,
        },
      });
    });
  }

  private getDefaultMockResumeContent(): Prisma.InputJsonValue {
    return {
      basics: {
        name: 'Demo Candidate',
        headline: 'Fullstack Developer',
        email: 'demo@example.com',
        location: 'Can Tho City, Vietnam',
        website: 'https://example.com',
        linkedin: 'linkedin.com/in/demo-candidate',
        github: 'github.com/demo-candidate',
      },
      summary:
        'Demo profile for exploring the portfolio CMS. This content is isolated from the portfolio owner account.',
      technicalSkills: [
        {
          category: 'Frontend',
          items: 'TypeScript, Next.js, React, Tailwind CSS, responsive UI',
          isVisible: true,
        },
        {
          category: 'Backend & Database',
          items: 'NestJS, FastAPI, PostgreSQL, Prisma, Supabase',
          isVisible: true,
        },
        {
          category: 'DevOps & Tools',
          items: 'Git/GitHub, Docker, Postman, Vercel, Render',
          isVisible: true,
        },
        {
          category: 'AI & Realtime',
          items: 'Hybrid RAG, RRF, Vector DB, LiveKit WebRTC',
          isVisible: true,
        },
      ],
      experience: [
        {
          role: 'Fullstack Developer Intern',
          company: 'Tech Solutions Lab',
          period: '06/2025 — 12/2025',
          description:
            'Developed reusable UI components with Next.js and Tailwind CSS.\nImplemented RESTful APIs and PostgreSQL schema with NestJS and Prisma ORM.\nCollaborated on optimizing database query performance and CI/CD pipelines.',
          isVisible: true,
          showOnWeb: true,
          showOnCv: true,
        },
      ],
      projects: [
        {
          name: 'SafeNews - Intelligent News Aggregator',
          role: 'Fullstack Developer',
          period: '2026',
          techStack: 'Flutter · Python · FastAPI · PostgreSQL',
          repository: 'github.com/khoasinno/safenews_flutter',
          repositories: [
            {
              label: 'Mobile App',
              url: 'github.com/KhoaSinno/safenews_flutter',
            },
            {
              label: 'Crawler Service',
              url: 'github.com/KhoaSinno/safe_news_crawlTool_RSS',
            },
          ],
          projectType: 'mobile',
          demoUrl: 'https://youtu.be/yfFyHzl_rc0',
          projectSlug: 'safenews-app',
          thumbnailUrl: '',
          thumbnailAlt: 'SafeNews preview',
          highlights:
            'Developed a cross-platform mobile application with Flutter and Riverpod.\nBuilt an automated RSS content crawler and NLP analyzer with Python.\nIntegrated YouTube interactive demo video and smart thumbnail caching.',
          isVisible: true,
          showOnWeb: true,
          showOnCv: true,
          hideRepository: false,
          hideDemoUrl: false,
        },
        {
          name: 'Portfolio Platform & CV Builder',
          role: 'Lead Fullstack Developer',
          period: '2026',
          techStack: 'Next.js · TypeScript · NestJS · PostgreSQL · Supabase',
          repository: 'github.com/khoasinno/portfolio',
          repositories: [
            { label: 'Source Code', url: 'github.com/khoasinno/portfolio' },
          ],
          projectType: 'web',
          demoUrl: 'https://www.nguyentrananhkhoa.id.vn',
          projectSlug: 'portfolio-platform',
          thumbnailUrl: '',
          thumbnailAlt: 'Portfolio Platform preview',
          highlights:
            'Designed a multi-tenant resume editor with Zod schema validation and A4 print export.\nImplemented PostgreSQL JSONB document storage with version history and rollback.\nAdded multi-repository management and dynamic mockup frames.',
          isVisible: true,
          showOnWeb: true,
          showOnCv: true,
          hideRepository: false,
          hideDemoUrl: false,
        },
      ],
      education: [
        {
          institution: 'Can Tho University of Technology',
          period: '2022 — 2026',
          degree: 'Bachelor of Information Technology',
          details: 'GPA: 3.2/4.0 · Major in Software Engineering',
          isVisible: true,
        },
      ],
      sectionOrder: [
        'summary',
        'technicalSkills',
        'experience',
        'projects',
        'education',
      ],
      hiddenSections: [],
      hiddenBasicsFields: [],
    };
  }

  /**
   * List all resumes for an owner
   */
  async listResumes(ownerId: string, userEmail?: string) {
    await this.ensurePrimaryResume(ownerId, userEmail);
    return this.prisma.resume.findMany({
      where: { ownerId },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        isPrimary: true,
        template: true,
        status: true,
        viewsCount: true,
        lastViewedAt: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
        _count: {
          select: { versions: true },
        },
      },
    });
  }

  /**
   * Get single resume details by ID
   */
  async getResumeById(ownerId: string, id: string, userEmail?: string) {
    await this.ensurePrimaryResume(ownerId, userEmail);
    const resume = await this.prisma.resume.findFirst({
      where: { id, ownerId },
    });
    if (!resume) {
      throw new NotFoundException('Resume profile not found.');
    }
    return resume;
  }

  /**
   * Get draft for active or primary resume
   */
  async getDraft(ownerId: string, resumeId?: string, userEmail?: string) {
    await this.ensurePrimaryResume(ownerId, userEmail);
    if (resumeId) {
      return this.getResumeById(ownerId, resumeId, userEmail);
    }
    // Return primary resume draft
    const primary = await this.prisma.resume.findFirst({
      where: { ownerId, isPrimary: true },
    });
    if (primary) return primary;
    return this.prisma.resume.findFirst({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Create or Duplicate a CV Profile
   */
  async createOrDuplicate(
    ownerId: string,
    dto: CreateResumeProfileDto,
    userEmail?: string,
  ) {
    await this.ensurePrimaryResume(ownerId, userEmail);

    const title = dto.title.trim();
    const slug = await this.generateUniqueSlug(dto.slug || title);
    this.assertAllowedSlug(slug);

    let contentToCopy: Prisma.InputJsonValue | null = null;
    let templateToCopy = 'technical';

    if (dto.sourceResumeId) {
      const source = await this.prisma.resume.findFirst({
        where: { id: dto.sourceResumeId, ownerId },
      });
      if (!source) throw new NotFoundException('Source resume not found.');
      contentToCopy = source.content;
      templateToCopy = source.template;
    }

    if (!contentToCopy) {
      // Clone from primary
      const primary = await this.prisma.resume.findFirst({
        where: { ownerId, isPrimary: true },
      });
      if (primary) {
        contentToCopy = primary.content;
        templateToCopy = primary.template;
      }
    }

    if (!contentToCopy) {
      throw new BadRequestException(
        'Cannot create resume without initial content.',
      );
    }

    const newResume = await this.prisma.resume.create({
      data: {
        ownerId,
        title,
        slug,
        isPrimary: false,
        content: contentToCopy,
        template: templateToCopy,
        status: ResumeStatus.DRAFT,
      },
    });

    // Create initial version 1 snapshot
    await this.prisma.resumeVersion.create({
      data: {
        resumeId: newResume.id,
        version: 1,
        content: contentToCopy,
        template: templateToCopy,
      },
    });

    return newResume;
  }

  /**
   * Update Resume metadata (title, slug)
   */
  async updateMeta(ownerId: string, id: string, dto: UpdateResumeMetaDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, ownerId },
    });
    if (!resume) throw new NotFoundException('Resume not found.');

    const data: Prisma.ResumeUpdateInput = {};

    if (dto.title?.trim()) {
      data.title = dto.title.trim();
    }

    if (dto.slug?.trim()) {
      const cleanSlug = this.slugify(dto.slug);
      this.assertAllowedSlug(cleanSlug);
      const existing = await this.prisma.resume.findFirst({
        where: { slug: cleanSlug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Slug '${cleanSlug}' is already taken.`);
      }
      data.slug = cleanSlug;
    }

    return this.prisma.resume.update({
      where: { id },
      data,
    });
  }

  /**
   * Save draft for specific resume
   */
  async saveDraftById(ownerId: string, id: string, dto: UpsertResumeDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, ownerId },
    });
    if (!resume) throw new NotFoundException('Resume not found.');

    return this.prisma.resume.update({
      where: { id },
      data: {
        content: dto.content as Prisma.InputJsonValue,
        template: dto.template ?? resume.template,
      },
    });
  }

  /**
   * Publish specific resume and create version snapshot
   */
  async publishById(ownerId: string, id: string, dto: UpsertResumeDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const resume = await tx.resume.findFirst({
          where: { id, ownerId },
        });
        if (!resume) throw new NotFoundException('Resume not found.');

        const updated = await tx.resume.update({
          where: { id },
          data: {
            content: dto.content as Prisma.InputJsonValue,
            template: dto.template ?? resume.template,
            status: ResumeStatus.PUBLISHED,
            publishedAt: new Date(),
          },
        });

        const latest = await tx.resumeVersion.findFirst({
          where: { resumeId: id },
          orderBy: { version: 'desc' },
        });

        await tx.resumeVersion.create({
          data: {
            resumeId: id,
            version: (latest?.version ?? 0) + 1,
            content: dto.content as Prisma.InputJsonValue,
            template: updated.template,
          },
        });

        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /**
   * Set a CV profile as Primary
   */
  async setPrimary(ownerId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const resume = await tx.resume.findFirst({
        where: { id, ownerId },
      });
      if (!resume) throw new NotFoundException('Resume not found.');

      // Clear isPrimary from all resumes of this owner
      await tx.resume.updateMany({
        where: { ownerId },
        data: { isPrimary: false },
      });

      // Set this one as primary
      return tx.resume.update({
        where: { id },
        data: { isPrimary: true },
      });
    });
  }

  /**
   * Delete a CV Profile with strict constraints
   */
  async deleteResume(ownerId: string, id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const resume = await tx.resume.findFirst({ where: { id, ownerId } });
        if (!resume) {
          throw new NotFoundException('Resume not found.');
        }

        // Constraint 1: Cannot delete Primary CV
        if (resume.isPrimary) {
          throw new BadRequestException(
            'Cannot delete the Primary CV. Please set another CV as Primary before deleting this one.',
          );
        }

        // Constraint 2: Cannot delete if only 1 CV remains
        const totalCount = await tx.resume.count({
          where: { ownerId },
        });
        if (totalCount <= 1) {
          throw new BadRequestException(
            'Cannot delete the only remaining CV in the system.',
          );
        }

        await tx.resume.delete({
          where: { id },
        });

        return {
          success: true,
          message: 'Resume profile deleted successfully.',
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /**
   * Get version history for specific resume
   */
  async getVersions(id: string, ownerId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, ownerId },
    });
    if (!resume) return [];

    return this.prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        template: true,
        createdAt: true,
        content: true,
      },
    });
  }

  /**
   * Rollback version for specific resume
   */
  async rollbackVersion(id: string, versionId: string, ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const resume = await tx.resume.findFirst({
        where: { id, ownerId },
      });
      if (!resume) throw new NotFoundException('Resume not found.');

      const targetVersion = await tx.resumeVersion.findFirst({
        where: { id: versionId, resumeId: id },
      });
      if (!targetVersion) {
        throw new NotFoundException('Selected version not found.');
      }

      const latest = await tx.resumeVersion.findFirst({
        where: { resumeId: id },
        orderBy: { version: 'desc' },
      });

      const nextVersionNumber = (latest?.version ?? 0) + 1;

      // Create new published snapshot version for the rollback
      await tx.resumeVersion.create({
        data: {
          resumeId: id,
          version: nextVersionNumber,
          content: targetVersion.content as Prisma.InputJsonValue,
          template: targetVersion.template,
        },
      });

      const updated = await tx.resume.update({
        where: { id },
        data: {
          content: targetVersion.content as Prisma.InputJsonValue,
          template: targetVersion.template,
          status: ResumeStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      return {
        content: updated.content,
        template: updated.template,
        version: nextVersionNumber,
        sourceVersion: targetVersion.version,
      };
    });
  }

  /**
   * Public: get the configured portfolio owner's primary published resume.
   */
  async getPublished() {
    const resume = await this.prisma.resume.findFirst({
      where: {
        ownerId: this.getPortfolioOwnerId(),
        isPrimary: true,
        status: ResumeStatus.PUBLISHED,
      },
    });

    if (!resume) throw new NotFoundException('No published resume exists yet.');

    // Increment view count asynchronously
    void this.prisma.resume
      .update({
        where: { id: resume.id },
        data: {
          viewsCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
      .catch(() => {});

    return resume;
  }

  /**
   * Public: Get Published Resume by Slug (with viewsCount tracking)
   */
  async getPublishedBySlug(slug: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { slug, status: ResumeStatus.PUBLISHED },
    });
    if (!resume) {
      throw new NotFoundException('No published resume exists for this URL.');
    }

    // Increment view count asynchronously
    void this.prisma.resume
      .update({
        where: { id: resume.id },
        data: {
          viewsCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
      .catch(() => {});

    return resume;
  }
}
