import { SizeRange } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  headOffice?: string;

  @IsOptional()
  @IsEnum(SizeRange)
  sizeRange?: SizeRange;
}
