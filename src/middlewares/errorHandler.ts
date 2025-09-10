import { NextFunction, Request, Response } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

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

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    // Determine the status code
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (!(err instanceof CustomAppError) || !err.isOperational) {
        statusCode = 500;
        message = 'Something went wrong!';
    }

    res.status(statusCode).json({
        status: 'error', 
        message: message,
    });
};