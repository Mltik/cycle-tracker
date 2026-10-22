// Подсказки. Каждая опирается на опубликованное исследование или клиническое руководство.
// phase: menstrual | follicular | fertile | luteal | any — когда подсказку показывать как «подсказку дня».
window.TIPS = [
  {
    id: "len-28",
    phase: "any",
    title: "28 дней — не норма, а один из вариантов",
    text: "В анализе 612 613 циклов средняя длина цикла была 29,3 дня, а ровно 28 дней длились только около 13% циклов. У 65% женщин циклы были в пределах 25–30 дней.",
    level: "Большое наблюдательное исследование (данные приложения Natural Cycles)",
    sources: [
      { name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" },
      { name: "Пресс-релиз UCL", url: "https://www.ucl.ac.uk/news/2019/aug/individualised-approach-fertile-windows-could-benefit-many-women" }
    ]
  },
  {
    id: "age",
    phase: "any",
    title: "С возрастом цикл немного укорачивается",
    text: "Между 25 и 45 годами цикл в среднем становится короче примерно на 0,18 дня за каждый год — в основном за счёт первой (фолликулярной) фазы.",
    level: "Большое наблюдательное исследование",
    sources: [{ name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }]
  },
  {
    id: "phases",
    phase: "follicular",
    title: "Овуляция далеко не всегда на 14-й день",
    text: "В среднем фолликулярная фаза (от начала месячных до овуляции) длилась 16,9 дня, а лютеиновая (после овуляции) — 12,4 дня. Обе фазы различаются у разных женщин и от цикла к циклу.",
    level: "Большое наблюдательное исследование",
    sources: [{ name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }]
  },
  {
    id: "fertile-6",
    phase: "fertile",
    title: "Фертильное окно — около 6 дней",
    text: "В исследовании 221 женщины (625 циклов, овуляция определялась по гормонам в моче) зачатие происходило только при близости в течение 6 дней, заканчивающихся днём овуляции. Вероятность росла от ~10% за 5 дней до овуляции до ~33% в день овуляции.",
    level: "Проспективное исследование, NEJM",
    sources: [{ name: "Wilcox, Weinberg, Baird, NEJM, 1995", url: "https://www.nejm.org/doi/full/10.1056/NEJM199512073332301" }]
  },
  {
    id: "fertile-unpredictable",
    phase: "fertile",
    title: "Окно фертильности сложно предсказать по календарю",
    text: "Только у ~30% женщин фертильное окно целиком попадало в дни 10–17 цикла. Каждый день с 6-го по 21-й имел не меньше 10% вероятности быть фертильным — даже при регулярных циклах. Поэтому прогноз в приложении — ориентир, а НЕ метод контрацепции.",
    level: "Проспективное исследование, BMJ",
    sources: [
      { name: "Wilcox, Dunson, Baird, BMJ, 2000", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC27529" },
      { name: "PubMed 11082086", url: "https://pubmed.ncbi.nlm.nih.gov/11082086/" }
    ]
  },
  {
    id: "apps-accuracy",
    phase: "fertile",
    title: "Календарные приложения ошибаются с днём овуляции",
    text: "Прогноз только по длине цикла неточен: в обзоре бесплатных приложений большинство ставили овуляцию на 15-й день, а это верно лишь примерно в 1 из 5 случаев. Точнее — тесты на ЛГ или измерение базальной температуры. (Важно: авторы — сотрудники производителя тестов Clearblue.)",
    level: "Исследование с конфликтом интересов — учитывайте",
    sources: [
      { name: "Johnson, Marriott, Zinaman, Curr Med Res Opin, 2018", url: "https://doi.org/10.1080/03007995.2018.1475348" },
      { name: "Bull et al., 2019 — о пользе физиологических признаков", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }
    ]
  },
  {
    id: "figo-normal",
    phase: "any",
    title: "Что считается нормой цикла",
    text: "Международная федерация гинекологии (FIGO): длина цикла 24–38 дней, кровотечение не дольше 8 дней, разница между самым коротким и самым длинным циклом не больше 7–9 дней. Приложение предупредит, если записи выходят за эти границы.",
    level: "Международная классификация FIGO, 2018",
    sources: [
      { name: "Munro et al., FIGO, Int J Gynaecol Obstet, 2018", url: "https://doi.org/10.1002/ijgo.12666" },
      { name: "Таблица норм — MSD Manual", url: "https://www.msdmanuals.com/professional/multimedia/table/normal-menstrual-parameters" }
    ]
  },
  {
    id: "nsaid",
    phase: "menstrual",
    title: "Боль при месячных: НПВС работают",
    text: "Обзор Cochrane (80 рандомизированных исследований, 5820 женщин): нестероидные противовоспалительные (ибупрофен, напроксен и др.) заметно лучше плацебо. Если плацебо помогает ~18% женщин, то НПВС — 45–53%. Есть риск побочных эффектов — препарат и дозу лучше обсудить с врачом.",
    level: "Систематический обзор Cochrane",
    sources: [{ name: "Marjoribanks et al., Cochrane, 2015", url: "https://www.cochrane.org/CD001751/MENSTR_nonsteroidal-anti-inflammatory-drugs-for-primary-dysmenorrhoea" }]
  },
  {
    id: "heat",
    phase: "menstrual",
    title: "Тепло на низ живота помогает",
    text: "Мета-анализ рандомизированных исследований: грелка/тёплый пластырь уменьшали боль лучше, чем ненагретый плацебо, а в 3 исследованиях были сопоставимы с обезболивающими. Исследований пока немного.",
    level: "Систематический обзор и мета-анализ",
    sources: [
      { name: "Jo & Lee, Scientific Reports, 2018", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6214933/" },
      { name: "Обновлённый обзор, Frontiers in Medicine, 2026", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12876241/" }
    ]
  },
  {
    id: "exercise",
    phase: "menstrual",
    title: "Регулярная активность может снижать боль",
    text: "Обзор Cochrane (12 исследований, 854 женщины): регулярные упражнения могут уменьшать менструальную боль — сами по себе или вместе с НПВС. Неизвестно, сохраняется ли эффект после прекращения занятий.",
    level: "Систематический обзор Cochrane (качество доказательств низкое)",
    sources: [{ name: "Armour et al., Cochrane, 2019", url: "https://www.cochrane.org/CD004142/MENSTR_exercise-dysmenorrhoea" }]
  },
  {
    id: "pms",
    phase: "luteal",
    title: "ПМС: симптомы во второй половине цикла",
    text: "Предменструальные симптомы (раздражительность, тревога, вздутие, болезненность груди) возникают в лютеиновой фазе и проходят с началом месячных. Тяжёлая форма — ПМДР — бывает у 2–5% женщин. Руководство ACOG: эффективны КПТ, комбинированные контрацептивы и СИОЗС (по назначению врача); с более слабыми доказательствами — регулярные упражнения и кальций 1000–1200 мг/сут.",
    level: "Клиническое руководство ACOG № 7, 2023",
    sources: [
      { name: "ACOG Clinical Practice Guideline No. 7 (Obstet Gynecol, 2023)", url: "https://doi.org/10.1097/AOG.0000000000005426" },
      { name: "Обзор рекомендаций — OBG Project", url: "https://www.obgproject.com/2023/12/27/acog-guideline-management-of-premenstrual-syndrome-and-premenstrual-dysphoric-disorder/" }
    ]
  },
  {
    id: "pms-support",
    phase: "luteal",
    title: "Отмечайте настроение — это помогает врачу",
    text: "ПМС и ПМДР диагностируют по повторяемости: симптомы должны появляться перед месячными и проходить после их начала, а другие причины — исключены. Ежедневные отметки симптомов в приложении как раз дают такую картину.",
    level: "Клиническое руководство ACOG № 7, 2023",
    sources: [{ name: "ACOG Clinical Practice Guideline No. 7", url: "https://doi.org/10.1097/AOG.0000000000005426" }]
  },
  {
    id: "heavy",
    phase: "menstrual",
    title: "Обильные месячные — повод к врачу",
    text: "Руководство NICE определяет обильное кровотечение не объёмом, а влиянием: если оно мешает физически, эмоционально или социально жить обычной жизнью — это повод обратиться к врачу.",
    level: "Клиническое руководство NICE NG88",
    sources: [{ name: "NICE NG88: Heavy menstrual bleeding", url: "https://www.nice.org.uk/guidance/ng88" }]
  },
  {
    id: "late",
    phase: "luteal",
    title: "Если месячные задерживаются",
    text: "Частые причины: беременность, стресс, резкое изменение веса, интенсивные тренировки, гормональная контрацепция, СПКЯ. При задержке можно подождать несколько дней и сделать тест на беременность. Если тест отрицательный, а месячных нет больше 3 циклов подряд — к врачу.",
    level: "Материалы государственных служб здравоохранения (Великобритания, Ирландия)",
    sources: [
      { name: "nidirect (NHS Северной Ирландии): Stopped or missed periods", url: "https://www.nidirect.gov.uk/conditions/stopped-or-missed-periods" },
      { name: "HSE (Ирландия): Stopped or missed periods", url: "https://www2.hse.ie/conditions/stopped-or-missed-periods" }
    ]
  },
  {
    id: "doctor",
    phase: "any",
    title: "Когда обязательно к врачу",
    text: "Кровотечение между месячными или после секса; месячные внезапно стали нерегулярными (до 45 лет); цикл короче 21 или длиннее 35 дней; месячные дольше 7 дней; очень обильные или очень болезненные месячные; разница между самым коротким и самым длинным циклом 20 дней и больше.",
    level: "Материалы NHS",
    sources: [
      { name: "nidirect: Irregular periods", url: "https://www.nidirect.gov.uk/conditions/irregular-periods" },
      { name: "nidirect: Bleeding between periods", url: "https://www.nidirect.gov.uk/conditions/bleeding-between-periods" },
      { name: "NHS Wales (Aneurin Bevan): When to seek medical advice", url: "https://abuhb.nhs.wales/hospitals/a-z-of-services/gynaecology/menstrual-health/when-to-seek-medical-advice/" }
    ]
  },
  {
    id: "vital",
    phase: "any",
    title: "Цикл — один из показателей здоровья",
    text: "Американские колледжи акушеров-гинекологов и педиатров называют менструальный цикл «жизненным показателем»: изменения в нём могут быть ранним признаком других проблем со здоровьем. Регулярные записи помогают их заметить.",
    level: "Заключение комитета ACOG № 651",
    sources: [{ name: "ACOG Committee Opinion No. 651", url: "https://pubmed.ncbi.nlm.nih.gov/26595586/" }]
  },
  {
    id: "bmi",
    phase: "any",
    title: "Вес влияет на регулярность",
    text: "При ИМТ выше 35 разброс длины цикла у одной и той же женщины был на ~14% больше, чем при ИМТ 18,5–25.",
    level: "Большое наблюдательное исследование",
    sources: [{ name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }]
  }
];

// Справочник: что означают фазы и отметки в календаре.
// key совпадает с классами календаря (period, predicted, fertile, ovulation) и фазами (menstrual, follicular, luteal).
window.GLOSSARY = [
  {
    key: "cycle",
    title: "Что такое менструальный цикл",
    text: "Цикл считается от первого дня месячных до дня перед следующими месячными. Он состоит из двух больших частей: до овуляции (фолликулярная фаза) и после неё (лютеиновая фаза). Месячные — начало фолликулярной фазы. В среднем цикл длится около 29 дней, но нормой считается 24–38 дней.",
    sources: [
      { name: "Cleveland Clinic: Follicular phase", url: "https://my.clevelandclinic.org/health/articles/23953-follicular-phase" },
      { name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" },
      { name: "FIGO, Munro et al., 2018", url: "https://doi.org/10.1002/ijgo.12666" }
    ]
  },
  {
    key: "period",
    swatch: "period",
    title: "Месячные (менструация)",
    text: "Если в прошлом цикле беременность не наступила, уровни эстрогена и прогестерона падают, и слизистая матки отторгается — это и есть кровотечение. Обычно длится 3–7 дней, нормой считается до 8 дней. В календаре — дни, которые вы отметили сами.",
    sources: [
      { name: "FIGO, Munro et al., 2018", url: "https://doi.org/10.1002/ijgo.12666" },
      { name: "Cleveland Clinic: Follicular phase", url: "https://my.clevelandclinic.org/health/articles/23953-follicular-phase" }
    ]
  },
  {
    key: "predicted",
    swatch: "predicted",
    title: "Прогноз месячных",
    text: "Пунктирные дни — когда месячные вероятно начнутся. Приложение берёт среднюю длину последних 6 циклов и прибавляет её к дате последних месячных. Чем больше записано циклов, тем точнее прогноз, но отклонение на несколько дней — нормально.",
    sources: [{ name: "Bull et al., npj Digital Medicine, 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }]
  },
  {
    key: "follicular",
    title: "Фолликулярная фаза",
    text: "Начинается с первого дня месячных и длится до овуляции. Гипофиз выделяет гормон ФСГ, в яичнике растут фолликулы (пузырьки с яйцеклетками), один из них становится главным. Растёт эстроген, слизистая матки утолщается. Именно эта фаза сильнее всего различается по длине — поэтому циклы бывают разными.",
    sources: [
      { name: "Cleveland Clinic: Follicular phase", url: "https://my.clevelandclinic.org/health/articles/23953-follicular-phase" },
      { name: "Bull et al., 2019 — в среднем 16,9 дня", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }
    ]
  },
  {
    key: "fertile",
    swatch: "fertile",
    title: "Фертильное окно",
    text: "Дни, когда близость может привести к беременности: примерно 5 дней до овуляции и день овуляции — всего около 6 дней. Почему так: сперматозоиды могут жить в организме женщины несколько дней, а яйцеклетка после выхода живёт лишь 12–24 часа. Шанс зачатия растёт к овуляции: около 10% за 5 дней до неё и около 33% в день овуляции. В календаре окно — оценка по средней длине цикла, а не точное знание. Это НЕ метод контрацепции.",
    sources: [
      { name: "Wilcox, Weinberg, Baird, NEJM, 1995", url: "https://www.nejm.org/doi/full/10.1056/NEJM199512073332301" },
      { name: "Cleveland Clinic: Ovulation", url: "https://my.clevelandclinic.org/health/articles/23439-ovulation" },
      { name: "Wilcox et al., BMJ, 2000 — окно трудно предсказать", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC27529" }
    ]
  },
  {
    key: "ovulation",
    swatch: "ovulation",
    title: "Овуляция",
    text: "Выход зрелой яйцеклетки из фолликула. Её запускает резкий подъём лютеинизирующего гормона (ЛГ). Приложение оценивает день овуляции как «14 дней до следующих месячных»: месячные обычно приходят через 14–16 дней после овуляции. Точнее определить её можно тестами на ЛГ (продаются в аптеке) или измерением базальной температуры.",
    sources: [
      { name: "Cleveland Clinic: Ovulation", url: "https://my.clevelandclinic.org/health/articles/23439-ovulation" },
      { name: "Bull et al., 2019 — значение тестов ЛГ и температуры", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" }
    ]
  },
  {
    key: "luteal",
    title: "Лютеиновая фаза",
    text: "От овуляции до следующих месячных. Опустевший фолликул превращается в «жёлтое тело», которое вырабатывает прогестерон — он готовит матку к возможной беременности. Если беременность не наступила, жёлтое тело распадается, гормоны падают — и начинаются месячные. В этой фазе могут появляться симптомы ПМС. Длится в среднем 12–14 дней.",
    sources: [
      { name: "Bull et al., 2019 — в среднем 12,4 дня", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6710244/" },
      { name: "Cleveland Clinic: Ovulation", url: "https://my.clevelandclinic.org/health/articles/23439-ovulation" },
      { name: "ACOG Clinical Practice Guideline No. 7 (ПМС)", url: "https://doi.org/10.1097/AOG.0000000000005426" }
    ]
  }
];
