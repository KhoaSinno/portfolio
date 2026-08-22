import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { UpsertResumeDto } from './dto/upsert-resume.dto';
import { ResumeService } from './resume.service';

@Controller('api')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'portfolio-api', timestamp: new Date().toISOString() };
  }

  @Get('resume')
  async getPublished() {
    const resume = await this.resumeService.getPublished();
    return { content: resume.content, template: resume.template, publishedAt: resume.publishedAt };
  }

  @Get('admin/resume')
  async getDraft() {
    const resume = await this.resumeService.getDraft();
    return resume ? { content: resume.content, template: resume.template, status: resume.status, updatedAt: resume.updatedAt } : null;
  }

  @Put('admin/resume')
  saveDraft(@Body() dto: UpsertResumeDto) {
    return this.resumeService.saveDraft(dto);
  }

  @Post('admin/resume/publish')
  publish(@Body() dto: UpsertResumeDto) {
    return this.resumeService.publish(dto);
  }
}
