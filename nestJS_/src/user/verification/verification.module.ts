import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VerificationCode } from "./verification.entity";
import { VerificationService } from "./verification.service";
import { VerificationController } from "./verification.controller";

@Module({
    imports: [TypeOrmModule.forFeature([VerificationCode])],
    providers: [VerificationService],
    exports: [VerificationService],
    controllers: [VerificationController]
})
export class VerificationModule{}