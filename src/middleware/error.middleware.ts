import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";

// 개발 환경과 프로덕션 환경에서 다른 에러 응답을 보내기 위한 헬퍼 함수
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack, // 개발 환경에서는 스택 트레이스도 보여줌
    },
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // isOperational이 true인 경우 (예: 잘못된 입력, 없는 데이터 요청 등)
  // 사용자가 이해할 수 있는 예측된 에러 메시지를 보냅니다.
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
      },
    });
  } else {
    // isOperational이 false인 경우 (예: DB 연결 끊김, 라이브러리 버그 등)
    // 프로그래밍 또는 시스템 오류이므로, 사용자에게는 일반적인 메시지를 보냅니다.
    console.error("💥 ERROR", err); // 서버 로그에는 상세한 에러를 기록
    res.status(500).json({
      success: false,
      error: {
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    });
  }
};

// Express는 인자가 (err, req, res, next) 4개인 함수를 에러 핸들링 미들웨어로 인식합니다.
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 기본 상태 코드와 메시지 설정
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "production") {
    // Mongoose 관련 에러 등 특정 에러들을 AppError로 변환하는 로직 추가 가능
    let error = { ...err, message: err.message, stack: err.stack };
    // ... (예: if (error.name === 'CastError') error = handleCastErrorDB(error);)

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
};
