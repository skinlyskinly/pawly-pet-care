/* =========================================================
   Pawly · 앱 로직 (대시보드 렌더링 + 제스처 교감)
   ========================================================= */
(function () {
  const D = window.PAWLY;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 뷰 전환 ---------- */
  const titles = {
    home:    "나비의 하루",
    emotion: "감정 분석",
    gesture: "제스처 교감",
    care:    "AI 맞춤 케어",
  };
  function switchView(view) {
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + view));
    $$(".nav-item").forEach((n) => n.classList.toggle("is-active", n.dataset.view === view));
    $$(".m-nav").forEach((n) => n.classList.toggle("is-active", n.dataset.view === view));
    $("#pageTitle").textContent = titles[view] || "Pawly";
  }
  $$("[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => switchView(btn.dataset.view))
  );

  /* ---------- 주간 활동량 차트 ---------- */
  function renderChart() {
    const el = $("#weekChart");
    el.innerHTML = D.weeklyActivity
      .map(
        (d) => `
        <div class="col ${d.today ? "is-today" : ""}">
          <i style="height:0"></i><span>${d.day}</span>
        </div>`
      )
      .join("");
    // 애니메이션을 위해 다음 프레임에 높이 적용
    requestAnimationFrame(() => {
      $$(".col i", el).forEach((bar, i) => {
        bar.style.height = D.weeklyActivity[i].value + "%";
      });
    });
  }

  /* ---------- AI 추천 (홈) ---------- */
  function renderTips() {
    $("#tipList").innerHTML = D.tips
      .map(
        (t) => `
        <li>
          <span class="t-ico">${t.ico}</span>
          <div class="t-body"><strong>${t.title}</strong><span>${t.desc}</span></div>
        </li>`
      )
      .join("");
  }

  /* ---------- 감정 분포 ---------- */
  function renderEmotionBars() {
    $("#emotionBars").innerHTML = D.emotions
      .map(
        (e) => `
        <div class="ebar-row">
          <div class="ebar-label">${e.emoji} ${e.label}</div>
          <div class="ebar-track"><i style="width:0;background:${e.color}" data-w="${e.value}"></i></div>
          <div class="ebar-pct">${e.value}%</div>
        </div>`
      )
      .join("");
    requestAnimationFrame(() => {
      $$("#emotionBars .ebar-track i").forEach((i) => (i.style.width = i.dataset.w + "%"));
    });
  }

  /* ---------- 감정 타임라인 ---------- */
  function renderTimeline() {
    $("#emotionTimeline").innerHTML = D.timeline
      .map(
        (t) => `
        <li>
          <div class="tl-time">${t.time}</div>
          <div class="tl-dot"><span>${t.emoji}</span></div>
          <div class="tl-text">${t.text}</div>
        </li>`
      )
      .join("");
  }

  /* ---------- AI 학습 인사이트 ---------- */
  function renderInsights() {
    $("#insightList").innerHTML = D.insights
      .map((t) => `<li><span class="i-ico">◆</span><span>${t}</span></li>`)
      .join("");
  }

  /* ---------- AI 케어 플랜 ---------- */
  function renderCare() {
    $("#careGrid").innerHTML = D.carePlan
      .map(
        (c) => `
        <div class="care-item">
          <div class="care-ico ${c.mint ? "mint" : ""}">${c.ico}</div>
          <div class="care-body">
            <strong>${c.title}</strong>
            <p>${c.desc}</p>
            <span class="care-tag">${c.tag}</span>
          </div>
        </div>`
      )
      .join("");
  }

  /* ---------- 체크리스트 ---------- */
  function renderChecklist() {
    const ul = $("#checkList");
    ul.innerHTML = D.checklist
      .map(
        (c, i) => `
        <li class="${c.done ? "done" : ""}" data-i="${i}">
          <span class="check-box">✓</span>
          <span class="check-label">${c.text}</span>
        </li>`
      )
      .join("");
    $$("li", ul).forEach((li) =>
      li.addEventListener("click", () => li.classList.toggle("done"))
    );
  }

  /* ---------- 제스처 가이드 ---------- */
  function renderGuide() {
    $("#guideGrid").innerHTML = Object.entries(D.gestureMap)
      .map(
        ([key, g]) => `
        <div class="guide-item" data-gesture="${key}">
          <span class="g-emoji">${g.emoji}</span>
          <div class="g-meta"><strong>${g.name}</strong><span>${g.desc}</span></div>
        </div>`
      )
      .join("");
  }

  /* =========================================================
     제스처 교감 로직
     ========================================================= */
  const camBtn      = $("#camBtn");
  const camStatus   = $("#camStatus");
  const placeholder = $("#camPlaceholder");
  const badge       = $("#gestureBadge");
  const badgeIco    = $("#gestureBadgeIco");
  const badgeText   = $("#gestureBadgeText");
  const petFace     = $("#petFace");
  const petReaction = $("#petReaction");

  let currentGesture = null;   // 디바운스용
  let stableSince    = 0;
  const HOLD_MS = 350;         // 같은 제스처가 이만큼 유지되면 반응

  const G = window.PawlyGesture;

  // 모델/카메라 상태 표시
  G.onStatus = (txt) => { camStatus.textContent = txt; };
  G.onError  = () => { camBtn.disabled = false; camBtn.textContent = "다시 시도"; };

  // 인식 결과 처리
  G.onResult = (gestureKey, conf) => {
    if (!gestureKey) {
      badge.hidden = true;
      currentGesture = null;
      highlightGuide(null);
      return;
    }
    const info = D.gestureMap[gestureKey];
    if (!info) return;

    // 상단 배지 + 가이드 하이라이트는 즉시 반영
    badge.hidden = false;
    badgeIco.textContent  = info.emoji;
    badgeText.textContent = `${info.name} · ${Math.round(conf * 100)}%`;
    highlightGuide(gestureKey);

    // 같은 제스처가 일정시간 유지되면 펫 반응 트리거 (떨림 방지)
    const now = performance.now();
    if (gestureKey !== currentGesture) {
      currentGesture = gestureKey;
      stableSince = now;
      return;
    }
    if (now - stableSince > HOLD_MS && petFace.dataset.last !== gestureKey) {
      petFace.dataset.last = gestureKey;
      reactPet(info);
    }
  };

  function reactPet(info) {
    petFace.textContent = info.face;
    petReaction.textContent = info.reaction;
    petFace.classList.remove("react");
    void petFace.offsetWidth;       // reflow 로 애니메이션 재시작
    petFace.classList.add("react");
  }

  function highlightGuide(key) {
    $$(".guide-item").forEach((el) =>
      el.classList.toggle("lit", el.dataset.gesture === key)
    );
  }

  // 카메라 토글 버튼
  camBtn.addEventListener("click", async () => {
    if (G.isRunning()) {
      G.stop();
      camBtn.textContent = "카메라 켜기";
      camBtn.classList.remove("is-stop");
      placeholder.style.display = "flex";
      badge.hidden = true;
      petFace.dataset.last = "";
      highlightGuide(null);
      petReaction.textContent = "손동작을 기다리고 있어요…";
      petFace.textContent = "🐱";
      return;
    }
    camBtn.disabled = true;
    camBtn.textContent = "준비 중…";
    placeholder.style.display = "none";
    await G.start();
    camBtn.disabled = false;
    if (G.isRunning()) {
      camBtn.textContent = "카메라 끄기";
      camBtn.classList.add("is-stop");
    } else {
      placeholder.style.display = "flex";
    }
  });

  /* ---------- 초기 렌더 ---------- */
  renderChart();
  renderTips();
  renderEmotionBars();
  renderTimeline();
  renderInsights();
  renderCare();
  renderChecklist();
  renderGuide();
})();
