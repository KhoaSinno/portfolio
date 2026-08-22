import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertResumeDto {
  @IsObject()
  @IsNotEmpty()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  template?: string;
}
