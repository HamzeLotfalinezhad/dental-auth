import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { IAuthBuyerMessageDetails, IAuthDocument, firstLetterUppercase, lowerCase, winstonLogger } from '@hamzelotfalinezhad/shared-library';
import { sign } from 'jsonwebtoken';
import { omit } from 'lodash';
import { Model, Op } from 'sequelize';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authService', 'debug');

// The undefined part of the return type can be used to signify that the function might fail 
// or that there is a scenario where an IAuthDocument is not available or cannot be created. For example:
export async function createAuthUser(data: IAuthDocument): Promise<IAuthDocument | undefined> {
  try {
    // create user - add to db
    const result: Model = await AuthModel.create(data);

    // also send this new user to users-service mongodb as a buyer (each created user is also a buyer by default)
    const messageDetails: IAuthBuyerMessageDetails = {
      authId: result.dataValues.id,
      username: result.dataValues.username!,
      email: result.dataValues.email!,
      role: result.dataValues.role!,
      country: result.dataValues.country!,
      createdAt: result.dataValues.createdAt!,
      type: 'auth'
    };
    await publishDirectMessage(
      authChannel,
      'dental-buyer-update',
      'user-buyer',
      JSON.stringify(messageDetails),
      'Buyer details sent to buyer service.'
    );

    const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;

    return userData;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserById(authId: number): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: { id: authId },
      attributes: {
        exclude: ['password']
      }
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: {
        [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
      },
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getUserByUsername(username: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: { username: firstLetterUppercase(username) },
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getUserByEmail(email: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: { email: lowerCase(email) },
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: { emailVerificationToken: token },
      attributes: {
        exclude: ['password']
      }
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: {
        [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
      },
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function getAuthUserByOTP(otp: string): Promise<IAuthDocument | undefined> {
  try {
    const user: Model = await AuthModel.findOne({
      where: {
        [Op.and]: [{ otp }, { otpExpiration: { [Op.gt]: new Date() } }]
      },
    }) as Model;
    return user?.dataValues;
  } catch (error) {
    log.error(error);
  }
}

export async function updateVerifyEmailField(authId: number, emailVerified: number, emailVerificationToken?: string): Promise<void> {
  try {
    await AuthModel.update(
      !emailVerificationToken ? {
        emailVerified
      } : {
        emailVerified,
        emailVerificationToken
      },
      { where: { id: authId } },
    );
  } catch (error) {
    log.error(error);
  }
}

export async function updatePasswordToken(authId: number, token: string, tokenExpiration: Date): Promise<void> {
  try {
    await AuthModel.update(
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      },
      { where: { id: authId } },
    );
  } catch (error) {
    log.error(error);
  }
}

export async function updatePassword(authId: number, password: string): Promise<void> {
  try {
    await AuthModel.update(
      {
        password,
        passwordResetToken: '',
        passwordResetExpires: new Date()
      },
      { where: { id: authId } },
    );
  } catch (error) {
    log.error(error);
  }
}

export async function updateUserOTP(authId: number, otp: string, otpExpiration: Date, browserName: string, deviceType: string): Promise<void> {
  try {
    await AuthModel.update(
      {
        otp,
        otpExpiration,
        ...(browserName.length > 0 && { browserName }),
        ...(deviceType.length > 0 && { deviceType })
      },
      { where: { id: authId } }
    );
  } catch (error) {
    log.error(error);
  }
}

export function signToken(id: number, email: string, username: string, role: String): string {
  return sign(
    {
      id,
      email,
      username,
      role
    },
    config.JWT_TOKEN!
  );
}

export async function updateRole(id: Number, email: string, role: String): Promise<void> {
  try {
    await AuthModel.update(
      {
        role,
      },
      { where: { id: id, email: email } }
    );
  } catch (error) {
    log.error(error);
  }
}