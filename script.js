// Uptime Kuma 공개 주소 (예: "https://status.example.org"). 비워 두면 "상태 정보 준비 중"으로 남습니다.
const KUMA_URL = "";
const KUMA_SLUG = "main";
const KUMA_MONITOR_ID = "2";

const el = document.getElementById("status");

// Kuma 하트비트 상태 코드: 0 다운, 1 업, 2 대기, 3 점검
const LABELS = { 0: "서버 오프라인", 1: "서버 온라인", 2: "서버 확인 중", 3: "서버 점검 중" };

function render(state, text) {
  el.className = "status " + state;
  el.querySelector(".status-text").textContent = text;
  el.hidden = false;
}

async function update() {
  try {
    const res = await fetch(KUMA_URL + "/api/status-page/heartbeat/" + KUMA_SLUG, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const beats = data.heartbeatList[KUMA_MONITOR_ID] || [];
    const last = beats[beats.length - 1];
    if (!last) throw new Error("no heartbeat");
    const uptime = data.uptimeList[KUMA_MONITOR_ID + "_24"];
    let text = LABELS[last.status] || LABELS[0];
    if (typeof uptime === "number") text += " · 24시간 가동률 " + (uptime * 100).toFixed(1) + "%";
    render(last.status === 1 ? "on" : last.status === 0 ? "off" : "", text);
  } catch (e) {
    render("off", "서버 오프라인");
  }
}

if (el && KUMA_URL) {
  update();
  setInterval(update, 60000);
}
