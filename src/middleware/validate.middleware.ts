import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate =
  (schema: z.AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // return 없이 next()만 호출해도 괜찮습니다.
    } catch (error) {
      res.status(400).json(error); // return 제거!
    }
  };
