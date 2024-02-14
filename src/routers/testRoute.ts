import { Router } from "express";
import UserController from "../controllers/user";

export default class testRoute {
  public router = Router();
  controller: UserController;

  constructor() {
    this.controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/test", this.controller.test);
  }
}
