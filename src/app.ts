import express from 'express';
import cors from 'cors';
import { errorHandler, NotFoundError } from './middlewares/errorHandler';
import publicRouter from './routers/public';
import requestLogger from './middlewares/requestLogger';
import { setupSwaggerDocs } from './swagger';
import { authorize } from './middlewares/authorization';
import authenticatedRouter from './routers/authenticated';
import corsConfig from './configs/corsConfig';

const app = express();

app.use(cors(corsConfig))

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger)

// Routes
app.use('/api/public', publicRouter)
app.use('/api/auth', authorize(), authenticatedRouter)

setupSwaggerDocs(app)

app.use((req, res, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(errorHandler);

export default app;