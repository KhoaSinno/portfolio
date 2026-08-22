import {
  Body,
  Controller,
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

  @Get('resume')
  async getPublished() {
    const resume = await this.resumeService.getPublished();
    return {
      content: resume.content,
      template: resume.template,
      publishedAt: resume.publishedAt,
    };
  }

  @Get('resume/:slug')
  async getPublishedBySlug(@Param('slug') slug: string) {
    const resume = await this.resumeService.getPublishedBySlug(slug);
    return {
      content: resume.content,
      template: resume.template,
      publishedAt: resume.publishedAt,
    };
  }

  @Get('admin/resume')
  @UseGuards(SupabaseAuthGuard)
  async getDraft(@Req() request: AuthenticatedRequest) {
    const resume = await this.resumeService.getDraft(request.user.id);
    return resume
      ? {
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
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpsertResumeDto,
  ) {
    return this.resumeService.saveDraft(request.user.id, dto);
  }

  @Post('admin/resume/publish')
  @UseGuards(SupabaseAuthGuard)
  publish(@Req() request: AuthenticatedRequest, @Body() dto: UpsertResumeDto) {
    return this.resumeService.publish(request.user.id, dto);
  }
}
