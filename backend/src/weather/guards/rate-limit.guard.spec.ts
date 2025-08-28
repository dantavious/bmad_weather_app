import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitGuard } from './rate-limit.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'rateLimit.windowMs') return 60000;
      if (key === 'rateLimit.maxRequests') return 60;
      return defaultValue;
    }),
  };

  const createMockExecutionContext = (ip: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          connection: { remoteAddress: ip },
          socket: { remoteAddress: ip },
        }),
        getResponse: () => ({}),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getType: () => 'http',
    }) as ExecutionContext;

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('canActivate', () => {
    it('should allow requests below rate limit', () => {
      const context = createMockExecutionContext('192.168.1.1');

      for (let i = 0; i < 59; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const context = createMockExecutionContext('192.168.1.1');

      for (let i = 0; i < 60; i++) {
        guard.canActivate(context);
      }

      expect(() => guard.canActivate(context)).toThrow(
        new HttpException(
          'Too many requests, please try again later',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should track different IPs separately', () => {
      const context1 = createMockExecutionContext('192.168.1.1');
      const context2 = createMockExecutionContext('192.168.1.2');

      for (let i = 0; i < 60; i++) {
        guard.canActivate(context1);
      }

      expect(() => guard.canActivate(context1)).toThrow(HttpException);

      expect(guard.canActivate(context2)).toBe(true);
    });

    it('should reset rate limit after time window', () => {
      const context = createMockExecutionContext('192.168.1.1');

      for (let i = 0; i < 60; i++) {
        guard.canActivate(context);
      }

      expect(() => guard.canActivate(context)).toThrow(HttpException);

      jest.advanceTimersByTime(60001);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle x-forwarded-for header', () => {
      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
            connection: { remoteAddress: '192.168.1.1' },
            socket: { remoteAddress: '192.168.1.1' },
          }),
          getResponse: () => ({}),
        }),
        getClass: () => ({}),
        getHandler: () => ({}),
        getArgs: () => [],
        getArgByIndex: () => ({}),
        switchToRpc: () => ({}) as any,
        switchToWs: () => ({}) as any,
        getType: () => 'http',
      } as ExecutionContext;

      for (let i = 0; i < 60; i++) {
        guard.canActivate(context);
      }

      expect(() => guard.canActivate(context)).toThrow(HttpException);
    });

    it('should handle unknown IP gracefully', () => {
      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            connection: {},
            socket: {},
          }),
          getResponse: () => ({}),
        }),
        getClass: () => ({}),
        getHandler: () => ({}),
        getArgs: () => [],
        getArgByIndex: () => ({}),
        switchToRpc: () => ({}) as any,
        switchToWs: () => ({}) as any,
        getType: () => 'http',
      } as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('cleanup interval', () => {
    it('should remove old request records', () => {
      const context = createMockExecutionContext('192.168.1.1');

      for (let i = 0; i < 30; i++) {
        guard.canActivate(context);
      }

      jest.advanceTimersByTime(60001);

      jest.advanceTimersByTime(60000);

      for (let i = 0; i < 60; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }
    });
  });
});
