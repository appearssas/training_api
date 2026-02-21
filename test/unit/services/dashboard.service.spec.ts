import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from '@/infrastructure/dashboard/dashboard.service';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Resena } from '@/entities/resenas/resena.entity';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types/capacitacion.types';
import { EstadoInscripcion } from '@/entities/inscripcion/types/inscripcion.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let capacitacionRepository: jest.Mocked<Repository<Capacitacion>>;
  let inscripcionRepository: jest.Mocked<Repository<Inscripcion>>;
  let certificadoRepository: jest.Mocked<Repository<Certificado>>;
  let evaluacionRepository: jest.Mocked<Repository<Evaluacion>>;
  let resenaRepository: jest.Mocked<Repository<Resena>>;
  let intentoRepository: jest.Mocked<Repository<IntentoEvaluacion>>;

  beforeEach(async () => {
    const createMockQueryBuilder = () => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        count: '0',
        total: '0',
        completed: '0',
        avg: '0',
      }),
      getRawMany: jest.fn().mockResolvedValue([]),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const mockQueryBuilder = createMockQueryBuilder();

    capacitacionRepository = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    inscripcionRepository = {
      createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
      count: jest.fn(),
      find: jest.fn(),
    } as any;

    certificadoRepository = {
      count: jest.fn(),
      find: jest.fn(),
    } as any;

    evaluacionRepository = {
      count: jest.fn(),
      find: jest.fn(),
    } as any;

    resenaRepository = {
      createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    } as any;

    intentoRepository = {
      count: jest.fn(),
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Capacitacion),
          useValue: capacitacionRepository,
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: inscripcionRepository,
        },
        {
          provide: getRepositoryToken(Certificado),
          useValue: certificadoRepository,
        },
        {
          provide: getRepositoryToken(Evaluacion),
          useValue: evaluacionRepository,
        },
        {
          provide: getRepositoryToken(Resena),
          useValue: resenaRepository,
        },
        {
          provide: getRepositoryToken(IntentoEvaluacion),
          useValue: intentoRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return complete stats object', async () => {
      // Mock all repository methods that getStats calls
      capacitacionRepository.count.mockResolvedValue(10);
      inscripcionRepository.count.mockResolvedValue(50);
      certificadoRepository.count.mockResolvedValue(25);
      evaluacionRepository.count.mockResolvedValue(5);
      capacitacionRepository.find.mockResolvedValue([]);
      // Mock certificados con relaciones para evitar errores de acceso a propiedades
      certificadoRepository.find.mockResolvedValue([
        {
          id: 1,
          fechaVencimiento: new Date(),
          inscripcion: {
            capacitacion: { titulo: 'Test Course' },
            estudiante: { nombres: 'Test', apellidos: 'User' },
          },
        },
      ] as any);
      inscripcionRepository.find.mockResolvedValue([]);
      intentoRepository.find.mockResolvedValue([]);

      // Mock query builder results for various methods
      const inscripcionQB = inscripcionRepository.createQueryBuilder();
      (inscripcionQB.getRawOne as jest.Mock).mockResolvedValue({
        count: '100',
        total: '100',
        completed: '50',
        avg: '4.5',
      });

      const resenaQB = resenaRepository.createQueryBuilder();
      (resenaQB.getRawMany as jest.Mock).mockResolvedValue([]);

      const mockUser = {
        id: 1,
        rolPrincipal: { codigo: 'ADMIN' },
        persona: { empresaId: null },
      } as any;
      const result = await service.getStats(mockUser);

      expect(result).toBeDefined();
      expect(result.kpis).toBeDefined();
      expect(result.kpis.activeCourses).toBeDefined();
      expect(result.kpis.enrolledUsers).toBeDefined();
      expect(result.kpis.completionRate).toBeDefined();
      expect(result.kpis.avgSatisfaction).toBeDefined();
      expect(result.kpis.certificatesIssued).toBeDefined();
      expect(result.kpis.evaluationsPending).toBeDefined();
      expect(result.upcomingTrainings).toBeDefined();
      expect(result.areaProgress).toBeDefined();
      expect(result.completionTrend).toBeDefined();
      expect(result.notifications).toBeDefined();
      expect(result.recentActivity).toBeDefined();
    });
  });
});
