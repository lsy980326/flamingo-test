import Project, { ProjectDocument } from "./projects.model.js";
import { findPublicUserByEmail } from "../users/users.service.js"; // users 서비스에서 함수 import
import AppError from "../../utils/AppError.js";
import { io } from "../../server.js";
import ProjectUpdateLogModel from "./projectUpdateLog.model.js";
import { clearYDocFromMemory } from "../../yjs-setup.js";

export const createNewProject = async (
  name: string,
  ownerId: string
): Promise<ProjectDocument> => {
  const project = await Project.create({
    name,
    owner: ownerId,
    members: [ownerId],
  });
  return project;
};

export const findProjectsByUserId = async (
  userId: string
): Promise<ProjectDocument[]> => {
  const projects = await Project.find({
    members: userId,
  })
    .select("-yjsDoc")
    .populate("owner", "email")
    .populate("members", "email");
  return projects;
};

export const findProjectById = async (
  projectId: string
): Promise<ProjectDocument | null> => {
  const project = await Project.findById(projectId);
  return project;
};

export const addMember = async (
  projectId: string,
  ownerId: string,
  memberEmail: string
): Promise<ProjectDocument> => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("프로젝트를 찾을 수 없습니다.", 404);
  }

  if (project.owner.toString() !== ownerId) {
    throw new AppError("프로젝트 소유자만 멤버를 초대할 수 있습니다.", 403);
  }

  const member = await findPublicUserByEmail(memberEmail);
  if (!member) {
    throw new AppError("초대할 사용자를 이메일로 찾을 수 없습니다.", 404);
  }

  if (project.members.some((m) => m.equals(member._id))) {
    throw new AppError("이미 프로젝트에 참여하고 있는 사용자입니다.", 400);
  }

  project.members.push(member._id);
  await project.save();
  return project;
};

export const rollbackProject = async (projectId: string, timestamp: string) => {
  const rollbackTime = new Date(timestamp);

  const logsToArchive = await ProjectUpdateLogModel.find({
    project: projectId,
    status: "active",
    createdAt: { $gt: rollbackTime },
  });

  if (logsToArchive.length === 0) {
    throw new AppError(
      "해당 시점 이후에 변경된 내용이 없어 롤백할 수 없습니다.",
      400
    );
  }

  const logIdsToArchive = logsToArchive.map((log) => log._id);

  const result = await ProjectUpdateLogModel.updateMany(
    { _id: { $in: logIdsToArchive } },
    { $set: { status: "archived" } }
  );

  clearYDocFromMemory(projectId);

  io.to(projectId).emit("force-resync", {
    message: `프로젝트가 이전 버전으로 복원되었습니다. 문서를 다시 동기화합니다.`,
  });

  return {
    message: `${result.modifiedCount}개의 변경사항이 성공적으로 롤백되었습니다.`,
  };
};

export const getProjectHistory = async (projectId: string) => {
  const history = await ProjectUpdateLogModel.find(
    {
      project: projectId,
      status: "active",
    },
    "_id createdAt" // 필요한 필드만 선택: id와 생성 시간
  ).sort({ createdAt: -1 }); // 최신순으로 정렬

  return history;
};
