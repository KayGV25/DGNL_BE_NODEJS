import { securityService } from "../../services/security";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { securityConfig } from "../../configs/securityConfig";
import { redisService } from "../../database/redis";
import { RoleType } from "../../models/identity";

// Mock dependencies
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("crypto");
jest.mock("../../configs/securityConfig");
jest.mock("../../database/redis");

describe("securityService", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    // Default mock configurations
    (securityConfig as any) = {
      jwtSecret: "test-secret",
      expiresIn: "1h"
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2b$10$hashedPassword";
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await securityService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it("should throw error when bcrypt.hash fails", async () => {
      const password = "testPassword123";
      const error = new Error("Hashing failed");
      
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(securityService.hashPassword(password)).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Bcrypt hashing failed:", error);
    });
  });

  describe("verifyPassword", () => {
    it("should return true when password matches", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2b$10$hashedPassword";
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await securityService.verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should return false when password doesn't match", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2b$10$hashedPassword";
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await securityService.verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it("should return false when bcrypt.compare throws error", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2b$10$hashedPassword";
      const error = new Error("Verification failed");
      
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      const result = await securityService.verifyPassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Bcrypt verification failed:", error);
    });
  });

  describe("isJWTTokenStillValid", () => {
    it("should return true when token is valid", () => {
      const token = "valid.jwt.token";
      const mockPayload = { payload: { userId: "123", roleId: RoleType.USER } };
      
      // Mock decodeJWTToken to not throw
      jest.spyOn(securityService, 'decodeJWTToken').mockReturnValue(mockPayload);

      const result = securityService.isJWTTokenStillValid(token);

      expect(result).toBe(true);
      expect(securityService.decodeJWTToken).toHaveBeenCalledWith(token);
    });

    it("should return false when token is invalid", () => {
      const token = "invalid.jwt.token";
      
      // Mock decodeJWTToken to throw
      jest.spyOn(securityService, 'decodeJWTToken').mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = securityService.isJWTTokenStillValid(token);

      expect(result).toBe(false);
      expect(securityService.decodeJWTToken).toHaveBeenCalledWith(token);
    });
  });

  describe("generateJWTToken", () => {
    it("should generate JWT token with correct payload", () => {
      const userId = "user123";
      const roleId = RoleType.USER;
      const expectedToken = "generated.jwt.token";
      
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = securityService.generateJWTToken(userId, roleId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { payload: { userId, roleId } },
        securityConfig.jwtSecret,
        {
          expiresIn: securityConfig.expiresIn,
          subject: userId,
          algorithm: 'HS256',
        }
      );
      expect(result).toBe(expectedToken);
    });
  });

  describe("decodeJWTToken", () => {
    it("should decode valid JWT token", () => {
      const token = "valid.jwt.token";
      const mockPayload = { payload: { userId: "123", roleId: RoleType.USER } };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = securityService.decodeJWTToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, securityConfig.jwtSecret, { algorithms: ['HS256'] });
      expect(result).toEqual(mockPayload);
    });

    it("should handle TokenExpiredError", () => {
      const token = "expired.jwt.token";
      const error = new jwt.TokenExpiredError("Token expired", new Date());
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => securityService.decodeJWTToken(token)).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: TokenExpiredError ->", error.message);
    });

    it("should handle NotBeforeError", () => {
      const token = "notbefore.jwt.token";
      const error = new jwt.NotBeforeError("Token not active", new Date());
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => securityService.decodeJWTToken(token)).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: NotBeforeError ->", error.message);
    });

    it("should handle JsonWebTokenError", () => {
      const token = "invalid.jwt.token";
      const error = new jwt.JsonWebTokenError("Invalid token");
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => securityService.decodeJWTToken(token)).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: JsonWebTokenError ->", error.message);
    });

    it("should handle unknown errors", () => {
      const token = "invalid.jwt.token";
      const error = new Error("Unknown error");
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => securityService.decodeJWTToken(token)).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: Unknown error ->", error);
    });
  });

  describe("generateEmailActivationToken", () => {
    it("should generate activation token successfully", () => {
      const mockBuffer = Buffer.from("1234567890abcdef", "hex");
      const expectedToken = "1234567890abcdef";
      
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      const result = securityService.generateEmailActivationToken();

      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(result).toBe(expectedToken);
    });

    it("should throw error when crypto.randomBytes fails", () => {
      const error = new Error("Random bytes generation failed");
      
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => securityService.generateEmailActivationToken()).toThrow("Token generation failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to generate activation token:", error);
    });
  });

  describe("generateOTP", () => {
    it("should generate 6-digit OTP", () => {
      const mockRandomInt = 123456;
      
      (crypto.randomInt as jest.Mock).mockReturnValue(mockRandomInt);

      const result = securityService.generateOTP();

      expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
      expect(result).toBe("123456");
    });

    it("should handle minimum OTP value", () => {
      const mockRandomInt = 100000;
      
      (crypto.randomInt as jest.Mock).mockReturnValue(mockRandomInt);

      const result = securityService.generateOTP();

      expect(result).toBe("100000");
    });

    it("should handle maximum OTP value", () => {
      const mockRandomInt = 999999;
      
      (crypto.randomInt as jest.Mock).mockReturnValue(mockRandomInt);

      const result = securityService.generateOTP();

      expect(result).toBe("999999");
    });
  });

  describe("checkEmailActivationCode", () => {
    it("should return true when activation codes match", async () => {
      const email = "test@example.com";
      const activationCode = "validCode123";
      
      (redisService.getEmailActivationToken as jest.Mock).mockResolvedValue(activationCode);

      const result = await securityService.checkEmailActivationCode(email, activationCode);

      expect(redisService.getEmailActivationToken).toHaveBeenCalledWith(email);
      expect(result).toBe(true);
    });

    it("should return false when activation codes don't match", async () => {
      const email = "test@example.com";
      const activationCode = "invalidCode123";
      const cachedCode = "validCode123";
      
      (redisService.getEmailActivationToken as jest.Mock).mockResolvedValue(cachedCode);

      const result = await securityService.checkEmailActivationCode(email, activationCode);

      expect(redisService.getEmailActivationToken).toHaveBeenCalledWith(email);
      expect(result).toBe(false);
    });

    it("should return false when redis service throws error", async () => {
      const email = "test@example.com";
      const activationCode = "validCode123";
      
      (redisService.getEmailActivationToken as jest.Mock).mockRejectedValue(new Error("Redis error"));

      const result = await securityService.checkEmailActivationCode(email, activationCode);

      expect(result).toBe(false);
    });
  });

  describe("checkOTP", () => {
    it("should return true when OTPs match", async () => {
      const email = "test@example.com";
      const otp = "123456";
      
      (redisService.getOTP as jest.Mock).mockResolvedValue(otp);

      const result = await securityService.checkOTP(email, otp);

      expect(redisService.getOTP).toHaveBeenCalledWith(email);
      expect(result).toBe(true);
    });

    it("should return false when OTPs don't match", async () => {
      const email = "test@example.com";
      const otp = "123456";
      const cachedOtp = "654321";
      
      (redisService.getOTP as jest.Mock).mockResolvedValue(cachedOtp);

      const result = await securityService.checkOTP(email, otp);

      expect(redisService.getOTP).toHaveBeenCalledWith(email);
      expect(result).toBe(false);
    });

    it("should return false when redis service throws error", async () => {
      const email = "test@example.com";
      const otp = "123456";
      
      (redisService.getOTP as jest.Mock).mockRejectedValue(new Error("Redis error"));

      const result = await securityService.checkOTP(email, otp);

      expect(result).toBe(false);
    });
  });

  describe("edge cases and integration", () => {
    it("should handle empty strings appropriately", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const result = await securityService.verifyPassword("", "");
      
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith("", "");
    });

    it("should handle null/undefined inputs gracefully", async () => {
      (redisService.getOTP as jest.Mock).mockResolvedValue(null);
      
      const result = await securityService.checkOTP("test@example.com", "123456");
      
      expect(result).toBe(false);
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);
      const hashedPassword = "$2b$10$hashedLongPassword";
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await securityService.hashPassword(longPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
      expect(result).toBe(hashedPassword);
    });
  });
});