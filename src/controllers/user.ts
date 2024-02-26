import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { User, UserDocument, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { body, check, validationResult } from "express-validator";
import { MongooseError } from "mongoose";
import moment_tz from "moment-timezone";
import UserService from "../services/userService";
import EmailService from "../util/sendEmail";
import "../config/passport";

export default class UserController {
  userService: UserService;
  emailService: EmailService;

  //생성자
  constructor() {
    this.userService = new UserService();
    this.emailService = new EmailService();
  }
  test = (req: Request, res: Response): void => {
    const email = req.body.email;
    this.userService.findUser(email);
    res.send("success");
  };

  /**
   * Login page.
   * @route GET /login
   */
  getLogin = (req: Request, res: Response): void => {
    if (req.user) {
      return res.redirect("/");
    }
    res.render("account/login", { title: "Login" });
  };

  /**
   * Sign in using email and password.
   * @route POST /login
   */
  postLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await body("email", "Email is not valid").isEmail().run(req);
    await body("password").isLength({ min: 6, max: 20 }).withMessage("비밀번호는 최소 6글자에서 최대 20글자 입니다.").run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());

      return res.redirect("/user/login");
    }

    passport.authenticate("local", (err: Error, user: UserDocument, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash("errors", { msg: info.message });

        return res.redirect("/user/login");
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", { msg: "Success! You are logged in." });
        res.redirect(req.session.returnTo || "/");
      });
    })(req, res, next);
  };

  /**
   * Log out.
   * @route GET /logout
   */
  logout = (req: Request, res: Response, next: NextFunction): void => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  };

  /**
   * Signup page.
   * @route GET /signup
   */
  getSignup = (req: Request, res: Response): void => {
    if (req.user) {
      return res.redirect("/");
    }
    res.render("account/signup", {
      title: "Create Account",
    });
  };

  /**
   * Create a new local account.
   * @route POST /signup
   */
  postSignup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await check("email", "Email is not valid").isEmail().run(req);
    await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
    await check("confirmPassword", "Passwords do not match").equals(req.body.password).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());

      return res.redirect("/signup");
    }

    try {
      const existingUser = await this.userService.findUser(req.body.email);
      if (existingUser) {
        req.flash("errors", { msg: "Account with that email address already exists." });

        return res.redirect("/signup");
      }

      await this.userService.createUser(req.body.email, req.body.password);
      res.redirect("/user/completeSignup");
    } catch (error) {
      console.log("error>", error);
      next(error);
    }
  };

  /**
   * Signup Success page.
   * @route GET /successSignup
   */
  completeSignup = (req: Request, res: Response): void => {
    res.render("account/completeSignup", {
      title: "completeSignup",
    });
  };

  verifySend = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.body.email;

      // 숫자를 문자열로 변환하고, 6자리 미만일 경우 앞을 0으로 채웁니다.
      const verificationCode = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
      const expiresAt = moment_tz().toDate();

      //인증 번호를 만들었으면 DB에 저장 (단 유효기간 3분 TTL)
      await this.userService.createEmailVerification(req.body.email, verificationCode, expiresAt);

      //이메일 발송
      this.emailService.sendVerificationEmail(email, verificationCode);
      res.json({ result: "success" });
    } catch (err) {
      res.json({ result: "fail", err: err });
    }
  };

  verifyCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.query.email as string;
      const code = req.query.code as string;

      //인증번호 DB 조회
      const findCodeReult = await this.userService.checkEmailVerification(email, code);
      if (findCodeReult != null) {
        res.json({ result: "success", log: "verify check pass" });
      } else {
        res.json({ result: "success null", log: "verify check null" });
      }
    } catch (err) {
      res.json({ result: "fail", err: err });
    }
  };

  /**
   * Forgot Password page.
   * @route GET /forgot
   */
  getForgot = (req: Request, res: Response): void => {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    res.render("account/forgot", {
      title: "Forgot Password",
    });
  };
  /**
   * Create a random token, then the send user an email with a reset link.
   * @route POST /forgot
   */
  postForgot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await check("email", "Please enter a valid email address.").isEmail().run(req);
    await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());

      return res.redirect("/user/forgot");
    }

    try {
      const token = crypto.randomBytes(16).toString("hex");
      const { user, error } = await this.userService.updatePasswordToken(req.body.email, token);

      if (error) {
        req.flash("errors", { msg: error });

        return res.redirect("/user/forgot");
      }

      const emailSendResult = await this.emailService.sendForgotPasswordEmail(req.headers.host, token, user);
      req.flash("info", emailSendResult);
      res.redirect("/user/forgot");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset Password page.
   * @route GET /reset/:token
   */
  getReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }

    console.log(req.params);

    try {
      const user = await this.userService.findUserByResetToken(req.params.token);
      if (!user) {
        req.flash("errors", { msg: "암호 재설정 토큰이 잘못되었거나 만료되었습니다." });

        return res.redirect("/user/forgot");
      }
      res.render("account/reset", {
        title: "Password Reset",
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Process the reset password request.
   * @route POST /reset/:token
   */
  postReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await check("password", "Password must be at least 4 characters long.").isLength({ min: 4 }).run(req);
    await check("confirm", "Passwords must match.").equals(req.body.password).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());

      return res.redirect("back");
    }

    const user = await this.userService.resetPassword(req.params.token, req.body.password);
    if (!user) {
      req.flash("errors", { msg: "Password reset token is invalid or has expired." });

      return res.redirect("back");
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      // Send reset password email
      const transporter = nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });

      const mailOptions = {
        to: user.email,
        from: "express-ts@starter.com",
        subject: "Your password has been changed",
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`,
      };

      await transporter.sendMail(mailOptions);
      req.flash("success", { msg: "Success! Your password has been changed." });
      res.redirect("/");
    });
  };
}

/**
 * Update current password.
 * @route POST /account/password
 */
export const postUpdatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("password", "Password must be at least 4 characters long").isLength({ min: 4 }).run(req);
  await check("confirmPassword", "Passwords do not match").equals(req.body.password).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());

    return res.redirect("/account");
  }

  const user = req.user as UserDocument;
  User.findById(user.id, (err: MongooseError, user: UserDocument) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    // user.save((err: WriteError & CallbackError) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   req.flash("success", { msg: "Password has been changed." });
    //   res.redirect("/account");
    // });
  });
};

/**
 * Delete user account.
 * @route POST /account/delete
 */
export const postDeleteAccount = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as UserDocument;
  // User.remove({ _id: user.id }, (err) => {
  //   if (err) {
  //     return next(err);
  //   }
  //   req.logout();
  //   req.flash("info", { msg: "Your account has been deleted." });
  //   res.redirect("/");
  // });
};

/**
 * Unlink OAuth provider.
 * @route GET /account/unlink/:provider
 */
export const getOauthUnlink = (req: Request, res: Response, next: NextFunction): void => {
  const provider = req.params.provider;
  const user = req.user as UserDocument;
  User.findById(user.id, (err: MongooseError, user: any) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter((token: AuthToken) => token.kind !== provider);
    user.save((err: Error) => {
      if (err) {
        return next(err);
      }
      req.flash("info", { msg: `${provider} account has been unlinked.` });
      res.redirect("/account");
    });
  });
};
