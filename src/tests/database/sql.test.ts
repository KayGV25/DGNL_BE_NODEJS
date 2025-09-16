// src/test/postgres.test.ts
import { Pool } from 'pg';

// Mock configs
jest.mock('../../configs/databaseConfig', () => ({
  sqlConfig: {
    user: 'test_user',
    password: 'test_password',
    host: 'localhost',
    port: 5432,
    database: 'test_db',
  },
}));

jest.mock('../../configs/serverConfig', () => ({
  __esModule: true,
  default: {
    nodeEnv: 'test',
  },
}));

// Spy on process.exit so test runner won't quit
const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation(((code?: number) => {
    throw new Error(`process.exit called with ${code}`);
  }) as never);

const mockOn = jest.fn();

jest.mock('pg', () => {
  const mPool = jest.fn(() => ({
    on: mockOn,
  }));
  return { Pool: mPool };
});

describe('Postgres Pool setup', () => {
  let pool: any;

  beforeAll(() => {
    // Import your actual file that exports pool
    pool = require('../../database/sql').default;
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('should create a Pool with the right config', () => {
    expect(Pool).toHaveBeenCalledWith({
      user: 'test_user',
      password: 'test_password',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      ssl: true, // nodeEnv = test
    });
  });

  it('should register error handler', () => {
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should call process.exit(-1) when error occurs', () => {
    const errorHandler = mockOn.mock.calls[0][1]; // the registered handler
    expect(() => errorHandler(new Error('boom'))).toThrow(
      'process.exit called with -1'
    );
    expect(mockExit).toHaveBeenCalledWith(-1);
  });
});
