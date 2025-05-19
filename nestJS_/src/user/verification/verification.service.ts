import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VerificationCode } from "./verification.entity";

@Injectable()
export class VerificationService{
    constructor(
        @InjectRepository(VerificationCode)
        private readonly codeRepo: Repository<VerificationCode>
    ) {}

    generateCode():string{
        return '12345678';
    }

    async createCode(target: string, type: 'mobile' | 'email'){
        const code = this.generateCode();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 
        return await this.codeRepo.save({
            target, code, type,expiresAt,
            used: false
        });
    }

    async verifyCode(target: string, code: string, type: 'mobile' | 'email'){
        const record = await this.codeRepo.findOne({
            where: {target, code, type, used: false},
            order: {id: 'DESC'}
        });

        if(!record){
            throw new HttpException('验证码错误或不存在', HttpStatus.BAD_REQUEST);
        }
            
        if(record.expiresAt < new Date()){
            throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
        }

        await this.codeRepo.update(record.id, {used: true});
        return true;
    }
}

