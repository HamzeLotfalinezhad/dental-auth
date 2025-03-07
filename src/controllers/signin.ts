// import { randomInt } from 'crypto';

import { loginSchemaByPhone } from '@auth/schemes/signin';
import { createAuthUser, isPhoneExist, updateUserOTP } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pick } from 'lodash';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';

export async function read(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(loginSchemaByPhone.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
  }

  const { phone } = req.body;
  const date: Date = new Date();

  // check if phone exist with phoneVerified=true
  const existingUser: IAuthDocument | null = await isPhoneExist(phone);

  // min 6 digits and max 6 digits
  const otpCode = 12345; //randomInt(10 ** 4, 10 ** 6 - 1); //TODO uncommnet

  if (!existingUser) {
    const authData: IAuthDocument = {
      phone: phone,
      role: 'user'
    } as IAuthDocument;
    const result: IAuthDocument = await createAuthUser(authData) as IAuthDocument;
    if (!result) throw new BadRequestError('Error creating user', 'SignIn create() method error');


    date.setMinutes(date.getMinutes() + 3);
    await updateUserOTP(result._id!, `${otpCode}`, date, "", "");

  } else {
    if (existingUser.otpExpiration && existingUser.otpExpiration > date) {
      throw new BadRequestError('OTP not expired, Enter OTP code', 'SignIn create() method error');
    }
    date.setMinutes(date.getMinutes() + 3);
    await updateUserOTP(existingUser._id!, `${otpCode}`, date, "", "");
  }

  // send SMS with otp
  const messageDetails = {
    receiverPhone: phone,
    otp: `${otpCode}`
  };
  await publishDirectMessage(
    authChannel,
    'dental-sms-notification',
    'auth-sms',
    JSON.stringify(messageDetails),
    'OTP sms message sent to notification service.'
  );

  let userData;
  let message = 'User login successfully. Verify your OTP code';
  userData = pick(existingUser, ['phone']);

  res.status(StatusCodes.OK).json({ message, user: userData });
}

// Signin with username password
// export async function read(req: Request, res: Response): Promise<void> {
//   const { error } = await Promise.resolve(loginSchema.validate(req.body));
//   if (error?.details) {
//     throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
//   }

//   const { username, password, browserName, deviceType } = req.body;
//   const isValidEmail: boolean = isEmail(username);
//   if (!isValidEmail) throw new BadRequestError('Invalid Email', 'SignIn read() method error');

//   // check if user exist
//   const existingUser: IAuthDocument | null = await getUserByEmail(username);
//   if (!existingUser) {
//     throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
//   }

//   // check if password match
//   // const passwordsMatch: boolean = await AuthModel.prototype.comparePassword(password, `${existingUser.password}`);
// const passwordsMatch: boolean = await comparePassword(password, `${existingUser.password}`);
//   if (!passwordsMatch) {
//     throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
//   }

//   let userJWT = '';
//   // let userData: IAuthDocument | null = null;
//   let userData;
//   let message = 'User login successfully';
//   let userBrowserName = '';
//   let userDeviceType = '';

//   const USE_OTP = true; // make this true if you want OTP enabled

//   // if user coming from different browser the send OTP email to verify
//   if (USE_OTP && (browserName !== existingUser.browserName || deviceType !== existingUser.deviceType)) {

//     // min 6 digits and max 6 digits
//     const otpCode = randomInt(10 ** 5, 10 ** 6 - 1);

//     // send email with otp
//     const messageDetails: IEmailMessageDetails = {
//       receiverEmail: 'hamze.t633@gmail.com', //existingUser.email,
//       otp: `${otpCode}`,
//       template: 'otpEmail'
//     };
//     await publishDirectMessage(
//       authChannel,
//       'dental-email-notification',
//       'auth-email',
//       JSON.stringify(messageDetails),
//       'OTP email message sent to notification service.'
//     );
//     message = 'OTP code sent';
//     userBrowserName = `${existingUser.browserName}`;
//     userDeviceType = `${existingUser.deviceType}`;
//     const date: Date = new Date();
//     date.setMinutes(date.getMinutes() + 10);
// await updateUserOTP(existingUser._id!, `${otpCode}`, date, '', '');
//   } else {
//     userJWT = signToken(existingUser._id!, existingUser.email!, existingUser.name!, existingUser.role!);
//     // userData = omit(existingUser, ['password']);
//     userData = pick(existingUser, ['username', 'id', 'name', 'email']);
//   }

//   res.status(StatusCodes.OK).json({ message, user: userData, token: userJWT, browserName: userBrowserName, deviceType: userDeviceType });
// }
