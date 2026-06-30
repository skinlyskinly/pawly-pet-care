/* ============================================================
   Pawly — 반려동물 건강 체크 앱  (순수 JS, 빌드 없음)
   - localStorage 기반 기록/프로필
   - mediapipe/tasks-vision ObjectDetector 로 얼굴·자세·움직임 감지
   ============================================================ */

/* ---------------- Storage ---------------- */
const KEY = { profile: "pawly:profile", records: "pawly:records" };

const store = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};

let profile = store.get(KEY.profile, null);
let records = store.get(KEY.records, []); // newest-first

/* ---------------- Date helpers ---------------- */
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function fmtDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { label: `${m}월 ${d}일`, weekday: WEEKDAYS[date.getDay()], date };
}

/* ---------------- Condition analysis ----------------
   각 항목의 비정상 값을 "신호(flag)"로 모아 컨디션을 판정.
   강한 신호=2점, 약한 신호=1점. 합산으로 good / warn 결정.        */
const FLAGS = {
  meal:     { 안먹음: { w: 2, msg: "식사를 하지 않았어요" }, 적게: { w: 1, msg: "식사량이 줄었어요" } },
  water:    { 적게:   { w: 1, msg: "물을 적게 마셨어요" },   많이: { w: 1, msg: "물을 평소보다 많이 마셨어요" } },
  activity: { 무기력: { w: 2, msg: "기운이 없어 보여요" },   적음: { w: 1, msg: "활동량이 적었어요" } },
  poop:     { 묽음:   { w: 2, msg: "배변이 묽었어요" },       변비: { w: 1, msg: "배변이 어려워 보여요" }, 없음: { w: 1, msg: "배변 기록이 없어요" } },
  mood:     { 처짐:   { w: 2, msg: "기분이 가라앉아 보여요" }, 예민: { w: 1, msg: "평소보다 예민했어요" } },
};

function analyze(rec) {
  const signals = [];
  let score = 0, strong = 0;
  for (const key of Object.keys(FLAGS)) {
    const hit = FLAGS[key][rec[key]];
    if (hit) { signals.push(hit.msg); score += hit.w; if (hit.w >= 2) strong++; }
  }
  const warn = score >= 3 || strong >= 2;
  const level = warn ? "warn" : "good";
  const label = warn ? "주의 필요" : "평소와 비슷함";
  let headline, sub;
  if (warn) {
    headline = "오늘은 조금 살펴봐 주세요";
    sub = signals.slice(0, 2).join(" · ") + (signals.length > 2 ? " 외 변화가 보여요" : ". 변화가 이어지면 기록해 두세요");
  } else if (signals.length) {
    headline = "전반적으로 안정적이에요";
    sub = signals[0] + ". 그 외에는 평소와 비슷해요";
  } else {
    headline = "오늘 컨디션이 좋아요";
    sub = "식사·활동·기분 모두 평소와 비슷해요";
  }
  return { level, label, headline, sub, signals };
}

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-show"), 2200);
}

/* ---------------- Navigation ---------------- */
const VIEWS = ["home", "check", "camera", "records", "profile"];

