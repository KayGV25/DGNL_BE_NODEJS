import { JWTConfig } from "../interfaces/jwt";

export const securityConfig: JWTConfig = {
    jwtSecret: process.env.JWT_SECRET || 'demo_jwt_secret',
    expiresIn: 1000 * (60 * 60 * 24 * 30) // 1 month
}