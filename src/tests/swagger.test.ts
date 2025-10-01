/**
 * src/tests/swagger.test.ts
 */
import request from "supertest";
import express from "express";
import { setupSwaggerDocs } from "../swagger";
import serverConfig from "../configs/serverConfig";

jest.mock("../configs/serverConfig", () => ({
  __esModule: true,
  default: {
    nodeEnv: "development",
    port: 3000,
  },
}));

describe("Swagger Setup", () => {
  let app: express.Express;
  let originalEnv: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    originalEnv = serverConfig.nodeEnv;
  });

  afterEach(() => {
    (serverConfig as any).nodeEnv = originalEnv;
  });

  it("should mount /api-docs and /api-docs.json in default mode", async () => {
    setupSwaggerDocs(app);

    const resJson = await request(app).get("/api-docs.json");
    expect(resJson.status).toBe(200);
    expect(resJson.body.openapi).toBe("3.0.0"); // swaggerSpec content

    const resUi = await request(app).get("/api-docs").redirects(1);
    // swagger-ui-express serves HTML, so check content type
    expect(resUi.status).toBe(200);
    expect(resUi.headers["content-type"]).toContain("text/html");
  });

  it("should mount /api-docs and /api-docs.json in development mode", async () => {
    setupSwaggerDocs(app, "development");

    const resJson = await request(app).get("/api-docs.json");
    expect(resJson.status).toBe(200);
    expect(resJson.body.openapi).toBe("3.0.0"); // swaggerSpec content

    const resUi = await request(app).get("/api-docs").redirects(1);
    // swagger-ui-express serves HTML, so check content type
    expect(resUi.status).toBe(200);
    expect(resUi.headers["content-type"]).toContain("text/html");
  });

  it("should not mount swagger routes outside development", async () => {
    setupSwaggerDocs(app, "production");

    const resJson = await request(app).get("/api-docs.json");
    expect(resJson.status).toBe(404);

    const resUi = await request(app).get("/api-docs");
    expect(resUi.status).toBe(404);
  });

  it("should log availability messages in development", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    setupSwaggerDocs(app, "development");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("📚 Swagger docs available at")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("📄 Swagger JSON available at")
    );

    consoleSpy.mockRestore();
  });
});
