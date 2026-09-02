import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ContactStatus, ContactTopic } from '../../generated/prisma/client';

export class ListContactsDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactTopic)
  topic?: ContactTopic;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query is too long.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
