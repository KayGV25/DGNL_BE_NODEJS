import dotenv from 'dotenv';

dotenv.config();

interface SQLConfig {
  host: string;
  user: string;
  password: string;
  port: string;
  database: string;
  url: string;
}

export const sqlConfig: SQLConfig = {
    url: process.env.POSTGRES_URL || 'jdbc:postgresql://localhost:5432/web_dgnl_db',
    user: process.env.POSTGRES_USER || 'dgnl',
    password: process.env.POSTGRES_PASSWORD || 'dgnl',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_NAME || 'web_dgnl_db',
    port: process.env.POSTGRES_PORT || '5432'
}

interface RedisConfig {
    host: string;
    port: number;
    timeout: number;
}

export const redisConfig: RedisConfig = {
    host: process.env.REDIS_URL || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    timeout: Number(process.env.REDIS_TIMEOUT) || 6000
}

export default 0;