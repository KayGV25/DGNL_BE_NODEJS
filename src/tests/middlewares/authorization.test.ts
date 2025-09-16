import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authorize } from "../../middlewares/authorization";
import { tokenRepository } from "../../repositories/token";
import { RoleType } from "../../models/identity";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../repositories/token", () => ({
  tokenRepository: {
    getTokenByUserId: jest.fn(),
  },
}));

describe("authorize middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 401 if no authorization header", async () => {
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Missing or invalid token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if authorization header does not start with Bearer", async () => {
    mockReq.headers = { authorization: "InvalidToken" };
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Missing or invalid token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if jwt.verify throws", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });

    mockReq.headers = { authorization: "Bearer sometoken" };
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if payload is missing userId or roleId", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ payload: {} });

    mockReq.headers = { authorization: "Bearer validtoken" };
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Invalid token payload",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if tokenRepository returns null", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      payload: { userId: "123", roleId: RoleType.USER },
    });
    (tokenRepository.getTokenByUserId as jest.Mock).mockResolvedValue(null);

    mockReq.headers = { authorization: "Bearer validtoken" };
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Token revoked or not valid",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if stored token does not match", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      payload: { userId: "123", roleId: RoleType.USER },
    });
    (tokenRepository.getTokenByUserId as jest.Mock).mockResolvedValue("othertoken");

    mockReq.headers = { authorization: "Bearer validtoken" };
    const middleware = authorize();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Token revoked or not valid",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if role not allowed", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      payload: { userId: "123", roleId: RoleType.USER },
    });
    (tokenRepository.getTokenByUserId as jest.Mock).mockResolvedValue("validtoken");

    mockReq.headers = { authorization: "Bearer validtoken" };
    const middleware = authorize([RoleType.ADMIN]);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Forbidden: insufficient role",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next and attach user on success", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      payload: { userId: "123", roleId: RoleType.USER },
    });
    (tokenRepository.getTokenByUserId as jest.Mock).mockResolvedValue("validtoken");

    mockReq.headers = { authorization: "Bearer validtoken" };
    const middleware = authorize([RoleType.USER, RoleType.ADMIN]);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toEqual({
      userId: "123",
      roleId: RoleType.USER,
      token: "validtoken",
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
