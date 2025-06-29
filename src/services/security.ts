import bcrypt from 'bcrypt';

interface securityService {
    hashPassword(password: string): Promise<string>
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>
    isJWTTokenStillValid(token: string): boolean
    generateJWTToken(): string
    getDeviceFingerprint(req: Request): string

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
        return false
    },

    generateJWTToken(): string {
        return ""
    },

    getDeviceFingerprint(req: Request): string {
        return ""
    }
}