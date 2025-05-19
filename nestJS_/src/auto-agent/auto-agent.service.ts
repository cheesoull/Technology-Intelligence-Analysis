import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AutoAgentService {
  private readonly base: string;

  constructor(private readonly config: ConfigService) {
    this.base = this.config.get<string>('AUTOAGENT_API_URL') || 'http://127.0.0.1:8000';
  }

  async generateReport(prompt: string, context: string): Promise<string> {
    const res = await axios.post(`${this.base}/generate`, { prompt, context: context || '', });
    return res.data.report;
  }

  async streamGenerate(context: string, onChunk: (chunk: string) => void, onEnd: () => void) {
    const response = await axios.post(`${this.base}/stream_generate`, { context }, { responseType: 'stream' });
    response.data.on('data', (c: Buffer) => onChunk(c.toString()));
    response.data.on('end', onEnd);
  }
}