function showView(name) {
  if (!VIEWS.includes(name)) name = "home";
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${name}`));
  document.querySelectorAll(".nav__link").forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  const hash = name === "home" ? "" : "#" + name;
  if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname + location.search);
  if (name === "home") renderHome();
  if (name === "records") renderRecords();
  if (name === "profile") fillProfileForm();
  if (name === "check") prefillCheck();
  if (name !== "camera") stopCamera();
}

window.addEventListener("hashchange", () => showView(location.hash.slice(1) || "home"));

document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-view]");
  if (trigger) showView(trigger.dataset.view);
});

/* ---------------- HOME ---------------- */
const METRICS = [
  { key: "meal",     ico: "🍽️", label: "식사" },
  { key: "water",    ico: "💧", label: "물" },
  { key: "activity", ico: "🦴", label: "활동" },
  { key: "mood",     ico: "💛", label: "기분" },
];

function petName() { return profile?.name ? profile.name : "반려동물"; }

function renderHome() {
  const greet = document.getElementById("home-greeting");
  greet.textContent = profile ? `${profile.name}의 오늘` : "안녕하세요 🐾";
  document.getElementById("home-avatar").textContent = profile?.emoji || "🐾";

  const { label, weekday } = fmtDate(todayKey());
  document.getElementById("home-date").textContent = `${label} (${weekday})`;

  const today = records.find((r) => r.date === todayKey());
  const badge = document.getElementById("home-badge");
  const headline = document.getElementById("home-headline");
  const sub = document.getElementById("home-sub");
  const btn = document.querySelector("#home-status .btn");

  if (today) {
    const a = analyze(today);
    badge.textContent = a.label;
    badge.className = "status-badge " + (a.level === "warn" ? "is-warn" : "is-good");
    headline.textContent = a.headline;
    sub.textContent = a.sub;
    btn.textContent = "오늘 기록 수정하기";
  } else {
    badge.textContent = "기록 권장";
    badge.className = "status-badge is-note";
    headline.textContent = `${petName()}의 오늘을 기록해 주세요`;
    sub.textContent = "식사·활동·기분을 체크하면 컨디션을 한눈에 보여드려요.";
    btn.textContent = "오늘 체크하기";
  }

  // metric cards
  const grid = document.getElementById("home-metrics");
  grid.innerHTML = METRICS.map((m) => {
    const val = today ? today[m.key] : "—";
    const flagged = today && FLAGS[m.key]?.[today[m.key]];
    return `<div class="metric${flagged ? " is-flag" : ""}">
      <span class="metric__ico">${m.ico}</span>
      <span class="metric__label">${m.label}</span>
      <span class="metric__value">${val}</span>
    </div>`;
  }).join("");

  renderTrend();
}

function renderTrend() {
  const wrap = document.getElementById("home-trend");
  const days = [];
  const base = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, weekday: WEEKDAYS[d.getDay()] });
  }
  wrap.innerHTML = days.map((d) => {
    const rec = records.find((r) => r.date === d.key);
    let cls = "fill--empty", h = 16;
    if (rec) {
      const a = analyze(rec);
      cls = a.level === "warn" ? "fill--warn" : "fill--good";
      h = a.level === "warn" ? 52 : 84;
    }
    return `<div class="trend__bar" title="${d.key}">
      <div class="trend__fill ${cls}" style="height:${h}%"></div>
      <span class="trend__day">${d.weekday}</span>
    </div>`;
  }).join("");
}

/* ---------------- CHECK ---------------- */
function prefillCheck() {
  const { label, weekday } = fmtDate(todayKey());
  document.getElementById("check-date").textContent = `${label} (${weekday})`;
  const form = document.getElementById("check-form");
  const today = records.find((r) => r.date === todayKey());
  document.getElementById("check-hint").textContent = today ? "오늘 기록이 있어요. 수정 후 다시 저장할 수 있어요." : "";
  if (today) {
    ["meal", "water", "activity", "poop", "mood"].forEach((k) => {
      const input = form.querySelector(`input[name="${k}"][value="${today[k]}"]`);
      if (input) input.checked = true;
    });
    form.querySelector("#check-memo").value = today.memo || "";
  }
}

document.getElementById("check-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const rec = {
    date: todayKey(),
    meal: data.get("meal"),
    water: data.get("water"),
    activity: data.get("activity"),
    poop: data.get("poop"),
    mood: data.get("mood"),
    memo: (data.get("memo") || "").trim(),
    updatedAt: Date.now(),
  };
  const idx = records.findIndex((r) => r.date === rec.date);
  if (idx >= 0) { rec.ai = records[idx].ai; records[idx] = rec; }
  else records.unshift(rec);
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  store.set(KEY.records, records);

  const a = analyze(rec);
  const hint = document.getElementById("check-hint");
  hint.textContent = `저장됐어요 · ${a.label}`;
  hint.classList.add("is-ok");
  toast("오늘 기록을 저장했어요 🐾");
  setTimeout(() => showView("home"), 700);
});

/* ---------------- RECORDS ---------------- */
function renderRecords() {
  const list = document.getElementById("records-list");
  const empty = document.getElementById("records-empty");
  if (!records.length) { list.innerHTML = ""; empty.hidden = false; return; }
  empty.hidden = true;

  list.innerHTML = records.map((r) => {
    const { label, weekday } = fmtDate(r.date);
    const a = analyze(r);
    const items = [
      ["🍽️", r.meal], ["💧", r.water], ["🦴", r.activity], ["🚽", r.poop], ["💛", r.mood],
    ];
    const tags = items.map(([ico, val]) => {
      const flagged = false; // per-item flag handled by status badge
      return `<span class="tag${flagged ? " is-flag" : ""}">${ico} ${val}</span>`;
    }).join("");
    const badgeCls = a.level === "warn" ? "is-warn" : "is-good";
    const aiTag = r.ai ? `<span class="tag is-flag">📷 ${r.ai.label}</span>` : "";
    return `<article class="record">
      <div class="record__head">
        <div>
          <span class="record__date">${label}</span>
          <span class="record__weekday"> ${weekday}요일</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="status-badge ${badgeCls}">${a.label}</span>
          <button class="record__del" data-del="${r.date}" aria-label="삭제">×</button>
        </div>
      </div>
      <div class="record__tags">${tags}${aiTag}</div>
      ${r.memo ? `<p class="record__memo">📝 ${escapeHtml(r.memo)}</p>` : ""}
    </article>`;
  }).join("");

  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("이 날짜의 기록을 삭제할까요?")) return;
      records = records.filter((r) => r.date !== btn.dataset.del);
      store.set(KEY.records, records);
      renderRecords();
      toast("기록을 삭제했어요");
    });
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- PROFILE ---------------- */
function fillProfileForm() {
  const f = document.getElementById("profile-form");
  f.name.value = profile?.name || "";
  f.age.value = profile?.age || "";
  f.species.value = profile?.species || "";
  f.traits.value = profile?.traits || "";
  setEmoji(profile?.emoji || "🐾");
}

function setEmoji(emoji) {
  document.getElementById("profile-emoji").textContent = emoji;
  document.querySelectorAll("#emoji-pick button").forEach((b) =>
    b.classList.toggle("is-sel", b.dataset.emoji === emoji));
}

document.getElementById("emoji-pick").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (b) setEmoji(b.dataset.emoji);
});

document.getElementById("profile-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  profile = {
    name: (data.get("name") || "").trim(),
    age: (data.get("age") || "").trim(),
    species: (data.get("species") || "").trim(),
    traits: (data.get("traits") || "").trim(),
    emoji: document.getElementById("profile-emoji").textContent,
  };
  store.set(KEY.profile, profile);
  const hint = document.getElementById("profile-hint");
  hint.textContent = "프로필을 저장했어요";
  hint.classList.add("is-ok");
  toast(`${profile.name}의 프로필을 저장했어요 🐾`);
});

/* ============================================================
   CAMERA  +  mediapipe ObjectDetector
   ============================================================ */
const TASKS_VERSION = "0.10.14";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
// efficientdet(COCO) 기준 반려동물·동물 카테고리
const PET_CLASSES = new Set(["cat", "dog", "bird", "horse", "sheep", "cow", "teddy bear"]);
const PET_KR = { cat: "고양이", dog: "강아지", bird: "새", horse: "말", sheep: "양", cow: "소", "teddy bear": "인형" };

const cam = {
  stream: null, detector: null, raf: null, running: false,
  video: document.getElementById("camera-video"),
  canvas: document.getElementById("camera-overlay"),
  prevCenter: null, lastTime: -1,
  frames: 0, detected: 0, motionSum: 0, ratioSum: 0, ratioCount: 0,
  bestClass: null,
};

async function ensureDetector() {
  if (cam.detector) return cam.detector;
  const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}`);
  const { FilesetResolver, ObjectDetector } = vision;
  const files = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`);
  cam.detector = await ObjectDetector.createFromOptions(files, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    scoreThreshold: 0.35,
    maxResults: 5,
    runningMode: "VIDEO",
  });
  return cam.detector;
}

function setLoading(on, text) {
  const el = document.getElementById("camera-loading");
  el.hidden = !on;
  if (text) document.getElementById("camera-loading-text").textContent = text;
}

async function startCamera() {
  const startBtn = document.getElementById("camera-start");
  const stopBtn = document.getElementById("camera-stop");
  const hint = document.getElementById("camera-hint");
  startBtn.disabled = true;

  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("이 브라우저는 카메라를 지원하지 않아요.");
    setLoading(true, "AI 모델을 불러오는 중…");

    // 카메라 + 모델 동시 준비
    const [stream] = await Promise.all([
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 640, height: 480 }, audio: false }),
      ensureDetector(),
    ]);
    cam.stream = stream;
    cam.video.srcObject = stream;
    await cam.video.play();

    document.getElementById("camera-stage").classList.add("is-live");
    document.getElementById("camera-readout").hidden = false;
    setLoading(false);
    startBtn.hidden = true;
    stopBtn.hidden = false;
    hint.textContent = "반려동물을 화면 가운데에 비춰 주세요.";

    resetStats();
    cam.running = true;
    loop();
  } catch (err) {
    setLoading(false);
    startBtn.disabled = false;
    startBtn.hidden = false;
    const msg = err?.name === "NotAllowedError"
      ? "카메라 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요."
      : (err?.message || "카메라를 시작할 수 없어요.");
    hint.textContent = msg;
    showResult("note", "기록 권장", "카메라를 사용할 수 없어요", msg);
  }
}

function resetStats() {
  cam.prevCenter = null; cam.lastTime = -1;
  cam.frames = 0; cam.detected = 0; cam.motionSum = 0;
  cam.ratioSum = 0; cam.ratioCount = 0; cam.bestClass = null;
}

function loop() {
  if (!cam.running) return;
  const v = cam.video;
  if (v.readyState >= 2 && v.currentTime !== cam.lastTime) {
    cam.lastTime = v.currentTime;
    const res = cam.detector.detectForVideo(v, performance.now());
    handleDetections(res?.detections || []);
    cam.frames++;
    if (cam.frames % 10 === 0) updateLiveResult();
  }
  cam.raf = requestAnimationFrame(loop);
}

function handleDetections(detections) {
  const W = cam.video.videoWidth, H = cam.video.videoHeight;
  const cv = cam.canvas; cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  // 반려동물 후보 중 점수 최고 1개
  let best = null;
  for (const d of detections) {
    const cat = d.categories?.[0];
    if (!cat) continue;
    if (PET_CLASSES.has(cat.categoryName) && (!best || cat.score > best.score)) {
      best = { box: d.boundingBox, score: cat.score, name: cat.categoryName };
    }
  }

  if (best) {
    cam.detected++;
    cam.bestClass = best.name;
    const b = best.box;
    const cx = b.originX + b.width / 2, cy = b.originY + b.height / 2;
    if (cam.prevCenter) {
      const dx = (cx - cam.prevCenter.x) / W, dy = (cy - cam.prevCenter.y) / H;
      cam.motionSum += Math.hypot(dx, dy);
    }
    cam.prevCenter = { x: cx, y: cy };
    cam.ratioSum += b.width / Math.max(b.height, 1);
    cam.ratioCount++;

    // overlay (좌우 반전된 영상에 맞춰 박스도 미러링)
    const mx = W - (b.originX + b.width);
    ctx.lineWidth = Math.max(2, W / 200);
    ctx.strokeStyle = "#7FA968";
    ctx.fillStyle = "rgba(127,169,104,.14)";
    roundRect(ctx, mx, b.originY, b.width, b.height, 14);
    ctx.fill(); ctx.stroke();
  } else {
    cam.prevCenter = null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function computeAnalysis() {
  const ratio = cam.frames ? cam.detected / cam.frames : 0;
  const motion = cam.detected > 1 ? (cam.motionSum / (cam.detected - 1)) * 100 : 0; // 평균 이동량(%)
  const aspect = cam.ratioCount ? cam.ratioSum / cam.ratioCount : 0;

  const detectText = ratio < 0.2 ? "잘 안 보임" : ratio < 0.5 ? "간헐적" : "양호";
  const motionText = motion < 0.6 ? "거의 없음" : motion < 2.2 ? "안정적" : "활발함";
  const poseText = !aspect ? "—" : aspect > 1.5 ? "엎드림/늘어짐" : aspect < 0.85 ? "앉음/서있음" : "편안한 자세";
  const petKr = cam.bestClass ? PET_KR[cam.bestClass] : null;

  let level, label, headline, sub;
  if (ratio < 0.2) {
    level = "note"; label = "기록 권장";
    headline = "반려동물이 화면에 잘 잡히지 않았어요";
    sub = "가까이서 밝은 곳에 비춰 다시 시도하거나, 오늘 상태를 직접 기록해 주세요.";
  } else if (motion >= 3.2) {
    level = "warn"; label = "주의 필요";
    headline = `${petKr || "아이"}가 평소보다 부산해 보여요`;
    sub = "움직임이 많고 안정되지 않았어요. 불편한 곳이 없는지 살펴봐 주세요.";
  } else if (motion < 0.6 && ratio >= 0.5) {
    level = "note"; label = "기록 권장";
    headline = "움직임이 거의 없어요";
    sub = "쉬는 중일 수 있어요. 식사·활동량과 함께 기록해 두면 변화를 알아보기 쉬워요.";
  } else {
    level = "good"; label = "평소와 비슷함";
    headline = `${petKr || "아이"}가 안정적으로 보여요`;
    sub = `${poseText} · 움직임 ${motionText}. 표정과 자세가 평소와 비슷해요.`;
  }
  return { level, label, headline, sub, detectText, motionText, poseText };
}

function updateLiveResult() {
  const a = computeAnalysis();
  document.getElementById("ro-detect").textContent = a.detectText;
  document.getElementById("ro-motion").textContent = a.motionText;
  document.getElementById("ro-pose").textContent = a.poseText;
  showResult(a.level, a.label, a.headline, a.sub, true);
}

function showResult(level, label, headline, sub, allowSave) {
  const card = document.getElementById("camera-result");
  card.hidden = false;
  const badge = document.getElementById("cr-badge");
  badge.textContent = label;
  badge.className = "status-badge " + (level === "warn" ? "is-warn" : level === "good" ? "is-good" : "is-note");
  document.getElementById("cr-headline").textContent = headline;
  document.getElementById("cr-sub").textContent = sub;
  const saveBtn = document.getElementById("camera-save");
  saveBtn.hidden = !allowSave;
  cam.lastResult = { level, label };
}

function stopCamera() {
  cam.running = false;
  if (cam.raf) cancelAnimationFrame(cam.raf);
  if (cam.stream) { cam.stream.getTracks().forEach((t) => t.stop()); cam.stream = null; }
  cam.video.srcObject = null;
  document.getElementById("camera-stage").classList.remove("is-live");
  const startBtn = document.getElementById("camera-start");
  startBtn.hidden = false; startBtn.disabled = false;
  document.getElementById("camera-stop").hidden = true;
}

document.getElementById("camera-start").addEventListener("click", startCamera);
document.getElementById("camera-stop").addEventListener("click", () => {
  stopCamera();
  if (cam.frames > 0) { const a = computeAnalysis(); showResult(a.level, a.label, a.headline, a.sub, true); }
  document.getElementById("camera-hint").textContent = "분석을 멈췄어요. 결과를 오늘 기록에 반영할 수 있어요.";
});

document.getElementById("camera-save").addEventListener("click", () => {
  if (!cam.lastResult) return;
  let rec = records.find((r) => r.date === todayKey());
  if (!rec) {
    rec = { date: todayKey(), meal: "보통", water: "보통", activity: "보통", poop: "정상", mood: "편안", memo: "", updatedAt: Date.now() };
    records.unshift(rec);
  }
  rec.ai = { level: cam.lastResult.level, label: cam.lastResult.label, at: Date.now() };
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  store.set(KEY.records, records);
  toast("AI 분석 결과를 오늘 기록에 반영했어요 📷");
});

/* ---------------- Init ---------------- */
showView(location.hash.slice(1) || "home");
window.addEventListener("beforeunload", stopCamera);
