import { DocType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class SubmitKycDocumentDto {
  @IsEnum(DocType)
  docType: DocType;

  /** Metadata-only reference to an already-uploaded file; no upload handling in this build (see docs/QA.md §7). */
  @IsString()
  fileId: string;
}
