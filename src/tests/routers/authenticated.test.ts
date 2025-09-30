import { Router } from "express";
import userRouter from "../../routers/authenticated/user";

jest.mock("express", () => ({
  Router: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  })),
}));

// Mock dependencies
jest.mock("express");
jest.mock("../../routers/authenticated/user");

describe("authenticatedRouter", () => {
  let mockRouter: any;
  let mockUse: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock router instance
    mockUse = jest.fn();
    mockRouter = {
      use: mockUse,
    };

    // Mock Router to return our mock router
    (Router as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should create a Router instance", () => {
    // Re-import to trigger the router creation with our mocks
    jest.isolateModules(() => {
      require("../../routers/authenticated");
    });

    expect(Router).toHaveBeenCalled();
  });

  it("should mount userRouter at /users path", () => {
    // Re-import to trigger the router configuration
    jest.isolateModules(() => {
      const router = require("../../routers/authenticated").default;
      
      // The router.use should have been called during module initialization
      expect(mockUse).toHaveBeenCalledWith('/users', userRouter);
    });
  });

  it("should only register /users route", () => {
    jest.isolateModules(() => {
      require("../../routers/authenticated");
      
      // Verify that use was called exactly once
      expect(mockUse).toHaveBeenCalledTimes(1);
    });
  });

  it("should use the correct order of middleware registration", () => {
    jest.isolateModules(() => {
      require("../../routers/authenticated");
      
      // Verify the first call was for /users with userRouter
      expect(mockUse.mock.calls[0][0]).toBe('/users');
      expect(mockUse.mock.calls[0][1]).toBe(userRouter);
    });
  });

  it("should export the router as default", () => {
    jest.isolateModules(() => {
      const router = require("../../routers/authenticated").default;
      
      expect(router).toBeDefined();
      expect(router).toBe(mockRouter);
    });
  });
});