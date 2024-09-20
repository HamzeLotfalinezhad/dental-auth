import http from 'http';

import 'express-async-errors';
import { CustomeError, IAuthPayload, IErrorResponse, winstonLogger } from '@hamzelotfalinezhad/shared-library';
import { Logger } from 'winston';
import { config } from '@auth/config';
import { Application, Request, Response, NextFunction, json, urlencoded } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import compression from 'compression';
import { checkConnection, createIndex } from '@auth/elasticsearch';
import { appRoutes } from '@auth/routes';
import { Channel } from 'amqplib';
import { createConnection } from '@auth/queues/connection';
// import { CustomeError } from './controllers/error-handler';

const SERVER_PORT = 4003;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authenticationServer', 'debug');

export let authChannel: Channel;

export function start(app: Application): void {
  securityMiddleware(app); // the frontend JWT_TOKEN will be verified in here 
  standardMiddleware(app);
  routesMiddleware(app); // the API_GATEWAY_TOKEN will be verified in here 
  startQueues();
  startElasticSearch();
  authErrorHandler(app);
  startServer(app);
}

function securityMiddleware(app: Application): void {
  app.set('trust proxy', 1);
  app.use(hpp());
  app.use(helmet());
  app.use(
    cors({
      origin: config.API_GATEWAY_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
  );

  // verify JWT_TOKEN coming from user frontend
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const payload: IAuthPayload = verify(token, config.JWT_TOKEN!) as IAuthPayload;
      req.currentUser = payload;
    }
    next();
  });
}

function standardMiddleware(app: Application): void {
  app.use(compression());
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
}

function routesMiddleware(app: Application): void {
  appRoutes(app);
}

async function startQueues(): Promise<void> {
  authChannel = await createConnection() as Channel;
}

function startElasticSearch(): void {
  checkConnection();
  createIndex('gigs');
}

function authErrorHandler(app: Application): void {
  app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
    console.log('00000000000000000000000000000');
    console.log('Error type:', error.constructor.name);
    console.log('Error keys:', Object.keys(error));
    console.log('Error prototype:', Object.getPrototypeOf(error));
    console.log('00000000000000000000000000000');
    console.log("instanceof CustomeError ", error instanceof CustomeError)
    log.log('error', `AuthService ${error.comingFrom}:`, error); 

    if (error instanceof CustomeError) { 
      return res.status(error.statusCode).json(error.serializeErrors());
    }

    if (error instanceof Error) { 
      return res.status(500).json(error);
    }

    next();
  });
}

function startServer(app: Application): void {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`Authentication server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Authentication server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'AuthService startServer() method error:', error);
  }
}
