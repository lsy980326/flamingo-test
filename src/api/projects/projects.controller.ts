import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import * as projectService from "./projects.service.js";

export const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    const ownerId = req.user!.id;

    if (!name) {
      return next(new AppError("프로젝트 이름을 입력해주세요.", 400));
    }

    const project = await projectService.createNewProject(name, ownerId);
    res.status(201).json({ success: true, data: project });
  }
);

export const getMyProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projects = await projectService.findProjectsByUserId(userId);
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  }
);

/**
 * 특정 프로젝트에 멤버를 추가하는 컨트롤러
 */
export const addMemberToProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { email: memberEmail } = req.body;
    const ownerId = req.user!.id;

    if (!memberEmail) {
      return next(new AppError("초대할 사용자의 이메일을 입력해주세요.", 400));
    }

    const updatedProject = await projectService.addMember(
      projectId,
      ownerId,
      memberEmail
    );
    res.status(200).json({ success: true, data: updatedProject });
  }
);

export const rollbackProjectHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { timestamp } = req.body;

    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      return next(new AppError("유효한 타임스탬프를 제공해야 합니다.", 400));
    }

    // TODO: 이 작업을 수행할 권한이 있는지 확인하는 로직 추가 (예: 프로젝트 소유자만)

    const result = await projectService.rollbackProject(projectId, timestamp);
    res.status(200).json({ success: true, data: result });
  }
);

export const getHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const history = await projectService.getProjectHistory(projectId);
    res
      .status(200)
      .json({ success: true, count: history.length, data: history });
  }
);
