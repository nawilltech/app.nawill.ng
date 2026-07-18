import { PartialType } from '@nestjs/mapped-types';
import { ProjectPhase } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

/** Every CreateProjectDto field, made optional — plus `phase`, which only exists post-creation. */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsEnum(ProjectPhase)
  phase?: ProjectPhase;
}
