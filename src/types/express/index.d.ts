import { UserDocument } from "../../api/users/users.model";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
