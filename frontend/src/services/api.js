const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error("Backend ไม่ตอบสนอง");
  return response.json();
}

export async function createSession() {
  const response = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: 1 }),
  });
  return response.json();
}
export async function stopSession(id) {
  const response = await fetch(`${API_URL}/api/sessions/${id}/stop`, {
    method: "POST",
  });
  return response.json();
}
export async function listSessions() {
  const response = await fetch(`${API_URL}/api/sessions`);
  return response.json();
}
export async function getRecords(id) {
  const response = await fetch(`${API_URL}/api/sessions/${id}/records`);
  return response.json();
}
export async function deleteSession(id) {
  const response = await fetch(`${API_URL}/api/sessions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("ลบเซสชันไม่สำเร็จ");
}
export async function deleteSessions(period = "all") {
  const response = await fetch(`${API_URL}/api/sessions?period=${period}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("ลบประวัติไม่สำเร็จ");
  return response.json();
}
export async function analyzePosture(sessionId, file) {
  const body = new FormData();
  body.append("session_id", sessionId);
  body.append("image", file);
  const response = await fetch(`${API_URL}/api/posture/analyze`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw new Error("Unable to analyze this image.");
  return response.json();
}
export { API_URL };
