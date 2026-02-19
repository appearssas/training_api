import { Test, TestingModule } from '@nestjs/testing';
import { ImageCompressionService } from '@/infrastructure/shared/services/image-compression.service';

// Mock sharp - simplificado para pruebas básicas
const mockSharpInstance = {
  metadata: jest
    .fn()
    .mockResolvedValue({ format: 'jpeg', width: 1000, height: 1000 }),
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(100)),
};

jest.mock('sharp', () => {
  return jest.fn(() => mockSharpInstance);
});

describe('ImageCompressionService', () => {
  let service: ImageCompressionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageCompressionService],
    }).compile();

    service = module.get<ImageCompressionService>(ImageCompressionService);

    // Reset mocks
    jest.clearAllMocks();
    mockSharpInstance.metadata.mockResolvedValue({
      format: 'jpeg',
      width: 1000,
      height: 1000,
    });
    mockSharpInstance.toBuffer.mockResolvedValue(Buffer.alloc(100));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compressImage', () => {
    it('should return original buffer if already under maxSizeKB and not aggressive', async () => {
      const smallBuffer = Buffer.alloc(100 * 1024); // 100KB
      const result = await service.compressImage(smallBuffer, 500, false);
      expect(result).toBe(smallBuffer);
    });
  });

  describe('compressMulterFile', () => {
    it('should throw error if file has no buffer', async () => {
      const file = {
        originalname: 'test.jpg',
        buffer: undefined,
      } as any;

      await expect(service.compressMulterFile(file)).rejects.toThrow(
        'El archivo no tiene buffer disponible',
      );
    });
  });

  describe('compressImageMax', () => {
    it('should call compressMulterFile with max compression', async () => {
      const buffer = Buffer.alloc(1000 * 1024);
      const file = {
        originalname: 'test.jpg',
        buffer,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const compressMulterFileSpy = jest.spyOn(service, 'compressMulterFile');
      compressMulterFileSpy.mockResolvedValue({
        buffer: Buffer.alloc(100),
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
      });

      await service.compressImageMax(file);
      expect(compressMulterFileSpy).toHaveBeenCalledWith(file, 0, true);
    });
  });

  describe('compressPDF', () => {
    it('should return original buffer for PDF', async () => {
      const buffer = Buffer.alloc(1000);
      const result = await service.compressPDF(buffer);
      expect(result).toBe(buffer);
    });
  });

  describe('compressGenericFile', () => {
    it('should return original buffer for non-compressible types', async () => {
      const buffer = Buffer.alloc(1000);
      const result = await service.compressGenericFile(buffer, 'image/jpeg');
      expect(result).toBe(buffer);
    });

    it('should compress text files', async () => {
      const buffer = Buffer.from(
        'This is a test text file content that should be compressible',
      );
      const result = await service.compressGenericFile(buffer, 'text/plain');
      // Compression should work for text files
      expect(result).toBeDefined();
    });
  });

  describe('compressFile', () => {
    it('should handle PDF files', async () => {
      const buffer = Buffer.alloc(1000);
      const file = {
        originalname: 'test.pdf',
        buffer,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = await service.compressFile(file);
      expect(result.compressed).toBe(false);
      expect(result.mimetype).toBe('application/pdf');
      expect(result.filename).toBe('test.pdf');
    });

    it('should handle generic compressible files', async () => {
      const buffer = Buffer.from('test content');
      const file = {
        originalname: 'test.txt',
        buffer,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const result = await service.compressFile(file);
      expect(result.filename).toContain('test.txt');
    });
  });
});
