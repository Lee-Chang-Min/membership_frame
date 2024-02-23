import mongoose from "mongoose";

// Mongoose 스키마와 별도로 TypeScript 인터페이스를 정의하여 코드 내에서 타입 안정성을 확보하는 방법.
export type EmailVerifyDocument = mongoose.Document & {
  email: string;
  verificationCode: string;
  expiresAt: Date;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailVerify:
 *       type: object
 *       required:
 *         - email
 *         - verificationCode
 *         - expiresAt
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 사용자의 이메일 주소
 *         verificationCode:
 *           type: String
 *           description: 이메일 검증을 위한 코드
 *         expiresAt:
 *           type: date
 *           description: 6자리 숫자 코드의 생성시간
 */
const emailVerifySchema = new mongoose.Schema({
  email: { type: String, required: true },
  verificationCode: { type: String, required: true },
  expiresAt: { type: Date, expires: 180, required: true },
});

export const EmailVerify = mongoose.model<EmailVerifyDocument>("EmailVerify", emailVerifySchema);
