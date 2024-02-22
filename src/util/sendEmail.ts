import nodemailer from "nodemailer";

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
}
