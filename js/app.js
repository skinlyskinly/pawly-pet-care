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
    cat:     "나비의 지금 모습",
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

  /* =========================================================
     나비 상태 — AI 자동 분석 (보호자가 고르지 않음)
     표정·자세·활동 데이터를 분석해 현재 상태를 추정하고,
     실시간 모니터링처럼 주기적으로 다시 분석합니다.
     ========================================================= */
  const stage     = $("#catStage");
  const moodEmoji = $("#catMoodEmoji");
  const moodLabel = $("#catMoodLabel");
  const catDesc   = $("#catDesc");
  const aiStatus  = $("#aiStatus");
  const aiConf    = $("#aiConf");
  const aiBars    = $("#aiBars");
  const alertBox  = $("#catAlert");

  const STATE_KEYS = D.catStates.map((s) => s.key);
  // 건강한 상태가 더 자주 추정되도록 가중치 (실제로는 모델 출력)
  const WEIGHTS = { calm: 34, happy: 24, sleepy: 18, alert: 12, lonely: 8, sick: 4 };

  function pickState() {
    const total = STATE_KEYS.reduce((a, k) => a + (WEIGHTS[k] || 1), 0);
    let r = Math.random() * total;
    for (const k of STATE_KEYS) {
      r -= WEIGHTS[k] || 1;
      if (r <= 0) return k;
    }
    return STATE_KEYS[0];
  }

  // 추정 상태에 높은 신뢰도를 주고 나머지를 후보로 분배 (합 100)
  function genConfidence(topKey) {
    const scores = {};
    const top = 82 + Math.floor(Math.random() * 13); // 82~94%
    scores[topKey] = top;
    const others = STATE_KEYS.filter((k) => k !== topKey);
    const ws = others.map(() => Math.random() + 0.05);
    const sum = ws.reduce((a, b) => a + b, 0);
    let used = 0;
    others.forEach((k, i) => {
      const v = i === others.length - 1 ? 100 - top - used : Math.max(1, Math.round((100 - top) * ws[i] / sum));
      scores[k] = v;
      used += v;
    });
    return scores;
  }

  function renderBars(scores, topKey) {
    const sorted = STATE_KEYS.map((k) => ({ k, v: scores[k] })).sort((a, b) => b.v - a.v);
    aiBars.innerHTML = sorted
      .map(({ k, v }) => {
        const s = D.catStates.find((x) => x.key === k);
        return `
        <div class="ai-bar-row ${k === topKey ? "top" : ""}">
          <span class="ai-bar-label">${s.emoji} ${s.label}</span>
          <span class="ai-bar-track"><i style="width:0" data-w="${v}"></i></span>
          <span class="ai-bar-pct">${v}%</span>
        </div>`;
      })
      .join("");
    requestAnimationFrame(() =>
      $$("#aiBars i").forEach((i) => (i.style.width = i.dataset.w + "%"))
    );
  }

  // 추정 결과를 화면에 반영 (표정·애니메이션·설명·알림)
  function applyState(key) {
    const s = D.catStates.find((x) => x.key === key);
    if (!s) return;
    STATE_KEYS.forEach((k) => stage.classList.remove("state-" + k));
    stage.classList.add("state-" + key);

    moodEmoji.textContent = s.emoji;
    moodLabel.textContent = s.label;
    catDesc.textContent   = s.desc;

    alertBox.className = "cat-alert tone-" + s.alert.tone;
    alertBox.innerHTML = `<span class="alert-ico">${s.alert.ico}</span><p>${s.alert.text}</p>`;

    stage.classList.remove("switching");
    void stage.offsetWidth;
    stage.classList.add("switching");
  }

  // 한 번의 분석 사이클: "분석 중" → 결과 공개
  function analyze() {
    stage.classList.add("analyzing");
    aiStatus.innerHTML = `<span class="ai-dot"></span> 나비의 상태를 분석하고 있어요…`;
    aiConf.textContent = "";
    moodEmoji.textContent = "🔍";
    moodLabel.textContent = "분석 중…";

    setTimeout(() => {
      const key = pickState();
      const scores = genConfidence(key);
      stage.classList.remove("analyzing");
      applyState(key);
      renderBars(scores, key);
      aiStatus.innerHTML = `<span class="ai-dot live"></span> 실시간 분석 완료`;
      aiConf.textContent = `신뢰도 ${scores[key]}% · 방금 분석됨`;
    }, 1500);
  }

  /* ---------- 초기 렌더 ---------- */
  renderChart();
  renderTips();
  renderEmotionBars();
  renderTimeline();
  renderInsights();
  renderCare();
  renderChecklist();

  analyze();                 // 진입 시 자동 분석
  setInterval(analyze, 9000); // 실시간 모니터링처럼 주기적 재분석
})();
