// IBM System x3500 M4 타워 서버 3D 모델 (드래그로 회전)
// 단위: 100mm. 실제 크기 폭 218 x 높이 440 x 깊이 750mm
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.getElementById("model");
const canvas = document.getElementById("model-canvas");

const W = 2.18, H = 4.4, D = 7.5;
const FOOT = 0.12;              // 바닥 받침 높이
const BEZEL = 0.3;              // 앞 베젤 두께
const FRONT = D / 2;            // 앞면 z
const TOP = FOOT + H;           // 윗면 y

// ---------- 텍스처 ----------
function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

// 벌집 모양 통풍구
function honeycomb(rx, ry) {
  return canvasTexture(32, 56, (g, w, h) => {
    g.fillStyle = "#2b2d31";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#050506";
    const hex = (cx, cy) => {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        g.lineTo(cx + 13 * Math.cos(a), cy + 13 * Math.sin(a));
      }
      g.fill();
    };
    for (const [x, y] of [[0, 0], [w, 0], [w / 2, h / 2], [0, h], [w, h]]) hex(x, y);
  }, [rx, ry]);
}

// 둥근 구멍 타공판
function perforated(rx, ry) {
  return canvasTexture(32, 32, (g, w, h) => {
    g.fillStyle = "#3a3d42";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#08090a";
    for (const [x, y] of [[8, 8], [24, 24]]) {
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
  }, [rx, ry]);
}

function label(text, w, h, size, color) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = color;
    g.font = "600 " + size + "px Arial, sans-serif";
    g.textBaseline = "middle";
    g.fillText(text, 4, h / 2);
  });
}

// ---------- 재질 ----------
const mat = {
  steel: new THREE.MeshStandardMaterial({ color: 0x3a3e44, metalness: 0.55, roughness: 0.45 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x1d1f23, metalness: 0.6, roughness: 0.5 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x17181b, metalness: 0.1, roughness: 0.55 }),
  plasticLight: new THREE.MeshStandardMaterial({ color: 0x3b3e44, metalness: 0.1, roughness: 0.5 }),
  hole: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xe8701a, roughness: 0.5 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: 0.5 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xa9adb3, metalness: 0.9, roughness: 0.3 }),
  ledGreen: new THREE.MeshStandardMaterial({ color: 0x1f8f3a, emissive: 0x3dff6e, emissiveIntensity: 1.2 }),
  ledAmber: new THREE.MeshStandardMaterial({ color: 0x5a3a0a, emissive: 0xffa21f, emissiveIntensity: 0.25 }),
  ledBlue: new THREE.MeshStandardMaterial({ color: 0x1a3d8f, emissive: 0x4d8dff, emissiveIntensity: 0.8 }),
};

const server = new THREE.Group();

function box(w, h, d, material, x, y, z, radius) {
  const geo = radius
    ? new RoundedBoxGeometry(w, h, d, 3, radius)
    : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  server.add(m);
  return m;
}

// 앞면에 붙는 평면 (텍스처용)
function plate(w, h, material, x, y, z, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  if (ry) m.rotation.y = ry;
  server.add(m);
  return m;
}

// ---------- 본체 ----------
const bodyD = D - BEZEL;
box(W, H, bodyD, mat.steel, 0, FOOT + H / 2, -BEZEL / 2, 0.04);

// 옆판 이음선과 손잡이 홈
for (const side of [-1, 1]) {
  box(0.01, H - 0.3, 0.02, mat.steelDark, side * (W / 2 + 0.002), FOOT + H / 2, FRONT - BEZEL - 0.6);
  box(0.01, 0.05, bodyD - 0.4, mat.steelDark, side * (W / 2 + 0.002), TOP - 0.25, -BEZEL / 2);
}
// 윗면 손잡이 홈
box(W - 0.5, 0.02, 1.2, mat.steelDark, 0, TOP + 0.005, FRONT - BEZEL - 1.0, 0.008);

// ---------- 앞 베젤 ----------
box(W + 0.03, H + 0.02, BEZEL, mat.plastic, 0, FOOT + H / 2, FRONT - BEZEL / 2, 0.06);
const fz = FRONT + 0.002; // 베젤 앞면

// 광학 드라이브 베이 2개
for (let i = 0; i < 2; i++) {
  const y = TOP - 0.32 - i * 0.42;
  box(1.42, 0.36, 0.04, i === 0 ? mat.plasticLight : mat.plastic, -0.28, y, fz, 0.015);
  box(1.3, 0.02, 0.02, mat.hole, -0.28, y - 0.08, fz + 0.025);
  box(0.12, 0.05, 0.03, mat.plasticLight, 0.25, y - 0.1, fz + 0.03, 0.01);
}

// 오퍼레이터 패널 (전원 버튼, LED, USB)
const px = 0.78;
box(0.42, 0.82, 0.04, mat.plasticLight, px, TOP - 0.53, fz, 0.03);
const power = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), mat.ledGreen);
power.rotation.x = Math.PI / 2;
power.position.set(px, TOP - 0.28, fz + 0.04);
server.add(power);
box(0.05, 0.05, 0.02, mat.ledBlue, px - 0.09, TOP - 0.45, fz + 0.03);
box(0.05, 0.05, 0.02, mat.ledAmber, px + 0.09, TOP - 0.45, fz + 0.03);
for (let i = 0; i < 2; i++) {
  box(0.2, 0.07, 0.02, mat.hole, px, TOP - 0.62 - i * 0.12, fz + 0.03);
  box(0.16, 0.025, 0.02, mat.blue, px, TOP - 0.62 - i * 0.12, fz + 0.04);
}

