import { Sequelize, Transaction } from 'sequelize';
import { createNamespace } from 'cls-hooked';
import config from './db.js';

const namespace = createNamespace('my-namespace');
Sequelize.useCLS(namespace);

const tls = {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false,
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  schema: config.schema || 'public',
  ...(process.env.NODE_ENV === 'production' ? tls : {}),
});

try {
  await sequelize.authenticate();
  console.log('Database connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
