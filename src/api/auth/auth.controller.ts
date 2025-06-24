import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { hashPassword, comparePassword } from "./auth.service.js";
import { createUser, findUserByEmail } from "../users/users.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1. 컨트롤러 레벨에서 이메일 중복을 먼저 확인합니다.
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      // AppError를 생성하여 전역 에러 핸들러로 보냅니다.
      return next(new AppError("이미 존재하는 이메일입니다.", 409)); // 409 Conflict가 더 적절한 상태 코드
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 3. 서비스 호출하여 사용자 생성
    const newUser = await createUser({ email, password: hashedPassword });

    // 4. 응답 전송 (비밀번호 등 민감 정보는 제외)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    res.status(201).json({
      success: true,
      message: "회원가입 성공",
      user: userResponse,
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1. 이메일, 비밀번호 입력값 확인
    if (!email || !password) {
      return next(new AppError("이메일과 비밀번호를 모두 입력해주세요.", 400));
    }

    // 2. 사용자 확인 및 비밀번호 비교
    // findUserByEmail 호출 시, 비밀번호를 함께 조회하도록 true를 전달합니다.
    const user = await findUserByEmail(email, true);

    // user.password가 없거나(소셜 로그인 사용자) 비밀번호가 틀린 경우
    if (
      !user ||
      !user.password ||
      !(await comparePassword(password, user.password))
    ) {
      return next(new AppError("이메일 또는 비밀번호가 잘못되었습니다.", 401));
    }

    // 3. JWT 생성
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    // 4. 토큰 전송
    res.status(200).json({
      success: true,
      token,
    });
  }
);
