"use strict";

// =====================================================================
// AR Music Game - Web版（キーボードプレイ）
// Processing版 R4_main.pde の移植。数値はオリジナルに合わせている。
// =====================================================================

// ----- 定数 -----
const W = 1280, H = 960;
const LANE_COUNT = 4;
const MUSIC_DELAY = 2.0;           // ゲーム開始から音楽再生までの遅延（秒）
const MAX_SCORE = 1000;

// ---- 3Dレーン（ノーツは奥から手前に流れる） ----
const APPROACH = 2.0;              // 出現から判定ラインまでの秒数（旧横スクロール版と同じ）
const HORIZON_Y = 300;             // レーン奥端（消失点側）のy
const JUDGE_Y = 800;               // 判定ラインのy
const FAR_LANE_W = 40;             // 奥での1レーン幅
const NEAR_LANE_W = 170;           // 手前での1レーン幅
const PERSPECTIVE_K = 3.0;         // 遠近の強さ（大きいほど手前で加速して見える）
const G_BOTTOM = (H - HORIZON_Y) / (JUDGE_Y - HORIZON_Y); // レーンを画面下端まで延長する係数

// 判定ウィンドウ（旧版の x∈[0,130) と同じ時間幅）
const HIT_EARLY = 0.083;           // 早押し許容（秒）
const HIT_LATE = 0.133;            // 遅押し許容（秒）
const MISS_AT = 0.25;              // これより遅れたらミス確定

const LANE_COLORS = ["#4db8ff", "#4ee08a", "#ffd94d", "#ff5c5c"];

// ----- 曲データ（soundFiles / linesArray / lyricsArray / MusicBackArray の対応） -----
// offset: 譜面と音楽のズレ補正（秒）。ノーツ時刻に加算される。
//   tools/estimate_offsets.py（音声オンセットと譜面の相互相関）による推定値。
// candidates: 相関スコア上位の候補。プレイ中に Tab で切り替えて耳で確認できる。
const SONGS = [
  { title: "Processing",     music: "Processing.mp3", chart: "keyLog_processing.txt", lyric: "processinglyric.txt", back: "processingback.png",
    offset: -1.34,  candidates: [-1.34, -1.885, -0.28, -0.82, 0] },
  { title: "BAD UI",         music: "BADUI.MP3",      chart: "keyLog_BADUI.txt",      lyric: "BADUIlyric.txt",      back: "BADUIback.png",
    offset: -3.395, candidates: [-3.395, -0.125, -1.315, -4.58, 0] },
  { title: "Invisible Data", music: "Invisible.MP3",  chart: "keyLog_invisible.txt",  lyric: "Invisiblelyric.txt",  back: "invisible.png",
    offset: -5.375, candidates: [-5.375, 0.64, -1.08, -3.865, 0] },
  { title: "婉曲モダリティ",   music: "modality.mp3",   chart: "keyLog_modality.txt",   lyric: "modality.txt",        back: "modality.jpg",
    offset: 0.925,  candidates: [0.925, -0.84, 0.04, -3.49] },
  { title: "仮想領域現実感",   music: "VR.MP3",         chart: "keyLog_AR.txt",         lyric: "VR.txt",              back: "VR.jpg",
    offset: -1.79,  candidates: [-1.79, 1.905, 0.985, -0.865, 0] },
  { title: "RW Interaction", music: "prophecy.MP3",   chart: "keyLog_prophecy.txt",   lyric: "prophecy.txt",        back: "real.jpg",
    offset: 0.025,  candidates: [0.025, -1.195, 1.255, -4.875] },
  { title: "テン、二大原則",   music: "brain.mp3",      chart: "keyLog_hourensou.txt",  lyric: "brain.txt",           back: "hourensou.png",
    offset: -5.435, candidates: [-5.435, -2.625, -1.685, -4.5, 0] },
  { title: "Open CoVenant",  music: "code.MP3",       chart: "keyLog_opencv.txt",     lyric: "opencv.txt",          back: "opencv.jpg",
    offset: 1.38,   candidates: [1.38, 0.04, 2.73, -5.355] },
  { title: "AdveNyAr!",      music: "AR.MP3",         chart: "keyLog_nya.txt",        lyric: "nya.txt",             back: "nya.jpg",
    offset: -4.235, candidates: [-4.235, -5.71, -2.745, -4.965, 0] },
  { title: "HCI",            music: "HCI.mp3",        chart: "keyLog_HCI.txt",        lyric: "HCI.txt",             back: "HCI.png",
    offset: -2.285, candidates: [-2.285, 5.675, -3.02, 1.42, 0] },
];

const DRUM_FILES = [
  "maou_se_inst_drum1_tom3.mp3",   // レーン1
  "maou_se_inst_drum1_snare.mp3",  // レーン2
  "maou_se_inst_drum1_cymbal.mp3", // レーン3
  "maou_se_inst_drum2_hat.mp3",    // レーン4
];

// キー割り当て（1〜4 に加えて D/F/J/K でも遊べるようにした）
const KEY_TO_LANE = { "1": 0, "2": 1, "3": 2, "4": 3, "d": 0, "f": 1, "j": 2, "k": 3 };
const LANE_KEY_LABEL = ["1 / D", "2 / F", "3 / J", "4 / K"];

