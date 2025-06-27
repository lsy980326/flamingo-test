import Project, { ProjectDocument } from "./projects.model.js";
import { findPublicUserByEmail } from "../users/users.service.js"; // users 서비스에서 함수 import
import AppError from "../../utils/AppError.js";

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
