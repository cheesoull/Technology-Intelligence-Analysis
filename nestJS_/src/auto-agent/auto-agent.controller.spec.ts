import { Test, TestingModule } from '@nestjs/testing';
import { AutoAgentController } from './auto-agent.controller';

describe('AutoAgentController', () => {
  let controller: AutoAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoAgentController],
    }).compile();

    controller = module.get<AutoAgentController>(AutoAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
