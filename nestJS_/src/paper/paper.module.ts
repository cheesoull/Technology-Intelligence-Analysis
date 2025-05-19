import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paper } from './paper.entity';
import { PaperService } from './paper.service';
import { PaperController } from './paper.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paper])],
  providers: [PaperService],
  controllers: [PaperController]
})
export class PaperModule {}
