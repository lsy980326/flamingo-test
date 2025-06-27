import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import User from "../api/users/users.model.js";

/**
 * 사용자가 인증되었는지 확인하는 보호 미들웨어
 */
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    // 1. 요청 헤더에서 JWT 가져오기
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("로그인이 필요합니다. 인증 토큰이 없습니다.", 401)
      );
    }

    // 2. 토큰 검증
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // 3. 토큰이 유효하면, DB에서 최신 사용자 정보를 찾아 req.user에 할당
    //    삭제되거나 비활성화된 사용자의 접근을 차단할 수 있음.
    const currentUser = await User.findById(decoded.userId).select("-password");

    if (!currentUser) {
      return next(
        new AppError(
          "이 토큰에 해당하는 사용자가 더 이상 존재하지 않습니다.",
          401
        )
      );
    }

    // 4. req 객체에 전체 사용자 문서를 할당하여 다음 미들웨어로 전달
    req.user = currentUser;
    next();
  }
);

/**
 * 특정 역할을 가진 사용자만 접근을 허용하는 인가 미들웨어 (향후 사용 예정)
 * @param roles - 허용할 역할 목록 (예: 'admin', 'editor')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("이 작업을 수행할 권한이 없습니다.", 403));
    }
    next();
  };
};
