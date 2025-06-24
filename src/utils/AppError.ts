// AppError는 일반 Error 클래스를 확장하여 statusCode를 추가로 가집니다.
class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message); // 부모 클래스(Error)의 생성자 호출

    this.statusCode = statusCode;
    // isOperational 플래그는 개발자가 의도한 에러인지(true),
    // 예측하지 못한 시스템 에러인지(false)를 구분하기 위함입니다.
    this.isOperational = true;

    // 에러 스택 추적을 올바르게 유지합니다.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
