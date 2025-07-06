import { createClient, RedisClientType } from "redis";
import { redisConfig } from "../configs/databaseConfig";
import { ForbiddenError } from "../middlewares/errorHandler";

export let redisClient: RedisClientType | null = null;

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
        process.exit(1);
    }
}

export enum RedisKeyType {
    USER = "user",
    OTP = "otp",
    EMAIL = "email",
    TOKEN = "token"
}

export const redisService = {
    getRedisKey(key: string, source: RedisKeyType): string {
        return `${source}:${key}`
    },

    async saveEmailActivationToken(token: string, email: string): Promise<void> {
        if (redisClient && redisClient.isOpen) {
            try {
                await Promise.all([
                    redisClient.setEx(this.getRedisKey(email, RedisKeyType.EMAIL), RedisTTL.EMAIL, token),
                    redisClient.setEx(this.getRedisKey(token, RedisKeyType.TOKEN), RedisTTL.EMAIL, email)
                ]);
            } catch {
                throw new ForbiddenError("Failed to set email token in Redis")
            }
        } else {
            throw new ForbiddenError("Redis client is not open")
        }
    },

    async saveOTP(otp: string, email: string): Promise<void> {
        if (redisClient && redisClient.isOpen) {
            try {
                await redisClient.setEx(this.getRedisKey(email, RedisKeyType.EMAIL), RedisTTL.OTP, otp);
            } catch {
                throw new ForbiddenError("Failed to set otp in Redis")
            }
        } else {
            throw new ForbiddenError("Redis client is not open")
        }
    }
}

export enum RedisTTL {
    EMAIL = 60 * 15, // 15 min
    OTP = 60 * 3 // 3 min
}