import jwt, { NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { securityConfig } from '../configs/securityConfig';
import { UnauthorizedError } from '../middlewares/errorHandler';

interface securityService {
    hashPassword(password: string): Promise<string>
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>
    isJWTTokenStillValid(token: string): boolean
    generateJWTToken(userId: string): string
    decodeJWTToken(token: string): JWTPayload
    getDeviceFingerprint(req: Request): string

}

interface JWTPayload {
    userId: string 
}

const SALT_ROUNDS = 10
export const securityService: securityService = {
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
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedError("Token has expired")
            }
            if (error instanceof NotBeforeError) {
                throw new UnauthorizedError("Token is not valid")
            }
        } finally {
            return false;
        }
    },

    generateJWTToken(userId: string): string {
        const payload: JWTPayload = { userId };
        
        const token = jwt.sign(payload, securityConfig.jwtSecret, {
            expiresIn: securityConfig.expiresIn,
            notBefore: Date.now(),
            subject: userId,
            algorithm: 'HS256',
        })

        return token
    },

    // will throw {JsonWebTokenError | TokenExpiredError | NotBeforeError} if faild to decode token
    decodeJWTToken(token: string): JWTPayload {
        const decoded = jwt.verify(token, securityConfig.jwtSecret) as JWTPayload;
        return decoded;
    },

    getDeviceFingerprint(req: Request): string {
        return ""
    }
}