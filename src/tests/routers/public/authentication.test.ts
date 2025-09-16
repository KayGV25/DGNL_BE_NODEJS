import request from 'supertest';
import express from 'express';
import authenticationRouter from '../../../routers/public/authentication'; // Adjust the import path
import { login, register, resendAccountActivation, resendOtp, validateEmail, validateOtp } from '../../../controllers/authentication';

jest.mock('../../../controllers/authentication', () => ({
    login: jest.fn((req, res) => res.status(200).send("Login successful")),
    register: jest.fn((req, res) => res.status(201).send("Registration successful")),
    resendAccountActivation: jest.fn((req, res) => res.status(200).send("Activation email resent")),
    resendOtp: jest.fn((req, res) => res.status(200).send("OTP resent")),
    validateEmail: jest.fn((req, res) => res.status(200).send("Email validated")),
    validateOtp: jest.fn((req, res) => res.status(200).send("OTP validated")),
}));

// Mock the rateLimit middleware to always call next()
jest.mock('express-rate-limit', () => {
    return jest.fn(() => (req: any, res: any, next: any) => next());
});

describe('authenticationRouter', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json()); // Needed to parse request body for POST tests
        app.use(authenticationRouter);
        jest.clearAllMocks();
    });

    // Test Case 1: GET /activate_email
    it('should call the validateEmail controller on GET /activate_email', async () => {
        const res = await request(app).get('/activate_email');
        expect(res.status).toBe(200);
        expect(res.text).toBe("Email validated");
        expect(validateEmail).toHaveBeenCalledTimes(1);
    });

    // Test Case 2: GET /validate_otp
    it('should call the validateOtp controller on GET /validate_otp', async () => {
        const res = await request(app).get('/validate_otp');
        expect(res.status).toBe(200);
        expect(res.text).toBe("OTP validated");
        expect(validateOtp).toHaveBeenCalledTimes(1);
    });

    // Test Case 3: GET /resend_otp
    it('should call the resendOtp controller on GET /resend_otp', async () => {
        const res = await request(app).get('/resend_otp');
        expect(res.status).toBe(200);
        expect(res.text).toBe("OTP resent");
        expect(resendOtp).toHaveBeenCalledTimes(1);
    });

    // Test Case 4: GET /resend_account_activation
    it('should call the resendAccountActivation controller on GET /resend_account_activation', async () => {
        const res = await request(app).get('/resend_account_activation');
        expect(res.status).toBe(200);
        expect(res.text).toBe("Activation email resent");
        expect(resendAccountActivation).toHaveBeenCalledTimes(1);
    });

    // Test Case 5: POST /login
    it('should call the login controller on POST /login', async () => {
        const res = await request(app).post('/login').send({ username: 'testuser', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.text).toBe("Login successful");
        expect(login).toHaveBeenCalledTimes(1);
    });

    // Test Case 6: POST /register
    it('should call the register controller on POST /register', async () => {
        const res = await request(app).post('/register').send({ email: 'test@example.com' });
        expect(res.status).toBe(201);
        expect(res.text).toBe("Registration successful");
        expect(register).toHaveBeenCalledTimes(1);
    });

    // Test Case 7: Unconfigured route
    it('should return 404 for an unconfigured route', async () => {
        const res = await request(app).get('/non-existent-route');
        expect(res.status).toBe(404);
    });
});