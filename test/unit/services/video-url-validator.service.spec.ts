import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VideoUrlValidatorService } from '@/infrastructure/shared/services/video-url-validator.service';

describe('VideoUrlValidatorService', () => {
  let service: VideoUrlValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoUrlValidatorService],
    }).compile();

    service = module.get<VideoUrlValidatorService>(VideoUrlValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isYouTubeUrl', () => {
    it('should return true for standard YouTube URLs', () => {
      expect(service.isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(service.isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(service.isYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for shortened YouTube URLs', () => {
      expect(service.isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(service.isYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for YouTube embed URLs', () => {
      expect(service.isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(service.isYouTubeUrl('https://example.com')).toBe(false);
      expect(service.isYouTubeUrl('not-a-url')).toBe(false);
      expect(service.isYouTubeUrl('')).toBe(false);
    });
  });

  describe('isGoogleDriveUrl', () => {
    it('should return true for Google Drive file URLs', () => {
      expect(
        service.isGoogleDriveUrl(
          'https://drive.google.com/file/d/1ABC123xyz/view',
        ),
      ).toBe(true);
      expect(
        service.isGoogleDriveUrl('https://drive.google.com/open?id=1ABC123xyz'),
      ).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(service.isGoogleDriveUrl('https://example.com')).toBe(false);
      expect(service.isGoogleDriveUrl('')).toBe(false);
    });
  });

  describe('isOneDriveUrl', () => {
    it('should return true for OneDrive URLs', () => {
      expect(
        service.isOneDriveUrl('https://onedrive.live.com/redir?resid=123'),
      ).toBe(true);
      expect(service.isOneDriveUrl('https://1drv.ms/u/s!123')).toBe(true);
      expect(
        service.isOneDriveUrl('https://example.sharepoint.com/file'),
      ).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(service.isOneDriveUrl('https://example.com')).toBe(false);
      expect(service.isOneDriveUrl('')).toBe(false);
    });
  });

  describe('isValidVideoUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(
        service.isValidVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe(true);
    });

    it('should return true for valid Google Drive URLs', () => {
      expect(
        service.isValidVideoUrl(
          'https://drive.google.com/file/d/1ABC123xyz/view',
        ),
      ).toBe(true);
    });

    it('should return true for valid OneDrive URLs', () => {
      expect(
        service.isValidVideoUrl('https://onedrive.live.com/redir?resid=123'),
      ).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(service.isValidVideoUrl('https://example.com')).toBe(false);
      expect(service.isValidVideoUrl('')).toBe(false);
      expect(service.isValidVideoUrl(null as any)).toBe(false);
    });
  });

  describe('validateVideoUrl', () => {
    it('should not throw for valid URLs', () => {
      expect(() => {
        service.validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }).not.toThrow();
    });

    it('should throw BadRequestException for invalid URLs', () => {
      expect(() => {
        service.validateVideoUrl('https://example.com');
      }).toThrow(BadRequestException);
    });
  });

  describe('generateYouTubeIframe', () => {
    it('should generate iframe URL from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const iframe = service.generateYouTubeIframe(url);
      expect(iframe).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should generate iframe URL from shortened YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const iframe = service.generateYouTubeIframe(url);
      expect(iframe).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should throw BadRequestException if video ID cannot be extracted', () => {
      expect(() => {
        service.generateYouTubeIframe('https://youtube.com/invalid');
      }).toThrow(BadRequestException);
    });
  });

  describe('generateGoogleDriveIframe', () => {
    it('should generate iframe URL from Google Drive URL', () => {
      const url = 'https://drive.google.com/file/d/1ABC123xyz/view';
      const iframe = service.generateGoogleDriveIframe(url);
      expect(iframe).toBe('https://drive.google.com/file/d/1ABC123xyz/preview');
    });

    it('should throw BadRequestException if file ID cannot be extracted', () => {
      expect(() => {
        service.generateGoogleDriveIframe('https://drive.google.com/invalid');
      }).toThrow(BadRequestException);
    });
  });

  describe('generateOneDriveIframe', () => {
    it('should convert onedrive.live.com URL to embed format', () => {
      const url = 'https://onedrive.live.com/redir?resid=123';
      const iframe = service.generateOneDriveIframe(url);
      expect(iframe).toBe('https://onedrive.live.com/embed?resid=123');
    });

    it('should throw BadRequestException for short OneDrive URLs', () => {
      expect(() => {
        service.generateOneDriveIframe('https://1drv.ms/u/s!123');
      }).toThrow(BadRequestException);
    });

    it('should return SharePoint URL as-is', () => {
      const url = 'https://example.sharepoint.com/file';
      const iframe = service.generateOneDriveIframe(url);
      expect(iframe).toBe(url);
    });
  });

  describe('generateVideoIframe', () => {
    it('should generate YouTube iframe for YouTube URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const iframe = service.generateVideoIframe(url);
      expect(iframe).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should generate Google Drive iframe for Google Drive URLs', () => {
      const url = 'https://drive.google.com/file/d/1ABC123xyz/view';
      const iframe = service.generateVideoIframe(url);
      expect(iframe).toBe('https://drive.google.com/file/d/1ABC123xyz/preview');
    });

    it('should generate OneDrive iframe for OneDrive URLs', () => {
      const url = 'https://onedrive.live.com/redir?resid=123';
      const iframe = service.generateVideoIframe(url);
      expect(iframe).toBe('https://onedrive.live.com/embed?resid=123');
    });

    it('should throw BadRequestException for unsupported URLs', () => {
      expect(() => {
        service.generateVideoIframe('https://example.com');
      }).toThrow(BadRequestException);
    });
  });
});
