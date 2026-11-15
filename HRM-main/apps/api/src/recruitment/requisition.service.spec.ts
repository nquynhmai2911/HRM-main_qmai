import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionService } from './requisition.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RequisitionService', () => {
  let service: RequisitionService;

  beforeEach(async () => {
    const mockPrisma = {
      jobRequisition: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequisitionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RequisitionService>(RequisitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
