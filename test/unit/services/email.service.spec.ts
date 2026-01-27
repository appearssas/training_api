import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@/infrastructure/email/email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => {
  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    verify: jest.fn().mockResolvedValue(true),
  };

  return {
    createTransport: jest.fn().mockReturnValue(mockTransporter),
  };
});

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      verify: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(mockTransporter as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('enviarCredencialesTemporales', () => {
    it('should send temporary credentials email', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'EMAIL_ENABLED') return 'true';
        if (key === 'EMAIL_HOST') return 'smtp.example.com';
        if (key === 'EMAIL_PORT') return 587;
        if (key === 'EMAIL_SECURE') return 'false';
        if (key === 'EMAIL_USER') return 'user@example.com';
        if (key === 'EMAIL_PASSWORD') return 'password';
        return undefined;
      });

      const newModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();
      const newService = newModule.get<EmailService>(EmailService);

      await newService.enviarCredencialesTemporales(
        'user@example.com',
        'John Doe',
        'username123',
        'tempPassword123',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
