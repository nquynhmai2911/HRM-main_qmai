import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth, GetUser } from './decorators';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'LOGIN',
    description: 'Public endpoint to login and get the Access Token',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async login(@Res() response, @Body() loginUserDto: LoginUserDto) {
    const data = await this.authService.loginUser(loginUserDto);
    response.status(HttpStatus.OK).send(data);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'REFRESH TOKEN',
    description: 'Refresh the access token using a refresh token',
  })
  async refreshToken(@Body('refreshToken') token: string) {
    return this.authService.refreshWithToken(token);
  }

  @Get('me')
  @ApiOperation({
    summary: 'GET ME',
    description: 'Get current user profile',
  })
  @ApiBearerAuth()
  @Auth()
  async getMe(@GetUser() user: any) {
    // user comes from jwt strategy
    return user;
  }
  
  @Post('logout')
  @ApiOperation({
    summary: 'LOGOUT',
  })
  @ApiBearerAuth()
  @Auth()
  async logout(@GetUser() user: any) {
    return this.authService.logout(user.id);
  }
}
