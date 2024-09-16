import crypto from 'crypto';

import { getAuthUserById, getUserByEmail, updateRole, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, lowerCase } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { pick } from 'lodash';

export async function read(req: Request, res: Response): Promise<void> {
  let user = null;
  const existingUser: IAuthDocument | undefined = await getAuthUserById(req.currentUser!.id);
  if (Object.keys(existingUser!).length) {
    user = existingUser;
  }
  user = pick(existingUser, ['username', 'id', 'role']);
  res.status(StatusCodes.OK).json({ message: 'Authenticated user', user });
}

export async function resendEmail(req: Request, res: Response): Promise<void> {
  const { email, userId } = req.body;
  const checkIfUserExist: IAuthDocument | undefined = await getUserByEmail(lowerCase(email));
  if (!checkIfUserExist) {
    throw new BadRequestError('Email is invalid', 'CurrentUser resentEmail() method error');
  }
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
  await updateVerifyEmailField(parseInt(userId), 0, randomCharacters);
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: lowerCase(email),
    verifyLink: verificationLink,
    template: 'verifyEmail'
  };
  await publishDirectMessage(
    authChannel,
    'dental-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Verify email message has been sent to notification service.'
  );
  const updatedUser = await getAuthUserById(parseInt(userId));
  res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser });
}

export async function changeRole(req: Request, res: Response): Promise<void> {

  await updateRole(Number(req.body.id), req.body.email, req.body.role);

  let user = null;
  const existingUser: IAuthDocument | undefined = await getAuthUserById(req.body.id);
  if (Object.keys(existingUser!).length) {
    user = existingUser;
  }
  user = pick(existingUser, ['username', 'id', 'role', 'email']);

  if (user.role !== req.body.role) throw new BadRequestError('Error updating user role', 'CurrentUser changeRole() method error');
  // const userJWT: string = signToken(user.id!, user.email!, user.username!, user.role!);

  const messageDetails = {
    authId: user.id,
    email: user.email!,
    role: user.role,
    type: 'role'
  };
  await publishDirectMessage(
    authChannel,
    'dental-buyer-update',
    'user-buyer',
    JSON.stringify(messageDetails),
    'Buyer details sent to buyer service.'
  );

  res.status(StatusCodes.OK).json({ message: 'User Role updated successfully', user: user });
}
