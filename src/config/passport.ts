import passport from "passport";
import passportLocal from "passport-local";
//import passportFacebook from "passport-facebook";
import { find } from "lodash";

// import { User, UserType } from '../models/User';
import { User, UserDocument } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { MongooseError } from "mongoose";

const LocalStrategy = passportLocal.Strategy;
//const FacebookStrategy = passportFacebook.Strategy;

//serializeUser: 로그인을 성공하였을때 딱 한번 호출되어 사용자 식별자를 Session storage에 저장된다.
passport.serializeUser<any, any>((req, user, done) => {
  done(undefined, user);
});

//deserializeUser: 저장된 세션 데이터를 기준으로 필요한 정보를 조회할때 사용된다.
passport.deserializeUser<any, any>((user, done) => {
  User.findById(user)
    .then((user) => {
      //여기서 전달해주는 user가 request.user 로 사용할수있게 주입해준다.
      done(undefined, user);
    })
    .catch((err) => done(err));
});

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("LocalStrategy", email, password);
    User.findOne({ email: email.toLowerCase() })
      .then((user: UserDocument) => {
        if (!user) {
          return done(undefined, false, {
            message: `Email ${email} not found.`,
          });
        }

        //user가 있을때 현재 입력된 password와 db 적재된 암호화된 password와 비교
        user.comparePassword(password, (err: Error, isMatch: boolean) => {
          if (err) {
            return done(err);
          }
          //로그인 성공 했을 때.
          if (isMatch) {
            //serializeUser에게 user 가 전달됨.
            return done(undefined, user);
          }

          //비밀번호가 틀렸을 때.
          return done(undefined, false, {
            message: "Invalid email or password.",
          });
        });
      })
      .catch((err) => {
        return done(err);
      });
  }),
);

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_ID,
//       clientSecret: process.env.FACEBOOK_SECRET,
//       callbackURL: "/auth/facebook/callback",
//       profileFields: ["name", "email", "link", "locale", "timezone"],
//       passReqToCallback: true,
//     },
//     (req: any, accessToken, refreshToken, profile, done) => {
//       if (req.user) {
//         User.findOne({ facebook: profile.id }, (err: MongooseError, existingUser: UserDocument) => {
//           if (err) {
//             return done(err);
//           }
//           if (existingUser) {
//             req.flash("errors", {
//               msg: "There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.",
//             });
//             done(err);
//           } else {
//             User.findById(req.user.id, (err: MongooseError, user: UserDocument) => {
//               if (err) {
//                 return done(err);
//               }
//               user.facebook = profile.id;
//               user.tokens.push({ kind: "facebook", accessToken });
//               user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
//               user.profile.gender = user.profile.gender || profile._json.gender;
//               user.profile.picture =
//                 user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
//               user.save((err: Error) => {
//                 req.flash("info", {
//                   msg: "Facebook account has been linked.",
//                 });
//                 done(err, user);
//               });
//             });
//           }
//         });
//       } else {
//         User.findOne({ facebook: profile.id }, (err: MongooseError, existingUser: UserDocument) => {
//           if (err) {
//             return done(err);
//           }
//           if (existingUser) {
//             return done(undefined, existingUser);
//           }
//           User.findOne(
//             { email: profile._json.email },
//             (err: MongooseError, existingEmailUser: UserDocument) => {
//               if (err) {
//                 return done(err);
//               }
//               if (existingEmailUser) {
//                 req.flash("errors", {
//                   msg: "There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.",
//                 });
//                 done(err);
//               } else {
//                 const user: any = new User();
//                 user.email = profile._json.email;
//                 user.facebook = profile.id;
//                 user.tokens.push({ kind: "facebook", accessToken });
//                 user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
//                 user.profile.gender = profile._json.gender;
//                 user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
//                 user.profile.location = profile._json.location ? profile._json.location.name : "";
//                 user.save((err: Error) => {
//                   done(err, user);
//                 });
//               }
//             },
//           );
//         });
//       }
//     },
//   ),
// );

/**
 * Login Required middleware.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/login");
};

/**
 * Authorization Required middleware.
 */
export const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.path.split("/").slice(-1)[0];

  const user = req.user as UserDocument;
  if (find(user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
