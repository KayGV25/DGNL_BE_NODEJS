import { Request, Response, NextFunction } from 'express';

declare module "express" {
    interface Request {
        cpuStartUsage?: NodeJS.CpuUsage;
    }
}

const requestLogger = (req: Request, res: Response, next: NextFunction) => {

    req.cpuStartUsage = process.cpuUsage();

    res.locals.errorOccurred = false;
    
    const originalEnd = res.end;
    res.end = ((...args: Parameters<typeof originalEnd>): ReturnType<typeof originalEnd> => {
        if (req.cpuStartUsage && !res.locals.errorOccurred) {
            const cpuDiff = process.cpuUsage(req.cpuStartUsage);
            const totalCpuMicroseconds = cpuDiff.user + cpuDiff.system;
            const totalCpuMilliseconds = (totalCpuMicroseconds / 1000).toFixed(3);

            console.log(
                `[${new Date().toISOString()}]\t${req.method.toUpperCase()}\t${req.originalUrl}\t${req.ip}\t${res.statusCode}\tCPU Time: ${totalCpuMilliseconds} ms`
            );
        }

        return originalEnd(...args);
    }) as typeof res.end;

    next();
};

export default requestLogger;