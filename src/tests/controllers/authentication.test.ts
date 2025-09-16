import { NextFunction, Request, Response } from "express";
import {
  login,
  register,
  validateEmail,
  validateOtp,
  resendOtp,
  resendAccountActivation,
} from "../../controllers/authentication";
import { authenticationService } from "../../services/authentication";
import { AccountNotEnableError, ConflictError, CustomAppError, TokenExpiredError } from "../../middlewares/errorHandler";
import { RoleType } from "../../models/identity";

jest.mock("../../services/authentication");

describe("Authentication Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn()
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("400 if username or password missing", async () => {
      mockReq.body = {};
      await login(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Username and password are required and must be strings.",
      });
    });

    it("200 when service returns token object", async () => {
      (authenticationService.login as jest.Mock).mockResolvedValue({
        token: "mock-token",
        user_id: "123",
      });

      mockReq.body = { username: "test", password: "pass" };
      await login(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        token: "mock-token",
        user_id: "123",
      });
    });

    it("489 when service returns user_id string", async () => {
      (authenticationService.login as jest.Mock).mockResolvedValue("123");

      mockReq.body = { username: "test", password: "pass" };
      await login(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(489);
      expect(mockRes.json).toHaveBeenCalledWith({
        user_id: "123",
        username: "test",
      });
    });

    it("CustomAppError handled correctly", async () => {
      (authenticationService.login as jest.Mock).mockRejectedValue(
        new CustomAppError("Invalid credentials", 401)
      );

      mockReq.body = { username: "bad", password: "wrong" };
      await login(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomAppError));
    });

    it("AccountNotEnableError handled correctly", async () => {
      (authenticationService.login as jest.Mock).mockRejectedValue(
        new AccountNotEnableError("Account not enabled please check email")
      );

      mockReq.body = { username: "inactiveUser", password: "pass" };
      await login(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AccountNotEnableError));
    });
  });

  describe("register", () => {
    it("400 if required fields missing", async () => {
      mockReq.body = {};
      await register(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Username, email, and password are required and must be strings.",
      });
    });

    it("200 on success", async () => {
      (authenticationService.register as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        username: "newuser",
        email: "test@example.com",
        password: "password",
        role: RoleType.USER,
      };
      await register(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(authenticationService.register).toHaveBeenCalledWith({
        username: "newuser",
        email: "test@example.com",
        password: "password",
        role: RoleType.USER,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Account created successfully" });
    });

    it("CustomAppError handled correctly", async () => {
      (authenticationService.register as jest.Mock).mockRejectedValue(
        new ConflictError("Email already exists")
      );

      mockReq.body = {
        username: "dup",
        email: "dup@example.com",
        password: "pass",
        role: RoleType.USER,
      };
      await register(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
    });
  });

  describe("validateEmail", () => {
    it("400 if missing token or email", async () => {
      mockReq.query = {};
      await validateEmail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Missing activation token or user ID.");
    });

    it("200 on success", async () => {
      (authenticationService.validateEmail as jest.Mock).mockResolvedValue({ valid: true });
      mockReq.query = {
        activation_token: "abc",
        email: "test@example.com",
        id: "123",
      };

      await validateEmail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ valid: true });
    });

    it("TokenExpiredError handled correctly", async () => {
      (authenticationService.validateEmail as jest.Mock).mockRejectedValue(
        new TokenExpiredError("Token expired")
      );

      mockReq.query = {
        activation_token: "abc",
        email: "test@example.com",
        id: "123",
      };

      await validateEmail(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenExpiredError));
    });
  });

  describe("validateOtp", () => {
    it("400 if missing otp/email/id", async () => {
      mockReq.query = {};
      await validateOtp(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Missing otp or user ID or email");
    });

    it("200 on success", async () => {
      (authenticationService.validateOTP as jest.Mock).mockResolvedValue({ valid: true });
      mockReq.query = { otp: "1234", username: "test@example.com", id: "123" };

      await validateOtp(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ valid: true });
    });

    it("TokenExpiredError handled correctly", async () => {
      (authenticationService.validateOTP as jest.Mock).mockRejectedValue(
        new TokenExpiredError("OTP expired")
      );
      mockReq.query = { otp: "1234", username: "test@example.com", id: "123" };

      await validateOtp(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenExpiredError));
    });
  });

  describe("resendOtp", () => {
    it("400 if missing email", async () => {
      mockReq.query = {};
      await resendOtp(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Missing email");
    });

    it("200 on success", async () => {
      (authenticationService.resendOtp as jest.Mock).mockResolvedValue(undefined);
      mockReq.query = { email: "test@example.com" };

      await resendOtp(mockReq as Request, mockRes as Response);

      expect(authenticationService.resendOtp).toHaveBeenCalledWith("test@example.com");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "OTP sent" });
    });
  });

  describe("resendAccountActivation", () => {
    it("400 if missing email or userId", async () => {
      mockReq.query = {};
      await resendAccountActivation(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Missing email or user ID");
    });

    it("200 on success", async () => {
      (authenticationService.resendAccountActivation as jest.Mock).mockResolvedValue(undefined);
      mockReq.query = { email: "test@example.com", id: "123" };

      await resendAccountActivation(mockReq as Request, mockRes as Response);

      expect(authenticationService.resendAccountActivation).toHaveBeenCalledWith("123", "test@example.com");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Account activation email sent",
      });
    });
  });
});
