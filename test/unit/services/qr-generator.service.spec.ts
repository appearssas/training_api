import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrGeneratorService } from '@/infrastructure/shared/services/qr-generator.service';

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('QrGeneratorService', () => {
  let service: QrGeneratorService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrGeneratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QrGeneratorService>(QrGeneratorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateVerificationToken', () => {
    it('should generate a UUID v4 token', () => {
      const token = service.generateVerificationToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateVerificationToken();
      const token2 = service.generateVerificationToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateVerificationUrl', () => {
    it('should generate a relative URL', () => {
      const token = 'test-token-123';
      const url = service.generateVerificationUrl(token);
      expect(url).toBe('/verify/test-token-123');
    });
  });

  describe('generateVerificationUrlForQR', () => {
    it('should use FRONTEND_URL if configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue('https://example.com');
      const token = 'test-token-123';
      const url = service.generateVerificationUrlForQR(token);
      expect(url).toBe('https://example.com/#/verify/test-token-123');
    });

    it('should use PUBLIC_VERIFICATION_URL as fallback', () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          if (key === 'FRONTEND_URL') return undefined;
          if (key === 'PUBLIC_VERIFICATION_URL') return 'https://fallback.com';
          return undefined;
        });
      const token = 'test-token-123';
      const url = service.generateVerificationUrlForQR(token);
      expect(url).toBe('https://fallback.com/#/verify/test-token-123');
    });

    it('should use default URL when no config is provided', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const token = 'test-token-123';
      const url = service.generateVerificationUrlForQR(token);
      expect(url).toContain('/#/verify/test-token-123');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code as base64 data URL', async () => {
      const QRCode = require('qrcode');
      const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      QRCode.toDataURL.mockResolvedValue(mockDataUrl);

      const data = 'https://example.com/verify/token';
      const result = await service.generateQRCode(data);

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
    });

    it('should throw error if QR generation fails', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      await expect(service.generateQRCode('invalid')).rejects.toThrow(
        'Error al generar código QR: QR generation failed',
      );
    });
  });

  describe('generateVerificationHash', () => {
    it('should return the token as hash', () => {
      const token = 'test-token-123';
      const hash = service.generateVerificationHash(token);
      expect(hash).toBe(token);
    });
  });
});
