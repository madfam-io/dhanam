import {
  LoginDto,
  RegisterDto,
  AuthTokens,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@dhanam/shared';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpStatus,
  HttpCode,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuditService } from '@core/audit/audit.service';
import { ThrottleAuthGuard } from '@core/security/guards/throttle-auth.guard';

import { AuthService } from './auth.service';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';
import { DemoAuthService } from './demo-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GuestAuthService } from './guest-auth.service';
import { TotpService } from './totp.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private totpService: TotpService,
    private auditService: AuditService,
    private guestAuthService: GuestAuthService,
    private demoAuthService: DemoAuthService,
  ) {}

  @Post('register')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<{ tokens: AuthTokens }> {
    const tokens = await this.authService.register(dto);

    // Log successful registration
    await this.auditService.logEvent({
      action: 'USER_REGISTERED',
      resource: 'user',
      ipAddress: ip,
      userAgent,
      metadata: { email: dto.email },
      severity: 'medium',
    });

    return { tokens };
  }

  @Post('login')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 login attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<{ tokens: AuthTokens }> {
    try {
      const tokens = await this.authService.login(dto);

      // Log successful login (user ID will be retrieved by service)
      await this.auditService.logAuthSuccess(
        'pending', // Will be updated by auth service
        ip,
        userAgent
      );

      return { tokens };
    } catch (error) {
      // Log failed login attempt
      await this.auditService.logAuthFailure(dto.email, ip, userAgent);
      throw error;
    }
  }

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as guest for demo access' })
  @ApiResponse({
    status: 200,
    description: 'Guest session created successfully',
  })
  async guestLogin(
    @Body() body: { countryCode?: string },
    @Ip() _ip: string,
    @Headers('user-agent') _userAgent: string,
    @Headers('cf-ipcountry') cfCountry: string
  ): Promise<{
    tokens: AuthTokens;
    user: any;
    message: string;
  }> {
    const countryCode = body?.countryCode || cfCountry || undefined;
    const session = await this.guestAuthService.createGuestSession(countryCode);

    return {
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isGuest: true,
      },
      message: 'Welcome to Dhanam demo! This is a read-only guest session.',
    };
  }

  @Post('demo/login')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as a demo persona' })
  @ApiResponse({ status: 200, description: 'Demo persona session created' })
  async demoLogin(
    @Body() body: { persona: string; countryCode?: string },
    @Headers('cf-ipcountry') cfCountry: string,
  ): Promise<{
    tokens: AuthTokens;
    user: any;
    persona: string;
    message: string;
  }> {
    const countryCode = body?.countryCode || cfCountry || undefined;
    const result = await this.demoAuthService.loginAsPersona(body.persona, countryCode);

    return {
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isDemo: true,
        persona: result.persona,
      },
      persona: result.persona,
      message: `Welcome! You're exploring Dhanam as ${result.user.name}.`,
    };
  }

  @Post('demo/switch')
  @UseGuards(JwtAuthGuard, ThrottleAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch demo persona (requires existing demo JWT)' })
  @ApiResponse({ status: 200, description: 'Switched to new persona' })
  async demoSwitch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { persona: string },
  ): Promise<{
    tokens: AuthTokens;
    user: any;
    persona: string;
    message: string;
  }> {
    const result = await this.demoAuthService.switchPersona(user.userId, body.persona);

    return {
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isDemo: true,
        persona: result.persona,
      },
      persona: result.persona,
      message: `Switched to ${result.user.name}.`,
    };
  }

  @Get('demo/personas')
  @ApiOperation({ summary: 'List available demo personas' })
  @ApiResponse({ status: 200, description: 'Available personas' })
  async getPersonas() {
    return { personas: this.demoAuthService.getAvailablePersonas() };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto): Promise<{ tokens: AuthTokens }> {
    const tokens = await this.authService.refreshTokens(dto);
    return { tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logout successful' };
  }

  @Post('forgot-password')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Post('reset-password')
  @UseGuards(ThrottleAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 attempts per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Post('totp/setup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Setup TOTP 2FA' })
  @ApiResponse({ status: 201, description: 'TOTP setup initiated' })
  async setupTotp(@CurrentUser() user: AuthenticatedUser) {
    const setup = await this.totpService.setupTotp(user.userId, user.email);
    return setup;
  }

  @Post('totp/enable')
  @UseGuards(JwtAuthGuard, ThrottleAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({ summary: 'Enable TOTP 2FA' })
  @ApiResponse({ status: 200, description: 'TOTP enabled successfully' })
  async enableTotp(@CurrentUser() user: AuthenticatedUser, @Body() body: { token: string }) {
    await this.totpService.enableTotp(user.userId, body.token);
    return { message: 'TOTP enabled successfully' };
  }

  @Post('totp/disable')
  @UseGuards(JwtAuthGuard, ThrottleAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({ summary: 'Disable TOTP 2FA' })
  @ApiResponse({ status: 200, description: 'TOTP disabled successfully' })
  async disableTotp(@CurrentUser() user: AuthenticatedUser, @Body() body: { token: string }) {
    await this.totpService.disableTotp(user.userId, body.token);
    return { message: 'TOTP disabled successfully' };
  }

  @Post('totp/backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate TOTP backup codes' })
  @ApiResponse({ status: 201, description: 'Backup codes generated' })
  async generateBackupCodes(@CurrentUser() user: AuthenticatedUser) {
    const codes = this.totpService.generateBackupCodes();
    await this.totpService.storeBackupCodes(user.userId, codes);
    return { codes };
  }
}
