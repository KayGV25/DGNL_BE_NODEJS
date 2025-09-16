// src/test/redis.test.ts
import {
    connectToRedis,
    redisService,
    RedisKeyType,
    RedisTTL,
    redisClient
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
        mockIsOpen = false; // reset for each test
        (mockConnect as any).shouldFail = false;
    });

    describe('connectToRedis', () => {
        it('should connect successfully', async () => {
            (mockConnect as any).shouldFail = false;

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
            // First connect to make it "open"
            await connectToRedis();
            mockConnect.mockClear();

            // Now simulate already connected
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
        });

        it('should throw NotFoundError when key is missing', async () => {
            mockGet.mockResolvedValueOnce(null);

            await expect(
                redisService.getRedisValue('missing', RedisKeyType.USER),
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ForbiddenError if client not open after reconnect', async () => {
            // Make connect succeed but leave isOpen = false
            (mockConnect as any).shouldFail = false;
            mockIsOpen = false;

            // Force connectToRedis to run but never flip isOpen
            mockConnect.mockImplementationOnce(() => {
                // Simulate successful connect, but client never opens
                return Promise.resolve().then(() => {
                    mockIsOpen = false;
                });
            });

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
        });

        it('should throw ForbiddenError on failure', async () => {
            mockSetEx.mockRejectedValueOnce(new Error('fail'));

            await expect(
                redisService.saveEmailActivationToken('t', 'e@example.com'),
            ).rejects.toThrow(ForbiddenError);
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
        });

        it('should throw ForbiddenError on failure', async () => {
            mockSetEx.mockRejectedValueOnce(new Error('fail'));

            await expect(
                redisService.saveOTP('999999', 'otp@example.com'),
            ).rejects.toThrow(ForbiddenError);
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
});
