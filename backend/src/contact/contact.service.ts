import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, type UploadedFileDoc } from './dto/create-contact.dto';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly rateLimits = new Map<string, RateLimitRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async submitContact(
    dto: CreateContactDto,
    file?: UploadedFileDoc,
    clientIp?: string,
  ) {
    // 1. Anti-bot honeypot check
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      this.logger.warn(`Bot submission blocked via honeypot from IP ${clientIp}`);
      return {
        success: true,
        message: "Thank you! Your message has been received.",
      };
    }

    // 2. Sliding window IP Rate Limiting (max 5 submissions per 10 mins)
    const ipKey = clientIp || 'unknown-ip';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 5;

    const record = this.rateLimits.get(ipKey);
    if (record) {
      if (now < record.resetTime) {
        if (record.count >= maxRequests) {
          throw new HttpException(
            'Too many submissions. Please wait a few minutes before sending another message.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        record.count += 1;
      } else {
        this.rateLimits.set(ipKey, { count: 1, resetTime: now + windowMs });
      }
    } else {
      this.rateLimits.set(ipKey, { count: 1, resetTime: now + windowMs });
    }

    // 3. Handle File Upload (JD Document: PDF, DOC, DOCX, Image)
    let fileName: string | null = null;
    let fileUrl: string | null = null;
    let fileSize: number | null = null;

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const ext = file.originalname.split('.').pop() || 'pdf';
          const safeKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

          // Try uploading to 'attachments' or 'resumes' bucket
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(`jd/${safeKey}`, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (!error && data?.path) {
            const { data: publicUrlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(data.path);
            fileUrl = publicUrlData.publicUrl;
          }
        } catch (storageErr) {
          this.logger.warn(`Storage upload note: ${storageErr}`);
        }
      }

      if (!fileUrl) {
        fileUrl = `Uploaded file: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`;
      }
    }

    // 4. Save message & JD info to PostgreSQL database
    const saved = await this.prisma.contactMessage.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        jdLink: dto.jdLink?.trim() || null,
        fileName,
        fileUrl,
        fileSize,
        message: dto.message?.trim() || null,
        ip: clientIp || null,
      },
    });

    this.logger.log(
      `New contact message [ID: ${saved.id}] received from ${saved.email} (File: ${fileName ?? 'None'}, Link: ${saved.jdLink ?? 'None'})`,
    );

    // 5. Try sending email notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminNotificationEmail = process.env.ADMIN_NOTIFY_EMAIL || 'ntakhoa@gmail.com';

    if (resendApiKey) {
      try {
        const fileDisplayHtml = fileName
          ? `<p><strong>Attached JD File:</strong> ${fileName} (${((fileSize ?? 0) / 1024).toFixed(1)} KB)<br/>${
              fileUrl && fileUrl.startsWith('http')
                ? `<a href="${fileUrl}" target="_blank" style="color: #4f46e5; font-weight: bold;">Download JD File</a>`
                : `<span style="color: #64748b;">${fileUrl}</span>`
            }</p>`
          : '';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Sinoo Hub Contact <onboarding@resend.dev>',
            to: [adminNotificationEmail],
            reply_to: saved.email,
            subject: `💼 New Recruiter / Interview Contact from ${saved.email}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #4f46e5; margin-bottom: 8px;">New Contact & JD Submission</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 0;">Received via your Sinoo Hub Portfolio Landing Page.</p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;" />
                
                <p><strong>From Email:</strong> <a href="mailto:${saved.email}">${saved.email}</a></p>
                
                ${
                  saved.jdLink
                    ? `<p><strong>Job Description (JD) Link:</strong><br/><a href="${saved.jdLink}" target="_blank" style="color: #4f46e5; font-weight: bold; word-break: break-all;">${saved.jdLink}</a></p>`
                    : ''
                }
                
                ${fileDisplayHtml}
                
                ${
                  saved.message
                    ? `<p><strong>Note / Message:</strong></p><div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #4f46e5; white-space: pre-wrap; color: #334155; font-size: 14px;">${saved.message}</div>`
                    : '<p style="color: #94a3b8;"><em>No additional note provided.</em></p>'
                }
                
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8;">Time: ${saved.createdAt.toISOString()} | IP: ${saved.ip || 'N/A'}</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        this.logger.error(`Failed to dispatch email notification: ${emailErr}`);
      }
    }

    return {
      success: true,
      message: "Your message and JD have been received! I'll get back to you soon.",
      id: saved.id,
    };
  }
}
