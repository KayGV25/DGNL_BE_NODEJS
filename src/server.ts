import app from './app';
import config from './configs/serverConfig';

const isDev = config.nodeEnv === 'development';

app.listen(config.port, () => {
     const message = isDev
        ? `Server is running at http://localhost:${config.port}`
        : `Server is running on port ${config.port}`;
    console.log(message);
});