import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ContactTopic } from '../../generated/prisma/client';

export interface UploadedFileDoc {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class CreateContactDto {
  @IsEnum(ContactTopic, { message: 'Choose a valid contact topic.' })
  topic!: ContactTopic;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  @MaxLength(320, { message: 'Email address is too long.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Message is required.' })
  @MaxLength(3000, { message: 'Message cannot exceed 3000 characters.' })
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'JD link is too long.' })
  @ValidateIf((dto: CreateContactDto) => Boolean(dto.jdLink?.trim()))
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'JD link must be a valid HTTPS URL.' },
  )
  jdLink?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
