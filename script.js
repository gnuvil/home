// 상태 서버의 공개 주소. 비워 두면 상태 표시가 숨겨집니다.
const STATUS_URL = "";

const el = document.getElementById("status");

function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return d + "일 " + h + "시간";
  if (h > 0) return h + "시간 " + m + "분";
  return m + "분";
}

function render(online, text) {
  el.className = "status " + (online ? "on" : "off");
  el.querySelector(".status-text").textContent = text;
  el.hidden = false;
}

async function update() {
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const s = await res.json();
    render(true, "서버 온라인 · 가동 " + formatUptime(s.uptime) +
      " · CPU " + Math.min(100, Math.round(100 * s.load / s.cpus)) + "%" +
      " · 메모리 " + s.memory + "%");
  } catch (e) {
    render(false, "서버 오프라인");
  }
}

if (el && STATUS_URL) {
  update();
  setInterval(update, 30000);
}
