
import { changeRole, read, resendEmail } from '@auth/controllers/current-user';
import { token } from '@auth/controllers/refresh-token';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  router.get('/refresh-token/:username', token);
  router.get('/currentuser', read);
  router.post('/resend-email', resendEmail);
  router.post('/update-role', changeRole); //TODO only master-admin can do this

  return router;
}
