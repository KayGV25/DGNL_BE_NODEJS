import { RoleType } from "../../models/identity"
import { JWTPayload } from "../jwt"

export interface securityServiceInterface {
    hashPassword(password: string): Promise<string>
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>
    isJWTTokenStillValid(token: string): boolean
    generateJWTToken(userId: string, roleId: RoleType): string
    decodeJWTToken(token: string): JWTPayload | null
    generateEmailActivationToken(): string
    generateOTP(): string
    checkEmailActivationCode(email: string, activationCode: string): Promise<boolean>
    checkOTP(email: string, otp: string): Promise<boolean>
}