// ----- タップ音の楽器（レーンごとに音程が異なる統一楽器） -----
const INSTRUMENTS = [
  { id: "marimba", name: "マリンバ" },
  { id: "piano",   name: "ピアノ" },
  { id: "synth",   name: "シンセ" },
  { id: "bell",    name: "ベル" },
  { id: "tom",     name: "タム（音程違い）" },
  { id: "classic", name: "ドラムセット（従来）" },
];

// レーン1〜4の音程（Hz）。楽器ごとに聞きやすい音域にしてある。
const TAP_NOTES = {
  marimba: [523.25, 587.33, 659.25, 783.99],   // C5 D5 E5 G5
  piano:   [261.63, 329.63, 392.00, 523.25],   // C4 E4 G4 C5
  synth:   [523.25, 587.33, 659.25, 783.99],   // C5 D5 E5 G5
  bell:    [659.25, 783.99, 880.00, 1046.50],  // E5 G5 A5 C6
};

// シンセ音色: partials = [倍音倍率, 音量比, 減衰秒] の配列
const SYNTH_PATCHES = {
  marimba: { wave: "sine",   attack: 0.002, gain: 0.50, partials: [[1, 1, 0.45], [4, 0.20, 0.12]] },
  piano:   { wave: "sine",   attack: 0.002, gain: 0.40, partials: [[1, 1, 0.80], [2, 0.35, 0.50], [3, 0.12, 0.25]] },
  synth:   { wave: "square", attack: 0.001, gain: 0.22, partials: [[1, 1, 0.20]] },
  bell:    { wave: "sine",   attack: 0.002, gain: 0.32, partials: [[1, 1, 1.10], [2.76, 0.40, 0.70], [5.40, 0.12, 0.40]] },
};

// 「タム（音程違い）」用の再生速度（ルート・長3度・完全5度・オクターブ）
const TOM_RATES = [1.0, 1.26, 1.5, 2.0];

// ----- キャンバス -----
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ----- ゲーム状態 -----
// "loading" → "title" → "select" → "play" → "result"
let state = "loading";
let loadProgress = 0;

let selectedIndex = 0;
let mouse = { x: -1, y: -1 };

// プレイ中の状態
let notes = [];          // {time, lane, judged, hit}
let gameStartTime = 0;   // performance.now() 基準（ms）
let musicStarted = false;
let totalScore = 0;      // ヒット数（Processing版の totalScore と同じ）
let laneFlash = [0, 0, 0, 0];   // キー押下エフェクト（残り時間 秒）
let hitPopups = [];      // {lane, t, type:"hit"|"miss"} 判定表示
let combo = 0;           // 連続ヒット数
let maxCombo = 0;
let comboPop = 0;        // コンボ数字の拡大アニメ（残り秒）

// タイミング補正
let noteOffset = 0;      // 現在の曲の補正値（秒）。ノーツ時刻に加算
let candIdx = 0;         // 補正候補のインデックス（-1: 手動調整値）
let autoplay = false;    // オートプレイ（補正の耳確認用）
let autoplayUsed = false;
let offsetFlash = 0;     // 補正変更直後の表示ハイライト（残り秒）
let clockAnchor = null;  // 音声クロック同期用アンカー（平滑化済み）

// タップ音の楽器（localStorageに保存）
let instrumentIdx = Math.max(0, INSTRUMENTS.findIndex(i => i.id === localStorage.getItem("tapInstrument")));

// ----- アセット -----
const images = {};       // name -> Image
const charts = [];       // 曲ごとの [{time, lane}]
const lyrics = [];       // 曲ごとの string[]
const musicCache = {};   // index -> HTMLAudioElement
let currentMusic = null;
let audioCtx = null;
let drumBuffers = [null, null, null, null];
let drumArrayBuffers = [];

// =====================================================================
// アセット読み込み
// =====================================================================
function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = () => reject(new Error("画像の読み込みに失敗: " + name));
    img.src = "assets/" + name;
  });
}

async function loadText(file) {
  const res = await fetch("assets/" + file);
  if (!res.ok) throw new Error("読み込み失敗: " + file);
  return res.text();
}

// 譜面のパース: "At 2.310 seconds ---- 0"
function parseChart(text) {
  const result = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(" ---- ");
    const time = parseFloat(parts[0].split(" ")[1]);
    const lane = parseInt(parts[1], 10);
    if (!isNaN(time) && lane >= 0 && lane < LANE_COUNT) {
      result.push({ time, lane });
    }
  }
  return result;
}

async function loadAssets() {
  const imageNames = [
    "title.png", "start.png", "LYRICS.png", "retry.png", "exit.png",
    ...SONGS.map(s => s.back),
  ];
  const tasks = [];
  let done = 0;
  const total = imageNames.length + SONGS.length * 2 + DRUM_FILES.length;
  const tick = () => { done++; loadProgress = done / total; };

  for (const name of imageNames) {
    tasks.push(loadImage(name).then(tick));
  }
  for (let i = 0; i < SONGS.length; i++) {
    tasks.push(loadText(SONGS[i].chart).then(t => { charts[i] = parseChart(t); tick(); }));
    tasks.push(loadText(SONGS[i].lyric).then(t => { lyrics[i] = t.split(/\r?\n/); tick(); }));
  }
  // ドラム音はまず ArrayBuffer で取得（AudioContext はユーザー操作後に作る）
  for (let i = 0; i < DRUM_FILES.length; i++) {
    tasks.push(fetch("assets/" + DRUM_FILES[i])
      .then(r => r.arrayBuffer())
      .then(b => { drumArrayBuffers[i] = b; tick(); }));
  }
  await Promise.all(tasks);
  state = "title";
}

