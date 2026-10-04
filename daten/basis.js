/* Sachkunde 34a Lerntrainer – Datenbasis
   Zentrale Konfiguration, Themenbereiche, Glossar und Quellen.
   Alle Lerninhalte sind eigene Texte; keine Original-IHK-Inhalte. */
(function () {
  "use strict";

  var SK = (window.SK = {
    RESEARCH_DATE: "04.10.2026",
    LABEL: "Eigene prüfungsnahe Übungsfrage – keine Original-IHK-Frage",
    areas: {},
    areaOrder: [],
    questions: [],
    cases: [],
    glossary: [],
    sources: []
  });

  /* ---------- Prüfungskonfiguration (zentral) ----------
     questionCount / maxPoints / durationMinutes / passPoints:
       offiziell bestätigt (IHK-Informationsblätter „Weiterentwicklung Bewertungsschema“,
       gültig seit 01.07.2025; mehrere IHK-Seiten, abgerufen 04.10.2026).
     distribution: private Anbieterangabe – von keiner IHK-Quelle bestätigt.
     Bewertungslogik der Simulation (vereinfachte Lernsimulation):
       - Aufgabe mit 1 richtigen Antwort: 1 Kreuz möglich, 1 Punkt.
       - Aufgabe mit 2 richtigen Antworten: max. 2 Kreuze, je richtigem Kreuz 1 Punkt.
       - Falsche Kreuze: kein Abzug, kein Punkt.
     Dass 82 Aufgaben 120 Punkte ergeben, führt rechnerisch zu 44 Ein-Punkt- und
     38 Zwei-Punkt-Aufgaben – das ist eine Ableitung, keine offizielle Angabe. */
  SK.examConfig = {
    questionCount: 82,
    maxPoints: 120,
    durationMinutes: 120,
    passPoints: 60,
    pointsPerCorrectAnswer: 1,
    wrongAnswerPenalty: 0,
    sourceStatus: "offiziell bestätigt (Fragenanzahl, Punkte, Dauer, Bestehensgrenze) – Stand 04.10.2026",
    distributionStatus: "private Anbieterangabe – öffentlich nicht durch IHK-Quelle bestätigt",
    distribution: {
      oso: { q: 7, pts: 11 },
      gew: { q: 5, pts: 8 },
      ds: { q: 5, pts: 8 },
      bgb: { q: 13, pts: 21 },
      str: { q: 13, pts: 21 },
      waf: { q: 5, pts: 8 },
      uvv: { q: 8, pts: 13 },
      umm: { q: 19, pts: 19 },
      tec: { q: 7, pts: 11 }
    },
    shortExam: { factor: 0.25, durationMinutes: 30 }
  };

  /* ---------- Wiederholungsplan (zentral) ---------- */
  SK.srsConfig = {
    intervalsDays: [1, 3, 7, 14, 30], // Abstand nach 1., 2., 3. ... richtiger Antwort in Folge
    wrongDelayDays: 0,                // falsch: noch am selben Tag wieder fällig
    unsureDelayDays: 1,               // unsicher: am nächsten Tag
    safeLevel: 3,                     // ab dieser Stufe gilt eine Frage als „sicher“
    problemWrongCount: 2              // ab so vielen Fehlern „Problemfrage“
  };

  SK.defaultGoals = { neu: 20, wdh: 20, muendlich: 2, fehler: 10 };

  SK.errorCauses = [
    "Begriff verwechselt",
    "Gesetzesvoraussetzung übersehen",
    "private Rechte und Polizeirechte verwechselt",
    "Frage zu schnell gelesen",
    "mehrere richtige Antworten übersehen",
    "Fallbeispiel falsch eingeschätzt",
    "geraten",
    "sonstiger Fehler"
  ];

  SK.oralChecklist = [
    "Situation richtig erkannt",
    "eigene Sicherheit berücksichtigt",
    "deeskalierend kommuniziert",
    "private Rechte und Polizeibefugnisse unterschieden",
    "Verhältnismäßigkeit berücksichtigt",
    "Unterstützung angefordert",
    "Polizei oder Rettungsdienst bei Bedarf verständigt",
    "Dokumentation erwähnt"
  ];

  SK.oralSchema = [
    "Situation einschätzen",
    "eigene Sicherheit beachten",
    "ruhig und deeskalierend kommunizieren",
    "Hausrecht oder andere private Rechte prüfen",
    "keine unzulässigen hoheitlichen Maßnahmen ergreifen",
    "Unterstützung anfordern",
    "Polizei oder Rettungsdienst verständigen, wenn erforderlich",
    "Vorgang dokumentieren"
  ];

  /* ---------- Registrierung ---------- */
  var STATUS = {
    g: "Fundstelle am amtlichen Wortlaut gegengelesen (" + SK.RESEARCH_DATE + ")",
    l: "Landesrecht Nordrhein-Westfalen am amtlichen Wortlaut gegengelesen (" + SK.RESEARCH_DATE + "); Begriffsdefinitionen stammen aus Rechtsprechung und Lehre",
    b: "Rechtsgrundlage benannt – Auslegung, nicht ausdrücklich im Gesetz geregelt",
    e: "prüfungsnahe Empfehlung (Fachmodell/Lernhinweis, keine Rechtsnorm)"
  };
  var DIFF = { 1: "leicht", 2: "mittel", 3: "schwer" };
  var TYPES = { sc: "single-choice", mc: "multiple-choice", tf: "richtig-falsch", zu: "zuordnung", fa: "freie-antwort" };

  SK.area = function (def) {
    SK.areas[def.id] = def;
    SK.areaOrder.push(def.id);
  };

  // Kompaktformat -> vollständiges Frageobjekt. Konvention: die ersten n Optionen sind richtig;
  // die Anzeige mischt die Reihenfolge. IDs entstehen aus der Position – neue Fragen nur anhängen.
  SK.fragen = function (areaId, list) {
    var a = SK.areas[areaId];
    var base = SK.questions.filter(function (q) { return q.area === areaId; }).length;
    list.forEach(function (c, i) {
      var sub = a.subs[c.u] || ["Allgemein", a.title, a.law[0], "b"];
      var t = c.t || "sc";
      var n = t === "mc" ? (c.n || 2) : 1;
      var q = {
        id: areaId + "-" + String(base + i + 1).padStart(3, "0"),
        area: areaId,
        topic: a.title,
        subKey: c.u,
        subtopic: sub[0],
        type: TYPES[t],
        t: t,
        isCase: !!c.f,
        question: c.q,
        explanation: c.e || "",
        difficulty: DIFF[c.d || 2],
        learningGoal: sub[1],
        legalReference: c.r || sub[2],
        sourceTitle: a.source.title,
        sourceInstitution: a.source.institution,
        sourceUrl: a.source.url,
        sourceDate: SK.RESEARCH_DATE,
        verifiedStatus: STATUS[sub[3] || "b"],
        label: SK.LABEL
      };
      if (t === "sc" || t === "mc") {
        q.options = c.o.map(function (o) { return typeof o === "string" ? o : o[0]; });
        q.correctAnswers = [];
        for (var k = 0; k < n; k++) q.correctAnswers.push(k);
        q.wrongAnswerExplanations = c.o.map(function (o, k) {
          var why = typeof o === "string" ? "" : (o[1] || "");
          return k < n ? (why || "Diese Antwort trifft zu.") : (why || "Trifft nicht zu.");
        });
      } else if (t === "tf") {
        q.options = ["Richtig", "Falsch"];
        q.correctAnswers = [c.a ? 0 : 1];
        q.wrongAnswerExplanations = [
          c.a ? "Die Aussage trifft zu." : "Die Aussage trifft nicht zu.",
          c.a ? "Die Aussage trifft zu – „Falsch“ ist daher nicht richtig." : "Die Aussage ist tatsächlich falsch."
        ];
      } else if (t === "zu") {
        q.pairs = c.p;
      } else if (t === "fa") {
        q.modelAnswer = c.m;
        q.keyPoints = c.c || [];
      }
      SK.questions.push(q);
    });
  };

  SK.faelle = function (list) {
    list.forEach(function (c, i) {
      c.id = "fall-" + String(SK.cases.length + 1).padStart(2, "0");
      c.label = "Eigenes mündliches Fallbeispiel – keine Original-IHK-Aufgabe";
      SK.cases.push(c);
    });
  };

  var GII = "https://www.gesetze-im-internet.de/";

  /* ---------- Themenbereiche ----------
     subs: Schlüssel -> [Unterthema, Lernziel, Rechtsgrundlage, Status g|b|e] */
  SK.area({
    id: "oso", group: 1, part: "1a", short: "Öffentliche Sicherheit",
    title: "Recht der öffentlichen Sicherheit und Ordnung",
    oral: true,
    source: { title: "Grundgesetz; § 34a GewO; DIHK-Rahmenplan Sachkundeprüfung (Stand September 2019)", institution: "Bundesministerium der Justiz / DIHK", url: GII + "gg/" },
    intro: "Dieses Sachgebiet klärt, wer in Deutschland Zwang ausüben darf – und warum private Sicherheitskräfte das grundsätzlich nicht dürfen. Es ist laut § 11 BewachV ein Schwerpunkt der mündlichen Prüfung.",
    summary: [
      "Das Gewaltmonopol liegt beim Staat. Polizei und Ordnungsbehörden handeln hoheitlich auf gesetzlicher Grundlage.",
      "Private Sicherheitskräfte haben keine hoheitlichen Befugnisse. Sie handeln mit Jedermannsrechten und mit Rechten, die ihnen der Auftraggeber überträgt (z. B. Hausrecht).",
      "§ 34a Abs. 5 GewO nennt die zulässigen Rechte und verlangt, den Grundsatz der Erforderlichkeit zu beachten.",
      "Öffentliches Recht regelt das Verhältnis Staat – Bürger (Über-/Unterordnung), Privatrecht das Verhältnis der Bürger untereinander (Gleichordnung).",
      "Grundrechte binden unmittelbar den Staat. Sie wirken über die Gesetze aber auch in das Verhältnis zwischen Privaten hinein.",
      "Polizei- und Ordnungsrecht ist Landesrecht; Straf- und Zivilrecht sind Bundesrecht. Diese App legt für das Landesrecht Nordrhein-Westfalen zugrunde: Polizeigesetz (PolG NRW) und Ordnungsbehördengesetz (OBG)."
    ],
    terms: [
      ["Gewaltmonopol", "Nur der Staat darf zur Durchsetzung des Rechts körperlichen Zwang anwenden. Ausnahmen sind eng begrenzte Notrechte für jedermann."],
      ["Hoheitliches Handeln", "Handeln des Staates in Über-/Unterordnung gegenüber dem Bürger, z. B. Platzverweis, Identitätsfeststellung, Durchsuchung."],
      ["Jedermannsrechte", "Rechte, die jeder Person zustehen: Notwehr/Nothilfe, Notstand, Selbsthilfe, vorläufige Festnahme nach § 127 Abs. 1 StPO."],
      ["Öffentliche Sicherheit", "Unverletzlichkeit der Rechtsordnung, der Rechte und Rechtsgüter des Einzelnen sowie der Einrichtungen und Veranstaltungen des Staates. Definition aus Rechtsprechung und Lehre; im PolG NRW nicht gesetzlich definiert."],
      ["Öffentliche Ordnung", "Ungeschriebene Regeln, deren Beachtung nach herrschender Anschauung für ein geordnetes Zusammenleben unerlässlich ist."],
      ["Legalitätsprinzip", "Pflicht von Staatsanwaltschaft und Polizei, bei Verdacht einer Straftat zu ermitteln (§§ 152, 163 StPO)."],
      ["Platzverweisung", "Polizeiliche Anordnung, einen Ort vorübergehend zu verlassen oder nicht zu betreten (§ 34 PolG NRW). Kein Recht privater Sicherheitskräfte."],
      ["Opportunitätsprinzip", "Entscheidung nach pflichtgemäßem Ermessen, ob eingeschritten wird – gilt bei Gefahrenabwehr und Ordnungswidrigkeiten."],
      ["Föderalismus", "Aufteilung der staatlichen Aufgaben zwischen Bund und Ländern."]
    ],
    law: ["Art. 1, 2, 3, 5, 10, 12, 13, 14, 19, 20, 104 GG", "§ 34a Abs. 5 GewO", "§§ 1, 2, 3, 8, 12, 34, 39, 43 PolG NRW", "§§ 1, 14, 15, 16 OBG NRW", "§§ 152, 163, 163b StPO"],
    mistakes: [
      "Annahme, Dienstkleidung oder Auftrag verleihe polizeiliche Befugnisse.",
      "Verwechslung von Platzverweis (Polizei) und Hausverbot (Hausrechtsinhaber).",
      "Annahme, Sicherheitskräfte dürften Ausweise verlangen oder Personen durchsuchen wie die Polizei.",
      "Verwechslung von Legalitäts- und Opportunitätsprinzip."
    ],
    subs: {
      gg: ["Grundrechte", "Inhalt und Bedeutung der prüfungsrelevanten Grundrechte kennen", "Art. 1–19, 104 GG", "g"],
      staat: ["Staatsaufbau und Rechtssystem", "Föderalismus, Gewaltenteilung und die Zweiteilung des Rechts überblicken", "Art. 20 GG", "g"],
      monopol: ["Gewaltmonopol und Abgrenzung zur Polizei", "Aufgaben und Befugnisse privater Sicherheitsdienste von denen der Polizei abgrenzen", "§ 34a Abs. 5 GewO; §§ 1, 12, 34, 39, 43 PolG NRW", "g"],
      jedermann: ["Jedermannsrechte im Überblick", "Die Rechte kennen, auf die sich Wachpersonen stützen dürfen", "§ 34a Abs. 5 GewO", "g"],
      soo: ["Öffentliche Sicherheit und Ordnung", "Die Begriffe öffentliche Sicherheit, öffentliche Ordnung und Gefahr einordnen", "§§ 1, 2, 8 PolG NRW; §§ 1, 14, 15 OBG NRW", "l"],
      hausrecht: ["Hausrecht in der Praxis", "Hausrecht als übertragenes privates Recht anwenden und begrenzen", "§§ 858 ff., 903, 1004 BGB; § 123 StGB", "g"],
      koop: ["Zusammenarbeit mit Behörden", "Zusammenarbeit mit Polizei, Ordnungsbehörden und Rettungsdienst richtig gestalten", "§ 34a Abs. 5 GewO; §§ 152, 163 StPO", "l"]
    }
  });

  SK.area({
    id: "gew", group: 1, part: "1b", short: "Gewerberecht",
    title: "Gewerberecht",
    oral: true,
    source: { title: "§ 34a Gewerbeordnung; Bewachungsverordnung (BewachV)", institution: "Bundesministerium der Justiz – gesetze-im-internet.de", url: GII + "gewo/__34a.html" },
    intro: "Das Gewerberecht regelt, wer ein Bewachungsgewerbe betreiben und wer als Wachperson arbeiten darf. Kern sind § 34a GewO und die Bewachungsverordnung.",
    summary: [
      "Wer gewerbsmäßig Leben oder Eigentum fremder Personen bewachen will, braucht eine Erlaubnis (§ 34a Abs. 1 GewO).",
      "Die Erlaubnis wird versagt bei fehlender Zuverlässigkeit, ungeordneten Vermögensverhältnissen, fehlender Sachkundeprüfung oder fehlendem Haftpflichtnachweis.",
      "Wachpersonen müssen zuverlässig sein und mindestens die Unterrichtung (40 Unterrichtsstunden) nachweisen.",
      "Die Sachkundeprüfung ist Pflicht für: Kontrollgänge im öffentlichen Verkehrsraum bzw. in Hausrechtsbereichen mit tatsächlich öffentlichem Verkehr, Schutz vor Ladendieben, Einlassbereich gastgewerblicher Diskotheken sowie leitende Funktionen in Flüchtlingsunterkünften und bei zugangsgeschützten Großveranstaltungen.",
      "Die BewachV regelt u. a. Haftpflichtversicherung, Dienstanweisung, Ausweis, Kennzeichnung, Dienstkleidung, Waffen und Buchführung.",
      "Die Sachkundeprüfung besteht aus einem schriftlichen und einem mündlichen Teil und wird von der IHK abgenommen."
    ],
    terms: [
      ["Gewerbe", "Erlaubte, selbstständige, auf Dauer angelegte und auf Gewinn gerichtete Tätigkeit (ohne Urproduktion und freie Berufe)."],
      ["Erlaubnispflicht", "Das Bewachungsgewerbe darf erst nach behördlicher Erlaubnis begonnen werden – die bloße Gewerbeanzeige genügt nicht."],
      ["Zuverlässigkeit", "Gewähr, das Gewerbe bzw. die Tätigkeit künftig ordnungsgemäß auszuüben. Wird von der Behörde geprüft."],
      ["Unterrichtung", "40 Unterrichtsstunden bei der IHK ohne Prüfung; Mindestqualifikation für einfache Bewachungstätigkeiten."],
      ["Sachkundeprüfung", "Schriftliche und mündliche Prüfung vor der IHK; Voraussetzung für Gewerbetreibende und bestimmte Tätigkeiten."],
      ["Bewacherregister", "Bundesweites elektronisches Register für Gewerbetreibende und Wachpersonen (§ 11b GewO)."],
      ["Dienstanweisung", "Schriftliche Regelung des Wachdienstes, die der Gewerbetreibende den Wachpersonen aushändigen muss (§ 17 BewachV)."]
    ],
    law: ["§§ 1, 11b, 14, 29, 34a, 144 GewO", "BewachV (insbesondere §§ 4–11, 14, 16–21)", "§§ 2, 4, 23 GeschGehG"],
    mistakes: [
      "Unterrichtung und Sachkundeprüfung werden gleichgesetzt.",
      "Annahme, der Dienstausweis sei ein amtlicher Ausweis.",
      "Übersehen, dass die Verschwiegenheit auch nach dem Ausscheiden gilt.",
      "Übersehen, dass jeder Waffengebrauch unverzüglich anzuzeigen ist."
    ],
    subs: {
      erlaubnis: ["Erlaubnis nach § 34a GewO", "Voraussetzungen und Versagungsgründe der Bewachungserlaubnis kennen", "§ 34a Abs. 1 GewO", "g"],
      taetig: ["Sachkundepflichtige Tätigkeiten", "Tätigkeiten mit Sachkundepflicht von solchen mit Unterrichtung unterscheiden", "§ 34a Abs. 1a GewO", "g"],
      gewo: ["Allgemeines Gewerberecht", "Gewerbebegriff, Gewerbefreiheit, Anzeige und behördliche Befugnisse kennen", "§§ 1, 14, 29, 144 GewO", "g"],
      pruef: ["Unterrichtung und Sachkundeprüfung", "Ablauf und rechtliche Einordnung von Unterrichtung und Sachkundeprüfung kennen", "§§ 4–11 BewachV", "g"],
      haft: ["Haftpflichtversicherung", "Anforderungen an die Haftpflichtversicherung des Bewachungsunternehmens kennen", "§§ 14, 15 BewachV", "g"],
      dienst: ["Dienstanweisung und Verschwiegenheit", "Pflichten aus Dienstanweisung und Verschwiegenheit kennen und einhalten", "§ 17 BewachV; GeschGehG", "g"],
      ausweis: ["Ausweis, Kennzeichnung, Dienstkleidung", "Ausweis-, Kennzeichnungs- und Bekleidungsvorschriften anwenden", "§§ 18, 19 BewachV", "g"],
      waffenbv: ["Waffen nach der BewachV", "Pflichten beim Umgang mit Waffen im Wachdienst nach der BewachV kennen", "§§ 17, 20 BewachV", "g"],
      buch: ["Beschäftigte, Meldung, Buchführung", "Melde-, Buchführungs- und Aufbewahrungspflichten kennen", "§§ 16, 21 BewachV; § 11b GewO", "g"]
    }
  });

  SK.area({
    id: "ds", group: 2, part: "2", short: "Datenschutz",
    title: "Datenschutzrecht",
    source: { title: "Datenschutz-Grundverordnung (DS-GVO); Bundesdatenschutzgesetz (BDSG)", institution: "Europäische Union / Bundesministerium der Justiz", url: GII + "bdsg_2018/" },
    intro: "Sicherheitskräfte sehen, hören und notieren viel über andere Menschen. Das Datenschutzrecht legt fest, wann personenbezogene Daten verarbeitet werden dürfen und welche Rechte Betroffene haben.",
    summary: [
      "Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.",
      "Jede Verarbeitung braucht eine Rechtsgrundlage (Art. 6 DS-GVO), z. B. Einwilligung, Vertrag, rechtliche Pflicht oder berechtigtes Interesse.",
      "Grundsätze (Art. 5 DS-GVO): Rechtmäßigkeit, Transparenz, Zweckbindung, Datenminimierung, Richtigkeit, Speicherbegrenzung, Integrität und Vertraulichkeit, Rechenschaftspflicht.",
      "Besondere Kategorien (Art. 9 DS-GVO) wie Gesundheit, Religion oder ethnische Herkunft sind besonders geschützt.",
      "Betroffene haben u. a. Rechte auf Information, Auskunft, Berichtigung, Löschung und Widerspruch.",
      "Videoüberwachung öffentlich zugänglicher Räume muss erkennbar gemacht werden; Aufnahmen sind zu löschen, sobald sie nicht mehr erforderlich sind."
    ],
    terms: [
      ["Personenbezogene Daten", "Informationen über eine identifizierte oder identifizierbare natürliche Person, z. B. Name, Kennzeichen, Videobild."],
      ["Verarbeitung", "Jeder Umgang mit Daten: erheben, speichern, verwenden, übermitteln, löschen."],
      ["Verantwortlicher", "Stelle, die über Zwecke und Mittel der Verarbeitung entscheidet."],
      ["Auftragsverarbeiter", "Stelle, die Daten im Auftrag und nach Weisung des Verantwortlichen verarbeitet (Art. 28 DS-GVO)."],
      ["Zweckbindung", "Daten dürfen nur für festgelegte, eindeutige und legitime Zwecke verarbeitet werden."],
      ["Datenminimierung", "Nur so viele Daten wie für den Zweck nötig."],
      ["TOM", "Technische und organisatorische Maßnahmen zum Schutz der Daten (Art. 32 DS-GVO)."]
    ],
    law: ["Art. 4–7, 9, 12–22, 28, 32–35, 82, 83 DS-GVO", "§§ 4, 26, 38, 42, 43 BDSG", "§§ 201, 201a, 202, 202a StGB", "Art. 8 EU-Grundrechtecharta"],
    mistakes: [
      "Annahme, Daten seien nur bei elektronischer Speicherung geschützt.",
      "§ 43 BDSG ist keine allgemeine Bußgeldvorschrift für Datenschutzverstöße – er betrifft Auskünfte bei Verbraucherkrediten. Geldbußen für Datenschutzverstöße regelt Art. 83 DS-GVO.",
      "Weitergabe von Wachbuch- oder Videodaten an Unbefugte „aus Gefälligkeit“.",
      "Übersehen der Hinweispflicht bei Videoüberwachung.",
      "Rechtslage zu § 4 BDSG: Für private Betreiber stützt die Rechtsprechung die Videoüberwachung vorrangig auf Art. 6 Abs. 1 Buchst. f DS-GVO. Der Rahmenplan nennt § 4 BDSG – beides kennen."
    ],
    subs: {
      begriff: ["Grundbegriffe", "Zentrale Begriffe des Datenschutzrechts sicher verwenden", "Art. 4 DS-GVO", "g"],
      grundsatz: ["Grundsätze und Rechtmäßigkeit", "Grundsätze der Verarbeitung und Rechtsgrundlagen anwenden", "Art. 5, 6, 7, 9 DS-GVO", "g"],
      rechte: ["Rechte der Betroffenen", "Betroffenenrechte kennen und im Dienst richtig darauf reagieren", "Art. 12–22 DS-GVO", "g"],
      video: ["Videoüberwachung", "Zulässigkeit und Pflichten bei Videoüberwachung einordnen", "§ 4 BDSG; Art. 6 Abs. 1 Buchst. f DS-GVO", "g"],
      tom: ["Datensicherheit und Organisation", "Technische und organisatorische Schutzmaßnahmen und Meldepflichten kennen", "Art. 28, 32–35, 37 DS-GVO; § 38 BDSG", "g"],
      sanktion: ["Haftung, Sanktionen, Strafvorschriften", "Folgen von Datenschutzverstößen benennen", "Art. 82, 83 DS-GVO; § 42 BDSG; §§ 201–202a StGB", "g"],
      praxis: ["Datenschutz im Wachdienst", "Datenschutz bei Wachbuch, Besucherverwaltung und Auskünften praktisch umsetzen", "Art. 5, 6 DS-GVO; § 17 BewachV", "g"]
    }
  });

  SK.area({
    id: "bgb", group: 3, part: "3", short: "BGB",
    title: "Bürgerliches Gesetzbuch",
    source: { title: "Bürgerliches Gesetzbuch (BGB)", institution: "Bundesministerium der Justiz – gesetze-im-internet.de", url: GII + "bgb/" },
    intro: "Aus dem BGB stammen die wichtigsten Rechte für den Wachdienst: Besitz und Eigentum, Hausrecht, Selbsthilfe sowie die zivilrechtlichen Notrechte – und die Haftung für Schäden.",
    summary: [
      "Eigentum ist die rechtliche Herrschaft über eine Sache (§ 903), Besitz die tatsächliche Sachherrschaft (§ 854).",
      "Die Wachperson ist regelmäßig Besitzdiener (§ 855) und darf die Besitzschutzrechte des Besitzers ausüben (§ 860).",
      "Verbotene Eigenmacht (§ 858) ist die widerrechtliche Entziehung oder Störung des Besitzes ohne Willen des Besitzers. Dagegen darf sich der Besitzer mit Gewalt wehren (§ 859).",
      "Notwehr (§ 227), Verteidigungsnotstand (§ 228) und Angriffsnotstand (§ 904) schließen die Widerrechtlichkeit aus.",
      "Selbsthilfe (§ 229) setzt voraus, dass obrigkeitliche Hilfe nicht rechtzeitig zu erlangen ist und ohne sofortiges Eingreifen der Anspruch vereitelt oder wesentlich erschwert würde.",
      "Wer vorsätzlich oder fahrlässig fremde Rechtsgüter verletzt, schuldet Schadensersatz (§ 823)."
    ],
    terms: [
      ["Eigentum", "Umfassendes Recht an einer Sache; der Eigentümer darf nach Belieben mit ihr verfahren, soweit Gesetz oder Rechte Dritter nicht entgegenstehen."],
      ["Besitz", "Tatsächliche Gewalt über eine Sache – unabhängig davon, wem sie gehört."],
      ["Besitzdiener", "Wer die tatsächliche Gewalt für einen anderen in dessen Haushalt oder Erwerbsgeschäft weisungsgebunden ausübt."],
      ["Verbotene Eigenmacht", "Besitzentziehung oder Besitzstörung ohne den Willen des Besitzers, sofern das Gesetz sie nicht gestattet."],
      ["Besitzwehr / Besitzkehr", "Abwehr einer Besitzstörung mit Gewalt bzw. Wiederabnahme einer weggenommenen Sache bei frischer Tat."],
      ["Selbsthilfe", "Vorläufige eigenmächtige Sicherung eines Anspruchs, wenn staatliche Hilfe nicht rechtzeitig zu erreichen ist."],
      ["Verhältnismäßigkeit", "Eine Maßnahme muss geeignet, erforderlich und angemessen sein."],
      ["Schikaneverbot", "Ein Recht darf nicht ausgeübt werden, wenn dies nur den Zweck haben kann, einem anderen zu schaden (§ 226)."]
    ],
    law: ["§§ 90, 90a BGB", "§§ 226–231 BGB", "§§ 823, 827, 828, 831, 833 BGB", "§§ 854, 855, 858–860 BGB", "§§ 903, 904, 1004 BGB", "§§ 965–978 BGB"],
    mistakes: [
      "Besitz und Eigentum werden verwechselt.",
      "§ 228 (Gefahr geht von der Sache aus) und § 904 (Zugriff auf unbeteiligte Sache) werden vertauscht.",
      "Selbsthilfe wird angenommen, obwohl die Polizei rechtzeitig erreichbar wäre.",
      "Besitzkehr wird angenommen, obwohl die Tat nicht mehr „frisch“ ist."
    ],
    subs: {
      eigbes: ["Eigentum und Besitz", "Eigentum und Besitz sowie die daraus folgenden Rechte unterscheiden", "§§ 854, 855, 903 BGB", "g"],
      besitzschutz: ["Besitzschutz und verbotene Eigenmacht", "Besitzwehr und Besitzkehr anwenden und begrenzen", "§§ 858–860 BGB", "g"],
      hausrecht: ["Hausrecht", "Hausrecht aus Eigentum und Besitz herleiten und durchsetzen", "§§ 858 ff., 903, 1004 BGB", "g"],
      notwehr: ["Notwehr (§ 227 BGB)", "Voraussetzungen und Grenzen der zivilrechtlichen Notwehr aufzeigen", "§ 227 BGB", "g"],
      notstand: ["Notstand (§§ 228, 904 BGB)", "Verteidigungs- und Angriffsnotstand unterscheiden", "§§ 228, 904 BGB", "g"],
      selbsthilfe: ["Selbsthilfe (§§ 229–231 BGB)", "Voraussetzungen und Grenzen der Selbsthilfe aufzeigen", "§§ 229–231 BGB", "g"],
      haftung: ["Unerlaubte Handlung und Haftung", "Schadensersatzpflichten und Haftungsausschlüsse einordnen", "§§ 823, 827, 828, 831, 833 BGB", "g"],
      sache: ["Sachen, Tiere, Fund", "Sachbegriff, Tiere und Pflichten des Finders kennen", "§§ 90, 90a, 965–978 BGB", "g"],
      allg: ["Allgemeine Grundsätze", "Verhältnismäßigkeit, Schikaneverbot und Grundbegriffe anwenden", "§§ 1, 2, 104, 106, 226, 276 BGB", "g"]
    }
  });

  SK.area({
    id: "str", group: 4, part: "4a", short: "Strafrecht",
    title: "Straf- und Strafverfahrensrecht",
    source: { title: "Strafgesetzbuch (StGB); Strafprozessordnung (StPO)", institution: "Bundesministerium der Justiz – gesetze-im-internet.de", url: GII + "stgb/" },
    intro: "Das Strafrecht beschreibt, welches Verhalten strafbar ist – und wann ein Eingriff ausnahmsweise gerechtfertigt ist. Für den Wachdienst zentral: Notwehr, Notstand und die vorläufige Festnahme durch jedermann.",
    summary: [
      "Eine Straftat setzt Tatbestandsmäßigkeit, Rechtswidrigkeit und Schuld voraus.",
      "Verbrechen sind Taten mit Mindestfreiheitsstrafe von einem Jahr; alles darunter sind Vergehen (§ 12 StGB).",
      "Notwehr (§ 32 StGB) ist die Verteidigung, die erforderlich ist, um einen gegenwärtigen rechtswidrigen Angriff von sich oder einem anderen abzuwenden.",
      "Der rechtfertigende Notstand (§ 34 StGB) verlangt eine gegenwärtige, nicht anders abwendbare Gefahr und ein wesentlich überwiegendes geschütztes Interesse.",
      "Nach § 127 Abs. 1 StPO darf jedermann eine auf frischer Tat betroffene oder verfolgte Person vorläufig festnehmen, wenn sie der Flucht verdächtig ist oder ihre Identität nicht sofort festgestellt werden kann.",
      "Kinder unter 14 Jahren sind schuldunfähig (§ 19 StGB).",
      "Antragsdelikte werden nur auf Strafantrag verfolgt (Frist: drei Monate, § 77b StGB); Offizialdelikte von Amts wegen."
    ],
    terms: [
      ["Tatbestand", "Gesetzliche Beschreibung des verbotenen Verhaltens."],
      ["Rechtswidrigkeit", "Die Tat widerspricht der Rechtsordnung; sie entfällt bei Rechtfertigungsgründen wie Notwehr."],
      ["Schuld", "Persönliche Vorwerfbarkeit; fehlt z. B. bei Kindern unter 14 Jahren."],
      ["Vorsatz", "Wissen und Wollen der Tatbestandsverwirklichung."],
      ["Fahrlässigkeit", "Außerachtlassen der gebotenen Sorgfalt; nur strafbar, wenn das Gesetz es ausdrücklich bestimmt (§ 15 StGB)."],
      ["Gegenwärtiger Angriff", "Ein Angriff, der unmittelbar bevorsteht, gerade stattfindet oder noch andauert."],
      ["Frische Tat", "Die Tat wird bei Begehung oder unmittelbar danach am Tatort oder in dessen Nähe bemerkt."],
      ["Strafantrag", "Erklärung des Verletzten, dass er die Strafverfolgung wünscht – Voraussetzung bei Antragsdelikten."],
      ["Strafanzeige", "Mitteilung eines Sachverhalts an Polizei, Staatsanwaltschaft oder Amtsgericht; kann jeder erstatten."]
    ],
    law: ["§§ 1, 11–13, 15, 19, 22–27, 32–35 StGB", "§§ 123, 132, 132a, 153, 154, 164, 185 StGB", "§§ 223, 224, 226, 229, 239, 240 StGB", "§§ 242–244, 246, 248a, 249, 252, 253, 255, 259, 263, 265a, 267, 303, 323c StGB", "§§ 127, 152, 163 StPO", "§§ 29, 30 BtMG"],
    mistakes: [
      "Festnahme nach § 127 StPO bei bloßem Verdacht ohne frische Tat.",
      "Annahme, nach einer Festnahme dürfe die Person durchsucht oder vernommen werden.",
      "Verwechslung von Diebstahl (Wegnahme) und Unterschlagung (Zueignung ohne Wegnahme).",
      "Verwechslung von Raub (Gewalt zur Wegnahme) und räuberischem Diebstahl (Gewalt zur Beutesicherung).",
      "Notwehr gegen einen bereits abgeschlossenen Angriff."
    ],
    subs: {
      aufbau: ["Aufbau der Straftat, Allgemeiner Teil", "Den Aufbau des Strafrechts und die Elemente der Straftat verstehen", "§§ 1, 11–13, 15, 19–21 StGB", "g"],
      versuch: ["Versuch, Täterschaft, Teilnahme", "Versuch und Vollendung sowie Täterschaft und Teilnahme unterscheiden", "§§ 22–27 StGB", "g"],
      notwehr: ["Notwehr und Nothilfe", "Voraussetzungen und Grenzen von Notwehr und Nothilfe prüfen", "§§ 32, 33 StGB", "g"],
      notstand: ["Notstand", "Rechtfertigenden und entschuldigenden Notstand unterscheiden", "§§ 34, 35 StGB", "g"],
      festnahme: ["Vorläufige Festnahme", "Das Festnahmerecht für jedermann sicher anwenden", "§ 127 Abs. 1 StPO", "g"],
      ordnung: ["Straftaten gegen die öffentliche Ordnung", "Hausfriedensbruch, Amtsanmaßung und Titelmissbrauch erkennen", "§§ 123, 132, 132a StGB", "g"],
      person: ["Straftaten gegen die Person", "Körperverletzungs-, Freiheits- und Ehrdelikte unterscheiden", "§§ 185, 223, 224, 226, 229, 239, 240, 241 StGB", "g"],
      vermoegen: ["Eigentums- und Vermögensdelikte", "Diebstahl, Unterschlagung, Raub, Betrug und verwandte Delikte unterscheiden", "§§ 242–244, 246, 248a, 249, 252, 253, 255, 259, 263, 265a StGB", "g"],
      sonst: ["Weitere Straftaten", "Sachbeschädigung, Urkundenfälschung, Aussagedelikte und unterlassene Hilfeleistung kennen", "§§ 153, 154, 164, 267, 303, 304, 323c StGB", "g"],
      verfahren: ["Strafverfahren, Anzeige, Antrag", "Strafanzeige, Strafantrag und die Rollen im Strafverfahren einordnen", "§§ 77, 77b StGB; §§ 52, 55, 136, 152, 158, 163 StPO", "g"],
      btm: ["Betäubungsmittel und Ordnungswidrigkeiten", "Umgang mit BtM-Funden und die Abgrenzung zur Ordnungswidrigkeit kennen", "§ 29 BtMG; §§ 2, 3 KCanG; §§ 1, 46, 47 OWiG", "g"]
    }
  });

  SK.area({
    id: "waf", group: 4, part: "4b", short: "Waffen",
    title: "Umgang mit Waffen",
    source: { title: "Waffengesetz (WaffG)", institution: "Bundesministerium der Justiz – gesetze-im-internet.de", url: GII + "waffg_2002/" },
    intro: "Das Waffenrecht bestimmt, wer Waffen erwerben, besitzen und führen darf. Für Bewachungsunternehmen gilt die Sonderregel des § 28 WaffG. Das Waffenrecht wurde zuletzt mehrfach geändert – Details vor der Prüfung am aktuellen Gesetzestext prüfen.",
    summary: [
      "Der Umgang mit Waffen ist grundsätzlich erst ab 18 Jahren erlaubt (§ 2 WaffG).",
      "Erwerben heißt die tatsächliche Gewalt erlangen, besitzen sie ausüben, führen sie außerhalb der eigenen Wohnung, Geschäftsräume oder des befriedeten Besitztums ausüben.",
      "Die Waffenbesitzkarte berechtigt zu Erwerb und Besitz, der Waffenschein zum Führen einer Schusswaffe.",
      "Der Kleine Waffenschein berechtigt zum Führen von Schreckschuss-, Reizstoff- und Signalwaffen mit PTB-Zeichen.",
      "Eine waffenrechtliche Erlaubnis setzt u. a. Volljährigkeit, Zuverlässigkeit, persönliche Eignung, Sachkunde und ein Bedürfnis voraus (§ 4 WaffG).",
      "Bei öffentlichen Veranstaltungen ist das Führen von Waffen grundsätzlich verboten (§ 42 WaffG).",
      "Im Wachdienst dürfen Waffen nur mit Zustimmung des Gewerbetreibenden geführt werden; jeder Gebrauch ist unverzüglich anzuzeigen (BewachV)."
    ],
    terms: [
      ["Schusswaffe", "Gegenstand, bei dem Geschosse durch einen Lauf getrieben werden und der zu Angriff, Verteidigung, Signalgebung, Jagd, Sport oder Spiel bestimmt ist."],
      ["Hieb- und Stoßwaffe", "Gegenstand, der dazu bestimmt ist, durch Hieb, Stoß, Stich, Schlag oder Wurf Verletzungen beizubringen, z. B. Schlagstock."],
      ["Erwerben", "Die tatsächliche Gewalt über eine Waffe erlangen."],
      ["Führen", "Die tatsächliche Gewalt über eine Waffe außerhalb der eigenen Wohnung, der Geschäftsräume, des eigenen befriedeten Besitztums oder einer Schießstätte ausüben."],
      ["Überlassen", "Einem anderen die tatsächliche Gewalt über eine Waffe einräumen."],
      ["Waffenbesitzkarte (WBK)", "Erlaubnis zum Erwerb und Besitz von Schusswaffen."],
      ["Waffenschein", "Erlaubnis zum Führen von Schusswaffen."],
      ["PTB-Zeichen", "Prüfzeichen der Physikalisch-Technischen Bundesanstalt auf zugelassenen Schreckschuss-, Reizstoff- und Signalwaffen."]
    ],
    law: ["§§ 1, 2, 4–8, 10, 28, 36, 38, 42, 42a, 51–53 WaffG", "Anlagen 1 und 2 zum WaffG", "§§ 17, 20 BewachV"],
    mistakes: [
      "Waffenbesitzkarte und Waffenschein werden verwechselt.",
      "Annahme, der Kleine Waffenschein erlaube das Führen bei öffentlichen Veranstaltungen.",
      "Annahme, Wachpersonen dürften private Waffen im Dienst führen.",
      "Tierabwehrspray wird mit Reizstoffsprühgerät mit Prüfzeichen gleichgesetzt."
    ],
    subs: {
      begriffe: ["Waffenrechtliche Begriffe", "Erwerben, Besitzen, Führen und Überlassen mit ihren Folgen unterscheiden", "§ 1 WaffG; Anlage 1 WaffG", "g"],
      erlaubnis: ["Erlaubnisse und Voraussetzungen", "Waffenrechtliche Erlaubnisse und ihre Voraussetzungen kennen", "§§ 2, 4–8, 10 WaffG", "g"],
      bewachung: ["Waffen im Bewachungsgewerbe", "Die Sonderregeln für Bewachungsunternehmen und Wachpersonen anwenden", "§ 28 WaffG; §§ 17, 20 BewachV", "g"],
      verbote: ["Verbotene Waffen und Führverbote", "Verbotene Gegenstände und Führverbote erkennen", "§§ 42, 42a WaffG; Anlage 2 WaffG", "g"],
      pflichten: ["Aufbewahrung, Ausweispflicht, Sanktionen", "Aufbewahrungs- und Ausweispflichten sowie Sanktionen kennen", "§§ 36, 37b, 38, 45, 51–53 WaffG; § 13 AWaffV", "g"],
      mittel: ["Andere Verteidigungsmittel", "Einsatzgrenzen von Reizstoffsprühgeräten und Schlagstöcken einordnen", "WaffG; §§ 32, 34 StGB", "b"]
    }
  });

  SK.area({
    id: "uvv", group: 5, part: "5", short: "Unfallverhütung",
    title: "Unfallverhütungsvorschrift Wach- und Sicherungsdienste",
    source: { title: "DGUV Vorschrift 23 „Wach- und Sicherungsdienste“; DGUV Vorschrift 1 „Grundsätze der Prävention“", institution: "Deutsche Gesetzliche Unfallversicherung (DGUV)", url: "https://publikationen.dguv.de/regelwerk/dguv-vorschriften/" },
    intro: "Die Unfallverhütungsvorschriften schützen die Beschäftigten selbst. Sie regeln Eignung, Einweisung, Ausrüstung, den Umgang mit Hunden und Schusswaffen sowie Geldtransporte. Maßgeblich ist die Fassung des zuständigen Unfallversicherungsträgers.",
    summary: [
      "Die DGUV Vorschrift 23 gilt für Wach- und Sicherungstätigkeiten zum Schutz von Personen und Sachwerten.",
      "Der Unternehmer darf nur geeignete, befähigte und unterwiesene Personen einsetzen.",
      "Dienstanweisungen sind zu erstellen und von den Versicherten zu befolgen.",
      "Alkohol und andere berauschende Mittel sind im Dienst verboten; man darf auch nicht berauscht zum Dienst erscheinen.",
      "Vor Aufnahme der Tätigkeit ist in das Objekt und seine besonderen Gefahren einzuweisen.",
      "Die DGUV Vorschrift 1 verpflichtet den Unternehmer zur Unterweisung (mindestens einmal jährlich) und zur Organisation der Ersten Hilfe."
    ],
    terms: [
      ["Unfallverhütungsvorschrift (UVV)", "Verbindliche Vorschrift der Unfallversicherungsträger für Unternehmer und Versicherte."],
      ["Versicherte", "Beschäftigte, die in der gesetzlichen Unfallversicherung versichert sind."],
      ["Berufsgenossenschaft", "Träger der gesetzlichen Unfallversicherung für gewerbliche Unternehmen."],
      ["Unterweisung", "Tätigkeitsbezogene Information über Gefahren und Schutzmaßnahmen; mindestens einmal jährlich."],
      ["Objekteinweisung", "Einweisung in das zu sichernde Objekt und seine spezifischen Gefahren vor Tätigkeitsbeginn."],
      ["Arbeitsunfall", "Unfall eines Versicherten infolge der versicherten Tätigkeit."],
      ["Ersthelfer", "In Erster Hilfe ausgebildete Person im Betrieb."]
    ],
    law: ["DGUV Vorschrift 23 (§§ 1–28)", "DGUV Vorschrift 1 (§§ 2, 4, 9, 12, 15–18, 24–26)", "SGB VII"],
    mistakes: [
      "Annahme, UVV richteten sich nur an den Unternehmer.",
      "Übersehen, dass erkannte Gefahren und Mängel unverzüglich zu melden sind.",
      "Annahme, „ein Bier vor Dienstbeginn“ sei erlaubt.",
      "Annahme, Schreckschuss- oder Gaswaffen seien im Wachdienst eine erlaubte Alternative – die UVV verbietet sie (§ 19 Abs. 4)."
    ],
    subs: {
      allg: ["Geltung, Eignung, Dienstanweisung", "Geltungsbereich, Eignungsanforderungen und Dienstanweisungen kennen", "§§ 1–5 DGUV Vorschrift 23", "g"],
      objekt: ["Objektübernahme und Einweisung", "Pflichten bei Übernahme, Überprüfung und Einweisung in Objekte kennen", "§§ 6–9 DGUV Vorschrift 23", "g"],
      ausr: ["Ausrüstung und Brillenträger", "Anforderungen an Ausrüstung und persönliche Voraussetzungen kennen", "§§ 10, 11 DGUV Vorschrift 23", "g"],
      hund: ["Diensthunde", "Vorschriften für den Einsatz von Hunden kennen", "§§ 12–17 DGUV Vorschrift 23", "g"],
      waffe: ["Schusswaffen nach der UVV", "Unfallverhütungsregeln beim Umgang mit Schusswaffen kennen", "§§ 18–22 DGUV Vorschrift 23", "g"],
      geld: ["Geldtransporte", "Besondere Bestimmungen für Geldtransporte kennen", "§§ 24–26 DGUV Vorschrift 23", "g"],
      v1: ["Grundsätze der Prävention und Erste Hilfe", "Pflichten von Unternehmer und Versicherten sowie Erste-Hilfe-Organisation kennen", "§§ 2, 4, 15 DGUV Vorschrift 1; §§ 7, 8, 150 SGB VII", "g"]
    }
  });

  SK.area({
    id: "umm", group: 6, part: "6", short: "Umgang mit Menschen",
    title: "Umgang mit Menschen",
    oral: true,
    source: { title: "DIHK-Rahmenplan Sachkundeprüfung, Sachgebiet 6 (Stand September 2019)", institution: "DIHK", url: "https://www.dihk.de/resource/blob/153894/6c2cf0e5eac95e7f4343bf549e983abb/recht-rahmenplan-fuer-sachkundepruefung-und-unterrichtung-im-bewachungsgewerbe-data.pdf" },
    intro: "Verhalten in Gefahrensituationen, Deeskalation, Kommunikation und interkulturelle Kompetenz – das umfangreichste Sachgebiet der Unterrichtung und ein Schwerpunkt der mündlichen Prüfung.",
    summary: [
      "Kommunikation läuft verbal, nonverbal (Körpersprache) und paraverbal (Stimme, Tempo). Ein großer Teil der Wirkung entsteht nicht durch den Wortinhalt.",
      "Jede Nachricht hat eine Sach- und eine Beziehungsebene. Konflikte entstehen meist auf der Beziehungsebene.",
      "Deeskalation heißt: ruhig bleiben, Abstand halten, zuhören, respektvoll ansprechen, Auswege anbieten.",
      "Eigensicherung geht vor: Abstand, Fluchtweg, Hände beobachten, Unterstützung anfordern.",
      "Stress engt die Wahrnehmung ein. Wer seine Stressreaktionen kennt, handelt kontrollierter.",
      "In Menschenmengen sinkt die individuelle Hemmschwelle. Klare, kurze Ansagen und offene Fluchtwege verhindern Panik.",
      "Interkulturelle Kompetenz bedeutet, Unterschiede bei Nähe, Blickkontakt und Gestik zu kennen und Menschen ohne Vorurteile gleich zu behandeln."
    ],
    terms: [
      ["Deeskalation", "Maßnahmen, die einen Konflikt entschärfen und Gewalt verhindern."],
      ["Aktives Zuhören", "Aufmerksam zuhören, nachfragen und das Gehörte in eigenen Worten zusammenfassen."],
      ["Ich-Botschaft", "Aussage über die eigene Wahrnehmung statt Vorwurf an den anderen."],
      ["Nonverbale Kommunikation", "Mimik, Gestik, Haltung, Abstand, Blickkontakt."],
      ["Selektive Wahrnehmung", "Man nimmt bevorzugt wahr, was zu den eigenen Erwartungen passt."],
      ["Vorurteil", "Vorgefasstes, nicht überprüftes Urteil über Personen oder Gruppen."],
      ["Eigensicherung", "Alle Maßnahmen zum Schutz der eigenen Person beim Einschreiten."],
      ["Distress / Eustress", "Belastender bzw. anregender, positiv erlebter Stress."],
      ["Diversität", "Vielfalt von Menschen, z. B. nach Herkunft, Geschlecht, Alter, Religion, Behinderung, sexueller Identität."]
    ],
    law: ["DIHK-Rahmenplan Sachgebiet 6", "Art. 1, 3 GG", "Allgemeines Gleichbehandlungsgesetz (AGG)"],
    mistakes: [
      "Lautstärke mit Durchsetzungsfähigkeit verwechseln.",
      "Betroffene vor Publikum bloßstellen – das verhindert den gesichtswahrenden Rückzug.",
      "Körperliche Nähe suchen, wenn jemand bereits erregt ist.",
      "Aus Aussehen oder Herkunft auf Verhalten schließen."
    ],
    subs: {
      komm: ["Kommunikation", "Grundlagen der Kommunikation und Gesprächsführung anwenden", "Fachmodelle der Kommunikation (Rahmenplan Sachgebiet 6)", "e"],
      wahr: ["Wahrnehmung und Motive", "Motive menschlichen Verhaltens und Wahrnehmungsfehler verstehen", "Rahmenplan Sachgebiet 6", "e"],
      konflikt: ["Konflikt, Frustration, Aggression", "Entstehung und Verlauf von Konflikten rechtzeitig erkennen", "Rahmenplan Sachgebiet 6", "e"],
      deesk: ["Deeskalation", "Deeskalationstechniken anwenden und ihre Grenzen kennen", "Rahmenplan Sachgebiet 6", "e"],
      eigen: ["Eigensicherung und Einsatzbewältigung", "Maßnahmen der Eigensicherung beherrschen", "Rahmenplan Sachgebiet 6", "e"],
      stress: ["Stress", "Stress als Auslöser von Fehlverhalten erkennen und bewältigen", "Rahmenplan Sachgebiet 6", "e"],
      gruppe: ["Gruppen, Massen, Panik", "Verhalten von Gruppen und Massen einschätzen und Personenströme lenken", "Rahmenplan Sachgebiet 6", "e"],
      personen: ["Besondere Personengruppen", "Mit Betrunkenen, psychisch Auffälligen und Schutzbedürftigen angemessen umgehen", "Rahmenplan Sachgebiet 6", "e"],
      kultur: ["Interkulturelle Kompetenz und Diversität", "Interkulturelle Unterschiede und gesellschaftliche Vielfalt berücksichtigen", "Art. 3 GG; AGG; Rahmenplan Sachgebiet 6", "e"],
      fuehrung: ["Führen von Personal", "Grundlagen der Mitarbeiterführung kennen", "Rahmenplan Sachgebiet 6", "e"]
    }
  });

  SK.area({
    id: "tec", group: 7, part: "7", short: "Sicherheitstechnik",
    title: "Grundzüge der Sicherheitstechnik",
    source: { title: "DIHK-Rahmenplan Sachkundeprüfung, Sachgebiet 7 (Stand September 2019)", institution: "DIHK", url: "https://www.dihk.de/resource/blob/153894/6c2cf0e5eac95e7f4343bf549e983abb/recht-rahmenplan-fuer-sachkundepruefung-und-unterrichtung-im-bewachungsgewerbe-data.pdf" },
    intro: "Mechanik hält auf, Elektronik meldet, Menschen reagieren. Dieses Sachgebiet behandelt mechanische Sicherungen, Gefahrenmeldeanlagen, Zutrittskontrolle, Kommunikationsmittel und Brandschutz.",
    summary: [
      "Mechanische Sicherungen (Zaun, Tür, Schloss, Verglasung) schaffen Widerstandszeit. Elektronische Anlagen melden den Angriff, verhindern ihn aber nicht.",
      "Eine Einbruchmeldeanlage besteht aus Meldern, Zentrale, Schalteinrichtung und Alarmierung. Man unterscheidet Außenhaut-, Raum- und Objektüberwachung.",
      "Brandmeldeanlagen erkennen Brände über automatische Melder (Rauch, Wärme, Flammen) oder Handfeuermelder und alarmieren die Feuerwehr.",
      "Zutrittskontrolle prüft Berechtigungen über Wissen (PIN), Besitz (Karte) oder biometrische Merkmale.",
      "Ein Feuer braucht brennbaren Stoff, Sauerstoff und Zündenergie im richtigen Verhältnis.",
      "Brandklassen: A feste Stoffe, B Flüssigkeiten, C Gase, D Metalle, F Speisefette und -öle.",
      "Die Notruf- und Serviceleitstelle (NSL) nimmt Meldungen entgegen und leitet die Intervention ein."
    ],
    terms: [
      ["Einbruchmeldeanlage (EMA)", "Anlage, die Einbruchsversuche automatisch erkennt und meldet."],
      ["Brandmeldeanlage (BMA)", "Anlage zur frühen Erkennung und Meldung von Bränden."],
      ["Zutrittskontrollsystem", "System, das regelt, wer wann wohin Zutritt erhält."],
      ["Außenhautüberwachung", "Überwachung von Türen, Fenstern und Wänden auf Öffnen, Verschluss und Durchbruch."],
      ["Vereinzelungsanlage", "Einrichtung, die nur jeweils eine Person passieren lässt, z. B. Drehkreuz oder Schleuse."],
      ["NSL", "Notruf- und Serviceleitstelle: ständig besetzte Stelle, die Gefahrenmeldungen empfängt und Maßnahmen einleitet."],
      ["Wächterkontrollsystem", "System zum Nachweis, dass Kontrollgänge wie vorgesehen durchgeführt wurden."],
      ["Totmannschaltung", "Einrichtung der Einzelarbeitsplatzüberwachung, die Alarm auslöst, wenn die Person nicht mehr reagiert."]
    ],
    law: ["DIHK-Rahmenplan Sachgebiet 7", "Technische Regeln und Normen (z. B. DIN EN 2 Brandklassen, DIN EN 1627 Einbruchhemmung)", "Arbeitsstättenregel ASR A1.3 (Sicherheitszeichen)"],
    mistakes: [
      "Annahme, eine Alarmanlage verhindere den Einbruch.",
      "Fettbrand mit Wasser löschen.",
      "Zutritt (Räume), Zugang (IT-Systeme) und Zugriff (Daten) verwechseln.",
      "Störungsmeldungen an Anlagen ignorieren oder eigenmächtig abschalten."
    ],
    subs: {
      mech: ["Mechanische Sicherungseinrichtungen", "Mechanische Sicherungen kennen und den zu sichernden Bereichen zuordnen", "Rahmenplan Sachgebiet 7; DIN EN 1627", "e"],
      ema: ["Einbruch- und Überfallmeldeanlagen", "Aufbau und Wirkungsweise von Gefahrenmeldeanlagen kennen", "Rahmenplan Sachgebiet 7", "e"],
      bma: ["Brandmeldeanlagen", "Aufbau von Brandmeldeanlagen und richtiges Verhalten bei Alarm kennen", "Rahmenplan Sachgebiet 7", "e"],
      zko: ["Zutrittskontrolle und Videoüberwachung", "Zutrittskontroll- und Videosysteme einsatzorientiert anwenden", "Rahmenplan Sachgebiet 7", "e"],
      nsl: ["NSL, Wächterkontrolle, Einzelarbeitsplatz", "Leitstelle, Intervention und Personensicherung einordnen", "Rahmenplan Sachgebiet 7", "e"],
      funk: ["Kommunikationsmittel", "Kommunikationsmittel mit ihren Vor- und Nachteilen kennen", "Rahmenplan Sachgebiet 7", "e"],
      brand: ["Brandschutz", "Brandvoraussetzungen, Brandklassen und Löschmittel kennen und anwenden", "Rahmenplan Sachgebiet 7; DIN EN 2", "e"],
      stoer: ["Störungen und Alarmverhalten", "Bei Alarm, Störung und Evakuierung richtig handeln", "Rahmenplan Sachgebiet 7; objektbezogene Dienstanweisung", "e"]
    }
  });

  SK.groups = [
    { n: 1, title: "Recht der öffentlichen Sicherheit und Ordnung einschließlich Gewerberecht", areas: ["oso", "gew"] },
    { n: 2, title: "Datenschutzrecht", areas: ["ds"] },
    { n: 3, title: "Bürgerliches Gesetzbuch", areas: ["bgb"] },
    { n: 4, title: "Straf- und Strafverfahrensrecht einschließlich Umgang mit Waffen", areas: ["str", "waf"] },
    { n: 5, title: "Unfallverhütungsvorschrift Wach- und Sicherungsdienste", areas: ["uvv"] },
    { n: 6, title: "Umgang mit Menschen", areas: ["umm"] },
    { n: 7, title: "Grundzüge der Sicherheitstechnik", areas: ["tec"] }
  ];

  /* ---------- Glossar ---------- */
  SK.glossary = [
    ["Besitz", "Tatsächliche Gewalt über eine Sache (§ 854 BGB). Es kommt nicht darauf an, wem die Sache gehört. Auch der Dieb ist Besitzer – allerdings ein unrechtmäßiger."],
    ["Eigentum", "Rechtliche Herrschaft über eine Sache (§ 903 BGB). Der Eigentümer darf mit der Sache nach Belieben verfahren und andere von jeder Einwirkung ausschließen, soweit Gesetz oder Rechte Dritter nicht entgegenstehen."],
    ["Hausrecht", "Befugnis, darüber zu entscheiden, wer einen Raum oder ein Grundstück betreten und dort verweilen darf. Es folgt aus Eigentum und Besitz (§§ 858 ff., 903, 1004 BGB) und wird strafrechtlich durch § 123 StGB geschützt. Sicherheitskräfte üben es nur aus, wenn es ihnen übertragen wurde."],
    ["Notwehr", "Die Verteidigung, die erforderlich ist, um einen gegenwärtigen rechtswidrigen Angriff von sich oder einem anderen abzuwenden (§ 32 StGB, § 227 BGB). Wer in Notwehr handelt, handelt nicht rechtswidrig."],
    ["Nothilfe", "Notwehr zugunsten eines anderen. Es gelten dieselben Voraussetzungen wie bei der Notwehr."],
    ["Notstand", "Rechtfertigender Notstand (§ 34 StGB): Abwehr einer gegenwärtigen, nicht anders abwendbaren Gefahr, wenn das geschützte Interesse das beeinträchtigte wesentlich überwiegt. Zivilrechtlich: Verteidigungsnotstand (§ 228 BGB) und Angriffsnotstand (§ 904 BGB)."],
    ["Jedermann-Festnahme", "Umgangssprachlich für die vorläufige Festnahme nach § 127 Abs. 1 StPO: Jeder darf eine auf frischer Tat betroffene oder verfolgte Person festhalten, wenn sie fluchtverdächtig ist oder ihre Identität nicht sofort festgestellt werden kann."],
    ["Vorläufige Festnahme", "Festhalten einer Person ohne richterliche Anordnung nach § 127 StPO. Für Private gilt nur Absatz 1. Die Person ist unverzüglich der Polizei zu übergeben; Durchsuchung und Vernehmung sind nicht erlaubt."],
    ["Verhältnismäßigkeit", "Eine Maßnahme muss geeignet sein, das Ziel zu erreichen, erforderlich (kein milderes gleich wirksames Mittel) und angemessen (Nachteil steht nicht außer Verhältnis zum Zweck)."],
    ["Datenschutz", "Schutz des Einzelnen davor, dass er durch den Umgang mit seinen personenbezogenen Daten in seinem Persönlichkeitsrecht beeinträchtigt wird. Geregelt vor allem in DS-GVO und BDSG."],
    ["Personenbezogene Daten", "Alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen (Art. 4 Nr. 1 DS-GVO), z. B. Name, Anschrift, Kfz-Kennzeichen, Videoaufnahme."],
    ["Gegenwärtiger Angriff", "Ein Angriff ist gegenwärtig, wenn er unmittelbar bevorsteht, gerade stattfindet oder noch andauert. Ist er beendet, ist keine Notwehr mehr möglich."],
    ["Öffentliche Sicherheit", "Unverletzlichkeit der Rechtsordnung, der subjektiven Rechte und Rechtsgüter des Einzelnen sowie der Einrichtungen und Veranstaltungen des Staates. Ihr Schutz ist Aufgabe von Polizei und Ordnungsbehörden."],
    ["Öffentliche Ordnung", "Gesamtheit der ungeschriebenen Regeln, deren Befolgung nach den herrschenden Anschauungen als unerlässliche Voraussetzung eines geordneten Zusammenlebens gilt."],
    ["Deeskalation", "Alle Maßnahmen, die eine angespannte Situation entschärfen: ruhige Ansprache, Abstand, Zuhören, respektvoller Ton, Auswege anbieten. Deeskalation hat Grenzen, wenn Gewalt unmittelbar droht."],
    ["Zutrittskontrolle", "Organisatorische und technische Maßnahmen, die sicherstellen, dass nur Berechtigte bestimmte Bereiche betreten. Identifikation über Wissen (PIN), Besitz (Karte) oder Biometrie."],
    ["Einbruchmeldeanlage", "Gefahrenmeldeanlage, die Einbruchsversuche über Melder (z. B. Magnetkontakt, Glasbruch-, Bewegungsmelder) erkennt und meldet. Sie verhindert den Einbruch nicht, sondern verkürzt die Zeit bis zur Reaktion."],
    ["Brandmeldeanlage", "Gefahrenmeldeanlage zur frühen Erkennung von Bränden über automatische Melder und Handfeuermelder. Sie alarmiert und leitet in der Regel an die Feuerwehr weiter."],
    ["Besitzdiener", "Wer die tatsächliche Gewalt über eine Sache für einen anderen weisungsgebunden ausübt (§ 855 BGB). Besitzer ist nur der andere. Wachpersonen sind typischerweise Besitzdiener."],
    ["Verbotene Eigenmacht", "Wer dem Besitzer ohne dessen Willen den Besitz entzieht oder ihn im Besitz stört, handelt widerrechtlich, sofern das Gesetz es nicht gestattet (§ 858 BGB)."],
    ["Selbsthilfe", "Eigenmächtige vorläufige Sicherung eines Anspruchs (§ 229 BGB), wenn obrigkeitliche Hilfe nicht rechtzeitig zu erlangen ist und sonst die Verwirklichung des Anspruchs vereitelt oder wesentlich erschwert würde."],
    ["Strafantrag", "Erklärung des Verletzten, dass er die Strafverfolgung wünscht. Bei Antragsdelikten Voraussetzung der Verfolgung; Frist drei Monate ab Kenntnis von Tat und Täter (§ 77b StGB)."],
    ["Strafanzeige", "Mitteilung eines möglicherweise strafbaren Sachverhalts an Polizei, Staatsanwaltschaft oder Amtsgericht (§ 158 StPO). Jeder kann sie erstatten."],
    ["Gewaltmonopol", "Grundsatz, dass nur der Staat zur Durchsetzung von Recht Zwang anwenden darf. Private dürfen Gewalt nur in den engen Grenzen der Notrechte anwenden."],
    ["Frische Tat", "Eine Tat ist frisch, wenn der Täter bei der Begehung oder unmittelbar danach am Tatort oder in dessen unmittelbarer Nähe angetroffen wird."],
    ["Garantenstellung", "Besondere Rechtspflicht, einen Schaden abzuwenden (§ 13 StGB), z. B. aus Vertrag. Wachpersonen können für das bewachte Objekt Garanten sein."],
    ["Dienstanweisung", "Schriftliche Regelung des Wachdienstes nach § 17 BewachV. Sie muss u. a. den Hinweis enthalten, dass Wachpersonen keine polizeilichen Befugnisse haben."],
    ["Bewacherregister", "Bundesweites elektronisches Register nach § 11b GewO mit Daten zu Gewerbetreibenden, Wachpersonen und deren Qualifikation und Zuverlässigkeit."],
    ["Unterrichtung", "Verfahren bei der IHK über 40 Unterrichtsstunden ohne Prüfung. Mindestvoraussetzung für Wachpersonen, soweit keine Sachkundeprüfung verlangt wird."],
    ["Brandklassen", "Einteilung brennbarer Stoffe: A feste, glutbildende Stoffe; B flüssige oder flüssig werdende Stoffe; C Gase; D Metalle; F Speisefette und -öle."]
  ].sort(function (a, b) { return a[0].localeCompare(b[0], "de"); });

  /* ---------- Quellen und Aktualität ---------- */
  var D = SK.RESEARCH_DATE;
  SK.sources = [
    { t: "Gewerbeordnung § 34a – Bewachungsgewerbe", i: "Bundesministerium der Justiz / Bundesamt für Justiz", u: GII + "gewo/__34a.html", k: "offiziell", z: "Erlaubnispflicht, Versagungsgründe, sachkundepflichtige Tätigkeiten, Befugnisse der Wachpersonen", h: "Ein Sicherheitsgewerbegesetz ist seit 2023 im Gesetzgebungsverfahren und soll § 34a GewO und die BewachV ablösen. Der Verfahrensstand war am Recherchetag öffentlich nicht eindeutig zu bestätigen; § 34a GewO war weiterhin als geltendes Recht abrufbar." },
    { t: "Bewachungsverordnung (BewachV)", i: "Bundesministerium der Justiz / Bundesamt für Justiz", u: GII + "bewachv_2019/", k: "offiziell", z: "Sachgebiete (§ 7), Sachkundeprüfung (§§ 9–11), Haftpflicht, Dienstanweisung, Ausweis, Kennzeichnung, Waffen, Buchführung", h: "Abgerufene Fassung nennt als letzte Änderung die Verordnung vom 24.06.2019. Vor der Prüfung auf neuere Änderungen prüfen." },
    { t: "Rahmenplan für die Sachkundeprüfung / Stoffsammlung für die Unterrichtung im Bewachungsgewerbe (Stand September 2019)", i: "DIHK", u: "https://www.dihk.de/resource/blob/153894/6c2cf0e5eac95e7f4343bf549e983abb/recht-rahmenplan-fuer-sachkundepruefung-und-unterrichtung-im-bewachungsgewerbe-data.pdf", k: "offiziell", z: "Gliederung aller Sachgebiete, Lernziele, Schwerpunkte der mündlichen Prüfung", h: "Laut IHK-Informationsblatt von 2025 blieb der Rahmenstoffplan bei der Umstellung des Bewertungsschemas unverändert." },
    { t: "Weiterentwicklung Bewertungsschema IHK-Sachkundeprüfung Bewachung (Informationsblatt)", i: "IHK-Organisation (abgerufen über ihk.de)", u: "https://www.ihk.de/blueprint/servlet/resource/blob/6536240/9a4ed19e7f19f6fbc663d9613e18215b/weiterentwicklung-pruefung-data.pdf", k: "offiziell", z: "Seit 01.07.2025: 82 Fragen, maximal 120 Punkte, bestanden ab 60 Punkten, Auswertung nach Teilantworten", h: "Bundesweit einheitlich. Details zur Zahl der Antwortmöglichkeiten und zur Verteilung auf Sachgebiete nennt das Blatt nicht." },
    { t: "Information zum neuen Bewertungsschema (Stand 9. Mai 2025)", i: "IHK Ostthüringen zu Gera", u: "https://www.ihk.de/blueprint/servlet/resource/blob/6557764/ace438a6760349dc253c77e8bdad9472/skp-bewachung-info-zum-neuen-bewertungsschema-data.pdf", k: "offiziell", z: "Zweite Quelle zum Bewertungsschema – inhaltsgleich", h: "" },
    { t: "Neue Bewertungsregeln in der Sachkundeprüfung Bewachungsgewerbe", i: "IHK Chemnitz", u: "https://www.ihk.de/chemnitz/aus-und-weiterbildung/pruefungen/news-pruefungen/neue-bewertungsregeln-in-der-sachkundepruefung-6550620", k: "offiziell", z: "Dritte Quelle zum Bewertungsschema; mündlicher Teil unverändert", h: "" },
    { t: "Sachkundeprüfung im Bewachungsgewerbe (§ 34a GewO)", i: "IHK Aachen", u: "https://www.ihk.de/aachen/bildung/sach-und-fachkunde/sachkundepruefung-bewachungsgewerbe-604606", k: "offiziell", z: "Prüfungsablauf, 82 Fragen/120 Punkte, mündlich bis zu fünf Teilnehmer, Gebühr 122 €", h: "Gebühren sind kammerspezifisch." },
    { t: "Sachkundeprüfung nach § 34a der Gewerbeordnung", i: "IHK Berlin", u: "https://www.ihk.de/berlin/pruefungen-lehrgaenge/informationen-zum-bewachungsgewerbe/sachkundepruefung-nach-34-a-der-gewerbeordnung-2265212", k: "offiziell", z: "Prüfungsablauf, PC-gestützt, mündlich bis zu drei Personen, Gebühr 200 €, mündlicher Teil binnen zwei Jahren", h: "Gebühren und Organisation sind kammerspezifisch." },
    { t: "IHK-Sachkundeprüfung im Bewachungsgewerbe", i: "IHK Nord Westfalen", u: "https://www.ihk.de/nordwestfalen/bildung/sach-und-fachkundepruefungen/bewachungsgewerbe-3605428", k: "offiziell", z: "Prüfungsablauf, PC- bzw. Tablet-Prüfung, Gebühr 184 € (ab 01.01.2025), Anmeldeschluss", h: "" },
    { t: "Sachkundeprüfung im Bewachungsgewerbe", i: "IHK Hanau-Gelnhausen-Schlüchtern", u: "https://www.ihk.de/hanau/ausbildung/pruefungswesen/sachkundepruefungen/sachkundepruefung-428446", k: "offiziell", z: "Teilantworten-Auswertung, 72 → 82 Fragen, Gebühr 170 €", h: "" },
    { t: "Sachkundeprüfung im Bewachungsgewerbe nach § 34a GewO", i: "IHK Heilbronn-Franken", u: "https://www.ihk.de/heilbronn-franken/produktmarken/branchen/gewerbeportal/bewachungsgewerbe/sachkundepruefung-im-bewachungsgewerbe-4812108", k: "offiziell", z: "Bundeseinheitliche Aufgaben und Termine, Gebühr 250 € (ab 01.10.2026)", h: "" },
    { t: "Sachkundeprüfung im Bewachungsgewerbe nach § 34a GewO", i: "IHK Rhein-Neckar", u: "https://www.ihk.de/rhein-neckar/wirtschaftsstandort/branchen/dienstleistungen/bewach/sachkundepruefung-949594", k: "offiziell", z: "Prüfung auf iPads, Gebühr 230 €", h: "" },
    { t: "Bewachungsgewerbe (Sachkundeprüfung)", i: "IHK Halle-Dessau", u: "https://www.ihk.de/halle/produktmarken/aus-und-weiterbildung/sachkunde-und-fachkunde/sachkundepruefung-629872", k: "offiziell", z: "Bestätigung: je richtiger Teilantwort ein Punkt", h: "" },
    { t: "Polizeigesetz des Landes Nordrhein-Westfalen (PolG NRW)", i: "Land Nordrhein-Westfalen – recht.nrw.de", u: "https://recht.nrw.de/lrgv/gesetz/13122025-polizeigesetz-des-landes-nordrhein-westfalen-bekanntmachung-der-neufassung/", k: "offiziell", z: "Sachgebiet 1: Aufgaben und Befugnisse der Polizei in NRW", h: "Fassung mit letzter Änderung vom 2. Dezember 2025, in Kraft seit 13. Dezember 2025. Im Wortlaut gegengelesen: §§ 1, 2, 3, 8, 12, 34, 39, 43. Wer die Prüfung in einem anderen Bundesland ablegt, muss das dortige Polizeigesetz heranziehen." },
    { t: "Ordnungsbehördengesetz Nordrhein-Westfalen (OBG)", i: "Land Nordrhein-Westfalen – recht.nrw.de", u: "https://recht.nrw.de/lrgv/gesetz/01072026-ordnungsbehoerdengesetz-obg/", k: "offiziell", z: "Sachgebiet 1: Aufgaben der Ordnungsbehörden in NRW", h: "Fassung mit letzter Änderung vom 22. Juni 2026, in Kraft seit 1. Juli 2026. Im Wortlaut gegengelesen: §§ 1, 14." },
    { t: "Grundgesetz", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "gg/", k: "offiziell", z: "Sachgebiet 1", h: "Im Wortlaut gegengelesen: Art. 1, 2, 3, 4, 5, 8, 10, 12, 13, 14, 19, 20, 30, 31, 70, 103, 104." },
    { t: "Bürgerliches Gesetzbuch (BGB)", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "bgb/", k: "offiziell", z: "Sachgebiet 3", h: "Im Wortlaut gegengelesen: §§ 1, 2, 90, 90a, 104, 106, 226–231, 253, 254, 276, 611, 823, 827, 828, 831, 833, 854, 855, 858–860, 868, 903, 904, 965–967, 971, 978, 1004." },
    { t: "Strafgesetzbuch (StGB)", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "stgb/", k: "offiziell", z: "Sachgebiet 4", h: "Im Wortlaut gegengelesen: §§ 1, 12, 13, 15, 19, 20, 22–27, 32–35, 77, 77b, 77d, 123, 126, 132, 132a, 138, 145, 153, 154, 164, 185, 194, 201–202a, 223, 224, 226, 229, 230, 239–244, 246, 248a–248c, 249, 252, 253, 255, 259, 263, 265a, 267, 303, 303c, 323c." },
    { t: "Strafprozessordnung (StPO) und Ordnungswidrigkeitengesetz (OWiG)", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "stpo/", k: "offiziell", z: "Sachgebiet 4", h: "Im Wortlaut gegengelesen: StPO §§ 48, 51, 52, 55, 57, 94, 127, 136, 152, 158, 160, 163, 163b; OWiG §§ 1, 46, 47." },
    { t: "Waffengesetz (WaffG) mit Anlagen 1 und 2; Allgemeine Waffengesetz-Verordnung", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "waffg_2002/", k: "offiziell", z: "Sachgebiet 4", h: "Im Wortlaut gegengelesen: WaffG §§ 1–8, 10, 28, 36, 37b, 38, 42, 42a, 45, 51–53, Anlage 1 (Begriffe), Anlage 2 (Waffenliste); § 13 AWaffV. Das Waffenrecht wurde 2024 geändert, u. a. Messerverbot bei Veranstaltungen (§ 42 Abs. 4a) und Springmesser." },
    { t: "Gewerbeordnung (weitere Vorschriften)", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "gewo/", k: "offiziell", z: "Sachgebiet 1", h: "Im Wortlaut gegengelesen: §§ 1, 11b, 14, 29, 34a, 144." },
    { t: "Bundesdatenschutzgesetz (BDSG)", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII + "bdsg_2018/", k: "offiziell", z: "Sachgebiet 2", h: "Im Wortlaut gegengelesen: §§ 4, 26, 38, 42, 43." },
    { t: "Allgemeines Gleichbehandlungsgesetz, SGB VII, Betäubungsmittelgesetz, Konsumcannabisgesetz, Kunsturhebergesetz, StVO", i: "Bundesministerium der Justiz – gesetze-im-internet.de", u: GII, k: "offiziell", z: "Einzelne Fragen und Fälle", h: "Im Wortlaut gegengelesen: AGG §§ 1, 19, 21; SGB VII §§ 7–9, 150; BtMG § 29; KCanG §§ 2, 3; KunstUrhG § 22; StVO § 36; JuSchG §§ 4, 5." },
    { t: "DGUV Vorschrift 1 „Grundsätze der Prävention“", i: "Deutsche Gesetzliche Unfallversicherung (Wiedergabe bei der BGN)", u: "https://vorschriften.bgn-branchenwissen.de/daten/dguv/1/4.htm", k: "offiziell", z: "Sachgebiet 5", h: "Im Wortlaut gegengelesen: §§ 2, 4, 15. Abruf über die Vorschriftendatenbank einer Berufsgenossenschaft." },
    { t: "Datenschutz-Grundverordnung (EU) 2016/679", i: "Europäische Union – EUR-Lex", u: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679", k: "offiziell", z: "Rechtsgrundlage Sachgebiet 2", h: "Im Wortlaut gegengelesen: Art. 2, 4, 5, 6, 7, 9, 12, 13, 15, 16, 17, 21, 24, 28, 29, 32, 33, 34, 35, 37, 82, 83." },
    { t: "DGUV Vorschrift 23 „Wach- und Sicherungsdienste“ und DGUV Vorschrift 1", i: "Deutsche Gesetzliche Unfallversicherung", u: "https://publikationen.dguv.de/regelwerk/dguv-vorschriften/", k: "offiziell", z: "Rechtsgrundlage Sachgebiet 5", h: "DGUV Vorschrift 23 vollständig im Wortlaut gelesen (§§ 1–28). Sie stammt aus dem Jahr 1997. Maßgeblich ist die Fassung des zuständigen Unfallversicherungsträgers. Ob sie bis zu deiner Prüfung ersetzt wird, war am Recherchetag nicht zu bestätigen." },
    { t: "Verteilung der 82 Fragen und 120 Punkte auf die Sachgebiete", i: "Private Lernportale (Websuche)", u: "", k: "ergänzend", z: "Voreinstellung der Prüfungssimulation", h: "Private Anbieterangabe. Keine der ausgewerteten IHK-Quellen nennt diese Verteilung. Sie ist in der Simulation nur ein Näherungswert." }
  ].map(function (s) { s.d = D; return s; });

  /* ---------- Faktenübersicht zum Prüfungsformat ---------- */
  SK.examFacts = [
    { k: "Schriftlicher Teil: Dauer", v: "120 Minuten", s: "offiziell bestätigt", q: "IHK Aachen, IHK Berlin, IHK Nord Westfalen, IHK Rhein-Neckar" },
    { k: "Schriftlicher Teil: Fragenanzahl", v: "82 Fragen (seit 01.07.2025; zuvor 72)", s: "offiziell bestätigt", q: "IHK-Informationsblatt, IHK Gera, IHK Chemnitz, IHK Aachen" },
    { k: "Schriftlicher Teil: Höchstpunktzahl", v: "120 Punkte (zuvor 100)", s: "offiziell bestätigt", q: "wie oben" },
    { k: "Schriftlicher Teil: Bestehensgrenze", v: "mindestens 60 Punkte (50 %)", s: "offiziell bestätigt", q: "wie oben" },
    { k: "Bewertung", v: "Auswertung nach Teilantworten: Eine richtige Teilantwort kann einen Punkt ergeben.", s: "offiziell bestätigt", q: "IHK-Informationsblatt, IHK Halle-Dessau" },
    { k: "Punktabzug für falsche Kreuze", v: "Laut privaten Anbietern kein Abzug; höchstens zwei richtige Antworten je Frage.", s: "private Anbieterangabe", q: "Lernportale; in IHK-Quellen nicht ausgeführt" },
    { k: "Aufgabenform", v: "Multiple-Choice, elektronisch (PC, Laptop oder Tablet je nach IHK)", s: "durch mehrere seriöse Quellen bestätigt", q: "IHK Aachen, Berlin, Nord Westfalen, Rhein-Neckar" },
    { k: "Verteilung auf Sachgebiete", v: "In der Simulation: 7/5/5/13/13/5/8/19/7 Fragen", s: "private Anbieterangabe", q: "nicht durch IHK-Quelle bestätigt" },
    { k: "Zulassung zur mündlichen Prüfung", v: "Nur nach bestandenem schriftlichem Teil", s: "offiziell bestätigt", q: "IHK Aachen, Nord Westfalen, Rhein-Neckar" },
    { k: "Mündlicher Teil: Dauer", v: "etwa 15 Minuten je Prüfling", s: "offiziell bestätigt", q: "§ 11 BewachV; IHK-Seiten" },
    { k: "Mündlicher Teil: Gruppengröße", v: "Nach BewachV bis zu fünf Prüflinge gleichzeitig; IHK Berlin und Nord Westfalen prüfen bis zu drei gleichzeitig.", s: "weicht je IHK ab", q: "§ 11 BewachV; IHK Aachen (5); IHK Berlin, Nord Westfalen (3)" },
    { k: "Mündlicher Teil: Schwerpunkte", v: "Sachgebiete nach § 7 Nr. 1 und Nr. 6 BewachV (Recht der öffentlichen Sicherheit und Ordnung einschließlich Gewerberecht; Umgang mit Menschen). IHK Nord Westfalen nennt zusätzlich Datenschutz.", s: "offiziell bestätigt", q: "§ 11 BewachV; DIHK-Rahmenplan" },
    { k: "Mündlicher Teil: Bestehen", v: "mindestens 50 %", s: "durch mehrere seriöse Quellen bestätigt", q: "IHK Aachen, IHK Nord Westfalen" },
    { k: "Prüfungsgebühr", v: "Kammerspezifisch: 122 € (Aachen), 170 € (Hanau), 184 € (Nord Westfalen), 200 € (Berlin), 230 € (Rhein-Neckar), 250 € (Heilbronn-Franken, ab 01.10.2026)", s: "weicht je IHK ab", q: "jeweilige IHK-Seite" },
    { k: "Frist für den mündlichen Teil", v: "IHK Berlin: innerhalb von zwei Jahren nach Bestehen des schriftlichen Teils", s: "weicht je IHK ab", q: "IHK Berlin; bei eigener IHK erfragen" },
    { k: "Prüfungssprache", v: "Deutsch", s: "offiziell bestätigt", q: "IHK Berlin" }
  ];
})();
