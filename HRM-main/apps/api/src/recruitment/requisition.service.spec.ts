import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionService } from './requisition.service';

describe('RequisitionService', () => {
  let service: RequisitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequisitionService],
    }).compile();

    service = module.get<RequisitionService>(RequisitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