// =====================================================================
// オーディオ
// =====================================================================
function ensureAudioContext() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
  // ドラム音をデコード
  drumArrayBuffers.forEach((buf, i) => {
    audioCtx.decodeAudioData(buf.slice(0)).then(decoded => {
      drumBuffers[i] = { buffer: decoded, offset: leadingSilence(decoded) };
    });
  });
}

// MP3先頭の無音区間（エンコーダ遅延。実測で約24〜29ms）の長さを返す。
// 再生時にこのぶんをスキップして、キー押下から発音までの遅延を減らす。
function leadingSilence(buffer) {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  const th = peak * 0.02;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > th) {
      return Math.max(0, (i - 32) / buffer.sampleRate); // 立ち上がりの少し手前から再生
    }
  }
  return 0;
}

// レーンのタップ音を鳴らす（選択中の楽器で、レーンごとに異なる音程）
function playTap(lane) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const inst = INSTRUMENTS[instrumentIdx].id;
  if (inst === "classic") {
    playDrumSample(lane, 1.0);          // 従来: レーンごとに別のドラム音
  } else if (inst === "tom") {
    playDrumSample(0, TOM_RATES[lane]); // タムを音程を変えて再生
  } else {
    playSynthTap(inst, lane);
  }
}

function playDrumSample(idx, rate) {
  if (!drumBuffers[idx]) return;
  const src = audioCtx.createBufferSource();
  src.buffer = drumBuffers[idx].buffer;
  src.playbackRate.value = rate;
  src.connect(audioCtx.destination);
  src.start(0, drumBuffers[idx].offset);
}

// Web Audioでシンセ音を合成して再生
function playSynthTap(inst, lane) {
  const patch = SYNTH_PATCHES[inst];
  const base = TAP_NOTES[inst][lane];
  const t0 = audioCtx.currentTime;
  for (const [mult, vol, decay] of patch.partials) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = patch.wave;
    osc.frequency.value = base * mult;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(patch.gain * vol, t0 + patch.attack);
    gain.gain.exponentialRampToValueAtTime(0.0005, t0 + decay);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  }
}

// 楽器を切り替えて保存し、4レーン分を試聴（アルペジオ）
function setInstrument(idx) {
  instrumentIdx = (idx + INSTRUMENTS.length) % INSTRUMENTS.length;
  localStorage.setItem("tapInstrument", INSTRUMENTS[instrumentIdx].id);
  for (let i = 0; i < LANE_COUNT; i++) {
    setTimeout(() => playTap(i), i * 130);
  }
}

function getMusic(index) {
  if (!musicCache[index]) {
    const audio = new Audio("assets/" + SONGS[index].music);
    audio.preload = "auto";
    musicCache[index] = audio;
  }
  return musicCache[index];
}

function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.onended = null;
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

