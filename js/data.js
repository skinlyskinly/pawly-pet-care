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

  /* ----- 손동작 → 반려동물 반응 매핑 -----
     key 는 MediaPipe GestureRecognizer 의 기본 카테고리명과 일치 */
  gestureMap: {
    Thumb_Up:    { emoji: "👍", name: "칭찬", desc: "잘했어 신호", face: "😻", reaction: "기분이 좋아 골골송을 부르며 비벼요!" },
    Open_Palm:   { emoji: "✋", name: "이리와", desc: "부르기",     face: "🐱", reaction: "꼬리를 세우고 천천히 다가와요." },
    Victory:     { emoji: "✌️", name: "놀이",  desc: "놀이 모드",   face: "😼", reaction: "동공이 커지고 사냥 자세를 잡아요!" },
    Closed_Fist: { emoji: "✊", name: "기다려", desc: "진정/대기",   face: "😌", reaction: "식빵 자세로 얌전히 기다려요." },
    Pointing_Up: { emoji: "☝️", name: "주목",  desc: "집중시키기",  face: "👀", reaction: "귀를 쫑긋 세우고 손끝을 응시해요." },
    ILoveYou:    { emoji: "🤟", name: "사랑해", desc: "애정 표현",   face: "😽", reaction: "천천히 눈을 깜빡이며 눈인사를 보내요!" },
  },
};
