import { User, UserDocument } from "../models/User";
import { EmailVerify, EmailVerifyDocument } from "../models/EmailVerify";
import { CallbackError, MongooseError } from "mongoose";
export default class UserService {
  findUser = async (email: string): Promise<UserDocument> => {
    try {
      const user = User.findOne({ email });

      return user;
    } catch (error) {
      throw error;
    }
  };
  createUser = async (email: string, password: string): Promise<UserDocument> => {
    try {
      const user = new User({ email, password });

      return await user.save();
    } catch (error) {
      throw error;
    }
  };

  createEmailVerification = async (email: string, verificationCode: string, expiresAt: Date): Promise<void> => {
    try {
      // EmailVerify 컬렉션에 저장
      await EmailVerify.create({
        email,
        verificationCode,
        expiresAt,
      });
    } catch (error) {
      throw error;
    }
  };

  checkEmailVerification = async (email: string, verificationCode: string): Promise<EmailVerifyDocument> => {
    try {
      const latestDocument = await EmailVerify.find({
        email,
        verificationCode,
      })
        .sort({ expiresAt: -1 })
        .limit(1)
        .exec();

      return latestDocument[0];
    } catch (error) {
      throw error;
    }
  };

  findUserByResetToken = async (token: string): Promise<UserDocument> => {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  updatePasswordToken = async (email: string, token: string): Promise<{ user: any; error: string | null }> => {
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        return { user: null, error: "해당 계정은 존재하지 않습니다." };
      }

      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  resetPassword = async (token: string, newPassword: string): Promise<UserDocument | null> => {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });
      if (!user) {
        return null;
      }
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  };
}
