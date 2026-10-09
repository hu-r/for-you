const root = document.documentElement;
const body = document.body;
const light = document.getElementById("light");
const quench = document.getElementById("quench");
const bridge = document.getElementById("bridge");
const stage = document.getElementById("stage");
const stageInner = document.getElementById("stage-inner");
const cluster = document.getElementById("cluster");
const pageCopy = document.getElementById("page-copy");
const reelMark = document.getElementById("reel-mark");
const skipHint = document.getElementById("skip-hint");
const GROUP_LIMIT = 1;
const pageHint = "左边上一页 · 右边下一页";
const finale = document.getElementById("finale");
const wall = document.getElementById("wall");
const count = document.getElementById("count");
const fireworks = document.getElementById("fireworks");
const paint = fireworks.getContext("2d");

let pages = [
  blankPage([""]),
  blankPage(["shot-b", "shot-c"]),
  blankPage(["shot-d"]),
  blankPage(["", "shot-b", "shot-c"]),
  blankPage(["shot-d", ""]),
  blankPage(["shot-c"]),
];

function blankPage(tones) {
  return {
    date: "",
    place: "",
    text: "",
    photos: tones.map((tone) => ({ src: "", tone, text: "" })),
  };
}

const layout = [
  { left: "5%", top: "6%", rotate: -8, scale: 0.96 },
  { left: "22%", top: "3%", rotate: 5, scale: 1.04 },
  { left: "42%", top: "8%", rotate: -3, scale: 0.9 },
  { left: "63%", top: "4%", rotate: 7, scale: 1 },
  { left: "78%", top: "16%", rotate: -6, scale: 0.92 },
  { left: "3%", top: "40%", rotate: 6, scale: 0.88 },
  { left: "70%", top: "38%", rotate: 4, scale: 1.06 },
  { left: "80%", top: "58%", rotate: -7, scale: 0.9 },
  { left: "6%", top: "66%", rotate: -4, scale: 0.94 },
  { left: "62%", top: "68%", rotate: 8, scale: 0.98 },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function settlePages(list) {
  list.forEach((page) => {
    if (!Array.isArray(page.photos) || !page.photos.length) page.photos = [{ src: "", tone: "", text: "" }];
    if (typeof page.text !== "string") page.text = "";
    page.photos.forEach((photo) => {
      if (typeof photo.text !== "string") photo.text = "";
    });
  });
}

function copyHtml(text) {
  const line = String(text || "").trim();
  if (!line) return "";
  return escapeHtml(line).replace(/\n/g, "<br />");
}

function scatter(index, total) {
  const two = total > 12;
  const ring = two && index % 2 ? 0.68 : 1;
  const perRing = two ? Math.ceil(total / 2) : total;
  const slot = two ? Math.floor(index / 2) : index;
  const angle = -Math.PI / 2 + (Math.PI * 2 * slot) / Math.max(perRing, 1) + (ring < 1 ? 0.2 : 0);
  const reach = (total > 20 ? 40 : 34) * ring;
  return {
    left: `${Math.min(80, Math.max(2, 50 + Math.cos(angle) * reach - 6))}%`,
    top: `${Math.min(74, Math.max(2, 46 + Math.sin(angle) * reach * 0.86 - 4))}%`,
    rotate: (index % 2 === 0 ? -1 : 1) * (4 + (index % 5) * 2),
    scale: total > 20 ? 0.68 : total > 12 ? 0.78 : 0.9,
  };
}

function placeFor(index, total) {
  if (total === layout.length) return layout[index];
  return scatter(index, total);
}

function buildWall() {
  const photos = pages.flatMap((page) => page.photos);
  wall.replaceChildren();
  photos.forEach((photo, index) => {
    const print = document.createElement("figure");
    const place = placeFor(index, photos.length);
    print.className = "print";
    print.style.left = place.left;
    print.style.top = place.top;
    print.style.setProperty("--i", String(index));
    print.style.transform = `rotate(${place.rotate}deg) scale(${place.scale})`;
    if (photos.length > 20) print.style.width = "min(108px, 18vw)";
    else if (photos.length > 12) print.style.width = "min(128px, 22vw)";
    if (photo.src) {
      print.innerHTML = `<span class="sheet has-photo"><img src="${escapeHtml(photo.src)}" alt="" /></span>`;
      bindOrientation(print.querySelector("img"), print);
    } else {
      print.innerHTML = `<span class="sheet ${photo.tone || ""}"><em>照片</em></span>`;
    }
    wall.appendChild(print);
  });
}

buildWall();

let lit = false;
let out = false;
let showing = false;
let scene = "gate";
let wishArmed = false;
let move = null;
let jumpTo = null;
let cursor = 0;
let skipWait = null;
let blowTimer = 0;

const WISH_MS = 15000;
const beds = {
  night: {
    step: 0.26,
    voice: 0.13,
    strum: 0.045,
    chordEvery: 8,
    scale: [523.25, 587.33, 659.25, 698.46, 783.99, 880, 1046.5],
    melody: [
      [0, 2], [2, 2], [4, 1], [5, 1], [4, 2],
      [5, 2], [4, 1], [3, 1], [2, 2], [0, 2],
      [1, 2], [2, 2], [4, 1], [5, 1], [4, 2],
      [2, 2], [4, 1], [2, 1], [1, 2], [0, 2],
    ],
    chords: [
      [261.63, 329.63, 392],
      [349.23, 440, 523.25],
      [392, 493.88, 587.33],
      [261.63, 329.63, 523.25],
    ],
  },
  warm: {
    step: 0.23,
    voice: 0.11,
    strum: 0.038,
    chordEvery: 8,
    scale: [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99],
    melody: [
      [0, 1], [2, 1], [4, 2], [5, 1], [4, 1], [2, 2],
      [3, 2], [4, 1], [5, 1], [4, 2], [2, 2],
      [4, 1], [5, 1], [6, 2], [5, 1], [4, 1], [2, 2],
      [2, 1], [4, 1], [5, 2], [4, 1], [2, 1], [0, 2],
    ],
    chords: [
      [293.66, 392, 493.88],
      [329.63, 392, 523.25],
      [293.66, 369.99, 440],
      [392, 493.88, 587.33],
    ],
  },
  hush: {
    step: 0.32,
    voice: 0.1,
    strum: 0.032,
    chordEvery: 8,
    scale: [523.25, 587.33, 659.25, 698.46, 783.99, 880, 1046.5],
    melody: [
      [2, 2], [4, 2], [5, 2], [4, 2],
      [2, 2], [1, 1], [2, 1], [4, 2], [2, 2],
      [3, 2], [5, 2], [4, 1], [3, 1], [2, 2],
      [1, 2], [2, 2], [4, 1], [2, 1], [0, 2],
    ],
    chords: [
      [261.63, 329.63, 392],
      [349.23, 440, 523.25],
      [392, 493.88, 587.33],
      [261.63, 329.63, 523.25],
    ],
  },
};
let script = {
  opening: "哥哥\n陪你过生日\n点个蜡烛吧",
  bridge: "感谢你\n陪我走过一天又一天\n这些天见证你的成长\n也见证我的成长",
  wish: "生日快乐 许个愿吧",
  pace: 1,
  blow: "吹蜡烛",
  blessing: "哥哥\n生日快乐\n愿你快乐",
  music: "night",
  musicSrc: "",
  musicName: "",
};
let audioCtx = null;
let master = null;
let filter = null;
let musicOn = false;
let nextBell = 0;
let activeBed = beds.night;
let bedNodes = [];
let bedTimer = 0;
let song = null;
let previewAudio = null;
let previewTimer = 0;

function linesOf(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function applyScript() {
  const opening = document.querySelector(".opening");
  const bridgeLine = document.querySelector("#bridge p");
  const wish = document.querySelector(".wish");
  const blow = document.getElementById("blow-cue");
  const blessing = document.querySelector(".blessing");
  const openingLines = linesOf(script.opening);
  const blessingLines = linesOf(script.blessing);
  opening.innerHTML = (openingLines.length ? openingLines : [""])
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");
  bridgeLine.innerHTML = escapeHtml(script.bridge || "").replace(/\n/g, "<br />");
  wish.innerHTML = escapeHtml(script.wish || "").replace(/\n/g, "<br />");
  blow.textContent = script.blow || "";
  blessing.innerHTML = (blessingLines.length ? blessingLines : [""])
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");
}

function unlockAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
    master = audioCtx.createGain();
    master.gain.value = 0;
    filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.5;
    filter.connect(master);
    master.connect(audioCtx.destination);
  }
  audioCtx.resume();
}

