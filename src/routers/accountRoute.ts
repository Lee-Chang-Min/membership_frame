import { Router } from "express";
import AccountController from "../controllers/account";
import * as passportConfig from "../config/passport";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: login router
 */
export default class userRoute {
  public router = Router();
  controller: AccountController;

  constructor() {
    this.controller = new AccountController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //Account Page
    this.router.get("/", passportConfig.isAuthenticated, this.controller.getAccount);
    this.router.post("/profile", passportConfig.isAuthenticated, this.controller.postUpdateProfile);
    this.router.post("/password", passportConfig.isAuthenticated, this.controller.postUpdatePassword);
    this.router.post("/delete", passportConfig.isAuthenticated, this.controller.postDeleteAccount);
  }
}
