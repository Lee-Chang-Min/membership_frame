import express, { Request, Response, NextFunction } from "express";
import * as userController from "../controllers/user";
const router = express.Router();

router.get("/login", userController.getLogin);
router.post("/login", userController.postLogin);
router.get("/logout", userController.logout);

export default router;
