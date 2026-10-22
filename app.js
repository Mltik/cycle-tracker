(function () {
  "use strict";

  // ---------- Константы, основанные на источниках (см. tips.js) ----------
  const NORM = {
    cycleMin: 24, cycleMax: 38,      // FIGO 2018
    periodMax: 8,                    // FIGO 2018
    variationMax: 9,                 // FIGO 2018: разброс ≤ 7–9 дней
    variationDoctor: 20,             // NHS: разница ≥ 20 дней
    fertileBefore: 5,                // Wilcox 1995: 5 дней до овуляции + день овуляции
    luteal: 14                       // классическая оценка; Bull 2019: в среднем 12,4 (разброс большой)
  };
  const HISTORY_FOR_AVG = 6;         // сколько последних циклов брать для прогноза
  const GAP_DAYS = 60;
  const STORE_KEY = "cycle-tracker-v1";

  const SYMPTOMS = [
    ["cramps", "Спазмы/боль внизу живота"], ["headache", "Головная боль"], ["backache", "Боль в пояснице"],
    ["bloating", "Вздутие"], ["breasts", "Чувствительность груди"], ["acne", "Высыпания"],
    ["fatigue", "Усталость"], ["irritability", "Раздражительность"], ["anxiety", "Тревожность"],
    ["sadness", "Грусть/плаксивость"], ["cravings", "Тяга к еде"], ["insomnia", "Плохой сон"],
    ["nausea", "Тошнота"], ["libido", "Повышенное либидо"]
  ];
  const FLOW = [["spotting", "Мажущие"], ["light", "Слабые"], ["medium", "Средние"], ["heavy", "Обильные"]];
  // Боль: шкала 0–10. Границы «слабая / умеренная / сильная» — по исследованию шкал боли (см. tips.js, id "pain-describe").
  const painLevel = n => n == null ? "" : n === 0 ? "нет боли" : n <= 4 ? "слабая" : n <= 6 ? "умеренная" : "сильная";
  const painClass = n => n == null || n === 0 ? "p0" : n <= 4 ? "p1" : n <= 6 ? "p2" : "p3";
  const PAIN_PLACES = [["belly", "Низ живота"], ["back", "Поясница"], ["head", "Голова"], ["breasts", "Грудь"],
    ["legs", "Ноги/бёдра"], ["side", "Бок (справа/слева)"], ["sex", "При близости"], ["toilet", "В туалете"], ["other", "Другое"]];
  const PAIN_TYPES = [["cramping", "Схваткообразная/спазмы"], ["aching", "Ноющая"], ["sharp", "Острая/колющая"], ["pulling", "Тянущая"],
    ["throbbing", "Пульсирующая"], ["burning", "Жгучая"], ["pressing", "Давящая"]];
  const PAIN_HELP = [["yes", "Помогло"], ["partly", "Частично"], ["no", "Не помогло"]];
  const PAIN_HINTS = ["Своими словами: ", "Началась: ", "Длится: ", "Усиливается, когда: ", "Помогает: ", "Мешает делам: ", "Похоже на прошлый раз? "];
  const MOOD = [["good", "😊 Хорошее"], ["ok", "😐 Ровное"], ["low", "😔 Подавленное"], ["irritable", "😠 Раздражённое"]];
  const ENERGY = [["high", "Много сил"], ["normal", "Обычно"], ["low", "Мало сил"]];
  const PHASES = {
    menstrual: "Месячные", follicular: "Фолликулярная фаза", fertile: "Фертильное окно",
    ovulation: "Овуляция (оценка)", luteal: "Лютеиновая фаза", unknown: "Нет данных"
  };
  const LABEL = Object.fromEntries([...SYMPTOMS, ...FLOW, ...MOOD, ...ENERGY, ...PAIN_PLACES, ...PAIN_TYPES, ...PAIN_HELP]);

  // ---------- Даты (строки YYYY-MM-DD, без часовых поясов) ----------
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5); // b - a в днях
  const todayIso = () => iso(new Date());
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const human = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const humanY = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const plural = (n, a, b, c) => { const m = Math.abs(n) % 100, k = m % 10; return m > 10 && m < 20 ? c : k > 1 && k < 5 ? b : k === 1 ? a : c; };
  const days = n => `${n} ${plural(n, "день", "дня", "дней")}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Хранилище ----------
  // старые записи боли (0–3) переводим в шкалу 0–10
  function migrate(logs) {
    const map = { "0": 0, "1": 3, "2": 5, "3": 8 };
    for (const l of Object.values(logs || {})) {
      if (l.pain != null && l.painScore == null && map[l.pain] != null) l.painScore = map[l.pain];
      delete l.pain;
    }
    return logs || {};
  }
  function load() {
    const empty = { periods: [], logs: {}, settings: { name: "", defaultCycle: 28, defaultPeriod: 5 } };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return empty;
      const data = JSON.parse(raw);
      return { periods: data.periods || [], logs: migrate(data.logs), settings: Object.assign(empty.settings, data.settings || {}) };
    } catch (e) { return empty; }
  }
  let state = load();
  let storageOk = true;
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); storageOk = true; }
    catch (e) { storageOk = false; alert("Не удалось сохранить данные в браузере. Сохраните копию в файл."); }
    render();
  }
  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------- Расчёты ----------
  function sortedPeriods() { return [...state.periods].sort((a, b) => a.start.localeCompare(b.start)); }

  function analyze() {
    const today = todayIso();
    const periods = sortedPeriods();
    const cycles = [];
    for (let i = 1; i < periods.length; i++) {
      cycles.push({ start: periods[i - 1].start, length: diff(periods[i - 1].start, periods[i].start) });
    }
    const recent = cycles.slice(-HISTORY_FOR_AVG);
    // разрыв > 60 дней — скорее всего пропущенная запись; в прогноз его не берём
    const lens = recent.map(c => c.length).filter(l => l <= GAP_DAYS);
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const avgCycle = lens.length ? mean(lens) : null;
    const sd = lens.length > 1 ? Math.sqrt(lens.reduce((s, x) => s + (x - avgCycle) ** 2, 0) / (lens.length - 1)) : null;
    const periodLens = periods.filter(p => p.end).map(p => diff(p.start, p.end) + 1);
    const avgPeriod = periodLens.length ? mean(periodLens.slice(-HISTORY_FOR_AVG)) : null;

    const cycleLen = Math.round(avgCycle || state.settings.defaultCycle);
    const periodLen = Math.round(avgPeriod || state.settings.defaultPeriod);
    const last = periods[periods.length - 1] || null;

    let next = null, earliest = null, latest = null, ovulation = null, fertileStart = null;
    if (last) {
      next = addDays(last.start, cycleLen);
      const minL = lens.length >= 2 ? Math.min(...lens) : cycleLen;
      const maxL = lens.length >= 2 ? Math.max(...lens) : cycleLen;
      earliest = addDays(last.start, minL);
      latest = addDays(last.start, maxL);
      ovulation = addDays(next, -NORM.luteal);
      fertileStart = addDays(ovulation, -NORM.fertileBefore);
    }
    const cycleDay = last ? diff(last.start, today) + 1 : null;
    const ongoing = last && !last.end && cycleDay <= 10;
    const inPeriod = last && (last.end ? today >= last.start && today <= last.end : ongoing);
    const late = next && today > next ? diff(next, today) : 0;

    return {
      today, periods, cycles, recent, lens, avgCycle, sd, avgPeriod, periodLens, cycleLen, periodLen,
      last, next, earliest, latest, ovulation, fertileStart, cycleDay, inPeriod, late,
      confidence: lens.length >= 3 ? "high" : lens.length >= 1 ? "mid" : "low"
    };
  }

  // Прогнозные дни для календаря: месячные, фертильное окно, овуляция на несколько циклов вперёд.
  function projection(a) {
    const map = {};
    if (!a.last) return map;
    // текущий цикл
    if (a.ovulation) {
      for (let i = 0; i <= NORM.fertileBefore; i++) map[addDays(a.fertileStart, i)] = "fertile";
      map[a.ovulation] = "ovulation";
    }
    let start = a.next;
    if (a.late > 0) start = addDays(a.today, 1); // при задержке прогноз сдвигается
    for (let k = 0; k < 6; k++) {
      for (let i = 0; i < a.periodLen; i++) { const d = addDays(start, i); if (!map[d]) map[d] = "predicted"; }
      const nextStart = addDays(start, a.cycleLen);
      const ov = addDays(nextStart, -NORM.luteal);
      for (let i = 0; i <= NORM.fertileBefore; i++) { const d = addDays(ov, -i); if (!map[d]) map[d] = "fertile"; }
      map[ov] = "ovulation";
      start = nextStart;
    }
    return map;
  }

  function recordedPeriodDays() {
    const set = new Set();
    const today = todayIso();
    for (const p of state.periods) {
      const end = p.end || (diff(p.start, today) < 10 ? today : addDays(p.start, (state.settings.defaultPeriod || 5) - 1));
      for (let d = p.start; d <= end; d = addDays(d, 1)) set.add(d);
    }
    return set;
  }

  function phaseOf(a, date) {
    if (!a.last) return "unknown";
    if (recordedPeriodDays().has(date)) return "menstrual";
    if (date < a.last.start) return null; // прошлые циклы — фазу не оцениваем
    if (date === a.ovulation) return "ovulation";
    if (a.fertileStart && date >= a.fertileStart && date <= a.ovulation) return "fertile";
    if (a.fertileStart && date < a.fertileStart) return "follicular";
    return "luteal";
  }

  // ---------- Предупреждения ----------
  function warnings(a) {
    const w = [];
    const recent = a.recent;
    const shortC = recent.filter(c => c.length < NORM.cycleMin);
    const longC = recent.filter(c => c.length > NORM.cycleMax && c.length <= GAP_DAYS);
    const gaps = recent.filter(c => c.length > GAP_DAYS);
    if (gaps.length) w.push(["info", "Возможно, пропущены записи", `Между ${gaps.map(c => human(c.start)).join(", ")} и следующими месячными прошло больше ${GAP_DAYS} дней. Если месячные были, но не записаны, — добавьте их во вкладке «Статистика». В прогнозе этот промежуток не учитывается.`, null]);
    if (shortC.length) w.push(["warn", "Короткие циклы", `${shortC.length} из последних ${recent.length} циклов короче ${NORM.cycleMin} дней (${shortC.map(c => c.length).join(", ")}). По критериям FIGO это за пределами нормы — стоит обсудить с гинекологом.`, "figo-normal"]);
    if (longC.length) w.push(["warn", "Длинные циклы", `${longC.length} из последних ${recent.length} циклов длиннее ${NORM.cycleMax} дней (${longC.map(c => c.length).join(", ")}). По критериям FIGO это за пределами нормы — стоит обсудить с гинекологом.`, "figo-normal"]);
    if (a.lens.length >= 3) {
      const spread = Math.max(...a.lens) - Math.min(...a.lens);
      if (spread >= NORM.variationDoctor) w.push(["alert", "Очень нерегулярный цикл", `Разница между самым коротким и самым длинным циклом — ${days(spread)}. NHS рекомендует при разнице 20 дней и больше показаться врачу.`, "doctor"]);
      else if (spread > NORM.variationMax) w.push(["warn", "Нерегулярный цикл", `Разброс длины циклов — ${days(spread)}. Норма по FIGO — не больше 7–9 дней.`, "figo-normal"]);
    }
    const longP = a.periods.filter(p => p.end && diff(p.start, p.end) + 1 > NORM.periodMax).slice(-HISTORY_FOR_AVG);
    if (longP.length) w.push(["warn", "Долгие месячные", `Месячные длились дольше ${NORM.periodMax} дней (${longP.map(p => human(p.start)).join(", ")}). Это выходит за норму FIGO — стоит показаться врачу.`, "doctor"]);
    if (a.last && !a.last.end && a.cycleDay > NORM.periodMax && a.cycleDay <= 10) w.push(["info", "Месячные всё ещё идут?", `Сегодня ${a.cycleDay}-й день. Если закончились — отметьте дату окончания. Если продолжаются дольше ${NORM.periodMax} дней — стоит показаться врачу.`, "doctor"]);
    if (a.last && !a.last.end && a.cycleDay > 10) w.push(["info", "Не отмечен последний день месячных", `Для записи с ${human(a.last.start)} не указан конец — пока считаем ${days(state.settings.defaultPeriod)}. Уточните во вкладке «Статистика».`, null]);
    if (a.late > 0) {
      if (a.cycleDay > 90) w.push(["alert", "Месячных нет больше 3 месяцев", `С начала последних месячных прошло ${days(a.cycleDay - 1)}. При отрицательном тесте на беременность NHS советует обратиться к врачу.`, "late"]);
      else if (a.late >= 5) w.push(["warn", `Задержка ${days(a.late)}`, "Можно сделать тест на беременность. Частые причины задержки: стресс, изменение веса, нагрузки, контрацепция, СПКЯ.", "late"]);
      else w.push(["info", `Задержка ${days(a.late)} от прогноза`, "Небольшие отклонения от прогноза — это нормально: циклы меняются от месяца к месяцу.", "len-28"]);
    }
    // кровь вне месячных
    const periodSet = recordedPeriodDays();
    const spot = Object.entries(state.logs).filter(([d, l]) => l.flow && !periodSet.has(d)).map(([d]) => d).sort().slice(-5);
    if (spot.length) w.push(["alert", "Кровянистые выделения между месячными", `Отмечено: ${spot.map(human).join(", ")}. Кровотечение между месячными — повод показаться врачу.`, "doctor"]);
    // сильная боль
    const severe = Object.entries(state.logs).filter(([, l]) => l.painScore >= 7).map(([d]) => d);
    const severeCycles = new Set(severe.map(d => { const p = a.periods.filter(p => p.start <= d).pop(); return p ? p.start : d; }));
    if (severeCycles.size >= 2) w.push(["warn", "Повторяющаяся сильная боль", `Боль 7 из 10 и сильнее отмечена в ${severeCycles.size} циклах. Если боль мешает обычной жизни, обсудите с врачом — покажите ему «Дневник боли» из вкладки «Статистика».`, "pain-describe"]);
    const heavy = Object.values(state.logs).filter(l => l.flow === "heavy").length;
    if (heavy >= 4) w.push(["info", "Часто отмечены обильные выделения", "Если обильные месячные мешают жить обычной жизнью, по руководству NICE это повод обратиться к врачу.", "heavy"]);
    return w;
  }

  function renderWarnings(list, el) {
    el.innerHTML = list.map(([type, title, text, tip]) =>
      `<div class="notice ${type}"><b>${esc(title)}</b>${esc(text)}${tip ? ` <a href="#" data-tip="${tip}">Подробнее и источник</a>` : ""}</div>`).join("");
  }

  // ---------- Сегодня ----------
  function renderToday(a) {
    const hero = $("#hero");
    const name = state.settings.name;
    $("#appTitle").textContent = name ? `Cycle · ${name}` : "Cycle";
    if (!a.last) {
      hero.innerHTML = `<div class="hero-info"><span class="phase-pill">Начнём</span>
        <div class="main">Отметьте первый день последних месячных</div>
        <p class="muted small">Чем больше циклов записано, тем точнее прогноз. Можно добавить прошлые месяцы во вкладке «Статистика».</p></div>`;
    } else {
      const phase = phaseOf(a, a.today);
      const pct = Math.min(1, (a.cycleDay) / a.cycleLen);
      const C = 2 * Math.PI * 52;
      let main, sub;
      if (a.inPeriod) { main = `${a.cycleDay}-й день месячных`; sub = `Начались ${human(a.last.start)}`; }
      else if (a.late > 0) { main = `Задержка ${days(a.late)}`; sub = `Ожидались ${human(a.next)}`; }
      else {
        const left = diff(a.today, a.next);
        main = left === 0 ? "Месячные ожидаются сегодня" : `До месячных ~${days(left)}`;
        sub = a.earliest !== a.latest ? `Вероятно ${human(a.earliest)} – ${human(a.latest)}` : `Прогноз: ${human(a.next)}`;
      }
      const conf = { high: "прогноз по " + a.lens.length + " циклам", mid: "мало данных — прогноз примерный", low: "нужен ещё хотя бы 1 цикл для прогноза" }[a.confidence];
      hero.innerHTML = `
        <div class="ring" aria-hidden="true">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="10"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="${a.inPeriod ? "var(--period)" : phase === "fertile" || phase === "ovulation" ? "var(--fertile)" : "var(--accent)"}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C * pct} ${C}"/></svg>
          <div class="center"><div class="big">${a.cycleDay}</div><div class="muted small">день цикла</div></div>
        </div>
        <div class="hero-info">
          <button type="button" class="phase-pill ${phase}" data-info="${phase === "menstrual" ? "period" : phase}">${PHASES[phase]} <b>?</b></button>
          <div class="main">${main}</div>
          <div class="muted small">${sub}</div>
          <div class="muted small">${a.ovulation && a.today <= a.ovulation ? `Овуляция ~${human(a.ovulation)} (оценка)` : ""}</div>
          <div class="muted small">${conf}</div>
        </div>`;
    }
    renderWarnings(warnings(a), $("#warningsToday"));

    const qa = $("#quickActions");
    if (a.last && !a.last.end && a.inPeriod) {
      qa.innerHTML = `<button class="btn accent" id="qaEnd">Месячные закончились сегодня</button><button class="btn" id="qaEndOther">Закончились в другой день</button>`;
      $("#qaEnd").onclick = () => { a.last.end = a.today; updatePeriod(a.last); };
      $("#qaEndOther").onclick = () => openPeriodSheet(a.last);
    } else {
      qa.innerHTML = `<button class="btn primary" id="qaStart">Месячные начались сегодня</button><button class="btn" id="qaStartOther">Начались в другой день</button>`;
      $("#qaStart").onclick = () => startPeriod(a.today);
      $("#qaStartOther").onclick = () => openPeriodSheet(null);
    }

    renderDayLog($("#todayLog"), a.today, true);

    // подсказка дня — меняется по дням, подбирается по фазе
    const phase = a.last ? phaseOf(a, a.today) : "any";
    const key = phase === "ovulation" ? "fertile" : phase;
    const pool = TIPS.filter(t => t.phase === key || t.phase === "any");
    const dayNum = Math.floor(parse(a.today) / 864e5);
    const tip = pool[dayNum % pool.length];
    $("#tipOfDay").innerHTML = `<div class="tip-label">Подсказка дня</div>` + tipHtml(tip);
  }

  // Блок отметок для дня (используется на «Сегодня» и в окне дня)
  function renderDayLog(el, date, compact) {
    const log = state.logs[date] || {};
    const chipGroup = (title, field, opts, multi, cls) => `
      <div class="group"><div class="group-title">${title}</div><div class="chips">
      ${opts.map(([v, l]) => {
        const on = multi ? (log[field] || []).includes(v) : log[field] === v;
        return `<button type="button" class="chip ${cls || ""} ${on ? "on" : ""}" data-field="${field}" data-v="${v}" data-multi="${multi ? 1 : 0}">${l}</button>`;
      }).join("")}</div></div>`;
    el.innerHTML = `
      <h2>${compact ? "Как сегодня?" : "Отметки за " + human(date)}</h2>
      ${chipGroup("Выделения", "flow", FLOW, false, "flow")}
      ${painBlock(log, chipGroup)}
      ${chipGroup("Настроение", "mood", MOOD, false)}
      ${chipGroup("Энергия", "energy", ENERGY, false)}
      ${chipGroup("Симптомы", "symptoms", SYMPTOMS, true)}
      <div class="group"><div class="group-title">Заметка</div>
      <textarea data-text="note" placeholder="Например: плохо спала, много работы">${esc(log.note || "")}</textarea></div>`;
    el.querySelectorAll(".chip").forEach(btn => btn.onclick = () => {
      const l = Object.assign({}, state.logs[date] || {});
      const f = btn.dataset.field, v = btn.dataset.v;
      if (btn.dataset.multi === "1") {
        const arr = new Set(l[f] || []); arr.has(v) ? arr.delete(v) : arr.add(v); l[f] = [...arr];
      } else l[f] = l[f] === v ? undefined : v;
      setLog(date, l);
      renderDayLog(el, date, compact);
    });
    // сила боли 0–10
    el.querySelectorAll("[data-pscore]").forEach(btn => btn.onclick = () => {
      const l = Object.assign({}, state.logs[date] || {});
      const v = +btn.dataset.pscore;
      l.painScore = l.painScore === v ? undefined : v;
      setLog(date, l);
      renderDayLog(el, date, compact);
    });
    // текстовые поля сохраняются по мере ввода, без перерисовки формы
    el.querySelectorAll("[data-text]").forEach(inp => {
      const put = () => {
        const l = Object.assign({}, state.logs[date] || {});
        l[inp.dataset.text] = inp.value.trim() ? inp.value : undefined;
        return l;
      };
      inp.oninput = () => storeLog(date, put());     // сразу в память, без перерисовки
      inp.onchange = () => setLog(date, put());      // при выходе из поля — обновить календарь и статистику
    });
    // подсказки к описанию боли: вставляют начало фразы
    el.querySelectorAll("[data-hint]").forEach(btn => btn.onclick = () => {
      const ta = el.querySelector('[data-text="painNote"]');
      const prefix = ta.value && !ta.value.endsWith("\n") ? "\n" : "";
      ta.value += prefix + btn.dataset.hint;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.dispatchEvent(new Event("input"));
    });
  }

  function painBlock(log, chipGroup) {
    const s = log.painScore;
    const scale = Array.from({ length: 11 }, (_, n) =>
      `<button type="button" class="pscore ${painClass(n)} ${s === n ? "on" : ""}" data-pscore="${n}" aria-label="Боль ${n} из 10">${n}</button>`).join("");
    const details = s > 0 ? `
      <div class="pain-details">
        ${chipGroup("Где болит", "painPlaces", PAIN_PLACES, true)}
        ${chipGroup("Какая боль", "painTypes", PAIN_TYPES, true)}
        <div class="group"><div class="group-title">Лекарство</div>
          <input type="text" data-text="painMed" maxlength="80" placeholder="Например: ибупрофен 400 мг в 10:00" value="${esc(log.painMed || "")}">
        </div>
        ${chipGroup("Помогло?", "painHelp", PAIN_HELP, false)}
        <div class="group"><div class="group-title">Опишите своими словами</div>
          <div class="chips hints">${PAIN_HINTS.map(h => `<button type="button" class="chip hint" data-hint="${esc(h)}">${esc(h.replace(/[:?]\s*$/, ""))}</button>`).join("")}</div>
          <textarea data-text="painNote" rows="4" placeholder="Как ощущается боль, когда началась, что помогает, мешает ли делам…">${esc(log.painNote || "")}</textarea>
        </div>
      </div>` : "";
    return `<div class="group pain"><div class="group-title">Боль <span class="pain-val">${s == null ? "— не отмечено" : `${s}/10 · ${painLevel(s)}`}</span>
      <a href="#" data-tip="pain-describe" class="small">как оценить?</a></div>
      <div class="pscale">${scale}</div>
      <div class="pscale-legend small muted"><span>0 нет</span><span>1–4 слабая</span><span>5–6 умеренная</span><span>7–10 сильная</span></div>
      ${details}</div>`;
  }
  function storeLog(date, l) {
    Object.keys(l).forEach(k => (l[k] === undefined || (Array.isArray(l[k]) && !l[k].length)) && delete l[k]);
    if (Object.keys(l).length) state.logs[date] = l; else delete state.logs[date];
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { storageOk = false; }
  }
  function setLog(date, l) {
    storeLog(date, l);
    renderCalendar(analyze()); // календарь и статистика обновятся, а открытая форма останется
    renderStats(analyze());
  }

  // ---------- Операции с месячными ----------
  function startPeriod(date) {
    const near = state.periods.find(p => Math.abs(diff(p.start, date)) < 10);
    if (near) {
      if (!confirm(`Уже есть месячные с ${human(near.start)}. Перенести начало на ${human(date)}?`)) return;
      near.start = date; if (near.end && near.end < date) near.end = null;
    } else {
      state.periods.forEach(p => { if (!p.end && p.start < date) p.end = addDays(p.start, Math.min(diff(p.start, date) - 1, state.settings.defaultPeriod - 1)); });
      state.periods.push({ id: uid(), start: date, end: null });
    }
    save();
  }
  function updatePeriod(p) {
    if (p.end && p.end < p.start) { alert("Дата окончания раньше даты начала."); return false; }
    const i = state.periods.findIndex(x => x.id === p.id);
    if (i >= 0) state.periods[i] = p; else state.periods.push(p);
    save(); return true;
  }

  // ---------- Календарь ----------
  let calMonth = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12); })();
  function renderCalendar(a) {
    $("#monthTitle").textContent = `${MONTHS_NOM[calMonth.getMonth()]} ${calMonth.getFullYear()}`;
    const proj = projection(a);
    const rec = recordedPeriodDays();
    const first = new Date(calMonth);
    const offset = (first.getDay() + 6) % 7;
    first.setDate(1 - offset);
    const inMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const cells = Math.ceil((offset + inMonth) / 7) * 7;
    let html = "";
    for (let i = 0; i < cells; i++) {
      const d = new Date(first); d.setDate(first.getDate() + i);
      const s = iso(d);
      const cls = ["day"];
      if (d.getMonth() !== calMonth.getMonth()) cls.push("out");
      if (s === a.today) cls.push("today");
      if (rec.has(s)) cls.push("period");
      else if (proj[s] && s >= a.today) cls.push(proj[s]);
      else if (proj[s] && proj[s] !== "predicted") cls.push(proj[s]);
      const has = state.logs[s];
      html += `<button type="button" class="${cls.join(" ")}" data-date="${s}" aria-label="${human(s)}">${d.getDate()}${has ? '<i class="dot"></i>' : ""}</button>`;
    }
    const grid = $("#calGrid");
    grid.innerHTML = html;
    grid.querySelectorAll(".day").forEach(b => b.onclick = () => openDaySheet(b.dataset.date));
  }

  // ---------- Окна ----------
  const sheet = () => $("#sheet");
  function openSheet(html, onReady) {
    $("#sheetBody").innerHTML = html;
    if (!sheet().open) sheet().showModal();
    onReady && onReady();
  }
  function closeSheet() { sheet().close(); render(); }

  function openDaySheet(date) {
    const a = analyze();
    const p = state.periods.find(p => p.start <= date && (p.end ? date <= p.end : diff(p.start, date) < 10));
    const phase = phaseOf(a, date);
    const future = date > a.today;
    openSheet(`
      <div class="row between"><h2>${humanY(date)}</h2><button class="icon-btn" value="close" aria-label="Закрыть">×</button></div>
      <p class="muted small">${phase && phase !== "unknown" ? PHASES[phase] + (date >= a.last.start ? ` · ${diff(a.last.start, date) + 1}-й день цикла` : "") : ""}</p>
      <div class="row wrap gap">
        ${future ? "" : `<button type="button" class="btn primary small" id="dsStart">Начало месячных</button>`}
        ${!future && p && p.start <= date ? `<button type="button" class="btn accent small" id="dsEnd">Последний день месячных</button>` : ""}
        ${p ? `<button type="button" class="btn small" id="dsEdit">Изменить запись (${human(p.start)})</button>` : ""}
      </div>
      ${future ? `<p class="muted small">Будущий день: можно посмотреть прогноз, отметки ставятся по факту.</p>` : `<div id="dsLog"></div>`}
      <div class="sheet-actions"><button class="btn" value="close">Готово</button></div>`,
      () => {
        if (!future) renderDayLog($("#dsLog"), date, false);
        const s = $("#dsStart"); if (s) s.onclick = () => { sheet().close(); startPeriod(date); };
        const e = $("#dsEnd"); if (e) e.onclick = () => { p.end = date; sheet().close(); updatePeriod(p); };
        const ed = $("#dsEdit"); if (ed) ed.onclick = () => openPeriodSheet(p);
      });
  }

  function openPeriodSheet(p) {
    const isNew = !p;
    const cur = p ? Object.assign({}, p) : { id: uid(), start: todayIso(), end: null };
    openSheet(`
      <div class="row between"><h2>${isNew ? "Добавить месячные" : "Изменить запись"}</h2><button class="icon-btn" value="close" aria-label="Закрыть">×</button></div>
      <label class="field">Первый день<input type="date" id="psStart" value="${cur.start}" max="${todayIso()}" required></label>
      <label class="field">Последний день (можно оставить пустым, если ещё идут)<input type="date" id="psEnd" value="${cur.end || ""}" max="${todayIso()}"></label>
      <div class="sheet-actions">
        ${isNew ? "" : `<button type="button" class="btn danger" id="psDel">Удалить</button>`}
        <button type="button" class="btn accent" id="psSave">Сохранить</button>
      </div>`,
      () => {
        $("#psSave").onclick = () => {
          const start = $("#psStart").value, end = $("#psEnd").value || null;
          if (!start) { alert("Укажите первый день."); return; }
          if (start > todayIso()) { alert("Дата начала не может быть в будущем."); return; }
          const clash = state.periods.find(x => x.id !== cur.id && Math.abs(diff(x.start, start)) < 10);
          if (clash) { alert(`Рядом уже есть запись с ${human(clash.start)}. Измените её вместо новой.`); return; }
          cur.start = start; cur.end = end;
          if (end && end < start) { alert("Последний день раньше первого."); return; }
          if (end && diff(start, end) > 20) { alert("Слишком долгий период — проверьте даты."); return; }
          sheet().close(); updatePeriod(cur);
        };
        const del = $("#psDel");
        if (del) del.onclick = () => {
          if (!confirm(`Удалить запись с ${human(cur.start)}?`)) return;
          state.periods = state.periods.filter(x => x.id !== cur.id); sheet().close(); save();
        };
      });
  }

  // ---------- Статистика ----------
  function renderStats(a) {
    const fmt = x => x == null ? "—" : (Math.round(x * 10) / 10).toString().replace(".", ",");
    const spread = a.lens.length >= 2 ? Math.max(...a.lens) - Math.min(...a.lens) : null;
    let bars = "";
    if (a.recent.length) {
      const max = Math.max(45, ...a.lens);
      const base = 14, h = x => Math.max(4, (Math.min(x, max) - base) / (max - base) * 100);
      const band = `<div class="norm-band" style="bottom:${h(NORM.cycleMin)}%;height:${h(NORM.cycleMax) - h(NORM.cycleMin)}%" title="Норма FIGO 24–38 дней"></div>`;
      bars = `<div class="bars" aria-label="Длина последних циклов">${band}${a.recent.map(c => {
        const out = c.length < NORM.cycleMin || c.length > NORM.cycleMax;
        return `<div class="bar ${out ? "out-range" : ""}" style="height:${h(c.length)}%" title="${human(c.start)}: ${c.length}"><span>${c.length}</span></div>`;
      }).join("")}</div><p class="muted small">Длина последних циклов, дни. Зелёная полоса — норма FIGO (24–38 дней).</p>`;
    }
    $("#statsCard").innerHTML = `
      <h2>Статистика</h2>
      <div class="stats-grid">
        <div class="stat"><div class="v">${fmt(a.avgCycle)}</div><div class="l">средний цикл, дней</div></div>
        <div class="stat"><div class="v">${fmt(a.avgPeriod)}</div><div class="l">средняя длительность месячных</div></div>
        <div class="stat"><div class="v">${spread == null ? "—" : spread}</div><div class="l">разброс циклов, дней (норма ≤ 7–9)</div></div>
        <div class="stat"><div class="v">${a.cycles.length}</div><div class="l">записано полных циклов</div></div>
      </div>
      ${bars || `<p class="muted small">Статистика появится, когда будет записано хотя бы два начала месячных.</p>`}`;
    renderWarnings(warnings(a), $("#warningsStats"));

    // Симптомы: как часто встречаются за 7 дней до месячных и в остальные дни
    const starts = a.periods.map(p => p.start);
    const isPre = d => starts.some(s => { const k = diff(d, s); return k >= 1 && k <= 7; });
    const counts = {};
    for (const [d, l] of Object.entries(state.logs)) {
      for (const s of l.symptoms || []) {
        counts[s] = counts[s] || { pre: 0, other: 0 };
        isPre(d) ? counts[s].pre++ : counts[s].other++;
      }
    }
    const rows = Object.entries(counts).sort((x, y) => (y[1].pre + y[1].other) - (x[1].pre + x[1].other));
    const maxN = rows.length ? Math.max(...rows.map(([, c]) => c.pre + c.other)) : 1;
    const pms = rows.filter(([, c]) => c.pre >= 3 && c.pre > c.other);
    $("#symptomStats").innerHTML = `<h2>Симптомы</h2>` + (rows.length ? rows.map(([s, c]) => `
      <div class="sym-row"><span class="name">${LABEL[s] || s}</span>
      <span class="track"><span class="fill" style="width:${(c.pre + c.other) / maxN * 100}%;display:block"></span></span>
      <span class="n">${c.pre + c.other} (${c.pre} до мес.)</span></div>`).join("") +
      (pms.length ? `<div class="notice info"><b>Похоже на предменструальную закономерность</b>${pms.map(([s]) => LABEL[s]).join(", ")} чаще отмечаются за неделю до месячных. <a href="#" data-tip="pms">Что говорит наука о ПМС</a></div>` : "") +
      `<p class="muted small">«до мес.» — сколько раз отмечено в 7 дней перед началом месячных.</p>`
      : `<p class="muted small">Отмечайте симптомы на вкладке «Сегодня» — здесь появится, какие из них повторяются и когда.</p>`);

    renderPainDiary(a);

    $("#periodList").innerHTML = a.periods.length ? [...a.periods].reverse().map((p, i, arr) => {
      const len = p.end ? diff(p.start, p.end) + 1 : null;
      const prev = arr[i + 1];
      const cyc = prev ? diff(prev.start, p.start) : null;
      return `<li><div><div>${humanY(p.start)}${p.end ? " – " + human(p.end) : " (идут/не отмечен конец)"}</div>
        <div class="meta">${len ? "месячные " + days(len) : ""}${cyc ? `${len ? " · " : ""}цикл до этого ${days(cyc)}` : ""}</div></div>
        <button class="btn small" data-edit="${p.id}">Изменить</button></li>`;
    }).join("") : `<li class="muted small">Пока нет записей.</li>`;
    $("#periodList").querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openPeriodSheet(state.periods.find(p => p.id === b.dataset.edit)));

    $("#setName").value = state.settings.name || "";
    $("#setCycle").value = state.settings.defaultCycle;
    $("#setPeriod").value = state.settings.defaultPeriod;
  }

  // ---------- Дневник боли ----------
  let painShowAll = false;
  function painEntries(a) {
    const rec = recordedPeriodDays();
    return Object.entries(state.logs).filter(([, l]) => l.painScore > 0).sort((x, y) => y[0].localeCompare(x[0])).map(([d, l]) => {
      const p = a.periods.filter(p => p.start <= d).pop();
      return { date: d, log: l, cycleDay: p ? diff(p.start, d) + 1 : null, inPeriod: rec.has(d) };
    });
  }
  function painLine(e) {
    const l = e.log, parts = [];
    if (l.painPlaces && l.painPlaces.length) parts.push("где: " + l.painPlaces.map(x => LABEL[x]).join(", ").toLowerCase());
    if (l.painTypes && l.painTypes.length) parts.push("характер: " + l.painTypes.map(x => LABEL[x]).join(", ").toLowerCase());
    if (l.painMed) parts.push("лекарство: " + l.painMed + (l.painHelp ? ` (${LABEL[l.painHelp].toLowerCase()})` : ""));
    else if (l.painHelp) parts.push(LABEL[l.painHelp].toLowerCase());
    return parts;
  }
  function renderPainDiary(a) {
    const list = painEntries(a);
    const el = $("#painDiary");
    if (!list.length) {
      el.innerHTML = `<h2>Дневник боли</h2><p class="muted small">Здесь будут все дни, когда отмечена боль: сила, где болит, какая, что помогло и описание своими словами. Отмечайте боль на вкладке «Сегодня» или в календаре.</p>`;
      return;
    }
    const avg = arr => arr.length ? (arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1).replace(".", ",") : "—";
    const inP = list.filter(e => e.inPeriod).map(e => e.log.painScore), outP = list.filter(e => !e.inPeriod).map(e => e.log.painScore);
    const severe = list.filter(e => e.log.painScore >= 7).length;
    const shown = painShowAll ? list : list.slice(0, 10);
    el.innerHTML = `<div class="row between"><h2>Дневник боли</h2><button type="button" class="btn small" id="painCopy">Для врача</button></div>
      <div class="stats-grid">
        <div class="stat"><div class="v">${list.length}</div><div class="l">дней с болью</div></div>
        <div class="stat"><div class="v">${severe}</div><div class="l">дней с сильной болью (7+)</div></div>
        <div class="stat"><div class="v">${avg(inP)}</div><div class="l">средняя сила во время месячных</div></div>
        <div class="stat"><div class="v">${avg(outP)}</div><div class="l">средняя сила в другие дни</div></div>
      </div>
      <ul class="pain-list">${shown.map(e => `
        <li data-date="${e.date}">
          <span class="pbadge ${painClass(e.log.painScore)}">${e.log.painScore}</span>
          <div><div><b>${humanY(e.date)}</b> <span class="muted small">${e.cycleDay ? `${e.cycleDay}-й день цикла` : ""}${e.inPeriod ? " · месячные" : ""}</span></div>
          ${painLine(e).map(t => `<div class="small">${esc(t)}</div>`).join("")}
          ${e.log.painNote ? `<div class="pnote">${esc(e.log.painNote)}</div>` : ""}</div>
        </li>`).join("")}</ul>
      ${list.length > 10 ? `<button type="button" class="btn small" id="painMore">${painShowAll ? "Свернуть" : `Показать все (${list.length})`}</button>` : ""}
      <p class="muted small">Нажмите на запись, чтобы изменить её. Кнопка «Для врача» копирует дневник текстом — его можно вставить в сообщение или распечатать.</p>`;
    el.querySelectorAll("li[data-date]").forEach(li => li.onclick = () => openDaySheet(li.dataset.date));
    const more = $("#painMore"); if (more) more.onclick = () => { painShowAll = !painShowAll; renderPainDiary(analyze()); };
    $("#painCopy").onclick = () => copyPainReport(a, list);
  }
  function copyPainReport(a, list) {
    const lines = [`Дневник боли${state.settings.name ? " — " + state.settings.name : ""}`, `Сформирован: ${humanY(a.today)}`];
    if (a.avgCycle) lines.push(`Средняя длина цикла: ${Math.round(a.avgCycle)} дн., средняя длительность месячных: ${a.avgPeriod ? Math.round(a.avgPeriod) : "—"} дн.`);
    lines.push("Шкала боли 0–10 (0 — нет, 1–4 слабая, 5–6 умеренная, 7–10 сильная)", "");
    for (const e of [...list].reverse()) {
      lines.push(`${humanY(e.date)}${e.cycleDay ? `, ${e.cycleDay}-й день цикла` : ""}${e.inPeriod ? ", месячные" : ""} — боль ${e.log.painScore}/10`);
      painLine(e).forEach(t => lines.push("  " + t));
      if (e.log.painNote) lines.push("  описание: " + e.log.painNote.replace(/\n+/g, " / "));
    }
    const text = lines.join("\n");
    const fallback = () => openSheet(`<div class="row between"><h2>Дневник для врача</h2><button class="icon-btn" value="close" aria-label="Закрыть">×</button></div>
      <p class="muted small">Выделите текст и скопируйте.</p><textarea rows="14" readonly>${esc(text)}</textarea>
      <div class="sheet-actions"><button class="btn" value="close">Готово</button></div>`);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => alert("Дневник скопирован. Вставьте его в сообщение врачу или в заметки."), fallback);
    else fallback();
  }

  // ---------- Советы ----------
  function tipHtml(t) {
    return `<h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><div class="lvl">Основание: ${esc(t.level)}</div>
      <ul class="src">${t.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul>`;
  }
  let tipFilter = "all";
  function renderTips() {
    const filters = [["all", "Все"], ["menstrual", "Месячные"], ["fertile", "Овуляция"], ["luteal", "Перед месячными"], ["any", "Общее"]];
    $("#tipFilter").innerHTML = filters.map(([k, l]) => `<button class="chip ${tipFilter === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
    $("#tipFilter").querySelectorAll(".chip").forEach(b => b.onclick = () => { tipFilter = b.dataset.f; renderTips(); });
    const list = TIPS.filter(t => tipFilter === "all" || t.phase === tipFilter || (tipFilter === "any" && t.phase === "follicular"));
    $("#tipList").innerHTML = list.map(t => `<div class="card tip" id="tip-${t.id}">${tipHtml(t)}</div>`).join("");
  }
  // Справочник
  function glossaryHtml(g, open) {
    return `<details class="gloss" id="gloss-${g.key}" ${open ? "open" : ""}><summary>${g.swatch ? `<i class="sw ${g.swatch}"></i>` : ""}${esc(g.title)}</summary>
      <p>${esc(g.text)}</p><ul class="src">${g.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul></details>`;
  }
  function renderGlossary() { $("#glossary").innerHTML = GLOSSARY.map(g => glossaryHtml(g, false)).join(""); }
  function showInfo(key) {
    const g = GLOSSARY.find(x => x.key === key);
    if (!g) return;
    openSheet(`<div class="row between"><h2>${g.swatch ? `<i class="sw big ${g.swatch}"></i> ` : ""}${esc(g.title)}</h2><button class="icon-btn" value="close" aria-label="Закрыть">×</button></div>
      <p>${esc(g.text)}</p><div class="lvl muted small">Источники:</div>
      <ul class="src small">${g.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul>
      <div class="sheet-actions"><button class="btn" value="close">Понятно</button></div>`);
  }

  function showTip(id) {
    tipFilter = "all"; switchView("tips"); renderTips();
    const el = document.getElementById("tip-" + id);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.style.outline = "2px solid var(--accent)"; setTimeout(() => (el.style.outline = ""), 1600); }
  }

  // ---------- Общее ----------
  function $(s) { return document.querySelector(s); }
  function switchView(v) {
    document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === "view-" + v));
    document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
    window.scrollTo(0, 0);
  }
  function render() {
    const a = analyze();
    $("#todayLabel").textContent = humanY(a.today);
    renderToday(a); renderCalendar(a); renderStats(a); renderTips();
  }

  document.querySelectorAll(".tabbar button").forEach(b => b.onclick = () => switchView(b.dataset.view));
  $("#prevMonth").onclick = () => { calMonth.setMonth(calMonth.getMonth() - 1); renderCalendar(analyze()); };
  $("#nextMonth").onclick = () => { calMonth.setMonth(calMonth.getMonth() + 1); renderCalendar(analyze()); };
  $("#addPeriodBtn").onclick = () => openPeriodSheet(null);
  $("#sheet").addEventListener("close", () => render());
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-tip]");
    if (t) { e.preventDefault(); if (sheet().open) sheet().close(); showTip(t.dataset.tip); return; }
    const info = e.target.closest("[data-info]");
    if (info) { e.preventDefault(); showInfo(info.dataset.info); }
  });

  $("#setName").onchange = e => { state.settings.name = e.target.value.trim(); save(); };
  $("#setCycle").onchange = e => { const v = +e.target.value; if (v >= 20 && v <= 45) { state.settings.defaultCycle = v; save(); } };
  $("#setPeriod").onchange = e => { const v = +e.target.value; if (v >= 2 && v <= 10) { state.settings.defaultPeriod = v; save(); } };
  $("#exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(Object.assign({ app: "cycle-tracker", version: 1, exported: new Date().toISOString() }, state), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `cycle-backup-${todayIso()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("#importFile").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!Array.isArray(d.periods)) throw new Error();
        if (!confirm(`Заменить текущие данные данными из файла (${d.periods.length} записей месячных)?`)) return;
        state = { periods: d.periods.filter(p => /^\d{4}-\d\d-\d\d$/.test(p.start)).map(p => ({ id: p.id || uid(), start: p.start, end: p.end || null })),
          logs: migrate(d.logs), settings: Object.assign({ name: "", defaultCycle: 28, defaultPeriod: 5 }, d.settings || {}) };
        save(); alert("Данные восстановлены.");
      } catch (err) { alert("Файл не похож на копию данных этого приложения."); }
      e.target.value = "";
    };
    r.readAsText(f);
  };
  $("#clearBtn").onclick = () => {
    if (!confirm("Удалить ВСЕ записи? Это нельзя отменить. Сначала лучше сохранить копию.")) return;
    state = { periods: [], logs: {}, settings: state.settings }; save();
  };

  renderGlossary();
  render();
  // обновить «сегодня», если приложение осталось открытым после полуночи
  let lastDay = todayIso();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && todayIso() !== lastDay) { lastDay = todayIso(); render(); } });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // для тестов
  window.__cycle = { analyze, warnings, NORM };
})();
