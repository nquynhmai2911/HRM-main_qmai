import { Test, TestingModule } from '@nestjs/testing';
import { PositionService } from './position.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PositionService', () => {
  let service: PositionService;

  beforeEach(async () => {
    const mockPrisma = {
      position: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PositionService>(PositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
