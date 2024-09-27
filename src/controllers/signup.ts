import crypto from 'crypto';
import { signupSchema } from '@auth/schemes/signup';
import { comparePassword, createAuthUser, getUserByEmail, hashPassword, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthBuyerMessageDetails, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, lowerCase } from '@hamzelotfalinezhad/shared-library';
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
  const { name, email, password, confirmPassword, browserName, deviceType } = req.body;

  // check if user already exist
  const checkIfUserExist: IAuthDocument | null = await getUserByEmail(email);
  if (checkIfUserExist) {
    throw new BadRequestError('Invalid credentials. Email or Username Exists', 'SignUp create() method error');
  }

  //compare password
  const isMatch = comparePassword(password, confirmPassword);
  if(!isMatch) throw new BadRequestError('Password repeat not match', 'SignUp comparePassword() method error');

  const hashedPassword = await hashPassword(password);

  const profilePublicId = uuidV4();

  // create emailVerificationToken
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');

  // create user - add to mysql db
  const authData: IAuthDocument = {
    name: firstLetterUppercase(name),
    email: lowerCase(email),
    phone: "",
    password: hashedPassword,
    profilePublicId,
    role: 'user',
    emailVerificationToken: randomCharacters,
    browserName,
    deviceType
  } as IAuthDocument;
  const result: IAuthDocument = await createAuthUser(authData) as IAuthDocument;
  if(!result) throw new BadRequestError('Error creating user database', 'SignUp create() method error');

  // send this new user to users-service mongodb as a buyer (each created user is also a buyer by default)
  const messageDetailsAuth: IAuthBuyerMessageDetails = {
    authId: String(result._id),
    email: result.email!,
    name: result.name!,
    role: result.role!,
    createdAt: result.createdAt!,
    type: 'auth'
  };
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
  console.log("33333333333333333333333333333333333333333")

  const userJWT: string = signToken(result._id!, result.email!, result.name!, result.role!);

  // The token: userJWT will set to header as a cookie when returns to gateway-service and will not show to user in response object 
  res.status(StatusCodes.CREATED).json({ message: 'User created successfully. Verify your email', token: userJWT });
}
