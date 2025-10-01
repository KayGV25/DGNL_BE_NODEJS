import dotenv from 'dotenv';
import { ServerConfig } from '../interfaces/config';

dotenv.config();

const serverConfig: ServerConfig = {
  port: Number(process.env.PORT) || 80,
  nodeEnv: process.env.NODE_ENV || 'development',
  url: process.env.URL || 'http://localhost:80'
};

export const isDev = serverConfig.nodeEnv === 'development'

export default serverConfig;