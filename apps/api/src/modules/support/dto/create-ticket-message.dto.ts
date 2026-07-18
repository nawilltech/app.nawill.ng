import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTicketMessageDto {
  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}
