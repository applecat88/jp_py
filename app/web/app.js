(function () {
  "use strict";

  var MODES = ["calendar", "study", "practice", "test", "listening"];
  var course = null;
  var progress = null;
  var account = null;
  var authToken = "";
  var session = {};
  var speakMap = {};
  var speakSeq = 0;
  var playToken = 0;
  var currentAudio = null;
  var saveTimer = null;

  function todayISO() {
    return iso(new Date());
  }

  function iso(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + "-" + pad(month) + "-" + pad(day);
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function parseDate(value) {
    var parts = String(value || "").split("-");
    if (parts.length !== 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function addDays(date, count) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + count);
    return next;
  }

  function lessonDate(dayNumber) {
    return addDays(parseDate(progress.startDate), dayNumber - 1);
  }

  function dayForDate(date) {
    var start = parseDate(progress.startDate);
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var diff = Math.round((target - start) / 86400000);
    if (diff < 0 || diff >= dayCount()) return null;
    return diff + 1;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dayCount() {
    return course && course.days ? course.days.length : 0;
  }

  function dayByNumber(number) {
    for (var i = 0; i < course.days.length; i++) {
      if (course.days[i].day === number) return course.days[i];
    }
    return course.days[0];
  }

  function currentDay() {
    return dayByNumber(progress.selectedDay || 1);
  }

  function record(number) {
    var key = String(number);
    if (!progress.days[key]) progress.days[key] = { studied: false, tests: [] };
    return progress.days[key];
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function save() {
    window.clearTimeout(saveTimer);
    var token = authToken;
    saveTimer = window.setTimeout(function () {
      var text = JSON.stringify(progress);
      var headers = { "Content-Type": "application/json" };
      if (token) headers["X-Session"] = token;
      try { localStorage.setItem("japanese-study-progress", text); } catch (err) {}
      fetch("/api/progress", {
        method: "POST",
        headers: headers,
        body: text
      }).catch(function () {});
    }, 250);
  }

  function speakId(text, clip) {
    var id = "s" + (++speakSeq);
    speakMap[id] = { text: text, clip: clip || null };
    return id;
  }

  function loadVoices() {
    var note = document.getElementById("voiceNote");
    if (!note) return;
    note.hidden = false;
    note.textContent = "Each word, example, sentence, and reading line plays its own audio file from this project. Start and Stop, speed, and repeat count belong to that line. Pronunciation and Romaji can be shown or hidden on that line.";
  }

  function speak(text, clip, rate) {
    var token = playToken;
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      if (token !== playToken) {
        finish();
        return;
      }
      var request;
      if (clip && clip.day) {
        request = fetch("/api/audio?day=" + clip.day + "&track=" + encodeURIComponent(clip.track) + "&i=" + clip.index);
      } else {
        request = fetch("/api/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text || "" })
        });
      }
      request.then(function (response) {
        if (token !== playToken || !response.ok) throw new Error("audio");
        return response.blob();
      }).then(function (blob) {
        if (token !== playToken) {
          finish();
          return;
        }
        if (currentAudio) {
          currentAudio.pause();
          currentAudio = null;
        }
        var url = URL.createObjectURL(blob);
        var audio = new Audio(url);
        currentAudio = audio;
        audio.volume = volumeLevel();
        audio.playbackRate = Number(rate || progress.rate || 0.9);
        audio.onended = function () {
          URL.revokeObjectURL(url);
          if (currentAudio === audio) currentAudio = null;
          finish();
        };
        audio.onerror = function () {
          URL.revokeObjectURL(url);
          if (currentAudio === audio) currentAudio = null;
          finish();
        };
        var started = audio.play();
        if (started && started.catch) started.catch(function () { finish(); });
      }).catch(function () {
        if (token !== playToken) {
          finish();
          return;
        }
        window.setTimeout(finish, Math.max(1400, String(text || "").length * 160));
      });
    });
  }

  function clampRepeats(raw) {
    var n = parseInt(raw, 10);
    if (!n || n < 1) return 1;
    if (n > 10) return 10;
    return n;
  }

  function listenRepeats() {
    var box = document.getElementById("repeats");
    if (box && String(box.value).length) return clampRepeats(box.value);
    return clampRepeats(progress.repeats || 1);
  }

  function showRomaji() {
    return !progress.hideRomaji;
  }

  function showPronunciation() {
    return !progress.hidePronunciation;
  }

  function guidesHTML(item) {
    var html = "";
    if (!item) return html;
    if (showPronunciation() && item.hira) html += '<p class="pronunciation">' + esc(item.hira) + "</p>";
    if (showRomaji() && item.romaji) html += '<p class="romaji">' + esc(item.romaji) + "</p>";
    return html;
  }

  function guideCells(item) {
    var html = "";
    if (showPronunciation()) html += '<td class="pronunciation">' + esc((item && item.hira) || "") + "</td>";
    if (showRomaji()) html += '<td class="romaji">' + esc((item && item.romaji) || "") + "</td>";
    return html;
  }

  function guideHeads() {
    return (showPronunciation() ? "<th>Pronunciation</th>" : "") + (showRomaji() ? "<th>Romaji</th>" : "");
  }

  function itemKey(track, index) {
    return String(currentDay().day) + "-" + track + "-" + index;
  }

  function itemPrefs(track, index) {
    session.itemPrefs = session.itemPrefs || {};
    var saved = session.itemPrefs[itemKey(track, index)] || {};
    return {
      pron: saved.pron != null ? saved.pron : !progress.hidePronunciation,
      roma: saved.roma != null ? saved.roma : !progress.hideRomaji,
      times: saved.times || clampRepeats(progress.repeats || 1),
      rate: saved.rate || Number(progress.rate || 0.9)
    };
  }

  function readItemInputs(track, index) {
    var prefs = itemPrefs(track, index);
    var root = document.querySelector('[data-review-item="' + track + "-" + index + '"]');
    if (!root) return prefs;
    var times = root.querySelector(".item-times");
    var rate = root.querySelector(".item-rate");
    var pron = root.querySelector('[data-guide="pron"]');
    var roma = root.querySelector('[data-guide="roma"]');
    if (times) prefs.times = clampRepeats(times.value);
    if (rate && String(rate.value).length) prefs.rate = Number(rate.value);
    if (pron) prefs.pron = pron.checked;
    if (roma) prefs.roma = roma.checked;
    session.itemPrefs[itemKey(track, index)] = prefs;
    return prefs;
  }

  function guidesFor(item, track, index) {
    var prefs = itemPrefs(track, index);
    var html = "";
    if (!item) return html;
    if (prefs.pron && item.hira) html += '<p class="pronunciation">' + esc(item.hira) + "</p>";
    if (prefs.roma && item.romaji) html += '<p class="romaji">' + esc(item.romaji) + "</p>";
    return html;
  }

  function itemControls(track, index) {
    var prefs = itemPrefs(track, index);
    return '<div class="item-play">' +
      '<button type="button" class="small primary" data-act="item-start" data-track="' + track + '" data-index="' + index + '">Start</button>' +
      '<button type="button" class="small" data-act="stop">Stop</button>' +
      '<label>Times <input class="item-times" type="number" min="1" max="10" step="1" value="' + prefs.times + '"></label>' +
      '<label>Speed <input class="item-rate" type="range" min="0.6" max="1.2" step="0.1" value="' + prefs.rate + '"></label>' +
      '<label class="check"><input class="item-guide" data-guide="pron" type="checkbox"' + (prefs.pron ? " checked" : "") + "> Pronunciation</label>" +
      '<label class="check"><input class="item-guide" data-guide="roma" type="checkbox"' + (prefs.roma ? " checked" : "") + "> Romaji</label>" +
      '<span class="review-status" data-status="' + track + "-" + index + '"></span></div>';
  }

  function pieceHTML(track, index, item) {
    return '<div class="piece" data-review-item="' + track + "-" + index + '">' +
      itemControls(track, index) +
      '<p class="jp">' + esc(item.jp || "") + "</p>" +
      '<div class="guide-slot">' + guidesFor(item, track, index) + "</div>" +
      (item.en ? '<p class="en">' + esc(item.en) + "</p>" : "") +
      "</div>";
  }

  function sourceTrack(track) {
    return track.indexOf("listen-") === 0 ? track.slice(7) : track;
  }

  function playOne(track, index) {
    var prefs = readItemInputs(track, index);
    var line = (listeningTracks(currentDay())[sourceTrack(track)] || [])[index];
    if (!line) return;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    var token = ++playToken;
    session.playing = true;
    session.itemPlaying = track + "-" + index;
    speakRepeats(line.jp, prefs.times, token, function (pass, count) {
      var label = document.querySelector('[data-status="' + track + "-" + index + '"]');
      if (label) label.textContent = pass + " / " + count;
    }, line.clip, prefs.rate).then(function (finished) {
      if (!finished || token !== playToken) return;
      session.playing = false;
      session.itemPlaying = null;
      var label = document.querySelector('[data-status="' + track + "-" + index + '"]');
      if (label) label.textContent = "";
    });
  }

  function paintGuides(track, index) {
    var root = document.querySelector('[data-review-item="' + track + "-" + index + '"]');
    var slot = root ? root.querySelector(".guide-slot") : null;
    if (!slot) return;
    if (String(track).indexOf("listen-") === 0 && session.listen && session.listen.hide && !(session.listen.revealed && session.listen.revealed[index])) {
      slot.innerHTML = "";
      return;
    }
    var line = (listeningTracks(currentDay())[sourceTrack(track)] || [])[index];
    slot.innerHTML = guidesFor(line, track, index);
  }

  function volumeLevel() {
    var box = document.getElementById("volume");
    var raw = box && String(box.value).length ? Number(box.value) : Number(progress && progress.volume);
    if (raw !== raw) return 1;
    if (raw < 0) return 0;
    if (raw > 1) return 1;
    return raw;
  }

  function speakRepeats(text, times, token, onPass, clip, rate) {
    var count = clampRepeats(times);
    function step(pass) {
      if (token !== playToken) return Promise.resolve(false);
      if (onPass) onPass(pass, count);
      return speak(text, clip, rate).then(function () {
        if (token !== playToken) return false;
        if (pass >= count) return true;
        return new Promise(function (resolve) {
          window.setTimeout(function () {
            step(pass + 1).then(resolve);
          }, 450);
        });
      });
    }
    return step(1);
  }

  function stopAudio() {
    playToken += 1;
    session.playing = false;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function scopeDays() {
    var selected = progress.selectedDay || 1;
    var scope = session.scope || "day";
    if (scope === "day") return [selected];
    if (scope === "week") {
      var start = Math.floor((selected - 1) / 7) * 7 + 1;
      var end = Math.min(dayCount(), start + 6);
      var days = [];
      for (var i = start; i <= end; i++) days.push(i);
      return days;
    }
    var all = [];
    for (var n = 1; n <= selected; n++) all.push(n);
    return all;
  }

  function poolFrom(days, field) {
    var items = [];
    days.forEach(function (number) {
      var day = dayByNumber(number);
      (day[field] || []).forEach(function (item) { items.push(item); });
    });
    return items;
  }

  function optionsFor(correct, pool) {
    var opts = [correct];
    var bag = shuffle(pool.filter(function (item) { return item && item !== correct; }));
    for (var i = 0; i < bag.length && opts.length < 4; i++) {
      if (opts.indexOf(bag[i]) < 0) opts.push(bag[i]);
    }
    return shuffle(opts);
  }

  function render() {
    speakMap = {};
    renderDays();
    renderModes();
    var view = document.getElementById("view");
    if (progress.mode === "calendar") view.innerHTML = calendarHTML();
    else if (progress.mode === "study") view.innerHTML = studyHTML();
    else if (progress.mode === "practice") view.innerHTML = practiceHTML();
    else if (progress.mode === "test") view.innerHTML = testHTML();
    else view.innerHTML = listeningHTML();
  }

  function renderModes() {
    var nav = document.getElementById("modes");
    nav.innerHTML = MODES.map(function (mode) {
      var label = mode.charAt(0).toUpperCase() + mode.slice(1);
      return '<button type="button" data-act="mode" data-mode="' + mode + '"' +
        (progress.mode === mode ? ' class="active"' : "") + ">" + label + "</button>";
    }).join("");
  }

  function renderDays() {
    var query = (document.getElementById("findDay").value || "").trim().toLowerCase();
    var html = course.days.filter(function (day) {
      if (!query) return true;
      var blob = (day.day + " " + day.title + " " + day.goal).toLowerCase();
      if (blob.indexOf(query) >= 0) return true;
      return (day.vocabulary || []).some(function (word) {
        return (word.jp + " " + word.hira + " " + word.romaji + " " + word.en).toLowerCase().indexOf(query) >= 0;
      });
    }).map(function (day) {
      var rec = record(day.day);
      var when = lessonDate(day.day);
      return '<li><button type="button" data-act="open-day" data-day="' + day.day + '"' +
        (day.day === progress.selectedDay ? ' class="current"' : "") + ">" +
        '<span class="num">' + day.day + '</span><span><span class="dot' + (rec.studied ? " on" : "") +
        '"></span> ' + esc(day.title) + '<br><span class="meta">' + iso(when) + "</span></span></button></li>";
    }).join("");
    document.getElementById("dayList").innerHTML = html || "<li>No lesson matches.</li>";
  }

  function clock(isoText) {
    var date = new Date(isoText);
    if (isNaN(date.getTime())) return "";
    var hour = date.getHours();
    var minute = date.getMinutes();
    return hour + ":" + (minute < 10 ? "0" : "") + minute;
  }

  function collectedTests() {
    var list = [];
    var days = progress.days || {};
    Object.keys(days).forEach(function (key) {
      (days[key].tests || []).forEach(function (test) {
        if (!test || !test.at) return;
        list.push({ day: Number(key), score: Number(test.score) || 0, total: Number(test.total) || 0, at: test.at });
      });
    });
    return list;
  }

  function testsOnDate(dayText) {
    return collectedTests().filter(function (test) {
      var date = new Date(test.at);
      return !isNaN(date.getTime()) && iso(date) === dayText;
    });
  }

  function sortTests(list, mode) {
    var copy = list.slice();
    copy.sort(function (a, b) {
      if (mode === "score") {
        var left = a.total ? a.score / a.total : 0;
        var right = b.total ? b.score / b.total : 0;
        if (right !== left) return right - left;
        return String(b.at).localeCompare(String(a.at));
      }
      if (mode === "time") {
        var aDate = new Date(a.at);
        var bDate = new Date(b.at);
        var aMin = aDate.getHours() * 60 + aDate.getMinutes();
        var bMin = bDate.getHours() * 60 + bDate.getMinutes();
        if (bMin !== aMin) return bMin - aMin;
        return String(b.at).localeCompare(String(a.at));
      }
      return String(b.at).localeCompare(String(a.at));
    });
    return copy;
  }

  function scoreScale(test) {
    var total = Number(test.total) || 0;
    var correct = Number(test.score) || 0;
    if (!total) return "0";
    return String(Math.round((correct / total) * 100) / 10);
  }

  function testIdentity(test) {
    if (test && test.identifier) return test.identifier;
    return account && account.identifier ? account.identifier : "";
  }

  function scoreDetailHTML(test) {
    var total = Number(test.total) || 0;
    var correct = Number(test.score) || 0;
    var incorrect = total - correct;
    if (incorrect < 0) incorrect = 0;
    var when = new Date(test.at);
    var taken = isNaN(when.getTime()) ? "" : iso(when) + " · " + clock(test.at);
    return '<dl class="score-detail">' +
      "<div><dt>Identifier</dt><dd>" + esc(testIdentity(test)) + "</dd></div>" +
      "<div><dt>Date</dt><dd>" + esc(taken) + "</dd></div>" +
      "<div><dt>Study day</dt><dd>Day " + test.day + "</dd></div>" +
      "<div><dt>Correct</dt><dd>" + correct + "</dd></div>" +
      "<div><dt>Incorrect</dt><dd>" + incorrect + "</dd></div>" +
      "<div><dt>Score</dt><dd>" + scoreScale(test) + " / 10</dd></div>" +
      "</dl>";
  }

  function testHistoryHTML() {
    var mode = session.testSort || "date";
    var cards = sortTests(collectedTests(), mode).map(function (test) {
      return '<div class="score-card">' + scoreDetailHTML(test) + "</div>";
    }).join("");
    return '<div class="card"><h3>Past results</h3><p class="meta">The score is calculated from the answers. Sort the list, and the same score appears on the calendar at the time it was earned.</p>' +
      '<label>Sort <select id="testSort">' +
      '<option value="date"' + (mode === "date" ? " selected" : "") + ">Date</option>" +
      '<option value="time"' + (mode === "time" ? " selected" : "") + ">Time</option>" +
      '<option value="score"' + (mode === "score" ? " selected" : "") + ">Score</option></select></label>" +
      (cards || "<p>No tests yet.</p>") +
      "</div>";
  }

  function scoreDialogHTML() {
    if (!session.scoreDate) return "";
    var tests = testsOnDate(session.scoreDate);
    var body = tests.length ? tests.map(scoreDetailHTML).join("") : "<p>No test was recorded on this date.</p>";
    return '<div class="dialog-back" data-act="close-score"><div class="dialog" role="dialog" aria-modal="true" aria-label="Score">' +
      "<h3>Score</h3>" + body +
      '<button type="button" class="primary" data-act="close-score">Close</button></div></div>';
  }

  function calendarHTML() {
    var cursor = session.month || new Date();
    var year = cursor.getFullYear();
    var month = cursor.getMonth();
    var first = new Date(year, month, 1);
    var startPad = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var cells = names.map(function (name) { return '<div class="dow">' + name + "</div>"; }).join("");
    for (var i = 0; i < startPad; i++) cells += "<div></div>";
    var today = todayISO();
    for (var date = 1; date <= daysInMonth; date++) {
      var current = new Date(year, month, date);
      var lesson = dayForDate(new Date(year, month, date));
      var classes = "cell";
      if (iso(current) === today) classes += " today";
      if (lesson) classes += " in";
      var dayText = iso(current);
      cells += '<div class="' + classes + '">' +
        '<button type="button" class="cell-main" data-act="cal-day" data-date="' + dayText + '">' +
        "<span>" + date + "</span>" +
        (lesson ? '<span class="lesson">Day ' + lesson + "</span>" : "") +
        testsOnDate(dayText).map(function (test) {
          return '<span class="taken">' + test.score + "/" + test.total + " · " + clock(test.at) + "</span>";
        }).join("") +
        "</button>" +
        '<button type="button" class="view-score" data-act="view-score" data-date="' + dayText + '">View score</button>' +
        "</div>";
    }
    var studied = 0;
    for (var n = 1; n <= dayCount(); n++) if (record(n).studied) studied += 1;
    var todayLesson = dayForDate(parseDate(today));
    return '<div class="monthbar"><button type="button" data-act="month" data-shift="-1">Previous</button>' +
      "<h2>" + first.toLocaleString(undefined, { month: "long", year: "numeric" }) + "</h2>" +
      '<button type="button" data-act="month" data-shift="1">Next</button></div>' +
      '<p class="meta">' + studied + " of " + dayCount() + " lessons marked studied. " +
      (todayLesson ? "Today is lesson " + todayLesson + "." : "Today is outside this course.") +
      "</p>" +
      '<div class="calendar">' + cells + "</div>" + scoreDialogHTML();
  }

  function studyHTML() {
    var day = currentDay();
    var words = day.vocabulary.map(function (word, index) {
      return pieceHTML("word", index, word);
    }).join("");
    var exampleIndex = 0;
    var grammar = day.grammar.map(function (pattern) {
      var examples = (pattern.examples || []).map(function (ex) {
        var mark = exampleIndex;
        exampleIndex += 1;
        return pieceHTML("grammar", mark, ex);
      }).join("");
      return '<div class="card"><h3>' + esc(pattern.title) + "</h3><p>" + esc(pattern.explanation) + "</p>" + examples + "</div>";
    }).join("");
    var sentences = day.sentences.map(function (line, index) {
      return pieceHTML("sentence", index, line);
    }).join("");
    var reading = (day.readingLines || []).map(function (line, index) {
      return pieceHTML("reading", index, line);
    }).join("");
    var writing = day.writing.map(function (item, index) {
      var open = session.writingOpen && session.writingOpen[index];
      return "<li><p>" + esc(item.prompt) + "</p>" +
        (open ? '<p class="jp">' + esc(item.answer) + "</p>" + guidesHTML(item) : '<button type="button" data-act="writing" data-index="' + index + '">Show model</button>') +
        "</li>";
    }).join("");
    var quiz = day.quiz.map(function (item) {
      return "<li>" + esc(item.q) + (session.showQuiz ? "<br><strong>" + esc(item.a) + "</strong>" : "") + "</li>";
    }).join("");
    return '<p class="kicker">Day ' + day.day + " · " + iso(lessonDate(day.day)) + "</p>" +
      "<h2>" + esc(day.title) + "</h2><p class=\"goal\">" + esc(day.goal) + "</p>" +
      '<div class="row"><button type="button" class="primary" data-act="studied">Mark studied</button>' +
      '<button type="button" data-act="play-script">Play listening script</button></div>' +
      '<div class="card"><h3>Vocabulary</h3>' + reviewControls("word") + words + "</div>" +
      '<div class="card"><h3>Examples</h3>' + reviewControls("grammar") +
      "<p class=\"meta\">Each example uses the audio file for that sentence. Start plays it. Stop ends it.</p></div>" + grammar +
      '<div class="card"><h3>Sentences</h3>' + reviewControls("sentence") + sentences + "</div>" +
      '<div class="card"><h3>Reading</h3>' + reading + "</div>" +
      '<div class="card"><h3>Writing</h3><ol>' + writing + "</ol></div>" +
      '<div class="card"><h3>Listening</h3>' + listeningBlock(false) + "</div>" +
      '<div class="card"><h3>Check</h3><ol>' + quiz + "</ol>" +
      '<button type="button" data-act="quiz-answers">Show check answers</button></div>';
  }

  function ensurePractice() {
    if (session.practice && session.practice.day === progress.selectedDay) return;
    session.practice = { day: progress.selectedDay, kind: "words", dir: "jp", index: 0, show: false, draft: "", judged: "" };
  }

  function practiceDeck() {
    ensurePractice();
    var kind = session.practice.kind;
    if (session.practice.deckKind !== kind) {
      var day = currentDay();
      var source = kind === "sentences" ? day.sentences : kind === "writing" ? day.writing : day.vocabulary;
      session.practice.deck = source.slice();
      session.practice.deckKind = kind;
    }
    return session.practice.deck;
  }

  function practiceHTML() {
    ensurePractice();
    var deck = practiceDeck();
    var item = deck[session.practice.index] || deck[0];
    var kind = session.practice.kind;
    var body = "";
    if (!item) body = "<p>This lesson has nothing in that deck.</p>";
    else if (kind === "writing") {
      body = '<p class="en">' + esc(item.prompt) + "</p>" +
        '<textarea id="writeBox">' + esc(session.practice.draft || "") + "</textarea>" +
        '<div class="row"><button type="button" class="primary" data-act="grade-writing">Check</button></div>' +
        (session.practice.judged ? '<p>' + esc(session.practice.judged) + '</p><p class="jp">' + esc(item.answer) + "</p>" +
          guidesHTML(item) + '<button type="button" data-act="write-next">Next</button>' : "");
    } else {
      var front = session.practice.dir === "en" ? item.en : item.jp;
      var back = session.practice.dir === "en" ? item.jp : item.en;
      var place = lessonPlace(kind, item);
      body = '<div class="flash" data-review-item="' + place.track + "-" + place.index + '"><div class="jp">' + esc(front) + "</div>" +
        (session.practice.show ? '<div class="en">' + esc(back) + '</div><div class="guide-slot">' + guidesFor(item, place.track, place.index) + "</div>" : "<p class=\"meta\">Show the other side when you have an answer.</p>") +
        itemControls(place.track, place.index) +
        "</div>" +
        '<div class="row"><button type="button" data-act="flip">Show</button>' +
        '<button type="button" class="good" data-act="card-next" data-jump="1">Got it</button>' +
        '<button type="button" data-act="card-again">Again</button></div>';
    }
    return '<p class="kicker">Practice · day ' + progress.selectedDay + "</p>" +
      "<h2>" + esc(currentDay().title) + "</h2>" +
      '<div class="row">' +
      modeButton("words", "Words") + modeButton("sentences", "Sentences") + modeButton("writing", "Writing") +
      (kind === "writing" ? "" : '<button type="button" data-act="dir">' + (session.practice.dir === "jp" ? "Japanese → English" : "English → Japanese") + "</button>") +
      "</div>" +
      '<p class="meta">' + (session.practice.index + 1) + " / " + deck.length + "</p>" +
      '<div class="card">' + body + "</div>";
  }

  function lessonPlace(kind, item) {
    var day = currentDay();
    var track = kind === "sentences" ? "sentence" : "word";
    var list = kind === "sentences" ? (day.sentences || []) : (day.vocabulary || []);
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].jp === item.jp) return { track: track, index: i };
    }
    return { track: track, index: 0 };
  }

  function modeButton(kind, label) {
    return '<button type="button" data-act="practice-kind" data-kind="' + kind + '"' +
      (session.practice.kind === kind ? ' aria-pressed="true"' : "") + ">" + label + "</button>";
  }

  function buildTest() {
    var days = scopeDays();
    var words = poolFrom(days, "vocabulary").filter(function (word) { return word.en; });
    var lines = [];
    days.forEach(function (number) {
      var day = dayByNumber(number);
      (day.sentences || []).forEach(function (line) { if (line.en) lines.push(line); });
      ((day.listening && day.listening.lines) || []).forEach(function (line) { if (line.en) lines.push(line); });
    });
    var wordEnglish = words.map(function (word) { return word.en; });
    var lineEnglish = lines.map(function (line) { return line.en; });
    var items = [];
    shuffle(words).slice(0, 8).forEach(function (word) {
      items.push({
        type: "mc",
        prompt: word.jp,
        hint: word.hira,
        hira: word.hira,
        romaji: word.romaji,
        answer: word.en,
        options: optionsFor(word.en, wordEnglish)
      });
    });
    shuffle(lines).slice(0, 5).forEach(function (line) {
      items.push({
        type: "listen",
        jp: line.jp,
        hira: line.hira,
        romaji: line.romaji,
        answer: line.en,
        options: optionsFor(line.en, lineEnglish),
        played: false
      });
    });
    currentDay().quiz.forEach(function (item) {
      items.push({ type: "quiz", q: item.q, a: item.a, revealed: false, mark: "" });
    });
    session.test = { items: items, index: 0, score: 0, checked: false, picked: null, done: false, scope: session.scope || "day" };
  }

  function testHTML() {
    if (!session.test) {
      return testStartHTML();
    }
    if (session.test.done) return testDoneHTML();
    var item = session.test.items[session.test.index];
    if (!item) return testDoneHTML();
    var head = '<p class="kicker">Test ' + (session.test.index + 1) + " / " + session.test.items.length + "</p>" +
      "<h2>" + esc(currentDay().title) + "</h2>";
    if (item.type === "mc") {
      return head + '<div class="card"><p class="meta">Choose the English.</p><p class="jp">' + esc(item.prompt) +
        "</p>" + (showPronunciation() && item.hint ? '<p class="pronunciation">' + esc(item.hint) + "</p>" : "") + choiceHTML(item) + "</div>";
    }
    if (item.type === "listen") {
      var playing = item.phase === "playing";
      return head + '<div class="card"><p class="meta">The line plays three times. Then choose the English.</p>' +
        (playing ? "<p>Playing… " + (item.pass || 1) + " / 3</p>" : "") +
        (item.played || playing ? "" : '<button type="button" class="primary" data-act="play-question">Play</button>') +
        (item.played ? choiceHTML(item) : "") +
        (session.test.checked ? '<p class="jp">' + esc(item.jp) + "</p>" + guidesHTML(item) : "") +
        "</div>";
    }
    return head + '<div class="card"><p>' + esc(item.q) + "</p>" +
      (item.checked ? "<p>" + (item.correct ? "Correct." : "Not a match.") + "</p><p><strong>" + esc(item.a) +
        '</strong></p><p><button type="button" class="primary" data-act="next-q">Next</button></p>' :
        '<textarea id="quizBox">' + esc(item.typed || "") + '</textarea><p><button type="button" class="primary" data-act="grade-quiz">Score</button></p>') +
      "</div>";
  }

  function testStartHTML() {
    return '<p class="kicker">Test</p><h2>' + esc(currentDay().title) + "</h2>" +
      '<div class="card"><p>Eight vocabulary questions, five listening questions, then this lesson’s five-question check. Each listening line plays three times before the choices appear.</p>' +
      "<label>Range <select id=\"scope\">" +
      '<option value="day">This lesson</option>' +
      '<option value="week">This week of lessons</option>' +
      '<option value="upto">Day 1 through this lesson</option></select></label>' +
      '<p><button type="button" class="primary" data-act="start-test">Start</button></p></div>' + testHistoryHTML();
  }

  function choiceHTML(item) {
    return '<div class="choices">' + item.options.map(function (option, index) {
      var cls = "";
      if (session.test.checked) {
        if (option === item.answer) cls = " right";
        else if (option === session.test.picked) cls = " wrong";
      }
      return '<button type="button" class="' + cls + '" data-act="pick" data-index="' + index + '">' + esc(option) + "</button>";
    }).join("") + "</div>" +
      (session.test.checked ? '<p><button type="button" class="primary" data-act="next-q">Next</button></p>' : "");
  }

  function testDoneHTML() {
    var detail = {
      day: progress.selectedDay,
      score: session.test.score,
      total: session.test.items.length,
      at: session.test.takenAt || new Date().toISOString(),
      identifier: account && account.identifier ? account.identifier : ""
    };
    return '<div class="card"><p class="kicker">Result</p>' + scoreDetailHTML(detail) +
      '<button type="button" data-act="reset-test">Try again</button></div>' + testHistoryHTML();
  }

  function listeningTracks(day) {
    var vocabulary = (day.vocabulary || []).map(function (word, index) {
      return {
        jp: word.jp, hira: word.hira, romaji: word.romaji, en: word.en,
        clip: { day: day.day, track: "word", index: index }
      };
    });
    var examples = [];
    (day.grammar || []).forEach(function (pattern) {
      (pattern.examples || []).forEach(function (example) {
        examples.push({
          jp: example.jp, hira: example.hira, romaji: example.romaji, en: example.en,
          clip: { day: day.day, track: "grammar", index: examples.length }
        });
      });
    });
    var sentences = (day.sentences || []).map(function (line, index) {
      return {
        jp: line.jp, hira: line.hira, romaji: line.romaji, en: line.en,
        clip: { day: day.day, track: "sentence", index: index }
      };
    });
    var reading = (day.readingLines || []).map(function (line, index) {
      return {
        jp: line.jp, hira: line.hira, romaji: line.romaji, en: line.en,
        clip: { day: day.day, track: "reading", index: index }
      };
    });
    var dictation = ((day.listening && day.listening.lines) || []).map(function (line, index) {
      return {
        jp: line.jp, hira: line.hira, romaji: line.romaji, en: line.en,
        clip: { day: day.day, track: "dictation", index: index }
      };
    });
    var extra = vocabulary.concat(examples).map(function (line, index) {
      return {
        jp: line.jp, hira: line.hira, romaji: line.romaji, en: line.en,
        clip: { day: day.day, track: "extra", index: index }
      };
    });
    return {
      word: vocabulary,
      grammar: examples,
      extra: extra,
      sentence: sentences,
      reading: reading,
      dictation: dictation
    };
  }

  function ensureListen() {
    var day = currentDay();
    if (!session.listen || session.listen.day !== day.day) {
      session.listen = { day: day.day, track: "dictation", index: 0, hide: true, revealed: {}, pass: 0, passes: 1 };
    }
    if (!listeningTracks(day)[session.listen.track]) session.listen.track = "dictation";
    return session.listen;
  }

  function playerHTML(lines) {
    var state = ensureListen();
    var total = lines.length;
    var max = Math.max(0, total - 1);
    var index = Math.min(state.index || 0, max);
    var times = listenRepeats();
    var pass = session.playing ? (state.pass || 1) : 0;
    var passes = state.passes || times;
    var passWidth = passes ? Math.round((pass / passes) * 100) : 0;
    var place = total ? (index + 1) + " / " + total : "0 / 0";
    if (session.playing && pass) place += " · " + pass + " / " + passes;
    return '<div class="player">' +
      '<button type="button" class="primary" data-act="play-all">Start</button>' +
      '<button type="button" data-act="stop">Stop</button>' +
      '<label class="timeline">Timeline <input id="timeline" type="range" min="0" max="' + max + '" step="1" value="' + index + '"> <span id="timelineLabel">' + place + "</span></label>" +
      '<label>Times <input id="repeats" type="number" min="1" max="10" step="1" value="' + times + '"></label>' +
      '<label>Volume <input id="volume" type="range" min="0" max="1" step="0.05" value="' + volumeLevel() + '"> <span id="volumeLabel">' + Math.round(volumeLevel() * 100) + "%</span></label>" +
      '<label>Speed <input id="rate" type="range" min="0.6" max="1.2" step="0.1" value="' + esc(progress.rate || 0.9) + '"></label>' +
      '<a class="small dl" href="' + audioHref(state.day, state.track, 0, true) + '">Download</a>' +
      '<div class="passbar" aria-hidden="true"><span style="width:' + passWidth + '%"></span></div></div>';
  }

  function audioHref(dayNumber, track, index, whole) {
    var href = "/api/audio?day=" + dayNumber + "&track=" + encodeURIComponent(track);
    href += whole ? "&part=all" : "&i=" + index;
    return href + "&dl=1";
  }

  function listenLinesHTML(lines, forceShow) {
    var state = ensureListen();
    var times = listenRepeats();
    return lines.map(function (line, index) {
      var hidden = !forceShow && state.hide && !state.revealed[index];
      var current = index === state.index ? " current" : "";
      var passNote = session.playing && index === state.index && state.pass
        ? " · " + state.pass + " / " + (state.passes || times)
        : "";
      return '<div class="piece listen-line' + current + '" data-review-item="listen-' + state.track + "-" + index + '"><p class="meta">' + (index + 1) + passNote + "</p>" +
        itemControls("listen-" + state.track, index) +
        (hidden ? '<p class="jp">Hidden until you play it</p><div class="guide-slot"></div>' :
          '<p class="jp">' + esc(line.jp) + '</p><div class="guide-slot">' + guidesFor(line, "listen-" + state.track, index) + "</div>" +
          '<p class="en">' + esc(line.en || "") + "</p>") +
        '<a class="small dl" href="' + audioHref(state.day, state.track, index) + '">Download</a></div>';
    }).join("");
  }

  function listeningBlock(practiceHide) {
    var day = currentDay();
    var state = ensureListen();
    var tracks = listeningTracks(day);
    var lines = tracks[state.track] || [];
    var buttons = [
      ["dictation", "Dialogue"],
      ["word", "Vocabulary"],
      ["grammar", "Examples"],
      ["extra", "Vocabulary + examples"],
      ["sentence", "Sentences"],
      ["reading", "Reading"]
    ].map(function (pair) {
      return '<button type="button" data-act="track" data-track="' + pair[0] + '"' +
        (state.track === pair[0] ? ' aria-pressed="true"' : "") + ">" + pair[1] + " (" + (tracks[pair[0]] || []).length + ")</button>";
    }).join("");
    var questions = "";
    if (state.track === "dictation") {
      questions = '<div class="card"><h3>Questions</h3><ol>' + (day.listening.questions || []).map(function (item) {
        return "<li>" + esc(item.q) + (session.showListenAnswers ? "<br><strong>" + esc(item.a) + "</strong>" : "") + "</li>";
      }).join("") + "</ol>" + '<button type="button" data-act="listen-answers">Show answers</button></div>';
    }
    var hideControl = practiceHide
      ? '<label class="check"><input id="hideLines" type="checkbox"' + (state.hide ? " checked" : "") + "> Hide text</label>"
      : "";
    return '<div class="row">' + buttons + "</div>" + playerHTML(lines) + hideControl +
      listenLinesHTML(lines, !practiceHide) + questions;
  }

  function reviewControls(track) {
    var times = clampRepeats(progress.repeats || 1);
    return '<div class="review-head"><label>Times <input class="study-times" type="number" min="1" max="10" step="1" value="' + times + '"></label>' +
      '<button type="button" class="primary" data-act="review-start" data-track="' + track + '">Start</button>' +
      '<button type="button" data-act="stop">Stop</button>' +
      '<span class="review-status" data-status="' + track + '"></span></div>';
  }

  function clearStudyMark() {
    var nodes = document.querySelectorAll(".review-current");
    var i;
    for (i = 0; i < nodes.length; i++) nodes[i].classList.remove("review-current");
    var labels = document.querySelectorAll(".review-status");
    for (i = 0; i < labels.length; i++) labels[i].textContent = "";
  }

  function markStudy(track, index, pass, count) {
    clearStudyMark();
    var current = document.querySelector('[data-review-item="' + track + "-" + index + '"]');
    if (current) {
      current.classList.add("review-current");
      if (current.scrollIntoView) current.scrollIntoView({ block: "nearest" });
    }
    var labels = document.querySelectorAll(".review-status");
    for (var i = 0; i < labels.length; i++) {
      if (labels[i].getAttribute("data-status") === track) {
        labels[i].textContent = (index + 1) + " · " + pass + " / " + count;
      }
    }
  }

  function playStudy(track, times) {
    progress.repeats = clampRepeats(times);
    var lines = listeningTracks(currentDay())[track] || [];
    var token = ++playToken;
    session.playing = true;
    session.studyReview = track;
    function step(index) {
      if (token !== playToken) return;
      if (index >= lines.length) {
        session.playing = false;
        session.studyReview = null;
        clearStudyMark();
        return;
      }
      speakRepeats(lines[index].jp, clampRepeats(progress.repeats || 1), token, function (pass, count) {
        if (token !== playToken) return;
        markStudy(track, index, pass, count);
      }, lines[index].clip).then(function (finished) {
        if (!finished || token !== playToken) return;
        window.setTimeout(function () { step(index + 1); }, 350);
      });
    }
    step(0);
  }

  function listeningHTML() {
    if (session.listenAll) return allListeningHTML();
    var day = currentDay();
    return '<p class="kicker">Listening · day ' + day.day + "</p><h2>" + esc(day.title) + "</h2>" +
      '<div class="row"><button type="button" data-act="listen-scope" data-scope="all">All lessons</button></div>' +
      listeningBlock(true);
  }

  function catalogLines(day, track) {
    var lines = listeningTracks(day)[track] || [];
    return lines.map(function (line, index) {
      return '<div class="listen-line"><p class="meta">' + (index + 1) + "</p>" +
        '<p class="jp">' + esc(line.jp) + "</p>" +
        guidesHTML(line) +
        '<p class="en">' + esc(line.en || "") + "</p>" +
        '<a class="small dl" href="' + audioHref(day.day, track, index) + '">Download</a></div>';
    }).join("");
  }

  function allListeningHTML() {
    var days = course.days || [];
    var tracks = [
      ["dictation", "Dialogue"],
      ["word", "Vocabulary"],
      ["grammar", "Examples"],
      ["sentence", "Sentences"],
      ["reading", "Reading"]
    ];
    var blocks = days.map(function (day) {
      var body = tracks.map(function (pair) {
        var lines = listeningTracks(day)[pair[0]] || [];
        if (!lines.length) return "";
        return "<h4>" + pair[1] + " (" + lines.length + ') <a class="small dl" href="' +
          audioHref(day.day, pair[0], 0, true) + '">Download</a></h4>' + catalogLines(day, pair[0]);
      }).join("");
      return '<details class="card"' + (day.day === progress.selectedDay ? " open" : "") + ">" +
        "<summary>Day " + day.day + " · " + esc(day.title) + "</summary>" + body + "</details>";
    }).join("");
    return '<p class="kicker">Listening · all lessons</p><h2>Every listening line</h2>' +
      '<div class="row"><button type="button" data-act="listen-scope" data-scope="lesson">This lesson</button></div>' +
      '<p class="meta">' + days.length + " lessons. Nanami speaks each line. Download saves that line. Download beside a heading saves the whole track.</p>" +
      blocks;
  }

  function playLines(lines, start) {
    var token = ++playToken;
    session.playing = true;
    function step(index) {
      if (token !== playToken) return;
      if (index >= lines.length) {
        session.playing = false;
        if (session.listen) {
          session.listen.pass = 0;
          session.listen.index = 0;
        }
        render();
        return;
      }
      session.listen.index = index;
      speakRepeats(lines[index].jp, listenRepeats(), token, function (pass, count) {
        if (!session.listen) return;
        session.listen.pass = pass;
        session.listen.passes = count;
        render();
      }, lines[index].clip).then(function (finished) {
        if (!finished || token !== playToken) return;
        session.listen.revealed[index] = true;
        render();
        window.setTimeout(function () { step(index + 1); }, 350);
      });
    }
    step(start);
  }

  function onClick(event) {
    var el = event.target.closest ? event.target.closest("[data-act]") : null;
    if (!el || !document.getElementById("view").contains(el) && !document.getElementById("modes").contains(el) && !document.getElementById("dayList").contains(el)) {
      return;
    }
    var act = el.getAttribute("data-act");
    if (act === "mode") {
      stopAudio();
      progress.mode = el.getAttribute("data-mode");
      save();
      render();
      return;
    }
    if (act === "listen-scope") {
      stopAudio();
      session.listenAll = el.getAttribute("data-scope") === "all";
      render();
      return;
    }
    if (act === "open-day") {
      stopAudio();
      progress.selectedDay = Number(el.getAttribute("data-day"));
      progress.mode = progress.mode === "calendar" ? "study" : progress.mode;
      session.practice = null;
      session.test = null;
      session.listen = null;
      session.listenAll = false;
      save();
      render();
      return;
    }
    if (act === "view-score") {
      session.scoreDate = el.getAttribute("data-date");
      render();
      return;
    }
    if (act === "close-score") {
      if (el.classList.contains("dialog-back") && event.target !== el) return;
      session.scoreDate = null;
      render();
      return;
    }
    if (act === "cal-day") {
      var lesson = dayForDate(parseDate(el.getAttribute("data-date")));
      if (!lesson) return;
      progress.selectedDay = lesson;
      progress.mode = "study";
      session.practice = null;
      session.test = null;
      session.scoreDate = null;
      save();
      render();
      return;
    }
    if (act === "month") {
      var cursor = session.month || new Date();
      session.month = new Date(cursor.getFullYear(), cursor.getMonth() + Number(el.getAttribute("data-shift")), 1);
      render();
      return;
    }
    if (act === "speak") {
      stopAudio();
      clearStudyMark();
      session.playing = false;
      session.studyReview = null;
      var spoken = speakMap[el.getAttribute("data-id")] || { text: "" };
      speak(spoken.text || "", spoken.clip);
      return;
    }
    if (act === "studied") {
      record(progress.selectedDay).studied = true;
      save();
      render();
      return;
    }
    if (act === "writing") {
      session.writingOpen = session.writingOpen || {};
      session.writingOpen[el.getAttribute("data-index")] = true;
      render();
      return;
    }
    if (act === "listen-answers") {
      session.showListenAnswers = true;
      render();
      return;
    }
    if (act === "quiz-answers") {
      session.showQuiz = true;
      render();
      return;
    }
    if (act === "play-script") {
      session.listen = { day: progress.selectedDay, track: "dictation", index: 0, hide: false, revealed: {} };
      progress.mode = "listening";
      save();
      render();
      playLines(currentDay().listening.lines, 0);
      return;
    }
    if (act === "practice-kind") {
      session.practice.kind = el.getAttribute("data-kind");
      session.practice.index = 0;
      session.practice.show = false;
      session.practice.draft = "";
      session.practice.judged = "";
      render();
      return;
    }
    if (act === "dir") {
      session.practice.dir = session.practice.dir === "jp" ? "en" : "jp";
      session.practice.show = false;
      render();
      return;
    }
    if (act === "flip") {
      session.practice.show = true;
      render();
      return;
    }
    if (act === "card-next" || act === "card-again") {
      var deck = practiceDeck();
      if (act === "card-again") {
        deck.push(deck.splice(session.practice.index, 1)[0]);
      } else {
        session.practice.index = (session.practice.index + 1) % deck.length;
      }
      session.practice.show = false;
      render();
      return;
    }
    if (act === "write-next") {
      var writingDeck = practiceDeck();
      session.practice.index = (session.practice.index + 1) % writingDeck.length;
      session.practice.draft = "";
      session.practice.judged = "";
      render();
      return;
    }
    if (act === "grade-writing") {
      var box = document.getElementById("writeBox");
      var typed = box ? box.value : "";
      session.practice.draft = typed;
      var answer = practiceDeck()[session.practice.index].answer;
      var norm = function (text) { return String(text || "").replace(/[\s。、．，.!?！？]/g, ""); };
      session.practice.judged = norm(typed) && norm(typed) === norm(answer)
        ? "This matches the model."
        : "The model answer is different. Compare the two lines.";
      render();
      return;
    }
    if (act === "item-start") {
      playOne(el.getAttribute("data-track"), Number(el.getAttribute("data-index")));
      return;
    }
    if (act === "grade-quiz") {
      var quizItem = session.test && session.test.items[session.test.index];
      var quizBox = document.getElementById("quizBox");
      if (!quizItem || quizItem.checked) return;
      quizItem.typed = quizBox ? quizBox.value : "";
      var compact = function (text) { return String(text || "").replace(/[\s。、．，.!?！？]/g, "").toLowerCase(); };
      quizItem.correct = compact(quizItem.typed) && compact(quizItem.typed) === compact(quizItem.a);
      quizItem.checked = true;
      if (quizItem.correct) session.test.score += 1;
      render();
      return;
    }
    if (act === "start-test") {
      var scope = document.getElementById("scope");
      session.scope = scope ? scope.value : "day";
      buildTest();
      session.test.dayNote = progress.selectedDay;
      render();
      return;
    }
    if (act === "pick") {
      if (!session.test || session.test.checked) return;
      var item = session.test.items[session.test.index];
      session.test.picked = item.options[Number(el.getAttribute("data-index"))];
      session.test.checked = true;
      if (session.test.picked === item.answer) session.test.score += 1;
      render();
      return;
    }
    if (act === "play-question") {
      var listenItem = session.test.items[session.test.index];
      if (listenItem.phase === "playing") return;
      var questionToken = ++playToken;
      listenItem.phase = "playing";
      listenItem.pass = 1;
      speakRepeats(listenItem.jp, 3, questionToken, function (pass) {
        listenItem.pass = pass;
        render();
      }).then(function (finished) {
        if (!finished) return;
        listenItem.phase = "ask";
        listenItem.played = true;
        render();
      });
      return;
    }
    if (act === "next-q") {
      session.test.index += 1;
      session.test.checked = false;
      session.test.picked = null;
      if (session.test.index >= session.test.items.length) finishTest();
      render();
      return;
    }
    if (act === "reveal-quiz") {
      session.test.items[session.test.index].revealed = true;
      render();
      return;
    }
    if (act === "self") {
      var quizItem = session.test.items[session.test.index];
      quizItem.mark = el.getAttribute("data-mark");
      if (quizItem.mark === "yes") session.test.score += 1;
      session.test.index += 1;
      if (session.test.index >= session.test.items.length) finishTest();
      render();
      return;
    }
    if (act === "reset-test") {
      session.test = null;
      render();
      return;
    }
    if (act === "track") {
      stopAudio();
      session.listen.track = el.getAttribute("data-track");
      session.listen.index = 0;
      session.listen.revealed = {};
      render();
      return;
    }
    if (act === "play-line") {
      var index = Number(el.getAttribute("data-index"));
      var lineToken = ++playToken;
      var lineTimes = listenRepeats();
      session.playing = true;
      session.listen.index = index;
      var line = listeningTracks(currentDay())[session.listen.track][index];
      speakRepeats(line.jp, lineTimes, lineToken, function (pass, count) {
        session.listen.pass = pass;
        session.listen.passes = count;
        render();
      }, line.clip).then(function (finished) {
        if (!finished) return;
        session.listen.revealed[index] = true;
        session.playing = false;
        session.listen.pass = 0;
        render();
      });
      return;
    }
    if (act === "review-start") {
      var head = el.parentNode;
      var box = head ? head.querySelector(".study-times") : null;
      var times = box && String(box.value).length ? box.value : progress.repeats;
      playStudy(el.getAttribute("data-track"), times);
      return;
    }
    if (act === "play-all") {
      var trackLines = listeningTracks(currentDay())[session.listen.track];
      playLines(trackLines, session.listen.index || 0);
      return;
    }
    if (act === "stop") {
      stopAudio();
      session.studyReview = null;
      session.itemPlaying = null;
      clearStudyMark();
      render();
      return;
    }
  }

  function finishTest() {
    session.test.done = true;
    session.test.takenAt = new Date().toISOString();
    var rec = record(progress.selectedDay);
    rec.tests.push({
      score: session.test.score,
      total: session.test.items.length,
      at: session.test.takenAt,
      scope: session.scope || "day",
      identifier: account && account.identifier ? account.identifier : ""
    });
    rec.studied = true;
    save();
  }

  function authHeaders() {
    var headers = { "Content-Type": "application/json" };
    if (authToken) headers["X-Session"] = authToken;
    return headers;
  }

  function showGate(which) {
    document.body.classList.add("locked");
    document.getElementById("gate").hidden = false;
    document.getElementById("who").hidden = true;
    document.getElementById("signOut").hidden = true;
    document.getElementById("loginForm").hidden = which === "register";
    document.getElementById("registerForm").hidden = which !== "register";
    document.getElementById("gateTitle").textContent = which === "register" ? "Create your account" : "Sign in";
    document.getElementById("gateNote").textContent = which === "register"
      ? "This identifier is not registered. Add your name, gender, and date of birth to create the account."
      : "Enter your identifier and password. A new identifier starts registration.";
  }

  function showApp() {
    document.body.classList.remove("locked");
    document.getElementById("gate").hidden = true;
    document.getElementById("who").hidden = false;
    document.getElementById("who").textContent = account.identifier;
    document.getElementById("signOut").hidden = false;
  }

  function enterAccount(data) {
    account = data.user;
    authToken = data.token || authToken;
    try { localStorage.setItem("japanese-study-session", authToken); } catch (err) {}
    showApp();
    boot(course, data.progress || {});
  }

  function signOut() {
    var token = authToken;
    authToken = "";
    account = null;
    try { localStorage.removeItem("japanese-study-session"); } catch (err) {}
    showGate("login");
    if (token) {
      fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json", "X-Session": token }, body: "{}" }).catch(function () {});
    }
  }

  var bound = false;

  function bind() {
    if (bound) return;
    bound = true;
    document.getElementById("view").addEventListener("click", onClick);
    document.getElementById("modes").addEventListener("click", onClick);
    document.getElementById("dayList").addEventListener("click", onClick);
    document.getElementById("findDay").addEventListener("input", renderDays);
    document.getElementById("startDate").addEventListener("change", function (event) {
      progress.startDate = event.target.value || todayISO();
      save();
      render();
    });
    document.getElementById("signOut").addEventListener("click", signOut);
    document.getElementById("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var identifier = document.getElementById("loginId").value;
      var password = document.getElementById("loginPassword").value;
      var error = document.getElementById("loginError");
      error.textContent = "";
      fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier, password: password })
      }).then(function (res) { return res.json(); }).then(function (data) {
        if (data.ok) {
          enterAccount(data);
          return;
        }
        if (!data.registered) {
          document.getElementById("regId").value = identifier.trim();
          document.getElementById("regPassword").value = password;
          document.getElementById("regError").textContent = "";
          showGate("register");
          return;
        }
        error.textContent = data.error || "Sign in failed.";
      }).catch(function () {
        error.textContent = "The study app did not answer. Start it with StartJapaneseStudy.bat.";
      });
    });
    document.getElementById("regBack").addEventListener("click", function () {
      document.getElementById("loginError").textContent = "";
      showGate("login");
    });
    document.getElementById("registerForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var error = document.getElementById("regError");
      error.textContent = "";
      var payload = {
        name: document.getElementById("regName").value,
        identifier: document.getElementById("regId").value,
        gender: document.getElementById("regGender").value,
        birth: document.getElementById("regBirth").value,
        password: document.getElementById("regPassword").value
      };
      fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) { return res.json(); }).then(function (data) {
        if (data.ok) {
          enterAccount(data);
          return;
        }
        error.textContent = data.error || "Registration failed.";
      }).catch(function () {
        error.textContent = "The study app did not answer. Start it with StartJapaneseStudy.bat.";
      });
    });
    document.getElementById("todayBtn").addEventListener("click", function () {
      var lesson = dayForDate(parseDate(todayISO()));
      progress.selectedDay = lesson || 1;
      progress.mode = "study";
      session.month = new Date();
      save();
      render();
    });
    document.getElementById("hideRomaji").addEventListener("change", function (event) {
      progress.hideRomaji = event.target.checked;
      session.itemPrefs = {};
      save();
      render();
    });
    document.getElementById("hidePronunciation").addEventListener("change", function (event) {
      progress.hidePronunciation = event.target.checked;
      session.itemPrefs = {};
      save();
      render();
    });
    document.getElementById("view").addEventListener("input", function (event) {
      if (event.target.id === "writeBox" && session.practice) session.practice.draft = event.target.value;
      if (event.target.id === "hideLines" && session.listen) {
        session.listen.hide = event.target.checked;
        render();
      }
      if (event.target.id === "rate") {
        progress.rate = Number(event.target.value);
        if (currentAudio) currentAudio.playbackRate = progress.rate;
        save();
      }
      if (event.target.id === "volume") {
        progress.volume = volumeLevel();
        if (currentAudio) currentAudio.volume = progress.volume;
        save();
        var volumeLabel = document.getElementById("volumeLabel");
        if (volumeLabel) volumeLabel.textContent = Math.round(progress.volume * 100) + "%";
      }
      if (event.target.classList && event.target.classList.contains("study-times")) {
        var typed = parseInt(event.target.value, 10);
        if (typed >= 1 && typed <= 10) {
          progress.repeats = typed;
          var boxes = document.querySelectorAll(".study-times, #repeats");
          for (var b = 0; b < boxes.length; b++) {
            if (boxes[b] !== event.target) boxes[b].value = typed;
          }
          save();
        }
      }
      if (event.target.classList && (event.target.classList.contains("item-times") || event.target.classList.contains("item-rate"))) {
        var rateRoot = event.target.closest ? event.target.closest("[data-review-item]") : null;
        var rateStart = rateRoot ? rateRoot.querySelector("[data-act='item-start']") : null;
        if (rateStart) {
          var live = readItemInputs(rateStart.getAttribute("data-track"), Number(rateStart.getAttribute("data-index")));
          if (event.target.classList.contains("item-rate") && currentAudio && session.itemPlaying === rateStart.getAttribute("data-track") + "-" + rateStart.getAttribute("data-index")) {
            currentAudio.playbackRate = live.rate;
          }
        }
      }
      if (event.target.id === "timeline") {
        var timelineLabel = document.getElementById("timelineLabel");
        var timelineMax = Number(event.target.max);
        if (timelineLabel) timelineLabel.textContent = (Number(event.target.value) + 1) + " / " + (timelineMax + 1);
      }
    });
    document.getElementById("view").addEventListener("change", function (event) {
      if (event.target.id === "scope") session.scope = event.target.value;
      if (event.target.id === "testSort") {
        session.testSort = event.target.value;
        render();
      }
      if (event.target.classList && event.target.classList.contains("item-guide")) {
        var guideRoot = event.target.closest ? event.target.closest("[data-review-item]") : null;
        var starter = guideRoot ? guideRoot.querySelector("[data-act='item-start']") : null;
        if (starter) {
          readItemInputs(starter.getAttribute("data-track"), Number(starter.getAttribute("data-index")));
          paintGuides(starter.getAttribute("data-track"), Number(starter.getAttribute("data-index")));
        }
      }
      if (event.target.id === "repeats") {
        progress.repeats = clampRepeats(event.target.value);
        event.target.value = progress.repeats;
        save();
        render();
      }
      if (event.target.id === "timeline" && session.listen) {
        session.listen.index = Number(event.target.value);
        if (session.playing) {
          var seekLines = listeningTracks(currentDay())[session.listen.track] || [];
          playLines(seekLines, session.listen.index);
        } else {
          render();
        }
      }
    });
  }

  function boot(courseData, saved) {
    course = courseData;
    progress = saved && saved.days ? saved : {
      startDate: todayISO(),
      selectedDay: 1,
      mode: "calendar",
      hideRomaji: false,
      hidePronunciation: false,
      rate: 0.9,
      repeats: 1,
      volume: 1,
      days: {}
    };
    progress.days = progress.days || {};
    progress.startDate = progress.startDate || todayISO();
    progress.mode = MODES.indexOf(progress.mode) >= 0 ? progress.mode : "calendar";
    progress.selectedDay = progress.selectedDay || 1;
    progress.repeats = clampRepeats(progress.repeats || 1);
    progress.volume = volumeLevel();
    document.getElementById("startDate").value = progress.startDate;
    document.getElementById("hideRomaji").checked = !!progress.hideRomaji;
    document.getElementById("hidePronunciation").checked = !!progress.hidePronunciation;
    var eyebrow = document.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = dayCount() + " days · client work";
    var lesson = dayForDate(parseDate(todayISO()));
    if (lesson && !saved) progress.selectedDay = lesson;
    session.month = lessonDate(progress.selectedDay);
    bind();
    loadVoices();
    if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;
    render();
  }

  bind();
  var birth = document.getElementById("regBirth");
  if (birth) birth.max = todayISO();

  fetch("/api/course").then(function (res) { return res.json(); }).then(function (courseData) {
    course = courseData;
    try { authToken = localStorage.getItem("japanese-study-session") || ""; } catch (err) { authToken = ""; }
    if (!authToken) {
      showGate("login");
      return;
    }
    fetch("/api/session", { headers: authHeaders() }).then(function (res) {
      if (!res.ok) throw new Error("session");
      return res.json();
    }).then(function (data) {
      data.token = authToken;
      enterAccount(data);
    }).catch(function () {
      authToken = "";
      try { localStorage.removeItem("japanese-study-session"); } catch (err2) {}
      showGate("login");
    });
  }).catch(function () {
    document.getElementById("gateNote").textContent = "The course did not load. Start the app with StartJapaneseStudy.bat so this page is served from this PC.";
  });
})();
