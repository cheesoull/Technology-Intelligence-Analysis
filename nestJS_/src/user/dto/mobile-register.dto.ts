import { IsMobilePhone, IsStrongPassword, IsString } from "class-validator";

export class MobileRegisterDto{
    @IsMobilePhone('zh-CN')
    mobile!: string;

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
    type: 'mobile' = 'mobile';
}