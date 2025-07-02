import { CustomAppError, NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { UserCredentials, userRepository } from "../repositories/user";
import { securityService } from "./security";

export const authenticationService = {
    async login(emailOrUsername: string, password: string): Promise<string | null> {
        try {
            const userCredentials: UserCredentials | null = await userRepository.getUserCredentialsByUsernameOrEmail(emailOrUsername);
            if (!userCredentials) {
                throw new NotFoundError("User not found");
            }
            if (await securityService.verifyPassword(password, userCredentials.password)) {
                throw new UnauthorizedError("Invalid password")
            }

            if (userCredentials.token === null) {
                throw new NotFoundError("Token not found");
            }

            // Validate the token
            return userCredentials.token;
        } catch (error) {
            console.error('Error in authenticationService.login:', error);
            if (error instanceof CustomAppError) {
                throw error; 
            } else if (error instanceof Error) {
                throw new CustomAppError(`Failed to retrieve user: ${error.message}`, 500);
            } else {
                throw new CustomAppError('An unknown error occurred in authentication service.', 500);
            }
        }
    }
}