import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Ensure user has at least one initial primary resume
   */
  private async ensurePrimaryResume(ownerId: string) {
    const existing = await this.prisma.resume.findFirst({
      where: { ownerId },
    });

    if (!existing) {
      // Check legacy resume
      const legacy = await this.prisma.resume.findUnique({
        where: { id: this.legacyResumeId },
      });
      if (legacy?.ownerId === null) {
        await this.prisma.resume.updateMany({
          where: { id: legacy.id, ownerId: null },
          data: {
            ownerId,
            title: 'Fullstack General',
            isPrimary: true,
            slug: 'general',
          },
        });
      }
    } else {
      // Ensure at least one is primary
      const hasPrimary = await this.prisma.resume.findFirst({
        where: { ownerId, isPrimary: true },
      });
      if (!hasPrimary) {
        await this.prisma.resume.update({
          where: { id: existing.id },
          data: { isPrimary: true },
        });
      }
    }
  }

  /**
   * List all resumes for an owner
   */
  async listResumes(ownerId: string) {
    await this.ensurePrimaryResume(ownerId);
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
  async getResumeById(ownerId: string, id: string) {
    await this.ensurePrimaryResume(ownerId);
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
  async getDraft(ownerId: string, resumeId?: string) {
    await this.ensurePrimaryResume(ownerId);
    if (resumeId) {
      return this.getResumeById(ownerId, resumeId);
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
  async createOrDuplicate(ownerId: string, dto: CreateResumeProfileDto) {
    await this.ensurePrimaryResume(ownerId);

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
   * Public: Get Primary Published Resume (with viewsCount tracking)
   */
  async getPublished() {
    let resume = await this.prisma.resume.findFirst({
      where: { isPrimary: true, status: ResumeStatus.PUBLISHED },
    });
    if (!resume) {
      resume = await this.prisma.resume.findFirst({
        where: { status: ResumeStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
      });
    }
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
