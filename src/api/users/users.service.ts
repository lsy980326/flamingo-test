import User, { UserDocument } from "./users.model.js";

export const createUser = async (
  data: Partial<UserDocument>
): Promise<UserDocument> => {
  const user = await User.create(data);
  return user;
};

// 로그인 시 비밀번호 비교를 위해 비밀번호를 포함하여 조회
export const findUserByEmail = async (
  email: string,
  selectPassword = false
): Promise<UserDocument | null> => {
  const query = User.findOne({ email });
  return selectPassword ? query.select("+password") : query;
};

// 멤버 초대 등 공개적인 정보 조회를 위해 비밀번호를 제외하고 조회
export const findPublicUserByEmail = async (
  email: string
): Promise<UserDocument | null> => {
  return User.findOne({ email }).select("-password");
};

export const findAllUsers = async (): Promise<UserDocument[]> => {
  const users = await User.find().select("-password");
  return users;
};
