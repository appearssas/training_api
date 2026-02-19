import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@/infrastructure/shared/services/s3.service';
import { S3Client } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Client: any;

  beforeEach(async () => {
    mockS3Client = {
      send: jest.fn(),
    };

    (S3Client as jest.Mock) = jest.fn().mockImplementation(() => mockS3Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                AWS_S3_BUCKET_NAME: 'test-bucket',
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_CLOUDFRONT_URL: 'https://cdn.example.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if bucket name is not configured', () => {
    try {
      new S3Service({
        get: jest.fn(() => undefined),
      } as any);
      fail('Should have thrown an error');
    } catch (error) {
      expect((error as Error).message).toContain(
        'AWS_S3_BUCKET_NAME debe estar configurado',
      );
    }
  });

  describe('uploadFile', () => {
    it('should upload file to S3 and return CloudFront URL', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      PutObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockResolvedValue({});

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const url = await service.uploadFile(file, 'materials');

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(url).toContain('cdn.example.com');
      expect(url).toContain('materials');
    });

    it('should return S3 URL if CloudFront is not configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        if (key === 'AWS_REGION') return 'us-east-1';
        if (key === 'AWS_CLOUDFRONT_URL') return undefined;
        return 'test-value';
      });

      const newModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();
      const newService = newModule.get<S3Service>(S3Service);

      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      PutObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockResolvedValue({});

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const url = await newService.uploadFile(file, 'materials');
      expect(url).toContain('amazonaws.com');
    });

    it('should throw error if upload fails', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      PutObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockRejectedValue(new Error('Upload failed'));

      const file = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(service.uploadFile(file, 'materials')).rejects.toThrow(
        'Error al subir archivo a S3',
      );
    });
  });

  describe('uploadBuffer', () => {
    it('should upload buffer to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      PutObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockResolvedValue({});

      const buffer = Buffer.from('test content');
      const url = await service.uploadBuffer(
        buffer,
        'test.pdf',
        'certificates',
      );

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(url).toContain('certificates');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      HeadObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockResolvedValue({});

      const exists = await service.fileExists('materials/test.jpg');
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      HeadObjectCommand.mockReturnValue(mockCommand);
      const error = new Error('Not found');
      (error as any).name = 'NotFound';
      mockS3Client.send.mockRejectedValue(error);

      const exists = await service.fileExists('materials/nonexistent.jpg');
      expect(exists).toBe(false);
    });
  });

  describe('getFile', () => {
    it('should get file from S3', async () => {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      GetObjectCommand.mockReturnValue(mockCommand);
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('chunk1');
          yield Buffer.from('chunk2');
        },
      };
      mockS3Client.send.mockResolvedValue({ Body: mockStream });

      const buffer = await service.getFile('materials/test.jpg');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toContain('chunk1');
    });

    it('should throw error if file is empty', async () => {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      GetObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockResolvedValue({ Body: null });

      await expect(service.getFile('materials/empty.jpg')).rejects.toThrow(
        'El archivo está vacío',
      );
    });

    it('should throw error if get fails', async () => {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const mockCommand = {};
      GetObjectCommand.mockReturnValue(mockCommand);
      mockS3Client.send.mockRejectedValue(new Error('Get failed'));

      await expect(service.getFile('materials/test.jpg')).rejects.toThrow(
        'Error al obtener archivo de S3',
      );
    });
  });
});
