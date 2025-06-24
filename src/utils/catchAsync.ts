import { Request, Response, NextFunction } from "express";

// (req, res, next)를 인자로 받는 비동기 함수를 받아서,
// 에러가 발생하면 자동으로 next(error)를 호출하는 새로운 함수를 반환합니다.
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
