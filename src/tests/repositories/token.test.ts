import { tokenRepository } from "../../repositories/token";
import pool from "../../database/sql";

// Mock pool and client
jest.mock("../../database/sql", () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

describe("tokenRepository", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    (pool.query as jest.Mock).mockReset();
  });

  describe("deleteToken", () => {
    it("should commit and return true on success", async () => {
      mockClient.query.mockResolvedValue({});
      const result = await tokenRepository.deleteToken("abc");
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM indentity.tokens"),
        ["abc"]
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(result).toBe(true);
    });

    it("should rollback and throw on failure", async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("DB error"));

      await expect(tokenRepository.deleteToken("abc")).rejects.toThrow("DB error");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });
  });

  describe("getTokenByUserId", () => {
    it("should return token if rows exist", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ token: "tok123" }] });
      const result = await tokenRepository.getTokenByUserId("user1");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT token FROM identity.tokens"),
        ["user1"]
      );
      expect(result).toBe("tok123");
    });

    it("should return null if no rows", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
      const result = await tokenRepository.getTokenByUserId("user1");
      expect(result).toBeNull();
    });
  });

  describe("insertToken", () => {
    it("should return rowCount", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      const result = await tokenRepository.insertToken("user1", "tok123");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO identity.tokens"),
        ["user1", "tok123"]
      );
      expect(result).toBe(1);
    });

    it("should return 0 if rowCount missing", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});
      const result = await tokenRepository.insertToken("user1", "tok123");
      expect(result).toBe(0);
    });
  });

  describe("deleteTokensByUserId", () => {
    it("should return rowCount", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 2 });
      const result = await tokenRepository.deleteTokensByUserId("user1");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM identity.tokens"),
        ["user1"]
      );
      expect(result).toBe(2);
    });

    it("should return 0 if rowCount missing", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});
      const result = await tokenRepository.deleteTokensByUserId("user1");
      expect(result).toBe(0);
    });
  });

  describe("upsertTokenForUser", () => {
    it("should commit and return true on success", async () => {
      mockClient.query.mockResolvedValue({});
      const result = await tokenRepository.upsertTokenForUser("user1", "tok123");

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM identity.tokens"),
        ["user1"]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO identity.tokens"),
        ["user1", "tok123"]
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should rollback, release, and return false on failure", async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("insert failed"));

      const result = await tokenRepository.upsertTokenForUser("user1", "tok123");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
