import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabaseUrl?: string;
  private readonly publishableKey?: string;
  private readonly adminEmails: string[];
  private client?: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.get<string>('SUPABASE_URL');
    this.publishableKey = config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    this.adminEmails = (config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      !this.supabaseUrl ||
      !this.publishableKey ||
      this.adminEmails.length === 0
    ) {
      throw new ServiceUnavailableException(
        'Admin authentication has not been configured.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.getBearerToken(request.headers.authorization);
    const { data, error } = await this.getClient().auth.getUser(token);

    if (error || !data.user)
      throw new UnauthorizedException(
        'A valid Supabase access token is required.',
      );
    if (
      !data.user.email ||
      !this.adminEmails.includes(data.user.email.toLowerCase())
    ) {
      throw new ForbiddenException(
        'This user is not allowed to manage the portfolio.',
      );
    }

    return true;
  }

  private getClient() {
    this.client ??= createClient(this.supabaseUrl!, this.publishableKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return this.client;
  }

  private getBearerToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('A bearer token is required.');
    return authorization.slice('Bearer '.length);
  }
}
