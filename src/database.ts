import { winstonLogger } from '@hamzelotfalinezhad/shared-library';
import { Logger } from 'winston';
import { config } from '@auth/config';
import mongoose from 'mongoose';
// import { Sequelize } from 'sequelize';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

const databaseConnection = async (): Promise<void> => {
  try {
    await mongoose.connect(`${config.DATABASE_URL}`);
    log.info('Auth service successfully connected to database.');
  } catch (error) {
    log.log('error', 'AuthService databaseConnection() method error:', error);
  }
};

export { databaseConnection };



//************************************* */ mysql
// export const sequelize: Sequelize = new Sequelize(config.MYSQL_DB!,  {
//   dialect: 'mysql',
//   logging: false,
//   dialectOptions: {
//     multipleStatements: true
//   }
// });

// export async function databaseConnection(): Promise<void> {
//   try {
//     await sequelize.authenticate();
//     log.info('AuthService Mysql database connection has been established successfully.');
//   } catch (error) {
//     log.error('Auth Service - Unable to connect to database.');
//     log.log('error', 'AuthService databaseConnection() method error:', error);
//   }
// }
