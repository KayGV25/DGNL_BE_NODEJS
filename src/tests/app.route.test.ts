/**
 * src/tests/app.route.test.ts
 *
 * Use the resetModules + doMock pattern so mocks are installed before app is loaded.
 */

import request from "supertest";

describe("Express Application - Routes (with mocked deps)", () => {
  let app: any;
  let authorizeMock: jest.Mock;
  let publicRouterMock: jest.Mock;
  let authenticatedRouterMock: jest.Mock;
  let callOrder: string[];

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    callOrder = [];

    // Mock public router
    publicRouterMock = jest.fn((req: any, res: any, next: any) => next());
    jest.doMock("../routers/public", () => publicRouterMock);

    // Mock authenticated router
    authenticatedRouterMock = jest.fn((req: any, res: any, next: any) => next());
    jest.doMock("../routers/authenticated", () => authenticatedRouterMock);

    // Mock requestLogger
    jest.doMock("../middlewares/requestLogger", () =>
      jest.fn((req: any, res: any, next: any) => next())
    );

    // Mock authorize so that at import time, it installs the callOrder middleware
    authorizeMock = jest.fn(() => {
      return (req: any, res: any, next: any) => {
        callOrder.push("authorize");
        next();
      };
    });
    jest.doMock("../middlewares/authorization", () => ({ authorize: authorizeMock }));

    // Mock swagger + error handler
    jest.doMock("../swagger", () => ({ setupSwaggerDocs: jest.fn() }));
    jest.doMock("../middlewares/errorHandler", () => ({
      NotFoundError: jest.fn((msg: string) => {
        const e = new Error(msg);
        (e as any).status = 404;
        return e;
      }),
      errorHandler: jest.fn((err: any, req: any, res: any, next: any) => {
        res.status(err.status || 500).send(err.message || "Internal Server Error");
      }),
    }));

    // Import app AFTER mocks
    app = require("../app").default;
  });

  afterEach(() => {
    // restore jest state if needed
    jest.resetAllMocks();
  });

  describe("Public routes", () => {
    it("mounts and handles /api/public", async () => {
      // make the mocked router respond for the sub-route
      publicRouterMock.mockImplementationOnce((req: any, res: any) => {
        res.status(200).send("Public OK");
      });

      const res = await request(app).get("/api/public/test");
      expect(res.status).toBe(200);
      expect(res.text).toBe("Public OK");
      expect(publicRouterMock).toHaveBeenCalled();
    });
  });

  describe("Authenticated routes", () => {
    it("calls authorize when app initializes the route", async () => {
      // Because app calls authorize() at import time, the mock should have been called already
      // (authorizeMock called during app setup). But to be safe, check it was called at least once.
      expect(authorizeMock).toHaveBeenCalled();
    });

    it("runs authorize middleware before router when handling a request", async () => {
    // authenticatedRouter pushes its order
    authenticatedRouterMock.mockImplementationOnce((req: any, res: any) => {
      callOrder.push("authenticatedRouter");
      res.status(200).send("Auth OK");
    });

    const res = await request(app).get("/api/auth/test");

    expect(res.status).toBe(200);
    expect(res.text).toBe("Auth OK");
    expect(callOrder).toEqual(["authorize", "authenticatedRouter"]);
    expect(authorizeMock).toHaveBeenCalled();
    expect(authenticatedRouterMock).toHaveBeenCalled();
    });
  });
});
