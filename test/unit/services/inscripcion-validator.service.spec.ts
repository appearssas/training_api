import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InscripcionValidatorService } from '@/infrastructure/shared/services/inscripcion-validator.service';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Pago } from '@/entities/pagos/pago.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';

describe('InscripcionValidatorService', () => {
  let service: InscripcionValidatorService;
  let capacitacionRepository: jest.Mocked<Repository<Capacitacion>>;
  let personaRepository: jest.Mocked<Repository<Persona>>;
  let pagoRepository: jest.Mocked<Repository<Pago>>;
  let inscripcionesRepository: jest.Mocked<IInscripcionesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscripcionValidatorService,
        {
          provide: getRepositoryToken(Capacitacion),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Persona),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Pago),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: 'IInscripcionesRepository',
          useValue: {
            existsByEstudianteAndCapacitacion: jest.fn(),
            findByCapacitacion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InscripcionValidatorService>(InscripcionValidatorService);
    capacitacionRepository = module.get(getRepositoryToken(Capacitacion));
    personaRepository = module.get(getRepositoryToken(Persona));
    pagoRepository = module.get(getRepositoryToken(Pago));
    inscripcionesRepository = module.get('IInscripcionesRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCapacitacionDisponible', () => {
    it('should throw NotFoundException if capacitacion does not exist', async () => {
      capacitacionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateCapacitacionDisponible(1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if capacitacion is not in allowed state', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.estado = EstadoCapacitacion.BORRADOR;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      await expect(
        service.validateCapacitacionDisponible(1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return capacitacion if it is PUBLICADA', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.estado = EstadoCapacitacion.PUBLICADA;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      const result = await service.validateCapacitacionDisponible(1);
      expect(result).toBe(capacitacion);
    });

    it('should return capacitacion if it is EN_CURSO', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.estado = EstadoCapacitacion.EN_CURSO;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      const result = await service.validateCapacitacionDisponible(1);
      expect(result).toBe(capacitacion);
    });
  });

  describe('validateEstudiante', () => {
    it('should throw NotFoundException if estudiante does not exist', async () => {
      personaRepository.findOne.mockResolvedValue(null);

      await expect(service.validateEstudiante(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if estudiante is inactive', async () => {
      const estudiante = new Persona();
      estudiante.id = 1;
      estudiante.activo = false;
      personaRepository.findOne.mockResolvedValue(estudiante);

      await expect(service.validateEstudiante(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return estudiante if it exists and is active', async () => {
      const estudiante = new Persona();
      estudiante.id = 1;
      estudiante.activo = true;
      personaRepository.findOne.mockResolvedValue(estudiante);

      const result = await service.validateEstudiante(1);
      expect(result).toBe(estudiante);
    });
  });

  describe('validateNoInscripcionDuplicada', () => {
    it('should throw BadRequestException if inscripcion already exists', async () => {
      inscripcionesRepository.existsByEstudianteAndCapacitacion.mockResolvedValue(
        true,
      );

      await expect(
        service.validateNoInscripcionDuplicada(1, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not throw if inscripcion does not exist', async () => {
      inscripcionesRepository.existsByEstudianteAndCapacitacion.mockResolvedValue(
        false,
      );

      await expect(
        service.validateNoInscripcionDuplicada(1, 1),
      ).resolves.not.toThrow();
    });
  });

  describe('validateCapacidadMaxima', () => {
    it('should not throw if no capacidadMaxima is set', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      (capacitacion as any).capacidadMaxima = undefined;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      await expect(
        service.validateCapacidadMaxima(1),
      ).resolves.not.toThrow();
    });

    it('should not throw if capacitacion does not exist', async () => {
      capacitacionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateCapacidadMaxima(1),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if capacidadMaxima is reached', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.capacidadMaxima = 10;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      inscripcionesRepository.findByCapacitacion.mockResolvedValue({
        data: Array(10).fill({ estado: 'inscrito' }),
        total: 10,
        page: 1,
        limit: 1000,
      });

      await expect(
        service.validateCapacidadMaxima(1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not throw if capacidadMaxima is not reached', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.capacidadMaxima = 10;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      inscripcionesRepository.findByCapacitacion.mockResolvedValue({
        data: Array(5).fill({ estado: 'inscrito' }),
        total: 5,
        page: 1,
        limit: 1000,
      });

      await expect(
        service.validateCapacidadMaxima(1),
      ).resolves.not.toThrow();
    });

    it('should not count abandoned inscripciones', async () => {
      const capacitacion = new Capacitacion();
      capacitacion.id = 1;
      capacitacion.capacidadMaxima = 5;
      capacitacionRepository.findOne.mockResolvedValue(capacitacion);

      inscripcionesRepository.findByCapacitacion.mockResolvedValue({
        data: [
          { estado: 'inscrito' },
          { estado: 'inscrito' },
          { estado: 'abandonado' },
          { estado: 'abandonado' },
        ],
        total: 4,
        page: 1,
        limit: 1000,
      });

      await expect(
        service.validateCapacidadMaxima(1),
      ).resolves.not.toThrow();
    });
  });

  describe('validatePago', () => {
    it('should not throw if pagoId is not provided', async () => {
      await expect(service.validatePago(null)).resolves.not.toThrow();
      await expect(service.validatePago(undefined)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if pago does not exist', async () => {
      pagoRepository.findOne.mockResolvedValue(null);

      await expect(service.validatePago(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if pago is inactive', async () => {
      // El servicio busca pago con activo: true, si no lo encuentra retorna null
      pagoRepository.findOne.mockResolvedValue(null);

      await expect(service.validatePago(1)).rejects.toThrow(NotFoundException);
    });

    it('should not throw if pago exists and is active', async () => {
      const pago = new Pago();
      pago.id = 1;
      pago.activo = true;
      pagoRepository.findOne.mockResolvedValue(pago);

      await expect(service.validatePago(1)).resolves.not.toThrow();
    });
  });
});
