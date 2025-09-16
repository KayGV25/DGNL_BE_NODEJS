import request from 'supertest';
import app from '../app';
import publicRouter from '../routers/public';
import requestLogger from '../middlewares/requestLogger';
import { NotFoundError, errorHandler } from '../middlewares/errorHandler';

// Mock the dependencies
jest.mock('../routers/public', () => {
    return jest.fn((req, res, next) => next());
});
jest.mock('../middlewares/requestLogger', () => jest.fn((req, res, next) => next()));
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

describe('Express Application', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use the requestLogger middleware', async () => {
        await request(app).get('/');
        expect(requestLogger).toHaveBeenCalled();
    });

    it('should mount publicRouter on /api/public', async () => {
        await request(app).get('/api/public');
        const publicRouterMock = publicRouter as unknown as jest.Mock;
        expect(publicRouterMock).toHaveBeenCalled();
    });

    it('should handle NotFoundError for unhandled routes', async () => {
        // Send a request to a non-existent path
        await request(app).get('/non-existent-route');
        expect(NotFoundError).toHaveBeenCalledWith("Can't find /non-existent-route on this server!");
    });
    
    it('should use the global errorHandler middleware for unhandled routes', async () => {
        // Send a request to a non-existent path
        const res = await request(app).get('/some-invalid-path');
        expect(errorHandler).toHaveBeenCalled();
        expect(res.status).toBe(404); // The status set by our mocked NotFoundError
        expect(res.text).toBe("Can't find /some-invalid-path on this server!");
    });

    it('should not handle a valid route with an error', async () => {
        const publicRouterMock = publicRouter as unknown as jest.Mock;
        publicRouterMock.mockImplementationOnce((req, res, next) => {
            res.status(200).send('OK');
        });

        const res = await request(app).get('/api/public/some-valid-route');
        expect(res.status).toBe(200);
        expect(res.text).toBe('OK');
        expect(errorHandler).not.toHaveBeenCalled();
    });
});