function trackNote(node) {
  bedNodes.push(node);
  node.onended = () => {
    const index = bedNodes.indexOf(node);
    if (index >= 0) bedNodes.splice(index, 1);
  };
}

function pluck(freq, time, amount) {
  [
    [1, 1, 0.95],
    [2, 0.05, 0.55],
  ].forEach(([ratio, level, decay]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const peak = amount * level;
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.5), time + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(time);
    osc.stop(time + decay + 0.04);
    trackNote(osc);
  });
}

function scheduleBells() {
  if (!audioCtx || !musicOn) return;
  const bed = activeBed;
  const now = audioCtx.currentTime;
  if (nextBell < now + 0.05) nextBell = now + 0.06;
  let eighth = 0;
  const every = bed.chordEvery;
  bed.melody.forEach(([degree, beats]) => {
    const time = nextBell;
    pluck(bed.scale[degree], time, bed.voice);
    if (eighth % every === 0) {
      const [root, high, mid] = bed.chords[(eighth / every) % bed.chords.length];
      pluck(root, time, bed.strum);
      pluck(high, time + bed.step * 4, bed.strum * 0.85);
      pluck(mid, time + bed.step * 4, bed.strum * 0.7);
    }
    nextBell += beats * bed.step;
    eighth += beats;
  });
  const wait = (nextBell - audioCtx.currentTime - 1.4) * 1000;
  bedTimer = window.setTimeout(scheduleBells, Math.max(240, wait));
}

function stopBed() {
  window.clearTimeout(bedTimer);
  const nodes = bedNodes;
  bedNodes = [];
  if (audioCtx) {
    const now = audioCtx.currentTime;
    nodes.forEach((node) => {
      try {
        node.stop(now + 0.04);
      } catch {
        /* 已经停了 */
      }
    });
  }
  musicOn = false;
  nextBell = 0;
}

function rampVolume(audio, target, ms) {
  const from = audio.volume;
  const started = performance.now();
  const tick = (now) => {
    if (song !== audio) return;
    const amount = Math.min(1, (now - started) / ms);
    audio.volume = from + (target - from) * amount;
    if (amount < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function prepareSong() {
  if (script.music !== "file" || !script.musicSrc || song) return;
  song = new Audio(script.musicSrc);
  song.loop = true;
  song.volume = 0;
  const pending = song.play();
  if (pending) pending.catch(() => {});
}

let previewing = false;

function stopPreview() {
  window.clearTimeout(previewTimer);
  if (previewAudio) {
    previewAudio.pause();
    previewAudio = null;
  }
  if (previewing) {
    previewing = false;
    stopBed();
  }
}

function startMusic() {
  if (musicOn) return;
  if (script.music === "off") return;
  if (script.music === "file" && script.musicSrc) {
    if (!song) prepareSong();
    if (!song) return;
    musicOn = true;
    rampVolume(song, 0.5, 1800);
    return;
  }
  unlockAudio();
  if (!audioCtx) return;
  musicOn = true;
  audioCtx.resume();
  activeBed = beds[script.music] || beds.night;
  const now = audioCtx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.5, now + 0.45);
  scheduleBells();
}

function swellMusic() {
  if (song && script.music === "file") {
    rampVolume(song, 0.68, 900);
    return;
  }
  if (!audioCtx || !master || !filter) return;
  const now = audioCtx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.linearRampToValueAtTime(0.55, now + 0.9);
  filter.frequency.cancelScheduledValues(now);
  filter.frequency.linearRampToValueAtTime(3200, now + 1.4);
}

function bindHold(button, { duration, onDone, blows }) {
  let holding = false;
  let value = 0;
  let last = 0;
  let frame = 0;

  const blocked = () => out || (button === light && lit) || (button === quench && !lit);

  const loop = (now) => {
    if (out) return;
    const dt = last ? Math.min(now - last, 40) : 16;
    last = now;
    value = holding ? Math.min(1, value + dt / duration) : Math.max(0, value - dt / 320);
    if (blows) button.style.setProperty("--blow", value.toFixed(3));
    else {
      button.style.setProperty("--heat", value.toFixed(3));
      root.style.setProperty("--heat", lit ? "1" : value.toFixed(3));
    }
    button.classList.toggle("is-blowing", holding && !!blows);
    if (value >= 1) {
      holding = false;
      button.classList.remove("is-blowing");
      onDone();
      return;
    }
    if (holding || value > 0) frame = requestAnimationFrame(loop);
    else last = 0;
  };

  const begin = () => {
    if (button === light) {
      unlockAudio();
      prepareSong();
    }
    if (button === quench && body.classList.contains("is-blow-cue")) armMic();
    holding = true;
    last = 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  };

  const stop = () => {
    holding = false;
  };

  let touchHeld = false;
  button.addEventListener("touchstart", (event) => {
    if (blocked()) return;
    event.preventDefault();
    touchHeld = true;
    begin();
  }, { passive: false });
  button.addEventListener("touchend", () => {
    touchHeld = false;
    stop();
  });
  button.addEventListener("touchcancel", () => {
    touchHeld = false;
    stop();
  });
  button.addEventListener("pointerdown", (event) => {
    if (blocked()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    try {
      button.setPointerCapture?.(event.pointerId);
    } catch {
      /* 按住仍然继续 */
    }
    begin();
  });
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", () => {
    if (touchHeld) return;
    stop();
  });
  button.addEventListener("selectstart", (event) => event.preventDefault());
  button.addEventListener("keydown", (event) => {
    if (event.repeat || blocked()) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    begin();
  });
  button.addEventListener("keyup", (event) => {
    if (event.key === "Enter" || event.key === " ") stop();
  });
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

async function catchFlame() {
  if (lit) return;
  lit = true;
  light.classList.add("lit");
  light.style.setProperty("--heat", "1");
  root.style.setProperty("--heat", "1");
  light.setAttribute("aria-label", "已经点着了");
  body.classList.add("is-lit");
  stopPreview();
  startMusic();
  await ready;
  play();
}

let pacedWait = null;

function hold(ms, paced = false) {
  return new Promise((resolve) => {
    const started = performance.now();
    const origin = paced ? paceFactor() : 1;
    let timer = 0;
    let settled = false;
    const finish = (skipped) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (pacedWait === api) pacedWait = null;
      if (skipWait === skip) skipWait = null;
      resolve(skipped);
    };
    const skip = () => finish(true);
    const api = {
      retune() {
        if (!paced || settled) return;
        const elapsed = performance.now() - started;
        const progress = ms > 0 ? Math.min(1, elapsed / ms) : 1;
        const remain = ms * (paceFactor() / origin) * (1 - progress);
        window.clearTimeout(timer);
        if (remain <= 20) {
          finish(false);
          return;
        }
        timer = window.setTimeout(() => finish(false), remain);
      },
    };
    timer = window.setTimeout(() => finish(false), ms);
    skipWait = skip;
    if (paced) pacedWait = api;
  });
}

function bindOrientation(img, box) {
  const apply = () => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const wide = ratio > 1;
    const target = wide ? 4 / 3 : 3 / 4;
    img.classList.toggle("is-mat", Math.abs(ratio / target - 1) > 0.12);
    box.classList.toggle("is-wide", wide);
    box.classList.toggle("is-tall", !wide);
    const shot = img.closest(".shot");
    shot?.classList.toggle("is-wide", wide);
    shot?.classList.toggle("is-tall", !wide);
    const inner = img.closest(".stage-inner");
    if (!inner) return;
    if (inner.closest(".stage")?.classList.contains("is-reel")) {
      inner.classList.remove("has-wide", "tall-row");
      return;
    }
    const frames = [...inner.querySelectorAll(".frame")];
    inner.classList.toggle("has-wide", frames.some((frame) => frame.classList.contains("is-wide")));
    inner.classList.toggle("tall-row", frames.filter((frame) => frame.classList.contains("is-tall")).length >= 2);
  };
  if (img.complete) apply();
  else img.addEventListener("load", apply, { once: true });
}

