/* =========================================================
   Pawly · 목업 데이터 (AI 학습/감정/케어)
   실제 서비스에서는 센서·영상 분석 모델의 출력으로 대체됩니다.
   ========================================================= */
window.PAWLY = {
  // 주간 활동량(%) — 마지막 요소가 오늘
  weeklyActivity: [
    { day: "월", value: 55 },
    { day: "화", value: 72 },
    { day: "수", value: 48 },
    { day: "목", value: 80 },
    { day: "금", value: 63 },
    { day: "토", value: 91 },
    { day: "일", value: 68, today: true },
  ],

  // AI 감정 분석 분포
  emotions: [
    { label: "편안함",   emoji: "😻", value: 46, color: "#45C9B0" },
    { label: "사냥본능", emoji: "🐾", value: 27, color: "#4A90E2" },
    { label: "호기심",   emoji: "👀", value: 14, color: "#7FB3F0" },
    { label: "경계",     emoji: "😼", value: 9,  color: "#F0B450" },
    { label: "외로움",   emoji: "🥺", value: 4,  color: "#E08A8A" },
  ],

  // 오늘의 AI 추천 케어 (홈)
  tips: [
    { ico: "🎣", title: "사냥놀이 추천", desc: "활동량이 목표보다 낮아요. 낚싯대 놀이 10분이 좋아요." },
    { ico: "💧", title: "수분 섭취 확인", desc: "요로 건강을 위해 물그릇을 새로 채우고 정수기를 점검하세요." },
    { ico: "🧶", title: "분리불안 케어", desc: "외출 전 캣타워와 노즈워크 장난감으로 안정감을 주세요." },
  ],

  // 감정 타임라인
  timeline: [
    { time: "08:20", emoji: "🧼", text: "아침 식사 후 그루밍하며 편안하게 휴식했어요." },
    { time: "11:05", emoji: "👀", text: "창밖 새를 보며 캭캭(채터링) 소리를 냈어요." },
    { time: "13:40", emoji: "😼", text: "택배 소리에 잠깐 경계 신호가 감지됐어요." },
    { time: "15:10", emoji: "🐾", text: "낚싯대 장난감으로 활발하게 사냥놀이를 했어요." },
    { time: "16:30", emoji: "😻", text: "햇볕 드는 곳에서 식빵 자세로 편안히 쉬고 있어요." },
  ],

  // AI가 학습한 패턴
  insights: [
    "창가 캣타워에서 바깥을 관찰하는 시간이 하루 중 가장 길어요.",
    "비 오는 날에는 활동량이 평균 20% 줄어드는 경향이 있어요.",
    "오후 1~2시 택배·초인종 소리에 경계 신호가 가장 자주 나타나요.",
    "‘츄르’ 단어와 봉지 소리에 가장 빠르게 반응(0.3초)해요.",
  ],

  // AI 맞춤 케어 플랜
  carePlan: [
    { ico: "🥗", mint: false, title: "맞춤 식단", desc: "체중·활동량 기반 1일 권장 200kcal", tag: "AI 분석" },
    { ico: "💧", mint: true,  title: "요로 케어", desc: "하부요로질환 예방 위해 수분 섭취 모니터링", tag: "품종 맞춤" },
    { ico: "🧠", mint: false, title: "사냥 본능 자극", desc: "낚싯대·노즈워크로 사냥 욕구 충족", tag: "감정 안정" },
    { ico: "🪮", mint: true,  title: "헤어볼 관리", desc: "이번 주 빗질 3회 + 헤어볼 간식 급여", tag: "주간 일정" },
  ],

  // 돌봄 체크리스트
  checklist: [
    { text: "아침 사료 급여", done: true },
    { text: "화장실(모래) 청소", done: true },
    { text: "물그릇 교체", done: false },
    { text: "사냥놀이 시간", done: false },
    { text: "저녁 사료 급여", done: false },
  ],

  /* ----- 감정·건강 상태별 나비의 모습 -----
     key 는 .cat-stage 의 상태 클래스(state-<key>)와 일치 */
  defaultState: "calm",
  catStates: [
    { key: "calm",   emoji: "😊", label: "편안해요",
      desc: "나비는 지금 안정적이에요. 수염과 귀가 부드럽게 풀려 있고 호흡이 일정해요.",
      alert: { tone: "ok",   ico: "✅", text: "특별한 이상 신호가 없어요. 지금처럼 케어를 유지해 주세요." } },
    { key: "happy",  emoji: "😻", label: "행복해요",
      desc: "골골송을 부르며 기분이 아주 좋아요. 보호자와의 교감으로 애정 호르몬이 올라간 상태예요.",
      alert: { tone: "ok",   ico: "💖", text: "교감이 잘 되고 있어요. 짧은 놀이로 마무리하면 더 좋아요." } },
    { key: "sleepy", emoji: "😴", label: "졸려요",
      desc: "눈을 감고 식빵 자세로 휴식 중이에요. 깊은 수면으로 체력을 회복하고 있어요.",
      alert: { tone: "ok",   ico: "🌙", text: "수면을 방해하지 않도록 조용한 환경을 유지해 주세요." } },
    { key: "alert",  emoji: "😼", label: "경계 중",
      desc: "귀를 세우고 동공이 커졌어요. 낯선 소리나 환경 변화에 긴장하고 있어요.",
      alert: { tone: "warn", ico: "⚠️", text: "스트레스 신호예요. 자극을 줄이고 숨을 곳을 마련해 주세요." } },
    { key: "lonely", emoji: "🥺", label: "외로워요",
      desc: "혼자 있는 시간이 길어 활력이 떨어졌어요. 보호자를 찾는 울음이 늘었어요.",
      alert: { tone: "warn", ico: "🧶", text: "교감 시간을 늘리고 자동 급식기·장난감으로 외로움을 달래주세요." } },
    { key: "sick",   emoji: "🤕", label: "아파요",
      desc: "활동량과 식욕이 평소보다 크게 줄었어요. 몸을 웅크리고 그루밍을 거의 하지 않아요.",
      alert: { tone: "bad",  ico: "🏥", text: "건강 이상 신호가 감지됐어요. 가까운 시일 내 수의사 상담을 권장해요." } },
  ],
};
