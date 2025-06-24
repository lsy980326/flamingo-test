import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User, { UserDocument } from "../api/users/users.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // 1. 구글 프로필에서 필수 정보 추출
      const googleEmail = profile.emails?.[0].value;
      const googleId = profile.id;

      // 이메일 정보가 없으면 인증 실패 처리
      if (!googleEmail) {
        return done(
          new Error("구글 프로필에서 이메일을 가져올 수 없습니다."),
          false
        );
      }

      try {
        // 2. 구글 ID로 사용자를 먼저 찾습니다. (가장 정확한 방법)
        let user = await User.findOne({ "google.id": googleId });

        if (user) {
          // 시나리오 A: 이미 구글로 로그인한 적이 있는 사용자 -> 바로 로그인
          return done(null, user);
        }

        // 3. 구글 ID가 없다면, 이메일로 기존 계정이 있는지 찾습니다.
        user = await User.findOne({ email: googleEmail });

        if (user) {
          // 시나리오 B: 이메일/비밀번호로 가입한 사용자가 구글 로그인을 시도 -> 계정 통합
          // 기존 계정에 구글 소셜 정보를 연결(업데이트)합니다.
          user.google = { id: googleId, email: googleEmail };
          await user.save(); // 변경사항을 데이터베이스에 저장
          return done(null, user);
        }

        // 4. 위 두 경우 모두 해당하지 않으면, 완전히 새로운 사용자입니다.
        // 시나리오 C: 신규 사용자가 구글 정보로 가입
        const newUser = await User.create({
          email: googleEmail,
          profileImage: profile.photos?.[0].value,
          google: { id: googleId, email: googleEmail }, // 구글 정보 저장
          // password 필드는 스키마의 required 조건에 따라 필요하지 않으므로 생략
        });

        return done(null, newUser);
      } catch (err: any) {
        // DB 작업 중 에러 발생 시
        return done(err, false);
      }
    }
  )
);

// 사용자 정보를 세션에 저장 (user.id를 키로 사용)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// 세션에서 사용자 정보를 복원 (id로 DB에서 사용자를 찾아 전체 정보를 복원)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
