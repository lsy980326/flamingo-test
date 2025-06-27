import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  createProject,
  getMyProjects,
  addMemberToProject,
} from "./projects.controller.js";

const router = Router();

router.route("/").post(protect, createProject).get(protect, getMyProjects);

// :projectId/members 경로에 대한 POST 요청을 처리
router.route("/:projectId/members").post(protect, addMemberToProject);

export default router;
