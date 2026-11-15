import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockPrisma = {
      employee: {
        findFirst: jest.fn().mockResolvedValue({ id: 'emp-1' }),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        { provide: PerformanceService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ]
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
