import { Request, Response } from 'express';
import { authenticationService } from '../services/authentication';
import { CustomAppError, TokenExpiredError } from '../middlewares/errorHandler';
import { RoleType } from '../models/identity';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: "Username and password are required and must be strings." });
    }

    try {
        // Use await to get the resolved token
        const result = await authenticationService.login({ emailOrusername: username, password });
        if (typeof result === 'object' && result !== null && 'token' in result && 'user_id' in result) {
            res.status(200).json(result);
        } else if (typeof result === 'string') {
            const response = { 
                user_id: result,
                useranme: username
            }
            
            res.status(489).json(response)
        }
    } catch(error) {
        if (error instanceof CustomAppError) {
            res.status(error.statusCode).json({ message: error.message })
        }
    }
}

export const register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password || typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: "Username, email, and password are required and must be strings." });
    }

    const role = req.body.role || RoleType.USER;
    const user = {
        username,
        email,
        password,
        role
    };

    try {
        await authenticationService.register(user)
        res.status(200).json({ message: "Account created successfully"})
    } catch (error) {
        if (error instanceof CustomAppError) {
            res.status(error.statusCode).json({ message: error.message })
        }
    }
}

export const validateEmail = async (req: Request, res: Response) => {
    const activationToken = req.query.activation_token as string;
    const email = req.query.email as string;
    const userId = req.query.id as string;

    if (!activationToken || !email) {
        res.status(400).send('Missing activation token or user ID.');
    }

    try {
        const result = await authenticationService.validateEmail(activationToken, email, userId)
        res.status(200).json(result)
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(error.statusCode).json( {message: error.message} )
        }
    }
}

export const validateOtp = async (req: Request, res: Response) => {
    const otp = req.query.otp as string;
    const email = req.query.username as string;
    const userId = req.query.id as string;

    if(!otp || !email || !userId) {
        res.status(400).send('Missing otp or user ID or email');
    }

    try {
        const result = await authenticationService.validateOTP(otp, email, userId)
        res.status(200).json(result)
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(error.statusCode).json( {message: error.message} )
        }
    }
}

export const resendOtp = async (req: Request, res: Response) => {
    const email = req.query.email as string;

    if(!email) {
        res.status(400).send('Missing email');
    }

    await authenticationService.resendOtp(email)

    res.status(200).json({ message: 'OTP sent'})
}

export const resendAccountActivation = async (req: Request, res: Response) => {
    const email = req.query.email as string;
    const userId = req.query.id as string;

    if (!email || !userId) {
        res.status(400).send('Missing email or user ID')
    }

    await authenticationService.resendAccountActivation(userId, email)

    res.status(200).json({ message: 'Account activation email sent'})
}