function frameHtml(photo) {
  const tone = photo.src ? "has-photo" : photo.tone || "";
  const image = photo.src ? `<img src="${escapeHtml(photo.src)}" alt="" />` : "";
  const line = copyHtml(photo.text);
  const words = line ? `<figcaption class="copy">${line}</figcaption>` : "";
  return `<figure class="frame"><div class="shot ${tone}">${image}<span class="label">照片位</span><span class="wash"></span></div>${words}</figure>`;
}

function showSlide(page, index, slot = 0) {
  const reel = page.photos.length > GROUP_LIMIT;
  const shown = reel ? [page.photos[Math.min(slot, page.photos.length - 1)]] : page.photos;
  const kind = shown.length >= 3 ? "trio" : shown.length === 2 ? "pair" : "single";
  stageInner.className = `stage-inner ${kind}`;
  stage.classList.toggle("is-reel", reel);
  cluster.classList.remove("is-out");
  cluster.style.minHeight = "";
  cluster.innerHTML = shown.map(frameHtml).join("");
  const pageLine = copyHtml(page.text);
  pageCopy.hidden = !pageLine;
  pageCopy.innerHTML = pageLine;
  cluster.querySelectorAll(".shot.has-photo img").forEach((img) => {
    bindOrientation(img, img.closest(".frame"));
  });
  count.textContent = `${index + 1}/${pages.length}`;
  reelMark.hidden = !reel;
  if (reel) {
    const at = Math.min(slot, page.photos.length - 1);
    reelMark.textContent = `${at + 1} / ${page.photos.length}`;
    skipHint.textContent = reelHint(at, page.photos.length);
  } else {
    skipHint.textContent = pageHint;
  }
  stage.classList.remove("is-in", "has-words", "is-leaving");
}

function reelHint(slot, total) {
  const left = slot === 0 ? "左边上一页" : "左边上一张";
  const right = slot === total - 1 ? "右边下一页" : "右边下一张";
  return `${left} · ${right}`;
}

function paceFactor() {
  const value = Number(script.pace);
  if (!Number.isFinite(value)) return 1;
  return Math.min(1.5, Math.max(0.5, value));
}

function motion(ms) {
  return Math.round(ms * paceFactor());
}

function readMs(text) {
  const count = [...String(text || "").replace(/\s/g, "")].length || 4;
  const base = Math.min(5200, 2400 + Math.max(0, count - 8) * 100);
  return Math.round(base * paceFactor());
}

function paceStep(factor) {
  const value = Number(factor);
  const clamped = Number.isFinite(value) ? Math.min(1.5, Math.max(0.5, value)) : 1;
  return Math.round((1.5 - clamped) * 10);
}

function paceLabel(factor) {
  const value = Number(factor);
  const clamped = Number.isFinite(value) ? Math.min(1.5, Math.max(0.5, value)) : 1;
  const seconds = (2.4 * clamped).toFixed(1).replace(/\.0$/, "");
  return `短句大约 ${seconds} 秒，句子长会再多停一会`;
}

function showPace(factor) {
  const value = Number(factor);
  script.pace = Number.isFinite(value) ? Math.min(1.5, Math.max(0.5, Math.round(value * 10) / 10)) : 1;
  const step = String(paceStep(script.pace));
  document.querySelectorAll("#line-pace, #watch-pace").forEach((slider) => {
    slider.value = step;
  });
  const read = document.getElementById("pace-read");
  if (read) read.textContent = paceLabel(script.pace);
  root.style.setProperty("--motion", paceFactor().toFixed(2));
  pacedWait?.retune();
}

function requestJump(index) {
  if (!lit || out || !showing || body.classList.contains("is-editing")) return;
  const last = Math.max(0, pages.length - 1);
  jumpTo = Math.max(0, Math.min(last, index));
  skipWait?.();
}

function nudge(direction) {
  if (!lit || out || body.classList.contains("is-editing")) return;
  if (direction === "back" && scene === "candle") return;
  if (direction === "next" && scene === "finale") return;
  move = direction;
  skipWait?.();
}

function leaveFinale() {
  wishArmed = false;
  window.clearTimeout(blowTimer);
  body.classList.remove("is-finale", "is-blow-cue");
  finale.hidden = true;
}

