import express from 'express';
import { errorHandler, NotFoundError } from './middlewares/errorHandler';
import publicRouter from './routers/public';
import requestLogger from './middlewares/requestLogger';

const app = express();

app.use(express.json())
app.use(requestLogger)

// Routes
app.use('/api/public', publicRouter)

app.all('', (req, res, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(errorHandler);

export default app;