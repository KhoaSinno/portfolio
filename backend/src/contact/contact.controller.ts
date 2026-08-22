import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactDto, type UploadedFileDoc } from './dto/create-contact.dto';

@Controller('api')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max file size
      },
    }),
  )
  async submitContact(
    @Body() dto: CreateContactDto,
    @UploadedFile() file: UploadedFileDoc | undefined,
    @Req() request: Request,
  ) {
    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      request.ip;
    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : typeof rawIp === 'string'
      ? rawIp.split(',')[0].trim()
      : undefined;

    return this.contactService.submitContact(dto, file, clientIp);
  }
}
