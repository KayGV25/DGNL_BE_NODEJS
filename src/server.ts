import app from './app';
import config, { isDev } from './configs/serverConfig';
import { connectToRedis } from './database/redis';
import { emailService } from './services/email';

app.listen(config.port, async () => {
    const message = isDev
        ? `Server is running at http://localhost:${config.port}`
        : `Server is running on port ${config.port}`;
    console.log(message);
    await setupService()
    console.log('Database and Redis connection is initiated')
});

async function setupService(): Promise<void> {
    connectToRedis();
    emailService.init()
}