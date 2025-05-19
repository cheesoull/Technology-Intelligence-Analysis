import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paper } from '../paper/paper.entity';
import { Blog } from '../blog/blog.entity';
import { Report } from '../report/report.entity';
import { AutoAgentService } from '../auto-agent/auto-agent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Paper, Blog, Report])],
  controllers: [ChatController],
  providers: [ChatService, AutoAgentService]
})
export class ChatModule {}
