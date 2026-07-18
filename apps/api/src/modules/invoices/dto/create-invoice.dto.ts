import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  itemName: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  /** Minor units (kobo). */
  @IsInt()
  @Min(0)
  unitAmountMinor: number;
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
