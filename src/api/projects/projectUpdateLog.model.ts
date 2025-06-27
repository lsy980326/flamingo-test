import mongoose, { Document, Schema, Model } from "mongoose";
import { ProjectDocument } from "./projects.model";

/**
 * ProjectUpdateLog 문서의 타입을 정의하는 인터페이스.
 */
export interface IProjectUpdateLog extends Document {
  project: ProjectDocument["_id"];
  updateData: Buffer;
  status: "active" | "archived"; // ✨ 상태 타입 추가
}

/**
 * Mongoose 스키마 정의
 */
const ProjectUpdateLogSchema: Schema<IProjectUpdateLog> = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    updateData: {
      type: Buffer,
      required: true,
    },
    // ✨ [추가] 롤백 시 이 로그가 유효한지, 아니면 보관(무효화)된 상태인지 나타냅니다.
    status: {
      type: String,
      enum: ["active", "archived"], // 'active' 또는 'archived' 값만 허용
      default: "active", // 생성 시 기본값은 'active'
      required: true,
      index: true, // status 필드로도 검색하므로 인덱스를 추가하면 좋습니다.
    },
  },
  {
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
