import jwt, { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { securityConfig } from '../configs/securityConfig';
import { JWTPayload } from '../interfaces/jwt';
import { securityServiceInterface } from '../interfaces/services/security';
import { redisService } from '../database/redis';
import { RoleType } from '../models/identity';

const SALT_ROUNDS = 10
export const securityService: securityServiceInterface = {
    async hashPassword(password: string): Promise<string> {
        try {
            // bcrypt.hash handles salt generation and iteration internally based on saltRounds
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            return hash;
        } catch (error) {
            console.error('Bcrypt hashing failed:', error);
            throw error;
        }
    },

    async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword);
            return isMatch;
        } catch (error) {
            console.error('Bcrypt verification failed:', error);
            return false;
        }
    },

    isJWTTokenStillValid(token: string): boolean {
        try {
            this.decodeJWTToken(token);
            return true;
        } catch {
            return false;
        }
    },

    generateJWTToken(userId: string, roleId: RoleType): string {
        const payload: JWTPayload = {
            payload: { userId, roleId }
        };
        
        const token = jwt.sign(payload, securityConfig.jwtSecret, {
            expiresIn: securityConfig.expiresIn,
            subject: userId,
            algorithm: 'HS256',
        })

        return token
    },

    // will throw {JsonWebTokenError | TokenExpiredError | NotBeforeError} if faild to decode token
    decodeJWTToken(token: string): JWTPayload | null {
        try {
        const decoded = jwt.verify(token, securityConfig.jwtSecret, { algorithms: ['HS256'] }) as JWTPayload;
        return decoded;
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                console.error("JWT verification failed: TokenExpiredError ->", err.message);
            } else if (err instanceof NotBeforeError) {
                console.error("JWT verification failed: NotBeforeError ->", err.message);
            } else if (err instanceof JsonWebTokenError) {
                console.error("JWT verification failed: JsonWebTokenError ->", err.message);
            } else {
                console.error("JWT verification failed: Unknown error ->", err);
            }
            throw err; // rethrow so caller can still handle
        }
    },

    generateEmailActivationToken(): string {
        try {
            // Generate a 16-byte buffer of cryptographically secure random data
            const buffer = crypto.randomBytes(16)
            // Convert the buffer to a hexadecimal string and return it
            const token = buffer.toString('hex');
            return token;
        } catch (err) {
            console.error("Failed to generate activation token:", err);
            throw new Error("Token generation failed");
        }
    },

    generateOTP(): string {
        const otp = crypto.randomInt(100000, 1000000)
        return otp.toString()
    },

    async checkEmailActivationCode(email: string, activationCode: string): Promise<boolean> {
        try {
            const cacheActivationCode = await redisService.getEmailActivationToken(email)
            if(cacheActivationCode !== activationCode) {
                return false
            }
            return true
        } catch {
            return false
        }
    },

    async checkOTP(email: string, otp: string): Promise<boolean> {
        try {
            const cacheOtp = await redisService.getOTP(email)
            if(cacheOtp !== otp) {
                return false
            }
            return true
        } catch {
            return false
        }
    }
}