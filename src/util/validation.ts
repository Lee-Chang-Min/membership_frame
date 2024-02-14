// validation.ts
import { body, ValidationChain } from "express-validator";

export const validateLogin: ValidationChain[] = [
  body("email", "Email is not valid").isEmail(),
  body("password", "Password cannot be blank").not().isEmpty(),
];

export const validateSignup: ValidationChain[] = [
  ...validateLogin,
  body("confirmPassword", "Passwords do not match").custom((value, { req }) => value === req.body.password),
];

//>> controller 부분이 이렇게 바뀌어야 함(만약에 validation을 따로 관리한다면)
// await Promise.all(validateLogin.map(validation => validation.run(req)));
// const errors = validationResult(req);
