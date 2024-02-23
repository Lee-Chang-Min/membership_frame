import { User, UserDocument } from "../models/User";
import { EmailVerify, EmailVerifyDocument } from "../models/EmailVerify";
import { CallbackError, MongooseError, UpdateWriteOpResult } from "mongoose";
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

  updateUserProfile = async (
    userId: string,
    updateData: {
      email: string;
      nickName: string;
      name?: string;
      phoneNumber?: string;
      gender?: string;
      address?: string;
    },
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await User.updateOne<UpdateWriteOpResult>(
        { _id: userId },
        {
          // $set: {
          //   ...(updateData.email && { email: updateData.email }),
          //   ...(updateData.nickName && { nickName: updateData.nickName }),
          //   ...(updateData.name && { "profile.name": updateData.name }),
          //   ...(updateData.phoneNumber && { "profile.phoneNumber": updateData.phoneNumber }),
          //   ...(updateData.gender && { "profile.gender": updateData.gender }),
          //   ...(updateData.address && { "profile.address": updateData.address }),
          // },
          $set: {
            email: updateData.email,
            nickName: updateData.nickName,
            "profile.name": updateData.name,
            "profile.phoneNumber": updateData.phoneNumber,
            "profile.gender": updateData.gender,
            "profile.address": updateData.address,
          },
        },
      );

      if (result.modifiedCount > 0) {
        return { success: true, message: "Profile information has been updated." };
      } else {
        return { success: false, message: "No changes were made to your profile." };
      }
    } catch (error) {
      if (error && error.code === 11000) {
        throw new Error("The email address you have entered is already associated with an account.");
      }
      throw error;
    }
  };
}
