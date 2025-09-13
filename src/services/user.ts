// Service for user management
import { UserInfo } from "../interfaces/user";
import { CustomAppError, NotFoundError } from "../middlewares/errorHandler";
import { userRepository } from "../repositories/user";

export const userService = {
    async getUserById(userId: string): Promise<UserInfo | null> {
        try {
            const user = await userRepository.getUserById(userId);
            if (!user) {
                // Throw a specific NotFoundError if user is not found
                throw new NotFoundError('User not found.');
            }
            return user
        } catch (error) {
            console.error('Error in userService.getUserById:', error);

            if (error instanceof CustomAppError) {
                throw error; 
            } else if (error instanceof Error) {
                throw new CustomAppError(`Failed to retrieve user: ${error.message}`, 500);
            } else {
                throw new CustomAppError('An unknown error occurred in user service.', 500);
            }
        }
    }
}