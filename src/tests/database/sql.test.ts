import { Pool } from "pg";

// Mock configs
jest.mock("../../configs/databaseConfig", () => ({
  sqlConfig: {
    user: "test_user",
    password: "test_password",
    host: "localhost",
    port: 5432,
    database: "test_db",
  },
}));

// Spy on process.exit so test runner won't quit
const mockExit = jest
  .spyOn(process, "exit")
  .mockImplementation(((code?: number) => {
    throw new Error(`process.exit called with ${code}`);
  }) as never);

const mockOn = jest.fn();

jest.mock("pg", () => {
  const mPool = jest.fn(() => ({
    on: mockOn,
  }));
  return { Pool: mPool };
});

describe("Postgres Pool setup", () => {
  let pool: any;
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Import after mocks are in place
    pool = require("../../database/sql").default;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("should create a Pool with the right config", () => {
    expect(Pool).toHaveBeenCalledWith({
      user: "test_user",
      password: "test_password",
      host: "localhost",
      port: 5432,
      database: "test_db",
      ssl: true,
    });
  });

  it("should register error handler", () => {
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("should log error and exit on error event", () => {
    const errorHandler = mockOn.mock.calls[0][1]; // grab registered handler

    expect(() => errorHandler(new Error("boom"))).toThrow(
      "process.exit called with -1"
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Unexpected error on idle client",
      expect.any(Error)
    );
    expect(mockExit).toHaveBeenCalledWith(-1);
  });
});
