import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionController } from './requisition.controller';

describe('RequisitionController', () => {
  let controller: RequisitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitionController],
    }).compile();

    controller = module.get<RequisitionController>(RequisitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
