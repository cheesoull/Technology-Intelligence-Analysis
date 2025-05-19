import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationModule } from '../user/verification/verification.module';

@Module({
  imports: [VerificationModule, TypeOrmModule.forFeature([User])],
  exports: [VerificationModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
