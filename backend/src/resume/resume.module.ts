import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
