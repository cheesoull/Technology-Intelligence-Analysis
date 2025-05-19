import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  target!: string; // 手机号或邮箱
  
  @IsNotEmpty()
  @IsString()
  type!: 'mobile' | 'email'; 
}
