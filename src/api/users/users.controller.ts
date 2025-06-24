import type { Request, Response } from "express";
export const getMe = (req: Request, res: Response) => {
  // protect 미들웨어에서 사용자 정보를 req에 담았다면 여기서 사용
  res.json({ message: "성공적으로 보호된 데이터에 접근했습니다." });
};
