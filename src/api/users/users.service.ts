import User, { UserDocument } from "./users.model.js";

/**
 * 신규 사용자를 데이터베이스에 생성합니다.
 * 이메일 중복 검사는 이 함수를 호출하기 전에 수행되어야 합니다.
 * @param data - 생성할 사용자의 데이터
 * @returns 생성된 사용자 문서
 */
export const createUser = async (
  data: Partial<UserDocument>
): Promise<UserDocument> => {
  // '생성'이라는 자신의 책임에만 집중합니다.
  const user = await User.create(data);
  return user;
};

/**
 * 이메일로 사용자를 조회합니다.
 * @param email - 조회할 사용자의 이메일
 * @param selectPassword - 비밀번호 필드를 함께 조회할지 여부
 * @returns 사용자 문서 또는 null
 */
export const findUserByEmail = async (
  email: string,
  selectPassword = false // 비밀번호 포함 여부를 인자로 받음
): Promise<UserDocument | null> => {
  const query = User.findOne({ email });

  if (selectPassword) {
    // 비밀번호가 필요하다고 요청하면, 쿼리에 select('+password')를 추가합니다.
    return query.select("+password");
  }

  return query;
};

/**
 * 모든 사용자를 조회합니다. (관리자용)
 * @returns 모든 사용자 문서의 배열
 */
export const findAllUsers = async (): Promise<UserDocument[]> => {
  // 비밀번호는 기본적으로 제외됩니다 (select: false 옵션 덕분에)
  const users = await User.find();
  return users;
};
