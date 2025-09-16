import { Request, Response, NextFunction } from "express";
import { getUserById } from "../../controllers/user";
import { userService } from "../../services/user";

// Mock userService
jest.mock("../../services/user", () => ({
  userService: {
    getUserById: jest.fn(),
  },
}));

describe("getUserById Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 400 if no userId is provided", async () => {
    await getUserById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "User ID is required" });
  });

  it("should return user if found", async () => {
    const mockUser = { id: "123", username: "testuser" };
    (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

    mockReq.params = { id: "123" };

    await getUserById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(userService.getUserById).toHaveBeenCalledWith("123");
    expect(mockRes.json).toHaveBeenCalledWith(mockUser);
  });

  it("should call next(error) if service throws", async () => {
    const error = new Error("DB error");
    (userService.getUserById as jest.Mock).mockRejectedValue(error);

    mockReq.params = { id: "123" };

    await getUserById(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
