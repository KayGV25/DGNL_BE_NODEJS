// src/tests/server.test.ts
import app from '../app';
import config from '../configs/serverConfig';
import { connectToRedis } from '../database/redis';

jest.mock('../app', () => ({
  __esModule: true,
  default: {
    listen: jest.fn((port, callback) => {
      callback(); // simulate server starting
      return { close: jest.fn() };
    }),
  },
}));


// Mock the Redis module
jest.mock('../database/redis', () => ({
  connectToRedis: jest.fn(() => Promise.resolve()),
}));

// Mock the config module
jest.mock('../configs/serverConfig', () => ({
  __esModule: true,
  default: {
    port: 3000,
    nodeEnv: 'development',
  },
  isDev: true,
}));


describe('Server Startup', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should start the server and log the development message', async () => {
    await import('../server');
    
    const expectedMessage = `Server is running at http://localhost:${config.port}`;
    
    expect(app.listen).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledWith(config.port, expect.any(Function));
    expect(consoleSpy.mock.calls.flat()).toContain(expectedMessage);
    expect(connectToRedis).toHaveBeenCalledTimes(1);
  });

  it('should log the correct production message when NODE_ENV is production', async () => {
    jest.resetModules();
    jest.doMock('../configs/serverConfig', () => ({
      __esModule: true,
      default: {
        port: 80,
        nodeEnv: 'production',
      },
      isDev: false,
    }));
    
    // Dynamic imports to get fresh references to the mocked modules
    const { default: updatedApp } = await import('../app');
    const { default: updatedConfig } = await import('../configs/serverConfig');
    const { connectToRedis: updatedConnectToRedis } = await import('../database/redis');
    await import('../server');

    const expectedMessage = `Server is running on port 80`;

    expect(updatedApp.listen).toHaveBeenCalledTimes(1);
    expect(updatedApp.listen).toHaveBeenCalledWith(updatedConfig.port, expect.any(Function));
    expect(consoleSpy.mock.calls.flat()).toContain(expectedMessage);
    expect(updatedConnectToRedis).toHaveBeenCalledTimes(1);
  });
});