import { CorsOptions } from "cors"
import { isDev } from "./serverConfig"

const allowedOrigins: string[] = [
    // TODO: Add origins here when available
]

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        if (isDev) {
            callback(null, true);
            return
        }

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
    ],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600, // Cache preflight requests for 10 minutes
    optionsSuccessStatus: 204, // Some legacy browsers choke on 204
}

export default corsConfig;