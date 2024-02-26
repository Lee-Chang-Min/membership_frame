import { Request, Response, NextFunction } from "express";
import { User, UserDocument, AuthToken } from "../models/User";
import { body, check, validationResult } from "express-validator";
import crypto from "crypto";
import AccountService from "../services/accountService";
import EmailService from "../util/sendEmail";
import { log } from "console";

export default class AccountController {
  accountService: AccountService;
  emailService: EmailService;
  constructor() {
    this.accountService = new AccountService();
    this.emailService = new EmailService();
  }
  /**
   * Profile page.
   * @route GET /account
   */
  getAccount = (req: Request, res: Response): void => {
    res.render("account/profile", {
      title: "Account Management",
    });
  };

  /**
   * Update profile information.
   * @route POST /account/profile
   */
  postUpdateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await check("email", "Please enter a valid email address.").isEmail().run(req);
    await body("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("errors", errors.array());

      return res.redirect("/account");
    }
    console.log("requser =>", req.user);

    const user = req.user as UserDocument;
    const updateData = {
      email: req.body.email,
      nickname: req.body.nickname,
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      gender: req.body.gender,
      address: req.body.address,
    };

    console.log(updateData);

    this.accountService
      .updateUserProfile(user.id, updateData)
      .then((result) => {
        if (!result.success) {
          req.flash("errors", { msg: result.message });

          return res.redirect("/account");
        }
        req.flash("success", { msg: "Profile information has been updated." });
        res.redirect("/account");
      })
      .catch((err) => {
        next(err);
      });
  };
}
