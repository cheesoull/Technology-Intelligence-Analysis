import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto, MobileLoginDto } from './dto/login-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SanitizedUserDto } from '../user/dto/sanitized-user.dto'; 
import { MobileRegisterDto } from './dto/mobile-register.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerificationService } from './verification/verification.service';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService
  ) {}

  @Post('/register')
  @ApiOperation({ summary: '注册用户（邮箱或手机号）' })
  @ApiResponse({ 
    status: 201, 
    type: SanitizedUserDto,
    description: '成功创建用户' 
  })
  async register(@Body() body: MobileRegisterDto | EmailRegisterDto) {
    return this.userService.register(body);
  }

  @Post('/login')
  @ApiOperation({ summary: '用户登录（邮箱或手机号）' })
  @ApiResponse({ 
    status: 200, 
    type: SanitizedUserDto,
    description: '成功登录' 
  })
  async login(@Body() body: MobileLoginDto | EmailLoginDto) {
    return this.userService.login(body);
  }

  @Post('/forgot-password')
  @ApiOperation({ summary: '忘记密码-发送验证码' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.userService.findUserByCredential(dto.target);
    if (!user) {
      if (!user) throw new HttpException('用户名或密码错误', HttpStatus.NOT_FOUND);
    }

    await this.verificationService.createCode(
      dto.target,
      dto.type 
    );
    return {message: '验证码已发送'}
  }

  @Post('/reset-password')
  @ApiOperation({ summary: '重置密码' })
  async resetPassword(
    @Body() dto: ResetPasswordDto) {
    await this.verificationService.verifyCode(dto.target, dto.code, dto.type);
    return {message: '密码已重置'}
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.userService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '用户详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 204, description: '用户已删除' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
  }
}