import { Pool } from 'pg';
import { sqlConfig } from '../configs/databaseConfig';

const pool = new Pool({
    user: sqlConfig.user,
    password: sqlConfig.password,
    host: sqlConfig.host,
    port: sqlConfig.port,
    database: sqlConfig.database
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit process if there's a critical error
});

export default pool;