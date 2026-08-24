import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  SupabaseAuthGuard,
  type AuthenticatedRequest,
} from '../auth/supabase-auth.guard';
import { UpsertResumeDto } from './dto/upsert-resume.dto';
import {
  CreateResumeProfileDto,
  UpdateResumeMetaDto,
} from './dto/create-resume-profile.dto';
import { ResumeService } from './resume.service';

@Controller('api')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'portfolio-api',
      timestamp: new Date().toISOString(),
    };
  }

  // --- Public Resume Endpoints ---

  @Get('resume')
  async getPublished() {
    const resume = await this.resumeService.getPublished();
    return {
      id: resume.id,
      title: resume.title,
      slug: resume.slug,
      isPrimary: resume.isPrimary,
      content: resume.content,
      template: resume.template,
      publishedAt: resume.publishedAt,
    };
  }

  @Get('resume/:slug')
  async getPublishedBySlug(@Param('slug') slug: string) {
    const resume = await this.resumeService.getPublishedBySlug(slug);
    return {
      id: resume.id,
      title: resume.title,
      slug: resume.slug,
      isPrimary: resume.isPrimary,
      content: resume.content,
      template: resume.template,
      publishedAt: resume.publishedAt,
    };
  }

  @Get('projects/:slug/case-study')
  getProjectCaseStudy(@Param('slug') slug: string) {
    return this.resumeService.getProjectCaseStudy(slug);
  }

  // --- Multi-CV Admin Management Endpoints ---

  @Get('admin/resumes')
  @UseGuards(SupabaseAuthGuard)
  listResumes(@Req() request: AuthenticatedRequest) {
    return this.resumeService.listResumes(request.user.id);
  }

  @Post('admin/resumes')
  @UseGuards(SupabaseAuthGuard)
  createResume(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateResumeProfileDto,
  ) {
    return this.resumeService.createOrDuplicate(request.user.id, dto);
  }

  @Get('admin/resumes/:id')
  @UseGuards(SupabaseAuthGuard)
  getResumeById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.resumeService.getResumeById(request.user.id, id);
  }

  @Put('admin/resumes/:id/meta')
  @UseGuards(SupabaseAuthGuard)
  updateResumeMeta(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateResumeMetaDto,
  ) {
    return this.resumeService.updateMeta(request.user.id, id, dto);
  }

  @Put('admin/resumes/:id')
  @UseGuards(SupabaseAuthGuard)
  saveDraftById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertResumeDto,
  ) {
    return this.resumeService.saveDraftById(request.user.id, id, dto);
  }

  @Post('admin/resumes/:id/publish')
  @UseGuards(SupabaseAuthGuard)
  publishById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertResumeDto,
  ) {
    return this.resumeService.publishById(request.user.id, id, dto);
  }

  @Post('admin/resumes/:id/set-primary')
  @UseGuards(SupabaseAuthGuard)
  setPrimary(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.resumeService.setPrimary(request.user.id, id);
  }

  @Delete('admin/resumes/:id')
  @UseGuards(SupabaseAuthGuard)
  deleteResume(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.resumeService.deleteResume(request.user.id, id);
  }

  @Get('admin/resumes/:id/versions')
  @UseGuards(SupabaseAuthGuard)
  getResumeVersions(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.resumeService.getVersions(id, request.user.id);
  }

  @Post('admin/resumes/:id/rollback/:versionId')
  @UseGuards(SupabaseAuthGuard)
  rollbackResumeVersion(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.resumeService.rollbackVersion(id, versionId, request.user.id);
  }

  // --- Backward-Compatible Endpoints for Default Resume ---

  @Get('admin/resume')
  @UseGuards(SupabaseAuthGuard)
  async getDraft(@Req() request: AuthenticatedRequest) {
    const resume = await this.resumeService.getDraft(request.user.id);
    return resume
      ? {
          id: resume.id,
          title: resume.title,
          isPrimary: resume.isPrimary,
          content: resume.content,
          slug: resume.slug,
          template: resume.template,
          status: resume.status,
          updatedAt: resume.updatedAt,
        }
      : null;
  }

  @Put('admin/resume')
  @UseGuards(SupabaseAuthGuard)
  async saveDraft(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertResumeDto,
  ) {
    const primary = await this.resumeService.getDraft(request.user.id);
    if (!primary) return null;
    return this.resumeService.saveDraftById(request.user.id, primary.id, dto);
  }

  @Post('admin/resume/publish')
  @UseGuards(SupabaseAuthGuard)
  async publish(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertResumeDto,
  ) {
    const primary = await this.resumeService.getDraft(request.user.id);
    if (!primary) return null;
    return this.resumeService.publishById(request.user.id, primary.id, dto);
  }

  @Get('admin/resume/versions')
  @UseGuards(SupabaseAuthGuard)
  async getVersions(@Req() request: AuthenticatedRequest) {
    const primary = await this.resumeService.getDraft(request.user.id);
    if (!primary) return [];
    return this.resumeService.getVersions(primary.id, request.user.id);
  }

  @Post('admin/resume/rollback/:versionId')
  @UseGuards(SupabaseAuthGuard)
  async rollback(
    @Req() request: AuthenticatedRequest,
    @Param('versionId') versionId: string,
  ) {
    const primary = await this.resumeService.getDraft(request.user.id);
    if (!primary) return null;
    return this.resumeService.rollbackVersion(
      primary.id,
      versionId,
      request.user.id,
    );
  }
}
