import { Request, Response, NextFunction } from "express";
import requestLogger from "../../middlewares/requestLogger";

describe("requestLogger middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      originalUrl: "/test/endpoint",
      ip: "127.0.0.1",
    };
    mockRes = {
      locals: {},
      statusCode: 200,
      end: function (this: Response) {
        return this; // simulate original end
      } as any,
    } as Partial<Response>;
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // silence logs
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // it("should log request details with ISO timestamp", () => {
  //   requestLogger(mockReq as Request, mockRes as Response, mockNext);
  //   if (!mockRes.locals) mockRes.locals = {};
  //   mockRes.locals.errorOccurred = false;
  //   expect(consoleSpy).toHaveBeenCalledTimes(1);
  //   const logMessage = consoleSpy.mock.calls[0][0];

  //   // Check format
  //   expect(logMessage).toMatch(/^\[.*\]\tGET\t\/test\/endpoint from 127\.0\.0\.1$/);

  //   // Ensure timestamp is valid ISO
  //   const timestamp = logMessage.split("]")[0].slice(1); // extract between [ and ]
  //   expect(() => new Date(timestamp).toISOString()).not.toThrow();
  // });

  it("should wrap res.end and log CPU time when no error occurred", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    // After middleware runs, res.end should be wrapped
    expect(mockNext).toHaveBeenCalled();

    // Call wrapped res.end
    (mockRes.end as jest.Mock).call(mockRes);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logMessage = consoleSpy.mock.calls[0][0];

    // Verify log format
    expect(logMessage).toMatch(
      /^\[.*\]\s+GET\s+\/test\/endpoint\s+127\.0\.0\.1\s+200\s+CPU Time: \d+\.\d{3} ms$/
    );
  });

  it("should not log if errorOccurred is true", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);
    
    mockRes.locals = { errorOccurred: true };

    (mockRes.end as jest.Mock).call(mockRes);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should call next()", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
