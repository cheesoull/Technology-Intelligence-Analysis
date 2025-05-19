import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PaperModule } from './paper/paper.module';
import { ChatModule } from './chat/chat.module';
import { ReportModule } from './report/report.module';
import { ConfigModule } from '@nestjs/config';
import { BlogModule } from './blog/blog.module';
import { AutoAgentModule } from './auto-agent/auto-agent.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationModule } from './user/verification/verification.module';
import { Paper } from './paper/paper.entity';
import { Blog } from './blog/blog.entity';
import { Report } from './report/report.entity';
import { AutoAgentService } from './auto-agent/auto-agent.service';

@Module({
  imports: [UserModule, AutoAgentModule, VerificationModule, ChatModule, ReportModule, PaperModule, BlogModule, ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: 'nestjs',
    synchronize: true,
    retryDelay: 500,
    retryAttempts: 10,
    entities:[ Paper, Blog, Report],
    autoLoadEntities:true,
  },)],
  controllers: [AppController],
  providers: [AppService, AutoAgentService],
})
export class AppModule {}
