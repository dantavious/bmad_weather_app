import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';

describe('CacheService', () => {
  let service: CacheService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'cache.ttlSeconds') return 600;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('get and set', () => {
    it('should store and retrieve cached value', async () => {
      const testData = { temperature: 72, humidity: 65 };
      await service.set('test-key', testData);

      const result = await service.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await service.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire cache after TTL', async () => {
      const testData = { temperature: 72 };
      await service.set('test-key', testData);

      const beforeExpiry = await service.get('test-key');
      expect(beforeExpiry).toEqual(testData);

      jest.advanceTimersByTime(600001);

      const afterExpiry = await service.get('test-key');
      expect(afterExpiry).toBeNull();
    });

    it('should overwrite existing cache entry', async () => {
      const firstData = { temperature: 72 };
      const secondData = { temperature: 75 };

      await service.set('test-key', firstData);
      await service.set('test-key', secondData);

      const result = await service.get('test-key');
      expect(result).toEqual(secondData);
    });
  });

  describe('delete', () => {
    it('should remove cached value', async () => {
      const testData = { temperature: 72 };
      await service.set('test-key', testData);

      await service.delete('test-key');

      const result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(service.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached values', async () => {
      await service.set('key1', { data: 1 });
      await service.set('key2', { data: 2 });
      await service.set('key3', { data: 3 });

      await service.clear();

      const result1 = await service.get('key1');
      const result2 = await service.get('key2');
      const result3 = await service.get('key3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('cleanup interval', () => {
    it('should automatically remove expired entries', async () => {
      await service.set('key1', { data: 1 });

      jest.advanceTimersByTime(300000);
      await service.set('key2', { data: 2 });

      jest.advanceTimersByTime(300001);

      jest.advanceTimersByTime(60000);

      const result1 = await service.get('key1');
      const result2 = await service.get('key2');

      expect(result1).toBeNull();
      expect(result2).not.toBeNull();
    });
  });
});
