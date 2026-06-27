/* =========================================================
   Pawly · 손동작 인식 (MediaPipe Tasks Vision)
   - GestureRecognizer 로 보호자의 손동작을 인식
   - 인식 결과를 app.js 의 콜백(window.PawlyGesture.onResult)으로 전달
   ========================================================= */
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const video   = document.getElementById("cam");
const canvas  = document.getElementById("overlay");
const ctx     = canvas.getContext("2d");

let recognizer = null;
let running    = false;
let rafId      = null;
let lastVideoTime = -1;

// app.js 가 채워 넣는 콜백들 (없어도 동작하도록 기본값 제공)
const hub = (window.PawlyGesture = {
  onResult: () => {},   // (gestureName | null, confidence)
  onStatus: () => {},   // (statusText)
  start,
  stop,
  isRunning: () => running,
});

/* 모델 로드 (최초 1회) */
async function loadRecognizer() {
  if (recognizer) return recognizer;
  hub.onStatus("AI 모델 불러오는 중…");
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
  return recognizer;
}

/* 카메라 + 인식 시작 */
async function start() {
  if (running) return;
  try {
    await loadRecognizer();
    hub.onStatus("카메라 연결 중…");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    running = true;
    hub.onStatus("인식 중");
    predictLoop();
  } catch (err) {
    console.error(err);
    const msg =
      err && err.name === "NotAllowedError"
        ? "카메라 권한이 필요해요"
        : "카메라를 시작할 수 없어요";
    hub.onStatus(msg);
    hub.onError && hub.onError(msg);
  }
}

/* 정지 */
function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hub.onStatus("대기 중");
  hub.onResult(null, 0);
}

/* 프레임별 추론 루프 */
function predictLoop() {
  if (!running) return;

  if (video.readyState >= 2) {
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = recognizer.recognizeForVideo(video, performance.now());
      draw(result);

      if (result.gestures.length > 0) {
        const top = result.gestures[0][0]; // {categoryName, score}
        if (top.categoryName && top.categoryName !== "None") {
          hub.onResult(top.categoryName, top.score);
        } else {
          hub.onResult(null, 0);
        }
      } else {
        hub.onResult(null, 0);
      }
    }
  }
  rafId = requestAnimationFrame(predictLoop);
}

/* 손 랜드마크 오버레이 */
function draw(result) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!result.landmarks || result.landmarks.length === 0) return;
  const drawer = new DrawingUtils(ctx);
  for (const landmarks of result.landmarks) {
    drawer.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
      color: "#45C9B0",
      lineWidth: 4,
    });
    drawer.drawLandmarks(landmarks, { color: "#4A90E2", lineWidth: 1, radius: 4 });
  }
}
