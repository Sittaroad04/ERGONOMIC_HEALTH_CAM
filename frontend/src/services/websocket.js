import { API_URL } from "./api";

export function openMonitorSocket(sessionId, onMessage, onClose) {
  const socket = new WebSocket(
    `${API_URL.replace(/^http/, "ws")}/ws/monitor/${sessionId}`,
  );
  socket.onmessage = (event) => onMessage(JSON.parse(event.data));
  socket.onclose = onClose;
  return socket;
}
