import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { QrGeneratorService } from '@/infrastructure/shared/services/qr-generator.service';

// Mock PDFDocument
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const mockDoc = {
      page: { width: 792, height: 612 },
      on: jest.fn(),
      image: jest.fn(),
      font: jest.fn(),
      fontSize: jest.fn(),
      text: jest.fn(),
      end: jest.fn(),
    };
    return mockDoc;
  });
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn((path: string) => {
    // Retornar true para rutas de assets
    if (path.includes('assets') || path.includes('svg')) return true;
    return false;
  }),
  readFileSync: jest.fn((path: string, encoding?: string) => {
    if (encoding === 'utf-8') {
      return '<svg>mock svg content</svg>';
    }
    return Buffer.from('mock svg content');
  }),
  readdirSync: jest.fn(() => []),
}));

// Mock svg-to-pdfkit
// Este módulo se requiere dinámicamente, así que lo marcamos como virtual
// para evitar que Jest intente resolverlo desde node_modules
jest.mock(
  'svg-to-pdfkit',
  () => {
    return jest.fn(
      (doc: any, svg: string, x: number, y: number, options?: any) => {
        // Mock de la función SVGtoPDF - no hace nada en el test
        return;
      },
    );
  },
  { virtual: true },
);

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;
  let qrGeneratorService: jest.Mocked<QrGeneratorService>;

  beforeEach(async () => {
    qrGeneratorService = {
      generateQRCode: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
      generateVerificationUrlForQR: jest
        .fn()
        .mockReturnValue('https://example.com/verify/token'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfGeneratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: QrGeneratorService,
          useValue: qrGeneratorService,
        },
      ],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCertificate', () => {
    it('should throw error if inscripcion data is incomplete', async () => {
      const certificado = {
        id: 1,
        inscripcion: null,
      } as any;

      await expect(service.generateCertificate(certificado)).rejects.toThrow(
        'Datos incompletos',
      );
    });

    // Nota: La prueba completa de generación de certificado requiere mocks complejos
    // de archivos del sistema y PDFDocument. Por simplicidad, solo probamos el caso de error.
    // Para pruebas más completas, se recomienda usar pruebas de integración.
  });
});
