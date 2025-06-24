import { Router, Request, Response } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

import { register, login } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

const router = Router();

// --- 이메일/비밀번호 기반 인증 ---

// POST /api/auth/register
// 신규 사용자 등록
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
// 로컬 사용자 로그인
router.post("/login", validate(loginSchema), login);

// --- OAuth 2.0 구글 소셜 로그인 ---

// GET /api/auth/google
// 1. 사용자를 구글 로그인 페이지로 보내 인증 시작
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// GET /api/auth/google/callback
// 2. 구글 로그인 성공 후 콜백 처리
router.get(
  "/google/callback",
  // passport.authenticate를 미들웨어로 사용. 인증 실패 시 지정된 경로로 리디렉션.
  // JWT를 사용하므로 세션은 생성하지 않음 (session: false)
  passport.authenticate("google", {
    failureRedirect: "/api/auth/login-failed", // 실패 시 리디렉션될 API 경로 (임의 지정)
    session: false,
  }),
  (req: Request, res: Response) => {
    // 타입 가드: Passport 인증을 통과하면 req.user 객체가 반드시 존재해야 함.
    // 이 확인 과정은 코드의 안정성을 높여줌.
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Google 인증 후 사용자 정보를 찾을 수 없습니다." });
    }

    // req.user 객체에서 사용자 ID 추출 (Mongoose 모델의 경우 .id 또는 ._id)
    const userId = req.user.id;

    // 우리 서비스 전용 JWT 생성
    const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    // 성공적으로 로그인 처리 후, 프론트엔드 페이지로 리디렉션하며 토큰을 쿼리 파라미터로 전달
    // 실제 운영 시에는 프론트엔드 URL로 변경해야 함
    // 예: res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${token}`);
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

// 로그인 실패 시 JSON 응답을 보내는 간단한 라우트
router.get("/login-failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "로그인에 실패했습니다.",
  });
});

export default router;
