import request from 'supertest';
import app from '../app';
import { setupSwaggerDocs } from '../swagger';

// Mock the dependencies
jest.mock('../routers/public', () => {
    return jest.fn((req, res, next) => next());
});

jest.mock('../routers/authenticated', () => {
    return jest.fn((req, res, next) => next());
});

jest.mock('../middlewares/requestLogger', () => jest.fn((req, res, next) => next()));

jest.mock('../middlewares/authorization', () => ({
    authorize: jest.fn(() => jest.fn((req, res, next) => next())),
}));

jest.mock('../swagger', () => ({
    setupSwaggerDocs: jest.fn(),
}));

jest.mock('../middlewares/errorHandler', () => ({
    NotFoundError: jest.fn(message => {
        const error = new Error(message);
        (error as any).status = 404;
        return error;
    }),
    errorHandler: jest.fn((err: any, req: any, res: any, next: any) => {
        res.status(err.status || 500).send(err.message || 'Internal Server Error');
    }),
}));

describe('Express Application - Setup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.isolateModules(() => {
            require('../app'); // reloads app.ts with mocks active
        });
    });

    describe('Swagger Documentation Setup', () => {
        it('should call setupSwaggerDocs exactly once', () => {
            expect(setupSwaggerDocs).toHaveBeenCalledTimes(1);
        });
    });

    describe('Express JSON Parser Setup', () => {
        it('should parse JSON request bodies', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const res = await request(app)
                .post('/api/public/test')
                .send({ test: 'data' })
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ received: { test: 'data' } });
        });

        it('should handle empty JSON bodies', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const res = await request(app)
                .post('/api/public/test')
                .send({})
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ received: {} });
        });

        it('should handle complex JSON objects', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const complexData = {
                user: { name: 'John', age: 30 },
                items: [1, 2, 3],
                active: true
            };

            const res = await request(app)
                .post('/api/public/test')
                .send(complexData)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.received).toEqual(complexData);
        });

        it('should handle nested JSON structures', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const nestedData = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep'
                        }
                    }
                }
            };

            const res = await request(app)
                .post('/api/public/test')
                .send(nestedData)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.received).toEqual(nestedData);
        });

        it('should handle arrays in JSON body', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const arrayData = [1, 2, 3, 4, 5];

            const res = await request(app)
                .post('/api/public/test')
                .send(arrayData)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.received).toEqual(arrayData);
        });

        it('should handle JSON with special characters', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ received: req.body });
            });

            const specialData = {
                text: "Hello \"World\"",
                emoji: "😀🎉",
                unicode: "café"
            };

            const res = await request(app)
                .post('/api/public/test')
                .send(specialData)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.received).toEqual(specialData);
        });

        it('should handle requests without JSON body', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ bodyExists: req.body !== undefined });
            });

            const res = await request(app).get('/api/public/test');

            expect(res.status).toBe(200);
        });
    });

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
            const res = await request(app).get('/api/public');
            expect(res).toBeDefined();
        });
    });

    describe('Setup Order', () => {
        it('should setup JSON parser before routes', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                // Body should be parsed at this point
                res.status(200).json({ 
                    bodyParsed: typeof req.body === 'object' 
                });
            });

            const res = await request(app)
                .post('/api/public/test')
                .send({ data: 'test' })
                .set('Content-Type', 'application/json');

            expect(res.body.bodyParsed).toBe(true);
        });
    });

    describe('JSON Parser Configuration', () => {
        it('should accept application/json content type', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ success: true });
            });

            const res = await request(app)
                .post('/api/public/test')
                .send({ data: 'test' })
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
        });

        it('should handle large JSON payloads', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).json({ itemCount: req.body.items?.length });
            });

            const largeData = {
                items: Array(100).fill({ id: 1, name: 'test', value: 'data' })
            };

            const res = await request(app)
                .post('/api/public/test')
                .send(largeData)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.itemCount).toBe(100);
        });
    });

    describe('Module Initialization', () => {
        it('should initialize without errors', () => {
            expect(() => require('../app')).not.toThrow();
        });
    });
});