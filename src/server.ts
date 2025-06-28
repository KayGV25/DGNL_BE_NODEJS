import app from './app';
import config from './configs/serverConfig';

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});