async function candleBeat() {
  scene = "candle";
  skipHint.textContent = pageHint;
  showing = false;
  body.classList.remove("is-bridge", "is-show", "is-finale", "is-dim", "is-blow-cue");
  bridge.classList.remove("is-in");
  bridge.hidden = true;
  stage.hidden = true;
  stage.classList.remove("is-in", "has-words", "is-leaving");
  leaveFinale();
  move = null;
  if (await hold(2600)) return move || "next";
  return "next";
}

async function bridgeBeat() {
  scene = "bridge";
  skipHint.textContent = pageHint;
  showing = false;
  body.classList.remove("is-show", "is-finale", "is-dim", "is-blow-cue");
  body.classList.add("is-bridge");
  stage.hidden = true;
  stage.classList.remove("is-in", "has-words", "is-leaving");
  leaveFinale();
  bridge.hidden = false;
  move = null;
  if (await hold(900)) return move || "next";
  if (out) return "out";
  requestAnimationFrame(() => bridge.classList.add("is-in"));
  if (move) return move;
  if (await hold(6200)) return move || "next";
  if (out) return "out";
  bridge.classList.remove("is-in");
  if (move) return move;
  if (await hold(420)) return move || "next";
  return "next";
}

function enterFinale() {
  scene = "finale";
  skipHint.textContent = pageHint;
  showing = false;
  body.classList.remove("is-show", "is-bridge", "is-dim");
  bridge.classList.remove("is-in");
  bridge.hidden = true;
  stage.hidden = true;
  stage.classList.remove("is-in", "has-words", "is-leaving");
  finale.hidden = false;
  requestAnimationFrame(() => body.classList.add("is-finale"));
  if (!wishArmed) {
    wishArmed = true;
    window.clearTimeout(blowTimer);
    blowTimer = window.setTimeout(() => {
      if (!out && scene === "finale") body.classList.add("is-blow-cue");
    }, WISH_MS);
  }
}

async function play() {
  let phase = "candle";
  let index = 0;
  let fromEnd = false;
  while (!out) {
    if (phase === "candle") {
      const direction = await candleBeat();
      if (out) return;
      if (direction !== "back") phase = "bridge";
    } else if (phase === "bridge") {
      const direction = await bridgeBeat();
      if (out) return;
      phase = direction === "back" ? "candle" : "photos";
      if (phase === "photos") index = 0;
    } else if (phase === "photos") {
      scene = "photos";
      showing = true;
      body.classList.remove("is-bridge", "is-finale", "is-blow-cue");
      bridge.classList.remove("is-in");
      bridge.hidden = true;
      leaveFinale();
      stage.hidden = false;
      body.classList.add("is-show");
      const direction = await present(index, fromEnd);
      fromEnd = false;
      if (out) return;
      if (jumpTo != null) {
        index = jumpTo;
        jumpTo = null;
        move = null;
        continue;
      }
      if (direction === "back") {
        if (index === 0) phase = "bridge";
        else {
          index -= 1;
          fromEnd = true;
        }
      } else {
        index += 1;
        if (index >= pages.length) phase = "finale";
      }
    } else {
      enterFinale();
      move = null;
      await hold(86400000);
      if (out) return;
      if (move === "back") {
        phase = "photos";
        index = Math.max(0, pages.length - 1);
        fromEnd = true;
      }
    }
  }
}

function afterPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function present(index, fromEnd) {
  cursor = index;
  const page = pages[index];
  if (page.photos.length > GROUP_LIMIT) return presentReel(page, index, fromEnd);
  return presentGroup(page, index);
}

function jumped() {
  return jumpTo != null;
}

async function presentGroup(page, index) {
  move = null;
  showSlide(page, index);
  await afterPaint();
  if (jumped()) return "jump";
  if (move) return move;
  body.classList.remove("is-dim");
  stage.classList.add("is-in");
  if (jumped()) return "jump";
  if (move) return move;
  if (await hold(motion(320))) return jumped() ? "jump" : move || "next";
  stage.classList.add("has-words");
  if (jumped()) return "jump";
  if (move) return move;
  const words = `${page.text || ""}${page.photos.map((photo) => photo.text || "").join("")}`;
  if (await hold(readMs(words), true)) return jumped() ? "jump" : move || "next";
  stage.classList.remove("is-in", "has-words");
  stage.classList.add("is-leaving");
  body.classList.add("is-dim");
  if (jumped()) return "jump";
  if (move) return move;
  if (await hold(motion(500))) return jumped() ? "jump" : move || "next";
  return "next";
}

async function presentReel(page, index, fromEnd) {
  let slot = fromEnd ? page.photos.length - 1 : 0;
  move = null;
  showSlide(page, index, slot);
  await afterPaint();
  body.classList.remove("is-dim");
  stage.classList.add("is-in");
  let opened = false;
  while (!out) {
    if (jumped()) return "jump";
    if (!move) {
      if (!opened) {
        if (!(await hold(motion(320))) && !move && !jumped()) stage.classList.add("has-words");
        opened = true;
      }
      if (jumped()) return "jump";
      if (!move) {
        const words = `${slot === 0 ? page.text || "" : ""}${page.photos[slot].text || ""}`;
        await hold(readMs(words), true);
      }
    }
    if (jumped()) return "jump";
    if (out) return "next";
    const goingBack = move === "back";
    move = null;
    const leaving = goingBack ? slot === 0 : slot === page.photos.length - 1;
    if (leaving) {
      stage.classList.remove("is-in", "has-words");
      stage.classList.add("is-leaving");
      body.classList.add("is-dim");
      if (await hold(motion(500))) return jumped() ? "jump" : move || (goingBack ? "back" : "next");
      return goingBack ? "back" : "next";
    }
    slot += goingBack ? -1 : 1;
    await glidePhoto(page, slot);
    if (jumped()) return "jump";
  }
  return "next";
}

async function glidePhoto(page, slot) {
  cluster.querySelectorAll(".frame.is-bye").forEach((node) => node.remove());
  cluster.style.minHeight = "";
  const leaving = cluster.querySelector(".frame");
  let frame = null;
  try {
    if (leaving) {
      leaving.style.width = `${leaving.offsetWidth}px`;
      leaving.style.height = `${leaving.offsetHeight}px`;
      leaving.classList.add("is-bye");
    }
    const holder = document.createElement("template");
    holder.innerHTML = frameHtml(page.photos[slot]);
    frame = holder.content.firstElementChild;
    frame.classList.add("is-arrive");
    cluster.appendChild(frame);
    frame.querySelectorAll(".shot.has-photo img").forEach((img) => {
      bindOrientation(img, frame);
    });
    reelMark.hidden = false;
    reelMark.textContent = `${slot + 1} / ${page.photos.length}`;
    skipHint.textContent = reelHint(slot, page.photos.length);
    stage.classList.add("has-words");
    await afterPaint();
    frame.classList.remove("is-arrive");
    await hold(motion(500));
  } finally {
    frame?.classList.remove("is-arrive");
    leaving?.remove();
    cluster.querySelectorAll(".frame.is-bye").forEach((node) => node.remove());
    stageInner.classList.remove("tall-row", "has-wide");
    cluster.style.minHeight = "";
    move = null;
  }
}

