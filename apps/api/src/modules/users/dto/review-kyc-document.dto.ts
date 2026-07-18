import { ReviewStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewKycDocumentDto {
  @IsIn([ReviewStatus.approved, ReviewStatus.rejected])
  reviewStatus: ReviewStatus;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
