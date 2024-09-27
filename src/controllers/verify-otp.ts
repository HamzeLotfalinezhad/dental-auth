import { getAuthUserByOTP, signToken, updateUserOTP } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';

export async function updateOTP(req: Request, res: Response): Promise<void> {
  const { otp } = req.params;
  const { browserName, deviceType } = req.body;
  const checkIfUserExist: IAuthDocument | null = await getAuthUserByOTP(otp);
  if (!checkIfUserExist) {
    throw new BadRequestError('OTP is invalid.', 'VerifyOTP updateOTP() method error');
  }
  await updateUserOTP(checkIfUserExist._id!, '', new Date(), browserName, deviceType);
  const userJWT = signToken(checkIfUserExist._id!, checkIfUserExist.email!, checkIfUserExist.name!, checkIfUserExist.role!);
  // const userData = omit(checkIfUserExist, ['password']);
  const userData = pick(checkIfUserExist, ['username', 'id', 'email', 'name']);
  res.status(StatusCodes.OK).json({ message: 'OTP verified successfully.', user: userData, token: userJWT });
}
