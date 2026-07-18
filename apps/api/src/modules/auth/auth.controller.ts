import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmTotpDto, DisableTwoFactorDto, EnableEmailTwoFactorDto, VerifyTwoFactorDto } from './dto/two-factor.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ok } from '../../common/dto/service-result';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    return ok(result, 'Account created successfully');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return ok(result, 'requiresTwoFactor' in result ? 'Two-factor verification required' : 'Login successful');
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    const result = await this.authService.verifyTwoFactor(dto);
    return ok(result, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return ok(tokens, 'Token refreshed successfully');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return ok(result, result.message);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return ok(result, result.message);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    const result = await this.authService.changePassword(user.userId, dto);
    return ok(result, result.message);
  }

  @Post('2fa/totp/setup')
  @HttpCode(HttpStatus.OK)
  async setupTotp(@CurrentUser() user: AuthUser) {
    const result = await this.authService.setupTotp(user.userId);
    return ok(result, 'Scan the QR code (or enter the secret) in your authenticator app, then confirm with a code');
  }

  @Post('2fa/totp/enable')
  @HttpCode(HttpStatus.OK)
  async confirmTotp(@CurrentUser() user: AuthUser, @Body() dto: ConfirmTotpDto) {
    const result = await this.authService.confirmTotp(user.userId, dto.code);
    return ok(result, result.message);
  }

  @Post('2fa/email/request-code')
  @HttpCode(HttpStatus.OK)
  async requestEmailTwoFactorCode(@CurrentUser() user: AuthUser) {
    const result = await this.authService.requestEmailTwoFactorCode(user.userId);
    return ok(result, result.message);
  }

  @Post('2fa/email/enable')
  @HttpCode(HttpStatus.OK)
  async enableEmailTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: EnableEmailTwoFactorDto) {
    const result = await this.authService.enableEmailTwoFactor(user.userId, dto.code);
    return ok(result, result.message);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto) {
    const result = await this.authService.disableTwoFactor(user.userId, dto.password);
    return ok(result, result.message);
  }
}
