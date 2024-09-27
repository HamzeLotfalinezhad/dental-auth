import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { sign } from 'jsonwebtoken';
import { ObjectId } from 'mongoose';
// import { Logger } from 'winston';
import bcrypt from 'bcryptjs';

// const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authService', 'debug');

// The undefined part of the return type can be used to signify that the function might fail 
// or that there is a scenario where an IAuthDocument is not available or cannot be created. For example:
export async function createAuthUser(data: IAuthDocument): Promise<IAuthDocument | undefined> {
  const result: IAuthDocument = await AuthModel.create(data);
  return result;
}

export async function getAuthUserById(id: string | ObjectId): Promise<IAuthDocument | null> {
  const result: IAuthDocument | null = await AuthModel.findOne({ _id: id }, '-pasword');
  return result;
}

export async function getUserByEmail(email: string): Promise<IAuthDocument | null> {
  const result: IAuthDocument | null = await AuthModel.findOne({ email: email }, '-pasword');
  return result;
}

export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | null> {
  const result: IAuthDocument | null = await AuthModel.findOne({ emailVerificationToken: token }, '-pasword');
  return result;
}

export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | null> {
  const result: IAuthDocument | null = await AuthModel.findOne(
    {
      $and: [{
        passwordResetToken: token
      }, {
        passwordResetExpires: { $gte: new Date() }
      }]
    },
    '-pasword');
  return result;
}

export async function getAuthUserByOTP(otp: string): Promise<IAuthDocument | null> {
  const result: IAuthDocument | null = await AuthModel.findOne(
    {
      $and: [{
        otp: otp
      }, {
        otpExpiration: { $gte: new Date() }
      }]
    },
    '-pasword');
  return result;
}

export async function updateVerifyEmailField(id: string | ObjectId, emailVerified: number, emailVerificationToken?: string): Promise<void> {
  try {
    const updateFields = !emailVerificationToken ?
      { emailVerified } :
      { emailVerified, emailVerificationToken };
    const result = await AuthModel.updateOne({ _id: id }, updateFields);
    console.log(result)
    // if (result.nModified > 0) {
    //   return true
    // }else{
    //   return false
    // }
  } catch (error) {
    console.log(error)
    // return false
  }
}

export async function updatePasswordToken(id: string | ObjectId, token: string, tokenExpiration: Date): Promise<void> {
  try {
    await AuthModel.updateOne(
      { _id: id },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      }
    );
  } catch (error) {
    console.error('Update failed:', error);
  }
}

export async function updatePassword(id: string | ObjectId, password: string): Promise<void> {
  try {
    await AuthModel.updateOne(
      { _id: id },
      {
        password,
        passwordResetToken: '',
        passwordResetExpires: new Date()
      }
    );
  } catch (error) {
    console.error('Update failed:', error);
  }
}

export async function updateUserOTP(id: string | ObjectId, otp: string, otpExpiration: Date, browserName: string, deviceType: string): Promise<void> {
  try {
    await AuthModel.updateOne(
      { _id: id },
      {
        otp,
        otpExpiration,
        ...(browserName.length > 0 && { browserName }), // Conditionally include browserName
        ...(deviceType.length > 0 && { deviceType })    // Conditionally include deviceType
      }
    );
  } catch (error) {
    console.error('Update failed:', error);
  }

}

export async function updateRole(id: Number, email: string, role: String): Promise<void> {
  try {
    await AuthModel.updateOne(
      { _id: id, email: email },
      { role }
    );
  } catch (error) {
    console.error('Update failed:', error);
  }
}

export function signToken(id: string | ObjectId, email: string, name: string, role: String): string {
  return sign(
    {
      id,
      email,
      name,
      role
    },
    config.JWT_TOKEN!
  );
}


export async function hashPassword(password: string) {
  try {
    const salt = await bcrypt.genSalt(10);    // Generate a salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

export async function comparePassword(plainPassword: string, hashedPassword: string) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword); // Compare the passwords
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    return false
  }
}

export function validatePasswords(password: string, repeatedPassword: string) {
  if (password === repeatedPassword) {
    return true; // Passwords match
  } else {
    return false; // Passwords do not match
  }
}