function playPreview(index) {
  stopMusic();
  const audio = getMusic(index);
  currentMusic = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// =====================================================================
// 状態遷移
// =====================================================================
function gotoSelect() {
  stopMusic();
  state = "select";
  playPreview(selectedIndex);
}

function startGame() {
  stopMusic();
  // 譜面を初期化（renew_lines 相当）
  notes = charts[selectedIndex].map(n => ({ time: n.time, lane: n.lane, judged: false, hit: false }));
  totalScore = 0;
  musicStarted = false;
  hitPopups = [];
  laneFlash = [0, 0, 0, 0];
  combo = 0;
  maxCombo = 0;
  comboPop = 0;
  // タイミング補正（保存値 > 曲デフォルトの順で採用）
  noteOffset = getOffsetFor(selectedIndex);
  candIdx = SONGS[selectedIndex].candidates.indexOf(noteOffset);
  autoplay = false;
  autoplayUsed = false;
  offsetFlash = 0;
  clockAnchor = null;
  gameStartTime = performance.now();
  state = "play";
}

function endGame() {
  stopMusic();
  state = "result";
}

function quitToSelect() {
  stopMusic();
  gotoSelect();
}

// =====================================================================
// 入力
// =====================================================================
function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("mousemove", e => { mouse = canvasPos(e); });

canvas.addEventListener("mousedown", e => {
  const p = canvasPos(e);
  ensureAudioContext();

  if (state === "title") {
    // STARTボタン: image(start, centerX-150, centerY+250, 300, 100)
    if (p.x > W / 2 - 150 && p.x < W / 2 + 150 && p.y > H / 2 + 250 && p.y < H / 2 + 350) {
      gotoSelect();
    }
  } else if (state === "select") {
    // 楽器セレクター（◀ / ▶・名前クリックで切替）
    if (p.y > 122 && p.y < 168) {
      if (p.x > 875 && p.x < 925) { setInstrument(instrumentIdx - 1); return; }
      if (p.x > 940 && p.x < 1245) { setInstrument(instrumentIdx + 1); return; }
    }
    // 表示中の曲リスト（i=-2..2）をクリック → 選択 / 選択中の曲なら開始
    for (let i = -2; i <= 2; i++) {
      const idx = selectedIndex + i;
      if (idx < 0 || idx >= SONGS.length) continue;
      const y = H * 0.6 + i * 110;
      if (p.x > W * 0.55 && p.x < W && p.y > y - 70 && p.y < y + 25) {
        if (i === 0) {
          startGame();
        } else {
          changeSelection(idx);
        }
        return;
      }
    }
  } else if (state === "result") {
    // exit: image(exit, W*0.8, H*0.85, 170, 170) 円判定
    if (dist(p.x, p.y, W * 0.8 + 85, H * 0.85 + 85) < 85) {
      state = "title";
      stopMusic();
      return;
    }
    // retry: image(retry, W*0.7, H*0.851, 150, 150) 円判定
    if (dist(p.x, p.y, W * 0.7 + 75, H * 0.851 + 75) < 75) {
      startGame();
      return;
    }
  }
});

canvas.addEventListener("wheel", e => {
  if (state !== "select") return;
  e.preventDefault();
  const step = e.deltaY > 0 ? 1 : -1;
  let idx = selectedIndex + step;
  if (idx < 0) idx = SONGS.length - 1;
  if (idx >= SONGS.length) idx = 0;
  changeSelection(idx);
}, { passive: false });

function changeSelection(idx) {
  if (idx === selectedIndex) return;
  selectedIndex = idx;
  playPreview(idx);
}

window.addEventListener("keydown", e => {
  ensureAudioContext();

  if (state === "play") {
    // タイミング補正の調整（押しっぱなし可）
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const step = (e.shiftKey ? 0.1 : 0.01) * (e.key === "ArrowRight" ? 1 : -1);
      setOffset(noteOffset + step);
      candIdx = -1;
      return;
    }
    if (e.repeat) return;
    if (e.key === "Escape") { quitToSelect(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const cands = SONGS[selectedIndex].candidates;
      candIdx = (candIdx + 1) % cands.length;
      setOffset(cands[candIdx]);
      return;
    }
    if (e.key === "0") { setOffset(0); candIdx = -1; return; }
    if (e.key.toLowerCase() === "a") {
      autoplay = !autoplay;
      if (autoplay) autoplayUsed = true;
      return;
    }
    const lane = KEY_TO_LANE[e.key.toLowerCase()];
    if (lane !== undefined) {
      laneFlash[lane] = 0.15;
      playTap(lane);
      checkHit(lane);
    }
    return;
  }

  if (e.repeat) return;
  if (state === "select") {
    if (e.key === "Enter") { startGame(); return; }
    if (e.key === "ArrowUp") { changeSelection((selectedIndex + SONGS.length - 1) % SONGS.length); return; }
    if (e.key === "ArrowDown") { changeSelection((selectedIndex + 1) % SONGS.length); return; }
    if (e.key.toLowerCase() === "s") { setInstrument(instrumentIdx + 1); return; }
  } else if (state === "result") {
    if (e.key === "Enter") { startGame(); return; }
    if (e.key === "Escape") { state = "title"; return; }
  } else if (state === "title") {
    if (e.key === "Enter") { gotoSelect(); return; }
  }
});

// =====================================================================
// ゲームロジック
// =====================================================================
function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// 経過時間（秒）
function gameTime() {
  return (performance.now() - gameStartTime) / 1000;
}

// 音楽基準の現在時刻（秒）。再生開始前は負の値（-MUSIC_DELAY から増加）。
// 再生中は audio.currentTime に同期させることで、再生開始の遅延や
// タイマーとのドリフトによるズレをなくす。ジッタ対策に軽く平滑化する。
function musicTimeNow() {
  const nowS = performance.now() / 1000;
  if (musicStarted && currentMusic) {
    if (!currentMusic.paused && currentMusic.currentTime > 0) {
      const anchor = nowS - currentMusic.currentTime;
      if (clockAnchor === null) clockAnchor = anchor;
      else clockAnchor += (anchor - clockAnchor) * 0.08;
    }
    if (clockAnchor !== null) return nowS - clockAnchor;
  }
  return gameTime() - MUSIC_DELAY;
}

// ----- タイミング補正の保存・読み出し -----
function offsetKey(i) {
  return "noteOffset_" + i;
}

function getOffsetFor(i) {
  const saved = localStorage.getItem(offsetKey(i));
  const v = saved !== null ? parseFloat(saved) : SONGS[i].offset;
  return isNaN(v) ? 0 : v;
}

function setOffset(v) {
  noteOffset = Math.round(v * 1000) / 1000;
  localStorage.setItem(offsetKey(selectedIndex), String(noteOffset));
  offsetFlash = 1.0;
}

// ----- 3Dレーンの座標変換 -----
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 判定時刻までの時間差（負=接近中、0=ジャスト、正=通過後）
function noteDt(note, mt) {
  return mt - (note.time + noteOffset);
}

// 進行度p（0=奥端、1=判定ライン）→ 描画補間係数g。
// 遠くはゆっくり・手前ほど速く見える遠近感のある変換（射影変換）。
function persp(p) {
  return p / (p + PERSPECTIVE_K * (1 - p));
}

function laneCenterX(lane, g) {
  return W / 2 + (lane - (LANE_COUNT - 1) / 2) * lerp(FAR_LANE_W, NEAR_LANE_W, g);
}

function laneEdgeX(edge, g) {
  return W / 2 + (edge - LANE_COUNT / 2) * lerp(FAR_LANE_W, NEAR_LANE_W, g);
}

function highwayY(g) {
  return lerp(HORIZON_Y, JUDGE_Y, g);
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

// "#rrggbb" + alpha → "rgba(...)"
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ヒット処理（キー判定・オートプレイ共通）
function hitNote(note) {
  note.judged = true;
  note.hit = true;
  totalScore++;
  combo++;
  if (combo > maxCombo) maxCombo = combo;
  comboPop = 0.18;
  laneFlash[note.lane] = Math.max(laneFlash[note.lane], 0.15);
  hitPopups.push({ lane: note.lane, t: 0.45, type: "hit" });
}

// 当たり判定（時間幅は旧版の x∈[0,130) と同じ）
function checkHit(lane) {
  const mt = musicTimeNow();
  for (const note of notes) {
    if (note.lane !== lane || note.judged) continue;
    const dt = noteDt(note, mt);
    if (dt >= -HIT_EARLY && dt <= HIT_LATE) {
      hitNote(note);
      break;
    }
  }
}

function updatePlay(dt) {
  const t = gameTime();
  const mt = musicTimeNow();

  // 音楽の再生を遅らせる（delayTime 相当）
  if (!musicStarted && t >= MUSIC_DELAY) {
    musicStarted = true;
    const audio = getMusic(selectedIndex);
    currentMusic = audio;
    audio.currentTime = 0;
    audio.onended = () => { if (state === "play") endGame(); };
    audio.play().catch(() => {});
  }

  // オートプレイ: 判定ラインを通過する瞬間に自動ヒット。
  // ドラム音が曲のビートに乗って聞こえれば補正が合っている。
  if (autoplay) {
    for (const note of notes) {
      if (note.judged) continue;
      const d = noteDt(note, mt);
      if (d >= 0 && d <= MISS_AT) {
        hitNote(note);
        playTap(note.lane);
      }
    }
  }

  // 判定ウィンドウを過ぎたノーツはミス確定（コンボが切れる）
  for (const note of notes) {
    if (!note.judged && noteDt(note, mt) > MISS_AT) {
      note.judged = true;
      combo = 0;
      hitPopups.push({ lane: note.lane, t: 0.45, type: "miss" });
    }
  }

  // エフェクトの時間経過
  for (let i = 0; i < LANE_COUNT; i++) {
    laneFlash[i] = Math.max(0, laneFlash[i] - dt);
  }
  hitPopups = hitPopups.filter(p => (p.t -= dt) > 0);
  offsetFlash = Math.max(0, offsetFlash - dt);
  comboPop = Math.max(0, comboPop - dt);
}

// スコア計算（Processing版: int notes = MaxScore / lines.length）
function finalScore() {
  const perNote = Math.floor(MAX_SCORE / notes.length);
  return totalScore * perNote;
}

// =====================================================================
// 描画
// =====================================================================
function setFont(px, bold) {
  ctx.font = (bold ? "bold " : "") + px + "px Meiryo, 'Hiragino Sans', sans-serif";
}

function drawLoading() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  setFont(40);
  ctx.textAlign = "center";
  ctx.fillText("Loading... " + Math.round(loadProgress * 100) + "%", W / 2, H / 2);
  ctx.fillStyle = "#444";
  ctx.fillRect(W / 2 - 300, H / 2 + 40, 600, 16);
  ctx.fillStyle = "#fff";
  ctx.fillRect(W / 2 - 300, H / 2 + 40, 600 * loadProgress, 16);
  ctx.textAlign = "left";
}

function drawTitle() {
  ctx.drawImage(images["title.png"], 0, 0, W, H);
  ctx.drawImage(images["start.png"], W / 2 - 150, H / 2 + 250, 300, 100);
  ctx.fillStyle = "#fff";
  setFont(24);
  ctx.textAlign = "center";
  ctx.fillText("クリック or ENTER でスタート", W / 2, H / 2 + 400);
  ctx.textAlign = "left";
}

function drawSelect() {
  ctx.drawImage(images["title.png"], 0, 0, W, H);
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fff";
  setFont(63);
  ctx.fillText("曲を選択してください", W * 0.04, H * 0.15);

  // タップ音の楽器セレクター（◀▶クリック / Sキーで切替）
  ctx.fillStyle = "#ccc";
  setFont(24);
  ctx.fillText("タップ音：", W * 0.6, 152);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  setFont(28, true);
  ctx.fillText("◀", 900, 152);
  ctx.fillText("▶", 1220, 152);
  setFont(24, true);
  ctx.fillText(INSTRUMENTS[instrumentIdx].name, 1060, 152);
  ctx.textAlign = "left";

  // 選択肢（selectedIndex を中心に前後2曲ずつ表示）
  for (let i = -2; i <= 2; i++) {
    const idx = selectedIndex + i;
    if (idx < 0 || idx >= SONGS.length) continue;
    ctx.fillStyle = (i === 0) ? "rgb(250,250,250)" : "rgb(150,150,150)";
    setFont(63);
    ctx.fillText(SONGS[idx].title, W * 0.6, H * 0.6 + i * 110);
  }

  // 選択中の曲のジャケット画像
  ctx.drawImage(images[SONGS[selectedIndex].back], 30, 270, 700, 600);

  // 現在のタイミング補正値
  {
    const off = getOffsetFor(selectedIndex);
    const ms = (off >= 0 ? "+" : "") + Math.round(off * 1000);
    ctx.fillStyle = "#aaa";
    setFont(22);
    ctx.fillText(`タイミング補正: ${ms}ms（プレイ中に ←→ / Tab で調整できます）`, 30, 255);
  }

  // LYRICSボタン（ホバーで歌詞表示）
  ctx.drawImage(images["LYRICS.png"], W * 0.9, H * 0.85, 120, 120);
  const lyricHover = dist(mouse.x, mouse.y, W * 0.9 + 60, H * 0.85 + 60) < 60;
  if (lyricHover) drawLyrics();

  // 操作ガイド
  ctx.fillStyle = "#ccc";
  setFont(24);
  ctx.fillText("ホイール / ↑↓ で選曲、ENTER または曲名クリックで開始 ／ S: タップ音変更", W * 0.04, H * 0.95);
}

function drawLyrics() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(30, 270, 700, 600);
  const lines = lyrics[selectedIndex];
  ctx.fillStyle = "rgb(230,230,230)";
  setFont(21);
  const half = Math.floor(lines.length / 2);
  for (let i = 0; i < lines.length; i++) {
    if (i < half) {
      ctx.fillText(lines[i], 40, 300 + 30 * i);
    } else {
      ctx.fillText(lines[i], 400, 300 + 30 * (i - half));
    }
  }
}

