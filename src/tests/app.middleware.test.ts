import request from 'supertest';
import app from '../app';
import requestLogger from '../middlewares/requestLogger';
import { NotFoundError, errorHandler } from '../middlewares/errorHandler';

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

describe('Express Application - Middlewares', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Request Logger Middleware', () => {
        it('should use the requestLogger middleware', async () => {
            await request(app).get('/');
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger for all routes', async () => {
            await request(app).get('/api/public');
            expect(requestLogger).toHaveBeenCalled();

            jest.clearAllMocks();

            await request(app).get('/api/auth');
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger before route handlers', async () => {
            const callOrder: string[] = [];

            (requestLogger as jest.Mock).mockImplementationOnce((req, res, next) => {
                callOrder.push('logger');
                next();
            });

            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                callOrder.push('router');
                res.status(200).send('OK');
            });

            await request(app).get('/api/public');
            expect(callOrder).toEqual(['logger', 'router']);
        });

        it('should call requestLogger for POST requests', async () => {
            await request(app).post('/api/public').send({});
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger for PUT requests', async () => {
            await request(app).put('/api/public/123').send({});
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger for DELETE requests', async () => {
            await request(app).delete('/api/public/123');
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger for PATCH requests', async () => {
            await request(app).patch('/api/public/123').send({});
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger even for 404 routes', async () => {
            await request(app).get('/non-existent-route');
            expect(requestLogger).toHaveBeenCalled();
        });

        it('should call requestLogger with request object', async () => {
            await request(app).get('/api/public');
            
            expect(requestLogger).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    url: expect.any(String)
                }),
                expect.any(Object),
                expect.any(Function)
            );
        });
    });

    describe('NotFoundError Middleware', () => {
        it('should handle NotFoundError for unhandled routes', async () => {
            await request(app).get('/non-existent-route');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /non-existent-route on this server!");
        });

        it('should trigger NotFoundError for invalid GET routes', async () => {
            await request(app).get('/invalid-path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /invalid-path on this server!");
        });

        it('should trigger NotFoundError for invalid POST routes', async () => {
            await request(app).post('/invalid-path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /invalid-path on this server!");
        });

        it('should trigger NotFoundError for invalid PUT routes', async () => {
            await request(app).put('/invalid-path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /invalid-path on this server!");
        });

        it('should trigger NotFoundError for invalid DELETE routes', async () => {
            await request(app).delete('/invalid-path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /invalid-path on this server!");
        });

        it('should trigger NotFoundError for invalid PATCH routes', async () => {
            await request(app).patch('/invalid-path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /invalid-path on this server!");
        });

        it('should include originalUrl in error message', async () => {
            await request(app).get('/test/nested/path');
            expect(NotFoundError).toHaveBeenCalledWith("Can't find /test/nested/path on this server!");
        });

        it('should include query parameters in originalUrl', async () => {
            await request(app).get('/invalid?query=param');
            expect(NotFoundError).toHaveBeenCalledWith(
                expect.stringContaining('/invalid')
            );
        });

        it('should not trigger NotFoundError for valid routes', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).send('OK');
            });

            await request(app).get('/api/public');
            expect(NotFoundError).not.toHaveBeenCalled();
        });
    });

    describe('Error Handler Middleware', () => {
        it('should use the global errorHandler middleware for unhandled routes', async () => {
            const res = await request(app).get('/some-invalid-path');
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(404);
            expect(res.text).toBe("Can't find /some-invalid-path on this server!");
        });

        it('should handle errors with correct status code', async () => {
            const res = await request(app).get('/non-existent');
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(404);
        });

        it('should handle errors with correct error message', async () => {
            const res = await request(app).get('/test-error');
            expect(res.text).toContain('/test-error');
        });

        it('should not call errorHandler for valid routes', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).send('OK');
            });

            const res = await request(app).get('/api/public/some-valid-route');
            expect(res.status).toBe(200);
            expect(res.text).toBe('OK');
            expect(errorHandler).not.toHaveBeenCalled();
        });

        it('should handle errors from route handlers', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                const error = new Error('Route error');
                (error as any).status = 500;
                next(error);
            });

            const res = await request(app).get('/api/public/error');
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(500);
        });

        it('should be called with error object', async () => {
            await request(app).get('/invalid');
            
            expect(errorHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String),
                    status: 404
                }),
                expect.any(Object),
                expect.any(Object),
                expect.any(Function)
            );
        });

        it('should be the last middleware in chain', async () => {
            const executionOrder: string[] = [];

            (requestLogger as jest.Mock).mockImplementationOnce((req, res, next) => {
                executionOrder.push('requestLogger');
                next();
            });

            (NotFoundError as unknown as jest.Mock).mockImplementationOnce((message) => {
                executionOrder.push('notFoundMiddleware');
                const error = new Error(message);
                (error as any).status = 404;
                return error;
            });

            (errorHandler as jest.Mock).mockImplementationOnce((err, req, res, next) => {
                executionOrder.push('errorHandler');
                res.status(err.status || 500).send(err.message);
            });

            await request(app).get('/non-existent');

            expect(executionOrder[executionOrder.length - 1]).toBe('errorHandler');
        });
    });

    describe('Middleware Execution Order', () => {
        it('should execute middlewares in correct order: logger -> routes -> notFound -> errorHandler', async () => {
            const executionOrder: string[] = [];

            (requestLogger as jest.Mock).mockImplementationOnce((req, res, next) => {
                executionOrder.push('requestLogger');
                next();
            });

            (NotFoundError as unknown as jest.Mock).mockImplementationOnce((message) => {
                executionOrder.push('notFoundMiddleware');
                const error = new Error(message);
                (error as any).status = 404;
                return error;
            });

            (errorHandler as jest.Mock).mockImplementationOnce((err, req, res, next) => {
                executionOrder.push('errorHandler');
                res.status(err.status || 500).send(err.message);
            });

            await request(app).get('/non-existent');

            expect(executionOrder).toEqual(['requestLogger', 'notFoundMiddleware', 'errorHandler']);
        });

        it('should execute logger before routes', async () => {
            const executionOrder: string[] = [];

            (requestLogger as jest.Mock).mockImplementationOnce((req, res, next) => {
                executionOrder.push('requestLogger');
                next();
            });

            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                executionOrder.push('publicRouter');
                res.status(200).send('OK');
            });

            await request(app).get('/api/public');

            expect(executionOrder).toEqual(['requestLogger', 'publicRouter']);
        });

        it('should not execute notFound middleware for valid routes', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).send('OK');
            });

            await request(app).get('/api/public');

            expect(NotFoundError).not.toHaveBeenCalled();
        });
    });

    describe('Middleware Error Handling', () => {
        it('should handle errors passed to next() in middlewares', async () => {
            (requestLogger as jest.Mock).mockImplementationOnce((req, res, next) => {
                const error = new Error('Logger error');
                (error as any).status = 500;
                next(error);
            });

            const res = await request(app).get('/api/public');
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(500);
        });

        it('should handle errors in route handlers', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                throw new Error('Route handler error');
            });

            const res = await request(app).get('/api/public');
            expect(errorHandler).toHaveBeenCalled();
        });

        it('should propagate errors through middleware chain', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                const customError = new Error('Custom error');
                (customError as any).status = 403;
                next(customError);
            });

            const res = await request(app).get('/api/public');
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(403);
        });
    });

    describe('Middleware Integration', () => {
        it('should work with all middlewares together', async () => {
            const mockRouter = require('../routers/public') as jest.Mock;
            mockRouter.mockImplementationOnce((req, res, next) => {
                res.status(200).send('Success');
            });

            const res = await request(app).get('/api/public');

            expect(requestLogger).toHaveBeenCalled();
            expect(res.status).toBe(200);
            expect(errorHandler).not.toHaveBeenCalled();
        });

        it('should handle request lifecycle from start to error', async () => {
            const res = await request(app).get('/invalid-route');

            expect(requestLogger).toHaveBeenCalled();
            expect(NotFoundError).toHaveBeenCalled();
            expect(errorHandler).toHaveBeenCalled();
            expect(res.status).toBe(404);
        });
    });
});