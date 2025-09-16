import request from "supertest";
import express from "express";
import publicRouter from "../../routers/public";
import userRouter from "../../routers/public/user";
import authenticationRouter from "../../routers/public/authentication";

// Mock the child routers as actual Express Router instances
jest.mock("../../routers/public/user", () => {
  const router = express.Router();
  return router;
});
jest.mock("../../routers/public/authentication", () => {
  const router = express.Router();
  return router;
});

describe("publicRouter", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(publicRouter);
    jest.clearAllMocks(); // Clear mocks before each test
  });

  // Test Case 1: /users route is mounted
  it("should mount the userRouter on the /users path", async () => {
    // Add a test route directly to the mocked userRouter
    (userRouter as any).get("/", (req: any, res: any) => res.status(200).send("users ok"));

    const res = await request(app).get("/users/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("users ok");
  });

  // Test Case 2: /authentication route is mounted
  it("should mount the authenticationRouter on the /authentication path", async () => {
    // Add a test route directly to the mocked authenticationRouter
    (authenticationRouter as any).get("/", (req: any, res: any) => res.status(200).send("auth ok"));

    const res = await request(app).get("/authentication/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("auth ok");
  });

  // Test Case 3: Verify that the parent router is not handling a direct request to its path
  it("should not handle a request to the root path '/'", async () => {
    const res = await request(app).get("/");
    // We expect a 404 Not Found since no route is defined on the publicRouter's root
    expect(res.status).toBe(404);
  });
});