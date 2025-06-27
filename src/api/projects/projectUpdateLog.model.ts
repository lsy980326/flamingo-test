import mongoose, { Document, Schema, Model } from "mongoose";
import { ProjectDocument } from "./projects.model"; // Project 모델의 타입을 가져옵니다.

/**
 * ProjectUpdateLog 문서의 타입을 정의하는 인터페이스.
 */
export interface IProjectUpdateLog extends Document {
  project: ProjectDocument["_id"];
  updateData: Buffer;
}

/**
 * Mongoose 스키마 정의
 */
const ProjectUpdateLogSchema: Schema<IProjectUpdateLog> = new Schema(
  {
    // 어떤 프로젝트에 대한 업데이트 로그인지 가리키는 참조 필드입니다.
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project", // 'Project' 모델을 참조합니다.
      required: true,
      index: true, // projectId로 로그를 검색하는 일이 매우 빈번하므로, 반드시 인덱스를 추가해야 합니다.
    },
    // YJS가 생성한 작은 업데이트(Uint8Array)를 Buffer 형태로 저장합니다.
    updateData: {
      type: Buffer,
      required: true,
    },
  },
  {
    // 이 스키마에서는 createdAt 필드만 필요합니다.
    // 업데이트 순서를 보장하는 가장 중요한 필드이기 때문입니다.
    // updatedAt은 필요 없으므로 명시적으로 false 처리합니다.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Mongoose 모델 생성.
 */
const ProjectUpdateLogModel: Model<IProjectUpdateLog> =
  mongoose.models.ProjectUpdateLog ||
  mongoose.model<IProjectUpdateLog>("ProjectUpdateLog", ProjectUpdateLogSchema);

export default ProjectUpdateLogModel;
