import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateResumeProfileDto {
  @IsString()
  @Length(1, 100, { message: 'Title must be between 1 and 100 characters.' })
  title!: string;

  @IsOptional()
  @IsString()
  @Length(2, 60, { message: 'Slug must be between 2 and 60 characters.' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must only contain lowercase alphanumeric characters and hyphens (e.g. ai-engineer).',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  sourceResumeId?: string;
}

export class UpdateResumeMetaDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Title must be between 1 and 100 characters.' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60, { message: 'Slug must be between 2 and 60 characters.' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must only contain lowercase alphanumeric characters and hyphens (e.g. ai-engineer).',
  })
  slug?: string;
}
