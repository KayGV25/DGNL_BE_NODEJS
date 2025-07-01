interface JWTConfig {
    jwtSecret: string;
    expiresIn: number;
}

export const securityConfig: JWTConfig = {
    jwtSecret: process.env.JWT_SECRET || 'demo_jwt_secret',
    expiresIn: Number(process.env.JWT_EXPIERE) || 1000 * (60 * 60 * 24 * 365) // 1 year
}