import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  SupabaseAuthGuard,
  type AuthenticatedRequest,
} from '../auth/supabase-auth.guard';
import { ContactService } from './contact.service';
import {
  CreateContactDto,
  type UploadedFileDoc,
} from './dto/create-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('api')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
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

  @Get('admin/contacts')
  @UseGuards(SupabaseAuthGuard)
  listContacts(
    @Req() request: AuthenticatedRequest,
    @Query() dto: ListContactsDto,
  ) {
    return this.contactService.listContacts(request.user.id, dto);
  }

  @Get('admin/contacts/:id')
  @UseGuards(SupabaseAuthGuard)
  getContact(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.contactService.getContact(request.user.id, id);
  }

  @Patch('admin/contacts/:id')
  @UseGuards(SupabaseAuthGuard)
  updateContact(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactService.updateContact(request.user.id, id, dto);
  }

  @Post('admin/contacts/:id/attachment-url')
  @UseGuards(SupabaseAuthGuard)
  createAttachmentUrl(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.contactService.createAttachmentUrl(request.user.id, id);
  }
}
