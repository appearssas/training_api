import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from '@/infrastructure/shared/services/storage.service';
import { S3Service } from '@/infrastructure/shared/services/s3.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  let s3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    s3Service = {
      uploadFile: jest.fn(),
      uploadBuffer: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                STORAGE_PATH: '/test/storage',
                AWS_S3_BUCKET_NAME: undefined,
                AWS_ACCESS_KEY_ID: undefined,
                AWS_SECRET_ACCESS_KEY: undefined,
              };
              return config[key];
            }),
          },
        },
        {
          provide: S3Service,
          useValue: s3Service,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveFile', () => {
    it('should throw BadRequestException if file exceeds max size', async () => {
      const file = {
        originalname: 'large.jpg',
        buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB
        size: 11 * 1024 * 1024,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(
        service.saveFile(file, ['image'], 'materials'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file type is not allowed', async () => {
      const file = {
        originalname: 'test.exe',
        buffer: Buffer.alloc(100),
        size: 100,
        mimetype: 'application/x-msdownload',
      } as Express.Multer.File;

      await expect(
        service.saveFile(file, ['image'], 'materials'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save file locally when S3 is not configured', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.alloc(100),
        size: 100,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const url = await service.saveFile(file, ['image'], 'materials');
      expect(url).toContain('/storage/materials/');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should use S3 when configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        if (key === 'AWS_ACCESS_KEY_ID') return 'test-key';
        if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
        return undefined;
      });

      s3Service.uploadFile.mockResolvedValue('https://cdn.example.com/materials/test.jpg');

      const newModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: S3Service,
            useValue: s3Service,
          },
        ],
      }).compile();
      const newService = newModule.get<StorageService>(StorageService);

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.alloc(100),
        size: 100,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const url = await newService.saveFile(file, ['image'], 'materials');
      expect(url).toBe('https://cdn.example.com/materials/test.jpg');
      expect(s3Service.uploadFile).toHaveBeenCalled();
    });
  });

  describe('saveImageOrPdf', () => {
    it('should save image file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.alloc(100),
        size: 100,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const url = await service.saveImageOrPdf(file, 'materials');
      expect(url).toContain('/storage/materials/');
    });

    it('should save PDF file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const file = {
        originalname: 'test.pdf',
        buffer: Buffer.alloc(100),
        size: 100,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const url = await service.saveImageOrPdf(file, 'certificates');
      expect(url).toContain('/storage/certificates/');
    });
  });

  describe('saveBuffer', () => {
    it('should save buffer locally when S3 is not configured', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const buffer = Buffer.from('test content');
      const url = await service.saveBuffer(buffer, 'test.pdf', 'certificates');

      expect(url).toContain('/storage/certificates/');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should use S3 when configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        if (key === 'AWS_ACCESS_KEY_ID') return 'test-key';
        if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
        return undefined;
      });

      s3Service.uploadBuffer.mockResolvedValue('https://cdn.example.com/certificates/test.pdf');

      const newModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: S3Service,
            useValue: s3Service,
          },
        ],
      }).compile();
      const newService = newModule.get<StorageService>(StorageService);

      const buffer = Buffer.from('test content');
      const url = await newService.saveBuffer(buffer, 'test.pdf', 'certificates');

      expect(url).toBe('https://cdn.example.com/certificates/test.pdf');
      expect(s3Service.uploadBuffer).toHaveBeenCalled();
    });
  });

  describe('getFilePath', () => {
    it('should return full path from relative path', () => {
      const filePath = service.getFilePath('materials/test.jpg');
      expect(filePath).toContain('materials');
      expect(filePath).toContain('test.jpg');
    });

    it('should remove /storage/ prefix if present', () => {
      const filePath = service.getFilePath('/storage/materials/test.jpg');
      expect(filePath).not.toContain('/storage/');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const exists = service.fileExists('materials/test.jpg');
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const exists = service.fileExists('materials/nonexistent.jpg');
      expect(exists).toBe(false);
    });
  });
});
