import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import jwt from "jsonwebtoken";
import passport from "passport";
import session from "express-session";

import authRouter from "./api/auth/auth.routes.js";
import usersRouter from "./api/users/users.routes.js";
import projectsRouter from "./api/projects/projects.routes.js";
import { connectDB } from "./config/db.js";
import "./config/passport.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { setupYJSEvents, saveAllYDocs } from "./yjs-setup.js";

// --- 초기화 ---
connectDB();
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

// --- Socket.IO 서버 생성 및 연결 ---
const io = new Server(server, {
  cors: corsOptions,
});

const port = process.env.PORT || 4000;

// --- Express 미들웨어 설정 ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// --- 라우터 등록 ---
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);

// --- Socket.IO 인증 미들웨어 ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided."));
  }
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token."));
    }
    (socket as any).user = decoded;
    next();
  });
});

// --- Socket.IO 이벤트 리스너 ---
io.on("connection", (socket) => {
  const user = (socket as any).user;
  console.log(
    `Authenticated user connected: ${user.userId} (Socket ID: ${socket.id})`
  );

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    console.log(
      `User ${socket.id} (userId: ${user.userId}) joined room: ${roomId}`
    );
    socket
      .to(roomId)
      .emit("user-joined", { userId: user.userId, socketId: socket.id });
  });

  socket.on("leave-room", (roomId: string) => {
    socket.leave(roomId);
    console.log(
      `User ${socket.id} (userId: ${user.userId}) left room: ${roomId}`
    );
    socket
      .to(roomId)
      .emit("user-left", { userId: user.userId, socketId: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id} (userId: ${user.userId})`);
  });

  // YJS 이벤트 핸들러 설정
  setupYJSEvents(socket);
});

// --- 주기적인 DB 저장 로직 ---
const SAVE_INTERVAL = 30000; // 30초
setInterval(() => {
  saveAllYDocs();
}, SAVE_INTERVAL);

// --- 전역 에러 핸들러 및 서버 실행 ---
app.use(errorHandler);

server.listen(port, () => {
  console.log(`HTTP 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`WebSocket 서버도 동일한 포트에서 대기 중입니다.`);
});
