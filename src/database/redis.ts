import { createClient, RedisClientType } from "redis";
import { redisConfig } from "../configs/databaseConfig";

let redisClient: RedisClientType | null = null;

async function connectToRedis(): Promise<RedisClientType> {
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

enum RedisKeyType {
    USER = "user",
    OTP = "otp",
    EMAIL = "email"
}

export const redisService = {
    getRedisKey(key: string, source: RedisKeyType): string {
        return `${source}:${key}`
    }
}

export { connectToRedis, redisClient };