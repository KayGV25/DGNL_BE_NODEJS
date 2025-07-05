import app from './app';
import config from './configs/serverConfig';
import { connectToRedis } from './database/redis';

const isDev = config.nodeEnv === 'development';

app.listen(config.port, async () => {
    const message = isDev
        ? `Server is running at http://localhost:${config.port}`
        : `Server is running on port ${config.port}`;
    console.log(message);
    await connectToRedis();
    console.log('Database and Redis connection is initiated')
});