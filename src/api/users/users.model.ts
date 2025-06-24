import { Schema, model, Document } from "mongoose";

// Mongoose Document와 결합된 User 타입 정의
// 이 인터페이스는 다른 파일에서 타입을 참조할 때 사용됩니다.
export interface UserDocument extends Document {
  email: string;
  password?: string; // 비밀번호는 선택 사항
  role: "user" | "admin";
  profileImage?: string;
  google?: {
    id: string;
    email: string;
  };
  // 향후 kakao?: { id: string; ... } 와 같이 확장 가능
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, "이메일은 필수 입력 항목입니다."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      // 이 함수는 문서를 저장하기 전에 실행됩니다.
      // this는 저장될 문서를 가리킵니다.
      // 구글 ID가 없으면(즉, 로컬 가입이면) 비밀번호는 필수입니다.
      required: function (this: UserDocument): boolean {
        return !this.google?.id;
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
    },
    // 구글 소셜 로그인 정보를 저장하는 필드
    google: {
      id: { type: String },
      email: { type: String },
    },
  },
  {
    // createdAt과 updatedAt 타임스탬프를 자동으로 추가합니다.
    timestamps: true,
  }
);

// Mongoose 모델 생성
const User = model<UserDocument>("User", userSchema);

export default User;
