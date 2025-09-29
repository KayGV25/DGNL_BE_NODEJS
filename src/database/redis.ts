import { createClient, RedisClientType } from "redis";
import { redisConfig } from "../configs/databaseConfig";
import { ConnectionError, ForbiddenError, NotFoundError } from "../middlewares/errorHandler";

export let redisClient: RedisClientType;

export async function connectToRedis(): Promise<RedisClientType> {
    if (redisClient && redisClient.isOpen) {
        console.log("Redis client is already connected");
        return redisClient;
    }

    const client = createClient({
        url: `${redisConfig.scheme}://${redisConfig.user}:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
    })

    client.on('error', () => console.error('Redis Client Error'));
    client.on('connect', () => console.log('Redis client connected'));
    client.on('reconnecting', () => console.log('Redis client reconnecting...'));
    client.on('end', () => console.log('Redis client connection ended'));

    try {
        await client.connect();
        redisClient = client as RedisClientType;
        console.log('Successfully connected to Redis!');
        return redisClient;
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        throw new ConnectionError("Failed to connect to Redis")
    }
}

export enum RedisKeyType {
    USER = "user",
    OTP = "otp",
    EMAIL = "email",
    TOKEN = "token"
}

async function validateRedisClient() {
    if (!redisClient || !redisClient.isOpen) {
        try {
            await connectToRedis();
        } catch (err) {
            if (err instanceof ConnectionError) {
                throw new ForbiddenError("Redis service is unavailable.");
            }
        }
    }

    if (!redisClient || !redisClient.isOpen) {
        throw new ForbiddenError("Redis client is not open after reconnection attempt.");
    }
}

export const redisService = {
    getRedisKey(key: string, source: RedisKeyType): string {
        return `${source}:${key}`
    },

    async getRedisValue(key: string, type: RedisKeyType): Promise<string> {
        await validateRedisClient();

        try {
            const value = await redisClient.get(this.getRedisKey(key, type));

            if (value === null) {
                throw new NotFoundError(`${type.toUpperCase()} not found for key: ${key}`);
            }

            return value;
        } catch (err) {
            if (err instanceof NotFoundError) {
                throw err; // preserve so callers know it's missing
            }
            throw new ForbiddenError("Redis service failed to fetch value");
        } finally {
            redisClient.quit()
        }
    },

    async deleteRedisValue(key: string, type: RedisKeyType): Promise<void> {
        await validateRedisClient();

        try {
            await redisClient.del(this.getRedisKey(key, type))
        } finally {
            redisClient.quit()
        }
    },

    async saveEmailActivationToken(token: string, email: string): Promise<void> {
        await validateRedisClient()
        
        try {
            await redisClient.setEx(this.getRedisKey(email, RedisKeyType.EMAIL), RedisTTL.EMAIL, token)
        } catch {
            throw new ForbiddenError("Failed to set email token in Redis")
        } finally {
            redisClient.quit()
        }
    },

    async saveOTP(otp: string, email: string): Promise<void> {
        await validateRedisClient()
    
        try {
            await redisClient.setEx(this.getRedisKey(email, RedisKeyType.OTP), RedisTTL.OTP, otp);
        } catch {
            throw new ForbiddenError("Failed to set otp in Redis")
        } finally {
            redisClient.quit()
        }
    },
    async getEmailActivationToken(email: string): Promise<string> {
        return await this.getRedisValue(email, RedisKeyType.EMAIL)
    },

    async getOTP(email: string): Promise<string> {
        return await this.getRedisValue(email, RedisKeyType.OTP);
    },

    async deleteEmailActivationToken(email: string): Promise<void> {
        await this.deleteRedisValue(email, RedisKeyType.EMAIL)
    },

    async deleteOTP(email: string): Promise<void> {
        await this.deleteRedisValue(email, RedisKeyType.OTP)
    }
}

export enum RedisTTL {
    EMAIL = 60 * 15, // 15 min
    OTP = 60 * 3 // 3 min
}