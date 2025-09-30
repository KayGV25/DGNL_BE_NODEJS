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

    (securityConfig as any) = {
      jwtSecret: "test-secret",
      expiresIn: "1h",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      const result = await securityService.hashPassword("password");

      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(result).toBe("hashedPassword");
    });

    it("should throw error when bcrypt.hash fails", async () => {
      const error = new Error("Hashing failed");
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(securityService.hashPassword("password")).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Bcrypt hashing failed:", error);
    });
  });

  describe("verifyPassword", () => {
    it("should return true when match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await securityService.verifyPassword("pw", "hashed");
      expect(result).toBe(true);
    });

    it("should return false when mismatch", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await securityService.verifyPassword("pw", "hashed");
      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      const error = new Error("Compare failed");
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);
      const result = await securityService.verifyPassword("pw", "hashed");
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Bcrypt verification failed:", error);
    });
  });

  describe("isJWTTokenStillValid", () => {
    it("returns true for valid token", () => {
      jest.spyOn(securityService, "decodeJWTToken").mockReturnValue({ payload: { userId: "1", roleId: RoleType.USER } });
      expect(securityService.isJWTTokenStillValid("t")).toBe(true);
    });

    it("returns false for invalid token", () => {
      jest.spyOn(securityService, "decodeJWTToken").mockImplementation(() => { throw new Error("bad"); });
      expect(securityService.isJWTTokenStillValid("t")).toBe(false);
    });
  });

  describe("generateJWTToken", () => {
    it("should generate JWT", () => {
      (jwt.sign as jest.Mock).mockReturnValue("jwt-token");
      const result = securityService.generateJWTToken("user", RoleType.USER);
      expect(jwt.sign).toHaveBeenCalledWith(
        { payload: { userId: "user", roleId: RoleType.USER } },
        securityConfig.jwtSecret,
        { expiresIn: "1h", subject: "user", algorithm: "HS256" }
      );
      expect(result).toBe("jwt-token");
    });

    it("should throw if jwt.sign fails", () => {
      (jwt.sign as jest.Mock).mockImplementation(() => { throw new Error("sign failed"); });
      expect(() => securityService.generateJWTToken("user", RoleType.USER)).toThrow("sign failed");
    });
  });

  describe("decodeJWTToken", () => {
    it("decodes valid token", () => {
      (jwt.verify as jest.Mock).mockReturnValue({ payload: { userId: "1", roleId: RoleType.USER } });
      const result = securityService.decodeJWTToken("t");
      expect(result).toEqual({ payload: { userId: "1", roleId: RoleType.USER } });
    });

    it("handles TokenExpiredError", () => {
      const error = new jwt.TokenExpiredError("expired", new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });
      expect(() => securityService.decodeJWTToken("t")).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: TokenExpiredError ->", error.message);
    });

    it("handles NotBeforeError", () => {
      const error = new jwt.NotBeforeError("nbf", new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });
      expect(() => securityService.decodeJWTToken("t")).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: NotBeforeError ->", error.message);
    });

    it("handles JsonWebTokenError", () => {
      const error = new jwt.JsonWebTokenError("invalid");
      (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });
      expect(() => securityService.decodeJWTToken("t")).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: JsonWebTokenError ->", error.message);
    });

    it("handles unknown error", () => {
      const error = new Error("weird");
      (jwt.verify as jest.Mock).mockImplementation(() => { throw error; });
      expect(() => securityService.decodeJWTToken("t")).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("JWT verification failed: Unknown error ->", error);
    });
  });

  describe("generateEmailActivationToken", () => {
    it("generates token", () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from("1234567890abcdef", "hex"));
      const token = securityService.generateEmailActivationToken();
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(token).toBe("1234567890abcdef");
    });

    it("throws if randomBytes fails", () => {
      const error = new Error("fail");
      (crypto.randomBytes as jest.Mock).mockImplementation(() => { throw error; });
      expect(() => securityService.generateEmailActivationToken()).toThrow("Token generation failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to generate activation token:", error);
    });
  });

  describe("generateOTP", () => {
    it("returns 6-digit string", () => {
      (crypto.randomInt as jest.Mock).mockReturnValue(654321);
      expect(securityService.generateOTP()).toBe("654321");
    });

    it("throws if randomInt fails", () => {
      (crypto.randomInt as jest.Mock).mockImplementation(() => { throw new Error("fail"); });
      expect(() => securityService.generateOTP()).toThrow();
    });
  });

  describe("checkEmailActivationCode", () => {
    it("returns true when match", async () => {
      (redisService.getEmailActivationToken as jest.Mock).mockResolvedValue("code");
      const result = await securityService.checkEmailActivationCode("e", "code");
      expect(result).toBe(true);
    });

    it("returns false when mismatch", async () => {
      (redisService.getEmailActivationToken as jest.Mock).mockResolvedValue("other");
      const result = await securityService.checkEmailActivationCode("e", "code");
      expect(result).toBe(false);
    });

    it("returns false on error", async () => {
      (redisService.getEmailActivationToken as jest.Mock).mockRejectedValue(new Error("redis fail"));
      const result = await securityService.checkEmailActivationCode("e", "c");
      expect(result).toBe(false);
    });

    it("returns false if undefined", async () => {
      (redisService.getEmailActivationToken as jest.Mock).mockResolvedValue(undefined);
      const result = await securityService.checkEmailActivationCode("e", "c");
      expect(result).toBe(false);
    });
  });

  describe("checkOTP", () => {
    it("returns true when match", async () => {
      (redisService.getOTP as jest.Mock).mockResolvedValue("123456");
      const result = await securityService.checkOTP("e", "123456");
      expect(result).toBe(true);
    });

    it("returns false when mismatch", async () => {
      (redisService.getOTP as jest.Mock).mockResolvedValue("654321");
      const result = await securityService.checkOTP("e", "123456");
      expect(result).toBe(false);
    });

    it("returns false on error", async () => {
      (redisService.getOTP as jest.Mock).mockRejectedValue(new Error("fail"));
      const result = await securityService.checkOTP("e", "123456");
      expect(result).toBe(false);
    });

    it("returns false if undefined", async () => {
      (redisService.getOTP as jest.Mock).mockResolvedValue(undefined);
      const result = await securityService.checkOTP("e", "123456");
      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty password compare", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await securityService.verifyPassword("", "");
      expect(result).toBe(false);
    });

    it("handles very long password hashing", async () => {
      const pw = "a".repeat(1000);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      const result = await securityService.hashPassword(pw);
      expect(result).toBe("hashed");
    });
  });
});
