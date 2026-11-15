import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionController } from './requisition.controller';
import { RequisitionService } from './requisition.service';

describe('RequisitionController', () => {
  let controller: RequisitionController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      submit: jest.fn(),
      processApproval: jest.fn(),
      publish: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitionController],
      providers: [
        { provide: RequisitionService, useValue: mockService }
      ]
    }).compile();

    controller = module.get<RequisitionController>(RequisitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
