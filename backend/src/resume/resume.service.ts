import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResumeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertResumeDto } from './dto/upsert-resume.dto';

@Injectable()
export class ResumeService {
  private readonly resumeId = 'portfolio-resume';

  constructor(private readonly prisma: PrismaService) {}

  getDraft() {
    return this.prisma.resume.findUnique({ where: { id: this.resumeId } });
  }

  async getPublished() {
    const resume = await this.prisma.resume.findFirst({ where: { status: ResumeStatus.PUBLISHED } });
    if (!resume) throw new NotFoundException('No published resume exists yet.');
    return resume;
  }

  saveDraft(dto: UpsertResumeDto) {
    return this.prisma.resume.upsert({
      where: { id: this.resumeId },
      create: { id: this.resumeId, content: dto.content as Prisma.InputJsonValue, template: dto.template ?? 'technical' },
      update: { content: dto.content as Prisma.InputJsonValue, template: dto.template ?? 'technical' },
    });
  }

  async publish(dto: UpsertResumeDto) {
    return this.prisma.$transaction(async (tx) => {
      const resume = await tx.resume.upsert({
        where: { id: this.resumeId },
        create: {
          id: this.resumeId,
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
      const latest = await tx.resumeVersion.findFirst({ where: { resumeId: resume.id }, orderBy: { version: 'desc' } });
      await tx.resumeVersion.create({
        data: { resumeId: resume.id, version: (latest?.version ?? 0) + 1, content: dto.content as Prisma.InputJsonValue, template: resume.template },
      });
      return resume;
    });
  }
}
