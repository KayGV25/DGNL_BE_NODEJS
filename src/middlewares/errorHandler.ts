import { NextFunction, Request, Response } from 'express';
import { AppError } from '../interfaces/handler';

// Basic custom Error to extend
export class CustomAppError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name; 
        Error.captureStackTrace(this, this.constructor); 
    }
}

// Specific error types
export class BadRequestError extends CustomAppError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

export class NotFoundError extends CustomAppError {
    constructor(message: string = "Resource not found") {
        super(message, 404);
    }
}

export class UnauthorizedError extends CustomAppError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenError extends CustomAppError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

export class ConnectionError extends CustomAppError {
    constructor(message: string = "Connection Error") {
        super(message, 503)
    }
}

export class ExpiredError extends CustomAppError {
    constructor(message: string = "Expired") {
        super(message, 410)
    }
}

export class TokenNotFoundError extends CustomAppError {
    constructor(message: string = "Token not found") {
        super(message, 404);
    }
}

export class TokenExpiredError extends CustomAppError {
    constructor(message: string = "Token expired") {
        super(message, 410)
    }
}

export class ConflictError extends CustomAppError {
    constructor(message: string = "Conflicted") {
        super(message, 409);
    }
}

export class AccountNotEnableError extends CustomAppError {
    constructor(message: string = "Account not enabled") {
        super(message, 401)
    }
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.locals.errorOccurred = true; 

    // Determine the status code
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (!(err instanceof CustomAppError) || !err.isOperational) {
        statusCode = 500;
        message = 'Something went wrong!';
    }
    console.log(
        `[${new Date().toISOString()}]\t${req.method.toUpperCase()}\t${req.originalUrl}\t${req.ip}\t${statusCode}\t${err.name}\t${err.message}`
    );
    res.status(statusCode).json({
        status: 'error', 
        message: message,
    });
};