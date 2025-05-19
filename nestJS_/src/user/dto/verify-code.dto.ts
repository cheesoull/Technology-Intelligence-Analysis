import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({ description: '手机号或邮箱地址', example: '13800138000' })
  @IsNotEmpty({ message: '目标不能为空' })
  @IsString({ message: '目标必须是字符串' })
  target!: string;

  @ApiProperty({ description: '验证码', example: '12345678' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须是字符串' })
  code!: string;

  @ApiProperty({
    description: '验证类型',
    enum: ['mobile', 'email'],
    example: 'mobile',
  })
  @IsIn(['mobile', 'email'], { message: '类型必须是 mobile 或 email' })
  type!: 'mobile' | 'email';
}