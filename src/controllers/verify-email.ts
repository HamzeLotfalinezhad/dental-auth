import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';

export async function update(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  const checkIfUserExist: IAuthDocument | null = await getAuthUserByVerificationToken(token);
  if (!checkIfUserExist) {
    throw new BadRequestError('Verification token is either invalid or is already used.', 'VerifyEmail update() method error');
  }
  await updateVerifyEmailField(checkIfUserExist._id!, 1);
  const updatedUser = await getAuthUserById(checkIfUserExist._id!);
  const userData = pick(updatedUser, ['username', 'id', 'email', 'name']);
  res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: userData });
}
