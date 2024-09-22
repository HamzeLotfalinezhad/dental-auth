import crypto from 'crypto';
import { signupSchema } from '@auth/schemes/signup';
import { createAuthUser, getUserByUsernameOrEmail, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, lowerCase } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { v4 as uuidV4 } from 'uuid';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';

export async function create(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(signupSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
  }
  const { name, email, password, country, browserName, deviceType } = req.body;
  const username = email; // username = email

  // check if user already exist
  const checkIfUserExist: IAuthDocument | undefined = await getUserByUsernameOrEmail(username, email);
  if (checkIfUserExist) {
    throw new BadRequestError('Invalid credentials. Email or Username Exists', 'SignUp create() method error');
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

  // create user - add to mysql db
  const authData: IAuthDocument = {
    username: lowerCase(email), // username = email
    name: firstLetterUppercase(name),
    email: lowerCase(email),
    profilePublicId,
    password,
    country,
    role: 'user',
    emailVerificationToken: randomCharacters,
    browserName,
    deviceType
  } as IAuthDocument;
  const result: IAuthDocument = await createAuthUser(authData) as IAuthDocument;
  if(!result) throw new BadRequestError('Error creating user database', 'SignUp create() method error');

  // send this new user to users-service mongodb as a buyer (each created user is also a buyer by default)
  const messageDetailsAuth = {
    authId: String(result.id),
    username: result.username!,
    email: result.email!,
    name: result.name!,
    role: result.role!,
    country: result.country!,
    createdAt: result.createdAt!,
    type: 'auth'
  };
  console.log(messageDetailsAuth)
  await publishDirectMessage(
    authChannel,
    'dental-buyer-update',
    'user-buyer',
    JSON.stringify(messageDetailsAuth),
    'Buyer details sent to buyer service.'
  );

  // send verification email to notification service with rabbitmq
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: "hamze.t633@gmail.com",//result.email, // TODO  remove my gmail
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

  const userJWT: string = signToken(result.id!, result.email!, result.username!, result.name!, result.role!);

  // The token: userJWT will set to header as a cookie when returns to gateway-service and will not show to user in response object 
  res.status(StatusCodes.CREATED).json({ message: 'User created successfully. Verify your email', token: userJWT });
}
