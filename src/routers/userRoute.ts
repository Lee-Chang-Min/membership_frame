import express, { Request, Response, NextFunction } from "express";
import * as userController from "../controllers/user";
const router = express.Router();

router.get("/login", userController.getLogin);
router.post("/login", userController.postLogin);
router.get("/logout", userController.logout);

router.get("/signup", userController.getSignup);
router.post("/signup", userController.postSignup);

router.get("/completeSignup", userController.completeSignup);

export default router;
