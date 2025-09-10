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
        url: `redis://${redisConfig.host}:${redisConfig.port}`
    })

    client.on('error', (err) => console.error('Redis Client Error', err));
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
        await validateRedisClient()

        try {
            const token = await redisClient.get(this.getRedisKey(key, type));
            if (token) {
                return token;
            } else {
                throw new NotFoundError("No token found")
            }
            
        } catch {
            throw new ForbiddenError("Failed to get token in Redis")
        }
    },

    async saveEmailActivationToken(token: string, email: string): Promise<void> {
        await validateRedisClient()
        
        try {
            await Promise.all([
                redisClient.setEx(this.getRedisKey(email, RedisKeyType.EMAIL), RedisTTL.EMAIL, token),
                redisClient.setEx(this.getRedisKey(token, RedisKeyType.TOKEN), RedisTTL.EMAIL, email)
            ]);
        } catch {
            throw new ForbiddenError("Failed to set email token in Redis")
        }
    },

    async saveOTP(otp: string, email: string): Promise<void> {
        await validateRedisClient()
    
        try {
            await redisClient.setEx(this.getRedisKey(email, RedisKeyType.EMAIL), RedisTTL.OTP, otp);
        } catch {
            throw new ForbiddenError("Failed to set otp in Redis")
        }
    },
    async getEmailActivationToken(email: string): Promise<string> {
        return this.getRedisValue(email, RedisKeyType.EMAIL)
    },

    async getOTP(email: string): Promise<string> {
        return this,this.getRedisValue(email, RedisKeyType.OTP)
    }
}

export enum RedisTTL {
    EMAIL = 60 * 15, // 15 min
    OTP = 60 * 3 // 3 min
}