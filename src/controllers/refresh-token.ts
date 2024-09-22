import { getUserByUsername, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';

export async function token(req: Request, res: Response): Promise<void> {
  // check if email is for same user who loggedin already
  if (req.currentUser?.username !== req.params.username) throw new BadRequestError("Email does not blog to current user!!", "Gateway token() method")
  const existingUser: IAuthDocument | undefined = await getUserByUsername(req.params.username);
  const userJWT: string = signToken(existingUser!.id!, existingUser!.email!, existingUser!.username!, existingUser!.name!, existingUser!.role!);
  const userData = pick(existingUser, ['username', 'id', 'email', 'name']);
  res.status(StatusCodes.OK).json({ message: 'Refresh token', user: userData, token: userJWT });
}
