/* Sylliva · v22
   Plain JavaScript, no build step, no framework.
   Data: data/entries.js (window.ENTRIES). Never written to.
   Your progress: localStorage under "vocab4000-learning" (words, daily log, XP, achievements).
   Settings: localStorage under "vocab4000-settings". */
(function () {
  "use strict";

  /* =========================================================
     1. DATA + SMALL HELPERS
     ========================================================= */
  const E = Array.isArray(window.ENTRIES) ? window.ENTRIES : [];
  const N = E.length;
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const KEYS = E.map((e) => e.w + "|" + e.l);
  const KEY_INDEX = Object.create(null);
  KEYS.forEach((k, g) => { KEY_INDEX[k] = g; });
  const KEY_SET = new Set(KEYS);
  const KEY_ALIAS = {"FLAVOUR|A1":"FLAVOR|A1","VAPOUR|A2":"VAPOR|A2","SCEPTICISM|C1":"SKEPTICISM|C1","APOLOGISE|A2":"APOLOGIZE|A2","NEIGHBOUR|A2":"NEIGHBOR|A2","COLOUR|A2":"COLOR|A2","GREY|A2":"GRAY|A2","CENTRE|A2":"CENTER|A2","FULFIL|B1":"FULFILL|B1","LABOUR|B1":"LABOR|B1","CRITICISE|B1":"CRITICIZE|B1","HUMOUR|B1":"HUMOR|B1","HONOUR|B1":"HONOR|B1","BEHAVIOUR|B1":"BEHAVIOR|B1","ANALYSE|B1":"ANALYZE|B1","DEFENCE|B1":"DEFENSE|B1","OFFENCE|B1":"OFFENSE|B1","FAVOUR|B1":"FAVOR|B1","SKILFUL|B1":"SKILLFUL|B1","ODOUR|B2":"ODOR|B2","FAVOURABLE|B2":"FAVORABLE|B2","UTILISE|B2":"UTILIZE|B2","ENDEAVOUR|B2":"ENDEAVOR|B2","MAXIMISE|B2":"MAXIMIZE|B2","MINIMISE|B2":"MINIMIZE|B2","DEMEANOUR|B2":"DEMEANOR|B2","JUDGEMENT|B2":"JUDGMENT|B2","SCEPTICAL|B2":"SKEPTICAL|B2","SYMPATHISE|B2":"SYMPATHIZE|B2","SAVOUR|B2":"SAVOR|B2","PARALYSE|B2":"PARALYZE|B2","VIGOUR|B2":"VIGOR|B2","INSTIL|B2":"INSTILL|B2","HARBOUR|B2":"HARBOR|B2","CLAMOUR|B2":"CLAMOR|B2","PUBLICISE|B2":"PUBLICIZE|B2","ENTHRAL|B2":"ENTHRALL|B2","EMPHASISE|B2":"EMPHASIZE|B2","CANDOUR|C1":"CANDOR|C1","PATRONISE|C1":"PATRONIZE|C1","AGGRANDISE|C1":"AGGRANDIZE|C1","CHASTISE|C1":"CHASTIZE|C1","ANTAGONISE|C1":"ANTAGONIZE|C1","FERVOUR|C1":"FERVOR|C1","GALVANISE|C1":"GALVANIZE|C1","RANCOUR|C1":"RANCOR|C1","ARDOUR|C1":"ARDOR|C1","SCRUTINISE|C1":"SCRUTINIZE|C1","DISHEVELLED|C1":"DISHEVELED|C1","OSTRACISE|C1":"OSTRACIZE|C1","RUMOUR|B1":"RUMOR|B1","MEAGRE|C1":"MEAGER|C2","SOMBRE|C1":"SOMBER|C1","WITH FLYING COLOURS|C1":"WITH FLYING COLORS|C1","SHOW ONE'S TRUE COLOURS|C1":"SHOW ONE'S TRUE COLORS|C1","PIECE OF CAKE|B1":"A PIECE OF CAKE|A2","CLICHE|C1":"CLICHÉ|B2","THE LAST STRAW|C1":"LAST STRAW|B2","A BLESSING IN DISGUISE|C1":"BLESSING IN DISGUISE|B2","ELEPHANT IN THE ROOM|C1":"THE ELEPHANT IN THE ROOM|C1","THE BEST OF BOTH WORLDS|B2":"BEST OF BOTH WORLDS|B2","A RED HERRING|C1":"RED HERRING|B2"}; // v22: old British-spelling keys -> current keys, so saved progress follows the word
  const CATS = [...new Set(E.map((e) => e.cat))].sort((a, b) => a.localeCompare(b, "en"));
  const CAT_TOTAL = Object.create(null);
  const LEVEL_TOTAL = Object.create(null);
  const BY_LEVEL = Object.create(null); // level -> [global indices]
  E.forEach((e, g) => {
    CAT_TOTAL[e.cat] = (CAT_TOTAL[e.cat] || 0) + 1;
    LEVEL_TOTAL[e.l] = (LEVEL_TOTAL[e.l] || 0) + 1;
    (BY_LEVEL[e.l] || (BY_LEVEL[e.l] = [])).push(g);
  });

  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const cap = (w) => w.charAt(0) + w.slice(1).toLowerCase();
  const KEY_LEARN = "vocab4000-learning";
  const KEY_SET_STORE = "vocab4000-settings";
  const KEY_VOICE = "vocab4000-voice";
  const AUDIO_CACHE = "vocab4000-audio";
  const VIEWS = ["home", "learn", "library", "practice", "flash", "quiz", "speak", "progress", "profile", "settings"];
  const NAV_OF = { home: "home", learn: "learn", library: "library", practice: "practice", flash: "practice", quiz: "practice", speak: "practice", progress: "progress", profile: "profile", settings: "settings" };

  function fmt(n) { return Number(n || 0).toLocaleString(settings.lang === "fa" ? "fa-IR" : "en-US"); }
  // Own-property check: imported/stored JSON must never reach inherited properties (e.g. "__proto__", "constructor").
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const ACH_IDS = new Set(["first", "k25", "k100", "k500", "k1000", "s3", "s7", "s30", "flawless", "voice", "sweep", "lvl5"]);
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // a real progress backup is far smaller than this
  const AUDIO_FILE_RE = /^\d{4}\.mp3$/; // build_audio_pack.py writes 0001.mp3 ... 6666.mp3 only
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  // Builds the sprite icon with DOM APIs (no innerHTML). Only plain icon names are accepted.
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgIcon(name, cls) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", cls || "ic");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#i-" + (/^[a-z][a-z-]{0,31}$/.test(String(name)) ? name : "trophy"));
    svg.appendChild(use);
    return svg;
  }
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’`]/g, "'").replace(/[^\p{L}' ]+/gu, " ").replace(/\s+/g, " ").trim();
  }
  function dayKey(d) {
    const x = d || new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function keyFromNum(n) {
    const d = new Date(n * 864e5);
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }
  function dayNum(s) { const [y, m, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  function todayKey() { return dayKey(new Date()); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function readJSON(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function getText(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function setWidth(id, pct) { const el = $(id); if (el) el.style.width = clamp(pct, 0, 100).toFixed(2) + "%"; }
  function frame(fn) { requestAnimationFrame(() => requestAnimationFrame(fn)); }
  function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  /* =========================================================
     2. TEXT (English + Persian interface)
     Only the interface changes. Headwords, meanings and examples stay as they are in the data.
     ========================================================= */
  const T = {
    en: {
      "a11y.main": "Main",
      "a11y.home": "Sylliva home",
      "a11y.sections": "Sections",
      "a11y.sound": "Sound effects",
      "a11y.theme": "Switch theme",
      "a11y.keepLearning": "Keep learning",
      "a11y.level": "Level",
      "a11y.hear": "Hear this word",
      "a11y.sort": "Sort this word",
      "a11y.status": "Status",
      "a11y.reveal": "Reveal meaning",
      "a11y.questions": "Questions",
      "a11y.source": "Word source",
      "a11y.answers": "Answers",
      "a11y.record": "Record your pronunciation",
      "a11y.activity": "Activity per day",
      "a11y.themeSeg": "Theme",
      "a11y.language": "Language",
      "a11y.motion": "Motion",
      "a11y.lowerGoal": "Lower goal",
      "a11y.raiseGoal": "Raise goal",
      "a11y.dailyGoal": "Daily goal",
      "a11y.skipLink": "Skip to content",
      "a11y.levelRange": "A1 to C2",
      "a11y.levelRangeVocab": "A1 to C2 vocabulary",
      navHome: "Home", navLearn: "Learn", navLibrary: "Library", navPractice: "Practice", navProgress: "Progress", navProfile: "Profile", navSettings: "Settings",
      undo: "Undo", skip: "Skip", review: "Review", know: "I know it", stampKnow: "I know it", stampReview: "Review",
      showFa: "Show Persian", hideFa: "Hide Persian", details: "Details", emptyToFlash: "Review flashcards", emptyToLibrary: "Browse library", emptyToLearn: "Start learning",
      catLabel: "Category", learnTitle: "Learn", libTitle: "Library", searchLabel: "Search words and meanings", searchPh: "Search words or meanings",
      showMore: "Show more", noMatchTitle: "No words match", noMatchText: "Try a shorter search or clear a filter.", clearFilters: "Clear filters",
      practiceEyebrow: "Make it stick", practiceTitle: "Practice", flashTitle: "Flashcards", flashDesc: "Reveal the meaning, then rate yourself.",
      quizTitle: "Quiz", quizLong: "Four choices per word. Ten questions a round.", speakTitle: "Pronunciation", speakLong: "Listen to the word, then say it yourself.",
      backPractice: "Practice", shuffle: "Shuffle", flipHint: "Tap or press Space to reveal", stillLearning: "Still learning", gotIt: "Got it",
      fcEmptyTitle: "No cards yet", fcEmptyText: "Words you mark for review show up here.",
      quizSetupTitle: "Set up a round", qLen: "Questions", qSrc: "Words from", qStart: "Start round", qPrompt: "What does this word mean?",
      qNext: "Next question", qSeeResults: "See results", qAgain: "New round", qReviewMissed: "Send misses to flashcards",
      qSrcMine: "My words", qSrcAll: "Whole library", qPool: "{n} words in your pool.", qNotEnough: "Not enough words yet, so this round uses the whole library.",
      qT100: "Flawless.", qT80: "Sharp.", qT50: "Getting there.", qTlow: "Worth another go.",
      qResult: "{s} of {n} right. You earned {x} XP.", qMissedSent: "{n} missed words moved to flashcards.",
      qCorrect: "Correct.", qWrong: "Not quite. It means:",
      listen: "Listen", selfAsk: "How did it sound?", tryAgain: "Try again", nailed: "I nailed it", nextWord: "Next word",
      spReady: "Tap the mic and say the word.", spNoSr: "Voice input isn't available in this browser. Listen, say it out loud, then rate yourself.",
      spListening: "Listening… say the word", spHeard: "Heard “{t}”. Try once more.", spNoSpeech: "Didn't catch anything. Try again.",
      spDenied: "Microphone is blocked. You can still rate yourself below.", spGreat: "Nice. That was clear.", spNoMic: "Mic error. Rate yourself below.",
      spNote: "{n} tries today", progEyebrow: "Stored only in this browser", progTitle: "Progress",
      kpiKnown: "Known", kpiFlash: "In flashcards", kpiFlashSub: "Need review", kpiQueue: "Still to sort", kpiToday: "Today",
      levelXp: "Level and XP", xpHow: "Sorting words, quizzes and pronunciation all earn XP.", streakLabel: "Streak", daysWord: "days",
      last14: "Last 14 days", byLevel: "By level", byCat: "By category", showAll: "Show all", achTitle: "Achievements",
      setEyebrow: "Make it yours", setAppearance: "Appearance", setTheme: "Theme", setLang: "Interface language", setMotion: "Motion",
      setSound: "Sound", setSoundOn: "Sound effects", setVolume: "Volume", setLearning: "Learning", setGoal: "Daily goal (actions)",
      replayWelcome: "Replay welcome", setFa: "Show Persian on cards", setAuto: "Hear each word automatically", setVoice: "Pronunciation", setVoiceNow: "Current voice",
      chooseVoice: "Choose voice", offlineAudio: "Offline audio", audioDl: "Download", audioRm: "Remove", setData: "Your data",
      dataNote: "Everything lives in this browser. Export a backup before you switch devices or clear browser data.",
      export: "Export", import: "Import", reset: "Reset progress", close: "Close", mCat: "Category", mFreq: "Frequency", mReg: "Register", mCtx: "Used in",
      toFlash: "Move to flashcards", toQueue: "Back to queue", markKnown: "Mark as known", goalTitle: "Today's goal", ctaLearn: "Keep learning",
      levelLabel: "Level", profEyebrow: "You, at a glance", profProgressDesc: "Charts, levels and history", profSettingsDesc: "Theme, sound, goal and backups", profAchText: "{n} of {total} unlocked", knownLabel: "Words known", recentTitle: "Recently mastered", quizDesc: "Pick the right meaning", speakDesc: "Hear it, then say it",
      flashCount: "{n} waiting", quizCount: "{n} words in your pool", speakCount: "{n} to practice", none: "Nothing yet",
      greetMorning: "Good morning", greetAfternoon: "Good afternoon", greetEvening: "Good evening",
      goalDone: "Goal reached. Everything from here is a bonus.", goalLeft: "{n} more to hit today's goal.",
      streakNow: "Current streak", bestStreak: "Best: {n} days", xpTo: "{x} XP to level {l}",
      homeSplit: "{f} in flashcards · {q} to sort", learnEyebrowAll: "All words", learnEyebrowLevel: "Level {l}",
      learnStat: "{s} sorted · {q} left in this view", learnEmptyNoWords: "Nothing here", learnEmptyNoWordsText: "No words match this view.",
      learnDoneTitle: "This view is done", learnDoneText: "Every word here is sorted. Try another category or level, or review your flashcards.",
      fcEmptyCount: "{i} of {n}", fcMeta: "{i} of {n} · {l} to go",
      sortedFlash: "{w} moved to flashcards", sortedKnown: "{w} marked as known", backQueue: "{w} is back in the queue", undone: "Undid “{w}”",
      skipped: "Skipped {w}", sweepTitle: "Clean sweep", sweepText: "You sorted every word in this view.",
      goalHitTitle: "Daily goal reached", goalHitText: "{n} actions today. Nice work.",
      levelUpTitle: "Level {l}", levelUpText: "Keep the streak going.",
      themeLight: "Light", themeDark: "Dark", themeSystem: "Match system", motionSystem: "Match system", motionReduce: "Reduce",
      langEn: "English", langFa: "فارسی", on: "On", off: "Off", sysOpt: "System",
      exported: "Progress exported", imported: "Imported {n} words", importFail: "That file isn't a progress backup.",
      resetConfirm: "Reset all progress in this browser? This cannot be undone.", resetDone: "Progress reset",
      audioNone: "{n} clips ready to save for offline use.", audioAll: "All {n} clips saved for offline use.",
      audioPartly: "{s} of {n} clips saved. Resume to finish.", audioProgress: "Saving {d} of {t}…", audioFailed: "{n} clips failed. Try again on a stable connection.",
      audioNotAvail: "Offline audio isn't available here.", audioNoCache: "This browser can't save offline audio.", audioSaved: "Saved",
      audioResume: "Resume", audioRemoved: "Offline audio removed.",
      voiceAuto: "Automatic (best available)", voiceUse: "Use", voicePreview: "Preview", voiceFoot: "Automatic picks the most natural English voice on this device.",
      voiceNow: "Voice: {v}", voiceAutoName: "Automatic",
      "ach.first": "First step", "ach.first.d": "Sort your first word.",
      "ach.k25": "25 words known", "ach.k25.d": "A solid start on the list.",
      "ach.k100": "Century", "ach.k100.d": "100 words known.",
      "ach.k500": "Halfway there", "ach.k500.d": "500 words known.",
      "ach.k1000": "Thousand strong", "ach.k1000.d": "1,000 words known.",
      "ach.s3": "On a roll", "ach.s3.d": "Three days in a row.",
      "ach.s7": "Week strong", "ach.s7.d": "Seven days in a row.",
      "ach.s30": "Month of mornings", "ach.s30.d": "Thirty days in a row.",
      "ach.flawless": "Flawless round", "ach.flawless.d": "Every answer right in a round of 5 or more.",
      "ach.voice": "Clear speaker", "ach.voice.d": "Ten pronunciation attempts that land.",
      "ach.sweep": "Clean sweep", "ach.sweep.d": "Sort every word in a category or level.",
      "ach.lvl5": "Level 5", "ach.lvl5.d": "Earn enough XP to reach level 5.",
    },
    fa: {
      "a11y.main": "اصلی",
      "a11y.home": "خانهٔ سیلیوا",
      "a11y.sections": "بخش‌ها",
      "a11y.sound": "جلوه‌های صوتی",
      "a11y.theme": "تغییر پوسته",
      "a11y.keepLearning": "ادامهٔ یادگیری",
      "a11y.level": "سطح",
      "a11y.hear": "شنیدن این واژه",
      "a11y.sort": "مرتب کردن این واژه",
      "a11y.status": "وضعیت",
      "a11y.reveal": "نمایش معنی",
      "a11y.questions": "پرسش‌ها",
      "a11y.source": "منبع واژه‌ها",
      "a11y.answers": "پاسخ‌ها",
      "a11y.record": "ضبط تلفظ",
      "a11y.activity": "فعالیت روزانه",
      "a11y.themeSeg": "پوسته",
      "a11y.language": "زبان",
      "a11y.motion": "حرکت",
      "a11y.lowerGoal": "کاهش هدف",
      "a11y.raiseGoal": "افزایش هدف",
      "a11y.dailyGoal": "هدف روزانه",
      "a11y.skipLink": "پرش به محتوا",
      "a11y.levelRange": "A1 تا C2",
      "a11y.levelRangeVocab": "واژگان A1 تا C2",
      navHome: "خانه", navLearn: "یادگیری", navLibrary: "واژه‌نامه", navPractice: "تمرین", navProgress: "پیشرفت", navProfile: "پروفایل", navSettings: "تنظیمات",
      undo: "واگرد", skip: "رد کردن", review: "مرور", know: "بلد هستم", stampKnow: "بلد هستم", stampReview: "مرور",
      showFa: "نمایش معنی فارسی", hideFa: "پنهان کردن معنی فارسی", details: "جزئیات", emptyToFlash: "مرور فلش‌کارت‌ها", emptyToLibrary: "مرور واژه‌نامه", emptyToLearn: "شروع یادگیری",
      catLabel: "دسته‌بندی", learnTitle: "یادگیری", libTitle: "واژه‌نامه", searchLabel: "جستجوی واژه یا معنی", searchPh: "جستجوی واژه یا معنی",
      showMore: "نمایش بیشتر", noMatchTitle: "واژه‌ای پیدا نشد", noMatchText: "جستجو را کوتاه‌تر کن یا فیلتری را پاک کن.", clearFilters: "پاک کردن فیلترها",
      practiceEyebrow: "برای ماندگاری", practiceTitle: "تمرین", flashTitle: "فلش‌کارت", flashDesc: "معنی را ببین، بعد خودت را ارزیابی کن.",
      quizTitle: "آزمون", quizLong: "برای هر واژه چهار گزینه. هر دور ده سؤال.", speakTitle: "تلفظ", speakLong: "به واژه گوش بده، بعد خودت بگو.",
      backPractice: "تمرین", shuffle: "مخلوط کردن", flipHint: "برای دیدن معنی لمس کن یا کلید Space را بزن", stillLearning: "هنوز یاد نگرفتم", gotIt: "یاد گرفتم",
      fcEmptyTitle: "هنوز کارتی نیست", fcEmptyText: "واژه‌هایی که برای مرور علامت بزنی، اینجا ظاهر می‌شوند.",
      quizSetupTitle: "یک دور آزمون بساز", qLen: "تعداد سؤال", qSrc: "واژه‌ها از", qStart: "شروع آزمون", qPrompt: "این واژه یعنی چه؟",
      qNext: "سؤال بعدی", qSeeResults: "دیدن نتیجه", qAgain: "دور جدید", qReviewMissed: "اشتباه‌ها را به فلش‌کارت ببر",
      qSrcMine: "واژه‌های من", qSrcAll: "کل واژه‌نامه", qPool: "{n} واژه در مجموعه تو.", qNotEnough: "هنوز واژهٔ کافی نداری، پس این دور از کل واژه‌نامه است.",
      qT100: "بی‌نقص.", qT80: "عالی.", qT50: "داری پیش می‌روی.", qTlow: "ارزش دوباره امتحان کردن را دارد.",
      qResult: "{s} از {n} درست. {x} امتیاز گرفتی.", qMissedSent: "{n} واژهٔ اشتباه به فلش‌کارت منتقل شد.",
      qCorrect: "درست است.", qWrong: "نه دقیقاً. معنی‌اش این است:",
      listen: "گوش دادن", selfAsk: "چطور بود؟", tryAgain: "دوباره امتحان کن", nailed: "درست گفتم", nextWord: "واژه بعدی",
      spReady: "میکروفون را بزن و واژه را بگو.", spNoSr: "این مرورگر ورودی صوتی ندارد. گوش بده، با صدای بلند تکرار کن و خودت ارزیابی کن.",
      spListening: "در حال شنیدن… واژه را بگو", spHeard: "شنیدم «{t}». یک بار دیگر امتحان کن.", spNoSpeech: "چیزی شنیده نشد. دوباره امتحان کن.",
      spDenied: "به میکروفون اجازه ندادی. می‌توانی خودت ارزیابی کنی.", spGreat: "عالی بود. واضح گفتی.", spNoMic: "میکروفون خطا داد. خودت ارزیابی کن.",
      spNote: "{n} تلاش امروز", progEyebrow: "فقط در همین مرورگر ذخیره می‌شود", progTitle: "پیشرفت",
      kpiKnown: "بلد هستم", kpiFlash: "در فلش‌کارت", kpiFlashSub: "نیاز به مرور", kpiQueue: "هنوز مرتب نشده", kpiToday: "امروز",
      levelXp: "سطح و امتیاز", xpHow: "مرتب کردن واژه، آزمون و تلفظ امتیاز می‌دهد.", streakLabel: "روزهای پیاپی", daysWord: "روز",
      last14: "۱۴ روز اخیر", byLevel: "بر اساس سطح", byCat: "بر اساس دسته", showAll: "نمایش همه", achTitle: "دستاوردها",
      setEyebrow: "هر طور دوست داری", setAppearance: "ظاهر", setTheme: "پوسته", setLang: "زبان رابط", setMotion: "حرکت‌ها",
      setSound: "صدا", setSoundOn: "افکت صوتی", setVolume: "بلندی صدا", setLearning: "یادگیری", setGoal: "هدف روزانه (تعداد فعالیت)",
      replayWelcome: "نمایش دوبارهٔ خوش‌آمدگویی", setFa: "نمایش معنی فارسی روی کارت", setAuto: "شنیدن خودکار هر واژه", setVoice: "تلفظ", setVoiceNow: "صدای فعلی",
      chooseVoice: "انتخاب صدا", offlineAudio: "صدای آفلاین", audioDl: "دانلود", audioRm: "حذف", setData: "داده‌های تو",
      dataNote: "همه‌چیز در همین مرورگر است. قبل از عوض کردن دستگاه یا پاک کردن داده‌ها، یک نسخهٔ پشتیبان بگیر.",
      export: "خروجی گرفتن", import: "وارد کردن", reset: "بازنشانی پیشرفت", close: "بستن", mCat: "دسته", mFreq: "بسامد", mReg: "سبک زبان", mCtx: "کاربرد",
      toFlash: "انتقال به فلش‌کارت", toQueue: "برگرداندن به صف", markKnown: "بلد هستم", goalTitle: "هدف امروز", ctaLearn: "ادامه یادگیری",
      levelLabel: "سطح", profEyebrow: "نگاهی به خودت", profProgressDesc: "نمودارها، سطح‌ها و تاریخچه", profSettingsDesc: "پوسته، صدا، هدف و پشتیبان", profAchText: "{n} از {total} باز شده", knownLabel: "واژه‌هایی که بلدی", recentTitle: "آخرین واژه‌های یادگرفته‌شده", quizDesc: "معنی درست را انتخاب کن", speakDesc: "گوش بده، بعد بگو",
      flashCount: "{n} در انتظار", quizCount: "{n} واژه در مجموعه", speakCount: "{n} برای تمرین", none: "هنوز چیزی نیست",
      greetMorning: "صبح بخیر", greetAfternoon: "عصر بخیر", greetEvening: "شب بخیر",
      goalDone: "به هدفت رسیدی. از این به بعد هرچه انجام بدی، امتیاز اضافه است.", goalLeft: "{n} فعالیت دیگر مانده تا هدف امروز.",
      streakNow: "روزهای پیاپی فعلی", bestStreak: "بهترین: {n} روز", xpTo: "{x} امتیاز تا سطح {l}",
      homeSplit: "{f} در فلش‌کارت · {q} برای مرتب کردن", learnEyebrowAll: "همه واژه‌ها", learnEyebrowLevel: "سطح {l}",
      learnStat: "{s} مرتب شده · {q} باقی‌مانده در این نما", learnEmptyNoWords: "اینجا چیزی نیست", learnEmptyNoWordsText: "با این نما هیچ واژه‌ای نیست.",
      learnDoneTitle: "این بخش تمام شد", learnDoneText: "وضعیت همهٔ واژه‌های این بخش مشخص شده. یک دسته یا سطح دیگر را امتحان کن یا فلش‌کارت‌ها را مرور کن.",
      fcEmptyCount: "{i} از {n}", fcMeta: "{i} از {n} · {l} مانده",
      sortedFlash: "{w} به فلش‌کارت رفت", sortedKnown: "{w} به «بلد هستم» رفت", backQueue: "{w} به صف برگشت", undone: "«{w}» واگرد شد",
      skipped: "{w} رد شد", sweepTitle: "جاروی کامل", sweepText: "مرور همهٔ واژه‌های این بخش تمام شد.",
      goalHitTitle: "هدف روزانه کامل شد", goalHitText: "{n} فعالیت امروز. آفرین.",
      levelUpTitle: "سطح {l}", levelUpText: "روزهای پیاپی‌ات را ادامه بده.",
      themeLight: "روشن", themeDark: "تیره", themeSystem: "مطابق سیستم", motionSystem: "مطابق سیستم", motionReduce: "کاهش حرکت",
      langEn: "English", langFa: "فارسی", on: "روشن", off: "خاموش", sysOpt: "سیستم",
      exported: "پیشرفتت خروجی گرفته شد", imported: "{n} واژه اضافه شد", importFail: "این فایل پشتیبان پیشرفتت نیست.",
      resetConfirm: "همهٔ پیشرفتت در این مرورگر پاک شود؟ این کار برگشت‌پذیر نیست.", resetDone: "پیشرفتت پاک شد",
      audioNone: "{n} کلیپ آماده است تا برای استفادهٔ آفلاین ذخیره شود.", audioAll: "همهٔ {n} کلیپ در دستگاهت ذخیره شد.",
      audioPartly: "{s} از {n} کلیپ ذخیره شد. ادامه بده.", audioProgress: "در حال ذخیرهٔ {d} از {t}…", audioFailed: "{n} کلیپ ذخیره نشد. دوباره امتحان کن.",
      audioNotAvail: "صدای آفلاین اینجا نیست.", audioNoCache: "این مرورگر نمی‌تواند صدای آفلاین را ذخیره کند.", audioSaved: "ذخیره شد",
      audioResume: "ادامه", audioRemoved: "صدای آفلاین حذف شد.",
      voiceAuto: "خودکار (بهترین موجود)", voiceUse: "استفاده", voicePreview: "پیش‌نمایش", voiceFoot: "خودکار، طبیعی‌ترین صدای انگلیسی دستگاهت را انتخاب می‌کند.",
      voiceNow: "صدا: {v}", voiceAutoName: "خودکار",
      "ach.first": "اولین قدم", "ach.first.d": "اولین واژه‌ات را مرتب کن.",
      "ach.k25": "۲۵ واژهٔ بلد", "ach.k25.d": "یک شروع محکم روی فهرست.",
      "ach.k100": "صد تایی", "ach.k100.d": "۱۰۰ واژهٔ بلد.",
      "ach.k500": "نیمه‌راه", "ach.k500.d": "۵۰۰ واژهٔ بلد.",
      "ach.k1000": "هزار تایی", "ach.k1000.d": "۱٬۰۰۰ واژهٔ بلد.",
      "ach.s3": "در اوج", "ach.s3.d": "سه روز پشت‌سرهم.",
      "ach.s7": "هفتهٔ قوی", "ach.s7.d": "هفت روز پشت‌سرهم.",
      "ach.s30": "ماه صبح‌خیزی", "ach.s30.d": "سی روز پشت‌سرهم.",
      "ach.flawless": "دور بی‌نقص", "ach.flawless.d": "همهٔ پاسخ‌ها درست در دوری با ۵ سؤال یا بیشتر.",
      "ach.voice": "گوینده‌ی واضح", "ach.voice.d": "ده تلاش موفق در تلفظ.",
      "ach.sweep": "جاروی کامل", "ach.sweep.d": "همهٔ واژه‌های یک دسته یا سطح را مرتب کن.",
      "ach.lvl5": "سطح ۵", "ach.lvl5.d": "با امتیاز کافی به سطح ۵ برس.",
    },
  };
  function t(key, vars) {
    const d = T[settings.lang] || T.en;
    let s = d[key] !== undefined ? d[key] : (T.en[key] !== undefined ? T.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, n) => (vars[n] !== undefined ? vars[n] : ""));
    return s;
  }

  /* =========================================================
     3. SETTINGS + LEARNING STATE
     ========================================================= */
  const DEF_SETTINGS = { theme: "system", lang: "en", sound: true, volume: 50, goal: 10, showFa: false, autoSpeak: false, motion: "system" };
  let settings = Object.assign({}, DEF_SETTINGS);
  (function loadSettings() {
    const saved = readJSON(KEY_SET_STORE);
    if (saved && typeof saved === "object") {
      settings = Object.assign({}, DEF_SETTINGS);
      Object.keys(DEF_SETTINGS).forEach((k) => { if (hasOwn(saved, k)) settings[k] = saved[k]; });
    } else {
      // First visit of v21: carry over the choices from the earlier version.
      const th = getText("vocab4000-theme");
      if (th === "light" || th === "dark") settings.theme = th;
      if (getText("vocab4000-lang") === "fa") settings.lang = "fa";
      if (getText("vocab4000-persian") === "on") settings.showFa = true;
    }
    if (!["system", "light", "dark"].includes(settings.theme)) settings.theme = "system";
    if (!["en", "fa"].includes(settings.lang)) settings.lang = "en";
    if (!["system", "reduce"].includes(settings.motion)) settings.motion = "system";
    settings.volume = clamp(Number(settings.volume) || 0, 0, 100);
    settings.goal = clamp(Math.round(Number(settings.goal) || 10), 3, 60);
  })();
  function saveSettings() { writeJSON(KEY_SET_STORE, settings); }

  let L = { v: 2, words: {}, log: {}, xp: 0, ach: {}, goalHit: {}, scope: { cat: "", level: "" }, pOk: 0, flawless: false, swept: false };
  // Stored and imported numbers are bounded: a hand-edited or hostile backup can't push absurd values into the UI.
  const numIn = (v, max) => clamp(Number(v) || 0, 0, max);
  function sanitizeLearn(j) {
    const out = { v: 2, words: {}, log: {}, xp: 0, ach: {}, goalHit: {}, scope: { cat: "", level: "" }, pOk: 0, flawless: false, swept: false };
    if (!j || typeof j !== "object") return out;
    if (j.words && typeof j.words === "object") {
      Object.keys(j.words).forEach((k) => {
        const r = j.words[k];
        const kk = hasOwn(KEY_ALIAS, k) ? KEY_ALIAS[k] : k;
        if (KEY_SET.has(kk) && r && (r.s === "known" || r.s === "flash")) out.words[kk] = { s: r.s, t: numIn(r.t, 8.64e15) };
      });
    }
    if (j.log && typeof j.log === "object") {
      Object.keys(j.log).forEach((d) => {
        const r = j.log[d];
        if (/^\d{4}-\d{2}-\d{2}$/.test(d) && r && typeof r === "object") {
          out.log[d] = { k: numIn(r.k, 1e6), f: numIn(r.f, 1e6), b: numIn(r.b, 1e6), r: numIn(r.r, 1e6), q: numIn(r.q, 1e6), p: numIn(r.p, 1e6), x: numIn(r.x, 1e9) };
        }
      });
    }
    out.xp = numIn(j.xp, 1e9);
    if (j.ach && typeof j.ach === "object") Object.keys(j.ach).forEach((k) => { if (ACH_IDS.has(k)) out.ach[k] = numIn(j.ach[k], 8.64e15) || 1; });
    if (j.goalHit && typeof j.goalHit === "object") Object.keys(j.goalHit).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) out.goalHit[k] = 1; });
    if (j.scope && typeof j.scope === "object") {
      out.scope.cat = CAT_TOTAL[j.scope.cat] ? j.scope.cat : "";
      out.scope.level = LEVEL_TOTAL[j.scope.level] ? j.scope.level : "";
    }
    out.pOk = numIn(j.pOk, 1e9);
    out.flawless = !!j.flawless;
    out.swept = !!j.swept;
    return out;
  }
  function loadLearn() { L = sanitizeLearn(readJSON(KEY_LEARN)); }
  function saveLearn() { writeJSON(KEY_LEARN, L); }
  function statusOf(g) { const r = L.words[KEYS[g]]; return r ? r.s : null; }
  function activityOf(r) { return r ? (r.k || 0) + (r.f || 0) + (r.b || 0) + (r.r || 0) + (r.q || 0) + (r.p || 0) : 0; }
  function todayRec() { return L.log[todayKey()] || { k: 0, f: 0, b: 0, r: 0, q: 0, p: 0, x: 0 }; }
  function logDay(field, n, xp) {
    const d = todayKey();
    const r = L.log[d] || (L.log[d] = { k: 0, f: 0, b: 0, r: 0, q: 0, p: 0, x: 0 });
    r[field] = Math.max(0, (r[field] || 0) + n);
    if (xp) r.x = Math.max(0, (r.x || 0) + xp);
  }
  const levelOf = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const levelStart = (lv) => 40 * (lv - 1) * (lv - 1);
  function levelInfo(xp) {
    const lv = levelOf(xp);
    const a = levelStart(lv);
    const b = levelStart(lv + 1);
    return { lv, into: xp - a, span: b - a, pct: ((xp - a) / (b - a)) * 100 };
  }
  function streakInfo() {
    const set = new Set(Object.keys(L.log).filter((d) => activityOf(L.log[d]) > 0).map(dayNum));
    const days = [...set].sort((a, b) => a - b);
    let best = 0, run = 0, prev = null;
    days.forEach((d) => { run = prev !== null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
    const tn = dayNum(todayKey());
    let c = 0;
    let d = set.has(tn) ? tn : tn - 1;
    while (set.has(d)) { c++; d--; }
    return { current: c, best };
  }
  function stats() {
    let known = 0, flash = 0;
    const byL = Object.create(null), byC = Object.create(null);
    LEVELS.forEach((l) => { byL[l] = { known: 0, flash: 0 }; });
    Object.keys(L.words).forEach((k) => {
      const g = KEY_INDEX[k];
      if (g === undefined) return;
      const s = L.words[k].s;
      const e = E[g];
      if (s === "known") known++; else flash++;
      byL[e.l][s === "known" ? "known" : "flash"]++;
      (byC[e.cat] || (byC[e.cat] = { known: 0, flash: 0 }));
      byC[e.cat][s === "known" ? "known" : "flash"]++;
    });
    return { known, flash, queue: N - known - flash, byL, byC };
  }

  /* ---------- achievements ---------- */
  const ACH = [
    { id: "first", ic: "spark", ok: (s) => s.known + s.flash >= 1 },
    { id: "k25", ic: "book", ok: (s) => s.known >= 25 },
    { id: "k100", ic: "book", ok: (s) => s.known >= 100 },
    { id: "k500", ic: "book", ok: (s) => s.known >= 500 },
    { id: "k1000", ic: "trophy", ok: (s) => s.known >= 1000 },
    { id: "s3", ic: "flame", ok: (s) => s.streak >= 3 },
    { id: "s7", ic: "flame", ok: (s) => s.streak >= 7 },
    { id: "s30", ic: "flame", ok: (s) => s.streak >= 30 },
    { id: "flawless", ic: "quiz", ok: (s) => s.flawless },
    { id: "voice", ic: "mic", ok: (s) => s.pOk >= 10 },
    { id: "sweep", ic: "check", ok: (s) => s.swept },
    { id: "lvl5", ic: "spark", ok: (s) => s.level >= 5 },
  ];
  function achState() {
    const st = stats();
    const sk = streakInfo();
    return { known: st.known, flash: st.flash, streak: sk.current, flawless: L.flawless, pOk: L.pOk, swept: L.swept, level: levelOf(L.xp) };
  }
  function achUnlocked() { return ACH.filter((a) => L.ach[a.id]).length; }

  /* =========================================================
     4. SOUND (synthesised, no files; only plays after a user gesture)
     ========================================================= */
  const Snd = (function () {
    let ctx = null;
    let master = null;
    const SEQ = {
      tap: [[1046.5, 0, 0.05, "sine", 0.08]],
      flip: [[1318.5, 0, 0.07, "triangle", 0.05]],
      know: [[659.25, 0, 0.12, "sine", 0.16], [987.77, 0.08, 0.2, "sine", 0.16]],
      review: [[392, 0, 0.18, "triangle", 0.13]],
      skip: [[523.25, 0, 0.07, "sine", 0.07]],
      undo: [[880, 0, 0.07, "sine", 0.08], [659.25, 0.06, 0.1, "sine", 0.08]],
      correct: [[783.99, 0, 0.12, "sine", 0.15], [1174.66, 0.09, 0.22, "sine", 0.15]],
      wrong: [[220, 0, 0.22, "triangle", 0.13, 160]],
      complete: [[523.25, 0, 0.14], [659.25, 0.1, 0.14], [783.99, 0.2, 0.14], [1046.5, 0.3, 0.32]],
      ach: [[659.25, 0, 0.14], [830.61, 0.1, 0.14], [987.77, 0.2, 0.14], [1318.5, 0.3, 0.36]],
      levelup: [[523.25, 0, 0.12], [659.25, 0.08, 0.12], [783.99, 0.16, 0.12], [1046.5, 0.24, 0.12], [1318.5, 0.34, 0.42]],
    };
    function ensure() {
      if (!settings.sound) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      master.gain.value = (settings.volume / 100) * 0.55;
      return ctx;
    }
    function note(c, f, t0, dur, type, vol, slide) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    }
    function play(name) {
      const c = ensure();
      if (!c || !SEQ[name]) return;
      const t0 = c.currentTime + 0.01;
      SEQ[name].forEach(([f, off, d, type, v, sl]) => note(c, f, t0 + off, d, type || "sine", v || 0.16, sl || null));
    }
    return { play };
  })();

  /* =========================================================
     5. PRONUNCIATION (offline pack if present, else the browser voice)
     ========================================================= */
  const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const VOICE_PREFS = [
    [/Online \(Natural\)/i, 60],
    [/^Google US English$/i, 50],
    [/^(Ava|Samantha|Allison|Zoe|Evan|Noelle|Susan)\b/i, 40],
    [/^(Aria|Jenny|Guy|Zira|David|Mark)\b/i, 30],
  ];
  let chosenVoiceName = getText(KEY_VOICE);
  let packFiles = null;   // global index -> file name
  let packIndex = null;   // parsed audio/index.json
  let packAudio = null;
  let packDownloading = false;
  let speakTok = 0;
  let activeSpeakBtn = null;

  function scoreVoice(v) {
    if (!/^en([-_]|$)/i.test(v.lang)) return -1;
    let s = /^en[-_]US$/i.test(v.lang) ? 100 : 10;
    for (const [re, b] of VOICE_PREFS) if (re.test(v.name)) { s += b; break; }
    return s;
  }
  function englishVoices() {
    if (!canSpeak) return [];
    return window.speechSynthesis.getVoices().filter((v) => scoreVoice(v) > 0).sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name));
  }
  function pickVoice() {
    if (!canSpeak) return null;
    const list = window.speechSynthesis.getVoices();
    if (chosenVoiceName) { const c = list.find((v) => v.name === chosenVoiceName); if (c) return c; }
    let best = null, bs = -1;
    list.forEach((v) => { const s = scoreVoice(v); if (s > bs) { best = v; bs = s; } });
    return best;
  }
  function setSpeakingBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle("speaking", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function stopSpeech() {
    speakTok++;
    if (packAudio) { packAudio.pause(); packAudio = null; }
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeakingBtn(activeSpeakBtn, false);
    activeSpeakBtn = null;
  }
  function playPack(g, tok, btn) {
    const file = packFiles && packFiles[g];
    if (!file) return false;
    const a = new Audio("audio/" + file);
    packAudio = a;
    a.onplay = () => setSpeakingBtn(btn, true);
    const done = () => { if (packAudio === a) packAudio = null; if (tok === speakTok) { setSpeakingBtn(btn, false); activeSpeakBtn = null; } };
    const fail = () => {
      if (packAudio === a) packAudio = null;
      if (tok !== speakTok) return;
      setSpeakingBtn(btn, false);
      activeSpeakBtn = null;
      speakTTS(E[g].w, btn, 0.9);
    };
    a.onended = done;
    a.onerror = fail;
    a.play().catch(fail);
    return true;
  }
  // Speaks text with the browser voice. Lowercased so headwords are read as words, not spelled out.
  function speakTTS(text, btn, rate) {
    if (!canSpeak) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const tok = ++speakTok;
    const u = new SpeechSynthesisUtterance(String(text).trim().toLowerCase());
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
    u.rate = rate || 0.92;
    u.pitch = 1;
    u.volume = 1;
    u.onstart = () => { if (tok === speakTok) setSpeakingBtn(btn, true); };
    const end = () => { if (tok === speakTok) { setSpeakingBtn(btn, false); activeSpeakBtn = null; } };
    u.onend = end;
    u.onerror = end;
    activeSpeakBtn = btn || null;
    speakWordRef = u;
    synth.speak(u);
    return true;
  }
  let speakWordRef = null; // keeps the utterance alive until it ends
  // Headword: offline clip when present, otherwise the browser voice.
  function speakWord(g, btn) {
    stopSpeech();
    const tok = speakTok;
    if (playPack(g, tok, btn)) { activeSpeakBtn = btn || null; return true; }
    return speakTTS(E[g].w, btn, 0.9);
  }
  // Example sentences always use the browser voice (the offline pack covers headwords only).
  function speakSentence(text, btn) {
    stopSpeech();
    return speakTTS(text, btn, 0.95);
  }

  function loadPack() {
    if (!/^https?:$/.test(location.protocol)) return;
    fetch("audio/index.json").then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!j || !Array.isArray(j.files)) return;
      // Keep only well-formed entries: a clip index inside the dataset and a plain NNNN.mp3 file name.
      j.files = j.files.filter((f) => f && Number.isInteger(f.i) && f.i >= 1 && f.i <= N && typeof f.file === "string" && AUDIO_FILE_RE.test(f.file));
      packFiles = {};
      j.files.forEach((f) => { packFiles[f.i - 1] = f.file; });
      packIndex = j;
      $("audioCard").hidden = false;
      refreshAudioStatus();
    }).catch(() => {});
  }
  function pathOf(u) { return new URL(u, location.href).pathname; }
  function refreshAudioStatus() {
    if (!packIndex || !("caches" in window)) return Promise.resolve();
    return caches.open(AUDIO_CACHE).then((c) => c.keys()).then((keys) => {
      const have = new Set(keys.map((r) => pathOf(r.url)));
      const count = packIndex.files.length;
      const saved = packIndex.files.filter((f) => have.has(pathOf("audio/" + f.file))).length;
      $("audioRmBtn").hidden = saved === 0 || packDownloading;
      if (packDownloading) return;
      const btn = $("audioDlBtn");
      btn.disabled = saved >= count;
      if (saved === 0) { setText("audioDlStatus", t("audioNone", { n: fmt(count) })); btn.textContent = t("audioDl"); }
      else if (saved >= count) { setText("audioDlStatus", t("audioAll", { n: fmt(count) })); btn.textContent = t("audioSaved"); }
      else { setText("audioDlStatus", t("audioPartly", { s: fmt(saved), n: fmt(count) })); btn.textContent = t("audioResume"); }
    }).catch(() => setText("audioDlStatus", t("audioNotAvail")));
  }
  async function downloadPack() {
    if (!packIndex || packDownloading) return;
    if (!("caches" in window)) { setText("audioDlStatus", t("audioNoCache")); return; }
    packDownloading = true;
    const btn = $("audioDlBtn");
    btn.disabled = true;
    try { navigator.storage?.persist?.(); } catch (e) { /* optional */ }
    const cache = await caches.open(AUDIO_CACHE);
    const idxRes = await fetch("audio/index.json", { cache: "no-cache" });
    if (!idxRes.ok) { packDownloading = false; btn.disabled = false; setText("audioDlStatus", t("audioFailed", { n: 1 })); return; }
    await cache.put("audio/index.json", idxRes);
    const have = new Set((await cache.keys()).map((r) => pathOf(r.url)));
    const todo = ["audio/index.json"].concat(packIndex.files.map((f) => "audio/" + f.file)).filter((u) => !have.has(pathOf(u)));
    const total = todo.length;
    let next = 0, done = 0, failed = 0;
    setText("audioDlStatus", t("audioProgress", { d: 0, t: fmt(total) }));
    async function worker() {
      while (next < todo.length) {
        const u = todo[next++];
        try {
          const res = await fetch(u, { cache: "no-cache" });
          if (!res.ok) throw new Error(String(res.status));
          await cache.put(u, res);
        } catch (e) { failed++; }
        done++;
        if (done % 25 === 0 || done === total) setText("audioDlStatus", t("audioProgress", { d: fmt(done), t: fmt(total) }));
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    packDownloading = false;
    btn.disabled = false;
    await refreshAudioStatus();
    if (failed) { setText("audioDlStatus", t("audioFailed", { n: fmt(failed) })); btn.textContent = t("audioResume"); }
  }
  function removeOfflineAudio() {
    if (packDownloading) return;
    const msg = settings.lang === "fa" ? "همهٔ صداهای آفلاین حذف شوند؟ برای استفادهٔ آفلاین باید دوباره آن‌ها را دانلود کنی." : "Remove all offline audio? You'll need to download it again to use it offline.";
    if (!window.confirm(msg)) return;
    caches.delete(AUDIO_CACHE).then(() => { refreshAudioStatus(); toast(t("audioRemoved")); });
  }

  /* ---------- voice picker ---------- */
  function renderVoices() {
    const list = $("voiceList");
    list.textContent = "";
    const voices = englishVoices();
    const sample = E[lastShownG >= 0 ? lastShownG : 0].w;
    const add = (name, lang, isAuto) => {
      const li = document.createElement("li");
      const current = isAuto ? !chosenVoiceName : chosenVoiceName === name;
      if (current) li.classList.add("current");
      const wrap = document.createElement("div");
      wrap.className = "vname";
      wrap.textContent = name;
      const sm = document.createElement("small");
      sm.textContent = lang;
      wrap.appendChild(sm);
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "btn ghost";
      prev.textContent = t("voicePreview");
      prev.addEventListener("click", () => {
        const v = isAuto ? pickVoice() : voices.find((x) => x.name === name);
        if (!v) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(sample.toLowerCase());
        u.voice = v; u.lang = v.lang; u.rate = 0.92;
        synth.speak(u);
      });
      const use = document.createElement("button");
      use.type = "button";
      use.className = "btn primary";
      use.textContent = t("voiceUse");
      use.disabled = current;
      use.addEventListener("click", () => {
        if (isAuto) { chosenVoiceName = null; try { localStorage.removeItem(KEY_VOICE); } catch (e) {} }
        else { chosenVoiceName = name; try { localStorage.setItem(KEY_VOICE, name); } catch (e) {} }
        Snd.play("tap");
        renderVoices();
        renderVoiceName();
      });
      const btns = document.createElement("div");
      btns.className = "btn-pair";
      btns.append(prev, use);
      li.append(wrap, btns);
      list.appendChild(li);
    };
    add(t("voiceAuto"), "", true);
    voices.forEach((v) => add(v.name, v.lang, false));
    setText("voiceFoot", voices.length ? t("voiceFoot") : (canSpeak ? "—" : t("audioNotAvail")));
  }
  function renderVoiceName() {
    const v = pickVoice();
    const shown = chosenVoiceName || (v ? v.name : t("voiceAutoName"));
    setText("setVoiceName", canSpeak ? t("voiceNow", { v: shown }) : t("audioNotAvail"));
  }
  let lastShownG = -1;

  /* =========================================================
     6. THEME, LANGUAGE, MOTION
     ========================================================= */
  const mqDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  function resolvedTheme() {
    if (settings.theme === "light" || settings.theme === "dark") return settings.theme;
    return mqDark && mqDark.matches ? "light" : "dark";
  }
  function applyTheme() {
    const th = resolvedTheme();
    document.documentElement.setAttribute("data-theme", th);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", th === "dark" ? "#0a111e" : "#f6f3ed");
    const btn = $("themeBtn");
    const label = th === "dark" ? t("themeLight") : t("themeDark");
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }
  function applyMotion() {
    document.documentElement.setAttribute("data-motion", settings.motion);
  }
  function applyLang() {
    const fa = settings.lang === "fa";
    document.documentElement.lang = fa ? "fa" : "en";
    document.documentElement.dir = fa ? "rtl" : "ltr";
    document.title = fa ? "سیلیوا · انگلیسی A1 تا C2" : "Sylliva · English A1 to C2";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    const lb = document.getElementById("langLabel");
    if (lb) lb.textContent = fa ? "EN" : "FA";
    const lbtn = document.getElementById("langBtn");
    if (lbtn) lbtn.title = fa ? "تغییر به انگلیسی" : "تغییر به فارسی";
    const bt = document.getElementById("toastUndo");
    if (bt) bt.textContent = t("undo");
    buildSegs();
    applyTheme();
    renderVoiceName();
    syncSettingsUI();
    renderRoute(true);
    renderNavBadges();
  }

  /* =========================================================
     7. TOASTS, POPUPS, CONFETTI
     ========================================================= */
  let toastTimer = null;
  let toastUndoFn = null;
  function toast(msg, opts) {
    const el = $("toast");
    setText("toastMsg", msg);
    const u = $("toastUndo");
    const withUndo = !!(opts && opts.undo);
    u.hidden = !withUndo;
    toastUndoFn = withUndo && opts && typeof opts.undo === "function" ? opts.undo : null;
    el.hidden = false;
    el.classList.remove("leaving");
    restartAnim(el, "is-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => { el.hidden = true; el.classList.remove("leaving"); }, 220);
    }, opts && opts.ms ? opts.ms : 4200);
  }
  const popQueue = [];
  let popBusy = false;
  function popup(item) { popQueue.push(item); if (!popBusy) nextPop(); }
  function nextPop() {
    const item = popQueue.shift();
    if (!item) { popBusy = false; return; }
    popBusy = true;
    const el = $("achPop");
    el.classList.remove("leaving");
    el.hidden = false;
    setText("achPopTitle", item.title);
    setText("achPopDesc", item.desc);
    const ic = el.querySelector(".ach-ic use");
    if (ic) ic.setAttribute("href", "#i-" + (item.ic || "trophy"));
    restartAnim(el, "is-in");
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => { el.hidden = true; nextPop(); }, 280);
    }, 3200);
  }
  function burst(n) {
    const host = $("burst");
    const colors = ["var(--accent)", "var(--accent-2)", "var(--know)", "var(--review)", "#ffffff"];
    const count = n || 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      const ang = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 220;
      p.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist - 40).toFixed(0) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
      p.style.setProperty("--s", (6 + Math.random() * 8).toFixed(0) + "px");
      p.style.setProperty("--c", colors[i % colors.length]);
      host.appendChild(p);
    }
    setTimeout(() => { host.textContent = ""; }, 1300);
  }

  /* =========================================================
     8. XP, ACHIEVEMENTS, GOAL, LEVEL
     ========================================================= */
  function award(xp, field, n) {
    const before = levelOf(L.xp);
    logDay(field, n || 0, xp);
    L.xp = Math.max(0, L.xp + xp);
    const after = levelOf(L.xp);
    if (after > before) {
      Snd.play("levelup");
      burst(40);
      popup({ ic: "spark", title: t("levelUpTitle", { l: after }), desc: t("levelUpText") });
    }
    checkGoal();
    checkAch();
    saveLearn();
  }
  function checkGoal() {
    const d = todayKey();
    if (L.goalHit[d]) return;
    const act = activityOf(todayRec());
    if (act >= settings.goal) {
      L.goalHit[d] = 1;
      Snd.play("complete");
      burst(44);
      popup({ ic: "check", title: t("goalHitTitle"), desc: t("goalHitText", { n: act }) });
    }
  }
  function checkAch() {
    const s = achState();
    const fresh = [];
    ACH.forEach((a) => {
      if (!L.ach[a.id] && a.ok(s)) { L.ach[a.id] = Date.now(); fresh.push(a); }
    });
    if (fresh.length) {
      Snd.play("ach");
      burst(36);
      fresh.forEach((a) => popup({ ic: a.ic, title: t("ach." + a.id), desc: t("ach." + a.id + ".d") }));
      if (route === "progress") renderProgress();
      if (route === "home") renderHome();
    }
  }

  /* =========================================================
     9. SORTING (learn) + UNDO
     ========================================================= */
  let undoStack = [];
  function classify(g, s) {
    const key = KEYS[g];
    const cur = L.words[key] || null;
    const curS = cur ? cur.s : null;
    if (curS === s) return false;
    // XP only for sorting a brand-new word, so flipping a word back and forth can't farm XP.
    let xp = 0;
    if (curS === null && s) xp = s === "known" ? 5 : 2;
    const day = todayKey();
    if (s) L.words[key] = { s, t: Date.now() };
    else delete L.words[key];
    const kind = s === "known" ? "k" : s === "flash" ? "f" : "b";
    undoStack.push({ g, prev: cur ? { s: cur.s, t: cur.t } : null, next: s, day, xp, kind });
    if (undoStack.length > 60) undoStack.shift();
    award(xp, kind, 1);
    return true;
  }
  function undo() {
    if (busy || !undoStack.length) return false;
    const rec = undoStack.pop();
    const key = KEYS[rec.g];
    if (rec.prev) L.words[key] = { s: rec.prev.s, t: rec.prev.t };
    else delete L.words[key];
    const d = L.log[rec.day];
    if (d) {
      const field = rec.kind;
      d[field] = Math.max(0, (d[field] || 0) - 1);
      d.x = Math.max(0, (d.x || 0) - rec.xp);
    }
    L.xp = Math.max(0, L.xp - rec.xp);
    saveLearn();
    Snd.play("undo");
    toast(t("undone", { w: cap(E[rec.g].w) }));
    if (route === "learn") { cur = rec.g; }
    renderRoute(true);
    renderNavBadges();
    return true;
  }
  function refreshAfterWordChange() {
    renderNavBadges();
    renderRoute(true);
  }

  /* =========================================================
     10. NAV, ROUTING, BADGES
     ========================================================= */
  let route = "";
  let busy = false;
  function currentRoute() {
    const h = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
    return VIEWS.includes(h) ? h : "home";
  }
  function crumbText(r) {
    const key = { home: "navHome", learn: "navLearn", library: "navLibrary", practice: "navPractice", flash: "flashTitle", quiz: "quizTitle", speak: "speakTitle", progress: "navProgress", profile: "navProfile", settings: "navSettings" }[r];
    return t(key);
  }
  function showRoute(r) {
    const prev = route;
    route = r;
    qsa(".view").forEach((v) => {
      const on = v.dataset.view === r;
      v.classList.toggle("is-active", on);
      v.hidden = !on;
    });
    qsa("[data-nav]").forEach((a) => {
      if (NAV_OF[r] === a.dataset.nav) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    setText("crumb", crumbText(r));
    if (prev && prev !== r) {
      stopSpeech();
      if (prev === "flash") { revealed = false; }
      if (prev === "speak") { stopListening(); }
      closeOpenDialogs();
    }
    renderRoute(prev !== r);
    if (prev !== r) {
      window.scrollTo({ top: 0, behavior: "auto" });
      const h = document.querySelector('.view[data-view="' + r + '"] h1');
      if (h) h.focus({ preventScroll: true });
    }
  }
  function closeOpenDialogs() {
    qsa("dialog[open]").forEach((d) => d.close());
  }
  function renderRoute(fresh) {
    switch (route) {
      case "home": renderHome(); break;
      case "learn": renderLearn(fresh); break;
      case "library": renderLibrary(); break;
      case "practice": renderPracticeHub(); break;
      case "flash": if (fresh) buildDeck(); renderFlash(); break;
      case "quiz": renderQuizSetup(); break;
      case "speak": if (fresh || sp.g < 0) spNext(false); break;
      case "progress": renderProgress(); break;
      case "profile": renderProfile(); break;
      case "settings": syncSettingsUI(); renderVoiceName(); break;
      default: break;
    }
  }
  function renderNavBadges() {
    const st = stats();
    setText("badgeLearn", st.queue ? fmt(st.queue) : "");
    setText("badgePractice", st.flash ? fmt(st.flash) : "");
    qsa("#badgeLearn, #badgePractice").forEach((b) => { b.hidden = !b.textContent; });
    setText("streakNum", fmt(streakInfo().current));
    const li = levelInfo(L.xp);
    const rl = $("railLevel");
    rl.textContent = "";
    const big = document.createElement("b");
    big.textContent = t("levelLabel") + " " + li.lv;
    const sub = document.createElement("div");
    sub.textContent = t("xpTo", { x: fmt(levelStart(li.lv + 1) - L.xp), l: li.lv + 1 });
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = li.pct.toFixed(1) + "%";
    bar.appendChild(fill);
    rl.append(big, sub, bar);
  }

  /* =========================================================
     11. HOME
     ========================================================= */
  function renderProfile() {
    const st = stats();
    const sk = streakInfo();
    const li = levelInfo(L.xp);
    setText("profLevel", fmt(li.lv));
    setWidth("profXpBar", li.pct);
    setText("profXpText", t("xpTo", { x: fmt(levelStart(li.lv + 1) - L.xp), l: li.lv + 1 }));
    countUp($("profStreak"), sk.current);
    setText("profBest", t("bestStreak", { n: fmt(sk.best) }));
    countUp($("profKnown"), st.known);
    setText("profSplit", t("homeSplit", { f: fmt(st.flash), q: fmt(st.queue) }));
    setText("profAch", fmt(achUnlocked()));
    setText("profAchText", t("profAchText", { n: fmt(achUnlocked()), total: fmt(ACH.length) }));
  }
  function renderHome() {
    const now = new Date();
    const h = now.getHours();
    setText("greet", h < 12 ? t("greetMorning") : h < 18 ? t("greetAfternoon") : t("greetEvening"));
    setText("homeDate", now.toLocaleDateString(settings.lang === "fa" ? "fa-IR" : "en-US", { weekday: "long", month: "long", day: "numeric" }));
    const st = stats();
    const sk = streakInfo();
    const act = activityOf(todayRec());
    const goal = settings.goal;
    const p = clamp(act / goal, 0, 1);
    const ring = $("ringFg");
    ring.style.strokeDashoffset = (326.73 * (1 - p)).toFixed(2);
    ring.parentNode.parentNode.classList.toggle("done", p >= 1);
    countUp($("goalNum"), act);
    setText("goalOf", "/ " + fmt(goal));
    setText("goalText", act >= goal ? t("goalDone") : t("goalLeft", { n: fmt(goal - act) }));
    countUp($("homeStreak"), sk.current);
    setText("homeBest", t("bestStreak", { n: fmt(sk.best) }));
    const li = levelInfo(L.xp);
    setText("homeLevel", fmt(li.lv));
    setWidth("homeXpBar", li.pct);
    setText("homeXpText", t("xpTo", { x: fmt(levelStart(li.lv + 1) - L.xp), l: li.lv + 1 }));
    countUp($("homeKnown"), st.known);
    setText("homeSplit", t("homeSplit", { f: fmt(st.flash), q: fmt(st.queue) }));
    setText("tileFlash", t("flashCount", { n: fmt(st.flash) }));
    renderLevelList(act, goal);
    // recent mastered
    const recent = Object.keys(L.words).filter((k) => L.words[k].s === "known").sort((a, b) => L.words[b].t - L.words[a].t).slice(0, 10);
    const box = $("homeRecent");
    box.textContent = "";
    if (!recent.length) {
      const p2 = document.createElement("p");
      p2.className = "muted";
      p2.textContent = t("none");
      box.appendChild(p2);
    }
    recent.forEach((k) => box.appendChild(wordPill(KEY_INDEX[k])));
    // achievements (unlocked first)
    const ul = $("homeAch");
    ul.textContent = "";
    const ordered = ACH.slice().sort((a, b) => (L.ach[b.id] ? 1 : 0) - (L.ach[a.id] ? 1 : 0)).slice(0, 6);
    ordered.forEach((a) => ul.appendChild(achItem(a)));
  }
  const LEVEL_NAMES = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate", C1: "Advanced", C2: "Mastery" };
  const LEVEL_NAMES_FA = { A1: "مبتدی", A2: "مقدماتی", B1: "متوسط", B2: "بالای متوسط", C1: "پیشرفته", C2: "تسلط" };
  function renderLevelList(act, goal) {
    const host = $("levelList");
    if (!host) return;
    const known = Object.create(null);
    Object.keys(L.words).forEach((k) => {
      if (L.words[k].s !== "known") return;
      const g = KEY_INDEX[k];
      if (g !== undefined && E[g]) known[E[g].l] = (known[E[g].l] || 0) + 1;
    });
    host.textContent = "";
    LEVELS.forEach((lv, i) => {
      const total = LEVEL_TOTAL[lv] || 0;
      const pct = total ? (known[lv] || 0) / total * 100 : 0;
      const row = document.createElement("button");
      row.type = "button";
      row.className = "lesson";
      row.setAttribute("role", "listitem");
      row.addEventListener("click", () => { Snd.play("tap"); setScope(L.scope.cat, lv); location.hash = "#/learn"; });
      const hex = document.createElement("span");
      hex.className = "hex";
      hex.dataset.l = lv;
      hex.textContent = String(i + 1);
      const body = document.createElement("span");
      body.className = "lesson-body";
      const eb = document.createElement("span");
      eb.className = "lesson-eyebrow";
      eb.textContent = t("learnEyebrowLevel", { l: lv });
      const ti = document.createElement("strong");
      ti.className = "lesson-title";
      ti.textContent = (settings.lang === "fa" ? LEVEL_NAMES_FA : LEVEL_NAMES)[lv];
      const pr = document.createElement("span");
      pr.className = "lesson-prog";
      const bar = document.createElement("span");
      bar.className = "bar thin";
      const fill = document.createElement("i");
      fill.style.width = pct.toFixed(2) + "%";
      bar.appendChild(fill);
      const pc = document.createElement("b");
      pc.textContent = Math.round(pct) + "%";
      pr.append(bar, pc);
      body.append(eb, ti, pr);
      const chev = document.createElement("span");
      chev.className = "lesson-go";
      chev.replaceChildren(svgIcon("arrow-r"));
      row.append(hex, body, chev);
      host.appendChild(row);
    });
    const p = clamp(goal ? act / goal : 0, 0, 1);
    setText("contNum", String(Math.round(p * 100)) + "%");
    setText("contTitle", act >= goal ? t("goalDone") : t("goalLeft", { n: fmt(goal - act) }));
    setWidth("contBar", p * 100);
  }
  function wordPill(g) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "word-pill";
    b.addEventListener("click", () => openWord(g));
    const w = document.createElement("span");
    w.className = "en";
    w.textContent = cap(E[g].w);
    const c = document.createElement("span");
    c.className = "chip";
    c.dataset.l = E[g].l;
    c.textContent = E[g].l;
    b.append(w, c);
    return b;
  }
  function achItem(a) {
    const li = document.createElement("li");
    const unlocked = !!L.ach[a.id];
    const card = document.createElement("div");
    card.className = "ach" + (unlocked ? "" : " locked");
    const ic = document.createElement("span");
    ic.className = "ach-ic";
    ic.replaceChildren(svgIcon(a.ic));
    const txt = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = t("ach." + a.id);
    const sp = document.createElement("span");
    sp.textContent = t("ach." + a.id + ".d") + (unlocked ? "" : "");
    txt.append(strong, sp);
    card.append(ic, txt);
    li.appendChild(card);
    return li;
  }
  // Animated counter. Keeps the last value on the element so updates glide instead of jumping.
  function countUp(el, to) {
    if (!el) return;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = String(to);
    const reduce = document.documentElement.dataset.motion === "reduce" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches && settings.motion === "system");
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const dur = 620;
    function step(now) {
      const k = clamp((now - start) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* =========================================================
     12. LEARN (swipe deck)
     ========================================================= */
  let cur = -1;
  function inScope(g) {
    const e = E[g];
    return (!L.scope.cat || e.cat === L.scope.cat) && (!L.scope.level || e.l === L.scope.level);
  }
  function queueList() {
    const out = [];
    for (let g = 0; g < N; g++) if (!L.words[KEYS[g]] && inScope(g)) out.push(g);
    return out;
  }
  function scopeTotal() {
    if (L.scope.cat && L.scope.level) return E.reduce((n, e) => n + (e.cat === L.scope.cat && e.l === L.scope.level ? 1 : 0), 0);
    if (L.scope.cat) return CAT_TOTAL[L.scope.cat];
    if (L.scope.level) return LEVEL_TOTAL[L.scope.level];
    return N;
  }
  function nextInQueue(q, after) {
    if (!q.length) return -1;
    const f = q.find((x) => x > after);
    return f !== undefined ? f : q[0];
  }
  function renderLearn(fresh) {
    const q = queueList();
    const total = scopeTotal();
    const sorted = total - q.length;
    // eyebrow + stat
    setText("learnEyebrow", L.scope.level ? t("learnEyebrowLevel", { l: L.scope.level }) + (L.scope.cat ? " · " + L.scope.cat : "") : (L.scope.cat || t("learnEyebrowAll")));
    setText("learnStat", t("learnStat", { s: fmt(sorted), q: fmt(q.length) }));
    setWidth("learnBar", total ? (sorted / total) * 100 : 0);
    setText("learnPct", Math.round(total ? (sorted / total) * 100 : 0) + "%");
    syncScopeUI();
    const cardEl = $("card");
    if (!q.length) {
      cur = -1;
      cardEl.hidden = true;
      $("decide").hidden = true;
      $("learnEmpty").hidden = false;
      if (total) {
        setText("learnEmptyTitle", t("learnDoneTitle"));
        setText("learnEmptyText", t("learnDoneText"));
      } else {
        setText("learnEmptyTitle", t("learnEmptyNoWords"));
        setText("learnEmptyText", t("learnEmptyNoWordsText"));
      }
      return;
    }
    $("learnEmpty").hidden = true;
    cardEl.hidden = false;
    $("decide").hidden = false;
    if (cur < 0 || !inScope(cur) || statusOf(cur)) {
      cur = q[0];
      fresh = true;
    }
    renderCard(cur, fresh);
  }
  function renderCard(g, animate) {
    const e = E[g];
    lastShownG = g;
    const card = $("card");
    card.style.transform = "";
    card.classList.remove("dragging", "fly-out");
    if (animate) restartAnim(card, "enter");
    setText("cLevel", e.l);
    $("cLevel").dataset.l = e.l;
    setText("cCat", e.cat);
    setText("cWord", cap(e.w));
    setText("cIpa", e.ipa || "");
    setText("cMeaning", e.m || "");
    setText("cFreq", e.f ? e.f.toLowerCase() : "");
    fillExamples($("cEx"), e.ex, e.exfa);
    fillFa($("cFa"), $("cFaBtn"), e.fa);
    $("cSpeak").setAttribute("aria-label", t("listen") + ": " + e.w.toLowerCase());
    $("btnUndo").disabled = undoStack.length === 0;
    if (settings.autoSpeak) speakWord(g, $("cSpeak"));
  }
  function fillFa(faEl, btn, text) {
    const show = settings.showFa;
    faEl.textContent = text || "";
    faEl.hidden = !show || !text;
    btn.hidden = !text;
    btn.textContent = show ? t("hideFa") : t("showFa");
    btn.setAttribute("aria-expanded", String(show));
  }
  function fillExamples(ol, ex, exfa) {
    ol.textContent = "";
    (ex || []).forEach((s, i) => {
      const li = document.createElement("li");
      const body = document.createElement("div");
      body.style.flex = "1";
      body.style.minWidth = "0";
      const txt = document.createElement("span");
      txt.className = "ex-text en";
      txt.textContent = s;
      body.appendChild(txt);
      if (settings.showFa && exfa && exfa[i]) {
        const fa = document.createElement("span");
        fa.className = "ex-fa";
        fa.lang = "fa";
        fa.textContent = exfa[i];
        body.appendChild(fa);
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ex-speak";
      b.setAttribute("aria-label", t("listen") + ": " + s);
      b.replaceChildren(svgIcon("speaker"));
      b.addEventListener("click", () => {
        if (b.classList.contains("speaking")) { stopSpeech(); return; }
        Snd.play("tap");
        speakSentence(s, b);
      });
      li.append(body, b);
      ol.appendChild(li);
    });
  }
  // Flies the card off to the side, then sorts it. Used by buttons, keys and swipes.
  function flyAndDecide(kind) {
    if (busy || cur < 0 || route !== "learn") return;
    const g = cur;
    const card = $("card");
    busy = true;
    const dir = kind === "known" ? 1 : -1;
    card.classList.remove("dragging");
    card.classList.add("fly-out");
    card.style.transform = "translate3d(" + dir * 520 + "px,0,0) rotate(" + dir * 14 + "deg)";
    Snd.play(kind === "known" ? "know" : "review");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      busy = false;
      const changed = classify(g, kind);
      if (changed) {
        toast(t(kind === "known" ? "sortedKnown" : "sortedFlash", { w: cap(E[g].w) }), { undo: true });
      }
      const q = queueList();
      const wasLast = q.length === 0;
      cur = nextInQueue(q, g);
      if (wasLast) {
        onScopeDone();
      }
      renderLearn(true);
      renderNavBadges();
    };
    card.addEventListener("transitionend", function te(ev) { if (ev.target === card) { card.removeEventListener("transitionend", te); finish(); } });
    setTimeout(finish, 360);
  }
  function onScopeDone() {
    const total = scopeTotal();
    if (total > 0 && !L.swept) {
      L.swept = true;
      saveLearn();
    }
    Snd.play("complete");
    burst(48);
    popup({ ic: "check", title: t("sweepTitle"), desc: t("sweepText") });
    checkAch();
  }
  function skipCurrent() {
    if (busy || cur < 0 || route !== "learn") return;
    const q = queueList();
    if (q.length < 2) { return; }
    const g = cur;
    cur = nextInQueue(q, g);
    Snd.play("skip");
    renderCard(cur, true);
  }
  function setScope(cat, level) {
    L.scope.cat = CAT_TOTAL[cat] ? cat : "";
    L.scope.level = LEVEL_TOTAL[level] ? level : "";
    cur = -1;
    saveLearn();
    renderLearn(true);
  }
  function syncScopeUI() {
    const sel = $("scopeCat");
    if (sel && sel.value !== (L.scope.cat || "")) sel.value = L.scope.cat || "";
    qsa("#scopeLevels button").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.level || "") === (L.scope.level || ""))));
  }

  /* =========================================================
     13. FLASHCARDS
     ========================================================= */
  let deck = [];
  let dPos = 0;
  let fcStart = 0;
  let fcShuffleOn = false;
  let revealed = false;
  function buildDeck() {
    deck = [];
    for (let g = 0; g < N; g++) if (statusOf(g) === "flash") deck.push(g);
    if (fcShuffleOn) shuffle(deck);
    dPos = 0;
    fcStart = deck.length;
    revealed = false;
  }
  function renderFlash() {
    const n = deck.length;
    const flip = $("fcFlip");
    const wrap = $("fcWrap");
    const actions = document.querySelector(".fc-actions");
    const meta = document.querySelector('[data-view="flash"] .learn-meta');
    if (!n) {
      wrap.hidden = true;
      actions.hidden = true;
      meta.hidden = true;
      $("fcEmpty").hidden = false;
      $("fcShuffle").disabled = true;
      return;
    }
    wrap.hidden = false;
    actions.hidden = false;
    meta.hidden = false;
    $("fcEmpty").hidden = true;
    $("fcShuffle").disabled = false;
    if (dPos >= n) dPos = 0;
    const g = deck[dPos];
    const e = E[g];
    setText("fcLevel", e.l);
    $("fcLevel").dataset.l = e.l;
    setText("fcWord", cap(e.w));
    setText("fcIpa", e.ipa || "");
    setText("fcMeaning", e.m || "");
    fillFaFlash(e.fa);
    fillExamples($("fcEx"), e.ex, e.exfa);
    flip.classList.toggle("revealed", revealed);
    flip.setAttribute("aria-pressed", String(revealed));
    $("fcStill").disabled = !revealed;
    $("fcGot").disabled = !revealed;
    setText("fcMeta", t("fcEmptyCount", { i: fmt(dPos + 1), n: fmt(n) }));
    setWidth("fcBar", fcStart ? ((fcStart - n) / fcStart) * 100 : 0);
    const sp = $("fcSpeak");
    sp.setAttribute("aria-label", t("listen") + ": " + e.w.toLowerCase());
  }
  function fillFaFlash(text) {
    const el = $("fcFa");
    el.textContent = text || "";
    el.hidden = !(settings.showFa && text);
  }
  function revealCard() {
    if (!deck.length || revealed) return;
    revealed = true;
    Snd.play("flip");
    const flip = $("fcFlip");
    flip.classList.add("revealed");
    flip.setAttribute("aria-pressed", "true");
    $("fcStill").disabled = false;
    $("fcGot").disabled = false;
    if (settings.autoSpeak === false) { /* keep quiet */ }
  }
  function rateFlash(kind) {
    if (!revealed || !deck.length || busy) return;
    const g = deck[dPos];
    if (kind === "still") {
      deck.push(deck.splice(dPos, 1)[0]);
      award(1, "r", 1);
      Snd.play("review");
    } else {
      classify(g, "known");
      deck.splice(dPos, 1);
      Snd.play("know");
      toast(t("sortedKnown", { w: cap(E[g].w) }), { undo: true });
    }
    revealed = false;
    busy = true;
    const flip = $("fcFlip");
    flip.classList.remove("revealed");
    flip.setAttribute("aria-pressed", "false");
    // swipe the card out: left for "still learning", right for "got it"
    flip.classList.remove("fc-in-l", "fc-in-r");
    restartAnim(flip, kind === "still" ? "fc-out-l" : "fc-out-r");
    setTimeout(() => {
      busy = false;
      if (dPos >= deck.length) dPos = 0;
      renderFlash();
      renderNavBadges();
      // the next card slides in from the other side
      flip.classList.remove("fc-out-l", "fc-out-r");
      restartAnim(flip, kind === "still" ? "fc-in-r" : "fc-in-l");
    }, 300);
  }

  /* =========================================================
     14. QUIZ
     ========================================================= */
  const quiz = { len: 10, src: "mine", items: [], i: 0, score: 0, missed: [], locked: false, running: false, xp: 0 };
  function quizPool() {
    if (quiz.src === "mine") {
      const list = [];
      for (let g = 0; g < N; g++) if (statusOf(g)) list.push(g);
      if (list.length >= 4) return { list, fallback: false };
    }
    const all = [];
    for (let g = 0; g < N; g++) all.push(g);
    return { list: all, fallback: quiz.src === "mine" };
  }
  function renderQuizSetup() {
    if (quiz.running) { $("quizSetup").hidden = true; $("quizRun").hidden = false; $("quizDone").hidden = true; return; }
    const doneOpen = !$("quizDone").hidden;
    if (!doneOpen) { $("quizSetup").hidden = false; $("quizRun").hidden = true; }
    const pool = quizPool();
    setText("qNote", pool.fallback ? t("qNotEnough") : t("qPool", { n: fmt(pool.list.length) }));
  }
  function buildSegs() {
    fillSeg($("qLen"), [[5, "5"], [10, "10"], [20, "20"]], quiz.len, (v) => { quiz.len = v; renderQuizSetup(); });
    fillSeg($("qSrc"), [["mine", t("qSrcMine")], ["all", t("qSrcAll")]], quiz.src, (v) => { quiz.src = v; renderQuizSetup(); });
    fillSeg($("setTheme"), [["system", t("themeSystem")], ["light", t("themeLight")], ["dark", t("themeDark")]], settings.theme, (v) => { settings.theme = v; saveSettings(); applyTheme(); syncSettingsUI(); });
    fillSeg($("setLang"), [["en", t("langEn")], ["fa", t("langFa")]], settings.lang, (v) => { settings.lang = v; saveSettings(); applyLang(); });
    fillSeg($("setMotion"), [["system", t("motionSystem")], ["reduce", t("motionReduce")]], settings.motion, (v) => { settings.motion = v; saveSettings(); applyMotion(); syncSettingsUI(); });
    buildLevelSegs();
    buildCatSelects();
    buildLibLevels();
    buildLibStatus();
  }
  function fillSeg(host, items, current, onPick) {
    if (!host) return;
    host.textContent = "";
    items.forEach(([v, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = String(label);
      b.dataset.v = String(v);
      b.setAttribute("aria-pressed", String(String(v) === String(current)));
      b.addEventListener("click", () => { Snd.play("tap"); onPick(v); });
      host.appendChild(b);
    });
    host.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(current))));
  }
  function buildLevelSegs() {
    const host = $("scopeLevels");
    host.textContent = "";
    [["", settings.lang === "fa" ? "همه" : "All"]].concat(LEVELS.map((l) => [l, l])).forEach(([v, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.level = v;
      b.setAttribute("aria-pressed", String(v === (L.scope.level || "")));
      b.addEventListener("click", () => { Snd.play("tap"); setScope(L.scope.cat, v); });
      host.appendChild(b);
    });
  }
  function buildCatSelects() {
    ["scopeCat", "libCat"].forEach((id) => {
      const sel = $(id);
      if (!sel) return;
      const prev = sel.value;
      sel.textContent = "";
      const all = document.createElement("option");
      all.value = "";
      all.textContent = settings.lang === "fa" ? "همهٔ دسته‌ها" : "All categories";
      sel.appendChild(all);
      CATS.forEach((c) => {
        const o = document.createElement("option");
        o.value = c;
        o.textContent = c + " (" + fmt(CAT_TOTAL[c]) + ")";
        sel.appendChild(o);
      });
      sel.value = id === "scopeCat" ? (L.scope.cat || "") : (lib.cat || "");
      if (!sel.value && prev) sel.value = "";
    });
  }
  function buildLibLevels() {
    const host = $("libLevels");
    host.textContent = "";
    [["", settings.lang === "fa" ? "همه" : "All"]].concat(LEVELS.map((l) => [l, l])).forEach(([v, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.v = v;
      b.setAttribute("aria-pressed", String(lib.level === v));
      b.addEventListener("click", () => { lib.level = v; Snd.play("tap"); buildLibLevels(); lib.limit = 60; renderLibrary(); });
      host.appendChild(b);
    });
  }
  function buildLibStatus() {
    const host = $("libStatus");
    host.textContent = "";
    const opts = settings.lang === "fa"
      ? [["", "همه"], ["new", "تازه"], ["flash", "فلش‌کارت"], ["known", "بلد"]]
      : [["", "All"], ["new", "New"], ["flash", "Flashcards"], ["known", "Known"]];
    opts.forEach(([v, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.v = v;
      b.setAttribute("aria-pressed", String(lib.status === v));
      b.addEventListener("click", () => { lib.status = v; Snd.play("tap"); buildLibStatus(); lib.limit = 60; renderLibrary(); });
      host.appendChild(b);
    });
  }
  function renderPracticeHub() {
    const st = stats();
    setText("hubFlash", t("flashCount", { n: fmt(st.flash) }));
    setText("hubQuiz", t("quizCount", { n: fmt(st.known + st.flash) }));
    setText("hubSpeak", t("speakCount", { n: fmt(st.flash || N) }));
    setText("badgePractice", st.flash ? fmt(st.flash) : "");
    setText("tileFlash", t("flashCount", { n: fmt(st.flash) }));
  }
  function startQuiz() {
    const pool = quizPool();
    const list = shuffle(pool.list.slice());
    const n = Math.min(quiz.len, list.length);
    quiz.items = list.slice(0, n);
    quiz.i = 0;
    quiz.score = 0;
    quiz.missed = [];
    quiz.xp = 0;
    quiz.running = true;
    quiz.locked = false;
    $("quizSetup").hidden = true;
    $("quizDone").hidden = true;
    $("quizRun").hidden = false;
    renderQuestion();
  }
  function makeOptions(g) {
    const e = E[g];
    const set = new Set([e.m]);
    const opts = [e.m];
    const pool = BY_LEVEL[e.l] || [];
    let tries = 0;
    while (opts.length < 4 && tries < 400) {
      tries++;
      const d = Math.random() < 0.8 && pool.length ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * N);
      const m = E[d].m;
      if (!m || set.has(m) || d === g) continue;
      set.add(m);
      opts.push(m);
    }
    const correct = opts[0];
    shuffle(opts);
    return { opts, correctIdx: opts.indexOf(correct) };
  }
  function renderQuestion() {
    const g = quiz.items[quiz.i];
    const e = E[g];
    const { opts, correctIdx } = makeOptions(g);
    quiz.current = { g, correctIdx };
    quiz.locked = false;
    setText("qWord", cap(e.w));
    setText("qIpa", e.ipa || "");
    setText("qCount", (quiz.i + 1) + " / " + quiz.items.length);
    setWidth("qBar", (quiz.i / quiz.items.length) * 100);
    const box = $("qOpts");
    box.textContent = "";
    opts.forEach((m, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "q-opt en";
      b.dataset.i = String(i);
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = String(i + 1);
      const txt = document.createElement("span");
      txt.className = "txt";
      txt.textContent = m;
      b.append(key, txt);
      b.addEventListener("click", () => answer(i));
      box.appendChild(b);
    });
    const fb = $("qFeedback");
    fb.textContent = "";
    fb.className = "q-feedback";
    $("qNext").hidden = true;
    restartAnim($("quizRun"), "enter-q");
  }
  function answer(i) {
    if (quiz.locked || !quiz.current) return;
    quiz.locked = true;
    const { g, correctIdx } = quiz.current;
    const ok = i === correctIdx;
    const btns = qsa("#qOpts .q-opt");
    btns.forEach((b, k) => {
      b.disabled = true;
      if (k === correctIdx) b.classList.add("is-correct");
      else if (k === i) b.classList.add("is-wrong");
      else b.classList.add("is-dim");
    });
    const fb = $("qFeedback");
    fb.textContent = "";
    if (ok) {
      quiz.score++;
      quiz.xp += 10;
      award(10, "q", 1);
      fb.className = "q-feedback ok";
      fb.textContent = t("qCorrect");
      Snd.play("correct");
      burst(18);
    } else {
      quiz.missed.push(g);
      quiz.xp += 1;
      award(1, "q", 1);
      fb.className = "q-feedback bad";
      fb.append(document.createTextNode(t("qWrong") + " "));
      const s = document.createElement("span");
      s.className = "en";
      s.textContent = E[g].m;
      fb.appendChild(s);
      Snd.play("wrong");
    }
    const next = $("qNext");
    next.textContent = quiz.i + 1 >= quiz.items.length ? t("qSeeResults") : t("qNext");
    next.hidden = false;
    next.focus({ preventScroll: true });
  }
  function nextQuestion() {
    if (!quiz.locked) return;
    quiz.i++;
    if (quiz.i >= quiz.items.length) finishQuiz();
    else renderQuestion();
  }
  function finishQuiz() {
    quiz.running = false;
    $("quizRun").hidden = true;
    const done = $("quizDone");
    done.hidden = false;
    restartAnim(done, "enter");
    const n = quiz.items.length;
    const s = quiz.score;
    const pct = n ? (s / n) * 100 : 0;
    setText("qResultTitle", pct === 100 ? t("qT100") : pct >= 80 ? t("qT80") : pct >= 50 ? t("qT50") : t("qTlow"));
    setText("qResultText", t("qResult", { s: fmt(s), n: fmt(n), x: fmt(quiz.xp) }));
    setText("qOutOf", "/ " + fmt(n));
    const ring = $("qRing");
    ring.style.strokeDashoffset = "326.73";
    requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = (326.73 * (1 - pct / 100)).toFixed(2); }));
    countUp($("qScore"), s);
    $("qReviewMissed").hidden = quiz.missed.length === 0;
    if (n >= 5 && s === n) L.flawless = true;
    saveLearn();
    checkAch();
    Snd.play(pct >= 80 ? "complete" : "tap");
    if (pct === 100) burst(50);
    renderNavBadges();
  }
  function reviewMissed() {
    let moved = 0;
    quiz.missed.forEach((g) => {
      if (statusOf(g) !== "known") { if (classify(g, "flash")) moved++; }
    });
    saveLearn();
    if (moved) toast(t("qMissedSent", { n: fmt(moved) }));
    location.hash = "#/flash";
  }

  /* =========================================================
     15. PRONUNCIATION PRACTICE
     ========================================================= */
  const sp = { g: -1, rec: null, last: -1, tries: 0 };
  function spPool() {
    const flash = []; const known = []; const all = [];
    for (let g = 0; g < N; g++) {
      const s = statusOf(g);
      if (s === "flash") flash.push(g);
      else if (s === "known") known.push(g);
      all.push(g);
    }
    return flash.length ? flash : (known.length ? known : all);
  }
  function spNext(speakIt) {
    stopListening();
    const pool = spPool();
    let g = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && g === sp.last) g = pool[(pool.indexOf(g) + 1) % pool.length];
    sp.g = g;
    sp.last = g;
    sp.tries = 0;
    const e = E[g];
    setText("spCat", e.cat);
    setText("spWord", cap(e.w));
    setText("spIpa", e.ipa || "");
    setText("spMeaning", e.m || "");
    setText("spEx", (e.ex && e.ex[0]) || "");
    const res = $("spResult");
    res.hidden = true;
    res.className = "sp-result";
    res.textContent = "";
    $("spSelf").hidden = false;
    $("spMic").disabled = !SR;
    $("spMic").classList.remove("listening");
    $("spMic").setAttribute("aria-pressed", "false");
    setText("spState", SR ? t("spReady") : t("spNoSr"));
    setText("spNote", t("spNote", { n: fmt(activityOf(todayRec())) }));
    if (speakIt || settings.autoSpeak) setTimeout(() => speakWord(g, $("spListen")), 120);
  }
  function stopListening() {
    if (sp.rec) { try { sp.rec.abort(); } catch (e) { /* ignore */ } sp.rec = null; }
    const mic = $("spMic");
    if (mic) { mic.classList.remove("listening"); mic.setAttribute("aria-pressed", "false"); }
  }
  function spListen() {
    if (!SR || sp.g < 0) return;
    if (sp.rec) { stopListening(); setText("spState", t("spReady")); return; }
    let rec;
    try { rec = new SR(); } catch (e) { setText("spState", t("spNoMic")); $("spSelf").hidden = false; return; }
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    sp.rec = rec;
    let got = false;
    const mic = $("spMic");
    mic.classList.add("listening");
    mic.setAttribute("aria-pressed", "true");
    setText("spState", t("spListening"));
    rec.onresult = (ev) => {
      got = true;
      const alts = [];
      const r = ev.results[0];
      for (let i = 0; i < r.length; i++) alts.push(r[i].transcript);
      sp.rec = null;
      stopListening();
      evaluate(alts);
    };
    rec.onerror = (ev) => {
      got = true;
      sp.rec = null;
      stopListening();
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") setText("spState", t("spDenied"));
      else if (ev.error === "no-speech") setText("spState", t("spNoSpeech"));
      else setText("spState", t("spNoMic"));
      $("spSelf").hidden = false;
    };
    rec.onend = () => {
      if (!got) {
        sp.rec = null;
        stopListening();
        setText("spState", t("spNoSpeech"));
        $("spSelf").hidden = false;
      }
    };
    try { rec.start(); } catch (e) { sp.rec = null; stopListening(); setText("spState", t("spNoMic")); $("spSelf").hidden = false; }
  }
  function matchesWord(alts, word) {
    const w = norm(word);
    if (!w) return false;
    return alts.some((a) => {
      const s = norm(a);
      return s === w || (" " + s + " ").includes(" " + w + " ");
    });
  }
  function evaluate(alts) {
    const e = E[sp.g];
    const res = $("spResult");
    res.hidden = false;
    sp.tries++;
    const heard = alts[0] || "";
    if (matchesWord(alts, e.w)) {
      res.className = "sp-result ok";
      res.textContent = t("spGreat");
      Snd.play("correct");
      recordPronunciation(true);
    } else {
      res.className = "sp-result bad";
      res.textContent = t("spHeard", { t: heard });
      Snd.play("wrong");
      recordPronunciation(false);
    }
  }
  function recordPronunciation(ok) {
    if (ok) L.pOk = (L.pOk || 0) + 1;
    award(ok ? 8 : 0, "p", 1);
    setText("spNote", t("spNote", { n: fmt(activityOf(todayRec())) }));
  }
  function selfRate(good) {
    const res = $("spResult");
    res.hidden = false;
    if (good) {
      res.className = "sp-result ok";
      res.textContent = t("spGreat");
      Snd.play("correct");
      recordPronunciation(true);
    } else {
      res.className = "sp-result info";
      res.textContent = t("tryAgain") + "…";
      Snd.play("tap");
      recordPronunciation(false);
    }
  }

  /* =========================================================
     16. LIBRARY
     ========================================================= */
  const lib = { level: "", status: "", cat: "", q: "", limit: 60 };
  let libMatches = [];
  function libFilter() {
    const q = lib.q.trim().toLowerCase();
    const out = [];
    for (let g = 0; g < N; g++) {
      const e = E[g];
      if (lib.level && e.l !== lib.level) continue;
      if (lib.cat && e.cat !== lib.cat) continue;
      const s = statusOf(g);
      if (lib.status === "new" && s) continue;
      if (lib.status === "flash" && s !== "flash") continue;
      if (lib.status === "known" && s !== "known") continue;
      if (q) {
        const w = e.w.toLowerCase();
        const m = (e.m || "").toLowerCase();
        const f = e.fa || "";
        if (!(w.includes(q) || m.includes(q) || f.includes(q))) continue;
      }
      out.push(g);
    }
    if (q) {
      out.sort((a, b) => {
        const wa = E[a].w.toLowerCase(), wb = E[b].w.toLowerCase();
        const sa = wa.startsWith(q) ? 0 : 1, sb = wb.startsWith(q) ? 0 : 1;
        return sa - sb;
      });
    }
    return out;
  }
  function renderLibrary() {
    libMatches = libFilter();
    setText("libCount", settings.lang === "fa" ? fmt(libMatches.length) + " واژه" : fmt(libMatches.length) + " words");
    const list = $("libList");
    const frag = document.createDocumentFragment();
    const shown = libMatches.slice(0, lib.limit);
    shown.forEach((g, i) => frag.appendChild(wordRow(g, i)));
    list.textContent = "";
    list.appendChild(frag);
    $("libMore").parentNode.hidden = libMatches.length <= lib.limit;
    $("libEmpty").hidden = libMatches.length > 0;
    list.hidden = libMatches.length === 0;
  }
  function wordRow(g, i) {
    const e = E[g];
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "word-row";
    b.style.animationDelay = Math.min(i, 12) * 14 + "ms";
    b.addEventListener("click", () => openWord(g));
    attachWordSwipe(b, () => decideWord(g, "known"), () => decideWord(g, "flash"));
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.dataset.l = e.l;
    chip.textContent = e.l;
    const txt = document.createElement("span");
    txt.className = "wr-txt";
    const w = document.createElement("span");
    w.className = "wr-word en";
    w.textContent = cap(e.w);
    const m = document.createElement("span");
    m.className = "wr-mean en";
    m.textContent = e.m || "";
    txt.append(w, m);
    const dot = document.createElement("span");
    const s = statusOf(g);
    dot.className = "dot" + (s ? " " + s : "");
    dot.setAttribute("aria-label", settings.lang === "fa" ? (s === "known" ? "بلد" : s === "flash" ? "فلش‌کارت" : "تازه") : (s === "known" ? "Known" : s === "flash" ? "In flashcards" : "New"));
    b.append(chip, txt, dot);
    li.appendChild(b);
    return li;
  }
  function loadMoreLib() { lib.limit += 60; renderLibrary(); }

  /* =========================================================
     17. WORD DETAIL SHEET
     ========================================================= */
  let wdG = -1;
  function openWord(g) {
    wdG = g;
    renderWordSheet();
    const dlg = $("wordDlg");
    if (!dlg.open) dlg.showModal();
  }
  function renderWordSheet() {
    const g = wdG;
    if (g < 0) return;
    const e = E[g];
    const s = statusOf(g);
    const lvl = $("wdLevel");
    lvl.textContent = e.l;
    lvl.dataset.l = e.l;
    setText("wdWord", cap(e.w));
    setText("wdIpa", e.ipa || "");
    setText("wdMeaning", e.m || "");
    const fa = $("wdFa");
    fa.textContent = e.fa || "";
    fa.hidden = !e.fa;
    fillExamples($("wdEx"), e.ex, e.exfa);
    setText("wdCat", e.cat);
    setText("wdFreq", e.f ? e.f.toLowerCase() : "—");
    setText("wdReg", e.reg || "—");
    setText("wdCtx", e.ctx || "—");
    const st = $("wdStatus");
    st.className = "status-tag" + (s ? " " + s : "");
    st.textContent = s === "known" ? "● " + (settings.lang === "fa" ? "بلد" : "Known") : s === "flash" ? "● " + (settings.lang === "fa" ? "در فلش‌کارت" : "In flashcards") : "○ " + (settings.lang === "fa" ? "تازه" : "New");
    $("wdKnow").disabled = s === "known";
    $("wdFlash").disabled = s === "flash";
    $("wdBack").disabled = !s;
    $("wdSpeak").setAttribute("aria-label", t("listen") + ": " + e.w.toLowerCase());
  }
  function setWordStatus(s) {
    if (wdG < 0) return;
    const g = wdG;
    const changed = classify(g, s);
    if (!changed) return;
    const msg = s === "known" ? t("sortedKnown", { w: cap(E[g].w) }) : s === "flash" ? t("sortedFlash", { w: cap(E[g].w) }) : t("backQueue", { w: cap(E[g].w) });
    Snd.play(s === "known" ? "know" : s ? "review" : "undo");
    renderWordSheet();
    toast(msg, { undo: true });
    refreshAfterWordChange();
  }

  /* =========================================================
     18. PROGRESS
     ========================================================= */
  let catsExpanded = false;
  function renderProgress() {
    const st = stats();
    countUp($("pKnown"), st.known);
    countUp($("pFlash"), st.flash);
    countUp($("pQueue"), st.queue);
    countUp($("pToday"), activityOf(todayRec()));
    setText("pKnownPct", Math.round((st.known / N) * 1000) / 10 + "% · " + fmt(N));
    setText("pQueueSub", settings.lang === "fa" ? "از " + fmt(N) : "of " + fmt(N));
    setText("pTodaySub", (settings.lang === "fa" ? "هدف " : "goal ") + fmt(settings.goal));
    const li = levelInfo(L.xp);
    setText("pLevel", fmt(li.lv));
    setText("pXpText", fmt(L.xp) + " XP · " + t("xpTo", { x: fmt(levelStart(li.lv + 1) - L.xp), l: li.lv + 1 }));
    setWidth("pXpBar", li.pct);
    const sk = streakInfo();
    countUp($("pStreak"), sk.current);
    setText("pBest", t("bestStreak", { n: fmt(sk.best) }));
    // last 14 days
    const days = $("pDays");
    days.textContent = "";
    const today = dayNum(todayKey());
    const vals = [];
    for (let i = 13; i >= 0; i--) {
      const key = keyFromNum(today - i);
      vals.push({ key, a: activityOf(L.log[key]), isToday: i === 0 });
    }
    const max = Math.max(1, ...vals.map((v) => v.a));
    vals.forEach((v) => {
      const col = document.createElement("div");
      col.className = "day" + (v.a ? "" : " empty-day") + (v.isToday ? " today" : "");
      const bar = document.createElement("i");
      bar.style.setProperty("--h", Math.max(4, (v.a / max) * 100).toFixed(1) + "%");
      bar.title = v.key + ": " + v.a;
      const b = document.createElement("b");
      b.textContent = v.a ? fmt(v.a) : "";
      const lab = document.createElement("span");
      lab.textContent = new Date(v.key + "T12:00:00Z").toLocaleDateString(settings.lang === "fa" ? "fa-IR" : "en-US", { weekday: "narrow", timeZone: "UTC" });
      col.append(b, bar, lab);
      days.appendChild(col);
    });
    // levels
    const lv = $("pLevels");
    lv.textContent = "";
    LEVELS.forEach((l) => {
      const total = LEVEL_TOTAL[l] || 1;
      const k = st.byL[l].known, f = st.byL[l].flash;
      const row = document.createElement("div");
      row.className = "lvl-row";
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.l = l;
      chip.textContent = l;
      const stack = document.createElement("div");
      stack.className = "stack";
      stack.setAttribute("role", "img");
      stack.setAttribute("aria-label", l + ": " + k + " known, " + f + " in flashcards, of " + total);
      const sk1 = document.createElement("i");
      sk1.className = "s-known";
      sk1.style.width = ((k / total) * 100).toFixed(2) + "%";
      const sf1 = document.createElement("i");
      sf1.className = "s-flash";
      sf1.style.width = ((f / total) * 100).toFixed(2) + "%";
      stack.append(sk1, sf1);
      const pct = document.createElement("span");
      pct.className = "pct";
      pct.textContent = Math.round((k / total) * 100) + "%";
      row.append(chip, stack, pct);
      lv.appendChild(row);
    });
    const legend = document.createElement("div");
    legend.className = "legend";
    const legendItem = (dotCls, label) => {
      const sp = document.createElement("span");
      const dot = document.createElement("i");
      dot.className = "dot " + dotCls;
      sp.append(dot, document.createTextNode(label));
      return sp;
    };
    legend.replaceChildren(
      legendItem("known", settings.lang === "fa" ? "بلد" : "Known"),
      legendItem("flash", settings.lang === "fa" ? "فلش‌کارت" : "In flashcards")
    );
    lv.appendChild(legend);
    // categories
    const cats = CATS.map((c) => ({ c, k: (st.byC[c] || { known: 0 }).known, f: (st.byC[c] || { flash: 0 }).flash, total: CAT_TOTAL[c] }))
      .sort((a, b) => (b.k + b.f) - (a.k + a.f) || a.c.localeCompare(b.c, "en"));
    const shown = catsExpanded ? cats : cats.slice(0, 8);
    const cb = $("pCats");
    cb.textContent = "";
    shown.forEach((r) => {
      const row = document.createElement("div");
      row.className = "cat-row";
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = r.c;
      nm.title = r.c;
      const ct = document.createElement("span");
      ct.className = "ct";
      ct.textContent = fmt(r.k) + " / " + fmt(r.total);
      const stack = document.createElement("div");
      stack.className = "stack";
      const a = document.createElement("i");
      a.className = "s-known";
      a.style.width = ((r.k / r.total) * 100).toFixed(2) + "%";
      const b = document.createElement("i");
      b.className = "s-flash";
      b.style.width = ((r.f / r.total) * 100).toFixed(2) + "%";
      stack.append(a, b);
      row.append(nm, ct, stack);
      cb.appendChild(row);
    });
    $("pCatsMore").textContent = catsExpanded ? (settings.lang === "fa" ? "نمایش کمتر" : "Show fewer") : t("showAll");
    // achievements
    const ul = $("pAch");
    ul.textContent = "";
    ACH.forEach((a) => ul.appendChild(achItem(a)));
    setText("pAchCount", achUnlocked() + " / " + ACH.length);
  }

  /* =========================================================
     19. SETTINGS UI
     ========================================================= */
  function syncSettingsUI() {
    fillSegState("setTheme", settings.theme);
    fillSegState("setLang", settings.lang);
    fillSegState("setMotion", settings.motion);
    setSwitch("setSound", settings.sound);
    setSwitch("setFa", settings.showFa);
    setSwitch("setAuto", settings.autoSpeak);
    $("setVol").value = String(settings.volume);
    $("setVol").disabled = !settings.sound;
    setText("goalVal", fmt(settings.goal));
    $("goalDown").disabled = settings.goal <= 3;
    $("goalUp").disabled = settings.goal >= 60;
  }
  function fillSegState(id, v) {
    qsa("#" + id + " button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  }
  function setSwitch(id, on) {
    const el = $(id);
    if (!el) return;
    el.setAttribute("aria-checked", String(!!on));
  }
  function setGoal(n) {
    settings.goal = clamp(n, 3, 60);
    saveSettings();
    syncSettingsUI();
    if (route === "home") renderHome();
    if (route === "progress") renderProgress();
  }
  function exportProgress() {
    const payload = { app: "vocab4000", version: 2, exported: new Date().toISOString(), words: L.words, log: L.log, xp: L.xp, ach: L.ach, goalHit: L.goalHit, pOk: L.pOk, flawless: L.flawless, swept: L.swept };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocab4000-progress-" + todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    toast(t("exported"));
  }
  function importProgress(file) {
    if (!file || file.size > MAX_IMPORT_BYTES) { toast(t("importFail")); return; }
    const reader = new FileReader();
    reader.onload = () => {
      let j = null;
      try { j = JSON.parse(String(reader.result)); } catch (e) { j = null; }
      if (!j || typeof j !== "object" || !j.words || !j.log) { toast(t("importFail")); return; }
      const imp = sanitizeLearn(j);
      let n = 0;
      Object.keys(imp.words).forEach((k) => {
        const cur = L.words[k];
        if (!cur || (imp.words[k].t > cur.t && cur.s !== imp.words[k].s)) { if (!cur) n++; L.words[k] = imp.words[k]; }
      });
      Object.keys(imp.log).forEach((d) => {
        const a = L.log[d] || (L.log[d] = { k: 0, f: 0, b: 0, r: 0, q: 0, p: 0, x: 0 });
        const b = imp.log[d];
        ["k", "f", "b", "r", "q", "p", "x"].forEach((f) => { a[f] = Math.max(a[f] || 0, b[f] || 0); });
      });
      L.xp = Math.max(L.xp, imp.xp);
      Object.keys(imp.ach).forEach((k) => { if (!hasOwn(L.ach, k) || !L.ach[k]) L.ach[k] = imp.ach[k]; });
      Object.keys(imp.goalHit).forEach((k) => { L.goalHit[k] = 1; });
      L.pOk = Math.max(L.pOk, imp.pOk);
      L.flawless = L.flawless || imp.flawless;
      L.swept = L.swept || imp.swept;
      saveLearn();
      toast(t("imported", { n: fmt(n) }));
      refreshAfterWordChange();
    };
    reader.readAsText(file);
  }
  function resetProgress() {
    const fa = settings.lang === "fa";
    if (!window.confirm(fa ? "قبل از بازنشانی، می‌خواهی نسخهٔ پشتیبان بگیری؟ (تأیید = دانلود پشتیبان)" : "Back up your progress before resetting? (OK downloads a backup first)")) {
      // user declined the backup; still ask for the reset itself below
    } else {
      exportProgress();
    }
    if (!window.confirm(t("resetConfirm"))) return;
    L = sanitizeLearn(null);
    undoStack = [];
    cur = -1;
    saveLearn();
    toast(t("resetDone"));
    refreshAfterWordChange();
  }

  /* =========================================================
     20. KEYBOARD
     ========================================================= */
  function typing(target) {
    return !!(target && (target.closest && target.closest("input, select, textarea, [contenteditable='true']")));
  }
  function dialogOpen() { return !!document.querySelector("dialog[open]"); }
  function onKey(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !typing(e.target) && (route === "learn" || route === "flash")) { e.preventDefault(); undo(); }
      return;
    }
    if (typing(e.target)) return;
    if (dialogOpen()) return;
    const onControl = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (e.key === "/" && route === "library") { e.preventDefault(); $("libSearch").focus(); return; }
    if (route === "learn") {
      if (e.key === "ArrowRight") { e.preventDefault(); flyAndDecide("known"); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); flyAndDecide("flash"); }
      else if (e.key === "ArrowDown" || e.key === "n") { e.preventDefault(); skipCurrent(); }
      else if (e.key === "z" || e.key === "Z") { undo(); }
      else if (e.key === "s" || e.key === "S") { if (cur >= 0) speakWord(cur, $("cSpeak")); }
      else if (e.key === "p" || e.key === "P") { settings.showFa = !settings.showFa; saveSettings(); if (cur >= 0) renderCard(cur, false); }
      else if (e.key === " " && !onControl) { e.preventDefault(); if (cur >= 0) speakWord(cur, $("cSpeak")); }
    } else if (route === "flash") {
      if ((e.key === " " || e.key === "Enter") && !onControl) { e.preventDefault(); revealCard(); }
      else if (e.key === "ArrowLeft" && revealed) { e.preventDefault(); rateFlash("still"); }
      else if (e.key === "ArrowRight" && revealed) { e.preventDefault(); rateFlash("got"); }
      else if (e.key === "s" || e.key === "S") { if (deck.length) speakWord(deck[dPos], $("fcSpeak")); }
      else if (e.key === "z" || e.key === "Z") undo();
    } else if (route === "quiz" && quiz.running) {
      const n = Number(e.key);
      if (n >= 1 && n <= 4 && !quiz.locked) { e.preventDefault(); answer(n - 1); }
      else if ((e.key === "Enter" || e.key === " ") && quiz.locked && !onControl) { e.preventDefault(); nextQuestion(); }
    } else if (route === "speak") {
      if ((e.key === "m" || e.key === "M") && SR) spListen();
      else if (e.key === "l" || e.key === "L") { if (sp.g >= 0) speakWord(sp.g, $("spListen")); }
      else if ((e.key === "ArrowRight" || e.key === "n") && !onControl) spNext(false);
    }
  }

  /* Generic left/right swipe for a single word element (library rows, flashcards).
     Drag past the threshold to commit; a short drag snaps back. Taps still work. */
  function attachWordSwipe(el, onRight, onLeft, canCommit) {
    let d = null;
    let suppressClick = false;
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("button, a, input, select") && e.target !== el) return;
      d = { x: e.clientX, y: e.clientY, dx: 0, axis: null, id: e.pointerId };
    });
    el.addEventListener("pointermove", (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) d.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (d.axis === "y") { d = null; return; }
      if (d.axis === "x") {
        d.dx = dx;
        if (!d.captured) { d.captured = true; try { el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ } }
        suppressClick = true;
        el.classList.add("swiping");
        el.style.transition = "none";
        el.style.transform = "translate3d(" + dx + "px,0,0)";
        el.dataset.sw = dx > 60 ? "right" : dx < -60 ? "left" : "";
      }
    });
    const end = (e) => {
      if (!d || (e && e.pointerId !== d.id)) return;
      const dx = d.dx;
      d = null;
      el.classList.remove("swiping");
      el.style.transition = "";
      el.dataset.sw = "";
      if (Math.abs(dx) > 90 && (!canCommit || canCommit())) {
        const dir = dx > 0 ? 1 : -1;
        el.classList.add(dir > 0 ? "sw-out-r" : "sw-out-l");
        setTimeout(() => {
          el.classList.remove("sw-out-r", "sw-out-l");
          el.style.transform = "";
          (dir > 0 ? onRight : onLeft)();
        }, 220);
      } else {
        el.style.transform = "";
      }
      setTimeout(() => { suppressClick = false; }, 0);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", (e) => {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);
  }
  function decideWord(g, s) {
    const changed = classify(g, s);
    if (!changed) return;
    Snd.play(s === "known" ? "know" : "review");
    toast(t(s === "known" ? "sortedKnown" : "sortedFlash", { w: cap(E[g].w) }), { undo: true });
    refreshAfterWordChange();
  }

  /* =========================================================
     21. SWIPE (pointer events on the learn card)
     ========================================================= */
  function setupSwipe() {
    const card = $("card");
    let d = null;
    card.addEventListener("pointerdown", (e) => {
      if (busy || cur < 0 || route !== "learn") return;
      if (e.target.closest("button, a, input, select")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      d = { x: e.clientX, y: e.clientY, dx: 0, t0: performance.now(), axis: null, id: e.pointerId };
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    card.addEventListener("pointermove", (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) d.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (d.axis === "y") { d = null; return; }
      if (d.axis === "x") {
        d.dx = dx;
        card.classList.add("dragging");
        card.style.transform = "translate3d(" + dx + "px,0,0) rotate(" + dx * 0.035 + "deg)";
        $("card").querySelector(".stamp-know").style.opacity = String(clamp(dx / 110, 0, 1));
        $("card").querySelector(".stamp-review").style.opacity = String(clamp(-dx / 110, 0, 1));
      }
    });
    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = d.dx;
      const ms = Math.max(1, performance.now() - d.t0);
      const v = Math.abs(dx) / ms;
      const dragged = d.axis === "x";
      d = null;
      card.querySelectorAll(".stamp").forEach((s) => { s.style.opacity = ""; });
      if (!dragged) return;
      if (Math.abs(dx) > 110 || (Math.abs(dx) > 40 && v > 0.6)) {
        flyAndDecide(dx > 0 ? "known" : "flash");
      } else {
        card.classList.remove("dragging");
        card.style.transform = "";
      }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  /* =========================================================
     22. FLASH + QUIZ + SPEAK + LIBRARY EVENTS
     ========================================================= */
  function bindEvents() {
    // learn
    $("btnKnow").addEventListener("click", () => flyAndDecide("known"));
    $("btnReview").addEventListener("click", () => flyAndDecide("flash"));
    $("btnSkip").addEventListener("click", skipCurrent);
    $("btnUndo").addEventListener("click", undo);
    $("scopeCat").addEventListener("change", (e) => setScope(e.target.value, L.scope.level));
    $("cSpeak").addEventListener("click", () => { Snd.play("tap"); if ($("cSpeak").classList.contains("speaking")) stopSpeech(); else speakWord(cur, $("cSpeak")); });
    $("cFaBtn").addEventListener("click", () => {
      settings.showFa = !settings.showFa; saveSettings();
      if (cur >= 0) renderCard(cur, false);
      Snd.play("tap");
    });
    $("cDetail").addEventListener("click", () => { if (cur >= 0) openWord(cur); });
    setupSwipe();
    // undo toast
    $("toastUndo").addEventListener("click", () => { if (toastUndoFn) { toastUndoFn(); } else undo(); $("toast").hidden = true; });
    // flash
    $("fcFlip").addEventListener("click", (e) => { if (e.target.closest("button")) return; if (!revealed) revealCard(); });
    attachWordSwipe($("fcFlip"), () => rateFlash("got"), () => rateFlash("still"), () => revealed && deck.length > 0 && !busy);
    $("fcFlip").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!revealed) revealCard(); } });
    $("fcSpeak").addEventListener("click", (e) => { e.stopPropagation(); if (deck.length) { Snd.play("tap"); speakWord(deck[dPos], $("fcSpeak")); } });
    $("fcStill").addEventListener("click", () => rateFlash("still"));
    $("fcGot").addEventListener("click", () => rateFlash("got"));
    $("fcShuffle").addEventListener("click", () => {
      fcShuffleOn = !fcShuffleOn;
      Snd.play("tap");
      buildDeck();
      renderFlash();
      toast(settings.lang === "fa" ? (fcShuffleOn ? "مخلوط کردن روشن شد" : "مخلوط کردن خاموش شد") : (fcShuffleOn ? "Shuffle on" : "Shuffle off"));
    });
    // quiz
    $("qStart").addEventListener("click", () => { Snd.play("tap"); startQuiz(); });
    $("qNext").addEventListener("click", nextQuestion);
    $("qSpeak").addEventListener("click", () => { if (quiz.current) speakWord(quiz.current.g, $("qSpeak")); });
    $("qAgain").addEventListener("click", () => { quiz.running = false; $("quizDone").hidden = true; $("quizSetup").hidden = false; renderQuizSetup(); });
    $("qReviewMissed").addEventListener("click", reviewMissed);
    // speak
    $("spListen").addEventListener("click", () => { if (sp.g >= 0) speakWord(sp.g, $("spListen")); });
    $("spMic").addEventListener("click", spListen);
    $("spNext").addEventListener("click", () => spNext(false));
    $("spGood").addEventListener("click", () => selfRate(true));
    $("spRetry").addEventListener("click", () => selfRate(false));
    // library
    let libTimer = null;
    $("libSearch").addEventListener("input", (e) => {
      clearTimeout(libTimer);
      lib.q = e.target.value;
      libTimer = setTimeout(() => { lib.limit = 60; renderLibrary(); }, 110);
    });
    $("libCat").addEventListener("change", (e) => { lib.cat = e.target.value; lib.limit = 60; renderLibrary(); });
    $("libMore").addEventListener("click", loadMoreLib);
    $("libReset").addEventListener("click", () => {
      lib.level = ""; lib.status = ""; lib.cat = ""; lib.q = ""; lib.limit = 60;
      $("libSearch").value = "";
      $("libCat").value = "";
      buildLibLevels(); buildLibStatus();
      renderLibrary();
    });
    // word sheet
    $("wdSpeak").addEventListener("click", () => { if (wdG >= 0) speakWord(wdG, $("wdSpeak")); });
    $("wdFlash").addEventListener("click", () => setWordStatus("flash"));
    $("wdKnow").addEventListener("click", () => setWordStatus("known"));
    $("wdBack").addEventListener("click", () => setWordStatus(null));
    $("wordDlg").addEventListener("close", () => { stopSpeech(); });
    // progress
    $("pCatsMore").addEventListener("click", () => { catsExpanded = !catsExpanded; renderProgress(); });
    // settings
    $("setSound").addEventListener("click", () => {
      settings.sound = !settings.sound; saveSettings(); syncSettingsUI();
      if (settings.sound) Snd.play("tap");
      $("soundBtn").setAttribute("aria-pressed", String(settings.sound));
      $("soundBtn").querySelector("use").setAttribute("href", settings.sound ? "#i-sound" : "#i-mute");
    });
    $("setVol").addEventListener("input", (e) => { settings.volume = Number(e.target.value); saveSettings(); });
    $("setVol").addEventListener("change", () => { Snd.play("tap"); });
    $("setFa").addEventListener("click", () => { settings.showFa = !settings.showFa; saveSettings(); syncSettingsUI(); if (route === "learn") renderCard(cur, false); if (route === "flash" && deck.length) renderFlash(); });
    $("setAuto").addEventListener("click", () => { settings.autoSpeak = !settings.autoSpeak; saveSettings(); syncSettingsUI(); });
    $("goalDown").addEventListener("click", () => setGoal(settings.goal - 1));
    $("goalUp").addEventListener("click", () => setGoal(settings.goal + 1));
    $("voiceBtn").addEventListener("click", () => { renderVoices(); if (!$("voiceDlg").open) $("voiceDlg").showModal(); });
    $("audioDlBtn").addEventListener("click", downloadPack);
    $("audioRmBtn").addEventListener("click", removeOfflineAudio);
    $("exportBtn").addEventListener("click", exportProgress);
    $("importFile").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) importProgress(f); e.target.value = ""; });
    $("resetBtn").addEventListener("click", resetProgress);
    $("replayWelcomeBtn").addEventListener("click", () => {
      const msg = settings.lang === "fa" ? "خوش‌آمدگویی را دوباره ببینی؟" : "Show the welcome screen again? Your progress stays as it is.";
      if (!window.confirm(msg)) return;
      try { localStorage.removeItem(KEY_ONB); } catch (e) { /* private mode */ }
      openWelcome();
    });
    // top bar
    $("soundBtn").addEventListener("click", () => {
      settings.sound = !settings.sound; saveSettings();
      $("soundBtn").setAttribute("aria-pressed", String(settings.sound));
      $("soundBtn").querySelector("use").setAttribute("href", settings.sound ? "#i-sound" : "#i-mute");
      syncSettingsUI();
      if (settings.sound) Snd.play("tap");
    });
    $("themeBtn").addEventListener("click", () => {
      const next = resolvedTheme() === "dark" ? "light" : "dark";
      settings.theme = next;
      saveSettings();
      applyTheme();
      syncSettingsUI();
      Snd.play("tap");
    });
    $("langBtn").addEventListener("click", () => {
      settings.lang = settings.lang === "fa" ? "en" : "fa";
      saveSettings();
      applyLang();
      syncSettingsUI();
      Snd.play("tap");
    });
    if (mqDark && mqDark.addEventListener) mqDark.addEventListener("change", () => { if (settings.theme === "system") applyTheme(); });
    // hash navigation
    window.addEventListener("hashchange", () => showRoute(currentRoute()));
    // keys
    document.addEventListener("keydown", onKey);
    // dialogs: close on backdrop click
    qsa("dialog.sheet").forEach((d) => {
      d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    });
    // voices
    if (canSpeak) {
      window.speechSynthesis.addEventListener?.("voiceschanged", () => { renderVoiceName(); if ($("voiceDlg").open) renderVoices(); });
    }
    // Keep the learn card in sync if the page is restored from the back/forward cache.
    window.addEventListener("pageshow", (e) => { if (e.persisted) { loadLearn(); renderRoute(true); renderNavBadges(); } });
  }

  /* =========================================================
     23. BOOT
     ========================================================= */

  /* =========================================================
     W. FIRST-RUN WELCOME (shown once, stored under vocab4000-onboarded)
     ========================================================= */
  const KEY_ONB = "vocab4000-onboarded";
  const WEL = {
    en: { eyebrow: "Welcome", title: "Master 6,666 English words, A1 to C2.", text: "Swipe through what you know, drill what you don't, and watch your level climb.", start: "Let's go", skip: "Skip for now", eyebrow2: "Your pace", title2: "Pick your daily target.", hint: "You can change this anytime in Settings.", go: "Start learning", back: "Back" },
    fa: { eyebrow: "خوش آمدی", title: "۶٬۶۶۶ واژهٔ انگلیسی، از A1 تا C2.", text: "واژه‌های بلدت را با کشیدن مشخص کن، روی بقیه تمرین کن و ببین سطحت چطور بالا می‌رود.", start: "شروع کن", skip: "فعلاً نه", eyebrow2: "سرعت تو", title2: "هدف روزانه‌ات را انتخاب کن.", hint: "هر وقت خواستی در تنظیمات عوضش کن.", go: "شروع یادگیری", back: "بازگشت" }
  };
  function wt(k) { return (WEL[settings.lang] || WEL.en)[k]; }
  function markOnboarded() { writeJSON(KEY_ONB, { done: 1, at: Date.now() }); }
  function showWelStep(n) {
    const d = $("welcomeDlg");
    if (!d) return;
    d.querySelectorAll(".welcome-step").forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    d.querySelectorAll(".welcome-dots i").forEach((i, idx) => i.classList.toggle("on", idx === n - 1));
  }
  function applyWelText() {
    const set = (id, k) => { const el = $(id); if (el) el.textContent = wt(k); };
    set("welEyebrow", "eyebrow"); set("welTitle", "title"); set("welText", "text");
    set("welNext", "start"); set("welSkip", "skip"); set("welEyebrow2", "eyebrow2");
    set("welTitle2", "title2"); set("welStart", "go"); set("welBack", "back");
    const hint = $("welcomeDlg") && $("welcomeDlg").querySelector('[data-step="2"] .muted');
    if (hint) hint.textContent = wt("hint");
  }
  function renderWelGoal() {
    fillSeg($("welGoal"), [[5, "5"], [10, "10"], [20, "20"]], settings.goal, (v) => { settings.goal = Number(v); renderWelGoal(); });
  }
  function openWelcome() {
    const d = $("welcomeDlg");
    if (!d || typeof d.showModal !== "function" || d.open) return;
    applyWelText();
    renderWelGoal();
    showWelStep(1);
    d.showModal();
  }
  function bindWelcome() {
    const d = $("welcomeDlg");
    if (!d) return;
    $("welNext").addEventListener("click", () => { Snd.play("tap"); showWelStep(2); });
    $("welBack").addEventListener("click", () => { showWelStep(1); });
    $("welSkip").addEventListener("click", () => { markOnboarded(); d.close(); });
    $("welStart").addEventListener("click", () => {
      settings.goal = clamp(Math.round(Number(settings.goal) || 10), 3, 60);
      saveSettings();
      markOnboarded();
      d.close();
      syncSettingsUI();
      if (route !== "learn") location.hash = "#/learn";
    });
    d.addEventListener("cancel", markOnboarded);
    if (!readJSON(KEY_ONB)) frame(openWelcome);
  }

  function boot() {
    if (!N) {
      document.querySelector("main").textContent = settings.lang === "fa" ? "فایل داده پیدا نشد: data/entries.js" : "Data file missing: data/entries.js";
      return;
    }
    loadLearn();
    applyMotion();
    applyLang();
    buildSegs();
    applyTheme();
    syncSettingsUI();
    bindEvents();
    bindWelcome();
    loadPack();
    renderVoiceName();
    if (canSpeak) {
      window.speechSynthesis.getVoices();
    }
    if (!SR) {
      const m = $("spMic");
      if (m) m.title = settings.lang === "fa" ? "ورودی صوتی در این مرورگر نیست" : "Voice input isn't available in this browser";
    }
    // Make the first paint quiet: first view appears with the normal entrance animation.
    showRoute(currentRoute());
    renderNavBadges();
    // Ring/bars animate from zero after the first frame.
    frame(() => { renderHome(); });
    // Keep the day rollover honest: re-render the home stats when the day changes while the tab is open.
    let lastDay = todayKey();
    setInterval(() => {
      const d = todayKey();
      if (d !== lastDay) { lastDay = d; renderNavBadges(); if (route === "home") renderHome(); }
    }, 60000);
  }
  // Service worker: offline use and install. Only over http(s), so file:// opens still work.
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => {}); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
