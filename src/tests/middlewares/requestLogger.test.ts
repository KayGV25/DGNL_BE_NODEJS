import { Request, Response, NextFunction } from "express";
import requestLogger from "../../middlewares/requestLogger";

describe("requestLogger middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      method: "get",
      originalUrl: "/test/endpoint",
      ip: "127.0.0.1",
    };
    mockRes = {};
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // silence logs
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log request details with ISO timestamp", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logMessage = consoleSpy.mock.calls[0][0];

    // Check format
    expect(logMessage).toMatch(/^\[.*\]\tGET\t\/test\/endpoint from 127\.0\.0\.1$/);

    // Ensure timestamp is valid ISO
    const timestamp = logMessage.split("]")[0].slice(1); // extract between [ and ]
    expect(() => new Date(timestamp).toISOString()).not.toThrow();
  });

  it("should call next()", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