let gesture = null;

function navBlocked(event) {
  return body.classList.contains("is-editing") || event.target.closest(".candle, .editor, .edit-entry, .pace-dock, .corner, .shot, .copy");
}

window.addEventListener("pointerdown", (event) => {
  if (!out && body.classList.contains("is-finale") && body.classList.contains("is-blow-cue")) armMic();
  if (!lit || out || navBlocked(event)) return;
  gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
});

window.addEventListener("pointerup", (event) => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  const x = event.clientX;
  gesture = null;
  if (!lit || out || navBlocked(event)) return;
  if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
    nudge(dx > 0 ? "back" : "next");
    return;
  }
  if (Math.abs(dx) > 28 || Math.abs(dy) > 28) return;
  nudge(x < window.innerWidth / 2 ? "back" : "next");
});

window.addEventListener("pointercancel", () => {
  gesture = null;
});

window.addEventListener("keydown", (event) => {
  if (!lit || out || event.repeat || body.classList.contains("is-editing")) return;
  if (event.target instanceof Element && event.target.closest(".editor")) return;
  if (event.key === "ArrowRight") nudge("next");
  if (event.key === "ArrowLeft") nudge("back");
});

document.getElementById("jump-first").addEventListener("click", (event) => {
  event.stopPropagation();
  requestJump(0);
});

document.getElementById("jump-last").addEventListener("click", (event) => {
  event.stopPropagation();
  requestJump(pages.length - 1);
});

const bursts = [];
const embers = [];
const flashes = [];
let showFireworks = false;
let fireworksBegan = 0;
let lastLaunch = 0;
const palette = ["#ffd56a", "#ffb03a", "#ff8fb8", "#fff4d2", "#ff7d6a"];
const quietMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function sparkScale() {
  const short = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(0.9, Math.min(1.45, short / 780));
}

function fitFireworks() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  fireworks.width = Math.floor(window.innerWidth * ratio);
  fireworks.height = Math.floor(window.innerHeight * ratio);
  paint.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchRocket() {
  const styles = ["peony", "peony", "willow", "crown"];
  bursts.push({
    x: window.innerWidth * (0.15 + Math.random() * 0.7),
    y: window.innerHeight + 4,
    tx: window.innerWidth * (0.1 + Math.random() * 0.8),
    ty: window.innerHeight * (0.08 + Math.random() * 0.42),
    color: palette[Math.floor(Math.random() * palette.length)],
    accent: palette[Math.floor(Math.random() * palette.length)],
    style: styles[Math.floor(Math.random() * styles.length)],
  });
}

function addEmber(x, y, angle, speed, color, kind, tilt = 0, squash = 1) {
  const scale = sparkScale();
  const wander = (Math.random() - 0.5) * speed * 0.18;
  let vx = Math.cos(angle) * speed * (0.82 + Math.random() * 0.36) - Math.sin(angle) * wander;
  let vy = Math.sin(angle) * speed * squash * (0.9 + Math.random() * 0.2) + Math.cos(angle) * wander;
  const turn = Math.cos(tilt);
  const lean = Math.sin(tilt);
  const spread = 18 + Math.random() * 36;
  embers.push({
    x: x + Math.cos(angle) * spread,
    y: y + Math.sin(angle) * spread * squash,
    vx: vx * turn - vy * lean,
    vy: vx * lean + vy * turn,
    life: Math.random() < 0.16 ? 0.4 + Math.random() * 0.25 : 0.82 + Math.random() * 0.18,
    decay: kind === "willow" ? 0.0018 + Math.random() * 0.0014 : 0.0024 + Math.random() * 0.0022,
    color,
    kind,
    crackle: kind === "crown" && Math.random() < 0.22,
    split: false,
    width: (kind === "willow" ? 2.2 + Math.random() * 1.4 : kind === "core" ? 1.6 + Math.random() * 1.2 : 2.8 + Math.random() * 2.4) * scale,
  });
}

function explode(rocket) {
  const scale = sparkScale();
  const portrait = window.innerHeight > window.innerWidth;
  const reach = (portrait ? window.innerWidth * 0.38 : Math.min(window.innerWidth, window.innerHeight) * 0.24) * (rocket.style === "willow" ? 0.85 : 1);
  const tilt = (Math.random() - 0.5) * 0.12;
  const squash = 0.94 + Math.random() * 0.08;
  const count = quietMotion ? 36 : rocket.style === "willow" ? 130 : 180;
  flashes.push({
    x: rocket.tx,
    y: rocket.ty,
    radius: 5 * scale,
    max: 18 * scale,
    life: 1,
    color: "#fff8ea",
  });
  for (let index = 0; index < count; index += 1) {
    const lobe = Math.floor(Math.random() * 6);
    const angle = (lobe / 6) * Math.PI * 2 + (Math.random() - 0.5) * 1.35;
    const roll = Math.random();
    const band = Math.random();
    const speed = (reach / 14) * (band < 0.45 ? 0.4 + Math.random() * 0.4 : band < 0.78 ? 0.1 + Math.random() * 0.28 : 0.85 + Math.random() * 0.55);
    const kind = rocket.style === "willow" ? "willow" : roll > 0.84 ? "core" : rocket.style === "crown" ? "crown" : "peony";
    const color = kind === "core" ? rocket.accent || "#fff6df" : Math.random() < 0.18 ? "#fff6df" : rocket.color;
    addEmber(rocket.tx, rocket.ty, angle, speed, color, kind, tilt, squash);
  }
  if (quietMotion || rocket.style === "willow") return;
  for (let index = 0; index < 16; index += 1) {
    addEmber(
      rocket.tx,
      rocket.ty,
      Math.random() * Math.PI * 2,
      (reach / 14) * (1.05 + Math.random() * 0.5),
      rocket.color,
      "peony",
      tilt,
      squash,
    );
  }
}

