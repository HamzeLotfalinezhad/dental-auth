import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';

export async function update(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  const checkIfUserExist: IAuthDocument | undefined = await getAuthUserByVerificationToken(token);
  if (!checkIfUserExist) {
    throw new BadRequestError('Verification token is either invalid or is already used.', 'VerifyEmail update() method error');
  }
  await updateVerifyEmailField(checkIfUserExist.id!, 1);
  const updatedUser = await getAuthUserById(checkIfUserExist.id!);
  const userData = pick(updatedUser, ['username', 'id']);
  res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: userData });
}
