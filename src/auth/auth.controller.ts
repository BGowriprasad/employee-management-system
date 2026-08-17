import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto/login.dto';
import { GetUser } from './get-user/get-user.decorator';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT access token' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  getProfile(@GetUser() user: unknown) {
    return user;
  }
}
