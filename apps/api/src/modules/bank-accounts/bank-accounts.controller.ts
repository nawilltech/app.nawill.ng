import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ok } from '../../common/dto/service-result';

@ApiTags('bank-accounts')
@ApiBearerAuth('bearer')
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get('banks')
  async listBanks() {
    const result = await this.bankAccountsService.listBanks();
    return ok(result, 'Banks retrieved successfully');
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBankAccountDto) {
    const result = await this.bankAccountsService.create(user.userId, dto);
    return ok(result, 'Bank account verified and added successfully');
  }

  @Get('me')
  async listMine(@CurrentUser() user: AuthUser) {
    const result = await this.bankAccountsService.listMine(user.userId);
    return ok(result, 'Bank accounts retrieved successfully');
  }

  @Patch(':id/set-default')
  async setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const result = await this.bankAccountsService.setDefault(user.userId, id);
    return ok(result, 'Default bank account updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.bankAccountsService.remove(user.userId, id);
    return ok(null, 'Bank account removed successfully');
  }
}
