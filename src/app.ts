import express from "express";
import compression from "compression"; // compresses requests
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import UserRoute from "./routers/userRoute";
import AccountRoute from "./routers/accountRoute";
import TestRoute from "./routers/testRoute";

//secrets keys require
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as apiController from "./controllers/api";
import * as contactController from "./controllers/contact";

// API keys and Passport configuration
import * as passportConfig from "./config/passport";

// swagger setting json
import swaggerDocument from "./docs/swagger";

// Create Express server
const app = express();
const testRoute = new TestRoute();
const userRoute = new UserRoute();
const accountRoute = new AccountRoute();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
//mongoose.Promise = bluebird;

mongoose
  .connect(mongoUrl, {
    dbName: "dev",
  })
  .then(() => {
    if (process.env.NODE_ENV !== "production") {
      mongoose.set("debug", true);
    }
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
  })
  .catch((err) => {
    console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    // process.exit();
  });

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(helmet());
app.use(compression()); // 데이터를 전송할때, 압축된 데이터를 보냄으로써 네트워크 전송 속도를 높이고, 비용을 줄일 수 있다.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET, //암호화하는데 쓰일 키.
    resave: false, // 세션을 언제나 저장할지 설정함.
    saveUninitialized: true, // 세션에 저장할 내역이 없더라도 처음부터 세션을 생성할지 설정.
    store: new MongoStore({
      mongoUrl,
      dbName: "dev",
    }),
    cookie: { maxAge: 3.6e6 * 24 }, // 24시간 뒤 만료(자동 삭제)
  }),
);

// 이 부분의 설정은 반드시 세션 설정 뒤에 사용해야 한다.
app.use(passport.initialize()); // 요청에 passport 설정을 넣는다.
app.use(passport.session()); // req.session에 passport 정보를 저장한다.

app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user && req.path !== "/login" && req.path !== "/signup" && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user && req.path == "/account") {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

app.get("/", homeController.index);
app.use("/user", userRoute.router);
app.use("/account", accountRoute.router);

app.use("/ttt", testRoute.router);

app.get("/contact", contactController.getContact);
app.post("/contact", contactController.postContact);
app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get("/api", apiController.getApi);
app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/");
});

// app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error("app.use: Error 미들웨어", error.stack);
//   res.status(500).send({
//     name: error.name || "Internal Server Error",
//     message: error.message || "서버 내부에서 오류가 발생했습니다.",
//   });
// });

export default app;
