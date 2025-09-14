import { Request, Response, NextFunction } from 'express';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}]\t${req.method.toUpperCase()}\t${req.originalUrl} from ${req.ip}`);
    next();
};

export default requestLogger;