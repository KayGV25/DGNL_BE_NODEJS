import crypto from 'crypto';

interface securityService {
    hashPassword(password: string): string
    isJWTTokenStillValid(token: string): boolean
    generateJWTToken(): string
    getDeviceFingerprint(req: Request): string

}

export const securityService: securityService = {
    hashPassword(password: string): string {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        return hash;
    },

    isJWTTokenStillValid(token: string): boolean {
        return false
    },

    generateJWTToken(): string {
        return ""
    },

    getDeviceFingerprint(req: Request): string {
        return ""
    }
}