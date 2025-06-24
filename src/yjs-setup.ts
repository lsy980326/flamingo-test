import { Socket } from "socket.io";
import * as Y from "yjs";

// 활성화된 Room의 Y.Doc 인스턴스를 메모리에 저장하는 맵.
// Key: roomId (string), Value: Y.Doc 인스턴스
const ydocs = new Map<string, Y.Doc>();

/**
 * 주어진 roomId에 해당하는 Y.Doc 인스턴스를 반환하거나 새로 생성합니다.
 * @param roomId - Y.Doc을 가져올 Room의 ID
 * @returns Y.Doc 인스턴스
 */
export const getYDoc = (roomId: string): Y.Doc => {
  let doc = ydocs.get(roomId);
  if (!doc) {
    doc = new Y.Doc();
    ydocs.set(roomId, doc);
  }
  return doc;
};

function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (Array.isArray(data)) return new Uint8Array(data);
  if (data && data.type === "Buffer" && Array.isArray(data.data))
    return new Uint8Array(data.data);
  throw new Error("Unknown YJS update format: " + JSON.stringify(data));
}

/**
 * 특정 소켓 연결에 대한 YJS 이벤트 리스너를 설정합니다.
 * @param socket - 클라이언트와의 Socket.IO 연결 인스턴스
 */
export const setupYJSEvents = (socket: Socket) => {
  // 클라이언트가 방에 처음 참여하여 전체 문서 동기화를 요청할 때
  socket.on("yjs-sync-request", (roomId: string) => {
    const doc = getYDoc(roomId);
    const fullUpdate = Y.encodeStateAsUpdate(doc);
    console.log(
      "서버에서 fullUpdate 전송:",
      fullUpdate,
      fullUpdate instanceof Uint8Array
    );
    socket.emit("yjs-full-sync", fullUpdate, roomId);
  });

  // 클라이언트에서 발생한 실시간 변경사항(업데이트)을 받았을 때
  socket.on("yjs-update", (update, roomId) => {
    console.log(
      "수신 update:",
      update,
      "instanceof Uint8Array:",
      update instanceof Uint8Array,
      "Array.isArray:",
      Array.isArray(update),
      "type:",
      update?.type,
      "roomId:",
      roomId
    );
    try {
      const doc = getYDoc(roomId);
      const realUpdate = toUint8Array(update);
      Y.applyUpdate(doc, realUpdate, socket.id);
      // 같은 방의 다른 유저들에게 업데이트 브로드캐스트
      socket.nsp.to(roomId).emit("yjs-update", update);
    } catch (e) {
      console.error("YJS update 변환 에러:", e, update);
    }
  });

  socket.on("yjs-full-sync", (fullUpdate, receivedRoomId) => {
    console.log(
      "클라이언트 fullUpdate 수신:",
      fullUpdate,
      fullUpdate instanceof Uint8Array,
      Array.isArray(fullUpdate),
      fullUpdate?.type
    );
    try {
      const doc = getYDoc(receivedRoomId);
      const realUpdate = toUint8Array(fullUpdate);
      Y.applyUpdate(doc, realUpdate);
    } catch (e) {
      console.error("YJS full-sync 변환 에러:", e, fullUpdate);
    }
  });
};
