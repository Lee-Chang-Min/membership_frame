import { Router } from "express";
import UserController from "../controllers/user";
import * as passportConfig from "../config/passport";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: login router
 */
export default class userRoute {
  public router = Router();
  controller: UserController;

  constructor() {
    this.controller = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /user/test:
     *   get:
     *     tags: [Tests]
     *     summary: Test endpoint
     *     description: Tests the API with an email query parameter.
     *     parameters:
     *       - in: query
     *         name: email
     *         required: true
     *         schema:
     *           type: string
     *         description: The email of the user to find.
     *     responses:
     *       200:
     *         description: Successfully found the user.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: success
     *       400:
     *         description: Invalid request parameters.
     */
    this.router.get("/test", this.controller.test);

    /**
     * @swagger
     * /user/login:
     *   get:
     *     tags: [Users]
     *     summary: login page
     *     description: 로그인 페이지 이동
     *     responses:
     *       200:
     *         description: 로그인성공
     */
    this.router.get("/login", this.controller.getLogin);

    /**
     * @swagger
     * /user/login:
     *   post:
     *     tags: [Users]
     *     summary: login page
     *     description: 로그인 시도
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *             required:
     *               - username
     *               - email
     *               - password
     *     responses:
     *       200:
     *         description: 로그인성공
     */
    this.router.post("/login", this.controller.postLogin);

    this.router.get("/logout", this.controller.logout);

    this.router.get("/signup", this.controller.getSignup);

    this.router.post("/signup", this.controller.postSignup);

    this.router.post("/verifySend", this.controller.verifySend);

    this.router.get("/verifyCheck", this.controller.verifyCheck);

    this.router.get("/completeSignup", this.controller.completeSignup);

    this.router.get("/forgot", this.controller.getForgot);
    this.router.post("/forgot", this.controller.postForgot);

    this.router.get("/reset/:token", this.controller.getReset);
    //this.router.post("/reset/:token", this.controller.postReset);
  }
}
