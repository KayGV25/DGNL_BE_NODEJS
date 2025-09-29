import dotenv from 'dotenv';
import { RedisConfig, SQLConfig } from '../interfaces/config';

dotenv.config();

export const sqlConfig: SQLConfig = {
    url: process.env.POSTGRES_URL || 'jdbc:postgresql://localhost:5432/web_dgnl_db',
    user: process.env.POSTGRES_USER || 'dgnl',
    password: process.env.POSTGRES_PASSWORD || 'dgnl',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_NAME || 'web_dgnl_db',
    port: Number(process.env.POSTGRES_PORT) || 5432
}

export const redisConfig: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    timeout: Number(process.env.REDIS_TIMEOUT) || 6000,
    user: process.env.REDIS_USER || 'default',
    password: process.env.REDIS_PASSWORD || 'password',
    scheme: process.env.REDIS_SCHEME || 'redis'
}

export default 0;