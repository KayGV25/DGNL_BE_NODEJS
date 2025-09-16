import { userService } from "../../services/user";
import { userRepository } from "../../repositories/user";
import { CustomAppError, NotFoundError } from "../../middlewares/errorHandler";
import { UserInfo } from "../../interfaces/user";

// Mock dependencies
jest.mock("../../repositories/user");

describe("userService", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getUserById", () => {
    const mockUserId = "user123";
    const mockUserInfo: UserInfo = {
      username: "testuser",
      email: "test@example.com",
      gender_id: 1,
      role_id: 2,
      dob: new Date("1990-01-01"),
      coins: 100,
      grade_lv: 5,
      avatar_url: "https://example.com/avatar.jpg",
      is_enable: true
    };

    it("should return user info when user exists", async () => {
      (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUserInfo);

      const result = await userService.getUserById(mockUserId);

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserInfo);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
      (userRepository.getUserById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("User not found.");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', expect.any(NotFoundError));
    });

    it("should re-throw CustomAppError without wrapping", async () => {
      const customError = new CustomAppError("Database connection failed", 503);
      (userRepository.getUserById as jest.Mock).mockRejectedValue(customError);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(customError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("Database connection failed");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', customError);
    });

    it("should wrap regular Error in CustomAppError", async () => {
      const regularError = new Error("Network timeout");
      (userRepository.getUserById as jest.Mock).mockRejectedValue(regularError);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(CustomAppError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("Failed to retrieve user: Network timeout");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', regularError);
    });

    it("should handle unknown error types", async () => {
      const unknownError = "String error";
      (userRepository.getUserById as jest.Mock).mockRejectedValue(unknownError);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(CustomAppError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("An unknown error occurred in user service.");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', unknownError);
    });

    it("should handle null error", async () => {
      (userRepository.getUserById as jest.Mock).mockRejectedValue(null);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(CustomAppError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("An unknown error occurred in user service.");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', null);
    });

    it("should handle undefined error", async () => {
      (userRepository.getUserById as jest.Mock).mockRejectedValue(undefined);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(CustomAppError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("An unknown error occurred in user service.");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in userService.getUserById:', undefined);
    });

    it("should handle empty string userId", async () => {
      (userRepository.getUserById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById("")).rejects.toThrow(NotFoundError);

      expect(userRepository.getUserById).toHaveBeenCalledWith("");
    });

    it("should handle special characters in userId", async () => {
      const specialUserId = "user-123_@#$%";
      (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUserInfo);

      const result = await userService.getUserById(specialUserId);

      expect(userRepository.getUserById).toHaveBeenCalledWith(specialUserId);
      expect(result).toEqual(mockUserInfo);
    });

    it("should handle very long userId", async () => {
      const longUserId = "a".repeat(1000);
      (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUserInfo);

      const result = await userService.getUserById(longUserId);

      expect(userRepository.getUserById).toHaveBeenCalledWith(longUserId);
      expect(result).toEqual(mockUserInfo);
    });

    it("should preserve error status codes in CustomAppError", async () => {
      const customError = new CustomAppError("Unauthorized access", 401);
      (userRepository.getUserById as jest.Mock).mockRejectedValue(customError);

      try {
        await userService.getUserById(mockUserId);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CustomAppError);
        const customAppError = error as CustomAppError;
        expect(customAppError.statusCode).toBe(401);
        expect(customAppError.message).toBe("Unauthorized access");
      }
    });

    it("should set correct status code for wrapped regular errors", async () => {
      const regularError = new Error("Database error");
      (userRepository.getUserById as jest.Mock).mockRejectedValue(regularError);

      try {
        await userService.getUserById(mockUserId);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CustomAppError);
        const customAppError = error as CustomAppError;
        expect(customAppError.statusCode).toBe(500);
        expect(customAppError.message).toBe("Failed to retrieve user: Database error");
      }
    });

    it("should set correct status code for unknown errors", async () => {
      (userRepository.getUserById as jest.Mock).mockRejectedValue("unknown");

      try {
        await userService.getUserById(mockUserId);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CustomAppError);
        const customAppError = error as CustomAppError;
        expect(customAppError.statusCode).toBe(500);
        expect(customAppError.message).toBe("An unknown error occurred in user service.");
      }
    });

    it("should verify NotFoundError is instance of CustomAppError", async () => {
      (userRepository.getUserById as jest.Mock).mockResolvedValue(null);

      try {
        await userService.getUserById(mockUserId);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error).toBeInstanceOf(CustomAppError);
        const notFoundError = error as NotFoundError;
        expect(notFoundError.message).toBe("User not found.");
      }
    });

    it("should handle repository returning undefined", async () => {
      (userRepository.getUserById as jest.Mock).mockResolvedValue(undefined);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserById(mockUserId)).rejects.toThrow("User not found.");

      expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle repository returning falsy values", async () => {
      // Test various falsy values
      const falsyValues = [null, undefined, false, 0, "", NaN];
      
      for (const falsyValue of falsyValues) {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        
        (userRepository.getUserById as jest.Mock).mockResolvedValue(falsyValue);

        await expect(userService.getUserById(mockUserId)).rejects.toThrow(NotFoundError);
        expect(userRepository.getUserById).toHaveBeenCalledWith(mockUserId);
        
        jest.restoreAllMocks();
      }
    });
  });

  describe("error handling edge cases", () => {
    const mockUserId = "user123";

    it("should handle Error with empty message", async () => {
      const emptyMessageError = new Error("");
      (userRepository.getUserById as jest.Mock).mockRejectedValue(emptyMessageError);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow("Failed to retrieve user: ");
    });

    it("should handle Error with undefined message", async () => {
      const errorWithUndefinedMessage = new Error();
      errorWithUndefinedMessage.message = undefined as any;
      (userRepository.getUserById as jest.Mock).mockRejectedValue(errorWithUndefinedMessage);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow("Failed to retrieve user: undefined");
    });

    it("should handle circular reference in error object", async () => {
      const circularError: any = new Error("Circular error");
      circularError.self = circularError;
      (userRepository.getUserById as jest.Mock).mockRejectedValue(circularError);

      await expect(userService.getUserById(mockUserId)).rejects.toThrow("Failed to retrieve user: Circular error");
    });
  });
});