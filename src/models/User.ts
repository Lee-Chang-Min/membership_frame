import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

//typescirpt, "&" 연산자를 이용해 여러 개의 타입 정의를 하나로 합침
export type UserDocument = mongoose.Document & {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;

  facebook: string;
  tokens: AuthToken[];

  profile: {
    name: string;
    gender: string;
    location: string;
    website: string;
    picture: string;
  };

  comparePassword: comparePasswordFunction;
  gravatar: (size: number) => string;
};

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => void) => void;

export interface AuthToken {
  accessToken: string;
  kind: string;
}

/** mongoose Schema 
- required : 필수 값 여부
- unique : 유일한 값인지 여부
- default : 데이터가 없을 경우 기본 값(ex: Date.now())
*/
const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    facebook: String,
    // twitter: String,
    // google: String,
    tokens: Array,

    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
    },
  },
  { timestamps: true },
);

/**
 * Password hash middleware.
 * save() 메서드 이전에 처리할 로직을 지정
 */
userSchema.pre("save", function save(next) {
  const user = this as UserDocument;

  //비밀번호가 수정되지 않았으면 pass
  if (!user.isModified("password")) {
    return next();
  }

  //genSalt()의 첫번째 인자인 saltRounds는 기존에 salting된 password를 몇 번 더 salting을 해서 해시를 도출할 것인가를 결정하는 인자
  const saltRounds = 10;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      return next(err);
    }

    //hash() 메서드는 입력받은 password를 salting하여 암호화된 hash로 생성
    bcrypt.hash(user.password, salt, (err: mongoose.Error, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  //bcrypt는 단방향 암호화라서 복호화가 불가능함. 매번 SALT값이 달라지기 때문.
  //단순히 입력된 password와 암호화된 password가 같은지 다른지만 비교만 가능함.
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size: number = 200) {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/*
 *모델을 정의하고 다른 모듈에서 사용할 수 있게 내보내준다.
 */
export const User = mongoose.model<UserDocument>("User", userSchema);
