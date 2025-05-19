import { IsMobilePhone, IsString, IsEmail } from 'class-validator';

export class MobileLoginDto {
  @IsMobilePhone('zh-CN')
  mobile!: string;

  @IsString()
  code!: string;
}

export class EmailLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
