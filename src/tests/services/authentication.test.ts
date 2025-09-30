import { authenticationService } from "../../services/authentication";
import { userRepository } from "../../repositories/user";
import { tokenRepository } from "../../repositories/token";
import { securityService } from "../../services/security";
import { redisService } from "../../database/redis";
import { emailService } from "../../services/email";
import { AccountNotEnableError, ConflictError, NotFoundError, TokenExpiredError, UnauthorizedError, CustomAppError } from "../../middlewares/errorHandler";
import { RoleType } from "../../models/identity";

jest.mock("../../repositories/user");
jest.mock("../../repositories/token");
jest.mock("../../services/security");
jest.mock("../../database/redis");
jest.mock("../../services/email");

describe("authenticationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("throws NotFoundError if user not found", async () => {
      (userRepository.getUserCredentialsByUsernameOrEmail as jest.Mock).mockResolvedValue(null);

      await expect(authenticationService.login({ emailOrusername: "test", password: "pass" }))
        .rejects.toThrow(NotFoundError);
    });

    it("throws UnauthorizedError if password invalid", async () => {
      (userRepository.getUserCredentialsByUsernameOrEmail as jest.Mock).mockResolvedValue({
        id: "123",
        email: "a@b.com",
        password: "hashed",
        is_enable: true,
        token: null
      });
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(authenticationService.login({ emailOrusername: "test", password: "wrong" }))
        .rejects.toThrow(UnauthorizedError);
    });

    it("throws AccountNotEnableError if account is not enabled and sends activation email", async () => {
      const userCred = { id: "123", email: "a@b.com", password: "hashed", is_enable: false, token: null };
      (userRepository.getUserCredentialsByUsernameOrEmail as jest.Mock).mockResolvedValue(userCred);
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (securityService.generateEmailActivationToken as jest.Mock).mockReturnValue("token");

      await expect(authenticationService.login({ emailOrusername: "test", password: "pass" }))
        .rejects.toThrow(AccountNotEnableError);

      expect(redisService.saveEmailActivationToken).toHaveBeenCalledWith("token", userCred.email);
      expect(emailService.sendActivateAccountEmail).toHaveBeenCalledWith(userCred.email, "token", userCred.id);
    });

    it("returns user_id and sends OTP if token is null", async () => {
      const userCred = { id: "123", email: "a@b.com", password: "hashed", is_enable: true, token: null };
      (userRepository.getUserCredentialsByUsernameOrEmail as jest.Mock).mockResolvedValue(userCred);
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (securityService.isJWTTokenStillValid as jest.Mock).mockReturnValue(false);
      (securityService.generateOTP as jest.Mock).mockReturnValue("otp");

      const result = await authenticationService.login({ emailOrusername: "test", password: "pass" });

      expect(result).toBe(userCred.id);
      expect(redisService.saveOTP).toHaveBeenCalledWith("otp", userCred.email);
      expect(emailService.sendOTPEmail).toHaveBeenCalledWith(userCred.email, "otp");
    });

    it("returns JWTTokenResponse if token exists and valid", async () => {
      const userCred = { id: "123", email: "a@b.com", password: "hashed", is_enable: true, token: "token123" };
      (userRepository.getUserCredentialsByUsernameOrEmail as jest.Mock).mockResolvedValue(userCred);
      (securityService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (securityService.isJWTTokenStillValid as jest.Mock).mockReturnValue(true);

      const result = await authenticationService.login({ emailOrusername: "test", password: "pass" });

      expect(result).toEqual({ user_id: userCred.id, token: userCred.token });
    });
  });

  describe("register", () => {
    it("throws ConflictError if email exists", async () => {
      (userRepository.checkIfEmailExists as jest.Mock).mockResolvedValue(true);

      await expect(authenticationService.register({ username: "u", email: "a@b.com", password: "pass", role: RoleType.USER }))
        .rejects.toThrow(ConflictError);
    });

    it("successfully registers a user and sends activation email", async () => {
      (userRepository.checkIfEmailExists as jest.Mock).mockResolvedValue(false);
      (securityService.hashPassword as jest.Mock).mockResolvedValue("hashed");
      (userRepository.createUser as jest.Mock).mockResolvedValue("123");
      (securityService.generateEmailActivationToken as jest.Mock).mockReturnValue("token");

      await authenticationService.register({ username: "u", email: "a@b.com", password: "pass", role: RoleType.USER });

      expect(userRepository.createUser).toHaveBeenCalled();
      expect(redisService.saveEmailActivationToken).toHaveBeenCalledWith("token", "a@b.com");
      expect(emailService.sendActivateAccountEmail).toHaveBeenCalledWith("a@b.com", "token", "123");
    });
  });

  describe("validateEmail", () => {
    it("returns JWT token if activation valid", async () => {
      (securityService.checkEmailActivationCode as jest.Mock).mockResolvedValue(true);
      (userRepository.getUserRole as jest.Mock).mockResolvedValue("USER");
      (securityService.generateJWTToken as jest.Mock).mockReturnValue("jwtToken");

      const result = await authenticationService.validateEmail("token", "a@b.com", "123");

      expect(result).toEqual({ jwt_token: "jwtToken" });
      expect(userRepository.enableAccountAndSetJWTToken).toHaveBeenCalledWith("123", "jwtToken");
    });

    it("throws TokenExpiredError if activation invalid", async () => {
      (securityService.checkEmailActivationCode as jest.Mock).mockResolvedValue(false);

      await expect(authenticationService.validateEmail("token", "a@b.com", "123"))
        .rejects.toThrow(TokenExpiredError);
    });
  });

  describe("validateOTP", () => {
    it("returns JWT token if OTP valid", async () => {
      (securityService.checkOTP as jest.Mock).mockResolvedValue(true);
      (userRepository.getUserRole as jest.Mock).mockResolvedValue("USER");
      (securityService.generateJWTToken as jest.Mock).mockReturnValue("jwtToken");

      const result = await authenticationService.validateOTP("otp", "a@b.com", "123");

      expect(result).toEqual({ jwt_token: "jwtToken" });
      expect(tokenRepository.upsertTokenForUser).toHaveBeenCalledWith("123", "jwtToken");
    });

    it("throws TokenExpiredError if OTP invalid", async () => {
      (securityService.checkOTP as jest.Mock).mockResolvedValue(false);

      await expect(authenticationService.validateOTP("otp", "a@b.com", "123"))
        .rejects.toThrow(TokenExpiredError);
    });
  });

  describe("resendOtp", () => {
    it("sends OTP email", async () => {
      (securityService.generateOTP as jest.Mock).mockReturnValue("otp");

      await authenticationService.resendOtp("a@b.com");

      expect(redisService.saveOTP).toHaveBeenCalledWith("otp", "a@b.com");
      expect(emailService.sendOTPEmail).toHaveBeenCalledWith("a@b.com", "otp");
    });
  });

  describe("resendAccountActivation", () => {
    it("sends activation email and throws AccountNotEnableError", async () => {
      (securityService.generateEmailActivationToken as jest.Mock).mockReturnValue("token");

      await expect(authenticationService.resendAccountActivation("123", "a@b.com"))
        .rejects.toThrow(AccountNotEnableError);

      expect(redisService.saveEmailActivationToken).toHaveBeenCalledWith("token", "a@b.com");
      expect(emailService.sendActivateAccountEmail).toHaveBeenCalledWith("a@b.com", "token", "123");
    });
  });

  describe("logout", () => {
    it("should delete tokens for a valid userId", async () => {
      (tokenRepository.deleteTokensByUserId as jest.Mock).mockResolvedValue(undefined);

      await authenticationService.logout("123");

      expect(tokenRepository.deleteTokensByUserId).toHaveBeenCalledWith("123");
    });

    it("should throw CustomAppError if userId is missing", async () => {
      await expect(authenticationService.logout("")).rejects.toThrow(CustomAppError);
      expect(tokenRepository.deleteTokensByUserId).not.toHaveBeenCalled();
    });
  });
});
