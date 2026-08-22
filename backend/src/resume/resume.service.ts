import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResumeStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertResumeDto } from './dto/upsert-resume.dto';

@Injectable()
export class ResumeService {
  private readonly legacyResumeId = 'portfolio-resume';

  constructor(private readonly prisma: PrismaService) {}

  getDraft(ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.claimLegacyResume(tx, ownerId);
      return tx.resume.findUnique({ where: { ownerId } });
    });
  }

  async getPublished() {
    let resume = await this.prisma.resume.findFirst({
      where: { status: ResumeStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });
    if (!resume) {
      resume = await this.prisma.resume.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    }
    if (!resume) throw new NotFoundException('No published resume exists yet.');
    return resume;
  }

  async getPublishedBySlug(slug: string) {
    let resume = await this.prisma.resume.findFirst({
      where: { slug, status: ResumeStatus.PUBLISHED },
    });
    if (!resume) {
      resume = await this.prisma.resume.findFirst({
        where: { slug },
      });
    }
    if (!resume) {
      throw new NotFoundException('No published resume exists for this URL.');
    }
    return resume;
  }

  saveDraft(ownerId: string, dto: UpsertResumeDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.claimLegacyResume(tx, ownerId);
      return tx.resume.upsert({
        where: { ownerId },
        create: {
          ownerId,
          slug: this.slugForOwner(ownerId),
          content: dto.content as Prisma.InputJsonValue,
          template: dto.template ?? 'technical',
        },
        update: {
          content: dto.content as Prisma.InputJsonValue,
          template: dto.template ?? 'technical',
        },
      });
    });
  }

  async publish(ownerId: string, dto: UpsertResumeDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.claimLegacyResume(tx, ownerId);
      const resume = await tx.resume.upsert({
        where: { ownerId },
        create: {
          ownerId,
          slug: this.slugForOwner(ownerId),
          content: dto.content as Prisma.InputJsonValue,
          template: dto.template ?? 'technical',
          status: ResumeStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        update: {
          content: dto.content as Prisma.InputJsonValue,
          template: dto.template ?? 'technical',
          status: ResumeStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      const latest = await tx.resumeVersion.findFirst({
        where: { resumeId: resume.id },
        orderBy: { version: 'desc' },
      });
      await tx.resumeVersion.create({
        data: {
          resumeId: resume.id,
          version: (latest?.version ?? 0) + 1,
          content: dto.content as Prisma.InputJsonValue,
          template: resume.template,
        },
      });
      return resume;
    });
  }

  async getVersions(ownerId: string) {
    const resume = await this.prisma.resume.findUnique({ where: { ownerId } });
    if (!resume) return [];
    return this.prisma.resumeVersion.findMany({
      where: { resumeId: resume.id },
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

  async rollbackVersion(ownerId: string, versionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const resume = await tx.resume.findUnique({ where: { ownerId } });
      if (!resume) throw new NotFoundException('Resume not found.');

      const targetVersion = await tx.resumeVersion.findFirst({
        where: { id: versionId, resumeId: resume.id },
      });
      if (!targetVersion) {
        throw new NotFoundException('Selected version not found.');
      }

      const latest = await tx.resumeVersion.findFirst({
        where: { resumeId: resume.id },
        orderBy: { version: 'desc' },
      });

      const nextVersionNumber = (latest?.version ?? 0) + 1;

      // Create new published snapshot version for the rollback
      await tx.resumeVersion.create({
        data: {
          resumeId: resume.id,
          version: nextVersionNumber,
          content: targetVersion.content as Prisma.InputJsonValue,
          template: targetVersion.template,
        },
      });

      const updated = await tx.resume.update({
        where: { id: resume.id },
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

  private async claimLegacyResume(
    tx: Prisma.TransactionClient,
    ownerId: string,
  ) {
    const existing = await tx.resume.findUnique({ where: { ownerId } });
    if (existing) {
      if (existing.slug) return existing;
      return tx.resume.update({
        where: { id: existing.id },
        data: { slug: this.slugForOwner(ownerId) },
      });
    }

    await tx.resume.updateMany({
      where: { id: this.legacyResumeId, ownerId: null },
      data: { ownerId, slug: this.slugForOwner(ownerId) },
    });
    return tx.resume.findUnique({ where: { ownerId } });
  }

  private slugForOwner(ownerId: string) {
    return `u-${ownerId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12)
      .toLowerCase()}`;
  }
}
