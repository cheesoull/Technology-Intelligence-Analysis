import { IsNotEmpty, IsIn, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty()
    target!: string;
  
    @IsIn(['email', 'mobile'])
    type!: 'email' | 'mobile';
  
    @IsNotEmpty()
    code!: string;

    @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
  newPassword!: string; 
}