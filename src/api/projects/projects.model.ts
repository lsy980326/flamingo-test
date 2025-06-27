import { Schema, model, Document } from "mongoose";
import { UserDocument } from "../users/users.model"; // UserDocument 타입을 import

// Project 문서의 타입을 정의하는 인터페이스
export interface ProjectDocument extends Document {
  name: string;
  owner: UserDocument["_id"]; // 타입을 명확히 함
  members: UserDocument["_id"][];
  yjsDoc?: Buffer;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: [true, "프로젝트 이름은 필수입니다."],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User", // User 모델과 관계를 맺음
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    yjsDoc: {
      type: Buffer, // YJS 문서의 바이너리 데이터를 저장
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 필드 자동 생성
  }
);

const Project = model<ProjectDocument>("Project", projectSchema);

export default Project;