function drawFireworks(now) {
  if (!showFireworks) return;
  const elapsed = now - fireworksBegan;
  paint.clearRect(0, 0, window.innerWidth, window.innerHeight);
  paint.globalCompositeOperation = "lighter";
  const gap = quietMotion ? 1500 : elapsed < 8000 ? 680 : 980;
  if (now - lastLaunch > gap && embers.length < 2800) {
    launchRocket();
    lastLaunch = now;
  }
  for (let index = flashes.length - 1; index >= 0; index -= 1) {
    const flash = flashes[index];
    flash.radius += (flash.max - flash.radius) * 0.28;
    flash.life -= 0.085;
    if (flash.life <= 0) {
      flashes.splice(index, 1);
      continue;
    }
    paint.globalAlpha = flash.life * 0.55;
    paint.fillStyle = flash.color;
    paint.beginPath();
    paint.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
    paint.fill();
  }
  for (let index = bursts.length - 1; index >= 0; index -= 1) {
    const rocket = bursts[index];
    rocket.y -= 12;
    rocket.x += (rocket.tx - rocket.x) * 0.08;
    paint.globalAlpha = 0.9;
    paint.fillStyle = "#fff6e4";
    paint.beginPath();
    paint.arc(rocket.x, rocket.y, 2.2, 0, Math.PI * 2);
    paint.fill();
    if (rocket.y <= rocket.ty) {
      explode(rocket);
      bursts.splice(index, 1);
    }
  }
  for (let index = embers.length - 1; index >= 0; index -= 1) {
    const ember = embers[index];
    ember.x += ember.vx;
    ember.y += ember.vy;
    ember.vy += ember.kind === "willow" ? 0.038 * sparkScale() : 0.004 * sparkScale();
    const drag = ember.kind === "willow" ? 0.99 : 0.952;
    ember.vx *= drag;
    ember.vy *= drag;
    ember.life -= ember.decay;
    if (ember.life <= 0) {
      embers.splice(index, 1);
      continue;
    }
    if (ember.crackle && !ember.split && ember.life < 0.62 && embers.length < 3200) {
      ember.split = true;
      for (let child = 0; child < 4; child += 1) {
        addEmber(ember.x, ember.y, Math.random() * Math.PI * 2, sparkScale() * (1.2 + Math.random()), "#fff6df", "core");
      }
    }
    const alpha = Math.max(0, ember.life);
    const trail = ember.kind === "willow" ? 1.8 : 0.72;
    const previousX = ember.x - ember.vx * trail;
    const previousY = ember.y - ember.vy * trail;
    paint.lineCap = "round";
    paint.strokeStyle = ember.color;
    paint.globalAlpha = alpha * 0.22;
    paint.lineWidth = ember.width * 1.85;
    paint.beginPath();
    paint.moveTo(previousX, previousY);
    paint.lineTo(ember.x, ember.y);
    paint.stroke();
    paint.globalAlpha = alpha * 0.92;
    paint.lineWidth = ember.width;
    paint.beginPath();
    paint.moveTo(previousX, previousY);
    paint.lineTo(ember.x, ember.y);
    paint.stroke();
    if (ember.kind === "core") {
      paint.strokeStyle = "#fffaf2";
      paint.globalAlpha = alpha;
      paint.lineWidth = Math.max(1.3, ember.width * 0.45);
      paint.beginPath();
      paint.moveTo(previousX, previousY);
      paint.lineTo(ember.x, ember.y);
      paint.stroke();
    }
    paint.fillStyle = ember.kind === "core" ? "#fffaf2" : ember.color;
    paint.beginPath();
    paint.arc(ember.x, ember.y, Math.max(1.6, ember.width * 0.42), 0, Math.PI * 2);
    paint.fill();
  }
  paint.globalAlpha = 1;
  if (showFireworks) requestAnimationFrame(drawFireworks);
}

function startFireworks() {
  if (showFireworks) return;
  showFireworks = true;
  fireworksBegan = performance.now();
  lastLaunch = performance.now();
  fitFireworks();
  if (!quietMotion) {
    const spots = [
      [0.2, 0.24, "peony", 0],
      [0.58, 0.16, "peony", 1],
      [0.78, 0.34, "willow", 2],
      [0.36, 0.4, "crown", 3],
    ];
    spots.forEach(([slot, height, style, index]) => {
      explode({
        tx: window.innerWidth * (slot + (Math.random() - 0.5) * 0.06),
        ty: window.innerHeight * (height + (Math.random() - 0.5) * 0.04),
        color: palette[index % palette.length],
        accent: "#fff6df",
        style,
      });
    });
    window.setTimeout(() => {
      if (!showFireworks) return;
      explode({
        tx: window.innerWidth * (0.3 + Math.random() * 0.4),
        ty: window.innerHeight * (0.14 + Math.random() * 0.2),
        color: palette[Math.floor(Math.random() * palette.length)],
        accent: "#fff6df",
        style: Math.random() < 0.5 ? "peony" : "crown",
      });
    }, 640);
  }
  requestAnimationFrame(drawFireworks);
}

window.addEventListener("resize", () => {
  if (showFireworks) fitFireworks();
});

