import { Router } from "express";
import { logout } from "../../../controllers/authentication";

// Mock dependencies
jest.mock("express");
jest.mock("../../../controllers/authentication");

describe("userRouter", () => {
  let mockRouter: any;
  let mockPost: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock router instance
    mockPost = jest.fn();
    mockRouter = {
      post: mockPost,
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      use: jest.fn(),
    };

    // Mock Router to return our mock router
    (Router as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should create a Router instance", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
    });

    expect(Router).toHaveBeenCalled();
  });

  it("should register POST /logout route with logout controller", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      expect(mockPost).toHaveBeenCalledWith('/logout', logout);
    });
  });

  it("should only register one route", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  it("should use POST method for logout endpoint", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      // Verify POST was called and not other methods
      expect(mockPost).toHaveBeenCalled();
      expect(mockRouter.get).not.toHaveBeenCalled();
      expect(mockRouter.put).not.toHaveBeenCalled();
      expect(mockRouter.delete).not.toHaveBeenCalled();
      expect(mockRouter.patch).not.toHaveBeenCalled();
    });
  });

  it("should register logout route at the correct path", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      const firstCall = mockPost.mock.calls[0];
      expect(firstCall[0]).toBe('/logout');
    });
  });

  it("should use logout controller as the handler", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      const firstCall = mockPost.mock.calls[0];
      expect(firstCall[1]).toBe(logout);
    });
  });

  it("should export the router as default", () => {
    jest.isolateModules(() => {
      const router = require("../../../routers/authenticated/user").default;
      
      expect(router).toBeDefined();
      expect(router).toBe(mockRouter);
    });
  });

  it("should not register any middleware on the router", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      // Verify no middleware was added via .use()
      expect(mockRouter.use).not.toHaveBeenCalled();
    });
  });

  it("should have correct route configuration order", () => {
    jest.isolateModules(() => {
      require("../../../routers/authenticated/user");
      
      // Get all the mock calls
      const calls = mockPost.mock.calls;
      
      // Verify order and structure
      expect(calls.length).toBe(1);
      expect(calls[0]).toEqual(['/logout', logout]);
    });
  });
});