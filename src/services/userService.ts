import { User, UserDocument } from "../models/User";
import { CallbackError, MongooseError } from "mongoose";
export default class UserService {
  findUser = async (email: string): Promise<UserDocument | null> => {
    try {
      const user = User.findOne({ email });
      return user;
    } catch (error) {
      throw error;
    }
  };
  createUser = async (email: string, password: string): Promise<UserDocument> => {
    try {
      const user = new User({ email, password });
      //console.log(user.save());
      return await user.save();
    } catch (error) {
      throw error;
    }
  };
  // User.findOne({ email: req.body.email })
  //     .then((docs) => {
  //       console.log("docs", docs);

  //       if (docs) {
  //         req.flash("errors", { msg: "Account with that email address already exists." });
  //         return res.redirect("/signup");
  //       }

  //       user
  //         .save()
  //         .then(() => {
  //           res.redirect("/user/completeSignup");
  //         })
  //         .catch((err) => {
  //           if (err) {
  //             return next(err);
  //           }
  //         });
  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //       return next(err);
  //     });
  // };
}
