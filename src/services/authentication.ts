import { redisService } from "../database/redis";
import { JWTTokenResponse } from "../interfaces/jwt";
import { ValidateResponse } from "../interfaces/security";
import { LoginRequest, RegisterRequest, UserCredentials } from "../interfaces/user";
import { AccountNotEnableError, ConflictError, CustomAppError, NotFoundError, TokenExpiredError, UnauthorizedError } from "../middlewares/errorHandler";
import { RoleType } from "../models/identity";
import { tokenRepository } from "../repositories/token";
import { userRepository } from "../repositories/user";
import { emailService } from "./email";
import { securityService } from "./security";

export const authenticationService = {
    async login(user: LoginRequest): Promise<JWTTokenResponse | string | null> {
        const userCredentials: UserCredentials | null = await userRepository.getUserCredentialsByUsernameOrEmail(user.emailOrusername);

        if (!userCredentials) {
            throw new NotFoundError("User not found");
        }
        
        const isPasswordValid = await securityService.verifyPassword(user.password, userCredentials.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid password");
        }

        if (!userCredentials.is_enable) {
            const activationToken = securityService.generateEmailActivationToken()
            redisService.saveEmailActivationToken(activationToken, userCredentials.email)

            emailService.sendActivateAccountEmail(userCredentials.email, activationToken, userCredentials.id)
            throw new AccountNotEnableError("Account not enabled please check email")
        }

        // Check for an existing token
        if (userCredentials.token === null || !securityService.isJWTTokenStillValid(userCredentials.token)) {
            const otp = securityService.generateOTP()
            redisService.saveOTP(otp, userCredentials.email)
            emailService.sendOTPEmail(userCredentials.email, otp)
            return userCredentials.id
        }

        return { 
            user_id: userCredentials.id,
            token: userCredentials.token
        };
    },

    async register(user: RegisterRequest) {
        const emailExists = await userRepository.checkIfEmailExists(user.email);
        if (emailExists) {
            throw new ConflictError("Email address is already in use.");
        }
        const newUser: RegisterRequest = {
            ...user,
            password: await securityService.hashPassword(user.password)
        }

        const userId = await userRepository.createUser(newUser);

        const activationToken = securityService.generateEmailActivationToken()
        redisService.saveEmailActivationToken(activationToken, user.email)

        emailService.sendActivateAccountEmail(user.email, activationToken, userId)
    },

    async validateEmail(activationToken: string, email: string, userId: string): Promise<ValidateResponse | null> {
        if (await securityService.checkEmailActivationCode(email, activationToken)) {
            const userRole = await userRepository.getUserRole(userId) ?? RoleType.USER
            const jwtToken = securityService.generateJWTToken(userId, userRole)
            await userRepository.enableAccountAndSetJWTToken(userId, jwtToken)
            await redisService.deleteEmailActivationToken(email)
            return { jwt_token: jwtToken }
        }

        throw new TokenExpiredError("Invalid or Expired activation code")
    },

    async validateOTP(otp: string, email: string, userId: string): Promise<ValidateResponse | null> {
        if (await securityService.checkOTP(email, otp)) {
            const userRole = await userRepository.getUserRole(userId) ?? RoleType.USER
            const jwtToken = securityService.generateJWTToken(userId, userRole)
            await tokenRepository.upsertTokenForUser(userId, jwtToken)
            await redisService.deleteOTP(email)
            return { jwt_token: jwtToken }
        }

        throw new TokenExpiredError("Invalid or Expired activation code")
    },

    async resendOtp(email: string): Promise<void> {
        await redisService.deleteOTP(email)
        const otp = securityService.generateOTP()
        redisService.saveOTP(otp, email)
        emailService.sendOTPEmail(email, otp)
    },

    async resendAccountActivation(userId: string, email: string): Promise<void> {
        await redisService.deleteEmailActivationToken(email)
        const activationToken = securityService.generateEmailActivationToken()
        redisService.saveEmailActivationToken(activationToken, email)

        emailService.sendActivateAccountEmail(email, activationToken, userId)
        throw new AccountNotEnableError("Account not enabled please check email")
    },

    async logout(userId: string): Promise<void> {
        if (userId) {
            console.log(userId)
            await tokenRepository.deleteTokensByUserId(userId)
            return
        }
        throw new CustomAppError("Unable to logout", 418)
    }
}