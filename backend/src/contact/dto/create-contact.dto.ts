import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export interface UploadedFileDoc {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class CreateContactDto {
  @IsEmail({}, { message: 'Please provide a valid work email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'JD link is too long.' })
  jdLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'Message cannot exceed 3000 characters.' })
  message?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
