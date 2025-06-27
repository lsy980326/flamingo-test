import { Socket } from "socket.io";
import * as Y from "yjs";
import Project from "./api/projects/projects.model.js";

const ydocs = new Map<string, Y.Doc>();

export const loadYDoc = async (projectId: string): Promise<Y.Doc> => {
  let doc = ydocs.get(projectId);
  if (doc) return doc;

  const project = await Project.findById(projectId);
  doc = new Y.Doc();

  if (project && project.yjsDoc && project.yjsDoc.length > 0) {
    try {
      Y.applyUpdate(doc, new Uint8Array(project.yjsDoc));
      console.log(`[YJS] Document for project ${projectId} loaded from DB.`);
    } catch (error) {
      console.error(
        `[YJS] Failed to apply update from DB for project ${projectId}:`,
        error
      );
    }
  }
  ydocs.set(projectId, doc);
  return doc;
};

export const saveYDoc = async (projectId: string) => {
  const doc = ydocs.get(projectId);
  if (doc) {
    const yjsDocBinary = Y.encodeStateAsUpdate(doc);
    if (yjsDocBinary.length > 0) {
      await Project.findByIdAndUpdate(projectId, {
        yjsDoc: Buffer.from(yjsDocBinary),
      });
      console.log(`[YJS] Document for project ${projectId} saved to DB.`);
    }
  }
};

export const saveAllYDocs = () => {
  if (ydocs.size > 0) {
    console.log(`[DB] Periodically saving ${ydocs.size} active Y.Doc(s)...`);
    ydocs.forEach((_, roomId) => saveYDoc(roomId));
  }
};

export const setupYJSEvents = (socket: Socket) => {
  // 클라이언트가 전체 동기화를 요청할 때
  socket.on("yjs-sync-request", async (roomId: string) => {
    const doc = await loadYDoc(roomId);
    const fullUpdate = Y.encodeStateAsUpdate(doc);

    const base64Update = Buffer.from(fullUpdate).toString("base64");
    socket.emit("yjs-full-sync", base64Update, roomId);
  });

  // 클라이언트가 업데이트를 보냈을 때
  socket.on("yjs-update", async (update: string, roomId: string) => {
    try {
      const doc = await loadYDoc(roomId);

      const binaryUpdate = new Uint8Array(Buffer.from(update, "base64"));
      Y.applyUpdate(doc, binaryUpdate);

      // 다른 클라이언트에게도 받은 그대로 Base64 문자열을 전달
      socket.broadcast.to(roomId).emit("yjs-update", update, roomId);
    } catch (error) {
      console.error(`[YJS] Error applying update for room ${roomId}:`, error);
    }
  });
};
