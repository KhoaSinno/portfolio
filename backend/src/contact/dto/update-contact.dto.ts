import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactStatus } from '../../generated/prisma/client';

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'Internal note cannot exceed 3000 characters.' })
  internalNote?: string;
}
