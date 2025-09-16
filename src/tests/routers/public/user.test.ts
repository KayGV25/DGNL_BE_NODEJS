import request from 'supertest';
import express from 'express';
import userRouter from '../../../routers/public/user'; // Adjust the import path as needed
import { getUserById } from '../../../controllers/user';

// Mock the controller function
jest.mock('../../../controllers/user', () => ({
    getUserById: jest.fn((req, res) => res.status(200).json({ id: req.params.id, name: 'Test User' }))
}));

describe('userRouter', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/users', userRouter); // Mount the router on a base path
        jest.clearAllMocks();
    });

    // Test Case 1: GET /:id route
    it('should call the getUserById controller on GET /:id with the correct parameter', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        const res = await request(app).get(`/users/${userId}`);

        // Assertions
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: userId, name: 'Test User' });
        expect(getUserById).toHaveBeenCalledTimes(1);
        expect(getUserById).toHaveBeenCalledWith(
            expect.objectContaining({ params: { id: userId } }),
            expect.anything(),
            expect.anything()
        );
    });

    // Test Case 2: Unconfigured route (Negative Test)
    it('should return 404 for a route that is not configured', async () => {
        const res = await request(app).get('/users/some-other-path/not-supported-path');
        expect(res.status).toBe(404);
        expect(getUserById).not.toHaveBeenCalled();
    });
});