import mongoose from "mongoose";

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

export const EmailVerify = mongoose.model("EmailVerify", emailVerifySchema);
