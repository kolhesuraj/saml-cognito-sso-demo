/**
 * Db config details
 *
 */
import 'dotenv/config';

export default {
  password: process.env.DB_PASS,
  username: process.env.DB_USER,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
};
