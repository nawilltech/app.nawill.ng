import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WalletAdjustmentDto } from './dto/wallet-adjustment.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('wallets')
@ApiBearerAuth('bearer')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  async getMyWallet(@CurrentUser() user: AuthUser) {
    const result = await this.walletsService.getOrCreateWallet(user.userId);
    return ok(result, 'Wallet retrieved successfully');
  }

  @Get('me/transactions')
  async listMyTransactions(@CurrentUser() user: AuthUser, @Query() query: CursorPaginationDto) {
    const page = await this.walletsService.listTransactions(user.userId, query);
    return paginatedFrom(page, query.limit, 'Wallet transactions retrieved successfully');
  }

  @Post('me/fund')
  async fund(@CurrentUser() user: AuthUser, @Body() dto: FundWalletDto, @IdempotencyKey() idempotencyKey: string) {
    const result = await this.walletsService.fund(user.userId, dto, idempotencyKey);
    return ok(result, 'Wallet funding initiated successfully');
  }

  @Roles('staff', 'admin')
  @Get(':userId')
  async getWalletForStaff(@Param('userId') userId: string) {
    const result = await this.walletsService.getWalletForStaff(userId);
    return ok(result, 'Wallet retrieved successfully');
  }

  @Roles('staff', 'admin')
  @Post(':userId/adjustments')
  async recordAdjustment(
    @Param('userId') userId: string,
    @CurrentUser() staff: AuthUser,
    @Body() dto: WalletAdjustmentDto,
  ) {
    const result = await this.walletsService.recordAdjustment(userId, staff.userId, dto);
    return ok(result, 'Wallet adjustment recorded successfully');
  }
}
