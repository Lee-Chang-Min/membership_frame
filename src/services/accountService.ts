import { User, UserDocument } from "../models/User";
import { MongooseError, UpdateWriteOpResult } from "mongoose";

interface Ipassword {
  newpassword: string;
  nowpassword: string;
  confirmpassword: string;
}
export default class AccountService {
  updateUserProfile = async (
    userId: string,
    updateData: {
      email: string;
      nickname: string;
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
          $set: {
            email: updateData.email,
            nickname: updateData.nickname,
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

  updatePassword = async (userid: string, data: Ipassword) => {
    try {
      const user = await User.findById(userid);
      if (!user) {
        throw new Error("User not found");
      }

      user.comparePassword(data.nowpassword, async (err, isMatch) => {
        if (err) {
          // 오류 처리
          throw err;
        }
        if (!isMatch) {
          return false;
        }

        user.password = data.newpassword;
        await user.save();

        return true;
      });
    } catch (error) {
      throw error;
    }
  };
}
