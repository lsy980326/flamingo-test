import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;
  if (!bearer || !bearer.startsWith("Bearer ")) {
    res.status(401).json({ message: "인증 토큰이 없습니다." });
    return;
  }

  const token = bearer.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    // req.user = payload; // 실제 프로젝트에서는 유저 정보를 담아 넘김
    next();
  } catch (e) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    return;
  }
};
