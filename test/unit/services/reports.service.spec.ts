import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from '@/infrastructure/reports/reports.service';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let inscripcionRepository: jest.Mocked<Repository<Inscripcion>>;
  let certificadoRepository: jest.Mocked<Repository<Certificado>>;
  let capacitacionRepository: jest.Mocked<Repository<Capacitacion>>;

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    };

    inscripcionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    certificadoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    capacitacionRepository = {
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: inscripcionRepository,
        },
        {
          provide: getRepositoryToken(Certificado),
          useValue: certificadoRepository,
        },
        {
          provide: getRepositoryToken(Capacitacion),
          useValue: capacitacionRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return stats with filters', async () => {
      const mockQueryBuilder = inscripcionRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(0);

      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        courseId: 1,
        status: 'inscrito',
      };

      const result = await service.getStats(filters);

      expect(result).toBeDefined();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should return stats without filters', async () => {
      const mockQueryBuilder = inscripcionRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);
      (mockQueryBuilder.getCount as jest.Mock).mockResolvedValue(0);

      const filters = {};

      const result = await service.getStats(filters);

      expect(result).toBeDefined();
    });
  });

});
