export interface SQLConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  database: string;
  url: string;
}

export interface RedisConfig {
    host: string;
    port: number;
    timeout: number;
    user: string;
    password: string;
    scheme: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  url: string;
}

export interface EmailConfig {
    host: string;
    port: number;
    email: string;
    password: string;
}