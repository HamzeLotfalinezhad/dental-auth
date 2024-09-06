import crypto from 'crypto';

import { signupSchema } from '@auth/schemes/signup';
import { createAuthUser, getUserByUsernameOrEmail, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, lowerCase } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { v4 as uuidV4 } from 'uuid';
// import { UploadApiResponse } from 'cloudinary';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
// import { BadRequestError } from './error-handler';

export async function create(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(signupSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
  }
  const { username, email, password, country, browserName, deviceType } = req.body;

  
  // check if user already exist
  const checkIfUserExist: IAuthDocument | undefined = await getUserByUsernameOrEmail(username, email);
  if (checkIfUserExist) {
    // res.status(StatusCodes.CONFLICT).json({ message: 'Email or Username Exists' });
    // try {
    throw new BadRequestError('Invalid credentials. Email or Username Exists', 'SignUp create() method error');
    // } catch (error) {
    // console.log('Is instance of CustomeError:', error instanceof CustomeError); // Should be true
    // console.log('Error:', error); // Logs the error details
    // }
  }

  // uplodad profile image to cloudinary
  const profilePublicId = uuidV4();
  // const uploadResult: UploadApiResponse = await uploads(profilePicture, `${profilePublicId}`, true, true) as UploadApiResponse;
  // if (!uploadResult.public_id) {
  //   throw new BadRequestError('File upload error. Try again', 'SignUp create() method error');
  // }

  // create emailVerificationToken
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');

  // create user - add to db
  const authData: IAuthDocument = {
    username: firstLetterUppercase(username),
    email: lowerCase(email),
    profilePublicId,
    password,
    country,
    // profilePicture: uploadResult?.secure_url,
    profilePicture: 'uploadResult?.secure_url',
    emailVerificationToken: randomCharacters,
    browserName,
    deviceType
  } as IAuthDocument;
  const result: IAuthDocument = await createAuthUser(authData) as IAuthDocument;

  // TODO  remove my gmail
  
  // send verification email to notification service with rabbitmq
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: "hamze.t633@gmail.com",//result.email,
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
  
  const userJWT: string = signToken(result.id!, result.email!, result.username!);
  res.status(StatusCodes.CREATED).json({ message: 'User created successfully', token: userJWT });
}
