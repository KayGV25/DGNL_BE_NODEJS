import request from 'supertest';
import express from 'express';

// ✅ Mock Routers properly as Express Routers
jest.mock('../routers/public', () => {
  const router = express.Router();
  router.post('/test', (req, res) => {
    res.status(200).json({ received: req.body });
  });
  router.get('/test', (req, res) => {
    res.status(200).json({ bodyExists: req.body !== undefined });
  });
  return router;
});

jest.mock('../routers/authenticated', () => {
  const router = express.Router();
  router.get('/', (req, res) => {
    res.status(200).json({ auth: true });
  });
  return router;
});

jest.mock('../middlewares/requestLogger', () =>
  jest.fn((req, res, next) => next()),
);

jest.mock('../middlewares/authorization', () => ({
  authorize: jest.fn(() => jest.fn((req, res, next) => next())),
}));

jest.mock('../swagger', () => ({
  setupSwaggerDocs: jest.fn(),
}));

jest.mock('../middlewares/errorHandler', () => ({
  NotFoundError: jest.fn((message) => {
    const error = new Error(message);
    (error as any).status = 404;
    return error;
  }),
  errorHandler: jest.fn((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).send(err.message || 'Internal Server Error');
  }),
}));

jest.mock('../configs/serverConfig', () => ({
  __esModule: true,
  default: {
    port: 3000,
    nodeEnv: 'development',
  },
  isDev: true,
}));

describe('Express Application - Setup', () => {
  let app: any;
  let setupSwaggerDocs: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    setupSwaggerDocs = require('../swagger').setupSwaggerDocs;

    app = require('../app').default; // load a fresh instance
  });

  // -------------------
  // ✅ CORS CONFIG TESTS
  // -------------------
  describe('CORS Configuration', () => {
    it('should allow any origin in development mode', async () => {
      const app = require('../app').default;

      const res = await request(app)
        .options('/api/public/test')
        .set('Origin', 'http://random-dev-origin.com');

      expect(res.status).toBe(204);
      // In dev, CORS echoes the origin, not "*"
      expect(res.headers['access-control-allow-origin']).toBe(
        'http://random-dev-origin.com',
      );
    });

    it('should allow specific origin in production when whitelisted', async () => {
      jest.resetModules();
      jest.doMock('../configs/serverConfig', () => ({
        __esModule: true,
        default: {
          port: 80,
          nodeEnv: 'production',
        },
        isDev: false,
      }));
      const corsConfig = require('../configs/corsConfig');

      // Patch allowedOrigins for this test
      (corsConfig as any).corsConfig.origin = (
        origin: string,
        cb: (err: any, allow?: any) => void,
      ) => {
        if (origin === 'http://allowed.com') return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      };

      const app = require('../app').default;

      const res = await request(app)
        .options('/api/public/test')
        .set('Origin', 'http://allowed.com');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(
        'http://allowed.com',
      );
    });

    it('should reject disallowed origins in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const app = require('../app').default;

      const res = await request(app)
        .options('/api/public/test')
        .set('Origin', 'http://evil.com');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Not allowed by CORS');
    });
  });

  // -------------------------
  // ✅ SWAGGER SETUP TEST
  // -------------------------
  describe('Swagger Documentation Setup', () => {
    it('should call setupSwaggerDocs exactly once', () => {
      expect(setupSwaggerDocs).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------
  // ✅ JSON PARSER TESTS
  // -------------------------
  describe('Express JSON Parser Setup', () => {
    it('should parse JSON request bodies', async () => {
      const res = await request(app)
        .post('/api/public/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: { test: 'data' } });
    });

    it('should handle empty JSON bodies', async () => {
      const res = await request(app)
        .post('/api/public/test')
        .send({})
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: {} });
    });

    it('should handle complex JSON objects', async () => {
      const complexData = {
        user: { name: 'John', age: 30 },
        items: [1, 2, 3],
        active: true,
      };

      const res = await request(app)
        .post('/api/public/test')
        .send(complexData)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(complexData);
    });

    it('should handle nested JSON structures', async () => {
      const nestedData = {
        level1: { level2: { level3: { value: 'deep' } } },
      };

      const res = await request(app)
        .post('/api/public/test')
        .send(nestedData)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(nestedData);
    });

    it('should handle arrays in JSON body', async () => {
      const arrayData = [1, 2, 3, 4, 5];

      const res = await request(app)
        .post('/api/public/test')
        .send(arrayData)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(arrayData);
    });

    it('should handle JSON with special characters', async () => {
      const specialData = {
        text: 'Hello "World"',
        emoji: '😀🎉',
        unicode: 'café',
      };

      const res = await request(app)
        .post('/api/public/test')
        .send(specialData)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(specialData);
    });

    it('should handle requests without JSON body', async () => {
      const res = await request(app).get('/api/public/test');
      expect(res.status).toBe(200);
    });
  });

  // -------------------------
  // ✅ APP INSTANCE TESTS
  // -------------------------
  describe('Application Instance', () => {
    it('should export an Express application', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have Express app methods', () => {
      expect(app.listen).toBeDefined();
      expect(app.use).toBeDefined();
      expect(app.get).toBeDefined();
      expect(app.post).toBeDefined();
    });

    it('should be able to handle HTTP requests', async () => {
      const res = await request(app).get('/api/public/test');
      expect(res).toBeDefined();
    });
  });

  // -------------------------
  // ✅ ORDER TEST
  // -------------------------
  describe('Setup Order', () => {
    it('should setup JSON parser before routes', async () => {
      const res = await request(app)
        .post('/api/public/test')
        .send({ data: 'test' })
        .set('Content-Type', 'application/json');

      expect(res.body).toHaveProperty('received');
    });
  });

  // -------------------------
  // ✅ CONFIG TESTS
  // -------------------------
  describe('JSON Parser Configuration', () => {
    it('should accept application/json content type', async () => {
      const res = await request(app)
        .post('/api/public/test')
        .send({ data: 'test' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
    });

    it('should handle large JSON payloads', async () => {
      const largeData = {
        items: Array(100).fill({ id: 1, name: 'test', value: 'data' }),
      };

      const res = await request(app)
        .post('/api/public/test')
        .send(largeData)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.received.items.length).toBe(100);
    });
  });

  // -------------------------
  // ✅ INIT TEST
  // -------------------------
  describe('Module Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => require('../app')).not.toThrow();
    });
  });
});