// 서버 3D 모델: 드래그로 회전, 손을 떼면 천천히 자동 회전
(function () {
  const stage = document.getElementById("model");
  if (!stage) return;
  const box = stage.querySelector(".box");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let rx = -12, ry = -35;
  let dragging = false, lastX = 0, lastY = 0, visible = true;

  function draw() {
    box.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
  }

  function tick() {
    if (!dragging && visible && !still) {
      ry += 0.2;
      draw();
    }
    requestAnimationFrame(tick);
  }

  stage.addEventListener("pointerdown", function (e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  });

  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    ry += (e.clientX - lastX) * 0.5;
    rx = Math.max(-60, Math.min(60, rx - (e.clientY - lastY) * 0.5));
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

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(stage);
  }

  draw();
  requestAnimationFrame(tick);
})();
