(function () {
  "use strict";

  /* Protects the eyes while this page is the screen in front of you.
     Visible time counts. Looking away, hiding the page, or a real break
     resets the cycle. Breaks include a look into the distance and guided
     pressure on points around the eyes. This is a work routine, not
     treatment for refraction or eye disease. */

  var KEY = "japanese-study-eyes";
  var TAB = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var C = 2 * Math.PI * 52;
  var DEFAULTS = {
    enabled: true,
    strictness: "standard",
    blinkEvery: 5 * 60000,
    lookEvery: 20 * 60000,
    lookFor: 20000,
    longEvery: 60 * 60000,
    longFor: 120000,
    warmthMode: "auto",
    warmthScale: 80,
    tint: "amber",
    dim: 0,
    sound: true,
    distanceSeen: false,
    collapsed: false
  };
  var COPY = {
    look: ["Look away", "Look past the screen", "Rest your eyes on something about 6 meters away. Blink fully."],
    blink: ["Blink", "Close your eyes slowly and fully", "Let the upper and lower lashes meet. Pause for a second, then open easily. Repeat until the count ends."],
    palm: ["Palm rest", "Close your eyes and cover them with your palms", "Block the light without pressing. Breathe in, then breathe out slowly."],
    eight: ["Figure eight", "Follow the dot with your eyes only", "Keep your head still and follow only the dot."],
    near: ["Near and far", "Shift focus between near and far", "For near, focus on your thumb about 30 cm in front of the screen. For far, focus across the room."],
    gaze: ["Directions", "Look toward the light with your eyes only", "Keep your head still. Pause briefly in each direction."],
    points: ["Acupoints", "Press around the eyes", "Use the pad of a clean finger. Small circles on the bone. Never press the eyeball. Stop if it hurts."],
    orbit: ["Around the eye", "Trace the bone around each eye", "Eyes closed. Slide from the inner brow outward, around the outer corner, and back along the bone under the eye."]
  };
  var POINTS = [
    { id: "jingming", name: "Jingming", place: "Inner corner of the eye",
      how: "Eyes closed. Rest a fingertip on each inner corner, beside the nose. Press lightly, then ease off. Stay off the eyeball.",
      dots: [[94, 114], [126, 114]] },
    { id: "zanzhu", name: "Zanzhu", place: "Inner end of the eyebrow",
      how: "Place a fingertip at the inner end of each eyebrow. Make small circles on the bone.",
      dots: [[84, 98], [136, 98]] },
    { id: "yuyao", name: "Yuyao", place: "Middle of the eyebrow",
      how: "Press the middle of each eyebrow, directly above the pupil. One small circle a second.",
      dots: [[74, 90], [146, 90]] },
    { id: "sizhukong", name: "Sizhukong", place: "Outer end of the eyebrow",
      how: "Press the hollow at the outer end of each eyebrow. Small circles.",
      dots: [[58, 98], [162, 98]] },
    { id: "tongziliao", name: "Tongziliao", place: "Outer corner of the eye",
      how: "Press the hollow just outside each outer corner. Light pressure only.",
      dots: [[50, 116], [170, 116]] },
    { id: "taiyang", name: "Taiyang", place: "Temple",
      how: "Press each temple, about a finger-width out from the midpoint between the outer corner and the brow. Circles with the thumb pad.",
      dots: [[34, 112], [186, 112]] },
    { id: "chengqi", name: "Chengqi", place: "Bone under the eye",
      how: "Press the bone directly under each pupil. The fingertip stays on the bone, not on the eye.",
      dots: [[74, 130], [146, 130]] },
    { id: "sibai", name: "Sibai", place: "Hollow below the eye",
      how: "Move one finger-width below the bone under the eye. Press that hollow and circle.",
      dots: [[74, 148], [146, 148]] }
  ];
  var GAZE = [
    ["Up", -90], ["Up right", -45], ["Right", 0], ["Down right", 45],
    ["Down", 90], ["Down left", 135], ["Left", 180], ["Up left", 225]
  ];
  var STATUS = { watch: "On", rest: "Resting", away: "Away", off: "Off", defer: "Break soon" };
  var TINTS = {
    amber: { name: "Amber", warm: "#ffb15a", sky: "#f6d7a8", hill: "#e0a15a", night: "#5c3b28", paper: "#fff6e8", glow: "#ffe08a", cheek: "#e8896a", ink: "#3a2418" },
    moss: { name: "Moss", warm: "#b7c98a", sky: "#d7e6c6", hill: "#7ea36a", night: "#2c4634", paper: "#f7fbf2", glow: "#f4e7a4", cheek: "#e09b78", ink: "#243328" },
    sea: { name: "Sea", warm: "#8ec4d4", sky: "#c9e6f0", hill: "#6aa8b8", night: "#1d3d4a", paper: "#f4fbfc", glow: "#fff1c4", cheek: "#e7a090", ink: "#16323c" },
    rose: { name: "Rose", warm: "#f0b0b0", sky: "#f8d6d1", hill: "#e08b8b", night: "#5a3038", paper: "#fff6f4", glow: "#ffe0a8", cheek: "#e07070", ink: "#4a2430" },
    dusk: { name: "Dusk", warm: "#cbb6e8", sky: "#ddd0f2", hill: "#8b74b8", night: "#2e2444", paper: "#f8f4fc", glow: "#ffe7a8", cheek: "#e09aaa", ink: "#2a203c" },
    ink: { name: "Ink", warm: "#d9c7b0", sky: "#efe4d4", hill: "#8d7b68", night: "#2c2622", paper: "#fbf7f1", glow: "#f0d7a4", cheek: "#c98978", ink: "#2a241e" }
  };
  var EYE_MARK =
    '<svg class="eye-icon" viewBox="0 0 64 40" aria-hidden="true">' +
      '<path d="M4 20c8-11 18-16 28-16s20 5 28 16c-8 11-18 16-28 16S12 31 4 20z" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
      '<circle cx="32" cy="20" r="6" fill="currentColor"/>' +
    "</svg>";

  function pointById(id) {
    var i;
    for (i = 0; i < POINTS.length; i++) {
      if (POINTS[i].id === id) return POINTS[i];
    }
    return POINTS[0];
  }

  function stepPointIds(step) {
    if (step && step.ids && step.ids.length) return step.ids;
    var ids = [];
    var i;
    for (i = 0; i < POINTS.length; i++) ids.push(POINTS[i].id);
    return ids;
  }

  function orbitPath(cx, cy) {
    var parts = [];
    var i;
    for (i = 0; i <= 48; i++) {
      var a = -Math.PI / 2 + (i / 48) * Math.PI * 2;
      var x = cx + Math.cos(a) * 24;
      var y = cy + Math.sin(a) * 15;
      parts.push((i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1));
    }
    return parts.join(" ") + " Z";
  }

  function faceSvg(live) {
    var dots = "";
    var i;
    var j;
    for (i = 0; i < POINTS.length; i++) {
      for (j = 0; j < POINTS[i].dots.length; j++) {
        var spot = POINTS[i].dots[j];
        dots += '<circle class="face-point" data-point="' + POINTS[i].id + '" cx="' + spot[0] + '" cy="' + spot[1] + '" r="4.2"></circle>';
      }
    }
    var fingers = live
      ? '<circle class="face-finger" data-eye="finger-l" cx="74" cy="99" r="5.5"></circle><circle class="face-finger" data-eye="finger-r" cx="146" cy="99" r="5.5"></circle>'
      : "";
    return '<svg class="eye-face" viewBox="0 0 220 236" role="img" aria-label="A face with pressure points around the eyes">' +
      '<ellipse class="face-skin" cx="110" cy="124" rx="74" ry="92"/>' +
      '<path class="face-line" d="M52 108c4-52 30-74 58-74s54 22 58 74"/>' +
      '<path class="face-brow" d="M56 100c14-14 30-12 42 0"/>' +
      '<path class="face-brow" d="M164 100c-14-14-30-12-42 0"/>' +
      '<ellipse class="face-eye" cx="74" cy="114" rx="16" ry="8"/>' +
      '<ellipse class="face-eye" cx="146" cy="114" rx="16" ry="8"/>' +
      '<circle class="face-pupil" cx="74" cy="114" r="2.2"/>' +
      '<circle class="face-pupil" cx="146" cy="114" r="2.2"/>' +
      '<path class="face-orbit" d="' + orbitPath(74, 114) + '"/>' +
      '<path class="face-orbit" d="' + orbitPath(146, 114) + '"/>' +
      '<path class="face-line" d="M110 124v28c-10 8-16 8-20 2"/>' +
      '<path class="face-line" d="M90 178c14 12 26 12 40 0"/>' +
      dots + fingers +
    "</svg>";
  }

  function tintSwatches() {
    var keys = ["amber", "moss", "sea", "rose", "dusk", "ink"];
    var html = '<div class="eye-swatches" role="group" aria-label="Color">';
    var i;
    for (i = 0; i < keys.length; i++) {
      var tint = TINTS[keys[i]];
      html += '<button type="button" data-set="tint" data-value="' + keys[i] + '">' +
        '<i style="background:' + tint.warm + '"></i>' + tint.name + "</button>";
    }
    return html + "</div>";
  }

  var settings = {};
  var state = {
    day: "",
    screenMs: 0,
    lookMs: 0,
    blinkMs: 0,
    longMs: 0,
    lookCount: 0,
    longCount: 0,
    blinkCount: 0,
    longestMs: 0,
    stretchMs: 0
  };
  var ui = {
    nodes: {},
    rest: null,
    away: false,
    collapsed: false,
    menu: false,
    blinkOpen: false,
    blinkTimer: 0,
    deferUntil: 0,
    deferKind: "",
    snoozeLook: 0,
    snoozeLong: 0,
    lookSnoozed: false,
    longSnoozed: false,
    lastTick: Date.now(),
    sinceSave: 0,
    powerArm: 0,
    live: "",
    dim: -1,
    warm: -1,
    watching: false,
    ctx: null,
    channel: null,
    returnFocus: null
  };

  function pad(n) {
    n = Math.floor(Math.abs(n));
    return (n < 10 ? "0" : "") + n;
  }

  function clampNum(value, min, max, fallback) {
    var n = Number(value);
    if (n !== n) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function todayKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function clock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    if (m >= 60) {
      var h = Math.floor(m / 60);
      return h + ":" + pad(m % 60) + ":" + pad(r);
    }
    return pad(m) + ":" + pad(r);
  }

  function bigCount(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    if (s < 60) return String(s);
    return Math.floor(s / 60) + ":" + pad(s % 60);
  }

  function hm(ms) {
    var m = Math.floor(ms / 60000);
    if (m < 1) return "under 1 min";
    var h = Math.floor(m / 60);
    m = m % 60;
    if (h < 1) return m + " min";
    if (!m) return h + " hr";
    return h + " hr " + m + " min";
  }

  function shortDur(ms) {
    var s = Math.round(ms / 1000);
    if (s < 60) return s + " sec";
    return Math.round(s / 60) + " min";
  }

  function mode() {
    if (!settings.enabled) return "off";
    if (ui.rest) return "rest";
    if (ui.away) return "away";
    if (ui.deferUntil && Date.now() < ui.deferUntil) return "defer";
    return "watch";
  }

  function normalize() {
    settings.enabled = settings.enabled !== false;
    if (["gentle", "standard", "strict"].indexOf(settings.strictness) < 0) settings.strictness = "standard";
    if (["auto", "off", "day", "evening", "night"].indexOf(settings.warmthMode) < 0) settings.warmthMode = "auto";
    if (!TINTS[settings.tint]) settings.tint = "amber";
    settings.blinkEvery = clampNum(settings.blinkEvery, 60000, 30 * 60000, DEFAULTS.blinkEvery);
    settings.lookEvery = clampNum(settings.lookEvery, 60000, 90 * 60000, DEFAULTS.lookEvery);
    settings.lookFor = clampNum(settings.lookFor, 10000, 60000, DEFAULTS.lookFor);
    settings.longEvery = clampNum(settings.longEvery, 20 * 60000, 120 * 60000, DEFAULTS.longEvery);
    settings.longFor = clampNum(settings.longFor, 30000, 10 * 60000, DEFAULTS.longFor);
    settings.dim = clampNum(settings.dim, 0, 40, 0);
    settings.warmthScale = clampNum(settings.warmthScale, 0, 130, 80);
    settings.sound = settings.sound !== false;
    settings.distanceSeen = !!settings.distanceSeen;
    settings.collapsed = !!settings.collapsed;
  }

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (err) { saved = {}; }
    settings = Object.assign({}, DEFAULTS, saved.settings || {});
    normalize();
    var now = new Date();
    var key = todayKey(now);
    state.day = saved.day || key;
    if (state.day !== key) {
      state.day = key;
      state.screenMs = 0;
      state.lookCount = 0;
      state.longCount = 0;
      state.blinkCount = 0;
      state.longestMs = 0;
      state.stretchMs = 0;
    } else {
      state.screenMs = clampNum(saved.screenMs, 0, 24 * 3600000, 0);
      state.lookCount = clampNum(saved.lookCount, 0, 999, 0);
      state.longCount = clampNum(saved.longCount, 0, 999, 0);
      state.blinkCount = clampNum(saved.blinkCount, 0, 9999, 0);
      state.longestMs = clampNum(saved.longestMs, 0, 24 * 3600000, 0);
      state.stretchMs = clampNum(saved.stretchMs, 0, 24 * 3600000, 0);
    }
    state.lookMs = clampNum(saved.lookMs, 0, settings.lookEvery, 0);
    state.blinkMs = clampNum(saved.blinkMs, 0, settings.blinkEvery, 0);
    state.longMs = clampNum(saved.longMs, 0, settings.longEvery, 0);
    ui.snoozeLook = clampNum(saved.snoozeLook, 0, Date.now() + 3600000, 0);
    ui.snoozeLong = clampNum(saved.snoozeLong, 0, Date.now() + 3600000, 0);
    ui.lookSnoozed = !!saved.lookSnoozed;
    ui.longSnoozed = !!saved.longSnoozed;
    ui.away = !!saved.away;
    var gap = saved.savedAt ? Math.max(0, Date.now() - Number(saved.savedAt)) : 0;
    if (!ui.away && gap >= settings.longFor) {
      state.longMs = 0;
      state.lookMs = 0;
      state.blinkMs = 0;
      state.stretchMs = 0;
    } else if (!ui.away && gap >= settings.lookFor) {
      state.lookMs = 0;
      state.blinkMs = 0;
      state.stretchMs = 0;
    } else if (!ui.away && gap >= 8000) {
      state.blinkMs = 0;
      state.stretchMs = 0;
    }
  }

  function save(force) {
    if (document.hidden && !force) return;
    var payload = {
      version: 1,
      settings: settings,
      day: state.day,
      screenMs: state.screenMs,
      lookMs: state.lookMs,
      blinkMs: state.blinkMs,
      longMs: state.longMs,
      lookCount: state.lookCount,
      longCount: state.longCount,
      blinkCount: state.blinkCount,
      longestMs: state.longestMs,
      stretchMs: state.stretchMs,
      snoozeLook: ui.snoozeLook,
      snoozeLong: ui.snoozeLong,
      lookSnoozed: ui.lookSnoozed,
      longSnoozed: ui.longSnoozed,
      away: ui.away,
      savedAt: Date.now()
    };
    try { localStorage.setItem(KEY, JSON.stringify(payload)); } catch (err) {}
  }

  function autoWarmth(date) {
    var h = date.getHours() + date.getMinutes() / 60;
    if (h >= 7 && h < 16) return 0;
    if (h >= 16 && h < 19) return ((h - 16) / 3) * 0.26;
    if (h >= 19 && h < 22) return 0.26 + ((h - 19) / 3) * 0.1;
    if (h >= 22) return 0.36;
    if (h < 6) return 0.34;
    return 0.34 * (1 - (h - 6));
  }

  function warmthPreset(date) {
    if (settings.warmthMode === "off") return 0;
    if (settings.warmthMode === "day") return 0.08;
    if (settings.warmthMode === "evening") return 0.26;
    if (settings.warmthMode === "night") return 0.36;
    return autoWarmth(date);
  }

  function applyPalette() {
    var tint = TINTS[settings.tint] || TINTS.amber;
    var root = document.documentElement;
    root.style.setProperty("--eye-tint", tint.warm);
  }

  function applyFilter(now) {
    applyPalette();
    var dim = Math.round((settings.dim || 0)) / 100;
    var warm = warmthPreset(new Date(now)) * (settings.warmthScale / 100);
    if (warm < 0) warm = 0;
    if (warm > 0.55) warm = 0.55;
    warm = Math.round(warm * 1000) / 1000;
    dim = Math.round(dim * 1000) / 1000;
    if (dim === ui.dim && warm === ui.warm) return;
    ui.dim = dim;
    ui.warm = warm;
    document.documentElement.style.setProperty("--eye-dim", String(dim));
    document.documentElement.style.setProperty("--eye-warm", String(warm));
  }

  function lessonBusy() {
    var api = window.JapaneseStudyAudio;
    if (api && api.busy) {
      try { if (api.busy()) return true; } catch (err) {}
    }
    var note = document.getElementById("voiceNote");
    return !!(note && (note.classList.contains("playing") || note.classList.contains("loading")));
  }

  function fieldBusy() {
    var el = document.activeElement;
    if (!el || !el.closest) return false;
    if (el.closest("#eyeRail") || el.closest("#eyeOverlay") || el.closest("#eyeBlink")) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!el.isContentEditable;
  }

  function studyBlocked() {
    if (ui.rest && (ui.rest.locked || settings.enabled)) return true;
    if (ui.blinkOpen && (ui.blinkLocked || settings.enabled)) return true;
    return false;
  }

  function applyStudyLock() {
    var on = studyBlocked();
    document.body.classList.toggle("eye-locked", on);
    if (!on) return;
    var el = document.activeElement;
    if (!el || !el.closest) return;
    if (el.closest("#eyeOverlay") || el.closest("#eyeBlink") || el.closest("#eyeRail")) return;
    try { el.blur(); } catch (err) {}
  }

  function holdLesson() {
    var api = window.JapaneseStudyAudio;
    if (!api || !api.hold) return false;
    try { return !!api.hold(); } catch (err) { return false; }
  }

  function releaseLesson() {
    var api = window.JapaneseStudyAudio;
    if (!api || !api.release) return;
    try { api.release(); } catch (err) {}
  }

  function lessonHeld() {
    var api = window.JapaneseStudyAudio;
    if (!api || !api.held) return false;
    try { return !!api.held(); } catch (err) { return false; }
  }

  function chime(kind) {
    if (!settings.sound || document.hidden) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!ui.ctx) ui.ctx = new Ctx();
      var notes = kind === "end" ? [[659.25, 0, 0.22, 0.028], [783.99, 0.12, 0.32, 0.02]] : [[523.25, 0, 0.16, 0.03], [659.25, 0.12, 0.26, 0.022]];
      var play = function () {
        var i;
        for (i = 0; i < notes.length; i++) tone(notes[i][0], notes[i][1], notes[i][2], notes[i][3]);
      };
      if (ui.ctx.state === "suspended") {
        var resumed = ui.ctx.resume();
        if (resumed && resumed.then) resumed.then(play);
        else play();
      } else play();
    } catch (err) {}
  }

  function tone(freq, at, dur, gain) {
    var t = ui.ctx.currentTime + at;
    var osc = ui.ctx.createOscillator();
    var amp = ui.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(ui.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function withTime(steps) {
    var out = [];
    var i;
    for (i = 0; i < steps.length; i++) {
      if (steps[i].ms > 0) out.push(steps[i]);
    }
    return out.length ? out : [{ id: "look", ms: 8000 }];
  }

  function planLong(ms) {
    var core = ["jingming", "zanzhu", "yuyao", "sizhukong", "tongziliao", "taiyang", "chengqi", "sibai"];
    var brief = ["jingming", "yuyao", "taiyang", "chengqi"];
    var look;
    var each;
    var press;
    var orbit;
    var rest;
    var palm;
    var more;
    if (ms < 70000) {
      var ids = ms < 36000 ? ["jingming", "taiyang"] : brief;
      look = Math.min(8000, Math.round(ms * 0.25));
      each = Math.max(2000, Math.floor((ms - look) / (ids.length + 1)));
      press = each * ids.length;
      orbit = ms - look - press;
      return withTime([
        { id: "look", ms: look },
        { id: "points", ms: press, each: each, ids: ids },
        { id: "orbit", ms: orbit }
      ]);
    }
    look = 20000;
    each = ms >= 240000 ? 10000 : 7000;
    press = each * core.length;
    orbit = ms >= 240000 ? 18000 : 12000;
    rest = ms - look - press - orbit - 12000;
    var steps = [
      { id: "look", ms: look },
      { id: "points", ms: press, each: each, ids: core },
      { id: "orbit", ms: orbit },
      { id: "blink", ms: 12000 }
    ];
    if (rest < 24000) {
      steps.push({ id: "palm", ms: rest });
      return withTime(steps);
    }
    if (rest < 80000) {
      palm = Math.round(rest * 0.55);
      steps.push({ id: "palm", ms: palm });
      steps.push({ id: "eight", ms: rest - palm });
      return withTime(steps);
    }
    steps.push({ id: "palm", ms: 40000 });
    steps.push({ id: "eight", ms: 36000 });
    more = rest - 76000;
    if (more < 36000) {
      steps.push({ id: "near", ms: more });
      return withTime(steps);
    }
    steps.push({ id: "near", ms: 40000 });
    steps.push({ id: "gaze", ms: more - 40000 });
    return withTime(steps);
  }

  function drillMs(kind) {
    if (kind === "look") return settings.lookFor;
    if (kind === "blink") return 16000;
    if (kind === "palm") return 40000;
    if (kind === "eight") return 32000;
    if (kind === "near") return 40000;
    if (kind === "gaze") return 32000;
    if (kind === "points") return POINTS.length * 8000;
    if (kind === "orbit") return 18000;
    return settings.longFor;
  }

  function sumSteps(steps) {
    var total = 0;
    var i;
    for (i = 0; i < steps.length; i++) total += steps[i].ms;
    return total;
  }

  function stepAt(rest, now) {
    var elapsed = Math.max(0, now - rest.started);
    var t = 0;
    var i;
    for (i = 0; i < rest.steps.length; i++) {
      if (elapsed < t + rest.steps[i].ms || i === rest.steps.length - 1) {
        return { index: i, step: rest.steps[i], into: Math.max(0, elapsed - t), elapsed: elapsed };
      }
      t += rest.steps[i].ms;
    }
    return { index: 0, step: rest.steps[0], into: 0, elapsed: elapsed };
  }

  function eightPoint(t) {
    var s = Math.sin(t);
    var c = Math.cos(t);
    var d = 1 + s * s;
    return { x: (s * c) / d, y: c / d };
  }

  function eightPath() {
    var parts = [];
    var i;
    for (i = 0; i <= 120; i++) {
      var p = eightPoint((i / 120) * Math.PI * 2);
      parts.push((i ? "L" : "M") + (50 + p.x * 34).toFixed(2) + " " + (50 + p.y * 42).toFixed(2));
    }
    return parts.join(" ");
  }

  function stillMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function takeLock() {
    var now = Date.now();
    try {
      var cur = JSON.parse(localStorage.getItem(KEY + "-lock") || "null");
      if (cur && cur.tab !== TAB && now - cur.at < 2000) return false;
      localStorage.setItem(KEY + "-lock", JSON.stringify({ tab: TAB, at: now }));
    } catch (err) {}
    return true;
  }

  function publish(msg) {
    msg.tab = TAB;
    try { localStorage.setItem(KEY + "-air", JSON.stringify(msg)); } catch (err) {}
    if (ui.channel) {
      try { ui.channel.postMessage(msg); } catch (err2) {}
    }
  }

  function text(name, value) {
    var node = ui.nodes[name];
    if (!node || node.textContent === value) return;
    node.textContent = value;
  }

  function show(node, on) {
    if (node) node.hidden = !on;
  }

  function nextBreak() {
    var lookLeft = Math.max(0, settings.lookEvery - state.lookMs);
    var longLeft = Math.max(0, settings.longEvery - state.longMs);
    if (longLeft <= lookLeft) return { kind: "long", left: longLeft, every: settings.longEvery, name: "Long break" };
    return { kind: "look", left: lookLeft, every: settings.lookEvery, name: "Eye break" };
  }

  function dimLabel(value) {
    if (value <= 0) return "As is";
    if (value < 15) return "A little dim";
    if (value < 28) return "Dim";
    return "Quite dim";
  }

  function build() {
    var rail = document.getElementById("eyeRail");
    var blink = document.getElementById("eyeBlink");
    if (!rail || rail.dataset.ready) return false;
    rail.dataset.ready = "1";
    rail.innerHTML =
      '<button type="button" class="eye-mini" data-eye="mini-btn" data-act="expand" hidden>' +
        '<span class="eye-mini-mark" aria-hidden="true">' + EYE_MARK + "</span>" +
        '<span class="eye-mini-name" data-eye="mini-name">Eyes</span>' +
        '<span class="eye-mini-time" data-eye="mini">20:00</span>' +
      "</button>" +
      '<div class="eye-full" data-eye="full">' +
        '<div class="eye-head">' +
          '<span class="eye-mark" aria-hidden="true">' + EYE_MARK + "</span>" +
          '<div class="eye-head-text"><h2>Eye exercises</h2></div>' +
          '<span class="eye-status"><i></i><span data-eye="status">On</span></span>' +
          '<button type="button" class="eye-shrink" data-act="shrink">Hide</button>' +
        "</div>" +
        '<p class="eye-note">Breaks pause the lesson, then walk through pressure points around the eyes.</p>' +
        '<div class="eye-face-card">' + faceSvg(false) + "</div>" +
        '<div class="eye-hero">' +
          '<div class="eye-ring-wrap">' +
            '<svg class="eye-ring" viewBox="0 0 120 120" aria-hidden="true">' +
              '<circle class="track" cx="60" cy="60" r="52"></circle>' +
              '<circle class="value" cx="60" cy="60" r="52" data-eye="ring"></circle>' +
            "</svg>" +
            '<div class="eye-ring-center"><strong data-eye="clock">20:00</strong><span data-eye="next">Look away</span></div>' +
          "</div>" +
          '<p class="eye-defer" data-eye="defer" hidden></p>' +
          '<button type="button" class="primary eye-go" data-act="go" data-eye="go">Press the points</button>' +
        "</div>" +
        '<dl class="eye-stats">' +
          '<div><dt>Screen today</dt><dd data-eye="screen">under 1 min</dd></div>' +
          '<div><dt>Look-aways</dt><dd data-eye="looks">0</dd></div>' +
          '<div><dt>Long breaks</dt><dd data-eye="longs">0</dd></div>' +
          '<div><dt>Blinks</dt><dd data-eye="blinks">0</dd></div>' +
        "</dl>" +
        meter("Blink", "blink") +
        meter("Look away", "look") +
        meter("Long break", "long") +
        '<div class="eye-row">' +
          '<button type="button" data-act="menu" data-eye="menu-btn" aria-expanded="false">Exercises</button>' +
          '<button type="button" data-act="away" data-eye="away">Step away</button>' +
        "</div>" +
        '<div class="eye-menu" data-eye="menu" hidden>' +
          drill("points", "Acupoints") +
          drill("orbit", "Around the eye") +
          drill("look", "Look away") +
          drill("blink", "Full blinks") +
          drill("palm", "Palm rest") +
          drill("eight", "Figure eight") +
          drill("near", "Near and far") +
          drill("gaze", "Directions") +
          drill("long", "Full routine") +
        "</div>" +
        '<div class="eye-distance" data-eye="distance">' +
          "<p>Keep the screen an arm’s length away (50–70 cm). The top of the screen sits a little below your eyes.</p>" +
          '<button type="button" data-act="distance">Got it</button>' +
        "</div>" +
        '<p class="eye-label">Screen</p>' +
        '<label class="eye-slider"><span class="eye-slider-top"><span>Brightness</span><span data-eye="dim-label">As is</span></span>' +
          '<input data-eye="dim" data-set="dim" type="range" min="0" max="40" step="1" value="0" aria-label="Screen brightness"></label>' +
        '<p class="eye-label">Color</p>' +
        tintSwatches() +
        seg("warmthMode", [["auto", "Auto"], ["off", "Off"], ["day", "Day"], ["evening", "Evening"], ["night", "Night"]]) +
        '<label class="eye-slider"><span class="eye-slider-top"><span>Strength</span><span data-eye="scale-label">80%</span></span>' +
          '<input data-eye="scale" data-set="warmthScale" type="range" min="0" max="130" step="5" value="80" aria-label="Color strength"></label>' +
        '<p class="eye-label">Sound</p>' +
        seg("sound", [["true", "On"], ["false", "Off"]]) +
        '<p class="eye-label">How strict</p>' +
        seg("strictness", [["gentle", "Gentle"], ["standard", "Standard"], ["strict", "Strict"]]) +
        '<p class="eye-help" data-eye="strict-note"></p>' +
        '<details class="eye-fold"><summary>Break timing</summary>' +
          '<p class="eye-label">Blink</p>' + seg("blinkEvery", [["180000", "3 min"], ["300000", "5 min"], ["480000", "8 min"]]) +
          '<p class="eye-label">Look away</p>' + seg("lookEvery", [["900000", "15 min"], ["1200000", "20 min"], ["1800000", "30 min"]]) +
          seg("lookFor", [["20000", "20 sec"], ["30000", "30 sec"]]) +
          '<p class="eye-label">Long break</p>' + seg("longEvery", [["2700000", "45 min"], ["3600000", "60 min"], ["5400000", "90 min"]]) +
          seg("longFor", [["60000", "1 min"], ["120000", "2 min"], ["300000", "5 min"]]) +
          "<p>A short break looks into the distance, presses four points, and traces around the eye. Two minutes uses all eight points, then blinks, palms, and a figure eight. Five minutes also adds near-and-far and directions.</p>" +
          '<p data-eye="longest"></p>' +
        "</details>" +
        '<details class="eye-fold"><summary>Why this helps</summary>' +
          "<p>Staring up close, and blinking less so the eyes dry out, is the core of screen strain. The American Optometric Association suggests looking about 6 meters away for at least 20 seconds every 20 minutes. Pressing the brow, the corners, the temple, and the bone under the eye is a common way to ease that heavy, tired feeling. Use a fingertip, keep the pressure light, and stay off the eyeball.</p>" +
          "<p>Stop if a point hurts, or if vision changes. Refraction and eye disease belong with an eye doctor.</p>" +
          '<button type="button" class="eye-power" data-act="power" data-eye="power">Stop protection</button>' +
        "</details>" +
        '<p class="eye-sr" data-eye="live" aria-live="polite"></p>' +
      "</div>";
    if (blink) {
      blink.innerHTML =
        '<span class="eye-blink-mark" aria-hidden="true">' + EYE_MARK + "</span>" +
        "<p>Close until the lashes meet, pause, then open. Do that three times. The lesson stays paused until you press Done.</p>" +
        '<button type="button" data-act="blink-done">Done</button>';
    }
    var overlay = document.createElement("div");
    overlay.id = "eyeOverlay";
    overlay.className = "eye-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="eye-rest" role="dialog" aria-modal="true" aria-labelledby="eyeRestTitle" tabindex="-1">' +
        '<p class="eye-kicker" data-eye="kicker"></p>' +
        '<h2 id="eyeRestTitle" data-eye="title"></h2>' +
        '<p class="eye-copy" data-eye="body"></p>' +
        '<p class="eye-rule">The lesson stays paused until this exercise is finished.</p>' +
        '<div class="eye-stage" data-eye="stage"></div>' +
        '<p class="eye-count" data-eye="count" aria-hidden="true"></p>' +
        '<p class="eye-hold" data-eye="hold"></p>' +
        '<div class="eye-steps" data-eye="steps"></div>' +
        '<div class="eye-rest-actions">' +
          '<button type="button" id="eyeSnooze" data-eye="snooze" hidden>In 3 minutes</button>' +
          '<button type="button" id="eyeDismiss" data-eye="dismiss" hidden>Close for now</button>' +
          '<button type="button" id="eyeCancel" data-eye="cancel" hidden>Stop</button>' +
        "</div>" +
        '<p class="eye-sr" data-eye="announce" aria-live="assertive"></p>' +
      "</div>";
    document.body.appendChild(overlay);
    ui.overlay = overlay;
    ui.dialog = overlay.querySelector(".eye-rest");
    var filter = document.createElement("div");
    filter.id = "eyeFilter";
    filter.setAttribute("aria-hidden", "true");
    filter.innerHTML = '<div class="eye-dim"></div><div class="eye-warm"></div>';
    document.body.appendChild(filter);
    grab();
    rail.addEventListener("click", onRailClick);
    rail.addEventListener("input", onRailInput);
    rail.addEventListener("change", onRailInput);
    if (blink) blink.addEventListener("click", function (event) {
      var btn = event.target.closest("button");
      if (btn && btn.getAttribute("data-act") === "blink-done") closeBlink(true);
    });
    overlay.addEventListener("click", function (event) {
      var btn = event.target.closest("button");
      if (!btn) return;
      var name = btn.getAttribute("data-eye");
      if (name === "snooze") snoozeRest();
      if (name === "dismiss") dismissRest();
      if (name === "cancel") cancelRest();
    });
    return true;
  }

  function meter(label, key) {
    return '<div class="eye-meter"><div class="eye-meter-top"><span>' + label + '</span><span data-eye="' + key + '-left"></span></div>' +
      '<div class="eye-bar"><span data-eye="' + key + '-bar"></span></div></div>';
  }

  function seg(key, pairs) {
    var html = '<div class="eye-seg" role="group">';
    var i;
    for (i = 0; i < pairs.length; i++) {
      html += '<button type="button" data-set="' + key + '" data-value="' + pairs[i][0] + '">' + pairs[i][1] + "</button>";
    }
    return html + "</div>";
  }

  function drill(kind, label) {
    return '<button type="button" data-act="drill" data-kind="' + kind + '">' + label + '<span data-eye="dur-' + kind + '"></span></button>';
  }

  function grab() {
    var nodes = document.querySelectorAll("[data-eye]");
    var i;
    ui.nodes = {};
    for (i = 0; i < nodes.length; i++) ui.nodes[nodes[i].getAttribute("data-eye")] = nodes[i];
  }

  function cast(key, raw) {
    if (key === "sound") return raw === "true";
    if (key === "strictness" || key === "warmthMode" || key === "tint") return raw;
    return Number(raw);
  }

  function onRailClick(event) {
    var btn = event.target.closest("button");
    if (!btn) return;
    var set = btn.getAttribute("data-set");
    if (set) {
      settings[set] = cast(set, btn.getAttribute("data-value"));
      normalize();
      save(true);
      paint();
      return;
    }
    var act = btn.getAttribute("data-act");
    if (act === "shrink") setCollapsed(true);
    else if (act === "expand") setCollapsed(false);
    else if (act === "menu") {
      ui.menu = !ui.menu;
      show(ui.nodes.menu, ui.menu);
      btn.setAttribute("aria-expanded", ui.menu ? "true" : "false");
    } else if (act === "drill") {
      ui.menu = false;
      show(ui.nodes.menu, false);
      if (ui.nodes["menu-btn"]) ui.nodes["menu-btn"].setAttribute("aria-expanded", "false");
      startRest(btn.getAttribute("data-kind"), false);
    } else if (act === "go") onGo();
    else if (act === "away") {
      ui.away = !ui.away;
      state.stretchMs = 0;
      save(true);
      paint();
    } else if (act === "distance") {
      settings.distanceSeen = true;
      save(true);
      paint();
    } else if (act === "power") onPower();
  }

  function onRailInput(event) {
    var input = event.target;
    if (!input || !input.getAttribute) return;
    var set = input.getAttribute("data-set");
    if (set !== "dim" && set !== "warmthScale") return;
    settings[set] = Number(input.value);
    normalize();
    applyFilter(Date.now());
    text("dim-label", dimLabel(settings.dim));
    text("scale-label", settings.warmthScale + "%");
    if (ui.nodes.scale) ui.nodes.scale.disabled = settings.warmthMode === "off";
    save(false);
  }

  function onGo() {
    var current = mode();
    if (current === "off") {
      settings.enabled = true;
      ui.powerArm = 0;
      save(true);
      paint();
      return;
    }
    if (current === "away") {
      ui.away = false;
      save(true);
      paint();
      return;
    }
    startRest("points", false);
  }

  function onPower() {
    if (!settings.enabled) {
      settings.enabled = true;
      ui.powerArm = 0;
      save(true);
      paint();
      return;
    }
    var now = Date.now();
    if (ui.powerArm && now - ui.powerArm < 6000) {
      settings.enabled = false;
      ui.powerArm = 0;
      ui.deferUntil = 0;
      if (ui.blinkOpen) closeBlink(false);
      save(true);
      paint();
      return;
    }
    ui.powerArm = now;
    paint();
  }

  function setCollapsed(value) {
    ui.collapsed = !!value;
    var narrow = window.matchMedia("(max-width: 1180px)").matches;
    if (!narrow) settings.collapsed = ui.collapsed;
    save(true);
    applyChrome();
  }

  function applyChrome() {
    var rail = document.getElementById("eyeRail");
    if (!rail) return;
    rail.classList.toggle("is-collapsed", ui.collapsed);
    show(ui.nodes.full, !ui.collapsed);
    show(ui.nodes["mini-btn"], ui.collapsed);
    if (ui.nodes["mini-btn"]) ui.nodes["mini-btn"].setAttribute("aria-expanded", ui.collapsed ? "false" : "true");
  }

  function paint() {
    applyPalette();
    var current = mode();
    var next = nextBreak();
    var rail = document.getElementById("eyeRail");
    var progress = next.every ? 1 - next.left / next.every : 0;
    if (rail) {
      rail.dataset.mode = current;
      rail.classList.toggle("is-soon", current === "watch" && next.left < 60000);
      rail.classList.toggle("is-due", (current === "watch" || current === "defer") && next.left < 10000);
    }
    text("status", STATUS[current] || "On");
    text("clock", current === "rest" && ui.rest ? bigCount(Math.max(0, ui.rest.endsAt - Date.now())) : clock(next.left));
    text("next", current === "off" ? "Paused" : current === "away" ? "Timer paused" : current === "rest" ? "Resting" : next.name);
    text("mini", clock(next.left));
    text("mini-name", current === "away" ? "Away" : current === "off" ? "Off" : "Eyes");
    text("screen", hm(state.screenMs));
    text("looks", String(state.lookCount));
    text("longs", String(state.longCount));
    text("blinks", String(state.blinkCount));
    text("longest", "Longest stretch today " + hm(state.longestMs));
    bar("blink", state.blinkMs, settings.blinkEvery);
    bar("look", state.lookMs, settings.lookEvery);
    bar("long", state.longMs, settings.longEvery);
    var go = current === "off" ? "Start protection" : current === "away" ? "I'm back" : "Press the points";
    text("go", go);
    show(ui.nodes.away, current === "watch" || current === "defer");
    show(ui.nodes.defer, current === "defer");
    text("defer", ui.deferKind === "type" ? "The break starts when you finish typing" : "The break starts when the reading ends");
    show(ui.nodes.distance, !settings.distanceSeen);
    text("dim-label", dimLabel(settings.dim));
    text("scale-label", settings.warmthScale + "%");
    if (ui.nodes.dim && document.activeElement !== ui.nodes.dim) ui.nodes.dim.value = String(settings.dim);
    if (ui.nodes.scale && document.activeElement !== ui.nodes.scale) ui.nodes.scale.value = String(settings.warmthScale);
    if (ui.nodes.scale) ui.nodes.scale.disabled = settings.warmthMode === "off";
    text("dur-look", shortDur(drillMs("look")));
    text("dur-blink", shortDur(drillMs("blink")));
    text("dur-palm", shortDur(drillMs("palm")));
    text("dur-eight", shortDur(drillMs("eight")));
    text("dur-near", shortDur(drillMs("near")));
    text("dur-gaze", shortDur(drillMs("gaze")));
    text("dur-points", shortDur(drillMs("points")));
    text("dur-orbit", shortDur(drillMs("orbit")));
    text("dur-long", shortDur(drillMs("long")));
    text("strict-note", "While this is on, a lesson pauses until the eye exercise is finished. A scheduled break cannot be skipped.");
    text("power", !settings.enabled ? "Start protection" : ui.powerArm && Date.now() - ui.powerArm < 6000 ? "Stopping means breaks will not come" : "Stop protection");
    if (ui.nodes.ring) ui.nodes.ring.style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, progress))));
    markPressed();
    var live = (STATUS[current] || "") + ". Next: " + next.name;
    if (ui.live !== live) {
      ui.live = live;
      text("live", live);
    }
  }

  function bar(key, value, every) {
    var left = Math.max(0, every - value);
    text(key + "-left", clock(left));
    var node = ui.nodes[key + "-bar"];
    if (!node) return;
    var width = every ? Math.max(0, Math.min(100, (value / every) * 100)) : 0;
    node.style.width = width + "%";
  }

  function markPressed() {
    var buttons = document.querySelectorAll("#eyeRail button[data-set]");
    var i;
    for (i = 0; i < buttons.length; i++) {
      var key = buttons[i].getAttribute("data-set");
      var on = String(settings[key]) === String(cast(key, buttons[i].getAttribute("data-value")));
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function rollDay(now) {
    var key = todayKey(new Date(now));
    if (key === state.day) return;
    state.day = key;
    state.screenMs = 0;
    state.lookCount = 0;
    state.longCount = 0;
    state.blinkCount = 0;
    state.longestMs = state.stretchMs;
    save(true);
  }

  function tick() {
    var now = Date.now();
    rollDay(now);
    var dt = now - ui.lastTick;
    ui.lastTick = now;
    if (dt < 0) dt = 0;
    if (dt > 5000) dt = 5000;
    applyFilter(now);
    if (!document.hidden && settings.enabled && !ui.away && !ui.rest) {
      state.screenMs += dt;
      state.lookMs += dt;
      state.blinkMs += dt;
      state.longMs += dt;
      state.stretchMs += dt;
      if (state.stretchMs > state.longestMs) state.longestMs = state.stretchMs;
      ui.sinceSave += dt;
      consider(now);
    }
    if (ui.rest && !document.hidden) pump(now);
    if (ui.powerArm && now - ui.powerArm >= 6000) ui.powerArm = 0;
    if (ui.sinceSave > 10000) {
      ui.sinceSave = 0;
      save(false);
    }
    applyStudyLock();
    paint();
  }

  function consider(now) {
    if (!settings.enabled || ui.away || ui.rest || document.hidden) return;
    var longDue = state.longMs >= settings.longEvery && now >= ui.snoozeLong;
    var lookDue = state.lookMs >= settings.lookEvery && now >= ui.snoozeLook;
    var kind = longDue ? "long" : lookDue ? "look" : "";
    if (kind) {
      ui.deferUntil = 0;
      startRest(kind, true);
      return;
    }
    ui.deferUntil = 0;
    if (ui.blinkOpen) return;
    if (state.blinkMs >= settings.blinkEvery) openBlink();
  }

  function mandatoryLook() {
    var ids = ["jingming", "yuyao", "taiyang", "chengqi"];
    var each = 7000;
    return [
      { id: "look", ms: settings.lookFor },
      { id: "points", ms: ids.length * each, each: each, ids: ids },
      { id: "orbit", ms: 12000 },
      { id: "blink", ms: 12000 }
    ];
  }

  function openBlink() {
    var blink = document.getElementById("eyeBlink");
    if (!blink || ui.rest) return;
    ui.blinkOpen = true;
    ui.blinkLocked = !!settings.enabled;
    blink.hidden = false;
    window.clearTimeout(ui.blinkTimer);
    if (ui.blinkLocked) {
      holdLesson();
      applyStudyLock();
      return;
    }
    ui.blinkTimer = window.setTimeout(function () { closeBlink(false); }, 14000);
  }

  function closeBlink(confirmed) {
    var blink = document.getElementById("eyeBlink");
    if (!ui.blinkOpen) return;
    ui.blinkOpen = false;
    ui.blinkLocked = false;
    window.clearTimeout(ui.blinkTimer);
    state.blinkMs = 0;
    if (confirmed) state.blinkCount += 1;
    if (blink) blink.hidden = true;
    if (!ui.rest) releaseLesson();
    save(true);
    applyStudyLock();
    paint();
  }

  function startRest(kind, scheduled) {
    if (ui.rest) return;
    if (!settings.enabled && scheduled) return;
    if (!takeLock()) return;
    var steps = kind === "long"
      ? planLong(settings.longFor)
      : (scheduled && settings.enabled && kind === "look" ? mandatoryLook() : [{ id: kind, ms: drillMs(kind) }]);
    var now = Date.now();
    var rest = {
      id: TAB + "-" + now,
      kind: kind,
      steps: steps,
      total: sumSteps(steps),
      started: now,
      endsAt: now + sumSteps(steps),
      phase: "run",
      origin: true,
      scheduled: !!scheduled,
      locked: !!(scheduled && settings.enabled),
      held: false,
      shown: ""
    };
    rest.endsAt = now + rest.total;
    ui.rest = rest;
    ui.deferUntil = 0;
    state.stretchMs = 0;
    ui.returnFocus = document.activeElement;
    if (ui.blinkOpen) {
      ui.blinkOpen = false;
      ui.blinkLocked = false;
      window.clearTimeout(ui.blinkTimer);
      var blink = document.getElementById("eyeBlink");
      if (blink) blink.hidden = true;
    }
    rest.held = holdLesson();
    openOverlay(rest);
    if (!document.hidden) chime("start");
    publish({ type: "rest", rest: publicRest(rest) });
    watchRest();
    pump(now);
    save(true);
    paint();
  }

  function publicRest(rest) {
    return {
      id: rest.id,
      kind: rest.kind,
      steps: rest.steps,
      total: rest.total,
      started: rest.started,
      endsAt: rest.endsAt,
      scheduled: rest.scheduled,
      locked: !!rest.locked
    };
  }

  function adopt(raw) {
    if (!raw || !raw.id || !raw.steps || !raw.steps.length) return;
    if (ui.rest) return;
    if (raw.endsAt < Date.now() - 800) return;
    ui.rest = {
      id: raw.id,
      kind: raw.kind,
      steps: raw.steps,
      total: raw.total || sumSteps(raw.steps),
      started: raw.started,
      endsAt: raw.endsAt,
      phase: "run",
      origin: false,
      scheduled: !!raw.scheduled,
      locked: !!raw.scheduled,
      held: holdLesson(),
      shown: ""
    };
    ui.deferUntil = 0;
    ui.returnFocus = document.activeElement;
    openOverlay(ui.rest);
    if (!document.hidden) chime("start");
    watchRest();
    pump(Date.now());
    paint();
  }

  function openOverlay(rest) {
    syncActions(rest);
    ui.overlay.hidden = false;
    var app = document.getElementById("app");
    if (app && "inert" in HTMLElement.prototype) app.inert = true;
    if (ui.dialog && ui.dialog.focus) ui.dialog.focus();
    applyStudyLock();
  }

  function closeOverlay() {
    if (ui.overlay) ui.overlay.hidden = true;
    var app = document.getElementById("app");
    if (app && "inert" in HTMLElement.prototype) app.inert = false;
    if (ui.returnFocus && ui.returnFocus.focus && document.contains(ui.returnFocus)) {
      try { ui.returnFocus.focus(); } catch (err) {}
    }
    ui.returnFocus = null;
    applyStudyLock();
  }

  function syncActions(rest) {
    var done = rest.phase === "done";
    show(ui.nodes.snooze, !done && canSnooze(rest));
    show(ui.nodes.dismiss, !done && rest.scheduled && settings.strictness === "gentle" && !rest.locked && !settings.enabled);
    show(ui.nodes.cancel, !done && !rest.scheduled);
    if (canSnooze(rest)) {
      var label = settings.strictness === "gentle" || rest.kind === "long" ? "In 5 minutes" : "In 3 minutes";
      text("snooze", label);
    }
  }

  function canSnooze(rest) {
    if (!rest || !rest.scheduled || rest.phase === "done") return false;
    if (rest.locked || settings.enabled) return false;
    if (settings.strictness === "strict") return false;
    if (settings.strictness === "gentle") return true;
    if (rest.kind === "long") return !ui.longSnoozed;
    return !ui.lookSnoozed;
  }

  function watchRest() {
    if (ui.watching) return;
    ui.watching = true;
    var frame = function () {
      try {
        if (ui.rest) pump(Date.now());
      } catch (err) {}
      if (ui.rest) window.requestAnimationFrame(frame);
      else ui.watching = false;
    };
    window.requestAnimationFrame(frame);
  }

  function pump(now) {
    var rest = ui.rest;
    if (!rest) return;
    if (document.hidden && rest.phase === "run") {
      if (!rest.shown) renderRun(rest, now);
      return;
    }
    if (rest.phase === "done") {
      renderDone(rest);
      if (now >= rest.doneUntil) finalize(rest);
      return;
    }
    var left = rest.endsAt - now;
    if (left <= 0) {
      if (rest.origin) enterDone(rest, now);
      else if (!rest.waitDone) rest.waitDone = now + 1600;
      else if (now >= rest.waitDone) quietClose(rest.id);
      return;
    }
    renderRun(rest, now);
  }

  function enterDone(rest, now) {
    rest.phase = "done";
    rest.doneUntil = now + 1400;
    chime("end");
    renderDone(rest);
  }

  function renderRun(rest, now) {
    var pos = stepAt(rest, now);
    var token = pos.index + ":" + pos.step.id;
    if (rest.shown !== token) {
      rest.shown = token;
      rest.pointShown = -1;
      buildStage(pos.step, rest);
      trail(rest, pos.index);
      var copy = COPY[pos.step.id] || COPY.look;
      text("kicker", copy[0]);
      text("title", copy[1]);
      text("body", stillMotion() && pos.step.id === "eight" ? "Keep your head still and trace a slow figure eight with your eyes." : copy[2]);
      text("announce", copy[1] + ". " + copy[2]);
      ui.overlay.classList.remove("is-look", "is-palm", "is-work", "is-points", "is-done");
      ui.overlay.classList.add(pos.step.id === "palm" ? "is-palm" : pos.step.id === "look" ? "is-look" : (pos.step.id === "points" || pos.step.id === "orbit") ? "is-points" : "is-work");
      syncActions(rest);
    }
    text("count", bigCount(rest.endsAt - now));
    var held = rest.held || lessonHeld();
    text("hold", held ? "Reading is paused. It resumes from here when you finish." : "");
    moveStage(pos, now);
  }

  function renderDone(rest) {
    if (rest.shown === "done") return;
    rest.shown = "done";
    text("kicker", "Break");
    text("title", "You can return to the screen");
    text("body", "Blink once, then continue.");
    text("count", "");
    text("hold", rest.held || lessonHeld() ? "Playback resumes from here." : "");
    text("announce", "You can return to the screen");
    if (ui.nodes.stage) ui.nodes.stage.innerHTML = "";
    if (ui.nodes.steps) ui.nodes.steps.innerHTML = "";
    ui.overlay.classList.remove("is-look", "is-palm", "is-work", "is-points");
    ui.overlay.classList.add("is-done");
    syncActions(rest);
  }

  function buildStage(step) {
    var stage = ui.nodes.stage;
    if (!stage) return;
    var html = "";
    if (step.id === "look") {
      html = '<div class="eye-far"><strong>6 m</strong><span>Past the screen</span></div>';
    } else if (step.id === "points" || step.id === "orbit") {
      html = '<div class="eye-face-card is-live">' + faceSvg(true) + '<p class="eye-press" data-eye="press"></p></div>';
    } else if (step.id === "blink") {
      html = '<div class="eye-lidbox" aria-hidden="true"><div class="eye-lid-shape"><i class="top"></i><i class="bot"></i></div></div><p class="eye-beat" data-eye="beat"></p>';
    } else if (step.id === "palm") {
      html = '<p class="eye-breath" data-eye="breath">In</p>';
    } else if (step.id === "eight") {
      html = '<div class="eye-eight"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + eightPath() + '" fill="none" stroke="rgba(20,33,31,0.28)" stroke-width="1.4"></path></svg>' +
        (stillMotion() ? "" : '<i class="eye-dot" data-eye="dot"></i>') + "</div>";
    } else if (step.id === "near") {
      html = '<div class="eye-near"><p data-eye="far">Far</p><p data-eye="near">Near</p></div>';
    } else if (step.id === "gaze") {
      html = '<div class="eye-gaze"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="none" stroke="rgba(20,33,31,0.22)" stroke-width="1.2"></circle></svg>' +
        '<i class="eye-dot" data-eye="dot"></i><p class="eye-gaze-name" data-eye="gaze-name">Up</p></div>';
    }
    stage.innerHTML = html;
    grab();
  }

  function faceNode() {
    return ui.nodes.stage ? ui.nodes.stage.querySelector(".eye-face") : null;
  }

  function markFace(id) {
    var stage = ui.nodes.stage;
    if (!stage) return;
    var dots = stage.querySelectorAll(".face-point");
    var i;
    for (i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("is-on", dots[i].getAttribute("data-point") === id);
    }
  }

  function placeFinger(node, cx, angle) {
    if (!node) return;
    node.setAttribute("cx", (cx + Math.cos(angle) * 24).toFixed(1));
    node.setAttribute("cy", (114 + Math.sin(angle) * 15).toFixed(1));
  }

  function moveStage(pos) {
    var step = pos.step;
    var rest = ui.rest;
    if (step.id === "points") {
      var ids = stepPointIds(step);
      var each = step.each || Math.max(1, Math.round(step.ms / ids.length));
      var index = Math.min(ids.length - 1, Math.floor(pos.into / each));
      if (!rest || rest.pointShown !== index) {
        if (rest) rest.pointShown = index;
        var point = pointById(ids[index]);
        text("kicker", "Point " + (index + 1) + " of " + ids.length);
        text("title", point.name);
        text("body", point.place + ". " + point.how);
        text("announce", point.name + ". " + point.place + ". " + point.how);
        markFace(point.id);
        if (faceNode()) faceNode().classList.remove("is-orbit");
      }
      text("press", (pos.into % 2800) < 1700 ? "Press" : "Ease off");
      return;
    }
    if (step.id === "orbit") {
      if (!rest || rest.pointShown !== "orbit") {
        if (rest) rest.pointShown = "orbit";
        text("kicker", COPY.orbit[0]);
        text("title", COPY.orbit[1]);
        text("body", COPY.orbit[2]);
        text("announce", COPY.orbit[1] + ". " + COPY.orbit[2]);
        markFace("");
        if (faceNode()) faceNode().classList.add("is-orbit");
      }
      var laps = 3;
      var period = Math.max(1, step.ms / laps);
      var turn = (pos.into % period) / period * Math.PI * 2;
      var lap = Math.min(laps, Math.floor(pos.into / period) + 1);
      text("press", "Lap " + lap + " of " + laps);
      placeFinger(ui.nodes["finger-l"], 74, -turn);
      placeFinger(ui.nodes["finger-r"], 146, Math.PI + turn);
      return;
    }
    if (step.id === "blink") {
      var n = Math.min(5, Math.floor(pos.into / step.ms * 5) + 1);
      text("beat", n + " / 5");
    } else if (step.id === "palm") {
      text("breath", (pos.into % 10000) < 4000 ? "In" : "Out");
    } else if (step.id === "eight" && ui.nodes.dot) {
      var p = eightPoint((pos.into / 4000) * Math.PI * 2);
      ui.nodes.dot.style.left = (50 + p.x * 34) + "%";
      ui.nodes.dot.style.top = (50 + p.y * 42) + "%";
    } else if (step.id === "near") {
      var far = Math.floor(pos.into / 8000) % 2 === 0;
      if (ui.nodes.far) ui.nodes.far.classList.toggle("is-on", far);
      if (ui.nodes.near) ui.nodes.near.classList.toggle("is-on", !far);
    } else if (step.id === "gaze" && ui.nodes.dot) {
      var index = Math.min(7, Math.floor(pos.into / step.ms * 8));
      var gaze = GAZE[index];
      var rad = gaze[1] * Math.PI / 180;
      ui.nodes.dot.style.left = (50 + Math.cos(rad) * 38) + "%";
      ui.nodes.dot.style.top = (50 + Math.sin(rad) * 38) + "%";
      text("gaze-name", gaze[0]);
    }
  }

  function trail(rest, index) {
    var node = ui.nodes.steps;
    if (!node) return;
    if (rest.steps.length < 2) {
      node.innerHTML = "";
      return;
    }
    var html = "";
    var i;
    for (i = 0; i < rest.steps.length; i++) {
      var name = (COPY[rest.steps[i].id] || [""])[0];
      var cls = i === index ? "is-on" : i < index ? "is-done" : "";
      html += '<span class="' + cls + '">' + name + "</span>";
    }
    node.innerHTML = html;
  }

  function applyCounts(rest) {
    state.blinkMs = 0;
    state.stretchMs = 0;
    state.lookMs = 0;
    ui.lookSnoozed = false;
    if (rest.kind === "blink") {
      state.blinkCount += 1;
      return;
    }
    if (rest.kind === "long") {
      state.longMs = 0;
      state.longCount += 1;
      state.blinkCount += 1;
      ui.longSnoozed = false;
      return;
    }
    state.lookCount += 1;
  }

  function meterMessage() {
    return {
      lookMs: state.lookMs,
      blinkMs: state.blinkMs,
      longMs: state.longMs,
      lookCount: state.lookCount,
      longCount: state.longCount,
      blinkCount: state.blinkCount,
      snoozeLook: ui.snoozeLook,
      snoozeLong: ui.snoozeLong,
      lookSnoozed: ui.lookSnoozed,
      longSnoozed: ui.longSnoozed
    };
  }

  function finalize(rest) {
    if (ui.rest !== rest) return;
    if (rest.origin) {
      applyCounts(rest);
      var msg = meterMessage();
      msg.type = "done";
      msg.id = rest.id;
      publish(msg);
    }
    ui.rest = null;
    closeOverlay();
    releaseLesson();
    save(true);
    paint();
  }

  function dropRest() {
    ui.rest = null;
    closeOverlay();
    releaseLesson();
    paint();
  }

  function snoozeRest() {
    var rest = ui.rest;
    if (!rest || !canSnooze(rest)) return;
    var delay = settings.strictness === "gentle" || rest.kind === "long" ? 5 * 60000 : 3 * 60000;
    var until = Date.now() + delay;
    ui.snoozeLook = until;
    state.lookMs = Math.max(0, settings.lookEvery - delay);
    ui.lookSnoozed = settings.strictness !== "gentle";
    if (rest.kind === "long") {
      ui.snoozeLong = until;
      state.longMs = Math.max(0, settings.longEvery - delay);
      ui.longSnoozed = settings.strictness !== "gentle";
    }
    var msg = meterMessage();
    msg.type = "snooze";
    msg.id = rest.id;
    publish(msg);
    dropRest();
    save(true);
  }

  function dismissRest() {
    var rest = ui.rest;
    if (!rest || !rest.scheduled || rest.locked || settings.enabled || settings.strictness !== "gentle") return;
    state.lookMs = 0;
    state.blinkMs = 0;
    state.stretchMs = 0;
    if (rest.kind === "long") state.longMs = 0;
    var msg = meterMessage();
    msg.type = "dismiss";
    msg.id = rest.id;
    publish(msg);
    dropRest();
    save(true);
  }

  function cancelRest() {
    var rest = ui.rest;
    if (!rest || rest.scheduled || rest.phase === "done") return;
    publish({ type: "dismiss", id: rest.id });
    dropRest();
    save(true);
  }

  function quietClose(id) {
    if (!ui.rest || (id && ui.rest.id !== id)) return;
    dropRest();
  }

  function applyRemote(msg) {
    if (!msg) return;
    if (msg.lookMs != null) state.lookMs = msg.lookMs;
    if (msg.blinkMs != null) state.blinkMs = msg.blinkMs;
    if (msg.longMs != null) state.longMs = msg.longMs;
    if (msg.lookCount != null) state.lookCount = msg.lookCount;
    if (msg.longCount != null) state.longCount = msg.longCount;
    if (msg.blinkCount != null) state.blinkCount = msg.blinkCount;
    if (msg.snoozeLook != null) ui.snoozeLook = msg.snoozeLook;
    if (msg.snoozeLong != null) ui.snoozeLong = msg.snoozeLong;
    if (msg.lookSnoozed != null) ui.lookSnoozed = !!msg.lookSnoozed;
    if (msg.longSnoozed != null) ui.longSnoozed = !!msg.longSnoozed;
  }

  function onAir(event) {
    var msg = event.data;
    if (!msg || msg.tab === TAB) return;
    if (msg.type === "rest") adopt(msg.rest);
    if (msg.type === "done" || msg.type === "snooze" || msg.type === "dismiss") {
      applyRemote(msg);
      quietClose(msg.id);
      save(true);
    }
  }

  function onEscape() {
    if (!ui.rest || ui.rest.phase === "done") return;
    if (!ui.rest.scheduled) {
      cancelRest();
      return;
    }
    if (ui.rest.locked || settings.enabled) return;
    if (canSnooze(ui.rest)) {
      snoozeRest();
      return;
    }
    if (settings.strictness === "gentle") dismissRest();
  }

  function onKey(event) {
    if (!ui.rest) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== "Tab" || !ui.dialog) return;
    var list = ui.dialog.querySelectorAll("button:not([hidden])");
    if (!list.length) {
      event.preventDefault();
      return;
    }
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onHide() {
    var now = Date.now();
    if (document.hidden) {
      ui.hiddenAt = now;
      ui.lastTick = now;
      if (ui.rest && ui.rest.phase === "run") ui.rest.frozenLeft = Math.max(0, ui.rest.endsAt - now);
      save(true);
      return;
    }
    var away = ui.hiddenAt ? now - ui.hiddenAt : 0;
    ui.hiddenAt = 0;
    ui.lastTick = now;
    if (ui.rest && ui.rest.phase === "run") {
      var frozen = ui.rest.frozenLeft == null ? Math.max(0, ui.rest.endsAt - now) : ui.rest.frozenLeft;
      var countHidden = !(ui.rest.locked || settings.enabled);
      var left = Math.max(0, countHidden ? frozen - away : frozen);
      ui.rest.endsAt = now + left;
      ui.rest.started = ui.rest.endsAt - (ui.rest.total || sumSteps(ui.rest.steps));
      ui.rest.shown = "";
      if (left <= 0) {
        if (ui.rest.origin) enterDone(ui.rest, now);
        else quietClose(ui.rest.id);
      }
      return;
    }
    if (!settings.enabled || ui.away) return;
    if (away >= settings.longFor) {
      state.longMs = 0;
      state.lookMs = 0;
      state.blinkMs = 0;
      state.stretchMs = 0;
    } else if (away >= settings.lookFor) {
      state.lookMs = 0;
      state.blinkMs = 0;
      state.stretchMs = 0;
    } else if (away >= 8000) {
      state.blinkMs = 0;
      state.stretchMs = 0;
    }
    save(true);
    paint();
  }

  function boot() {
    if (!build()) return;
    load();
    ui.collapsed = !!settings.collapsed;
    applyChrome();
    try { ui.channel = new BroadcastChannel("japanese-study-eyes"); ui.channel.onmessage = onAir; } catch (err) { ui.channel = null; }
    window.addEventListener("storage", function (event) {
      if (event.key !== KEY + "-air" || !event.newValue) return;
      try { onAir({ data: JSON.parse(event.newValue) }); } catch (err) {}
    });
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", function () { save(true); });
    document.addEventListener("pointerdown", function () {
      if (ui.ctx && ui.ctx.state === "suspended") ui.ctx.resume();
    }, { passive: true });
    applyFilter(Date.now());
    applyStudyLock();
    paint();
    window.setInterval(tick, 250);
  }

  window.JapaneseStudyEyes = {
    blocking: studyBlocked
  };

  boot();
})();
