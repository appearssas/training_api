import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificadoValidatorService } from '@/infrastructure/shared/services/certificado-validator.service';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

describe('CertificadoValidatorService', () => {
  let service: CertificadoValidatorService;
  let certificadoRepository: jest.Mocked<Repository<Certificado>>;
  let inscripcionRepository: jest.Mocked<Repository<Inscripcion>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificadoValidatorService,
        {
          provide: getRepositoryToken(Certificado),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CertificadoValidatorService>(CertificadoValidatorService);
    certificadoRepository = module.get(getRepositoryToken(Certificado));
    inscripcionRepository = module.get(getRepositoryToken(Inscripcion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasCertificados', () => {
    it('should return false if no inscripciones have certificados', async () => {
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = [];
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.hasCertificados(1);
      expect(result).toBe(false);
    });

    it('should return true if at least one inscripcion has certificados', async () => {
      const certificado = new Certificado();
      certificado.id = 1;
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = [certificado];
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.hasCertificados(1);
      expect(result).toBe(true);
    });

    it('should return false if no inscripciones exist', async () => {
      inscripcionRepository.find.mockResolvedValue([]);

      const result = await service.hasCertificados(1);
      expect(result).toBe(false);
    });
  });

  describe('getCertificadosCount', () => {
    it('should return 0 if no certificados exist', async () => {
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = [];
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.getCertificadosCount(1);
      expect(result).toBe(0);
    });

    it('should return correct count of certificados', async () => {
      const certificado1 = new Certificado();
      certificado1.id = 1;
      const certificado2 = new Certificado();
      certificado2.id = 2;
      const inscripcion1 = new Inscripcion();
      inscripcion1.id = 1;
      inscripcion1.certificados = [certificado1, certificado2];
      const inscripcion2 = new Inscripcion();
      inscripcion2.id = 2;
      inscripcion2.certificados = [certificado1];
      inscripcionRepository.find.mockResolvedValue([
        inscripcion1,
        inscripcion2,
      ]);

      const result = await service.getCertificadosCount(1);
      expect(result).toBe(3);
    });

    it('should handle null certificados array', async () => {
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = null as any;
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.getCertificadosCount(1);
      expect(result).toBe(0);
    });
  });

  describe('validateEstadoChange', () => {
    it('should return hasCertificados false and count 0 when no certificados exist', async () => {
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = [];
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.validateEstadoChange(1);
      expect(result).toEqual({ hasCertificados: false, count: 0 });
    });

    it('should return hasCertificados true and correct count when certificados exist', async () => {
      const certificado1 = new Certificado();
      certificado1.id = 1;
      const certificado2 = new Certificado();
      certificado2.id = 2;
      const inscripcion = new Inscripcion();
      inscripcion.id = 1;
      inscripcion.certificados = [certificado1, certificado2];
      inscripcionRepository.find.mockResolvedValue([inscripcion]);

      const result = await service.validateEstadoChange(1);
      expect(result).toEqual({ hasCertificados: true, count: 2 });
    });
  });
});
