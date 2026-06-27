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
     나비 상태 애니메이션 (감정·건강에 따라 모습 변화)
     ========================================================= */
  const stage      = $("#catStage");
  const moodEmoji  = $("#catMoodEmoji");
  const moodLabel  = $("#catMoodLabel");
  const catDesc    = $("#catDesc");
  const picker     = $("#statePicker");
  const alertBox   = $("#catAlert");

  const STATE_KEYS = D.catStates.map((s) => s.key);

  function renderStatePicker() {
    picker.innerHTML = D.catStates
      .map(
        (s) => `
        <button class="state-chip" data-state="${s.key}" title="${s.label}">
          <span>${s.emoji}</span><small>${s.label}</small>
        </button>`
      )
      .join("");
    $$(".state-chip", picker).forEach((b) =>
      b.addEventListener("click", () => setCatState(b.dataset.state))
    );
  }

  function setCatState(key) {
    const s = D.catStates.find((x) => x.key === key);
    if (!s) return;

    // 상태 클래스 교체 → CSS 가 표정·애니메이션을 전환
    STATE_KEYS.forEach((k) => stage.classList.remove("state-" + k));
    stage.classList.add("state-" + key);

    moodEmoji.textContent = s.emoji;
    moodLabel.textContent = s.label;
    catDesc.textContent   = s.desc;

    alertBox.className = "cat-alert tone-" + s.alert.tone;
    alertBox.innerHTML = `<span class="alert-ico">${s.alert.ico}</span><p>${s.alert.text}</p>`;

    $$(".state-chip", picker).forEach((b) =>
      b.classList.toggle("is-active", b.dataset.state === key)
    );

    // 전환 시 살짝 튀어오르는 모션
    stage.classList.remove("switching");
    void stage.offsetWidth;
    stage.classList.add("switching");
  }

  /* ---------- 초기 렌더 ---------- */
  renderChart();
  renderTips();
  renderEmotionBars();
  renderTimeline();
  renderInsights();
  renderCare();
  renderChecklist();
  renderStatePicker();
  setCatState(D.defaultState || "calm");
})();
