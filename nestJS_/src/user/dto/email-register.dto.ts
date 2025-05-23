import { IsEmail, IsStrongPassword, IsString } from "class-validator";

export class EmailRegisterDto{
    @IsEmail()
    email!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    password!: string;

    @IsString()
    code!: string;
    type: 'email' = 'email';
}