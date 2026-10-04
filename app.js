/* Sachkunde 34a Lerntrainer – Anwendungslogik
   Läuft ohne Backend und ohne Netzwerk. Fortschritt liegt in localStorage. */
(function () {
  "use strict";
  var SK = window.SK;
  var KEY = "sk34a.v1";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var QBY = {};
  SK.questions.forEach(function (q) { QBY[q.id] = q; });
  var CBY = {};
  SK.cases.forEach(function (c) { CBY[c.id] = c; });

  /* ================= Hilfsfunktionen ================= */
  function h(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return dstr(new Date()); }
  function addDays(s, n) { var p = s.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2] + n); return dstr(d); }
  function fmtDate(ts) { var d = new Date(ts); return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }
  function fmtDateTime(ts) { var d = new Date(ts); return fmtDate(ts) + ", " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + " Uhr"; }
  function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60); return (m >= 60 ? Math.floor(m / 60) + ":" + pad(m % 60) : m) + ":" + pad(sec % 60); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  var ICONS = {
    home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
    learn: "M4 5.5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5.5h-5a2 2 0 0 0-2 2",
    topics: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z",
    exam: "M12 7v5l3 2M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM9.5 2.5h5",
    oral: "M5 5h14v10H9l-4 4z",
    chart: "M4 20V10M10 20V4M16 20v-7M21 20H3",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    gear: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19 12l2-1.2-2-3.5-2.2.8-1.6-1L15 4.5h-4l-.3 2.6-1.6 1-2.1-.8-2 3.5L7 12l-2 1.2 2 3.5 2.1-.8 1.6 1 .3 2.6h4l.2-2.6 1.6-1 2.2.8 2-3.5z",
    check: "M5 12.5l4.5 4.5L19 7.5",
    x: "M6 6l12 12M18 6L6 18",
    q: "M9.5 9a2.6 2.6 0 1 1 3.8 2.3c-.8.5-1.3 1-1.3 2.2M12 17.5h.01",
    star: "M12 4l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z",
    flag: "M6 21V4M6 5h11l-2 3.5 2 3.5H6",
    play: "M8 5.5v13l10-6.5z",
    pause: "M8 5v14M16 5v14",
    stop: "M6.5 6.5h11v11h-11z",
    mic: "M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 12a6 6 0 0 0 12 0M12 18v3",
    sound: "M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11",
    arrow: "M5 12h14M13 6l6 6-6 6",
    back: "M19 12H5M11 6l-6 6 6 6",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    warn: "M12 4l9 16H3zM12 10v4.5M12 17.5h.01",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
    repeat: "M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5",
    down: "M12 4v12M6 11l6 6 6-6M5 20h14",
    up: "M12 20V8M6 13l6-6 6 6M5 4h14",
    trash: "M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13",
    cards: "M7 4h12v13H7zM4 8v12h12",
    search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20",
    bulb: "M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"
  };
  function icon(n, cls) {
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + ICONS[n] + '"/></svg>';
  }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 2600);
  }

  /* ================= Zustand und Speicherung ================= */
  var storageOk = true;
  function defaults() {
    return {
      v: 1, q: {}, errors: {}, days: {}, exams: [], exam: null, oral: {}, learned: {},
      goals: Object.assign({}, SK.defaultGoals),
      srs: { intervalsDays: SK.srsConfig.intervalsDays.slice() },
      settings: { tts: false, ttsAuto: false, autoplay: false, rec: false, stt: false, sttOk: false, voice: "", lang: "de-DE", rate: 1, anim: true, theme: "auto" },
      lastActive: 0
    };
  }
  function merge(base, inc) {
    Object.keys(inc || {}).forEach(function (k) {
      if (inc[k] && typeof inc[k] === "object" && !Array.isArray(inc[k]) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) merge(base[k], inc[k]);
      else base[k] = inc[k];
    });
    return base;
  }
  function loadState() {
    var s = defaults();
    try {
      localStorage.setItem(KEY + ".test", "1"); localStorage.removeItem(KEY + ".test");
      var raw = localStorage.getItem(KEY);
      if (raw) merge(s, JSON.parse(raw));
    } catch (e) { storageOk = false; }
    return s;
  }
  var S = loadState();
  function save() {
    S.lastActive = Date.now();
    if (!storageOk) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { storageOk = false; renderBanner(); }
  }
  var updateWorker = null;   // wartender Service Worker mit neuer App-Version
  function renderBanner() {
    var up = updateWorker ? '<div class="note note-info" role="status">' + icon("info") + '<div><strong>Neue Version geladen.</strong> Dein Lernfortschritt bleibt erhalten.<div class="actions"><button class="btn btn-sm btn-primary" data-a="update-now">Jetzt aktualisieren</button><button class="btn btn-sm btn-ghost" data-a="update-later">Später</button></div></div></div>' : "";
    $("#banner").innerHTML = up + (storageOk ? "" :
      '<div class="note note-warn" role="alert">' + icon("warn") + "<div><strong>Lokale Speicherung nicht verfügbar.</strong> Die App funktioniert weiter, aber dein Fortschritt geht möglicherweise beim Schließen verloren. Prüfe die Browser-Einstellungen (privater Modus, blockierte Website-Daten) oder sichere den Stand über „Fortschritt exportieren“.</div></div>");
  }
  function day(d) { d = d || today(); return S.days[d] || (S.days[d] = { neu: 0, wdh: 0, fehler: 0, muendlich: 0, total: 0, ok: 0 }); }
  function srs() { return Object.assign({}, SK.srsConfig, S.srs); }

  /* ================= Lernlogik ================= */
  function rec(id) { return S.q[id]; }
  function record(id, res, mode) {
    var r = S.q[id] || (S.q[id] = { a: 0, c: 0, w: 0, lvl: 0 });
    var cfg = srs(), t = today(), first = r.a === 0, d = day();
    r.a++; r.last = Date.now();
    if (res === "ok") {
      r.c++; r.lastOk = true; r.unsure = false;
      r.lvl = Math.min((r.lvl || 0) + 1, cfg.intervalsDays.length);
      r.due = addDays(t, cfg.intervalsDays[r.lvl - 1]);
    } else if (res === "unsure") {
      r.c++; r.lastOk = true; r.unsure = true; r.lvl = Math.min(r.lvl || 0, 1); r.due = addDays(t, cfg.unsureDelayDays);
    } else if (res === "partial") {
      r.lastOk = false; r.unsure = true; r.lvl = 0; r.due = addDays(t, cfg.unsureDelayDays);
    } else {
      r.w++; r.lastOk = false; r.lvl = 0; r.due = addDays(t, cfg.wrongDelayDays);
    }
    d.total++; if (res === "ok" || res === "unsure") d.ok++;
    if (mode !== "exam") { if (first) d.neu++; else d.wdh++; if (mode === "fehler") d.fehler++; }
    save();
  }
  function status(id) {
    var r = S.q[id], cfg = srs(), t = today();
    if (!r || !r.a) return "neu";
    if (r.w >= cfg.problemWrongCount && r.lvl < cfg.safeLevel) return "Problemfrage";
    if (r.unsure) return "unsicher";
    if (r.due && r.due <= t) return "heute wiederholen";
    if (r.due === addDays(t, 1)) return "morgen wiederholen";
    if (r.lvl >= cfg.safeLevel) return "sicher";
    return "geplant";
  }
  var STATUS_CHIP = { "neu": "info", "Problemfrage": "bad", "unsicher": "warn", "heute wiederholen": "warn", "morgen wiederholen": "neutral", "sicher": "ok", "geplant": "neutral" };
  function isDue(id) { var r = S.q[id]; return !!(r && r.a && r.due && r.due <= today()); }
  function dueIds() { return SK.questions.filter(function (q) { return isDue(q.id); }).map(function (q) { return q.id; }); }
  function errorIds() { return SK.questions.filter(function (q) { var r = S.q[q.id]; return r && r.a && r.lastOk === false; }).map(function (q) { return q.id; }); }

  function areaStats(aid) {
    var qs = SK.questions.filter(function (q) { return q.area === aid; });
    var tried = 0, ok = 0, safe = 0, cfg = srs();
    qs.forEach(function (q) { var r = S.q[q.id]; if (r && r.a) { tried++; if (r.lastOk) ok++; if (r.lvl >= cfg.safeLevel) safe++; } });
    var p = pct(ok, tried), lamp = "blau";
    if (tried >= 20) lamp = p >= 80 ? "gruen" : p >= 60 ? "gelb" : "rot";
    return { total: qs.length, tried: tried, ok: ok, safe: safe, pct: p, lamp: lamp };
  }
  var LAMP = {
    blau: { c: "info", t: "noch nicht ausreichend getestet", i: "q" },
    rot: { c: "bad", t: "unter 60 % – Lücken", i: "x" },
    gelb: { c: "warn", t: "60–79 % – ausbaufähig", i: "warn" },
    gruen: { c: "ok", t: "ab 80 % – sicher", i: "check" }
  };
  function totals() {
    var t = { tried: 0, ok: 0, att: 0, c: 0, w: 0, all: SK.questions.length, fav: 0, unsure: 0, skip: 0 };
    SK.questions.forEach(function (q) {
      var r = S.q[q.id]; if (!r) return;
      if (r.fav) t.fav++; if (r.skip) t.skip += r.skip;
      if (r.a) { t.tried++; if (r.lastOk) t.ok++; t.att += r.a; t.c += r.c; t.w += r.w; if (r.unsure) t.unsure++; }
    });
    return t;
  }
  function weakStrong() {
    var list = SK.areaOrder.map(function (id) { var s = areaStats(id); s.id = id; return s; }).filter(function (s) { return s.tried >= 5; });
    if (!list.length) return { weak: null, strong: null };
    list.sort(function (a, b) { return a.pct - b.pct; });
    return { weak: list[0], strong: list[list.length - 1] };
  }
  function streak() {
    var n = 0, d = today();
    if (!(S.days[d] && S.days[d].total)) d = addDays(d, -1);
    while (S.days[d] && (S.days[d].total || S.days[d].muendlich)) { n++; d = addDays(d, -1); }
    return n;
  }
  function oralCount() { return Object.keys(S.oral).filter(function (k) { return S.oral[k].n; }).length; }
  function readiness() {
    var full = S.exams.filter(function (e) { return !e.short; });
    var last3 = full.slice(-3);
    var lamps = SK.areaOrder.map(function (id) { return areaStats(id); });
    var prob = SK.questions.filter(function (q) { var r = S.q[q.id]; return r && r.w >= srs().problemWrongCount; });
    var probOk = prob.filter(function (q) { return S.q[q.id].lastOk; }).length;
    var c = [
      { t: "mindestens 3 vollständige Prüfungssimulationen abgeschlossen", ok: full.length >= 3, v: full.length + " von 3" },
      { t: "in den letzten 3 Simulationen jeweils mindestens 75 %", ok: last3.length === 3 && last3.every(function (e) { return e.pct >= 75; }), v: last3.length ? last3.map(function (e) { return e.pct + " %"; }).join(" · ") : "–" },
      { t: "kein Themenbereich unter 60 %", ok: lamps.every(function (s) { return s.tried >= 20 && s.pct >= 60; }), v: lamps.filter(function (s) { return s.tried >= 20 && s.pct >= 60; }).length + " von " + lamps.length + " Bereichen ausreichend getestet und ≥ 60 %" },
      { t: "mindestens 80 % der Problemfragen zuletzt richtig", ok: prob.length === 0 ? totals().tried > 0 : probOk / prob.length >= 0.8, v: prob.length ? pct(probOk, prob.length) + " % (" + probOk + " von " + prob.length + ")" : "keine Problemfragen" },
      { t: "mindestens 10 mündliche Fallbeispiele trainiert", ok: oralCount() >= 10, v: oralCount() + " von 10" }
    ];
    return { items: c, ready: c.every(function (x) { return x.ok; }) };
  }
  function nextStep() {
    var due = dueIds().length, ws = weakStrong(), t = totals(), d = day();
    if (!t.tried) return { t: "Starte mit deinen ersten Fragen", s: "Der Tagesmix stellt dir neue Fragen aus allen Sachgebieten zusammen.", a: "start-mix", b: "Jetzt lernen" };
    if (due >= 5) return { t: due + " Wiederholungen sind fällig", s: "Fällige Fragen zuerst – so bleibt Gelerntes im Gedächtnis.", a: "start-due", b: "Wiederholen" };
    if (ws.weak && ws.weak.pct < 60) return { t: "Schwachstelle: " + SK.areas[ws.weak.id].short, s: "Hier liegst du bei " + ws.weak.pct + " %. Arbeite gezielt an diesem Sachgebiet.", a: "start-area", arg: ws.weak.id, b: "Gezielt üben" };
    if (d.neu < S.goals.neu && t.tried < t.all) return { t: "Tagesziel: noch " + (S.goals.neu - d.neu) + " neue Fragen", s: "Erweitere deinen Wissensstand mit neuen Fragen.", a: "start-new", b: "Neue Fragen" };
    if (d.muendlich < S.goals.muendlich) return { t: "Mündliches Fallbeispiel trainieren", s: "Sprich eine Lösung laut durch und bewerte dich mit der Checkliste.", a: "go", arg: "#/muendlich", b: "Zum Falltraining" };
    return { t: "Prüfungssimulation unter Zeitdruck", s: "Teste deinen Stand mit " + SK.examConfig.questionCount + " Fragen in " + SK.examConfig.durationMinutes + " Minuten.", a: "go", arg: "#/pruefung", b: "Zur Simulation" };
  }

  /* ================= Sprachfunktionen (alle optional) ================= */
  var CAP = {
    tts: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    rec: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    stt: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
  var TTS = {
    voices: function () { try { return CAP.tts ? speechSynthesis.getVoices() : []; } catch (e) { return []; } },
    on: function () { return CAP.tts && S.settings.tts; },
    speak: function (text) {
      if (!this.on() || !text) return;
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text), vs = this.voices();
        u.lang = S.settings.lang || "de-DE"; u.rate = +S.settings.rate || 1;
        var v = vs.filter(function (x) { return x.name === S.settings.voice; })[0] || vs.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(u.lang.slice(0, 2).toLowerCase()) === 0; })[0];
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { toast("Vorlesen ist in diesem Browser gerade nicht möglich."); }
    },
    pause: function () { try { speechSynthesis.pause(); } catch (e) {} },
    resume: function () { try { speechSynthesis.resume(); } catch (e) {} },
    stop: function () { try { if (CAP.tts) speechSynthesis.cancel(); } catch (e) {} }
  };
  if (CAP.tts) { try { speechSynthesis.onvoiceschanged = function () { if (route().name === "einstellungen") render(); }; } catch (e) {} }

  var REC = { mr: null, chunks: [], url: "", t0: 0, timer: 0, stream: null, device: "", err: "" };
  function recHtml() {
    if (!S.settings.rec) return '<p class="hint">' + icon("mic") + ' Audioaufnahme ist ausgeschaltet. Du kannst sie unter <a href="#/einstellungen">Einstellungen → Sprache und Audio</a> aktivieren.</p>';
    if (!CAP.rec) return '<p class="hint">' + icon("info") + " Audioaufnahme wird von diesem Browser nicht unterstützt. Nutze stattdessen die Texteingabe.</p>";
    var rec = REC.mr && REC.mr.state === "recording";
    var o = '<div class="rec" id="rec">';
    o += rec ? '<button class="btn btn-danger" data-a="rec-stop">' + icon("stop") + 'Aufnahme stoppen</button><span class="rec-live" aria-live="off"><span class="dot"></span><span id="rec-time">0:00</span></span>'
      : '<button class="btn" data-a="rec-start">' + icon("mic") + (REC.url ? "Neu aufnehmen" : "Antwort aufnehmen") + "</button>";
    if (REC.device) o += '<span class="hint">Mikrofon: ' + h(REC.device) + "</span>";
    if (REC.url && !rec) o += '<audio controls src="' + REC.url + '"></audio><button class="btn btn-ghost" data-a="rec-del">' + icon("trash") + "Aufnahme löschen</button>";
    if (REC.err) o += '<p class="hint err" role="alert">' + icon("warn") + h(REC.err) + "</p>";
    else if (!REC.url && !rec) o += '<p class="hint">Der Browser fragt beim ersten Mal nach der Mikrofonberechtigung. Aufnahmen bleiben nur vorübergehend in diesem Tab und werden nicht gespeichert.</p>';
    return o + "</div>";
  }
  function recRefresh() { var e = $("#rec-slot"); if (e) e.innerHTML = recHtml(); }
  function recStart() {
    REC.err = "";
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recDel(true);
      REC.stream = stream; REC.chunks = [];
      var tr = stream.getAudioTracks()[0]; REC.device = tr ? tr.label || "Standardmikrofon" : "";
      REC.mr = new MediaRecorder(stream);
      REC.mr.ondataavailable = function (e) { if (e.data && e.data.size) REC.chunks.push(e.data); };
      REC.mr.onstop = function () {
        REC.url = URL.createObjectURL(new Blob(REC.chunks, { type: REC.mr.mimeType || "audio/webm" }));
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(REC.timer); recRefresh();
      };
      REC.mr.start(); REC.t0 = Date.now();
      REC.timer = setInterval(function () { var e = $("#rec-time"); if (e) e.textContent = fmtClock((Date.now() - REC.t0) / 1000); }, 500);
      recRefresh();
    }).catch(function (e) {
      REC.err = e && (e.name === "NotAllowedError" || e.name === "SecurityError")
        ? "Der Mikrofonzugriff wurde abgelehnt. Erlaube ihn in den Website-Einstellungen des Browsers oder nutze die Texteingabe."
        : "Es wurde kein nutzbares Mikrofon gefunden. Nutze die Texteingabe.";
      recRefresh();
    });
  }
  function recStop() { try { if (REC.mr && REC.mr.state === "recording") REC.mr.stop(); } catch (e) {} }
  function recDel(silent) {
    recStop(); clearInterval(REC.timer);
    if (REC.url) { try { URL.revokeObjectURL(REC.url); } catch (e) {} }
    REC.url = ""; REC.err = ""; if (!silent) recRefresh();
  }
  var STT = { r: null, on: false };
  function sttHtml() {
    if (!S.settings.stt) return "";
    if (!CAP.stt) return '<p class="hint">' + icon("info") + " Spracheingabe wird von diesem Browser nicht unterstützt. Bitte tippe deine Antwort.</p>";
    if (!S.settings.sttOk) return '<div class="note note-info">' + icon("info") + "<div>Die automatische Sprache-zu-Text-Erkennung kann je nach Browser einen Online-Dienst verwenden. Für vollständig offlinees Lernen nutze bitte die Audioaufnahme oder die Texteingabe.<br><button class=\"btn btn-sm\" data-a=\"stt-ok\">Verstanden, Spracheingabe nutzen</button></div></div>";
    return '<button class="btn btn-sm" data-a="stt-toggle">' + icon("mic") + (STT.on ? "Spracheingabe beenden" : "Spracheingabe starten") + "</button>";
  }
  function sttToggle() {
    if (STT.on) { try { STT.r.stop(); } catch (e) {} return; }
    try {
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      var r = (STT.r = new R()); r.lang = S.settings.lang || "de-DE"; r.continuous = true; r.interimResults = false;
      r.onresult = function (ev) {
        var ta = $("#answer-text"); if (!ta) return;
        for (var i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) ta.value += (ta.value ? " " : "") + ev.results[i][0].transcript.trim();
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      };
      r.onerror = function (ev) { toast(ev.error === "not-allowed" ? "Mikrofonzugriff abgelehnt – bitte Text eingeben." : "Spracheingabe nicht verfügbar (" + ev.error + "). Bitte Text eingeben."); };
      r.onend = function () { STT.on = false; var s = $("#stt-slot"); if (s) s.innerHTML = sttHtml(); };
      r.start(); STT.on = true; var s = $("#stt-slot"); if (s) s.innerHTML = sttHtml();
    } catch (e) { toast("Spracheingabe konnte nicht gestartet werden. Bitte Text eingeben."); }
  }
  function ttsBar(parts) {
    if (!S.settings.tts) return "";
    if (!CAP.tts) return '<p class="hint">' + icon("info") + " Vorlesen wird von diesem Browser nicht unterstützt.</p>";
    var o = '<div class="ttsbar" role="group" aria-label="Vorlesen">' + icon("sound");
    parts.forEach(function (p) { o += '<button class="btn btn-sm btn-ghost" data-a="tts" data-arg="' + p[0] + '">' + p[1] + "</button>"; });
    return o + '<span class="sep"></span><button class="btn btn-sm btn-ghost" data-a="tts-pause" aria-label="Vorlesen pausieren">' + icon("pause") + 'Pause</button><button class="btn btn-sm btn-ghost" data-a="tts-resume">' + icon("play") + 'Fortsetzen</button><button class="btn btn-sm btn-ghost" data-a="tts-stop">' + icon("stop") + "Stopp</button></div>";
  }

  /* ================= Bausteine ================= */
  function bar(p, cls, label) {
    return '<div class="bar ' + (cls || "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"' + (label ? ' aria-label="' + h(label) + '"' : "") + '><i style="width:' + Math.min(100, p) + '%"></i></div>';
  }
  function ring(p, label) {
    var c = 2 * Math.PI * 52;
    return '<div class="ring" role="img" aria-label="' + h(label) + '"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p / 100)).toFixed(1) + '"/></svg><div class="ring-num"><b>' + p + '</b><span>%</span></div></div>';
  }
  function chip(t, c, ic) { return '<span class="chip chip-' + (c || "neutral") + '">' + (ic ? icon(ic) : "") + h(t) + "</span>"; }
  function head(eyebrow, title, sub) {
    return '<header class="pagehead">' + (eyebrow ? '<p class="eyebrow">' + eyebrow + "</p>" : "") + "<h1>" + title + "</h1>" + (sub ? '<p class="lead">' + sub + "</p>" : "") + "</header>";
  }
  function goalRow(label, val, goal) {
    var done = goal > 0 && val >= goal;
    return '<div class="goal"><div class="goal-top"><span>' + label + '</span><span class="num">' + val + " / " + goal + (done ? " " + icon("check", "ic-ok") : "") + "</span></div>" + bar(goal ? pct(Math.min(val, goal), goal) : 0, done ? "bar-ok" : "", label) + "</div>";
  }
  function standNote() {
    return '<p class="stand">' + icon("info") + "<span><strong>Stand der Recherche: " + SK.RESEARCH_DATE + ".</strong> Gesetze, Prüfungsformate und Gebühren können sich ändern. Vor der Anmeldung und vor der Prüfung sind die aktuellen Angaben der zuständigen IHK zu überprüfen. Diese App ist eine Lernhilfe und ersetzt keine verbindliche Auskunft. <a href=\"#/quellen\">Quellen und Aktualität</a></span></p>";
  }

  /* ================= Gesetze verständlich ================= */
  // Zerlegt eine Fundstellenangabe ("§§ 859 Abs. 2, 860") in Paragrafen mit Absatz- und Nummernangaben.
  function parseRef(seg) {
    var items = [], cur = null, m;
    var re = /(Abs\.|Nr\.|Satz|Buchst\.)\s*([0-9]+[a-z]?|[a-z])(?:\s*(und|bis)\s*([0-9]+[a-z]?))?|(\d+)\s?[–-]\s?(\d+)|(\d+[a-z]?)/g;
    seg = seg.replace(/Nr\.\s*\d+(\.\d+)+/g, " ").replace(/(Abschnitt|Unterabschnitt)\s*\d+/g, " ")
      .replace(/Anlage\s*(\d+)/g, function (x, n) { items.push(cur = { n: "Anlage " + n }); return " "; });
    while ((m = re.exec(seg))) {
      if (m[1]) {
        if (!cur) continue;
        var list = [m[2]];
        if (m[4]) { if (m[3] === "bis") { for (var a = parseInt(m[2], 10) + 1; a <= parseInt(m[4], 10); a++) list.push(String(a)); } else list.push(m[4]); }
        if (m[1] === "Abs.") cur.abs = (cur.abs || []).concat(list);
        else if (m[1] === "Nr.") cur.nr = (cur.nr || []).concat(list);
      } else if (m[5]) {
        for (var k = +m[5]; k <= +m[6] && k - m[5] < 60; k++) items.push(cur = { n: String(k) });
      } else items.push(cur = { n: m[7] });
    }
    return items;
  }
  function hasLaw(seg, g) {
    var i = seg.indexOf(g);
    while (i >= 0) {
      var b = seg.charAt(i - 1), a = seg.charAt(i + g.length);
      if (!/[A-Za-zÄÖÜäöüß0-9]/.test(b) && !/[A-Za-zÄÖÜäöüß0-9]/.test(a)) return true;
      i = seg.indexOf(g, i + 1);
    }
    return false;
  }
  function overlap(a, b) { return !a || !b || a.some(function (x) { return b.indexOf(x) >= 0; }); }
  // Findet zu einer Fundstellenangabe ("§§ 32, 34 StGB; § 127 Abs. 1 StPO") die hinterlegten Paragrafen.
  function lawsFor(ref, max) {
    var hits = [];
    String(ref || "").split(";").forEach(function (seg) {
      (SK.laws || []).forEach(function (L) {
        if (hits.indexOf(L) >= 0 || !hasLaw(seg, L.g)) return;
        if (!L._p) L._p = parseRef(L.k.replace(L.g, " "))[0] || { n: L.n };
        var ok = parseRef(seg.replace(L.g, " ")).some(function (it) { return it.n === L.n && overlap(it.abs, L._p.abs) && overlap(it.nr, L._p.nr); });
        if (ok) hits.push(L);
      });
    });
    return hits.slice(0, max || 2);
  }
  function lawHtml(L) {
    return '<details class="law"><summary>' + icon("bulb") + '<span class="law-k">' + h(L.k) + '</span><span class="law-t">' + h(L.t) + '</span></summary><div class="law-body"><p class="law-e">' + h(L.e) + '</p><details class="law-w"><summary>Wortlaut anzeigen</summary><blockquote>' + h(L.w) + '</blockquote><p class="law-src">Wortlaut: ' + h(L.h) + ", abgerufen am " + SK.RESEARCH_DATE + ". Die einfache Fassung ist eine Lernhilfe, nicht der Gesetzestext.</p></details></div></details>";
  }
  function lawBlock(ref, max) {
    var l = lawsFor(ref, max);
    return l.length ? '<div class="laws" aria-label="Einfach erklärt">' + l.map(lawHtml).join("") + "</div>" : "";
  }

  /* ================= Navigation ================= */
  var NAV = [
    ["#/", "Start", "home"], ["#/lernen", "Lernen", "learn"], ["#/themen", "Themen", "topics"],
    ["#/muendlich", "Mündlich", "oral"], ["#/pruefung", "Prüfung", "exam"],
    ["#/dashboard", "Fortschritt", "chart"], ["#/fragen", "Fragenkatalog", "list"], ["#/glossar", "Glossar", "book"],
    ["#/quellen", "Quellen", "link"], ["#/einstellungen", "Einstellungen", "gear"]
  ];
  var TAB = ["#/", "#/lernen", "#/pruefung", "#/muendlich"];
  function route() {
    var p = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    return { name: p[0] || "start", arg: p[1] ? decodeURIComponent(p[1]) : "" };
  }
  function renderNav() {
    var cur = "#/" + (route().name === "start" ? "" : route().name);
    if (route().name === "thema") cur = "#/themen";
    var li = function (n) { return '<a href="' + n[0] + '"' + (n[0] === cur ? ' aria-current="page"' : "") + ">" + icon(n[2]) + "<span>" + n[1] + "</span></a>"; };
    $("#railnav").innerHTML = NAV.slice(0, 5).map(li).join("") + '<hr>' + NAV.slice(5).map(li).join("");
    var tabs = NAV.filter(function (n) { return TAB.indexOf(n[0]) >= 0; });
    tabs.sort(function (a, b) { return TAB.indexOf(a[0]) - TAB.indexOf(b[0]); });
    var moreActive = TAB.indexOf(cur) < 0;
    $("#tabbar").innerHTML = tabs.map(li).join("") + '<button data-a="sheet"' + (moreActive ? ' aria-current="page"' : "") + ' aria-haspopup="true">' + icon("more") + "<span>Mehr</span></button>";
    $("#sheet-list").innerHTML = NAV.filter(function (n) { return TAB.indexOf(n[0]) < 0; }).map(li).join("");
  }

  /* ================= Ansicht: Start ================= */
  function viewStart() {
    var t = totals(), d = day(), due = dueIds().length, ws = weakStrong(), ns = nextStep();
    var last = S.exams[S.exams.length - 1], p = pct(t.ok, t.all);
    var o = head("Sachkundeprüfung § 34a GewO", "Dein Lernstand", "");
    o += '<section class="hero card"><div class="hero-ring">' + ring(p, "Lernfortschritt " + p + " Prozent") + '</div><div class="hero-body"><p class="eyebrow">Lernfortschritt</p><h2>' + t.ok + " von " + t.all + ' Fragen zuletzt richtig</h2><p class="muted">' + h(ns.t) + ". " + h(ns.s) + '</p><div class="actions"><button class="btn btn-primary btn-lg" data-a="start-mix">' + icon("play") + 'Jetzt lernen</button>' + (ns.a !== "start-mix" ? '<button class="btn btn-lg" data-a="' + ns.a + '" data-arg="' + h(ns.arg || "") + '">' + h(ns.b) + "</button>" : "") + "</div></div></section>";
    o += '<div class="grid g2">';
    o += '<section class="card"><h3>Heutiges Lernziel</h3>' + goalRow("Neue Fragen", d.neu, S.goals.neu) + goalRow("Wiederholungen", d.wdh, S.goals.wdh) + goalRow("Mündliche Fälle", d.muendlich, S.goals.muendlich) + '<p class="cardfoot"><a href="#/einstellungen">Tagesziele anpassen</a></p></section>';
    o += '<section class="card"><h3>Offene Wiederholungen</h3><p class="big num">' + due + '</p><p class="muted">' + (due ? "Fragen sind heute zur Wiederholung fällig." : "Heute ist nichts fällig.") + "</p>" + (due ? '<button class="btn" data-a="start-due">' + icon("repeat") + "Wiederholen</button>" : "") + "</section>";
    o += '<section class="card"><h3>Schwächster Themenbereich</h3>' + (ws.weak ? '<p class="big-s">' + h(SK.areas[ws.weak.id].short) + "</p>" + bar(ws.weak.pct, "bar-" + LAMP[ws.weak.lamp].c) + '<p class="muted">' + ws.weak.pct + " % der bearbeiteten Fragen zuletzt richtig</p><button class=\"btn\" data-a=\"start-area\" data-arg=\"" + ws.weak.id + '">Gezielt üben</button>' : '<p class="muted">Noch nicht genug Antworten für eine Auswertung. Ab fünf bearbeiteten Fragen je Bereich erscheint hier dein schwächstes Sachgebiet.</p>') + "</section>";
    o += '<section class="card"><h3>Letzter Prüfungstest</h3>' + (last ? '<p class="big num">' + last.pts + ' <span class="unit">/ ' + last.max + " Punkte</span></p><p>" + chip(last.pass ? "bestanden" : "nicht bestanden", last.pass ? "ok" : "bad", last.pass ? "check" : "x") + ' <span class="muted">' + fmtDate(last.ts) + (last.short ? " · Kurztest" : "") + "</span></p>" : '<p class="muted">Noch keine Simulation abgeschlossen.</p>') + '<a class="btn" href="#/pruefung">Zur Prüfungssimulation</a></section>';
    o += "</div>" + standNote();
    return o;
  }

  /* ================= Ansicht: Fortschritt ================= */
  function viewDash() {
    var t = totals(), d = day(), due = dueIds().length, ws = weakStrong(), rd = readiness(), ns = nextStep(), st = streak();
    var o = head("Auswertung", "Fortschritt", "Alle Werte stammen aus deinen eigenen Antworten auf diesem Gerät.");
    o += '<div class="grid g4 stats">';
    [["Gesamtfortschritt", pct(t.ok, t.all) + " %", t.ok + " von " + t.all + " zuletzt richtig"], ["Fragen beantwortet", t.att, t.tried + " verschiedene Fragen"], ["Richtige Antworten", t.c, pct(t.c, t.att) + " % aller Versuche"], ["Falsche Antworten", t.w, "Fehlerfragen offen: " + errorIds().length],
      ["Offene Wiederholungen", due, "heute fällig"], ["Lernserie", st + (st === 1 ? " Tag" : " Tage"), "in Folge gelernt"], ["Unsichere Fragen", t.unsure, "von dir markiert"], ["Mündliche Fälle", oralCount(), "von " + SK.cases.length + " trainiert"]].forEach(function (s) {
      o += '<div class="stat card"><span class="stat-l">' + s[0] + '</span><span class="stat-v num">' + s[1] + '</span><span class="stat-s">' + s[2] + "</span></div>";
    });
    o += "</div>";
    o += '<section class="card next"><div><p class="eyebrow">Nächster sinnvoller Lernschritt</p><h3>' + h(ns.t) + '</h3><p class="muted">' + h(ns.s) + '</p></div><button class="btn btn-primary" data-a="' + ns.a + '" data-arg="' + h(ns.arg || "") + '">' + h(ns.b) + icon("arrow") + "</button></section>";
    o += '<div class="grid g2"><section class="card"><h3>Tagesziel heute</h3>' + goalRow("Neue Fragen", d.neu, S.goals.neu) + goalRow("Wiederholungen", d.wdh, S.goals.wdh) + goalRow("Fehlertraining", d.fehler, S.goals.fehler) + goalRow("Mündliche Fälle", d.muendlich, S.goals.muendlich) + "</section>";
    o += '<section class="card"><h3>Stärken und Schwächen</h3><dl class="kv"><dt>Stärkster Bereich</dt><dd>' + (ws.strong ? h(SK.areas[ws.strong.id].short) + " · " + ws.strong.pct + " %" : "noch offen") + "</dd><dt>Schwächster Bereich</dt><dd>" + (ws.weak ? h(SK.areas[ws.weak.id].short) + " · " + ws.weak.pct + " %" : "noch offen") + "</dd><dt>Favoriten</dt><dd>" + t.fav + "</dd><dt>Übersprungen</dt><dd>" + t.skip + "</dd><dt>Letzte Aktivität</dt><dd>" + (S.lastActive ? fmtDateTime(S.lastActive) : "–") + "</dd></dl></section></div>";

    o += '<section class="card"><h3>Lernampel je Themenbereich</h3><p class="muted">Eine Farbe gibt es erst ab 20 unterschiedlichen bearbeiteten Fragen. Gewertet wird die jeweils letzte Antwort.</p><div class="lamps">';
    SK.areaOrder.forEach(function (id) {
      var s = areaStats(id), L = LAMP[s.lamp], a = SK.areas[id];
      o += '<a class="lamp" href="#/thema/' + id + '"><span class="lamp-dot lamp-' + L.c + '">' + icon(L.i) + '</span><span class="lamp-main"><b>' + a.part + " · " + h(a.short) + "</b>" + bar(s.pct, "bar-" + L.c, a.short) + '<span class="muted">' + (s.tried ? s.pct + " % · " : "") + s.tried + " von " + s.total + " bearbeitet · " + L.t + "</span></span></a>";
    });
    o += "</div></section>";

    var ec = SK.errorCauses.map(function (c) { return [c, S.errors[c] || 0]; }).sort(function (a, b) { return b[1] - a[1]; }), emax = Math.max(1, ec[0][1]);
    o += '<div class="grid g2"><section class="card"><h3>Häufigste Fehlerursachen</h3>';
    if (!ec[0][1]) o += '<p class="muted">Noch keine Fehlerursachen erfasst. Nach einer falschen Antwort kannst du die Ursache auswählen.</p>';
    else ec.forEach(function (e) { if (e[1]) o += '<div class="goal"><div class="goal-top"><span>' + h(e[0]) + '</span><span class="num">' + e[1] + "</span></div>" + bar(pct(e[1], emax), "bar-bad", e[0]) + "</div>"; });
    o += "</section>";
    o += '<section class="card"><h3>Letzte Prüfungsergebnisse</h3>';
    if (!S.exams.length) o += '<p class="muted">Noch keine Simulation abgeschlossen.</p>';
    else { o += '<ul class="rows">'; S.exams.slice(-6).reverse().forEach(function (e) { o += "<li><span>" + fmtDate(e.ts) + (e.short ? " · Kurztest" : "") + '</span><span class="num">' + e.pts + " / " + e.max + " · " + e.pct + " %</span>" + chip(e.pass ? "bestanden" : "nicht bestanden", e.pass ? "ok" : "bad", e.pass ? "check" : "x") + "</li>"; }); o += "</ul>"; }
    o += "</section></div>";

    o += '<section class="card"><h3>Prüfungsreife</h3><p>' + (rd.ready ? chip("gut vorbereitet", "ok", "check") : chip("noch nicht alle Kriterien erfüllt", "info", "q")) + '</p><ul class="checks">';
    rd.items.forEach(function (c) { o += '<li class="' + (c.ok ? "ok" : "open") + '">' + icon(c.ok ? "check" : "q") + "<span>" + h(c.t) + '<small class="muted">' + (c.ok ? "erfüllt" : "offen") + " · " + h(c.v) + "</small></span></li>"; });
    o += '</ul><p class="disclaimer">Dies ist eine interne Lernempfehlung und keine Garantie für das Bestehen der IHK-Prüfung.</p></section>';
    return o;
  }

  /* ================= Ansicht: Themen ================= */
  function viewThemen() {
    var o = head("Sieben Sachgebiete nach § 7 BewachV", "Themenbereiche", "Die Gliederung folgt dem DIHK-Rahmenplan. Die Fragenverteilung ist ein Lernvorschlag und keine offizielle IHK-Gewichtung.");
    SK.groups.forEach(function (g) {
      o += '<section class="group"><h2><span class="gnum">' + g.n + "</span>" + h(g.title) + '</h2><div class="grid ' + (g.areas.length > 1 ? "g2" : "") + '">';
      g.areas.forEach(function (id) {
        var a = SK.areas[id], s = areaStats(id), L = LAMP[s.lamp];
        o += '<a class="card topic" href="#/thema/' + id + '"><div class="topic-top"><span class="part">' + a.part + "</span>" + (a.oral ? chip("Schwerpunkt mündlich", "accent") : "") + (S.learned[id] ? chip("gelernt", "ok", "check") : "") + "</div><h3>" + h(a.title) + '</h3><p class="muted">' + h(a.intro) + "</p>" + bar(pct(s.ok, s.total), "bar-" + L.c, a.short) + '<p class="topic-foot"><span>' + s.tried + " / " + s.total + " Fragen bearbeitet</span>" + chip(L.t, L.c, L.i) + "</p></a>";
      });
      o += "</div></section>";
    });
    return o;
  }
  var DECK = { i: 0, flip: false, cards: [] };
  function deckHtml() {
    var c = DECK.cards[DECK.i];
    return '<div class="deck"><button class="flash' + (DECK.flip ? " flipped" : "") + '" data-a="deck-flip" aria-live="polite"><span class="flash-side">' + (DECK.flip ? "Erklärung" : "Begriff") + '</span><span class="flash-text">' + h(DECK.flip ? c[1] : c[0]) + '</span><span class="flash-hint">' + (DECK.flip ? "Antippen für den Begriff" : "Antippen zum Umdrehen") + '</span></button><div class="deck-nav"><button class="btn btn-sm" data-a="deck-prev" aria-label="Vorherige Karte">' + icon("back") + '</button><span class="num">' + (DECK.i + 1) + " / " + DECK.cards.length + '</span><button class="btn btn-sm" data-a="deck-next" aria-label="Nächste Karte">' + icon("arrow") + "</button></div></div>";
  }
  function viewThema(id) {
    var a = SK.areas[id]; if (!a) return viewThemen();
    var s = areaStats(id), L = LAMP[s.lamp];
    var g = SK.groups.filter(function (x) { return x.areas.indexOf(id) >= 0; })[0];
    DECK = { i: 0, flip: false, cards: a.terms };
    var ul = function (l) { return "<ul class=\"bul\">" + l.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ul>"; };
    var o = '<p class="crumb"><a href="#/themen">' + icon("back") + "Themenbereiche</a></p>" + head("Sachgebiet " + a.part + " · " + h(g.title), h(a.title), h(a.intro));
    o += '<section class="card"><div class="split"><div><h3>Dein Stand</h3>' + bar(pct(s.ok, s.total), "bar-" + L.c, "Fortschritt") + '<p class="muted">' + s.ok + " von " + s.total + " Fragen zuletzt richtig · " + s.tried + " bearbeitet · " + chip(L.t, L.c, L.i) + '</p></div><div class="actions"><button class="btn btn-primary" data-a="start-area" data-arg="' + id + '">' + icon("play") + 'Fragen üben</button><button class="btn" data-a="learned" data-arg="' + id + '" aria-pressed="' + !!S.learned[id] + '">' + icon("check") + (S.learned[id] ? "Als gelernt markiert" : "Als gelernt markieren") + "</button></div></div></section>";
    o += '<div class="grid g2"><section class="card"><h3>Kompakte Zusammenfassung</h3>' + ul(a.summary) + '</section><section class="card"><h3>Lernkarten: wichtigste Begriffe</h3><div id="deck">' + deckHtml() + "</div></section></div>";
    o += '<section class="card"><h3>Lernziele und Unterthemen</h3><ul class="rows subs">';
    Object.keys(a.subs).forEach(function (k) {
      var n = SK.questions.filter(function (q) { return q.area === id && q.subKey === k; }).length;
      o += "<li><span><b>" + h(a.subs[k][0]) + '</b><small class="muted">' + h(a.subs[k][1]) + " · " + h(a.subs[k][2]) + '</small></span><button class="btn btn-sm" data-a="start-sub" data-arg="' + id + ":" + k + '">' + n + " Fragen</button></li>";
    });
    o += "</ul></section>";
    o += '<div class="grid g2"><section class="card"><h3>Relevante Rechtsgrundlagen</h3>' + ul(a.law) + '<p class="cardfoot muted">Quelle: ' + h(a.source.title) + " – " + h(a.source.institution) + '</p></section><section class="card"><h3>Typische Fehler und Missverständnisse</h3>' + ul(a.mistakes) + "</section></div>";
    var areaLaws = (SK.laws || []).filter(function (L) { return L.b.indexOf(id) >= 0; });
    if (areaLaws.length) o += '<section class="card"><details class="lawgroup"><summary><h3>' + icon("bulb") + "Gesetze einfach erklärt</h3><span class=\"muted\">" + areaLaws.length + ' Paragrafen · antippen zum Öffnen</span></summary><div class="laws">' + areaLaws.map(lawHtml).join("") + "</div></details></section>";
    o += '<section class="card"><h3>Begriffe im Überblick</h3><dl class="terms">' + a.terms.map(function (t) { return "<dt>" + h(t[0]) + "</dt><dd>" + h(t[1]) + "</dd>"; }).join("") + "</dl></section>";
    return o;
  }

  /* ================= Lernmodus ================= */
  var SESS = null;
  var LCFG = { mode: "mix", areas: [], types: [], count: 20 };
  var MODES = [
    ["mix", "Tagesmix", "Fällige Wiederholungen zuerst, dann neue Fragen"],
    ["neu", "Neue Fragen", "Noch nie bearbeitete Fragen"],
    ["faellig", "Wiederholungen", "Heute fällige Fragen"],
    ["fehler", "Fehlertraining", "Zuletzt falsch beantwortete Fragen"],
    ["unsicher", "Unsichere", "Von dir als unsicher markiert"],
    ["fav", "Favoriten", "Deine gemerkten Fragen"],
    ["alle", "Alle", "Zufällige Auswahl aus dem ganzen Pool"]
  ];
  var TYPE_L = { sc: "Single Choice", mc: "Multiple Choice", tf: "Richtig / Falsch", zu: "Zuordnung", fa: "Freie Antwort" };
  function poolFor(cfg) {
    var qs = SK.questions.filter(function (q) {
      return (!cfg.areas.length || cfg.areas.indexOf(q.area) >= 0) && (!cfg.types.length || cfg.types.indexOf(q.t) >= 0) && (!cfg.sub || q.subKey === cfg.sub);
    });
    var f = {
      neu: function (q) { return !S.q[q.id] || !S.q[q.id].a; },
      faellig: function (q) { return isDue(q.id); },
      fehler: function (q) { var r = S.q[q.id]; return r && r.a && r.lastOk === false; },
      unsicher: function (q) { return S.q[q.id] && S.q[q.id].unsure; },
      fav: function (q) { return S.q[q.id] && S.q[q.id].fav; }
    }[cfg.mode];
    if (cfg.mode === "mix") {
      var due = shuffle(qs.filter(function (q) { return isDue(q.id); })), neu = shuffle(qs.filter(function (q) { return !S.q[q.id] || !S.q[q.id].a; }));
      return due.concat(neu).concat(shuffle(qs.filter(function (q) { return due.indexOf(q) < 0 && neu.indexOf(q) < 0; })));
    }
    return shuffle(f ? qs.filter(f) : qs);
  }
  function startSession(cfg) {
    var ids = cfg.ids ? cfg.ids.slice() : poolFor(cfg).slice(0, cfg.count || 9999).map(function (q) { return q.id; });
    if (!ids.length) { toast("Für diese Auswahl gibt es gerade keine Fragen."); return; }
    SESS = { ids: ids, i: 0, mode: cfg.mode, ok: 0, wrong: 0, requeued: {}, title: cfg.title || (MODES.filter(function (m) { return m[0] === cfg.mode; })[0] || ["", "Lernrunde"])[1], cur: null };
    if (location.hash !== "#/lernen") location.hash = "#/lernen"; else render();
  }
  function viewLernen() {
    if (SESS) return SESS.i >= SESS.ids.length ? sessionDone() : sessionQ();
    var o = head("Lernmodus", "Lernen", "Sofortige Auswertung mit Erklärung zu jeder Antwortmöglichkeit. Falsch beantwortete Fragen kommen am Ende der Runde noch einmal.");
    o += '<section class="card"><h3>Was möchtest du üben?</h3><div class="modes" role="radiogroup" aria-label="Lernart">';
    MODES.forEach(function (m) {
      var n = poolFor({ mode: m[0], areas: LCFG.areas, types: LCFG.types }).length;
      if (m[0] === "mix") n = SK.questions.length;
      o += '<button class="mode" role="radio" aria-checked="' + (LCFG.mode === m[0]) + '" data-a="lc-mode" data-arg="' + m[0] + '"><b>' + m[1] + '</b><span class="muted">' + m[2] + '</span><span class="num">' + (m[0] === "mix" ? "" : n) + "</span></button>";
    });
    o += '</div></section><section class="card"><h3>Sachgebiete</h3><p class="muted">Ohne Auswahl werden alle Sachgebiete einbezogen.</p><div class="tags">';
    SK.areaOrder.forEach(function (id) { o += '<button class="tag" aria-pressed="' + (LCFG.areas.indexOf(id) >= 0) + '" data-a="lc-area" data-arg="' + id + '">' + SK.areas[id].part + " · " + h(SK.areas[id].short) + "</button>"; });
    o += '</div><h3>Fragetypen</h3><div class="tags">';
    Object.keys(TYPE_L).forEach(function (t) { o += '<button class="tag" aria-pressed="' + (LCFG.types.indexOf(t) >= 0) + '" data-a="lc-type" data-arg="' + t + '">' + TYPE_L[t] + "</button>"; });
    o += '</div><h3>Umfang</h3><div class="seg" role="radiogroup" aria-label="Anzahl der Fragen">';
    [10, 20, 40, 9999].forEach(function (n) { o += '<button role="radio" aria-checked="' + (LCFG.count === n) + '" data-a="lc-count" data-arg="' + n + '">' + (n === 9999 ? "alle" : n) + "</button>"; });
    o += '</div><div class="actions"><button class="btn btn-primary btn-lg" data-a="lc-go">' + icon("play") + 'Lernrunde starten</button><button class="btn btn-lg" data-a="start-free">Freie Antworten üben</button></div></section>';
    return o;
  }
  function prepQ(q) {
    var c = { id: q.id, checked: false, sel: [], res: null };
    if (q.t === "sc" || q.t === "mc" || q.t === "tf") c.perm = q.t === "tf" ? [0, 1] : shuffle(range(q.options.length));
    if (q.t === "zu") { c.right = shuffle(range(q.pairs.length)); c.pick = q.pairs.map(function () { return ""; }); }
    return c;
  }
  function qMeta(q) {
    var st = status(q.id), a = SK.areas[q.area];
    return '<div class="qmeta">' + chip(a.part + " · " + a.short, "primary") + chip(q.subtopic, "neutral") + chip(TYPE_L[q.t], "neutral") + chip(q.difficulty, "neutral") + (q.isCase ? chip("Fallbeispiel", "accent") : "") + chip(st, STATUS_CHIP[st]) + "</div>";
  }
  function optionsHtml(q, c, exam) {
    var multi = q.t === "mc", o = '<div class="opts" role="' + (multi ? "group" : "radiogroup") + '" aria-label="Antwortmöglichkeiten">';
    c.perm.forEach(function (oi, k) {
      var sel = c.sel.indexOf(oi) >= 0, right = q.correctAnswers.indexOf(oi) >= 0, cls = "opt", mark = "";
      if (c.checked) {
        if (right && sel) { cls += " ok"; mark = icon("check") + "<em>Richtig gewählt</em>"; }
        else if (right) { cls += " miss"; mark = icon("check") + "<em>Richtig – nicht gewählt</em>"; }
        else if (sel) { cls += " bad"; mark = icon("x") + "<em>Falsch gewählt</em>"; }
        else { cls += " off"; mark = "<em>Falsch</em>"; }
      } else if (sel) cls += " sel";
      o += '<button class="' + cls + '" role="' + (multi ? "checkbox" : "radio") + '" aria-checked="' + sel + '"' + (c.checked ? " disabled" : "") + ' data-a="' + (exam ? "ex-pick" : "pick") + '" data-arg="' + oi + '"><span class="opt-key">' + (q.t === "tf" ? (oi === 0 ? "R" : "F") : "ABCDEF"[k]) + '</span><span class="opt-body"><span class="opt-text">' + h(q.options[oi]) + "</span>" + (c.checked ? '<span class="opt-mark">' + mark + '</span><span class="opt-why">' + h(q.wrongAnswerExplanations[oi]) + "</span>" : "") + "</span></button>";
    });
    return o + "</div>";
  }
  function sessionQ() {
    var q = QBY[SESS.ids[SESS.i]];
    if (!SESS.cur || SESS.cur.id !== q.id) { SESS.cur = prepQ(q); recDel(true); if (S.settings.tts && S.settings.autoplay) setTimeout(function () { ttsSay("q"); }, 250); }
    var c = SESS.cur, r = S.q[q.id] || {}, n = SESS.ids.length;
    var o = '<div class="runhead"><button class="btn btn-ghost btn-sm" data-a="sess-end">' + icon("x") + "Beenden</button><div class=\"runprog\"><span>" + h(SESS.title) + ' · Frage <b class="num">' + (SESS.i + 1) + "</b> von " + n + "</span>" + bar(pct(SESS.i, n), "", "Fortschritt der Lernrunde") + '</div><span class="runscore num" aria-label="Richtig und falsch in dieser Runde">' + icon("check", "ic-ok") + SESS.ok + " " + icon("x", "ic-bad") + SESS.wrong + "</span></div>";
    o += '<article class="card qcard">' + qMeta(q) + '<div class="qtools"><button class="iconbtn" data-a="fav" aria-pressed="' + !!r.fav + '" aria-label="Favorit">' + icon("star") + "<span>Favorit</span></button></div>";
    o += '<h2 class="qtext">' + h(q.question) + "</h2>";
    if (q.t === "mc" && !c.checked) o += '<p class="hint">' + icon("info") + "Mehrere Antworten sind richtig – wähle " + q.correctAnswers.length + ".</p>";
    o += ttsBar(q.t === "fa" || q.t === "zu" ? [["q", "Frage"]].concat(c.checked ? [["e", "Lösung"]] : []) : [["q", "Frage"], ["o", "Antworten"]].concat(c.checked ? [["e", "Erklärung"]] : []).concat([["all", "Alles"]]));

    if (q.t === "zu") {
      o += '<div class="match">';
      q.pairs.forEach(function (p, i) {
        var okk = c.checked ? c.pick[i] === String(i) : null;
        o += '<div class="match-row' + (c.checked ? (okk ? " ok" : " bad") : "") + '"><label for="m' + i + '">' + h(p[0]) + '</label><select id="m' + i + '" data-chg="match" data-arg="' + i + '"' + (c.checked ? " disabled" : "") + '><option value="">– zuordnen –</option>' + c.right.map(function (ri) { return '<option value="' + ri + '"' + (c.pick[i] === String(ri) ? " selected" : "") + ">" + h(q.pairs[ri][1]) + "</option>"; }).join("") + "</select>" + (c.checked ? '<span class="opt-mark">' + icon(okk ? "check" : "x") + "<em>" + (okk ? "Richtig" : "Falsch – richtig: " + h(p[1])) + "</em></span>" : "") + "</div>";
      });
      o += "</div>";
    } else if (q.t === "fa") {
      o += '<label class="field"><span>Deine Antwort (optional)</span><textarea id="answer-text" rows="5" placeholder="Formuliere deine Antwort in eigenen Worten …"' + (c.checked ? " readonly" : "") + ">" + h(c.text || "") + '</textarea></label><div id="stt-slot">' + sttHtml() + '</div><div id="rec-slot">' + recHtml() + "</div>";
      if (c.checked) {
        o += '<div class="solution"><h3>Musterlösung</h3><p>' + h(q.modelAnswer) + "</p>" + (q.keyPoints.length ? "<h4>Kernpunkte</h4><ul class=\"bul\">" + q.keyPoints.map(function (k) { return "<li>" + h(k) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
        if (!c.res) o += '<div class="selfrate"><p><b>Wie war deine Antwort?</b> Diese Selbsteinschätzung ist keine IHK-Bewertung.</p><div class="actions"><button class="btn btn-ok" data-a="rate" data-arg="ok">' + icon("check") + 'richtig</button><button class="btn" data-a="rate" data-arg="partial">teilweise richtig</button><button class="btn" data-a="rate" data-arg="unsure">' + icon("q") + 'unsicher</button><button class="btn btn-bad" data-a="rate" data-arg="wrong">' + icon("repeat") + "wiederholen</button></div></div>";
      }
    } else o += optionsHtml(q, c);

    if (c.checked && q.t !== "fa") {
      var good = c.res === "ok" || c.res === "unsure";
      o += '<div class="verdict ' + (good ? "ok" : "bad") + '" role="status">' + icon(good ? "check" : "x") + "<div><b>" + (good ? "Richtig beantwortet" : "Nicht richtig") + "</b><p>" + h(q.explanation) + "</p></div></div>";
    }
    if (c.checked) {
      o += '<dl class="kv qsrc"><dt>Lernziel</dt><dd>' + h(q.learningGoal) + "</dd><dt>Rechtsgrundlage</dt><dd>" + h(q.legalReference) + "</dd><dt>Quellenstatus</dt><dd>" + h(q.verifiedStatus) + "</dd></dl>" + lawBlock(q.legalReference);
      if (c.res === "wrong" || c.res === "partial") {
        o += '<div class="cause"><p><b>Woran lag es?</b> <span class="muted">optional – hilft bei der Fehleranalyse</span></p><div class="tags">';
        SK.errorCauses.forEach(function (e) { o += '<button class="tag" aria-pressed="' + (c.cause === e) + '" data-a="cause" data-arg="' + h(e) + '">' + h(e) + "</button>"; });
        o += "</div></div>";
      }
    }
    o += '<p class="qlabel">' + h(q.label) + " · " + q.id + "</p></article>";
    o += '<div class="runfoot">';
    if (!c.checked) {
      o += '<button class="btn btn-ghost" data-a="skip">Überspringen</button>';
      o += q.t === "fa" ? '<button class="btn btn-primary btn-lg" data-a="reveal">Musterlösung anzeigen</button>' : '<button class="btn btn-primary btn-lg" data-a="check"' + (canCheck(q, c) ? "" : " disabled") + ">Antwort prüfen</button>";
    } else if (c.res) {
      if (c.res === "ok") o += '<button class="btn" data-a="unsure">' + icon("q") + "Als unsicher markieren</button>";
      else if (c.res === "unsure") o += chip("als unsicher markiert – morgen wieder", "warn", "q");
      else o += "<span></span>";
      o += '<button class="btn btn-primary btn-lg" data-a="next" id="nextbtn">' + (SESS.i + 1 >= SESS.ids.length ? "Runde abschließen" : "Nächste Frage") + icon("arrow") + "</button>";
    }
    return o + "</div>";
  }
  function canCheck(q, c) {
    if (q.t === "zu") return c.pick.every(function (p) { return p !== ""; });
    return c.sel.length > 0;
  }
  function gradeCur() {
    var q = QBY[SESS.cur.id], c = SESS.cur, ok;
    if (q.t === "zu") ok = c.pick.every(function (p, i) { return p === String(i); });
    else ok = c.sel.length === q.correctAnswers.length && q.correctAnswers.every(function (x) { return c.sel.indexOf(x) >= 0; });
    finishCur(ok ? "ok" : "wrong");
  }
  function finishCur(res) {
    var c = SESS.cur; c.checked = true; c.res = res;
    record(c.id, res, SESS.mode);
    if (res === "ok" || res === "unsure") SESS.ok++; else {
      SESS.wrong++;
      if (!SESS.requeued[c.id]) { SESS.requeued[c.id] = 1; SESS.ids.push(c.id); }
    }
    render();
    if (S.settings.tts && S.settings.ttsAuto) ttsSay("e");
    var nb = $("#nextbtn"); if (nb) nb.focus();
  }
  function ttsSay(part) {
    var q = SESS && SESS.cur ? QBY[SESS.cur.id] : null, c = SESS && SESS.cur; if (!q) return;
    var qt = q.question, ot = "", et = "";
    if (q.options) ot = c.perm.map(function (oi, k) { return "Antwort " + (q.t === "tf" ? "" : "ABCDEF"[k]) + ": " + q.options[oi]; }).join(". ");
    if (c.checked) et = (q.t === "fa" ? "Musterlösung: " + q.modelAnswer : q.explanation);
    TTS.speak({ q: qt, o: ot, e: et, all: [qt, ot, et].filter(Boolean).join(". ") }[part]);
  }
  function sessionDone() {
    var tot = SESS.ok + SESS.wrong, wrongIds = Object.keys(SESS.requeued).filter(function (id) { return S.q[id] && S.q[id].lastOk === false; });
    var o = head("Lernrunde abgeschlossen", h(SESS.title), "");
    o += '<section class="card center">' + ring(pct(SESS.ok, tot), "Trefferquote") + "<h2>" + SESS.ok + " von " + tot + ' Antworten richtig</h2><p class="muted">' + (wrongIds.length ? wrongIds.length + " Fragen sind weiterhin offen und kommen im Fehlertraining wieder." : "Keine offenen Fehler aus dieser Runde.") + '</p><div class="actions center">' + (wrongIds.length ? '<button class="btn btn-primary" data-a="sess-retry">' + icon("repeat") + "Falsche Fragen wiederholen</button>" : "") + '<button class="btn' + (wrongIds.length ? "" : " btn-primary") + '" data-a="sess-new">Neue Runde</button><a class="btn" href="#/">Zur Startseite</a></div></section>';
    SESS.retry = wrongIds;
    return o;
  }

  /* ================= Fragenkatalog ================= */
  var CAT = { text: "", area: "", type: "", st: "", page: 0 };
  function catFilter() {
    var t = CAT.text.trim().toLowerCase();
    return SK.questions.filter(function (q) {
      if (CAT.area && q.area !== CAT.area) return false;
      if (CAT.type && q.t !== CAT.type) return false;
      if (CAT.st) { if (CAT.st === "fav") { if (!(S.q[q.id] && S.q[q.id].fav)) return false; } else if (status(q.id) !== CAT.st) return false; }
      if (t && (q.question + " " + q.subtopic + " " + q.legalReference + " " + q.id + " " + (q.options || []).join(" ")).toLowerCase().indexOf(t) < 0) return false;
      return true;
    });
  }
  function catList() {
    var list = catFilter(), per = 40, pages = Math.max(1, Math.ceil(list.length / per));
    CAT.page = Math.min(CAT.page, pages - 1);
    var o = '<p class="muted" role="status"><b class="num">' + list.length + "</b> von " + SK.questions.length + " Fragen" + (list.length ? ' · <button class="linkbtn" data-a="cat-run">diese Auswahl üben</button>' : "") + "</p>";
    if (!list.length) return o + '<p class="empty">Keine Frage passt zu dieser Suche. Ändere den Suchbegriff oder setze die Filter zurück.</p>';
    o += '<ul class="rows qlist">';
    list.slice(CAT.page * per, CAT.page * per + per).forEach(function (q) {
      var st = status(q.id);
      o += '<li><button class="qrow" data-a="cat-open" data-arg="' + q.id + '"><span class="qrow-t">' + h(q.question) + '</span><span class="qrow-m">' + chip(SK.areas[q.area].part + " · " + SK.areas[q.area].short, "primary") + chip(TYPE_L[q.t], "neutral") + chip(st, STATUS_CHIP[st]) + (S.q[q.id] && S.q[q.id].fav ? chip("Favorit", "accent", "star") : "") + "</span></button></li>";
    });
    o += "</ul>";
    if (pages > 1) o += '<div class="pager"><button class="btn btn-sm" data-a="cat-page" data-arg="-1"' + (CAT.page ? "" : " disabled") + ">" + icon("back") + 'Zurück</button><span class="num">Seite ' + (CAT.page + 1) + " / " + pages + '</span><button class="btn btn-sm" data-a="cat-page" data-arg="1"' + (CAT.page < pages - 1 ? "" : " disabled") + ">Weiter" + icon("arrow") + "</button></div>";
    return o;
  }
  function viewFragen() {
    var sel = function (key, opts, lab) { return '<label class="field"><span>' + lab + '</span><select data-chg="cat" data-arg="' + key + '">' + opts.map(function (x) { return '<option value="' + h(x[0]) + '"' + (CAT[key] === x[0] ? " selected" : "") + ">" + h(x[1]) + "</option>"; }).join("") + "</select></label>"; };
    var o = head("Eigener Übungspool", "Fragenkatalog", SK.questions.length + " eigene prüfungsnahe Übungsfragen. Dies ist kein offizieller IHK-Fragenkatalog.");
    o += '<section class="card filters"><label class="field grow"><span>Suche</span><span class="searchbox">' + icon("search") + '<input type="search" id="cat-text" data-inp="cat-text" value="' + h(CAT.text) + '" placeholder="Stichwort, Paragraf oder Fragen-ID"></span></label>';
    o += sel("area", [["", "Alle Sachgebiete"]].concat(SK.areaOrder.map(function (id) { return [id, SK.areas[id].part + " · " + SK.areas[id].short]; })), "Sachgebiet");
    o += sel("type", [["", "Alle Typen"]].concat(Object.keys(TYPE_L).map(function (t) { return [t, TYPE_L[t]]; })), "Fragetyp");
    o += sel("st", [["", "Jeder Status"], ["neu", "neu"], ["heute wiederholen", "heute wiederholen"], ["morgen wiederholen", "morgen wiederholen"], ["unsicher", "unsicher"], ["Problemfrage", "Problemfrage"], ["sicher", "sicher"], ["fav", "Favoriten"]], "Status");
    o += '</section><section class="card" id="cat-list">' + catList() + "</section>";
    return o;
  }

  /* ================= Prüfungssimulation ================= */
  var EX_NOTE = "Diese Prüfungssimulation ist selbst erstellt und keine echte IHK-Prüfung. Sie orientiert sich an öffentlich verfügbaren Informationen zum aktuellen Prüfungsformat. Die tatsächliche Auswahl und Gewichtung der IHK kann abweichen.";
  var EXV = { timer: 0, result: null, confirm: false };
  function buildExam(short) {
    var cfg = SK.examConfig, ids = [], f = short ? cfg.shortExam.factor : 1;
    SK.areaOrder.forEach(function (aid) {
      var d = cfg.distribution[aid]; if (!d) return;
      var nq = Math.max(1, Math.round(d.q * f)), dbl = Math.min(nq, Math.round((d.pts - d.q) * f)), sgl = nq - dbl;
      var mc = shuffle(SK.questions.filter(function (q) { return q.area === aid && q.t === "mc" && q.correctAnswers.length === 2; }));
      var sc = shuffle(SK.questions.filter(function (q) { return q.area === aid && q.t === "sc"; }));
      var pick = mc.slice(0, dbl); sgl += dbl - pick.length;
      var pick2 = sc.slice(0, sgl), rest = sgl - pick2.length;
      if (rest > 0) pick2 = pick2.concat(mc.slice(dbl, dbl + rest));
      ids = ids.concat(shuffle(pick.concat(pick2)).map(function (q) { return q.id; }));
    });
    var perm = {}, max = 0;
    ids.forEach(function (id) { perm[id] = shuffle(range(QBY[id].options.length)); max += QBY[id].correctAnswers.length * cfg.pointsPerCorrectAnswer; });
    var dur = short ? cfg.shortExam.durationMinutes : cfg.durationMinutes;
    S.exam = { ids: ids, perm: perm, ans: {}, flag: {}, i: 0, start: Date.now(), end: Date.now() + dur * 60000, short: !!short, max: max };
    save();
  }
  function scoreQ(q, sel) {
    var p = 0; (sel || []).forEach(function (x) { if (q.correctAnswers.indexOf(x) >= 0) p += SK.examConfig.pointsPerCorrectAnswer; else p -= SK.examConfig.wrongAnswerPenalty; });
    return Math.max(0, p);
  }
  function submitExam() {
    var e = S.exam; if (!e) return;
    clearInterval(EXV.timer);
    var pts = 0, by = {}, wrong = [];
    e.ids.forEach(function (id) {
      var q = QBY[id], sel = e.ans[id] || [], p = scoreQ(q, sel), m = q.correctAnswers.length * SK.examConfig.pointsPerCorrectAnswer;
      pts += p; var b = by[q.area] || (by[q.area] = { pts: 0, max: 0 }); b.pts += p; b.max += m;
      var full = p === m && sel.length === q.correctAnswers.length;
      if (!full) wrong.push(id);
      if (sel.length) record(id, full ? "ok" : "wrong", "exam");
    });
    var pass = e.short ? pts >= e.max / 2 : pts >= SK.examConfig.passPoints;
    var res = { ts: Date.now(), pts: pts, max: e.max, pct: pct(pts, e.max), pass: pass, short: e.short, dur: Math.round((Math.min(Date.now(), e.end) - e.start) / 1000), by: by, wrong: wrong, ans: e.ans, ids: e.ids };
    S.exams.push({ ts: res.ts, pts: pts, max: e.max, pct: res.pct, pass: pass, short: e.short, dur: res.dur, by: by, wrong: wrong });
    S.exam = null; save(); EXV.result = res; EXV.confirm = false; render();
  }
  function examTick() {
    var e = S.exam, el = $("#ex-time"); if (!e) { clearInterval(EXV.timer); return; }
    var left = (e.end - Date.now()) / 1000;
    if (left <= 0) { toast("Die Zeit ist abgelaufen – die Simulation wurde abgegeben."); submitExam(); return; }
    if (el) { el.textContent = fmtClock(left); el.parentNode.classList.toggle("low", left < 600); }
  }
  function viewPruefung() {
    var cfg = SK.examConfig;
    if (S.exam) return examRun();
    if (EXV.result) return examResult(EXV.result);
    var o = head("Prüfungssimulation", "Prüfung simulieren", "Getrennt vom Lernmodus: keine Lösungen während der Bearbeitung, Ergebnis erst nach Abgabe oder Zeitablauf.");
    o += '<div class="note note-warn">' + icon("warn") + "<div>" + EX_NOTE + "</div></div>";
    o += '<div class="grid g2"><section class="card"><h3>Vollständige Simulation</h3><dl class="kv"><dt>Fragen</dt><dd>' + cfg.questionCount + "</dd><dt>Zeit</dt><dd>" + cfg.durationMinutes + " Minuten</dd><dt>Höchstpunktzahl</dt><dd>" + cfg.maxPoints + " Punkte</dd><dt>Bestanden ab</dt><dd>" + cfg.passPoints + ' Punkten (50 %)</dd></dl><button class="btn btn-primary btn-lg" data-a="ex-start">' + icon("exam") + "Simulation starten</button></section>";
    o += '<section class="card"><h3>Kurztest</h3><dl class="kv"><dt>Fragen</dt><dd>etwa ' + Math.round(cfg.questionCount * cfg.shortExam.factor) + "</dd><dt>Zeit</dt><dd>" + cfg.shortExam.durationMinutes + ' Minuten</dd><dt>Bestanden ab</dt><dd>50 % der Punkte</dd><dt>Hinweis</dt><dd>zählt nicht für die Prüfungsreife</dd></dl><button class="btn btn-lg" data-a="ex-start" data-arg="short">Kurztest starten</button></section></div>';
    o += '<section class="card"><h3>So wird gewertet</h3><ul class="bul"><li>Aufgaben mit einer richtigen Antwort: ein Kreuz, 1 Punkt.</li><li>Aufgaben mit zwei richtigen Antworten: höchstens zwei Kreuze, je richtigem Kreuz 1 Punkt (Teilpunkte).</li><li>Falsche Kreuze bringen keinen Punkt und führen zu keinem Abzug.</li></ul><p class="muted">Fragenanzahl, Punkte, Dauer und Bestehensgrenze: ' + h(cfg.sourceStatus) + ". Verteilung auf die Sachgebiete: " + h(cfg.distributionStatus) + '. Die Detailregeln der IHK-Auswertung sind nicht vollständig veröffentlicht; diese Simulation ist deshalb eine vereinfachte Lernsimulation. <a href="#/quellen">Mehr dazu</a></p></section>';
    if (S.exams.length) { o += '<section class="card"><h3>Bisherige Ergebnisse</h3><ul class="rows">'; S.exams.slice().reverse().slice(0, 8).forEach(function (e) { o += "<li><span>" + fmtDateTime(e.ts) + (e.short ? " · Kurztest" : "") + '</span><span class="num">' + e.pts + " / " + e.max + " · " + e.pct + " %</span>" + chip(e.pass ? "bestanden" : "nicht bestanden", e.pass ? "ok" : "bad", e.pass ? "check" : "x") + "</li>"; }); o += "</ul></section>"; }
    return o;
  }
  function examRun() {
    var e = S.exam, q = QBY[e.ids[e.i]], sel = e.ans[q.id] || [], n = e.ids.length;
    var answered = e.ids.filter(function (id) { return (e.ans[id] || []).length; }).length;
    clearInterval(EXV.timer); EXV.timer = setInterval(examTick, 1000);
    var o = '<div class="exbar"><div class="exbar-l"><b>Prüfungssimulation' + (e.short ? " · Kurztest" : "") + '</b><span class="muted">' + answered + " von " + n + ' beantwortet</span></div><div class="extime" role="timer" aria-label="Verbleibende Zeit">' + icon("exam") + '<span id="ex-time" class="num">' + fmtClock((e.end - Date.now()) / 1000) + '</span></div><button class="btn btn-primary" data-a="ex-submit-ask">Abgeben</button></div>';
    if (EXV.confirm) o += '<div class="note note-warn" role="alertdialog" aria-label="Abgabe bestätigen">' + icon("warn") + "<div><b>Simulation jetzt abgeben?</b> " + (n - answered ? (n - answered) + " Fragen sind noch unbeantwortet. " : "") + 'Danach sind keine Änderungen mehr möglich.<div class="actions"><button class="btn btn-primary" data-a="ex-submit">Ja, abgeben</button><button class="btn" data-a="ex-submit-no">Weiter bearbeiten</button></div></div></div>';
    o += '<article class="card qcard"><div class="qmeta">' + chip("Frage " + (e.i + 1) + " von " + n, "primary") + chip(SK.areas[q.area].short, "neutral") + chip(q.correctAnswers.length === 2 ? "2 richtige Antworten · 2 Punkte" : "1 richtige Antwort · 1 Punkt", "neutral") + '</div><h2 class="qtext">' + h(q.question) + "</h2>";
    o += optionsHtml(q, { perm: e.perm[q.id], sel: sel, checked: false }, true);
    o += '<p class="qlabel">' + h(q.label) + '</p></article><div class="runfoot"><button class="btn" data-a="ex-go" data-arg="' + (e.i - 1) + '"' + (e.i ? "" : " disabled") + ">" + icon("back") + 'Zurück</button><button class="btn" data-a="ex-flag" aria-pressed="' + !!e.flag[q.id] + '">' + icon("flag") + (e.flag[q.id] ? "Markiert" : "Markieren") + '</button><button class="btn btn-primary" data-a="ex-go" data-arg="' + (e.i + 1) + '"' + (e.i < n - 1 ? "" : " disabled") + ">Weiter" + icon("arrow") + "</button></div>";
    o += '<section class="card"><h3>Übersicht</h3><div class="exgrid">';
    e.ids.forEach(function (id, i) { var a = (e.ans[id] || []).length; o += '<button class="' + (a ? "done" : "") + (e.flag[id] ? " flag" : "") + '"' + (i === e.i ? ' aria-current="true"' : "") + ' data-a="ex-go" data-arg="' + i + '" aria-label="Frage ' + (i + 1) + (a ? ", beantwortet" : ", offen") + (e.flag[id] ? ", markiert" : "") + '">' + (i + 1) + "</button>"; });
    o += '</div><p class="legend"><span><i class="lg done"></i>beantwortet</span><span><i class="lg"></i>offen</span><span><i class="lg flag"></i>markiert</span></p></section>';
    return o;
  }
  function examResult(r) {
    var o = head("Prüfungssimulation" + (r.short ? " · Kurztest" : ""), "Ergebnis", fmtDateTime(r.ts) + " · Bearbeitungszeit " + fmtClock(r.dur));
    o += '<section class="card result ' + (r.pass ? "ok" : "bad") + '">' + ring(r.pct, "Erreichte Punkte in Prozent") + '<div><p class="big num">' + r.pts + ' <span class="unit">/ ' + r.max + " Punkte</span></p><p>" + chip(r.pass ? "bestanden" : "nicht bestanden", r.pass ? "ok" : "bad", r.pass ? "check" : "x") + ' <span class="muted">Grenze: ' + (r.short ? "50 % der Punkte" : SK.examConfig.passPoints + " Punkte") + '</span></p><div class="actions">' + (r.wrong.length ? '<button class="btn btn-primary" data-a="ex-retry">' + icon("repeat") + "Falsch beantwortete Fragen wiederholen</button>" : "") + '<button class="btn" data-a="ex-close">Neue Simulation</button></div></div></section>';
    o += '<div class="note note-warn">' + icon("warn") + "<div>" + EX_NOTE + "</div></div>";
    o += '<section class="card"><h3>Auswertung nach Themenbereich</h3>';
    SK.areaOrder.forEach(function (id) { var b = r.by[id]; if (!b) return; var p = pct(b.pts, b.max); o += '<div class="goal"><div class="goal-top"><span>' + SK.areas[id].part + " · " + h(SK.areas[id].short) + '</span><span class="num">' + b.pts + " / " + b.max + " · " + p + " %</span></div>" + bar(p, p >= 80 ? "bar-ok" : p >= 50 ? "bar-warn" : "bar-bad", SK.areas[id].short) + "</div>"; });
    o += "</section>";
    o += '<section class="card"><h3>Nicht vollständig richtig (' + r.wrong.length + ")</h3>";
    if (!r.wrong.length) o += '<p class="muted">Alle Fragen vollständig richtig beantwortet.</p>';
    r.wrong.forEach(function (id) {
      var q = QBY[id], sel = r.ans[id] || [];
      o += '<details class="wrongq"><summary><span>' + h(q.question) + "</span>" + chip(scoreQ(q, sel) + " / " + q.correctAnswers.length + " P.", "bad") + "</summary>" + optionsHtml(q, { perm: range(q.options.length), sel: sel, checked: true }) + '<p class="muted">' + h(q.explanation) + " · " + h(q.legalReference) + "</p></details>";
    });
    return o + "</section>";
  }

  /* ================= Mündliche Prüfung ================= */
  var ORAL = { show: false, text: "", checks: [] };
  function viewMuendlich(id) {
    var c = CBY[id];
    if (!c) {
      var o = head("Mündliche Prüfung", "Falltraining", SK.cases.length + " eigene Fallbeispiele. Schwerpunkte der mündlichen Prüfung sind nach § 11 BewachV das Recht der öffentlichen Sicherheit und Ordnung einschließlich Gewerberecht sowie der Umgang mit Menschen.");
      o += '<section class="card"><h3>Antwortschema für jeden Fall</h3><ol class="schema">' + SK.oralSchema.map(function (s) { return "<li>" + h(s) + "</li>"; }).join("") + '</ol><div class="actions"><button class="btn btn-primary" data-a="oral-next">' + icon("play") + 'Nächsten offenen Fall trainieren</button></div></section><section class="card"><h3>Alle Fallbeispiele</h3><p class="muted">' + oralCount() + " von " + SK.cases.length + ' trainiert</p><ul class="rows qlist">';
      SK.cases.forEach(function (k) {
        var r = S.oral[k.id];
        o += '<li><a class="qrow" href="#/muendlich/' + k.id + '"><span class="qrow-t">' + h(k.title) + '</span><span class="qrow-m">' + chip(k.topic, "primary") + (r && r.n ? chip(r.n + "× trainiert · " + r.score + " / " + SK.oralChecklist.length, r.score >= 6 ? "ok" : "warn", r.score >= 6 ? "check" : "q") : chip("offen", "info")) + "</span></a></li>";
      });
      return o + "</ul></section>";
    }
    if (ORAL.id !== id) { ORAL = { id: id, show: false, text: "", checks: SK.oralChecklist.map(function () { return false; }) }; recDel(true); }
    var ul = function (l) { return '<ul class="bul">' + l.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ul>"; };
    var o2 = '<p class="crumb"><a href="#/muendlich">' + icon("back") + "Alle Fallbeispiele</a></p>" + head(h(c.topic) + " · " + c.id, h(c.title), "");
    o2 += '<article class="card qcard"><h3>Ausgangssituation</h3><p class="case-text">' + h(c.s) + '</p><h3>Aufgabe</h3><p class="case-text">' + h(c.a) + "</p>" + (S.settings.tts && CAP.tts ? '<div class="ttsbar">' + icon("sound") + '<button class="btn btn-sm btn-ghost" data-a="oral-tts" data-arg="s">Fall vorlesen</button>' + (ORAL.show ? '<button class="btn btn-sm btn-ghost" data-a="oral-tts" data-arg="l">Lösung vorlesen</button>' : "") + '<span class="sep"></span><button class="btn btn-sm btn-ghost" data-a="tts-pause">' + icon("pause") + 'Pause</button><button class="btn btn-sm btn-ghost" data-a="tts-resume">' + icon("play") + 'Fortsetzen</button><button class="btn btn-sm btn-ghost" data-a="tts-stop">' + icon("stop") + "Stopp</button></div>" : "");
    o2 += '<label class="field"><span>Deine Antwort – sprich sie laut oder notiere Stichpunkte (optional)</span><textarea id="answer-text" rows="5" data-inp="oral-text" placeholder="Gehe das Antwortschema Schritt für Schritt durch …">' + h(ORAL.text) + '</textarea></label><div id="stt-slot">' + sttHtml() + '</div><div id="rec-slot">' + recHtml() + '</div><p class="qlabel">' + h(c.label) + "</p></article>";
    if (!ORAL.show) return o2 + '<div class="runfoot"><span></span><button class="btn btn-primary btn-lg" data-a="oral-show">Musterantwort und Bewertung anzeigen</button></div>';
    o2 += '<section class="card solution"><h3>Mögliche strukturierte Antwort</h3><ol class="schema">' + c.l.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ol></section>";
    o2 += '<div class="grid g2"><section class="card"><h3>Bewertungskriterien</h3>' + ul(c.k) + '</section><section class="card"><h3>Typische Fehler</h3>' + ul(c.f) + "</section></div>";
    o2 += '<section class="card"><h3>Rechtsgrundlage / Lernhinweis</h3><p>' + h(c.r) + "</p>" + lawBlock(c.r, 3) + "</section>";
    o2 += '<section class="card"><h3>Selbstbewertung</h3><p class="muted">Hake ab, was in deiner Antwort vorkam. Das ist eine Lernhilfe und keine IHK-Bewertung.</p><div class="checklist">';
    SK.oralChecklist.forEach(function (t, i) { o2 += '<label class="check"><input type="checkbox" data-chg="oral-check" data-arg="' + i + '"' + (ORAL.checks[i] ? " checked" : "") + "><span>" + h(t) + "</span></label>"; });
    o2 += '</div><div class="actions"><button class="btn btn-primary" data-a="oral-save">' + icon("check") + 'Bewertung speichern</button><button class="btn" data-a="oral-next">Nächster Fall' + icon("arrow") + "</button></div></section>";
    return o2;
  }

  /* ================= Glossar ================= */
  var GL = "";
  function glossList() {
    var t = GL.trim().toLowerCase(), l = SK.glossary.filter(function (g) { return !t || (g[0] + " " + g[1]).toLowerCase().indexOf(t) >= 0; });
    if (!l.length) return '<p class="empty">Kein Eintrag gefunden. Versuche einen kürzeren Suchbegriff.</p>';
    return '<dl class="terms">' + l.map(function (g) { return "<dt>" + h(g[0]) + "</dt><dd>" + h(g[1]) + "</dd>"; }).join("") + "</dl>";
  }
  function viewGlossar() {
    return head("Nachschlagen", "Glossar", SK.glossary.length + " Begriffe in kurzen Erklärungen.") + '<section class="card filters"><label class="field grow"><span>Begriff suchen</span><span class="searchbox">' + icon("search") + '<input type="search" data-inp="gloss" value="' + h(GL) + '" placeholder="z. B. Notwehr"></span></label></section><section class="card" id="gloss-list">' + glossList() + "</section>";
  }

  /* ================= Quellen ================= */
  function viewQuellen() {
    var kc = { "offiziell bestätigt": "ok", "durch mehrere seriöse Quellen bestätigt": "ok", "private Anbieterangabe": "warn", "weicht je IHK ab": "info", "öffentlich nicht eindeutig bestätigt": "warn" };
    var o = head("Transparenz", "Quellen und Aktualität", "Offizielle Informationen und eigene Lerninhalte sind getrennt ausgewiesen.");
    o += standNote();
    o += '<section class="card"><h3>Prüfungsformat im Faktencheck</h3><div class="facts">';
    SK.examFacts.forEach(function (f) { o += '<div class="fact"><div><b>' + h(f.k) + "</b><p>" + h(f.v) + '</p><small class="muted">Quelle: ' + h(f.q) + "</small></div>" + chip(f.s, kc[f.s] || "neutral") + "</div>"; });
    o += "</div></section>";
    o += '<section class="card"><h3>Was diese App ist – und was nicht</h3><ul class="bul"><li>Alle ' + SK.questions.length + " Fragen und " + SK.cases.length + " Fallbeispiele sind selbst erstellt. Es sind keine Original-IHK-Fragen, und sie stammen nicht aus Büchern, Apps oder Lernportalen.</li><li>Die in den Rechtsfragen zitierten Paragrafen und Artikel wurden am " + SK.RESEARCH_DATE + " im amtlichen Wortlaut gegengelesen; welche das sind, steht im Quellenverzeichnis. Bei jeder Frage zeigt der Quellenstatus, ob die Fundstelle gegengelesen ist, auf Landesrecht oder Rechtslehre beruht oder ein Fachmodell wiedergibt. Eine Prüfung durch eine zugelassene Rechtsanwältin oder einen Fachdozenten hat nicht stattgefunden.</li><li>Die Verteilung der Fragen auf die Sachgebiete ist ein Lernvorschlag und keine offizielle IHK-Gewichtung.</li><li>Verbindlich sind allein die aktuellen Rechtsquellen und die Auskunft der zuständigen IHK.</li></ul></section>";
    o += '<section class="card"><h3>Offene Punkte und mögliche Änderungen</h3><ul class="bul"><li><b>Sicherheitsgewerbegesetz:</b> Ein neues Stammgesetz soll § 34a GewO und die BewachV ablösen. Der Stand des Verfahrens war am ' + SK.RESEARCH_DATE + " öffentlich nicht eindeutig zu bestätigen. Frage deine IHK, nach welchem Recht deine Prüfung abgenommen wird.</li><li><b>Waffenrecht:</b> Das Waffengesetz wurde 2024 geändert (u. a. Messer- und Führverbote). Einzelheiten vor der Prüfung am aktuellen Text prüfen.</li><li><b>Cannabis:</b> Seit 2024 gilt das Konsumcannabisgesetz; Cannabis fällt nicht mehr unter das BtMG. Der Rahmenplan von 2019 nennt noch §§ 29, 30 BtMG.</li><li><b>Videoüberwachung:</b> Für private Betreiber stützt die Rechtsprechung die Zulässigkeit vorrangig auf Art. 6 Abs. 1 Buchst. f DS-GVO; der Rahmenplan nennt § 4 BDSG.</li><li><b>Unfallverhütung:</b> Die DGUV Vorschrift 23 stammt von 1997. Maßgeblich ist die Fassung des zuständigen Unfallversicherungsträgers.</li></ul></section>";
    o += '<section class="card"><h3>Quellenverzeichnis</h3><ul class="srcs">';
    SK.sources.forEach(function (s) {
      o += "<li><div class=\"src-top\"><b>" + h(s.t) + "</b>" + chip(s.k === "offiziell" ? "offizielle Quelle" : "ergänzende Quelle", s.k === "offiziell" ? "ok" : "warn") + '</div><dl class="kv"><dt>Institution</dt><dd>' + h(s.i) + "</dd><dt>Zweck</dt><dd>" + h(s.z) + "</dd><dt>Recherche am</dt><dd>" + s.d + "</dd>" + (s.u ? '<dt>URL</dt><dd><a href="' + h(s.u) + '" target="_blank" rel="noopener noreferrer">' + h(s.u) + "</a></dd>" : "") + (s.h ? "<dt>Hinweis</dt><dd>" + h(s.h) + "</dd>" : "") + "</dl></li>";
    });
    return o + '</ul><p class="muted">Links öffnen sich nur mit Internetverbindung. Die App selbst lädt nichts aus dem Netz.</p></section>';
  }

  /* ================= Einstellungen ================= */
  var SETV = { del: false };
  function sw(key, label, sub, disabled) {
    return '<label class="switch' + (disabled ? " is-off" : "") + '"><input type="checkbox" data-chg="set" data-arg="' + key + '"' + (S.settings[key] ? " checked" : "") + (disabled ? " disabled" : "") + '><span class="sw-ui" aria-hidden="true"></span><span class="sw-l"><b>' + label + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span></label>";
  }
  function viewSettings() {
    var st = S.settings, vs = TTS.voices();
    var o = head("Anpassen", "Einstellungen", "");
    o += '<section class="card"><h3>Tagesziele</h3><div class="grid g4">';
    [["neu", "Neue Fragen"], ["wdh", "Wiederholungen"], ["muendlich", "Mündliche Fälle"], ["fehler", "Fehlertraining"]].forEach(function (g) { o += '<label class="field"><span>' + g[1] + '</span><input type="number" min="0" max="500" inputmode="numeric" data-chg="goal" data-arg="' + g[0] + '" value="' + S.goals[g[0]] + '"></label>'; });
    o += "</div></section>";
    o += '<section class="card"><h3>Wiederholungsplan</h3><p class="muted">Abstand in Tagen nach der 1., 2., 3. … richtigen Antwort in Folge. Falsch beantwortete Fragen sind sofort wieder fällig, unsichere am nächsten Tag.</p><label class="field"><span>Abstände (durch Komma getrennt)</span><input type="text" data-chg="srs" value="' + srs().intervalsDays.join(", ") + '"></label></section>';

    o += '<section class="card"><h3>Sprache und Audio</h3><p class="muted">Alle Sprachfunktionen sind freiwillig und standardmäßig ausgeschaltet. Die App funktioniert vollständig ohne sie.</p>';
    o += sw("tts", "Text vorlesen", CAP.tts ? "Zeigt Vorlese-Schaltflächen bei Fragen und Fällen." : "In diesem Browser nicht verfügbar.", !CAP.tts);
    o += sw("autoplay", "Automatische Wiedergabe nach dem Öffnen einer Frage", "Liest die Frage vor, sobald sie erscheint.", !CAP.tts || !st.tts);
    o += sw("ttsAuto", "Automatische Vorlesefunktion für Erklärungen", "Liest nach dem Prüfen die Erklärung vor.", !CAP.tts || !st.tts);
    o += sw("rec", "Audioaufnahme", CAP.rec ? "Eigene Antworten aufnehmen und anhören. Benötigt die Mikrofonberechtigung; Aufnahmen bleiben nur temporär im Browser." : "In diesem Browser nicht verfügbar.", !CAP.rec);
    o += sw("stt", "Spracheingabe (Sprache zu Text)", CAP.stt ? "Kann je nach Browser einen Online-Dienst verwenden." : "In diesem Browser nicht verfügbar – bitte Texteingabe nutzen.", !CAP.stt);
    if (CAP.tts) {
      var de = vs.filter(function (v) { return /^de/i.test(v.lang); });
      o += '<div class="grid g3 voice"><label class="field"><span>Sprache</span><select data-chg="set-val" data-arg="lang">' + ["de-DE", "de-AT", "de-CH", "en-US"].map(function (l) { return '<option' + (st.lang === l ? " selected" : "") + ">" + l + "</option>"; }).join("") + '</select></label><label class="field"><span>Stimme</span><select data-chg="set-val" data-arg="voice"><option value="">Automatisch</option>' + vs.map(function (v) { return '<option value="' + h(v.name) + '"' + (st.voice === v.name ? " selected" : "") + ">" + h(v.name + " (" + v.lang + ")") + "</option>"; }).join("") + '</select></label><label class="field"><span>Geschwindigkeit: <b class="num">' + (+st.rate).toFixed(1) + '×</b></span><input type="range" min="0.6" max="1.6" step="0.1" value="' + st.rate + '" data-chg="set-val" data-arg="rate"></label></div>';
      if (!de.length) o += '<p class="hint">' + icon("info") + (vs.length ? "Es ist keine deutsche Sprachstimme installiert. Das Vorlesen kann deshalb unnatürlich klingen. Deutsche Stimmen lassen sich in den Systemeinstellungen nachinstallieren." : "Der Browser hat noch keine Stimmen gemeldet. Falls das so bleibt, ist auf diesem Gerät keine Sprachausgabe installiert.") + "</p>";
      o += '<button class="btn btn-sm" data-a="tts-test"' + (st.tts ? "" : " disabled") + ">" + icon("sound") + "Stimme testen</button>";
    }
    o += "</section>";

    var cs = function (ok, extra) { return ok ? chip("verfügbar", "ok", "check") + (extra ? " " + chip(extra, "neutral") : "") : chip("nicht verfügbar", "bad", "x"); };
    o += '<section class="card"><h3>Kompatibilitätsstatus</h3><ul class="rows">';
    o += "<li><span>Textfunktionen (Lernen, Prüfung, Auswertung)</span><span>" + cs(true) + "</span></li>";
    o += "<li><span>Lokale Speicherung</span><span>" + cs(storageOk) + "</span></li>";
    o += "<li><span>Vorlesen</span><span>" + cs(CAP.tts, "optional") + "</span></li>";
    o += "<li><span>Audioaufnahme</span><span>" + cs(CAP.rec, "optional · benötigt Berechtigung") + "</span></li>";
    o += "<li><span>Spracheingabe</span><span>" + cs(CAP.stt, "optional · benötigt Berechtigung") + "</span></li>";
    o += '</ul><p class="muted">Keine Kernfunktion hängt von Sprachfunktionen ab. Mikrofonzugriff ist in manchen Browsern nicht möglich, wenn die Datei direkt per Doppelklick (file://) geöffnet wird.</p></section>';

    o += '<section class="card"><h3>Darstellung</h3>' + sw("anim", "Animationen", "Dezente Übergänge. Bei „Bewegung reduzieren“ im System immer aus.") + '<div class="field"><span id="theme-l">Farbschema</span><div class="seg" role="radiogroup" aria-labelledby="theme-l">' + [["auto", "System"], ["light", "Hell"], ["dark", "Dunkel"]].map(function (t) { return '<button role="radio" aria-checked="' + (st.theme === t[0]) + '" data-a="theme" data-arg="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div></div></section>";

    o += '<section class="card"><h3>Fortschritt sichern</h3><p class="muted">Der Fortschritt liegt nur in diesem Browser. Exportiere ihn als JSON-Datei, um ihn zu sichern oder auf ein anderes Gerät zu übertragen.</p><div class="actions"><button class="btn" data-a="export">' + icon("down") + 'Fortschritt exportieren</button><label class="btn">' + icon("up") + 'Fortschritt importieren<input type="file" accept="application/json,.json" data-chg="import" class="sr"></label><button class="btn btn-bad" data-a="del-ask">' + icon("trash") + "Fortschritt vollständig löschen</button></div>";
    if (SETV.del) o += '<div class="note note-bad" role="alertdialog" aria-label="Löschen bestätigen">' + icon("warn") + '<div><b>Wirklich alles löschen?</b> Antworten, Wiederholungsplan, Prüfungsergebnisse, Favoriten und Einstellungen werden unwiderruflich entfernt.<div class="actions"><button class="btn btn-danger" data-a="del-yes">Ja, endgültig löschen</button><button class="btn" data-a="del-no">Abbrechen</button></div></div></div>';
    o += "</section>";
    o += '<section class="card"><h3>Über diese App</h3><dl class="kv"><dt>Fragenpool</dt><dd>' + SK.questions.length + " eigene Übungsfragen</dd><dt>Mündliche Fälle</dt><dd>" + SK.cases.length + "</dd><dt>Stand der Recherche</dt><dd>" + SK.RESEARCH_DATE + "</dd><dt>Speicherort</dt><dd>nur lokal in diesem Browser</dd></dl></section>";
    return o;
  }
  function applyTheme() {
    var r = document.documentElement, st = S.settings;
    if (st.theme === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", st.theme);
    r.classList.toggle("no-anim", !st.anim);
  }

  /* ================= Rendern ================= */
  var VIEWS = { start: viewStart, dashboard: viewDash, themen: viewThemen, thema: viewThema, lernen: viewLernen, fragen: viewFragen, pruefung: viewPruefung, muendlich: viewMuendlich, glossar: viewGlossar, quellen: viewQuellen, einstellungen: viewSettings };
  var lastRoute = "";
  function render() {
    var r = route(), v = VIEWS[r.name] || viewStart;
    var focusMode = (r.name === "pruefung" && S.exam) || (r.name === "lernen" && SESS);
    document.body.classList.toggle("focus", !!focusMode);
    document.body.classList.toggle("exam", !!(r.name === "pruefung" && S.exam));
    if (r.name !== "pruefung") clearInterval(EXV.timer);
    $("#main").innerHTML = v(r.arg);
    renderNav();
    var key = r.name + "/" + r.arg;
    if (key !== lastRoute) { lastRoute = key; window.scrollTo(0, 0); TTS.stop(); }
    document.title = ({ start: "Start", dashboard: "Fortschritt", themen: "Themen", thema: "Thema", lernen: "Lernen", fragen: "Fragenkatalog", pruefung: "Prüfung", muendlich: "Mündlich", glossar: "Glossar", quellen: "Quellen", einstellungen: "Einstellungen" }[r.name] || "Start") + " · Sachkunde 34a Lerntrainer";
  }

  /* ================= Aktionen ================= */
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  var A = {
    go: function (arg) { location.hash = arg; },
    sheet: function () { var s = $("#sheet"); s.hidden = !s.hidden; },
    "start-mix": function () { startSession({ mode: "mix", areas: [], types: [], count: 20 }); },
    "start-due": function () { startSession({ mode: "faellig", areas: [], types: [], count: 40 }); },
    "start-new": function () { startSession({ mode: "neu", areas: [], types: [], count: 20 }); },
    "start-free": function () { startSession({ mode: "alle", areas: LCFG.areas, types: ["fa"], count: 10, title: "Freie Antworten" }); },
    "start-area": function (id) { startSession({ mode: "mix", areas: [id], types: [], count: 20, title: SK.areas[id].short }); },
    "start-sub": function (arg) { var p = arg.split(":"); startSession({ mode: "mix", areas: [p[0]], sub: p[1], types: [], count: 9999, title: SK.areas[p[0]].subs[p[1]][0] }); },
    learned: function (id) { S.learned[id] = !S.learned[id]; save(); render(); },
    "deck-flip": function () { DECK.flip = !DECK.flip; $("#deck").innerHTML = deckHtml(); $(".flash").focus(); },
    "deck-prev": function () { DECK.i = (DECK.i - 1 + DECK.cards.length) % DECK.cards.length; DECK.flip = false; $("#deck").innerHTML = deckHtml(); },
    "deck-next": function () { DECK.i = (DECK.i + 1) % DECK.cards.length; DECK.flip = false; $("#deck").innerHTML = deckHtml(); },
    "lc-mode": function (m) { LCFG.mode = m; render(); },
    "lc-area": function (a) { toggleIn(LCFG.areas, a); render(); },
    "lc-type": function (t) { toggleIn(LCFG.types, t); render(); },
    "lc-count": function (n) { LCFG.count = +n; render(); },
    "lc-go": function () { startSession(LCFG); },
    pick: function (arg) {
      var c = SESS.cur, q = QBY[c.id], v = +arg; if (c.checked) return;
      if (q.t === "mc") { toggleIn(c.sel, v); if (c.sel.length > q.correctAnswers.length) c.sel.shift(); } else c.sel = [v];
      render(); var b = $('.opt[data-arg="' + v + '"]'); if (b) b.focus();
    },
    check: function () { gradeCur(); },
    reveal: function () { var ta = $("#answer-text"); SESS.cur.text = ta ? ta.value : ""; SESS.cur.checked = true; render(); },
    rate: function (r) { finishCur(r); },
    unsure: function () { var c = SESS.cur, r = S.q[c.id]; r.unsure = true; r.lvl = Math.min(r.lvl, 1); r.due = addDays(today(), srs().unsureDelayDays); c.res = "unsure"; save(); render(); },
    cause: function (e) { var c = SESS.cur; if (c.cause) S.errors[c.cause] = Math.max(0, (S.errors[c.cause] || 1) - 1); c.cause = c.cause === e ? null : e; if (c.cause) S.errors[e] = (S.errors[e] || 0) + 1; save(); render(); },
    fav: function () { var id = SESS.cur.id, r = S.q[id] || (S.q[id] = { a: 0, c: 0, w: 0, lvl: 0 }); r.fav = !r.fav; save(); render(); toast(r.fav ? "Als Favorit gemerkt" : "Favorit entfernt"); },
    skip: function () { var id = SESS.cur.id, r = S.q[id] || (S.q[id] = { a: 0, c: 0, w: 0, lvl: 0 }); r.skip = (r.skip || 0) + 1; save(); SESS.i++; SESS.cur = null; render(); },
    next: function () { TTS.stop(); SESS.i++; SESS.cur = null; render(); window.scrollTo(0, 0); },
    "sess-end": function () { TTS.stop(); recDel(true); SESS = null; render(); },
    "sess-new": function () { SESS = null; render(); },
    "sess-retry": function () { var ids = SESS.retry; SESS = null; startSession({ mode: "fehler", ids: ids, title: "Fehlerwiederholung" }); },
    tts: function (p) { ttsSay(p); },
    "tts-pause": function () { TTS.pause(); }, "tts-resume": function () { TTS.resume(); }, "tts-stop": function () { TTS.stop(); },
    "tts-test": function () { TTS.speak("Das ist ein Test der Vorlesefunktion für die Sachkundeprüfung."); },
    "rec-start": recStart, "rec-stop": recStop, "rec-del": function () { recDel(); },
    "stt-ok": function () { S.settings.sttOk = true; save(); $("#stt-slot").innerHTML = sttHtml(); },
    "stt-toggle": sttToggle,
    "cat-page": function (d) { CAT.page += +d; $("#cat-list").innerHTML = catList(); window.scrollTo(0, 0); },
    "cat-open": function (id) { var ids = catFilter().map(function (q) { return q.id; }); var i = ids.indexOf(id); startSession({ mode: "alle", ids: ids.slice(i).concat(ids.slice(0, i)), title: "Fragenkatalog" }); },
    "cat-run": function () { startSession({ mode: "alle", ids: shuffle(catFilter().map(function (q) { return q.id; })), title: "Auswahl aus dem Katalog" }); },
    "ex-start": function (arg) { EXV.result = null; EXV.confirm = false; buildExam(arg === "short"); render(); },
    "ex-pick": function (arg) {
      var e = S.exam, q = QBY[e.ids[e.i]], sel = e.ans[q.id] || (e.ans[q.id] = []), v = +arg;
      if (q.correctAnswers.length > 1) { toggleIn(sel, v); if (sel.length > 2) sel.shift(); } else e.ans[q.id] = sel[0] === v ? [] : [v];
      save(); render(); var b = $('.opt[data-arg="' + v + '"]'); if (b) b.focus();
    },
    "ex-go": function (i) { var e = S.exam; e.i = Math.max(0, Math.min(e.ids.length - 1, +i)); save(); render(); window.scrollTo(0, 0); },
    "ex-flag": function () { var e = S.exam, id = e.ids[e.i]; e.flag[id] = !e.flag[id]; save(); render(); },
    "ex-submit-ask": function () { EXV.confirm = true; render(); window.scrollTo(0, 0); },
    "ex-submit-no": function () { EXV.confirm = false; render(); },
    "ex-submit": submitExam,
    "ex-close": function () { EXV.result = null; render(); },
    "ex-retry": function () { var ids = EXV.result.wrong; startSession({ mode: "fehler", ids: ids, title: "Fehler aus der Simulation" }); },
    "oral-show": function () { var ta = $("#answer-text"); ORAL.text = ta ? ta.value : ""; ORAL.show = true; render(); },
    "oral-save": function () {
      var r = S.oral[ORAL.id] || (S.oral[ORAL.id] = { n: 0 });
      r.n++; r.last = Date.now(); r.checks = ORAL.checks.slice(); r.score = ORAL.checks.filter(Boolean).length; r.text = ORAL.text;
      day().muendlich++; save(); toast("Selbstbewertung gespeichert: " + r.score + " von " + SK.oralChecklist.length + " Punkten"); render();
    },
    "oral-next": function () {
      var open = SK.cases.filter(function (c) { return !(S.oral[c.id] && S.oral[c.id].n) && c.id !== ORAL.id; });
      var pool = open.length ? open : SK.cases.filter(function (c) { return c.id !== ORAL.id; });
      location.hash = "#/muendlich/" + pool[open.length ? 0 : Math.floor(Math.random() * pool.length)].id;
    },
    "oral-tts": function (p) { var c = CBY[ORAL.id]; TTS.speak(p === "s" ? c.s + " Aufgabe: " + c.a : c.l.join(". ")); },
    theme: function (t) { S.settings.theme = t; save(); applyTheme(); render(); },
    export: function () {
      var data = JSON.stringify({ app: "sachkunde-34a-lerntrainer", exported: new Date().toISOString(), state: S }, null, 2);
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      a.download = "sachkunde-34a-fortschritt-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast("Fortschritt als JSON-Datei exportiert");
    },
    "update-now": function () { if (updateWorker) updateWorker.postMessage("aktualisieren"); },
    "update-later": function () { updateWorker = null; renderBanner(); },
    "del-ask": function () { SETV.del = true; render(); }, "del-no": function () { SETV.del = false; render(); },
    "del-yes": function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      S = defaults(); SESS = null; EXV.result = null; SETV.del = false; applyTheme(); save(); render(); toast("Der gesamte Fortschritt wurde gelöscht");
    }
  };
  var CHG = {
    match: function (i, el) { SESS.cur.pick[+i] = el.value; var b = $('[data-a="check"]'); if (b) b.disabled = !canCheck(QBY[SESS.cur.id], SESS.cur); },
    cat: function (k, el) { CAT[k] = el.value; CAT.page = 0; $("#cat-list").innerHTML = catList(); },
    set: function (k, el) { S.settings[k] = el.checked; if (k === "tts" && !el.checked) TTS.stop(); save(); applyTheme(); render(); },
    "set-val": function (k, el) { S.settings[k] = k === "rate" ? +el.value : el.value; save(); render(); },
    goal: function (k, el) { S.goals[k] = Math.max(0, Math.min(500, parseInt(el.value, 10) || 0)); save(); toast("Tagesziel gespeichert"); },
    srs: function (k, el) {
      var a = el.value.split(/[,;\s]+/).map(Number).filter(function (n) { return n >= 1 && n <= 365; });
      if (a.length < 2) { toast("Bitte mindestens zwei Abstände zwischen 1 und 365 Tagen angeben"); el.value = srs().intervalsDays.join(", "); return; }
      S.srs.intervalsDays = a; save(); el.value = a.join(", "); toast("Wiederholungsabstände gespeichert");
    },
    "oral-check": function (i, el) { ORAL.checks[+i] = el.checked; },
    import: function (k, el) {
      var f = el.files && el.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var d = JSON.parse(fr.result), st = d && d.state ? d.state : d;
          if (!st || typeof st !== "object" || typeof st.q !== "object" || !Array.isArray(st.exams)) throw new Error("format");
          S = merge(defaults(), st); save(); applyTheme(); render(); toast("Fortschritt importiert");
        } catch (e) { toast("Diese Datei ist kein gültiger Fortschritts-Export."); }
      };
      fr.onerror = function () { toast("Die Datei konnte nicht gelesen werden."); };
      fr.readAsText(f); el.value = "";
    }
  };
  var INP = {
    "cat-text": function (el) { CAT.text = el.value; CAT.page = 0; $("#cat-list").innerHTML = catList(); },
    gloss: function (el) { GL = el.value; $("#gloss-list").innerHTML = glossList(); },
    "oral-text": function (el) { ORAL.text = el.value; }
  };

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-a]");
    var sheet = $("#sheet");
    if (!el) { if (!sheet.hidden && !ev.target.closest("#sheet .sheet-in")) sheet.hidden = true; else if (ev.target.closest("#sheet a")) sheet.hidden = true; return; }
    if (el.disabled) return;
    var fn = A[el.getAttribute("data-a")];
    if (fn) { if (el.tagName === "A") ev.preventDefault(); fn(el.getAttribute("data-arg"), el); }
  });
  document.addEventListener("change", function (ev) { var el = ev.target.closest("[data-chg]"); if (el && CHG[el.getAttribute("data-chg")]) CHG[el.getAttribute("data-chg")](el.getAttribute("data-arg"), el); });
  document.addEventListener("input", function (ev) { var el = ev.target.closest("[data-inp]"); if (el && INP[el.getAttribute("data-inp")]) INP[el.getAttribute("data-inp")](el); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { $("#sheet").hidden = true; } });
  window.addEventListener("hashchange", function () {
    $("#sheet").hidden = true;
    if (route().name !== "lernen" && SESS && SESS.i >= SESS.ids.length) SESS = null;
    render(); $("#main").focus({ preventScroll: true });
  });
  window.addEventListener("beforeunload", function () { TTS.stop(); });

  applyTheme(); renderBanner(); render();

  /* Web-App: Offline-Speicher registrieren (nur über http/https, nicht bei Doppelklick auf die Datei). */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    var reloading = false, hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      // Beim allerersten Start (noch kein Offline-Speicher aktiv) nicht neu laden – nur bei einem Update.
      if (!hadController) { hadController = true; return; }
      if (reloading) return; reloading = true; location.reload();
    });
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      function ready(w) { if (w && navigator.serviceWorker.controller) { updateWorker = w; renderBanner(); } }
      if (reg.waiting) ready(reg.waiting);
      reg.addEventListener("updatefound", function () {
        var w = reg.installing; if (!w) return;
        w.addEventListener("statechange", function () { if (w.state === "installed") ready(w); });
      });
    }).catch(function () { /* ohne sw.js (z. B. Einzeldatei) läuft die App normal weiter */ });
  }
  window.SKApp = { state: function () { return S; }, record: record, status: status };
})();
