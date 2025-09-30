import { userRepository } from "../../repositories/user";
import pool from "../../database/sql";
import { RegisterRequest, UserCredentials, UserInfo } from "../../interfaces/user";
import { RoleType } from "../../models/identity";

// Mock client
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock pool
jest.mock("../../database/sql", () => ({
  connect: jest.fn(),
}));

describe("userRepository", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("getUserById", () => {
    it("should return null if no user found", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      const result = await userRepository.getUserById("123");
      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), ["123"]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return user if found", async () => {
      const fakeUser: UserInfo = {
        username: "test",
        gender_id: 1,
        role_id: 2,
        coins: 100,
        grade_lv: 3,
        email: "test@mail.com",
        dob: new Date("2000-01-01"),
        avatar_url: "url",
        is_enable: true,
      };
      mockClient.query.mockResolvedValueOnce({ rows: [fakeUser] });
      const result = await userRepository.getUserById("123");
      expect(result).toEqual(fakeUser);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getUserCredentialsByUsernameOrEmail", () => {
    it("should return null if no credentials found", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      const result = await userRepository.getUserCredentialsByUsernameOrEmail("user");
      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return user credentials if found", async () => {
      const fakeCreds: UserCredentials = {
        id: "1",
        username: "user",
        password: "hashed",
        email: "user@mail.com",
        is_enable: true,
        token: "abc",
      };
      mockClient.query.mockResolvedValueOnce({ rows: [fakeCreds] });
      const result = await userRepository.getUserCredentialsByUsernameOrEmail("user");
      expect(result).toEqual(fakeCreds);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("createUser", () => {
    it("should return new user id when insert succeeds", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: "new-id" }] });
      const request: RegisterRequest = {
        username: "user",
        email: "mail@mail.com",
        password: "pass",
        role: 1,
      };
      const result = await userRepository.createUser(request);
      expect(result).toBe("new-id");
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO identity.users"), expect.any(Array));
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should log and throw error when insert fails", async () => {
      const error = new Error("DB error");
      mockClient.query.mockRejectedValueOnce(error);
      const request: RegisterRequest = {
        username: "user",
        email: "mail@mail.com",
        password: "pass",
        role: 1,
      };
      await expect(userRepository.createUser(request)).rejects.toThrow("DB error");
      expect(consoleSpy).toHaveBeenCalledWith("❌ Error inserting user:", error);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("checkIfEmailExists", () => {
    it("should return true if count > 0", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      const result = await userRepository.checkIfEmailExists("mail@mail.com");
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return false if count = 0", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await userRepository.checkIfEmailExists("mail@mail.com");
      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("enableAccountAndSetJWTToken", () => {
    it("should run transaction successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({}) // UPSERT
        .mockResolvedValueOnce({}); // COMMIT

      await userRepository.enableAccountAndSetJWTToken("123", "jwt-token");

      expect(mockClient.query).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.stringContaining("UPDATE"), ["123"]);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, expect.stringContaining("INSERT INTO identity.tokens"), ["123", "jwt-token"]);
      expect(mockClient.query).toHaveBeenNthCalledWith(4, "COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should rollback on error", async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("Update failed")); // fails update

      await expect(userRepository.enableAccountAndSetJWTToken("123", "jwt-token")).rejects.toThrow("Update failed");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getUserRole", () => {
    it("should return null if no role found", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      const result = await userRepository.getUserRole("123");
      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return role if found", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ role_id: 2 }] });
      const result = await userRepository.getUserRole("123");
      expect(result).toBe(2 as RoleType);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
