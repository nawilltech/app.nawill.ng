import { TicketPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  ticketTypeId: string;

  @IsString()
  @MinLength(3)
  subject: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsString()
  @MinLength(1)
  message: string;
}
