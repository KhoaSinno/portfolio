import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type ProjectCaseStudyRepository,
  type ProjectCaseStudyResume,
} from '../domain/project-case-study.port';

@Injectable()
export class PrismaProjectCaseStudyRepository implements ProjectCaseStudyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProjectCaseStudyResume[]> {
    return this.prisma.resume.findMany({
      orderBy: [
        { isPrimary: 'desc' },
        { publishedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: { content: true },
    });
  }
}
