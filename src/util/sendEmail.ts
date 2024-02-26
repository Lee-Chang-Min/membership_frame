import nodemailer from "nodemailer";
import { User, UserDocument, AuthToken } from "../models/User";
import { log } from "console";

export default class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configuration for the mail server
      // For example, using Gmail
      service: "naver",
      host: "smtp.naver.com",
      port: 465,
      auth: {
        user: "dlckdals224@naver.com",
        pass: "dlckdals12!@",
      },
    });
  }

  sendVerificationEmail = async (to: string, code: string): Promise<void> => {
    const mailOptions = {
      from: "dlckdals224@naver.com",
      to: to,
      subject: "[A2C] 인증코드 안내",
      html: `
            <div style="font-family: 'Arial', sans-serif; color: #333;">
              <h2>[A2C 플랫폼]</h2>
              <p><strong>인증코드를 확인해주세요.</strong></p>
              <p style="font-size: 24px; margin: 16px 0;">${code}</p>
              <p>이메일 인증 절차에 따라 이메일 인증코드를 발급해드립니다. 인증코드는 이메일 발송 시점으로부터 3분동안 유효합니다.</p>
            </div>
          `,
    };

    this.transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        //res.json({ ok: false, msg: " 메일 전송에 실패하였습니다. " });
        console.log(err);
      } else {
        //일단 임시
        //res.json({ ok: true, msg: " 메일 전송에 성공하였습니다. ", authNum: number });
        console.log("Email sent: " + info.response);
      }
    });
  };

  sendForgotPasswordEmail = async (host: string, token: string, user: UserDocument) => {
    const mailOptions = {
      from: "dlckdals224@naver.com",
      to: user.email,
      subject: "[A2C] 비밀번호 초기화 안내",
      html: `
      <div style="font-family: Arial, 'sans-serif'; color: #333;">
        <h2 style="color: #007bff;">A2C 비밀번호 재설정 요청</h2>
        <p>당신의 계정 비밀번호 재설정 요청을 받았기 때문에 이 이메일을 받게 되었습니다.</p>
        <p>다음 링크를 클릭하거나, 브라우저에 붙여넣어 과정을 완료해 주세요:</p>
        <a href="http://${host}/user/reset/${token}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">비밀번호 재설정</a>
        <p>이 요청을 하지 않으셨다면, 이 이메일을 무시하시고 비밀번호는 변하지 않을 것입니다.</p>
      </div>`,
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve({ msg: `${user.email}로 비밀번호 변경 가능한 이메일이 발송되었습니다.` }); // 성공적으로 이메일을 보냈으면, 해당 메시지를 resolve합니다.
        }
      });
    });
  };
}
