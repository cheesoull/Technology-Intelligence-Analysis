import { Module } from '@nestjs/common';
import { AutoAgentService } from './auto-agent.service';
import { AutoAgentController } from './auto-agent.controller';

@Module({
  providers: [AutoAgentService],
  controllers: [AutoAgentController],
})
export class AutoAgentModule {}
