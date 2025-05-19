import { Controller, Post, Req, Res, Body,} from '@nestjs/common';
import { Response } from 'express';
import { AutoAgentService } from './auto-agent.service';
  
@Controller()
export class AutoAgentController {
  constructor(private readonly autoAgentService: AutoAgentService) {}

  @Post('generate')
  async generate(@Body() body: { prompt: string; context: string }) {
    const report = await this.autoAgentService.generateReport(body.prompt, body.context);
    return { report };
  }

  @Post('stream_generate')
  async streamGenerate(@Body('context') context: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    await this.autoAgentService.streamGenerate(context, (chunk: string) => {
      res.write(chunk); 
    }, () => {
      res.end(); 
    });
  }
}
  