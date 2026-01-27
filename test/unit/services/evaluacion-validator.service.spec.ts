import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { EvaluacionValidatorService } from '@/infrastructure/shared/services/evaluacion-validator.service';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

describe('EvaluacionValidatorService', () => {
  let service: EvaluacionValidatorService;
  let evaluacionRepository: jest.Mocked<Repository<Evaluacion>>;
  let capacitacionRepository: jest.Mocked<Repository<Capacitacion>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionValidatorService,
        {
          provide: getRepositoryToken(Evaluacion),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Capacitacion),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluacionValidatorService>(EvaluacionValidatorService);
    evaluacionRepository = module.get(getRepositoryToken(Evaluacion));
    capacitacionRepository = module.get(getRepositoryToken(Capacitacion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCapacitacionHasEvaluation', () => {
    it('should throw BadRequestException if no active evaluations exist', async () => {
      evaluacionRepository.find.mockResolvedValue([]);

      await expect(
        service.validateCapacitacionHasEvaluation(1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not throw if at least one active evaluation exists', async () => {
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      evaluacionRepository.find.mockResolvedValue([evaluacion]);

      await expect(
        service.validateCapacitacionHasEvaluation(1),
      ).resolves.not.toThrow();
    });
  });

  describe('validateEvaluationExists', () => {
    it('should throw BadRequestException if evaluation does not exist', async () => {
      evaluacionRepository.findOne.mockResolvedValue(null);

      await expect(service.validateEvaluationExists(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if evaluation is not active', async () => {
      // El servicio busca activo: true, así que si no está activa retornará null
      evaluacionRepository.findOne.mockResolvedValue(null);

      await expect(service.validateEvaluationExists(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return evaluation if it exists and is active', async () => {
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      evaluacionRepository.findOne.mockResolvedValue(evaluacion);

      const result = await service.validateEvaluationExists(1);
      expect(result).toBe(evaluacion);
    });
  });

  describe('validateEvaluationNotLinked', () => {
    it('should not throw if evaluation is not linked to any capacitacion', async () => {
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      (evaluacion as any).capacitacion = undefined;
      evaluacionRepository.findOne.mockResolvedValue(evaluacion);

      await expect(
        service.validateEvaluationNotLinked(1, 2),
      ).resolves.not.toThrow();
    });

    it('should not throw if evaluation is linked to the same capacitacion', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      evaluacion.capacitacion = capacitacion;
      evaluacionRepository.findOne.mockResolvedValue(evaluacion);

      await expect(
        service.validateEvaluationNotLinked(1, 1),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if evaluation is linked to different capacitacion', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 2;
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      evaluacion.capacitacion = capacitacion;
      evaluacionRepository.findOne.mockResolvedValue(evaluacion);

      await expect(
        service.validateEvaluationNotLinked(1, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateCanPublish', () => {
    it('should validate evaluation when trying to publish', async () => {
      const evaluacion = new Evaluacion();
      evaluacion.id = 1;
      evaluacion.activo = true;
      evaluacionRepository.find.mockResolvedValue([evaluacion]);

      await expect(
        service.validateCanPublish(1, EstadoCapacitacion.PUBLICADA),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if trying to publish without evaluation', async () => {
      evaluacionRepository.find.mockResolvedValue([]);

      await expect(
        service.validateCanPublish(1, EstadoCapacitacion.PUBLICADA),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not validate if new state is not PUBLICADA', async () => {
      await expect(
        service.validateCanPublish(1, EstadoCapacitacion.BORRADOR),
      ).resolves.not.toThrow();
    });
  });

  describe('getEvaluacionesByCapacitacion', () => {
    it('should return list of evaluations for capacitacion', async () => {
      const evaluaciones = [
        new Evaluacion(),
        new Evaluacion(),
      ];
      evaluacionRepository.find.mockResolvedValue(evaluaciones);

      const result = await service.getEvaluacionesByCapacitacion(1);
      expect(result).toBe(evaluaciones);
      expect(evaluacionRepository.find).toHaveBeenCalledWith({
        where: { capacitacion: { id: 1 } },
        relations: ['preguntas'],
        order: { orden: 'ASC', fechaCreacion: 'ASC' },
      });
    });
  });
});