// 2.5인치 핫스왑 드라이브 베이 (8개짜리 케이지 2단)
const bayTex = perforated(2, 10);
const trayMat = new THREE.MeshStandardMaterial({ map: bayTex, metalness: 0.4, roughness: 0.6 });
const trayW = (W - 0.36) / 8;
for (let row = 0; row < 2; row++) {
  const cy = TOP - 1.78 - row * 0.9;
  box(W - 0.22, 0.84, 0.03, mat.hole, 0, cy, fz);
  for (let i = 0; i < 8; i++) {
    const x = -((W - 0.36) / 2) + trayW * (i + 0.5);
    box(trayW - 0.025, 0.78, 0.04, mat.plastic, x, cy, fz + 0.02, 0.01);
    plate(trayW - 0.05, 0.5, trayMat, x, cy - 0.1, fz + 0.042);
    box(trayW - 0.07, 0.09, 0.03, mat.orange, x, cy + 0.31, fz + 0.045, 0.01);
    box(0.025, 0.025, 0.01, mat.ledGreen, x - 0.04, cy + 0.22, fz + 0.045);
    box(0.025, 0.025, 0.01, mat.ledAmber, x + 0.04, cy + 0.22, fz + 0.045);
  }
}

// 모델명 라벨
plate(1.3, 0.16, new THREE.MeshBasicMaterial({ map: label("System x3500 M4", 256, 32, 20, "#c4c8ce"), transparent: true }),
  -0.38, TOP - 3.03, fz + 0.01);

// 아래쪽 벌집 통풍구
plate(W - 0.22, 1.28, new THREE.MeshStandardMaterial({ map: honeycomb(9, 6), roughness: 0.6 }),
  0, FOOT + 0.82, fz + 0.01);

// ---------- 뒷면 ----------
const bz = -D / 2 - 0.002;
plate(W - 0.1, H - 0.1, mat.steelDark, 0, FOOT + H / 2, bz, Math.PI);

// 전원 공급 장치 2개 (위쪽)
for (let i = 0; i < 2; i++) {
  const x = -0.5 + i * 1.0;
  box(0.9, 0.45, 0.06, mat.plasticLight, x, TOP - 0.4, bz - 0.03, 0.02);
  plate(0.5, 0.33, new THREE.MeshStandardMaterial({ map: perforated(5, 3) }), x - 0.15, TOP - 0.4, bz - 0.062, Math.PI);
  box(0.06, 0.25, 0.08, mat.orange, x + 0.33, TOP - 0.4, bz - 0.07);
  box(0.12, 0.1, 0.02, mat.hole, x + 0.2, TOP - 0.25, bz - 0.065);
}

// 후면 팬 통풍구
plate(1.9, 1.4, new THREE.MeshStandardMaterial({ map: honeycomb(8, 6), roughness: 0.6 }), 0, TOP - 1.5, bz - 0.005, Math.PI);

// I/O 포트
const io = [
  [0.22, 0.1, mat.blue], [0.12, 0.1, mat.hole], [0.12, 0.1, mat.hole],
  [0.14, 0.12, mat.silver], [0.14, 0.12, mat.silver], [0.14, 0.12, mat.silver],
];
let ix = 0.75;
for (const [w, h, m] of io) {
  box(w, h, 0.03, m, ix - w / 2, TOP - 2.45, bz - 0.015);
  ix -= w + 0.06;
}

// PCIe 슬롯 커버 (타워 기준 가로)
for (let i = 0; i < 6; i++) {
  box(1.7, 0.1, 0.03, mat.steel, 0, TOP - 2.75 - i * 0.17, bz - 0.015);
  box(0.06, 0.06, 0.035, mat.silver, -0.8, TOP - 2.75 - i * 0.17, bz - 0.02);
}

// ---------- 받침 다리 4개 ----------
for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
  const foot = box(0.28, FOOT, 1.0, mat.plastic, sx * (W / 2 + 0.05), FOOT / 2, sz * (D / 2 - 0.45), 0.03);
  foot.rotation.y = sx * sz * 0.5;
}

// ---------- 장면 ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(5, 8, 6);
scene.add(key);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f96, 0.6));

// 바닥 그림자 (부드러운 원형)
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(W * 2.6, D * 1.25),
  new THREE.MeshBasicMaterial({
    map: canvasTexture(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, "rgba(0,0,0,0.35)");
      r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, w, h);
    }),
    transparent: true,
    depthWrite: false,
  })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.001;
server.add(shadow);

// 회전 중심을 본체 가운데로
server.position.y = -(FOOT + H / 2);
const spin = new THREE.Group();
spin.add(server);
const tilt = new THREE.Group();
tilt.add(spin);
scene.add(tilt);

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
camera.position.set(0, -0.4, 22);

let ry = -0.65, rx = 0.32;

function draw() {
  spin.rotation.y = ry;
  tilt.rotation.x = rx;
  renderer.render(scene, camera);
}

function resize() {
  const size = stage.clientWidth;
  renderer.setSize(size, size, false);
  draw();
}
new ResizeObserver(resize).observe(stage);

// ---------- 드래그 회전 ----------
let dragging = false, lastX = 0, lastY = 0;

stage.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  stage.setPointerCapture(e.pointerId);
  stage.classList.add("dragging");
});

stage.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  ry += (e.clientX - lastX) * 0.01;
  rx = Math.max(-0.2, Math.min(1.1, rx + (e.clientY - lastY) * 0.01));
  lastX = e.clientX;
  lastY = e.clientY;
  draw();
});

function stop() {
  dragging = false;
  stage.classList.remove("dragging");
}
stage.addEventListener("pointerup", stop);
stage.addEventListener("pointercancel", stop);

resize();
