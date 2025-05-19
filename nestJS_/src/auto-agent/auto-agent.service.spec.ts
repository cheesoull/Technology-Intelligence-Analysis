import { Test, TestingModule } from '@nestjs/testing';
import { AutoAgentService } from './auto-agent.service';

describe('AutoAgentService', () => {
  let service: AutoAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoAgentService],
    }).compile();

    service = module.get<AutoAgentService>(AutoAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
