import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  itemName: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  /** Free-text billing period shown on the invoice PDF, e.g. "Jul 2026 – Jul 2027", "1 Year", "One-off". */
  @IsOptional()
  @IsString()
  period?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  /** Minor units (kobo). */
  @IsInt()
  @Min(0)
  unitAmountMinor: number;

  /** Waives this line — actualAmountMinor becomes 0, but unitAmountMinor is kept for the struck-through PDF display. */
  @IsOptional()
  @IsBoolean()
  isCancelled?: boolean;
}

export class CreateInvoiceDto {
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  currency: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Flat amount (minor units) subtracted from the items subtotal before VAT. */
  @IsOptional()
  @IsInt()
  @Min(0)
  discountMinor?: number;

  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  /** Percentage, e.g. 7.5. Required when vatEnabled is true. */
  @ValidateIf((dto: CreateInvoiceDto) => dto.vatEnabled === true)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
