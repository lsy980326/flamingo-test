import { Router } from "express";
import { getMe } from "./users.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

// /api/users/me
router.get("/me", protect, getMe); // protect 미들웨어 적용!

export default router;
