// src/test/redis.test.ts
import {
  connectToRedis,
  redisService,
  RedisKeyType,
  RedisTTL,
} from '../../database/redis';
import {
  ConnectionError,
  ForbiddenError,
  NotFoundError,
} from '../../middlewares/errorHandler';

// Track connection state
let mockIsOpen = false;

// Mocks
const mockGet = jest.fn();
const mockSetEx = jest.fn();
const mockDel = jest.fn();
const mockQuit = jest.fn();

// Mock connect with success/fail toggle
const mockConnect = jest.fn().mockImplementation(() => {
  if ((mockConnect as any).shouldFail) {
    return Promise.reject(new Error('fail'));
  }
  mockIsOpen = true;
  return Promise.resolve();
});

// Mock redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: mockConnect,
    get: mockGet,
    setEx: mockSetEx,
    del: mockDel,
    quit: mockQuit,
    on: jest.fn(),
    get isOpen() {
      return mockIsOpen;
    },
  })),
}));

describe('Redis Service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockIsOpen = false;
    (mockConnect as any).shouldFail = false;
  });

  describe('connectToRedis', () => {
    it('should connect successfully', async () => {
      const client = await connectToRedis();

      expect(client).toBeDefined();
      expect(mockConnect).toHaveBeenCalled();
      expect(mockIsOpen).toBe(true);
    });

    it('should throw ConnectionError when connection fails', async () => {
      (mockConnect as any).shouldFail = true;

      await expect(connectToRedis()).rejects.toThrow(ConnectionError);
    });

    it('should return existing client if already connected', async () => {
      await connectToRedis();
      mockConnect.mockClear();

      const client = await connectToRedis();

      expect(client).toBeDefined();
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe('redisService.getRedisKey', () => {
    it('should format key correctly', () => {
      const key = redisService.getRedisKey('123', RedisKeyType.USER);
      expect(key).toBe('user:123');
    });
  });

  describe('redisService.getRedisValue', () => {
    it('should return value when found', async () => {
      mockGet.mockResolvedValueOnce('value');

      const value = await redisService.getRedisValue('test', RedisKeyType.USER);
      expect(value).toBe('value');
      expect(mockGet).toHaveBeenCalledWith('user:test');
      expect(mockQuit).toHaveBeenCalled();
    });

    it('should throw NotFoundError when key is missing', async () => {
      mockGet.mockResolvedValueOnce(null);

      await expect(
        redisService.getRedisValue('missing', RedisKeyType.USER),
      ).rejects.toThrow(NotFoundError);
      expect(mockQuit).toHaveBeenCalled();
    });

    it('should throw ForbiddenError if client not open after reconnect', async () => {
      mockIsOpen = false;

      mockConnect.mockImplementationOnce(() =>
        Promise.resolve().then(() => {
          mockIsOpen = false;
        }),
      );

      await expect(
        redisService.getRedisValue('any', RedisKeyType.USER),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('redisService.saveEmailActivationToken', () => {
    it('should save token', async () => {
      mockSetEx.mockResolvedValueOnce('OK');

      await redisService.saveEmailActivationToken(
        'token123',
        'test@example.com',
      );

      expect(mockSetEx).toHaveBeenCalledWith(
        'email:test@example.com',
        RedisTTL.EMAIL,
        'token123',
      );
      expect(mockQuit).toHaveBeenCalled();
    });

    it('should throw ForbiddenError on failure', async () => {
      mockSetEx.mockRejectedValueOnce(new Error('fail'));

      await expect(
        redisService.saveEmailActivationToken('t', 'e@example.com'),
      ).rejects.toThrow(ForbiddenError);
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('redisService.saveOTP', () => {
    it('should save OTP', async () => {
      mockSetEx.mockResolvedValueOnce('OK');

      await redisService.saveOTP('123456', 'otp@example.com');

      expect(mockSetEx).toHaveBeenCalledWith(
        'otp:otp@example.com',
        RedisTTL.OTP,
        '123456',
      );
      expect(mockQuit).toHaveBeenCalled();
    });

    it('should throw ForbiddenError on failure', async () => {
      mockSetEx.mockRejectedValueOnce(new Error('fail'));

      await expect(
        redisService.saveOTP('999999', 'otp@example.com'),
      ).rejects.toThrow(ForbiddenError);
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('redisService.getEmailActivationToken', () => {
    it('should delegate to getRedisValue', async () => {
      mockGet.mockResolvedValueOnce('tok');

      const result =
        await redisService.getEmailActivationToken('mail@example.com');
      expect(result).toBe('tok');
      expect(mockGet).toHaveBeenCalledWith('email:mail@example.com');
    });
  });

  describe('redisService.getOTP', () => {
    it('should delegate to getRedisValue', async () => {
      mockGet.mockResolvedValueOnce('111111');

      const result = await redisService.getOTP('otp@example.com');
      expect(result).toBe('111111');
      expect(mockGet).toHaveBeenCalledWith('otp:otp@example.com');
    });
  });

  describe('redisService.deleteRedisValue', () => {
    it('should delete key successfully', async () => {
      mockDel.mockResolvedValueOnce(1);

      await redisService.deleteRedisValue('abc', RedisKeyType.USER);

      expect(mockDel).toHaveBeenCalledWith('user:abc');
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('redisService.deleteEmailActivationToken', () => {
    it('should call deleteRedisValue with email namespace', async () => {
      mockDel.mockResolvedValueOnce(1);

      await redisService.deleteEmailActivationToken('mail@example.com');

      expect(mockDel).toHaveBeenCalledWith('email:mail@example.com');
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('redisService.deleteOTP', () => {
    it('should call deleteRedisValue with otp namespace', async () => {
      mockDel.mockResolvedValueOnce(1);

      await redisService.deleteOTP('otp@example.com');

      expect(mockDel).toHaveBeenCalledWith('otp:otp@example.com');
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('redisService.getRedisValue (error branches)', () => {
    it('should throw ForbiddenError when connectToRedis throws ConnectionError', async () => {
      // force connectToRedis to throw ConnectionError
      (mockConnect as any).shouldFail = true;

      await expect(
        redisService.getRedisValue('any', RedisKeyType.USER),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when redisClient.get throws unexpected error', async () => {
      mockGet.mockRejectedValueOnce(new Error('boom'));

      await expect(
        redisService.getRedisValue('x', RedisKeyType.USER),
      ).rejects.toThrow(ForbiddenError);

      expect(mockQuit).toHaveBeenCalled();
    });
  });
});
