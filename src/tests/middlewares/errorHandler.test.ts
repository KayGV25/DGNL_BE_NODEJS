import {
  CustomAppError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConnectionError,
  ExpiredError,
  TokenNotFoundError,
  TokenExpiredError,
  ConflictError,
  AccountNotEnableError,
  errorHandler,
} from "../../middlewares/errorHandler"; // adjust path if needed
import { Request, Response, NextFunction } from "express";

describe("Custom Error Classes", () => {
  it("should correctly set properties for CustomAppError", () => {
    const err = new CustomAppError("Test error", 418, false);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CustomAppError);
    expect(err.message).toBe("Test error");
    expect(err.statusCode).toBe(418);
    expect(err.isOperational).toBe(false);
    expect(err.name).toBe("CustomAppError");
  });

  it.each([
    [BadRequestError, "Bad Request", 400],
    [NotFoundError, "Resource not found", 404],
    [UnauthorizedError, "Unauthorized", 401],
    [ForbiddenError, "Forbidden", 403],
    [ConnectionError, "Connection Error", 503],
    [ExpiredError, "Expired", 410],
    [TokenNotFoundError, "Token not found", 404],
    [TokenExpiredError, "Token expired", 410],
    [ConflictError, "Conflicted", 409],
    [AccountNotEnableError, "Account not enabled", 401],
  ])("should create %p with default values", (ErrClass, defaultMessage, defaultCode) => {
    const err = new (ErrClass as any)();
    expect(err).toBeInstanceOf(CustomAppError);
    expect(err.message).toBe(defaultMessage);
    expect(err.statusCode).toBe(defaultCode);
    expect(err.isOperational).toBe(true);
  });

  it("should allow overriding message in specific errors", () => {
    const err = new BadRequestError("Custom bad request");
    expect(err.message).toBe("Custom bad request");
    expect(err.statusCode).toBe(400);
  });
});

describe("errorHandler middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence console
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("should handle a CustomAppError (operational)", () => {
    const err = new NotFoundError("Item not found");
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      message: "Item not found",
    });
  });

  it("should force 500 if CustomAppError is not operational", () => {
    const err = new CustomAppError("DB failure", 503, false);
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went wrong!",
    });
  });

  it("should handle a plain Error (not CustomAppError)", () => {
    const err = new Error("Unexpected failure") as any;
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went wrong!",
    });
  });
});