function drawPlay() {
  const mt = musicTimeNow();

  // 背景: 曲のジャケットを暗くして表示
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const back = images[SONGS[selectedIndex].back];
  ctx.globalAlpha = 0.35;
  ctx.drawImage(back, 0, 0, W, H);
  ctx.globalAlpha = 1;

  drawHighway();
  drawLaneBeams();
  drawJudgeLine();
  drawNotes(mt);
  drawHitEffects();
  drawPlayHUD();
}

// レーン面（奥に向かって狭まる台形）と境界線
function drawHighway() {
  ctx.fillStyle = "rgba(0, 0, 12, 0.6)";
  ctx.beginPath();
  ctx.moveTo(laneEdgeX(0, 0), HORIZON_Y);
  ctx.lineTo(laneEdgeX(LANE_COUNT, 0), HORIZON_Y);
  ctx.lineTo(laneEdgeX(LANE_COUNT, G_BOTTOM), H);
  ctx.lineTo(laneEdgeX(0, G_BOTTOM), H);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i <= LANE_COUNT; i++) {
    const outer = (i === 0 || i === LANE_COUNT);
    ctx.strokeStyle = outer ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = outer ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(laneEdgeX(i, 0), HORIZON_Y);
    ctx.lineTo(laneEdgeX(i, G_BOTTOM), H);
    ctx.stroke();
  }

  // 奥端のライン
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(laneEdgeX(0, 0), HORIZON_Y);
  ctx.lineTo(laneEdgeX(LANE_COUNT, 0), HORIZON_Y);
  ctx.stroke();
}

