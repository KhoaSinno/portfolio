import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectCaseStudyService } from './application/project-case-study.service';
import {
  PROJECT_CASE_STUDY_REPOSITORY,
  PROJECT_README_CLIENT,
} from './domain/project-case-study.port';
import { GitHubProjectReadmeClient } from './infrastructure/github-project-readme.client';
import { PrismaProjectCaseStudyRepository } from './infrastructure/prisma-project-case-study.repository';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [
    ResumeService,
    ProjectCaseStudyService,
    PrismaProjectCaseStudyRepository,
    GitHubProjectReadmeClient,
    {
      provide: PROJECT_CASE_STUDY_REPOSITORY,
      useExisting: PrismaProjectCaseStudyRepository,
    },
    {
      provide: PROJECT_README_CLIENT,
      useExisting: GitHubProjectReadmeClient,
    },
  ],
})
export class ResumeModule {}
