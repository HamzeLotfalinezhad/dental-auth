import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { getAuthUserByOTP, signToken, updatePhoneVerifiedAndStatus } from '@auth/services/auth.service';
import { BadRequestError, IAuthBuyerMessageDetails, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';

export async function updateOTP(req: Request, res: Response): Promise<void> {
  const { otp } = req.params;
  // const { browserName, deviceType } = req.body;
  const checkIfUserExist: IAuthDocument | null = await getAuthUserByOTP(otp);
  if (!checkIfUserExist) {
    throw new BadRequestError('OTP is invalid or expired. Enter valid OTP or Signin again', 'VerifyOTP updateOTP() method error');
  }

  // If it is first time login, then
  if (!checkIfUserExist.phoneVerified) {

    // add user to users-service as a buyer
    const messageDetailsAuth: IAuthBuyerMessageDetails = {
      authId: String(checkIfUserExist._id),
      phone: checkIfUserExist.phone!,
      email: checkIfUserExist.email!,
      name: checkIfUserExist.name!,
      role: checkIfUserExist.role!,
      createdAt: checkIfUserExist.createdAt!,
      type: 'auth'
    };
    await publishDirectMessage(
      authChannel,
      'dental-buyer-update',
      'user-buyer',
      JSON.stringify(messageDetailsAuth),
      'Buyer details sent to buyer service.'
    );

    //update phoneVerified=true
    await updatePhoneVerifiedAndStatus(String(checkIfUserExist._id))
  }

  // await updateUserOTP(checkIfUserExist._id!, '', new Date(), browserName, deviceType);
  const userJWT = signToken(checkIfUserExist._id!, checkIfUserExist.email!, checkIfUserExist.name!, checkIfUserExist.role!);
  // const userData = omit(checkIfUserExist, ['password']);
  const userData = pick(checkIfUserExist, ['username', 'id', 'email', 'name']);
  res.status(StatusCodes.OK).json({ message: 'OTP verified successfully.', user: userData, token: userJWT });
}