// キー押下時にレーンを奥に向かって光らせるビーム
function drawLaneBeams() {
  for (let i = 0; i < LANE_COUNT; i++) {
    if (laneFlash[i] <= 0) continue;
    const a = laneFlash[i] / 0.15;
    const grad = ctx.createLinearGradient(0, JUDGE_Y, 0, HORIZON_Y);
    grad.addColorStop(0, hexA(LANE_COLORS[i], 0.45 * a));
    grad.addColorStop(1, hexA(LANE_COLORS[i], 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(laneEdgeX(i, 1), JUDGE_Y);
    ctx.lineTo(laneEdgeX(i + 1, 1), JUDGE_Y);
    ctx.lineTo(laneEdgeX(i + 1, 0), HORIZON_Y);
    ctx.lineTo(laneEdgeX(i, 0), HORIZON_Y);
    ctx.closePath();
    ctx.fill();
  }
}

// 判定ラインと各レーンの受け皿・キー表示
function drawJudgeLine() {
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(laneEdgeX(0, 1), JUDGE_Y);
  ctx.lineTo(laneEdgeX(LANE_COUNT, 1), JUDGE_Y);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  for (let i = 0; i < LANE_COUNT; i++) {
    const cx = laneCenterX(i, 1);
    const w = NEAR_LANE_W * 0.84, h = 30;
    const flash = laneFlash[i] / 0.15;
    if (flash > 0) {
      ctx.fillStyle = hexA(LANE_COLORS[i], 0.35 * flash);
      roundRectPath(cx - w / 2, JUDGE_Y - h / 2, w, h, 10);
      ctx.fill();
    }
    ctx.strokeStyle = hexA(LANE_COLORS[i], 0.9);
    ctx.lineWidth = 3;
    roundRectPath(cx - w / 2, JUDGE_Y - h / 2, w, h, 10);
    ctx.stroke();

    ctx.fillStyle = hexA(LANE_COLORS[i], 0.85);
    setFont(24, true);
    ctx.fillText(LANE_KEY_LABEL[i], cx, JUDGE_Y + 58);
  }
  ctx.textAlign = "left";
}

// ノーツ（奥から手前へ。レーン色の光るバー）
function drawNotes(mt) {
  const visible = [];
  for (const note of notes) {
    if (note.judged) continue;
    const dt = noteDt(note, mt);
    const p = 1 + dt / APPROACH;
    if (p <= 0.02 || p >= 1.4) continue;
    visible.push({ note, p, dt });
  }
  visible.sort((a, b) => a.p - b.p); // 奥のノーツから描く

  for (const v of visible) {
    const g = persp(Math.min(v.p, 1.45));
    const laneW = lerp(FAR_LANE_W, NEAR_LANE_W, g);
    const w = laneW * 0.84;
    const h = Math.max(10, w * 0.28);
    const x = laneCenterX(v.note.lane, g);
    const y = highwayY(g);
    const col = LANE_COLORS[v.note.lane];

    ctx.save();
    // 判定ラインを過ぎたら徐々にフェード
    ctx.globalAlpha = v.dt > 0 ? Math.max(0, 1 - v.dt / MISS_AT) : 1;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20 * g;
    ctx.fillStyle = col;
    roundRectPath(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    roundRectPath(x - w * 0.38, y - h * 0.22, w * 0.76, h * 0.44, h * 0.22);
    ctx.fill();
    ctx.restore();
  }
}

// ヒットリング・HIT!/MISS表示
function drawHitEffects() {
  ctx.textAlign = "center";
  for (const p of hitPopups) {
    const cx = laneCenterX(p.lane, 1);
    const prog = 1 - p.t / 0.45; // 0→1
    if (p.type === "hit") {
      ctx.strokeStyle = hexA(LANE_COLORS[p.lane], (1 - prog) * 0.9);
      ctx.lineWidth = 1 + 4 * (1 - prog);
      ctx.beginPath();
      ctx.arc(cx, JUDGE_Y, 18 + prog * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,220,60,${1 - prog})`;
      setFont(30, true);
      ctx.fillText("HIT!", cx, JUDGE_Y - 55 - prog * 30);
    } else {
      ctx.fillStyle = `rgba(170,170,170,${1 - prog})`;
      setFont(26, true);
      ctx.fillText("MISS", cx, JUDGE_Y - 55 - prog * 12);
    }
  }
  ctx.textAlign = "left";
}

// スコア・コンボなどのHUD
function drawPlayHUD() {
  // 曲名（左上）
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  setFont(26);
  ctx.fillText("♪ " + SONGS[selectedIndex].title, 30, 48);

  // スコア（右上）
  const perNote = Math.floor(MAX_SCORE / notes.length);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  setFont(20, true);
  ctx.fillText("SCORE", W - 40, 42);
  ctx.fillStyle = "#fff";
  setFont(54, true);
  ctx.fillText(String(totalScore * perNote), W - 40, 96);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  setFont(20);
  ctx.fillText(`HIT ${totalScore} / ${notes.length}`, W - 40, 126);
  ctx.textAlign = "left";

  // コンボ（レーン中央の奥寄り）
  if (combo >= 2) {
    const scale = 1 + comboPop * 2.2;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,215,80,0.95)";
    setFont(Math.round(64 * scale), true);
    ctx.fillText(String(combo), W / 2, 480);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    setFont(22, true);
    ctx.fillText("COMBO", W / 2, 514);
    ctx.textAlign = "left";
  }

  // オートプレイ表示（上部中央）
  if (autoplay) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd400";
    setFont(24, true);
    ctx.fillText("AUTOPLAY中：ドラム音が曲のリズムに合っていれば補正OK", W / 2, 46);
    ctx.textAlign = "left";
  }

  // タイミング補正（左下）
  const cands = SONGS[selectedIndex].candidates;
  const candInfo = candIdx >= 0 ? `候補${candIdx + 1}/${cands.length}` : "手動";
  const ms = (noteOffset >= 0 ? "+" : "") + Math.round(noteOffset * 1000);
  ctx.fillStyle = offsetFlash > 0 ? "#ffd400" : "rgba(255,255,255,0.45)";
  setFont(18);
  ctx.fillText(`タイミング補正: ${ms}ms (${candInfo})   ←→:±10ms  Shift+←→:±100ms  Tab:候補切替  A:オートプレイ  0:補正なし`, 20, H - 18);

  // ESCヒント（右下）
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  setFont(18);
  ctx.fillText("ESC: 選曲に戻る", W - 20, H - 18);
  ctx.textAlign = "left";

  // 音楽開始前
  if (!musicStarted) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    setFont(60, true);
    ctx.fillText("READY...", W / 2, 540);
    ctx.textAlign = "left";
  }
}

function drawResult() {
  ctx.drawImage(images["title.png"], 0, 0, W, H);
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  ctx.fillRect(0, 0, W, H);

  const score = finalScore();

  ctx.fillStyle = "#fff";
  setFont(108);
  ctx.fillText("Score:     " + score + " points", W * 0.04, H * 0.1);

  // 作曲者クレジット（Processing版と同じ分岐）
  let producer;
  if (selectedIndex > 5 && selectedIndex < 8) {
    producer = "おのおの=おのえ";
  } else if (selectedIndex >= 8 && selectedIndex < 10) {
    producer = "ひずひず=ひずみ(32)";
  } else {
    producer = "レオン";
  }

  // あおり文（Processing版の分岐の隙間を埋めて連続に）
  let maincomment, subcomment;
  if (score < 250) {
    maincomment = "Keep trying.";
    subcomment = "Even a broken clock is right twice daily.";
  } else if (score < 500) {
    maincomment = "Not bad.";
    subcomment = "Practice makes... well, less terrible.";
  } else if (score < 750) {
    maincomment = "Good effort.";
    subcomment = "You almost didn't embarrass yourself.";
  } else {
    maincomment = "Perfect.";
    subcomment = "Did you pay off the judges?";
  }

  setFont(60);
  ctx.fillText(SONGS[selectedIndex].title, W * 0.04, H * 0.2);
  setFont(30);
  ctx.fillText("lyric.  " + producer + ", ChatGPT  feat. Suno", W * 0.08, H * 0.26);
  ctx.drawImage(images[SONGS[selectedIndex].back], 30, 270, 700, 600);

  setFont(30);
  ctx.fillText("Judge's comment...", 750, 290);
  setFont(60);
  ctx.fillText(maincomment, 750, 340);
  setFont(30);
  if (ctx.measureText(subcomment).width > W - 760) setFont(24);
  ctx.fillText(subcomment, 750, 390);

  setFont(40);
  ctx.fillText("Hit：" + totalScore, W * 0.6, H * 0.6);
  ctx.fillText("Lost：" + (notes.length - totalScore), W * 0.6, H * 0.7);
  ctx.fillText("Max Combo：" + maxCombo, W * 0.6, H * 0.78);

  if (autoplayUsed) {
    ctx.fillStyle = "#ffd400";
    setFont(30);
    ctx.fillText("※ AUTOPLAY使用", W * 0.6, H * 0.53);
    ctx.fillStyle = "#fff";
  }

  ctx.drawImage(images["retry.png"], W * 0.7, H * 0.851, 150, 150);
  ctx.drawImage(images["exit.png"], W * 0.8, H * 0.85, 170, 170);

  ctx.fillStyle = "#ccc";
  setFont(22);
  ctx.fillText("ENTER: リトライ / ESC: タイトルへ", W * 0.04, H * 0.95);
}

// =====================================================================
// メインループ
// =====================================================================
let lastFrame = performance.now();

function loop(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;

  if (state === "play") updatePlay(dt);

  switch (state) {
    case "loading": drawLoading(); break;
    case "title":   drawTitle(); break;
    case "select":  drawSelect(); break;
    case "play":    drawPlay(); break;
    case "result":  drawResult(); break;
  }

  // カーソル形状（クリックできる場所で pointer）
  canvas.style.cursor = clickableAt(mouse) ? "pointer" : "default";

  requestAnimationFrame(loop);
}

function clickableAt(p) {
  if (state === "title") {
    return p.x > W / 2 - 150 && p.x < W / 2 + 150 && p.y > H / 2 + 250 && p.y < H / 2 + 350;
  }
  if (state === "select") {
    if (p.y > 122 && p.y < 168 && p.x > 875 && p.x < 1245) return true;
    for (let i = -2; i <= 2; i++) {
      const idx = selectedIndex + i;
      if (idx < 0 || idx >= SONGS.length) continue;
      const y = H * 0.6 + i * 110;
      if (p.x > W * 0.55 && p.x < W && p.y > y - 70 && p.y < y + 25) return true;
    }
    return false;
  }
  if (state === "result") {
    return dist(p.x, p.y, W * 0.8 + 85, H * 0.85 + 85) < 85 ||
           dist(p.x, p.y, W * 0.7 + 75, H * 0.851 + 75) < 75;
  }
  return false;
}

// デバッグ・テスト用フック
window.__game = {
  get state() { return state; },
  get selectedIndex() { return selectedIndex; },
  get totalScore() { return totalScore; },
  get noteOffset() { return noteOffset; },
  get autoplay() { return autoplay; },
  set autoplay(v) { autoplay = v; if (v) autoplayUsed = true; },
  get musicTime() { return musicTimeNow(); },
  get instrument() { return INSTRUMENTS[instrumentIdx].id; },
  setInstrument,
  playTap,
  setOffset,
  gotoSelect, startGame, endGame,
  select(i) { changeSelection(i); },
};

loadAssets().catch(err => {
  state = "error";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f66";
  setFont(30);
  ctx.fillText("読み込みエラー: " + err.message, 40, H / 2);
  console.error(err);
});

requestAnimationFrame(loop);
