import { IsNotEmpty, IsString, IsIn } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class SendCodeDto{
    @ApiProperty({
        description: '手机号或邮箱地址',
        example: '13530307078或user@example.com',
    })
    @IsNotEmpty({message: '目标不能为空'})
    @IsString({message: '目标必须是字符串'})
    target!: string;

    @ApiProperty({
        description: '验证类型',
        enum: ['mobile', 'email'],
        example: 'mobile',
    })
    @IsIn(['mobile', 'email'], {message: '类型必须是mobile或email'})
    type!: 'mobile' | 'email';
}