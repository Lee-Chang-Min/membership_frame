import { User, UserDocument } from "../models/User";
import { EmailVerify } from "../models/EmailVerify";
import { CallbackError, MongooseError } from "mongoose";
export default class UserService {
  findUser = async (email: string): Promise<UserDocument | null> => {
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
      //console.log(user.save());
      return await user.save();
    } catch (error) {
      throw error;
    }
  };

  createEmailVerification = async (
    email: string,
    verificationCode: string,
    expiresAt: Date,
  ): Promise<void> => {
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

  checkEmailVerification = async (email: string, verificationCode: string): Promise<void> => {
    try {
      const latestDocument = await EmailVerify.find({
        email,
        verificationCode,
      })
        .sort({ expiresAt: -1 }) // expiresAt 필드를 기준으로 내림차순 정렬
        .limit(1) // 결과 중 첫 번째 문서만 선택
        .exec(); // 쿼리 실행

      if (latestDocument.length > 0) {
        const document = latestDocument[0];
        // document를 사용한 로직 처리
        console.log(document);
      } else {
        // 일치하는 문서가 없는 경우의 처리
        console.log("No document found");
      }
    } catch (error) {
      throw error;
    }
  };
}
