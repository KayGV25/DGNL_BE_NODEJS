import { tokenRepository } from "../../repositories/token";
import pool from "../../database/sql";

// Mock pool and client
jest.mock("../../database/sql", () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

describe("tokenRepository", () => {
  let mockClient: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    (pool.query as jest.Mock).mockReset();

    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should rollback and throw on failure", async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("DB error"));

      await expect(tokenRepository.deleteToken("abc")).rejects.toThrow("DB error");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getTokenByUserId", () => {
    it("should return token if rows exist", async () => {
      mockClient.query.mockResolvedValue({ rows: [{ token: "tok123" }] });

      const result = await tokenRepository.getTokenByUserId("user1");

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT token FROM identity.tokens"),
        ["user1"]
      );
      expect(result).toBe("tok123");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return null if no rows", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await tokenRepository.getTokenByUserId("user1");

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("insertToken", () => {
    it("should return rowCount", async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await tokenRepository.insertToken("user1", "tok123");

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO identity.tokens"),
        ["user1", "tok123"]
      );
      expect(result).toBe(1);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return 0 if rowCount missing", async () => {
      mockClient.query.mockResolvedValue({});

      const result = await tokenRepository.insertToken("user1", "tok123");

      expect(result).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("deleteTokensByUserId", () => {
    it("should return rowCount", async () => {
      mockClient.query.mockResolvedValue({ rowCount: 2 });

      const result = await tokenRepository.deleteTokensByUserId("user1");

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM identity.tokens"),
        ["user1"]
      );
      expect(result).toBe(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should return 0 if rowCount missing", async () => {
      mockClient.query.mockResolvedValue({});

      const result = await tokenRepository.deleteTokensByUserId("user1");

      expect(result).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
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

    it("should rollback, release, log error, and return false on failure", async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("insert failed"));

      const result = await tokenRepository.upsertTokenForUser("user1", "tok123");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in upsertTokenForUser transaction:",
        expect.any(Error)
      );
      expect(result).toBe(false);
    });
  });
});
