import crypto from 'crypto';

import { createAuthUser, getUserByEmail } from '@auth/services/auth.service';
import { faker } from '@faker-js/faker';
import { BadRequestError, IAuthDocument, firstLetterUppercase, lowerCase } from '@hamzelotfalinezhad/shared-library';
import { Request, Response } from 'express';
import { generateUsername } from 'unique-username-generator';
import { v4 as uuidV4 } from 'uuid';
import { sample } from 'lodash';
import { StatusCodes } from 'http-status-codes';

export async function create(req: Request, res: Response): Promise<void> {
  const { count } = req.params;
  const usernames: string[] = [];
  for (let i = 0; i < parseInt(count, 10); i++) {
    const username: string = generateUsername('', 0, 12);
    usernames.push(firstLetterUppercase(username));
  }

  // generating fake users in mysql for testing and development
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    const email = faker.internet.email();
    const password = 'qwerty';
    // const country = faker.location.country();
    // const profilePicture = faker.image.urlPicsumPhotos();
    const role = "user";
    const browserName = 'googleChrome';
    const checkIfUserExist: IAuthDocument | null = await getUserByEmail(email);

    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials. Email or Username', 'Seed create() method error');
    }

    const profilePublicId = uuidV4();
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const authData: IAuthDocument = {
      name: firstLetterUppercase(username),
      email: lowerCase(email),
      profilePublicId,
      password,
      role,
      emailVerificationToken: randomCharacters,
      emailVerified: sample([0, 1]),
      browserName: browserName,
      deviceType: 'phone'
    } as IAuthDocument;
    const response = await createAuthUser(authData);
    if (!response) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Seed users not created' });
      throw new BadRequestError('Seed not created', 'Seed create() method error');
    }
  }
  res.status(StatusCodes.OK).json({ message: 'Seed users created successfully.' });
}
