import express, { Request, Response, NextFunction } from "express";
import { Router } from "express";
import UserController from "../controllers/user";
const router = express.Router();

export default class userRoute {
  public router = Router();
  controller: UserController;

  constructor() {
    this.controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/test", this.controller.test);

    this.router.get("/login", this.controller.getLogin);
    this.router.post("/login", this.controller.postLogin);

    this.router.get("/logout", this.controller.logout);
    this.router.get("/signup", this.controller.getSignup);
    this.router.post("/signup", this.controller.postSignup);

    this.router.get("/completeSignup", this.controller.completeSignup);
  }
}
