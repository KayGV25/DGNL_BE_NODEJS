import { Request, Response, NextFunction } from "express";
import requestLogger from "../../middlewares/requestLogger";

describe("requestLogger middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleSpy: jest.SpyInstance;
  let originalEnd: jest.Mock;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      originalUrl: "/test/endpoint",
      ip: "127.0.0.1",
    };

    originalEnd = jest.fn().mockReturnThis();

    mockRes = {
      locals: {},
      statusCode: 200,
      end: originalEnd,
    } as Partial<Response>;

    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // silence console
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should set req.cpuStartUsage", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.cpuStartUsage).toBeDefined();
    expect(typeof mockReq.cpuStartUsage!.user).toBe("number");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should wrap res.end and log CPU time when no error occurred", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    // Call wrapped res.end
    (mockRes.end as jest.Mock).call(mockRes);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logMessage = consoleSpy.mock.calls[0][0];

    // Full format check
    expect(logMessage).toMatch(
      /^\[.*\]\tGET\t\/test\/endpoint\t127\.0\.0\.1\t200\tCPU Time: \d+\.\d{3} ms$/
    );

    // ISO date check
    const timestamp = logMessage.split("]")[0].slice(1);
    expect(() => new Date(timestamp).toISOString()).not.toThrow();
  });

  it("should call original res.end with arguments", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const arg = Buffer.from("test");
    (mockRes.end as jest.Mock).call(mockRes, arg, "utf8");

    expect(originalEnd).toHaveBeenCalledWith(arg, "utf8");
  });

  it("should not log if errorOccurred is true", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    mockRes.locals = { errorOccurred: true };

    (mockRes.end as jest.Mock).call(mockRes);

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(originalEnd).toHaveBeenCalled(); // still calls original end
  });

  it("should not throw if cpuStartUsage is missing", () => {
    // remove cpuStartUsage artificially
    mockReq.cpuStartUsage = undefined;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);
    delete mockReq.cpuStartUsage;

    expect(() => (mockRes.end as jest.Mock).call(mockRes)).not.toThrow();
    expect(originalEnd).toHaveBeenCalled();
  });

  it("should call next()", () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
