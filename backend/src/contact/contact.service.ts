import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ContactNotificationStatus,
  ContactStatus,
  ContactTopic,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, type UploadedFileDoc } from './dto/create-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

type RateLimitRecord = { count: number; resetTime: number };

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  private readonly portfolioOwnerId: string;
  private readonly supabaseUrl?: string;
  private readonly serviceRoleKey?: string;
  private readonly attachmentBucket: string;
  private readonly resendApiKey?: string;
  private readonly contactFromEmail?: string;
  private readonly contactOwnerEmail?: string;
  private storageClient?: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.portfolioOwnerId = config.get<string>('PORTFOLIO_OWNER_ID')?.trim() ?? '';
    this.supabaseUrl = config.get<string>('SUPABASE_URL');
    this.serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.attachmentBucket =
      config.get<string>('CONTACT_ATTACHMENT_BUCKET')?.trim() ||
      'contact-attachments';
    this.resendApiKey = config.get<string>('RESEND_API_KEY');
    this.contactFromEmail = config.get<string>('CONTACT_FROM_EMAIL')?.trim();
    this.contactOwnerEmail = config.get<string>('CONTACT_OWNER_EMAIL')?.trim();
  }

  async submitContact(
    dto: CreateContactDto,
    file?: UploadedFileDoc,
    clientIp?: string,
  ) {
    if (dto.honeypot?.trim()) {
      this.logger.warn('Bot submission blocked via honeypot.');
      return { success: true, message: "Message received — I'll reply by email." };
    }

    this.assertRateLimit(clientIp);
    const normalized = this.normalizeSubmission(dto, file);
    if (file) this.assertValidPdf(file);

    let saved = await this.prisma.contactMessage.create({
      data: {
        topic: normalized.topic,
        email: normalized.email,
        message: normalized.message,
        jdLink: normalized.jdLink,
        fileName: file?.originalname || null,
        attachmentMimeType: file ? 'application/pdf' : null,
        fileSize: file?.size || null,
        ip: clientIp || null,
      },
    });

    if (file) {
      const attachmentPath = `contacts/${saved.id}/${crypto.randomUUID()}.pdf`;
      try {
        const storage = this.getStorageClient();
        const { error } = await storage.storage
          .from(this.attachmentBucket)
          .upload(attachmentPath, file.buffer, {
            contentType: 'application/pdf',
            upsert: false,
          });
        if (error) throw new Error(error.message);

        try {
          saved = await this.prisma.contactMessage.update({
            where: { id: saved.id },
            data: { attachmentPath },
          });
        } catch (error) {
          await storage.storage.from(this.attachmentBucket).remove([attachmentPath]);
          throw error;
        }
      } catch (error) {
        await this.prisma.contactMessage.delete({ where: { id: saved.id } }).catch(() => undefined);
        this.logger.error(
          `Contact attachment storage failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        throw new ServiceUnavailableException(
          'Your message could not be sent because the PDF could not be stored. Please retry without the attachment or use a JD link.',
        );
      }
    }

    await this.notifyOwner(saved).catch((error) => {
      this.logger.error(
        `Contact notification processing failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    });

    this.logger.log(`New ${saved.topic} contact received: ${saved.id}`);
    return {
      success: true,
      id: saved.id,
      message: "Message received — I'll reply by email.",
    };
  }

  async listContacts(requesterId: string, dto: ListContactsDto) {
    this.assertOwner(requesterId);
    const limit = dto.limit ?? 20;
    const where: Prisma.ContactMessageWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.topic ? { topic: dto.topic } : {}),
      ...(dto.q
        ? {
            OR: [
              { email: { contains: dto.q, mode: 'insensitive' } },
              { message: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const rows = await this.prisma.contactMessage.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        topic: true,
        email: true,
        message: true,
        fileName: true,
        fileSize: true,
        jdLink: true,
        status: true,
        notificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }

  async getContact(requesterId: string, id: string) {
    this.assertOwner(requesterId);
    const contact = await this.prisma.contactMessage.findUnique({
      where: { id },
      select: {
        id: true,
        topic: true,
        email: true,
        message: true,
        jdLink: true,
        fileName: true,
        fileSize: true,
        attachmentPath: true,
        status: true,
        internalNote: true,
        notificationStatus: true,
        notificationError: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
        archivedAt: true,
      },
    });
    if (!contact) throw new NotFoundException('Contact message was not found.');
    return { ...contact, hasAttachment: Boolean(contact.attachmentPath) };
  }

  async updateContact(requesterId: string, id: string, dto: UpdateContactDto) {
    this.assertOwner(requesterId);
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contact message was not found.');
    const status = dto.status ?? existing.status;
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        ...(dto.status ? { status } : {}),
        ...(dto.internalNote !== undefined
          ? { internalNote: dto.internalNote.trim() || null }
          : {}),
        ...(status === ContactStatus.ARCHIVED
          ? { archivedAt: new Date() }
          : dto.status && existing.status === ContactStatus.ARCHIVED
            ? { archivedAt: null }
            : {}),
        ...(dto.status && status !== ContactStatus.NEW && !existing.reviewedAt
          ? { reviewedAt: new Date() }
          : {}),
      },
    });
  }

  async createAttachmentUrl(requesterId: string, id: string) {
    this.assertOwner(requesterId);
    const contact = await this.prisma.contactMessage.findUnique({
      where: { id },
      select: { attachmentPath: true, fileName: true },
    });
    if (!contact) throw new NotFoundException('Contact message was not found.');
    if (!contact.attachmentPath)
      throw new BadRequestException('This contact has no private PDF attachment.');

    const { data, error } = await this.getStorageClient().storage
      .from(this.attachmentBucket)
      .createSignedUrl(contact.attachmentPath, SIGNED_URL_TTL_SECONDS, {
        download: contact.fileName || 'job-description.pdf',
      });
    if (error || !data?.signedUrl) {
      this.logger.error(`Could not create signed contact attachment URL: ${error?.message ?? 'unknown error'}`);
      throw new ServiceUnavailableException('The private attachment is temporarily unavailable.');
    }
    return { url: data.signedUrl, expiresInSeconds: SIGNED_URL_TTL_SECONDS };
  }

  private normalizeSubmission(dto: CreateContactDto, file?: UploadedFileDoc) {
    const topic = dto.topic;
    const email = dto.email.trim().toLowerCase();
    const message = dto.message.trim();
    const jdLink = dto.jdLink?.trim() || null;
    if (!message) throw new BadRequestException('Message is required.');
    if (topic !== ContactTopic.HIRING && (jdLink || file)) {
      throw new BadRequestException('JD links and PDF attachments are available for Hiring inquiries only.');
    }
    if (jdLink && file) {
      throw new BadRequestException('Attach a PDF or provide a JD link, not both.');
    }
    return { topic, email, message, jdLink };
  }

  private assertValidPdf(file: UploadedFileDoc) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException('PDF is too large. The maximum file size is 10 MB.');
    }
    if (file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new BadRequestException('Only valid PDF attachments are accepted.');
    }
  }

  private assertRateLimit(clientIp?: string) {
    const ipKey = clientIp || 'unknown-ip';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 5;
    const record = this.rateLimits.get(ipKey);
    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        throw new HttpException('Too many submissions. Please wait a few minutes before sending another message.', HttpStatus.TOO_MANY_REQUESTS);
      }
      record.count += 1;
      return;
    }
    this.rateLimits.set(ipKey, { count: 1, resetTime: now + windowMs });
  }

  private assertOwner(requesterId: string) {
    if (!this.portfolioOwnerId) {
      throw new ServiceUnavailableException('Portfolio owner has not been configured.');
    }
    if (requesterId !== this.portfolioOwnerId) {
      throw new ForbiddenException('Only the portfolio owner can access contact messages.');
    }
  }

  private getStorageClient() {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new ServiceUnavailableException('Private contact attachment storage has not been configured.');
    }
    this.storageClient ??= createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.storageClient;
  }

  private async notifyOwner(contact: {
    id: string;
    topic: ContactTopic;
    email: string;
    message: string;
    jdLink: string | null;
    fileName: string | null;
    fileSize: number | null;
  }) {
    if (!this.resendApiKey || !this.contactFromEmail || !this.contactOwnerEmail) {
      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: {
          notificationStatus: ContactNotificationStatus.FAILED,
          notificationError: 'Resend notification is not configured.',
        },
      });
      this.logger.warn('Contact stored, but Resend notification is not configured.');
      return;
    }

    const safeTopic = contact.topic.replace('_', ' ');
    const text = [
      `New ${safeTopic} contact`,
      `From: ${contact.email}`,
      `Contact ID: ${contact.id}`,
      '',
      'Message:',
      contact.message,
      ...(contact.jdLink ? ['', `JD link: ${contact.jdLink}`] : []),
      ...(contact.fileName ? ['', `Private PDF attachment: ${contact.fileName}${contact.fileSize ? ` (${Math.round(contact.fileSize / 1024)} KB)` : ''}`, 'Open the CMS inbox to download it securely.'] : []),
    ].join('\n');

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.contactFromEmail,
          to: [this.contactOwnerEmail],
          reply_to: contact.email,
          subject: `[Portfolio] ${safeTopic}: new message from ${contact.email}`,
          text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}`);
      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: { notificationStatus: ContactNotificationStatus.SENT, notificationError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown notification error';
      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: { notificationStatus: ContactNotificationStatus.FAILED, notificationError: message },
      });
    }
  }
}
