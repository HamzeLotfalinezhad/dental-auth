import { IAuthDocument } from '@hamzelotfalinezhad/shared-library';
import { Model, Schema, model } from 'mongoose';

const authSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    phone: { type: String, required: false, index: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "user" },

    emailVerified: { type: Number, default: 0 },
    emailVerificationToken: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiration: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    browserName: { type: String, default: null },
    deviceType: { type: String, default: null },

    createdAt: { type: Date },
    updatedAt: { type: Date }
  },
  {
    versionKey: false
  }
);

const AuthModel: Model<IAuthDocument> = model<IAuthDocument>('Auth', authSchema, 'Auth');
export { AuthModel };