function burst(button) {
  for (let index = 0; index < 8; index += 1) {
    const spark = document.createElement("i");
    spark.className = "spark";
    spark.style.left = `${42 + Math.random() * 16}%`;
    spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 54}px`);
    spark.style.animationDelay = `${Math.random() * 0.12}s`;
    button.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
}

let micState = "idle";
let micStream = null;

function armMic() {
  if (micState === "on" || micState === "asking" || !navigator.mediaDevices?.getUserMedia) return;
  micState = "asking";
  const attempts = [
    { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } },
    { audio: true },
  ];
  const ask = (index) => {
    navigator.mediaDevices
      .getUserMedia(attempts[index])
      .then((stream) => {
        micState = "on";
        micStream = stream;
        watchBlow(stream);
      })
      .catch((error) => {
        if (index + 1 < attempts.length) ask(index + 1);
        else if (error?.name === "NotFoundError" || error?.name === "NotReadableError") micState = "denied";
        else micState = "idle";
      });
  };
  ask(0);
}

function watchBlow(stream) {
  unlockAudio();
  if (!audioCtx) return;
  audioCtx.resume();
  let source;
  try {
    source = audioCtx.createMediaStreamSource(stream);
  } catch {
    return;
  }
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const bins = new Uint8Array(analyser.fftSize);
  let ambient = 0.02;
  let hot = 0;
  let warmed = 0;
  const watch = () => {
    if (out) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    analyser.getByteTimeDomainData(bins);
    let sum = 0;
    for (let index = 0; index < bins.length; index += 1) {
      const sample = (bins[index] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / bins.length);
    warmed += 1;
    if (warmed < 36) {
      ambient = ambient * 0.86 + rms * 0.14;
      requestAnimationFrame(watch);
      return;
    }
    if (!body.classList.contains("is-finale")) {
      hot = 0;
      requestAnimationFrame(watch);
      return;
    }
    const loud = rms > 0.018 && rms - ambient > 0.006 && rms > ambient * 1.2;
    if (!loud) ambient = ambient * 0.985 + rms * 0.015;
    hot = loud ? hot + 1 : 0;
    const lean = loud ? Math.min(1, (rms - ambient) / 0.08) : 0;
    quench.style.setProperty("--blow", lean.toFixed(3));
    if (hot >= 3) {
      extinguish();
      return;
    }
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
}

function extinguish() {
  if (out) return;
  const fromOpening = !body.classList.contains("is-finale");
  out = true;
  skipWait?.();
  window.clearTimeout(blowTimer);
  body.classList.remove("is-blow-cue");
  const candle = fromOpening ? light : quench;
  candle.classList.add("dying");
  if (fromOpening) candle.style.setProperty("--blow", "1");
  burst(candle);
  startFireworks();
  micStream?.getTracks().forEach((track) => track.stop());
  window.setTimeout(() => {
    finale.hidden = false;
    body.classList.add("is-finale", "is-out");
  }, 420);
}

bindHold(light, { duration: 1100, onDone: catchFlame });
bindHold(quench, { duration: 900, onDone: extinguish, blows: true });

const editor = document.getElementById("editor");
const pageList = document.getElementById("page-list");
const editorNote = document.getElementById("editor-note");

function albumDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("hbd-album", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("album");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(value) {
  const db = await albumDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("album", "readwrite");
    tx.objectStore("album").put(value, "pages");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet() {
  try {
    const db = await albumDb();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction("album", "readonly");
      const request = tx.objectStore("album").get("pages");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo"));
    };
    image.src = url;
  });
}

function renderEditor() {
  const editor = document.getElementById("editor");
  const scroll = editor.scrollTop;
  pageList.innerHTML = pages
    .map((page, index) => {
      const slots = page.photos
        .map((photo, slot) => {
          const preview = photo.src ? `<img src="${escapeHtml(photo.src)}" alt="" />` : "<span>上传</span>";
          const drop =
            page.photos.length > 1
              ? `<button type="button" data-act="drop-photo" data-page="${index}" data-slot="${slot}">去掉</button>`
              : "";
          return `<div class="slot"><label class="thumb">${preview}<input type="file" accept="image/*" data-act="file" data-page="${index}" data-slot="${slot}" hidden /></label><label class="words">这张单独<textarea data-field="photo-text" data-page="${index}" data-slot="${slot}" rows="3" placeholder="不写也可以">${escapeHtml(photo.text || "")}</textarea></label>${drop}</div>`;
        })
        .join("");
      const add =
        page.photos.length < 6
          ? `<button type="button" data-act="add-photo" data-page="${index}">再加一张</button>`
          : "";
      const reelNote =
        page.photos.length > GROUP_LIMIT
          ? `<p class="slot-note">这页的话留着，照片一张一张出来。</p>`
          : "";
      return `<article class="page-card">
        <div class="page-head">
          <h3>第 ${index + 1} 页</h3>
          <div class="page-tools">
            <span class="drag-handle" data-drag="${index}" title="按住拖到别的页">拖动排序</span>
            <button type="button" data-act="up" data-page="${index}" ${index === 0 ? "disabled" : ""}>上移</button>
            <button type="button" data-act="down" data-page="${index}" ${index === pages.length - 1 ? "disabled" : ""}>下移</button>
            <button type="button" data-act="drop-page" data-page="${index}" ${pages.length === 1 ? "disabled" : ""}>删掉这页</button>
          </div>
        </div>
        <div class="fields">
          <label class="words page-words">这一页<textarea data-field="text" data-page="${index}" rows="3" placeholder="写给这一页的话，不写也可以">${escapeHtml(page.text || "")}</textarea></label>
        </div>
        <div class="slots">${slots}${add}${reelNote}</div>
      </article>`;
    })
    .join("");
  editor.scrollTop = scroll;
}

pageList.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.page);
  if (!field || Number.isNaN(index) || !pages[index]) return;
  if (field === "photo-text") {
    const slot = Number(event.target.dataset.slot);
    if (!pages[index].photos[slot]) return;
    pages[index].photos[slot].text = event.target.value;
    return;
  }
  pages[index][field] = event.target.value;
});

let pageDrag = null;
let skipDragClick = false;

function pageDropIndex(clientY) {
  const cards = [...pageList.querySelectorAll(".page-card")];
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return cards.length;
}

function markPageDrop(clientY) {
  const cards = [...pageList.querySelectorAll(".page-card")];
  cards.forEach((card) => card.classList.remove("is-drop-before", "is-drop-after"));
  const index = pageDropIndex(clientY);
  if (index >= cards.length) cards.at(-1)?.classList.add("is-drop-after");
  else cards[index].classList.add("is-drop-before");
}

function clearPageDrop() {
  pageList.querySelectorAll(".page-card").forEach((card) => {
    card.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
  });
}

function movePage(from, to) {
  if (to < 0 || to > pages.length || from === to || from + 1 === to) return false;
  const [moved] = pages.splice(from, 1);
  pages.splice(from < to ? to - 1 : to, 0, moved);
  return true;
}

function edgeScroll(clientY) {
  const editor = document.getElementById("editor");
  const rect = editor.getBoundingClientRect();
  if (clientY < rect.top + 80) editor.scrollTop -= 16;
  else if (clientY > rect.bottom - 80) editor.scrollTop += 16;
}

pageList.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-drag]");
  if (!handle || event.button !== 0) return;
  pageDrag = {
    index: Number(handle.dataset.drag),
    y: event.clientY,
    moved: false,
    id: event.pointerId,
  };
  try {
    handle.setPointerCapture(event.pointerId);
  } catch {
    /* 有的浏览器在这次按下里不让锁定指针，拖动仍然跟着移动。 */
  }
});

pageList.addEventListener("pointermove", (event) => {
  if (!pageDrag || event.pointerId !== pageDrag.id) return;
  if (!pageDrag.moved && Math.abs(event.clientY - pageDrag.y) < 8) return;
  pageDrag.moved = true;
  pageList.querySelectorAll(".page-card")[pageDrag.index]?.classList.add("is-dragging");
  markPageDrop(event.clientY);
  edgeScroll(event.clientY);
});

pageList.addEventListener("pointerup", (event) => {
  if (!pageDrag || event.pointerId !== pageDrag.id) return;
  const from = pageDrag.index;
  const moved = pageDrag.moved;
  const y = event.clientY;
  pageDrag = null;
  clearPageDrop();
  if (!moved) return;
  skipDragClick = true;
  if (movePage(from, pageDropIndex(y))) renderEditor();
});

pageList.addEventListener("pointercancel", () => {
  pageDrag = null;
  clearPageDrop();
});

pageList.addEventListener("click", (event) => {
  if (skipDragClick) {
    skipDragClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const index = Number(button.dataset.page);
  const act = button.dataset.act;
  if (act === "up" && index > 0) {
    const previous = pages[index - 1];
    pages[index - 1] = pages[index];
    pages[index] = previous;
  } else if (act === "down" && index < pages.length - 1) {
    const next = pages[index + 1];
    pages[index + 1] = pages[index];
    pages[index] = next;
  } else if (act === "drop-page" && pages.length > 1) {
    pages.splice(index, 1);
  } else if (act === "add-photo" && pages[index].photos.length < 6) {
    const tones = ["shot-b", "shot-c", "shot-d"];
    pages[index].photos.push({ src: "", tone: tones[pages[index].photos.length % tones.length], text: "" });
  } else if (act === "drop-photo" && pages[index].photos.length > 1) {
    pages[index].photos.splice(Number(button.dataset.slot), 1);
  } else {
    return;
  }
  renderEditor();
});

pageList.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.act !== "file" || !input.files?.[0]) return;
  const index = Number(input.dataset.page);
  const slot = Number(input.dataset.slot);
  try {
    pages[index].photos[slot].src = await shrinkPhoto(input.files[0]);
    pages[index].photos[slot].tone = "";
    renderEditor();
  } catch {
    editorNote.textContent = "这张照片没有读出来，换一张试试。";
  }
});

document.getElementById("add-page").addEventListener("click", () => {
  pages.push(blankPage([""]));
  renderEditor();
  pageList.lastElementChild?.scrollIntoView({ block: "nearest" });
});

function syncForms() {
  document.getElementById("line-opening").value = script.opening;
  document.getElementById("line-bridge").value = script.bridge;
  document.getElementById("line-wish").value = script.wish;
  document.getElementById("line-blow").value = script.blow;
  document.getElementById("line-blessing").value = script.blessing;
  const pick = document.querySelector(`input[name="music"][value="${script.music}"]`);
  if (pick) pick.checked = true;
  document.getElementById("music-name").textContent =
    script.music === "file" ? script.musicName || "已选一首" : "";
  showPace(script.pace);
}

function takeScript(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  ["opening", "bridge", "wish", "blow", "blessing", "music", "musicSrc", "musicName"].forEach((key) => {
    if (typeof data[key] === "string") script[key] = data[key];
  });
  if (typeof data.pace === "number" && Number.isFinite(data.pace)) showPace(data.pace);
  applyScript();
}

function audioExt(dataUrl) {
  const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
  return (
    {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/wave": "wav",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/webm": "webm",
    }[mime] || "mp3"
  );
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

document.addEventListener("selectstart", (event) => {
  if (event.target instanceof Element && event.target.closest(".editor")) return;
  event.preventDefault();
});

document.getElementById("watch-pace").addEventListener("input", (event) => {
  showPace(1.5 - Number(event.target.value) / 10);
});

document.getElementById("script-card").addEventListener("input", (event) => {
  if (event.target.id === "line-pace") {
    showPace(1.5 - Number(event.target.value) / 10);
    return;
  }
  const key = event.target.dataset.line;
  if (!key) return;
  script[key] = event.target.value;
  applyScript();
});

document.getElementById("music-card").addEventListener("change", async (event) => {
  if (event.target.name === "music") {
    script.music = event.target.value;
    syncForms();
    return;
  }
  const file = event.target.files?.[0];
  if (event.target.id !== "music-file" || !file) return;
  try {
    script.music = "file";
    script.musicName = file.name;
    script.musicSrc = await readFile(file);
    syncForms();
    editorNote.textContent = `已选 ${file.name}，保存后会留在这一份里。`;
  } catch {
    editorNote.textContent = "这个音频没有读出来，换一个试试。";
  }
});

document.getElementById("preview-music").addEventListener("click", () => {
  stopPreview();
  if (script.music === "off") {
    editorNote.textContent = "这一版不放音乐。";
    return;
  }
  if (script.music === "file") {
    if (!script.musicSrc) {
      editorNote.textContent = "先选一个音频文件。";
      return;
    }
    previewAudio = new Audio(script.musicSrc);
    previewAudio.volume = 0.5;
    previewAudio.play().then(() => {
      editorNote.textContent = "在听，大约八秒后停下。";
    }).catch(() => {
      editorNote.textContent = "这首没播出来，换一个音频文件试试。";
    });
    previewTimer = window.setTimeout(stopPreview, 8000);
    return;
  }
  unlockAudio();
  previewing = true;
  startMusic();
  editorNote.textContent = "在听，大约八秒后停下。";
  previewTimer = window.setTimeout(stopPreview, 8000);
});

document.getElementById("edit-entry").addEventListener("click", async () => {
  await ready;
  editor.hidden = false;
  body.classList.add("is-editing");
  editorNote.textContent = pendingFileSave
    ? "这份还在这台浏览器里。请用 http://127.0.0.1:8753/ 打开后再点保存，才会写进页面。"
    : "";
  syncForms();
  renderEditor();
});

document.getElementById("close-editor").addEventListener("click", () => {
  stopPreview();
  editor.hidden = true;
  body.classList.remove("is-editing");
  applyScript();
  buildWall();
});

async function saveAlbum() {
  const images = [];
  let stamp = Date.now();
  const stored = pages.map((page) => ({
    date: (page.date || "").trim(),
    place: (page.place || "").trim(),
    text: page.text || "",
    photos: page.photos.map((photo) => {
      if (!photo.src || !photo.src.startsWith("data:")) {
        return { src: photo.src || "", tone: photo.tone || "", text: photo.text || "" };
      }
      stamp += 1;
      const name = `p${stamp}.jpg`;
      images.push({ name, data: photo.src });
      return { src: `photos/${name}`, tone: "", text: photo.text || "" };
    }),
  }));
  const savedScript = { ...script };
  let audio = null;
  if (savedScript.music === "file" && savedScript.musicSrc.startsWith("data:")) {
    stamp += 1;
    const name = `m${stamp}.${audioExt(savedScript.musicSrc)}`;
    audio = { name, data: savedScript.musicSrc };
    savedScript.musicSrc = `music/${name}`;
  }
  const response = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { pages: stored, script: savedScript }, images, audio }),
  });
  if (!response.ok) throw new Error("save");
  pages = stored;
  script = savedScript;
  pendingFileSave = false;
}

document.getElementById("save-pages").addEventListener("click", async () => {
  editorNote.textContent = "正在保存…";
  try {
    await saveAlbum();
    buildWall();
    syncForms();
    renderEditor();
    editorNote.textContent = "写进页面了。换手机时把整个文件夹一起拷过去，照片在 photos 里，不用再保存一次。";
  } catch {
    try {
      await idbSet({ pages, script });
      pendingFileSave = true;
      editorNote.textContent =
        location.protocol === "file:"
          ? "这个打开方式写不进文件。请用 http://127.0.0.1:8753/ 打开，再点一次保存。"
          : "没写进文件。请用 http://127.0.0.1:8753/ 打开，再点一次保存。";
    } catch {
      editorNote.textContent = "没保存上，再试一次。";
    }
  }
});

let pendingFileSave = false;

function readEmbedded() {
  try {
    const node = document.getElementById("album-data");
    const data = JSON.parse(node ? node.textContent || "null" : "null");
    if (data && Array.isArray(data.pages) && data.pages.length) return data;
  } catch {
    return null;
  }
  return null;
}

function applyAlbum(data) {
  pages = data.pages;
  settlePages(pages);
  if (data.script) takeScript(data.script);
  buildWall();
}

async function loadContent() {
  let fileAlbum = null;
  try {
    const response = await fetch("content.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.pages) && data.pages.length) fileAlbum = data;
    }
  } catch {
    /* 直接打开文件时读不到旁边的 json */
  }
  if (!fileAlbum) fileAlbum = readEmbedded();
  if (fileAlbum) {
    applyAlbum(fileAlbum);
    return;
  }
  const stored = await idbGet();
  const idbAlbum = Array.isArray(stored)
    ? { pages: stored }
    : stored && Array.isArray(stored.pages)
      ? stored
      : null;
  if (idbAlbum) applyAlbum(idbAlbum);
}

const ready = loadContent();
