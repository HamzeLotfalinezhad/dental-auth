import { Application } from 'express';
import { VerifyGatewayRequest } from '@hamzelotfalinezhad/shared-library';
import { authRoutes } from '@auth/routes/auth';
import { currentUserRoutes } from '@auth/routes/current-user';
import { healthRoutes } from '@auth/routes/health';
import { searchRoutes } from '@auth/routes/search';
import { seedRoutes } from '@auth/routes/seed';

const BASE_PATH = '/api/v1/auth';

export function appRoutes(app: Application): void {
  app.use('', healthRoutes());
  app.use(BASE_PATH, searchRoutes()); // search gigs which is in elasticsearch (beside server logs, elasticsearch also will keeps gigs)
  app.use(BASE_PATH, seedRoutes()); // generate fake users in mysql for test and development

  app.use(BASE_PATH, VerifyGatewayRequest, authRoutes());
  app.use(BASE_PATH, VerifyGatewayRequest, currentUserRoutes());
};
