import { Socket } from "socket.io";
import * as Y from "yjs";
import Project from "./api/projects/projects.model.js"; // Project 모델은 여전히 필요할 수 있음
import ProjectUpdateLogModel from "./api/projects/projectUpdateLog.model.js";

// 메모리에 활성 Y.Doc 인스턴스를 저장하는 Map (이전과 동일)
const ydocs = new Map<string, Y.Doc>();

/**
 * DB에 기록된 모든 업데이트 로그를 재생하여 Y.Doc을 복원합니다.
 */
export const loadYDoc = async (projectId: string): Promise<Y.Doc> => {
  // 1. 메모리에 이미 문서가 있다면 즉시 반환 (캐시 역할)
  let doc = ydocs.get(projectId);
  if (doc) {
    return doc;
  }

  // 2. 메모리에 없다면 새로운 Y.Doc 인스턴스 생성
  doc = new Y.Doc();

  // 3. DB에서 해당 projectId를 가진 모든 업데이트 로그를 조회합니다.
  // createdAt 필드를 기준으로 오름차순 정렬하여 가장 오래된 업데이트부터 가져옵니다.
  const updates = await ProjectUpdateLogModel.find({ project: projectId }).sort(
    {
      createdAt: 1,
    }
  );

  if (updates.length > 0) {
    console.log(
      `[YJS] Loading ${updates.length} updates for project ${projectId} from DB...`
    );
    // 4. Y.Doc을 잠그고(transaction), 모든 업데이트를 순차적으로 적용합니다.
    // 여러 업데이트를 한번에 적용할 때는 transaction으로 묶는 것이 효율적입니다.
    doc.transact(() => {
      for (const up of updates) {
        Y.applyUpdate(doc, up.updateData);
      }
    });
    console.log(
      `[YJS] Document for project ${projectId} restored successfully.`
    );
  }

  // 5. 복원된 문서를 메모리에 저장하고 반환합니다.
  ydocs.set(projectId, doc);
  return doc;
};

/**
 * 소켓에 YJS 관련 이벤트 핸들러를 설정합
 */
export const setupYJSEvents = (socket: Socket) => {
  // 전체 동기화 요청 (로직 동일)
  socket.on("yjs-sync-request", async (roomId: string) => {
    const doc = await loadYDoc(roomId);
    const fullUpdate = Y.encodeStateAsUpdate(doc);
    const base64Update = Buffer.from(fullUpdate).toString("base64");
    socket.emit("yjs-full-sync", base64Update, roomId);
  });

  // 클라이언트가 업데이트를 보냈을 때 (DB 저장 로직 추가)
  socket.on("yjs-update", async (update: string, roomId: string) => {
    try {
      const doc = await loadYDoc(roomId);
      const binaryUpdate = new Uint8Array(Buffer.from(update, "base64"));

      // 1. 메모리의 Y.Doc에 업데이트 적용
      Y.applyUpdate(doc, binaryUpdate);

      // 2. 다른 클라이언트에게 브로드캐스트
      socket.broadcast.to(roomId).emit("yjs-update", update, roomId);

      // 3. 받은 업데이트를 DB에 로그로 저장합니다.
      // 이 작업은 클라이언트 응답과 별개로 비동기적으로 처리됩니다.
      await ProjectUpdateLogModel.create({
        project: roomId,
        updateData: Buffer.from(binaryUpdate), // DB에는 Buffer 형태로 저장
      });
    } catch (error) {
      console.error(
        `[YJS] Error applying or saving update for room ${roomId}:`,
        error
      );
    }
  });
};
