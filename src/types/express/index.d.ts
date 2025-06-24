import { UserDocument } from "../../api/users/users.model";

declare global {
  namespace Express {
    // Request 인터페이스에 user 속성 추가 (선택적)
    interface Request {
      user?: UserDocument;
    }
    // Passport가 세션에 저장하는 User 타입 정의 (필수)
    interface User extends UserDocument {}
  }
}
