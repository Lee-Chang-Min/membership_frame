import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { User, UserDocument, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { body, check, validationResult } from "express-validator";
import { CallbackError, MongooseError } from "mongoose";
import { log } from "console";
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
    await body("password")
      .isLength({ min: 6, max: 20 })
      .withMessage("비밀번호는 최소 6글자에서 최대 20글자 입니다.")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/)
      .withMessage("최소 1개의 영문자 및 숫자가 포함되어야 합니다.")
      .run(req);

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


  verifyEmail = () => {
    console.log("1단계");
    console.log("2단계");

    //1. email 과 6자리 인증번호를 만드는 함수 필요함
    const To_email = "cmlee@goldenplanet.co.kr";
    const verificationCode = 123456;

    //인증 번호를 만들었으면 DB에 저장해야하는 부분 (단 유효기간 3분 프로시저)
    //model 만들고 service insert 하는 부분 service 로 빼야함

    //이메일 발송 
    this.emailService.sendVerificationEmail(To_email, verificationCode);

  };


}

/**
 * Profile page.
 * @route GET /account
 */
export const getAccount = (req: Request, res: Response): void => {
  res.render("account/profile", {
    title: "Account Management",
  });
};

/**
 * Update profile information.
 * @route POST /account/profile
 */
export const postUpdateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("email", "Please enter a valid email address.").isEmail().run(req);
  await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

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
    user.email = req.body.email || "";
    user.profile.name = req.body.name || "";
    user.profile.gender = req.body.gender || "";
    user.profile.location = req.body.location || "";
    user.profile.website = req.body.website || "";
    // user.save((err: WriteError & CallbackError) => {
    //   if (err) {
    //     if (err.code === 11000) {
    //       req.flash("errors", {
    //         msg: "The email address you have entered is already associated with an account.",
    //       });
    //       return res.redirect("/account");
    //     }
    //     return next(err);
    //   }
    //   req.flash("success", { msg: "Profile information has been updated." });
    //   res.redirect("/account");
    // });
  });
};

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
    user.save((err: WriteError) => {
      if (err) {
        return next(err);
      }
      req.flash("info", { msg: `${provider} account has been unlinked.` });
      res.redirect("/account");
    });
  });
};

/**
 * Reset Password page.
 * @route GET /reset/:token
 */
export const getReset = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  // User.findOne({ passwordResetToken: req.params.token })
  //   .where("passwordResetExpires")
  //   .gt(Date.now())
  //   .exec((err, user) => {
  //     if (err) {
  //       return next(err);
  //     }
  //     if (!user) {
  //       req.flash("errors", { msg: "Password reset token is invalid or has expired." });
  //       return res.redirect("/forgot");
  //     }
  //     res.render("account/reset", {
  //       title: "Password Reset",
  //     });
  //   });
};

/**
 * Process the reset password request.
 * @route POST /reset/:token
 */
export const postReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("password", "Password must be at least 4 characters long.").isLength({ min: 4 }).run(req);
  await check("confirm", "Passwords must match.").equals(req.body.password).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("back");
  }

  async.waterfall(
    [
      function resetPassword(done: (err: any, user: UserDocument) => void) {
        // User.findOne({ passwordResetToken: req.params.token })
        //   .where("passwordResetExpires")
        //   .gt(Date.now())
        //   .exec((err, user: any) => {
        //     if (err) {
        //       return next(err);
        //     }
        //     if (!user) {
        //       req.flash("errors", { msg: "Password reset token is invalid or has expired." });
        //       return res.redirect("back");
        //     }
        //     user.password = req.body.password;
        //     user.passwordResetToken = undefined;
        //     user.passwordResetExpires = undefined;
        //     user.save((err: WriteError) => {
        //       if (err) {
        //         return next(err);
        //       }
        //       req.logIn(user, (err) => {
        //         done(err, user);
        //       });
        //     });
        //   });
      },
      function sendResetPasswordEmail(user: UserDocument, done: (err: Error) => void) {
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
        transporter.sendMail(mailOptions, (err) => {
          req.flash("success", { msg: "Success! Your password has been changed." });
          done(err);
        });
      },
    ],
    (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    },
  );
};

/**
 * Forgot Password page.
 * @route GET /forgot
 */
export const getForgot = (req: Request, res: Response): void => {
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
export const postForgot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await check("email", "Please enter a valid email address.").isEmail().run(req);
  await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("errors", errors.array());
    return res.redirect("/forgot");
  }

  async.waterfall(
    [
      function createRandomToken(done: (err: Error, token: string) => void) {
        crypto.randomBytes(16, (err, buf) => {
          const token = buf.toString("hex");
          done(err, token);
        });
      },
      function setRandomToken(
        token: AuthToken,
        done: (err: NativeError | WriteError, token?: AuthToken, user?: UserDocument) => void,
      ) {
        User.findOne({ email: req.body.email }, (err: NativeError, user: any) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            req.flash("errors", { msg: "Account with that email address does not exist." });
            return res.redirect("/forgot");
          }
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user.save((err: WriteError) => {
            done(err, token, user);
          });
        });
      },
      function sendForgotPasswordEmail(token: AuthToken, user: UserDocument, done: (err: Error) => void) {
        const transporter = nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD,
          },
        });
        const mailOptions = {
          to: user.email,
          from: "hackathon@starter.com",
          subject: "Reset your password on Hackathon Starter",
          text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };
        transporter.sendMail(mailOptions, (err) => {
          req.flash("info", { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
          done(err);
        });
      },
    ],
    (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/forgot");
    },
  );
};
