/**
 * Kozminski Escape: Polowanie na ECTS
 * Akademia Leona Koźmińskiego (ALK) w Warszawie
 * Plik: /js/game.js - Serce gry (Silnik 2D, Pościg BFS, Semestry, Wydarzenia & Osiągnięcia)
 */

import { soundSystem } from './audio.js';

// --- Stałe i konfiguracja gry ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 540;
const GRID_SIZE = 20; // Siatka 20x20 px
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE); // 40
const ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE); // 27
const TARGET_ECTS = 30;

// Oficjalne cytaty profesora (Egzaminator)
const PROF_QUOTES = [
  "„A gdzie przypis harwardzki?!”",
  "„Ten bilans się nie zamyka!”",
  "„Widzę Pana we wrześniu!”",
  "„Czy ten esej pisał Pan, czy ChatGPT?!”",
  "„Pana odpowiedź mija się z prawdą i z sylabusem!”",
  "„Wracamy do definicji z pierwszego wykładu!”",
  "„Czerwony długopis nie zna litości!”",
  "„Czekam na pana na dyżurze w Dziekanacie!”"
];

// Cytaty Prowadzącego ćwiczenia
const INSTRUCTOR_QUOTES = [
  "„Kartkówka za pięć minut!”",
  "„Sprawdzam obecność!”",
  "„To będzie na kolokwium!”",
  "„Kto zgłasza się do tablicy?!”",
  "„Nie ma zwolnień lekarskich wstecz!”"
];

// Cytaty Pani z Dziekanatu
const DEAN_QUOTES = [
  "„Proszę zaświadczenie!”",
  "„Dziekanat jest dziś nieczynny!”",
  "„Brakuje pieczątki z kwestury!”",
  "„Proszę pobrać numerek z automatu!”",
  "„System USOS ma przerwę techniczną!”"
];

// =========================================================================
// STYPENDIUM I SKLEP ALK (Waluta, Ulepszenia, Stroje)
// =========================================================================
const WALLET_KEY = 'kozminski_wallet';
const UPGRADES_KEY = 'kozminski_upgrades';
const SKINS_KEY = 'kozminski_skins';

const UPGRADES_CONFIG = [
  {
    id: 'shoes',
    icon: '👟',
    name: 'Lepsze buty',
    desc: 'Sprint szybszy o +6% na poziom.',
    maxLevel: 3,
    prices: [150, 300, 500]
  },
  {
    id: 'thermos',
    icon: '☕',
    name: 'Termos',
    desc: 'Turbo kawa działa dłużej o +1 s na poziom.',
    maxLevel: 3,
    prices: [120, 250, 400]
  },
  {
    id: 'stamina',
    icon: '💪',
    name: 'Kondycja',
    desc: 'Maksymalna stamina +15 na poziom (100 → 145).',
    maxLevel: 3,
    prices: [150, 300, 500]
  },
  {
    id: 'idcard',
    icon: '🪪',
    name: 'Zapasowa legitymacja',
    desc: 'Zaczynasz każdą grę z tarczą Legitymacji.',
    maxLevel: 1,
    prices: [600]
  }
];

const SKINS_CONFIG = [
  {
    id: 'default',
    icon: '🏃‍♂️',
    name: 'Klasyczny student',
    desc: 'Darmowy, klasyczny strój studenta ALK.',
    price: 0,
    free: true
  },
  {
    id: 'hoodie',
    icon: '🧥',
    name: 'Bluza ALK',
    desc: 'Granatowa bluza ze złotym napisem „ALK”.',
    price: 200
  },
  {
    id: 'sport',
    icon: '🏃',
    name: 'Strój sportowy AZS',
    desc: 'Czerwono-biały strój reprezentacji AZS.',
    price: 250
  },
  {
    id: 'xmas',
    icon: '🎄',
    name: 'Świąteczny sweter',
    desc: 'Czerwony sweter z zielonym wzorem zimowym.',
    price: 300
  },
  {
    id: 'gown',
    icon: '🎓',
    name: 'Toga absolwenta',
    desc: 'Czarna toga + biret. Nagroda za zdanie Semestru III.',
    price: 0,
    requiresSem3: true
  }
];

// =========================================================================
// MAPY KAMPUSU (Parter – Patio, I piętro – Atrium)
// =========================================================================
const MAP_KEY = 'kozminski_map';

const MAPS = {
  parter: {
    id: 'parter',
    name: 'Parter (Patio)',
    icon: '🌿',
    floorTheme: 'parter',
    logoPos: { x: 400, y: 88 },
    hideNoun: 'w krzakach',
    hideHudLabel: '🌿 Ukryty w Patio (5s do kichnięcia)',
    goldenAulaName: 'Auli A',
    walls: [
      { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
      { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },

      // --- AULA A (Lewy górny: [20..220] x [20..140]) ---
      { x: 20, y: 140, w: 60, h: 16 },
      { x: 140, y: 140, w: 80, h: 16 },
      { x: 220, y: 20, w: 16, h: 30 },
      { x: 220, y: 110, w: 16, h: 46 },

      // --- DZIEKANAT (Prawy górny: [580..780] x [20..140]) ---
      { x: 580, y: 20, w: 16, h: 30 },
      { x: 580, y: 110, w: 16, h: 46 },
      { x: 580, y: 140, w: 60, h: 16 },
      { x: 700, y: 140, w: 80, h: 16 },

      // --- BIBLIOTEKA (Lewy dolny: [20..220] x [400..520]) ---
      { x: 20, y: 384, w: 60, h: 16 },
      { x: 140, y: 384, w: 80, h: 16 },
      { x: 220, y: 384, w: 16, h: 46 },
      { x: 220, y: 490, w: 16, h: 30 },

      // --- LAB KOMPUTEROWY (Prawy dolny: [580..780] x [400..520]) ---
      { x: 580, y: 384, w: 60, h: 16 },
      { x: 700, y: 384, w: 80, h: 16 },
      { x: 580, y: 384, w: 16, h: 46 },
      { x: 580, y: 490, w: 16, h: 30 },

      // --- Wewnętrzne filary korytarzowe ---
      { x: 236, y: 245, w: 18, h: 50 },
      { x: CANVAS_WIDTH - 254, y: 245, w: 18, h: 50 }
    ],
    pillars: [
      { x: 236, y: 245, w: 18, h: 50 },
      { x: CANVAS_WIDTH - 254, y: 245, w: 18, h: 50 }
    ],
    rooms: [
      { id: 'aula', name: "Aula A", x: 20, y: 20, w: 200, h: 120, labelX: 120, labelY: 70, icon: "🏛️", info: "Złote ECTS (+3)" },
      { id: 'dean', name: "Dziekanat", x: CANVAS_WIDTH - 220, y: 20, w: 200, h: 120, labelX: CANVAS_WIDTH - 120, labelY: 70, icon: "📋", info: "Kolejka (Podanie)" },
      { id: 'library', name: "Biblioteka", x: 20, y: CANVAS_HEIGHT - 140, w: 200, h: 120, labelX: 120, labelY: CANVAS_HEIGHT - 75, icon: "📚", info: "Strefa Ciszy (Brak sprintu)" },
      { id: 'lab', name: "Lab Komputerowy", x: CANVAS_WIDTH - 220, y: CANVAS_HEIGHT - 140, w: 200, h: 120, labelX: CANVAS_WIDTH - 120, labelY: CANVAS_HEIGHT - 75, icon: "💻", info: "AI Gemini Hub" }
    ],
    patio: {
      name: "Patio ALK 🌿",
      x: 270,
      y: 160,
      w: 260,
      h: 220,
      isAtrium: false
    },
    bushes: [
      { id: 1, x: 315, y: 205, radius: 20, cooldown: 0, kind: 'bush' },
      { id: 2, x: 485, y: 205, radius: 20, cooldown: 0, kind: 'bush' },
      { id: 3, x: 315, y: 335, radius: 20, cooldown: 0, kind: 'bush' },
      { id: 4, x: 485, y: 335, radius: 20, cooldown: 0, kind: 'bush' }
    ],
    playerStart: { x: 90, y: 270 },
    examinerStart: { x: 710, y: 270 },
    instructorSpawns: [
      { x: 110, y: 155 },
      { x: 670, y: 155 },
      { x: 110, y: 370 },
      { x: 670, y: 370 }
    ],
    deanClerkStart: { x: 250, y: 140 },
    deanClerkPatrol: [
      { x: 550, y: 140 },
      { x: 550, y: 400 },
      { x: 250, y: 400 },
      { x: 250, y: 140 }
    ],
    deanClerkFinalPatrol: [
      { x: 630, y: 80 },
      { x: 675, y: 115 },
      { x: 690, y: 75 },
      { x: 640, y: 115 }
    ],
    securityGuardStart: { x: 545, y: 425 },
    securityGuardPatrolIndex: 5,
    securityGuardPatrol: [
      { x: 255, y: 115 },
      { x: 545, y: 115 },
      { x: 555, y: 205 },
      { x: 555, y: 335 },
      { x: 545, y: 425 },
      { x: 255, y: 425 },
      { x: 245, y: 335 },
      { x: 245, y: 205 }
    ],
    rectorStart: { x: 35, y: 270 },
    rectorPatrol: [
      { x: 250, y: 270 },
      { x: 400, y: 270 },
      { x: 545, y: 205 },
      { x: 545, y: 345 },
      { x: 400, y: 415 },
      { x: 255, y: 345 },
      { x: 255, y: 120 },
      { x: 40, y: 270 }
    ],
    bossStart: { x: 540, y: 115 },
    finalTarget: { x: 740, y: 65, w: 40, h: 40 },
    lights: {
      patioLanterns: true,
      atriumRim: false,
      libraryLamp: { x: 70, y: 448, radius: 40 },
      labGlow: { x: 680, y: 460, radius: 65 }
    }
  },

  atrium: {
    id: 'atrium',
    name: 'I piętro (Atrium)',
    icon: '🏢',
    floorTheme: 'atrium',
    logoPos: { x: 655, y: 92 },
    hideNoun: 'w donicy',
    hideHudLabel: '🪴 Ukryty w donicy (5s do kichnięcia)',
    goldenAulaName: 'Auli B',
    walls: [
      { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
      { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },

      // --- AULA B (Góra środek: [290..510] x [20..120], 2 wyjścia po bokach po 68 px) ---
      { x: 274, y: 20, w: 16, h: 16 },
      { x: 274, y: 104, w: 16, h: 32 },
      { x: 510, y: 20, w: 16, h: 16 },
      { x: 510, y: 104, w: 16, h: 32 },
      { x: 290, y: 120, w: 220, h: 16 },

      // --- DZIEKANAT (Dół środek: [300..500] x [420..520], 2 wyjścia: góra 60 px i prawo 70 px) ---
      { x: 284, y: 404, w: 86, h: 16 },
      { x: 430, y: 404, w: 86, h: 16 },
      { x: 284, y: 420, w: 16, h: 100 },
      { x: 500, y: 420, w: 16, h: 10 },
      { x: 500, y: 500, w: 16, h: 20 },

      // --- CZYTELNIA (Lewy środek: [20..170] x [185..355], 2 wyjścia: góra i dół po 60 px) ---
      { x: 20, y: 169, w: 46, h: 16 },
      { x: 126, y: 169, w: 60, h: 16 },
      { x: 20, y: 355, w: 46, h: 16 },
      { x: 126, y: 355, w: 60, h: 16 },
      { x: 170, y: 185, w: 16, h: 170 },

      // --- SALA KOMPUTEROWA 2 (Prawy środek: [630..780] x [185..355], 2 wyjścia: góra i dół po 60 px) ---
      { x: 614, y: 169, w: 60, h: 16 },
      { x: 734, y: 169, w: 46, h: 16 },
      { x: 614, y: 355, w: 60, h: 16 },
      { x: 734, y: 355, w: 46, h: 16 },
      { x: 614, y: 185, w: 16, h: 170 },

      // --- SZKLANA BALUSTRADA ATRIUM (otwarta pustka nad Patio, nie da się wejść) ---
      { x: 274, y: 214, w: 252, h: 112, kind: 'atrium' }
    ],
    pillars: [],
    rooms: [
      { id: 'aula', name: "Aula B", x: 290, y: 20, w: 220, h: 100, labelX: 400, labelY: 66, icon: "🏛️", info: "Złote ECTS (+3)" },
      { id: 'dean', name: "Dziekanat", x: 300, y: 420, w: 200, h: 100, labelX: 422, labelY: 454, icon: "📋", info: "Kolejka (Podanie)" },
      { id: 'library', name: "Czytelnia", x: 20, y: 185, w: 150, h: 170, labelX: 95, labelY: 266, icon: "📚", info: "Strefa Ciszy (Brak sprintu)" },
      { id: 'lab', name: "Sala komputerowa 2", x: 630, y: 185, w: 150, h: 170, labelX: 705, labelY: 266, icon: "💻", info: "AI Gemini Hub" }
    ],
    patio: {
      name: "Atrium · Widok na Patio 🏢",
      x: 274,
      y: 214,
      w: 252,
      h: 112,
      isAtrium: true
    },
    bushes: [
      { id: 1, x: 248, y: 192, radius: 20, cooldown: 0, kind: 'ficus' },
      { id: 2, x: 552, y: 192, radius: 20, cooldown: 0, kind: 'ficus' },
      { id: 3, x: 248, y: 348, radius: 20, cooldown: 0, kind: 'ficus' },
      { id: 4, x: 552, y: 348, radius: 20, cooldown: 0, kind: 'ficus' }
    ],
    playerStart: { x: 140, y: 100 },
    examinerStart: { x: 670, y: 455 },
    instructorSpawns: [
      { x: 250, y: 70 },
      { x: 400, y: 386 },
      { x: 96, y: 148 },
      { x: 704, y: 148 }
    ],
    deanClerkStart: { x: 230, y: 175 },
    deanClerkPatrol: [
      { x: 570, y: 175 },
      { x: 570, y: 365 },
      { x: 230, y: 365 },
      { x: 230, y: 175 }
    ],
    deanClerkFinalPatrol: [
      { x: 400, y: 386 },
      { x: 545, y: 465 },
      { x: 452, y: 465 },
      { x: 545, y: 390 }
    ],
    securityGuardStart: { x: 575, y: 365 },
    securityGuardPatrolIndex: 0,
    securityGuardPatrol: [
      { x: 215, y: 165 },
      { x: 585, y: 165 },
      { x: 585, y: 375 },
      { x: 570, y: 465 },
      { x: 230, y: 465 },
      { x: 215, y: 375 }
    ],
    rectorStart: { x: 215, y: 95 },
    rectorPatrol: [
      { x: 220, y: 175 },
      { x: 570, y: 175 },
      { x: 570, y: 365 },
      { x: 220, y: 365 },
      { x: 140, y: 445 },
      { x: 220, y: 175 }
    ],
    bossStart: { x: 570, y: 365 },
    finalTarget: { x: 342, y: 480, w: 40, h: 40 },
    lights: {
      patioLanterns: false,
      atriumRim: true,
      libraryLamp: { x: 65, y: 228, radius: 42 },
      labGlow: { x: 705, y: 270, radius: 62 }
    }
  }
};

// =========================================================================
// SYSTEM POGODY: aktualna pogoda przy ALK (Open-Meteo, bez klucza API)
// albo pogoda wybrana ręcznie. Każda pogoda zmienia zasady rozgrywki.
// =========================================================================
const ALK_COORDS = { lat: 52.2697, lon: 21.0297 }; // ul. Jagiellońska 57/59, Warszawa
const WEATHER_API_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${ALK_COORDS.lat}&longitude=${ALK_COORDS.lon}` +
  '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day' +
  '&timezone=Europe%2FWarsaw&wind_speed_unit=kmh';
const WEATHER_CACHE_KEY = 'kozminski_weather_cache';
const WEATHER_MODE_KEY = 'kozminski_weather_mode';
const WEATHER_CACHE_MS = 15 * 60 * 1000; // odczyt pogody ważny 15 minut
const FOG_SIGHT = 170; // w mgle wykładowcy widzą studenta tylko z bliska (px)

const WEATHER_TYPES = {
  sunny: {
    id: 'sunny', icon: '☀️', nightIcon: '🌙', name: 'Słonecznie', nightName: 'Bezchmurna noc', chip: 'Słońce',
    effects: [
      '🔋 Stamina odnawia się o 35% szybciej',
      '⚠️ Wykładowcy też są w formie: +5% prędkości'
    ],
    playerSpeed: 1, enemySpeed: 1.05, staminaDrain: 1, staminaRegen: 1.35, scoreMul: 1
  },
  cloudy: {
    id: 'cloudy', icon: '☁️', name: 'Pochmurno', chip: 'Pochmurno',
    effects: [
      '⚖️ Zwykła pogoda: klasyczne zasady, bez modyfikatorów'
    ],
    playerSpeed: 1, enemySpeed: 1, staminaDrain: 1, staminaRegen: 1, scoreMul: 1
  },
  rain: {
    id: 'rain', icon: '🌧️', name: 'Deszcz', chip: 'Deszcz',
    effects: [
      '💧 Kałuże na korytarzach i Patio: w kałuży każdy zwalnia o 40% (wykładowcy też!)',
      '👟 Mokre buty: sprint zużywa o 15% więcej staminy',
      '🏛️ W salach jest sucho'
    ],
    playerSpeed: 1, enemySpeed: 1, staminaDrain: 1.15, staminaRegen: 1, scoreMul: 1.15, puddles: 7
  },
  storm: {
    id: 'storm', icon: '⛈️', name: 'Burza', chip: 'Burza',
    effects: [
      '⚡ Żółty krąg = za chwilę uderzy tam piorun: porażony wykładowca stoi 2,5 s, a Ty 1,2 s',
      '🎯 Zwab wykładowcę pod piorun, a sam zdąż uciec!',
      '💧 Kałuże spowalniają o 40% · 🔌 częstsze awarie prądu'
    ],
    playerSpeed: 1, enemySpeed: 1, staminaDrain: 1.15, staminaRegen: 1, scoreMul: 1.3, puddles: 8, lightning: true
  },
  snow: {
    id: 'snow', icon: '❄️', name: 'Śnieg', chip: 'Śnieg',
    effects: [
      '❄️ Zaspy spowalniają: Ty −12%, wykładowcy −18%',
      '🥶 Mróz: sprint zużywa o 25% więcej staminy',
      '👣 Zostawiasz ślady na śniegu'
    ],
    playerSpeed: 0.88, enemySpeed: 0.82, staminaDrain: 1.25, staminaRegen: 1, scoreMul: 1.2, footprints: true
  },
  fog: {
    id: 'fog', icon: '🌫️', name: 'Mgła', chip: 'Mgła',
    effects: [
      '🌫️ Widzisz tylko najbliższą okolicę',
      '🕵️ Wykładowcy z daleka też Cię nie widzą: gonią miejsce, w którym byłeś chwilę temu'
    ],
    playerSpeed: 1, enemySpeed: 1, staminaDrain: 1, staminaRegen: 1, scoreMul: 1.25, fog: true
  },
  wind: {
    id: 'wind', icon: '💨', name: 'Wichura', chip: 'Wichura',
    effects: [
      '💨 Wiatr spycha Cię w jedną stronę: z wiatrem biegniesz szybciej, pod wiatr wolniej',
      '🌪️ Co kilka sekund mocniejszy podmuch · w salach nie wieje',
      '🍂 Wykładowcy idący pod wiatr też zwalniają'
    ],
    playerSpeed: 1, enemySpeed: 1, staminaDrain: 1, staminaRegen: 1, scoreMul: 1.15, wind: true
  }
};
const WEATHER_ORDER = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'wind'];

// Pora dnia (na żywo przy ALK albo wybrana ręcznie)
const DAYTIME_MODE_KEY = 'kozminski_daytime_mode';
const NIGHT_SIGHT_NEAR = 90; // w nocy wykładowca zawsze widzi studenta z bliska (px)
const NIGHT_SIGHT_CONE = 240; // ...a dalej tylko w snopie swojej latarki (px)
const NIGHT_CONE_HALF = 0.5; // połowa kąta snopu latarki (radiany)
const NIGHT_SCORE_MUL = 1.1; // premia punktowa za grę nocą
const NIGHT_EFFECT_TEXT = '🌙 Noc: kampus jest ciemny, a wykładowcy chodzą z latarkami: z daleka widzą Cię tylko w snopie światła';

// Data do kalendarza (do podglądu można dopisać do adresu np. ?data=2026-12-24)
function getCalendarDate() {
  try {
    const param = new URLSearchParams(window.location.search).get('data');
    if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
      const d = new Date(`${param}T12:00:00`);
      if (!Number.isNaN(d.getTime())) return d;
    }
  } catch {}
  return new Date();
}

// Przybliżony kalendarz akademicki ALK → status w HUD, opis na ekranie startowym i dekoracje
function getAcademicCalendar(date = new Date()) {
  const md = (date.getMonth() + 1) * 100 + date.getDate(); // np. 24 grudnia → 1224
  let status;
  let story;
  if (md >= 1221 || md <= 106) {
    status = 'Przerwa świąteczna';
    story = 'Przerwa świąteczna na Koźmińskim, a egzaminator i tak ma dyżur!';
  } else if (md <= 125) {
    status = 'Ostatnie zajęcia przed sesją';
    story = 'Ostatnie zajęcia przed sesją zimową na Koźmińskim!';
  } else if (md <= 220) {
    status = 'Sesja zimowa trwa';
    story = 'Sesja zimowa na Koźmińskim w pełni!';
  } else if (md <= 531) {
    status = 'Semestr letni trwa';
    story = 'Semestr letni na Koźmińskim w pełni!';
  } else if (md <= 710) {
    status = 'Sesja letnia trwa';
    story = 'Sesja letnia na Koźmińskim w pełni!';
  } else if (md <= 831) {
    status = 'Wakacje… a Ty na kampusie?';
    story = 'Wakacje! Kampus prawie pusty… prawie, bo egzaminator wciąż tu jest!';
  } else if (md <= 920) {
    status = 'Sesja poprawkowa trwa';
    story = 'Wrześniowa sesja poprawkowa na Koźmińskim!';
  } else if (md <= 930) {
    status = 'Inauguracja roku tuż-tuż';
    story = 'Inauguracja roku akademickiego tuż-tuż!';
  } else {
    status = 'Semestr zimowy trwa';
    story = 'Semestr zimowy na Koźmińskim w pełni!';
  }
  let decor = null;
  if (md >= 1201 || md <= 106) decor = 'xmas';
  else if (md >= 1024 && md <= 1102) decor = 'halloween';
  return { status, story, decor };
}

// Kody pogody WMO (Open-Meteo) → typ pogody w grze
function weatherTypeFromCode(code, windKmh = 0, gustKmh = 0) {
  let type = 'cloudy';
  if (code === 0 || code === 1) type = 'sunny';
  else if (code === 2 || code === 3) type = 'cloudy';
  else if (code === 45 || code === 48) type = 'fog';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) type = 'rain';
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) type = 'snow';
  else if (code >= 95) type = 'storm';
  if ((type === 'sunny' || type === 'cloudy') && (windKmh >= 35 || gustKmh >= 60)) type = 'wind';
  return type;
}

function formatWeatherMul(mul) {
  return `×${Number(mul).toLocaleString('pl-PL', { maximumFractionDigits: 2 })}`;
}

class WeatherSystem {
  constructor(game) {
    this.game = game;
    this.mode = 'live'; // 'live' albo id pogody wybranej ręcznie
    this.live = null; // ostatni odczyt pogody spod ALK
    this.liveStatus = 'idle'; // 'idle' | 'loading' | 'ok' | 'stale' | 'error'
    this.fetching = false;
    this.type = 'cloudy';
    this.isNight = false;
    this.windAngle = 0; // kierunek, W KTÓRYM wieje wiatr (radiany, układ canvasu)
    this.time = 0;

    this.drops = [];
    this.splashes = [];
    this.flakes = [];
    this.leaves = [];
    this.streaks = [];
    this.clouds = [];
    this.fogBlobs = [];
    this.puddles = [];
    this.ripples = [];
    this.footprints = [];
    this.snowCover = [];
    this.lightning = null;
    this.lightningTimer = 6;
    this.bolt = null;
    this.boltTimer = 0;
    this.flashTimer = 0;
    this.gustTimer = 6;
    this.gustActive = 0;
    this.footDist = 0;
    this.footSide = 1;
    this.lastPlayerPos = null;
    this.rippleTimer = 0;

    this.ui = {};
    this.ambience = null;
    this.daytimeMode = 'live'; // 'live' | 'day' | 'night'
    this.night = false;
    this.nightLayer = null;
    this.calendar = getAcademicCalendar(getCalendarDate());

    this.loadMode();
    this.loadDaytimeMode();
    this.loadCache();
    this.resolveType();
    this.resetEffects();

    // Dźwięk otoczenia (deszcz / wiatr) wycisza się automatycznie poza rozgrywką
    this.ambienceInterval = setInterval(() => this.syncAmbience(), 200);
    // Odświeżanie pogody na żywo co 5 minut (tylko poza rozgrywką)
    this.refreshInterval = setInterval(() => {
      if ((this.mode === 'live' || this.daytimeMode === 'live') && !this.isInGame()) this.fetchLive();
    }, 5 * 60 * 1000);
  }

  get def() {
    return WEATHER_TYPES[this.type] || WEATHER_TYPES.cloudy;
  }

  isInGame() {
    const s = this.game.state;
    return s === 'PLAYING' || s === 'PAUSED' || s === 'COUNTDOWN';
  }

  // ---------------------------------------------------------------------
  // Tryb pogody i pobieranie danych
  // ---------------------------------------------------------------------
  loadMode() {
    try {
      const saved = localStorage.getItem(WEATHER_MODE_KEY);
      if (saved && (saved === 'live' || WEATHER_TYPES[saved])) this.mode = saved;
    } catch {}
  }

  saveMode() {
    try {
      localStorage.setItem(WEATHER_MODE_KEY, this.mode);
    } catch {}
  }

  setMode(mode) {
    if (mode !== 'live' && !WEATHER_TYPES[mode]) return;
    this.mode = mode;
    this.saveMode();
    this.resolveType();
    this.resetEffects();
    if (mode === 'live') this.fetchLive();
    this.notify();
    if (this.game.state !== 'PLAYING') this.game.render();
  }

  loadCache() {
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data.code === 'number' && typeof data.fetchedAt === 'number') {
        data.type = weatherTypeFromCode(data.code, data.wind, data.gust);
        this.live = data;
        this.liveStatus = Date.now() - data.fetchedAt < WEATHER_CACHE_MS ? 'ok' : 'stale';
      }
    } catch {}
  }

  async fetchLive(force = false) {
    if (this.fetching) return;
    if (!force && this.live && this.liveStatus === 'ok' && Date.now() - this.live.fetchedAt < WEATHER_CACHE_MS) return;
    this.fetching = true;
    if (!this.live) {
      this.liveStatus = 'loading';
      this.notify();
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = setTimeout(() => {
      if (controller) controller.abort();
    }, 7000);
    try {
      const resp = await fetch(WEATHER_API_URL, controller ? { signal: controller.signal } : undefined);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const c = json && json.current;
      if (!c || typeof c.weather_code !== 'number') throw new Error('Brak danych pogodowych');
      this.live = {
        code: c.weather_code,
        temp: Number(c.temperature_2m),
        feels: Number(c.apparent_temperature),
        wind: Number(c.wind_speed_10m) || 0,
        gust: Number(c.wind_gusts_10m) || 0,
        windDir: Number(c.wind_direction_10m) || 0,
        isDay: c.is_day === 1,
        time: typeof c.time === 'string' ? c.time : '',
        fetchedAt: Date.now()
      };
      this.live.type = weatherTypeFromCode(this.live.code, this.live.wind, this.live.gust);
      this.liveStatus = 'ok';
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(this.live));
      } catch {}
    } catch (err) {
      this.liveStatus = this.live ? 'stale' : 'error';
      console.warn('[Pogoda] Nie udało się pobrać pogody spod ALK:', err && err.message ? err.message : err);
    } finally {
      clearTimeout(timeout);
      this.fetching = false;
    }

    // Pogoda nie zmienia się w trakcie trwającej sesji — nowa obowiązuje od następnej gry
    if ((this.mode === 'live' || this.daytimeMode === 'live') && !this.isInGame()) {
      this.resolveType();
      this.resetEffects();
      this.game.render();
    }
    this.notify();
  }

  resolveType() {
    if (this.mode === 'live') {
      if (this.live && this.live.type) {
        this.type = this.live.type;
        // Open-Meteo podaje, SKĄD wieje wiatr (0° = z północy) — wiatr pcha w przeciwną stronę
        const toRad = (((this.live.windDir || 0) + 180) % 360) * Math.PI / 180;
        this.windAngle = Math.atan2(-Math.cos(toRad), Math.sin(toRad));
      } else {
        this.type = 'cloudy';
      }
    } else {
      this.type = this.mode;
      this.windAngle = Math.floor(Math.random() * 8) * (Math.PI / 4);
    }
    this.resolveDaytime();
    this.isNight = this.night;
  }

  // Pora dnia: na żywo (dzień / noc przy ALK) albo wybrana ręcznie
  resolveDaytime() {
    if (this.daytimeMode === 'day') {
      this.night = false;
    } else if (this.daytimeMode === 'night') {
      this.night = true;
    } else if (this.live && typeof this.live.isDay === 'boolean' && Date.now() - this.live.fetchedAt < 3 * 60 * 60 * 1000) {
      this.night = !this.live.isDay;
    } else {
      const hour = new Date().getHours();
      this.night = hour < 7 || hour >= 17;
    }
    this.calendar = getAcademicCalendar(getCalendarDate());
  }

  loadDaytimeMode() {
    try {
      const saved = localStorage.getItem(DAYTIME_MODE_KEY);
      if (saved === 'live' || saved === 'day' || saved === 'night') this.daytimeMode = saved;
    } catch {}
  }

  setDaytimeMode(mode) {
    if (mode !== 'live' && mode !== 'day' && mode !== 'night') return;
    this.daytimeMode = mode;
    try {
      localStorage.setItem(DAYTIME_MODE_KEY, mode);
    } catch {}
    this.resolveDaytime();
    this.isNight = this.night;
    if (mode === 'live') this.fetchLive();
    this.notify();
    if (this.game.state !== 'PLAYING') this.game.render();
  }

  // Wywoływane przy starcie każdej gry (nowe kałuże, nowy kierunek wiatru itd.)
  prepareForGame() {
    this.resolveType();
    this.resetEffects();
    this.notify();
  }

  // Wywoływane po powrocie do menu
  onMenu() {
    this.resolveType();
    this.resetEffects();
    this.notify();
    if (this.mode === 'live' || this.daytimeMode === 'live') this.fetchLive();
  }

  // ---------------------------------------------------------------------
  // Przygotowanie efektów
  // ---------------------------------------------------------------------
  resetEffects() {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;
    const d = this.def;
    this.time = 0;
    this.drops = [];
    this.splashes = [];
    this.flakes = [];
    this.leaves = [];
    this.streaks = [];
    this.ripples = [];
    this.footprints = [];
    this.lightning = null;
    this.bolt = null;
    this.boltTimer = 0;
    this.flashTimer = 0;
    this.lightningTimer = 5 + Math.random() * 3;
    this.gustTimer = 5 + Math.random() * 3;
    this.gustActive = 0;
    this.footDist = 0;
    this.lastPlayerPos = null;

    if (this.type === 'rain' || this.type === 'storm') {
      const n = this.type === 'storm' ? 300 : 210;
      for (let i = 0; i < n; i++) this.drops.push(this.makeDrop(true));
    }
    if (this.type === 'snow') {
      for (let i = 0; i < 160; i++) this.flakes.push(this.makeFlake(true));
    }
    if (this.type === 'wind') {
      for (let i = 0; i < 34; i++) this.leaves.push(this.makeLeaf(true));
      for (let i = 0; i < 16; i++) this.streaks.push(this.makeStreak(true));
    }

    this.clouds = [];
    if (this.type === 'cloudy' || this.type === 'rain' || this.type === 'storm') {
      for (let i = 0; i < 5; i++) {
        this.clouds.push({ x: Math.random() * W, y: Math.random() * H, r: 100 + Math.random() * 90, speed: 7 + Math.random() * 8 });
      }
    }

    this.fogBlobs = [];
    if (this.type === 'fog') {
      for (let i = 0; i < 10; i++) {
        this.fogBlobs.push({ x: Math.random() * W, y: Math.random() * H, r: 70 + Math.random() * 90, speed: 6 + Math.random() * 9, phase: Math.random() * Math.PI * 2 });
      }
    }

    this.puddles = d.puddles ? this.generatePuddles(d.puddles) : [];
    this.snowCover = this.type === 'snow' ? this.generateSnowCover() : [];
  }

  makeDrop(randomY) {
    return {
      x: Math.random() * (CANVAS_WIDTH + 160) - 120,
      y: randomY ? Math.random() * CANVAS_HEIGHT : -20 - Math.random() * 40,
      len: 9 + Math.random() * 9,
      speed: 520 + Math.random() * 280
    };
  }

  makeFlake(randomY) {
    return {
      x: Math.random() * CANVAS_WIDTH,
      y: randomY ? Math.random() * CANVAS_HEIGHT : -10,
      r: 1 + Math.random() * 2.2,
      speed: 22 + Math.random() * 38,
      sway: Math.random() * Math.PI * 2
    };
  }

  makeLeaf(randomPos) {
    const colors = ['#d97706', '#b45309', '#facc15', '#a16207', '#f8fafc', '#e2e8f0'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      ...this.spawnOnUpwindEdge(randomPos),
      size: 3 + Math.random() * 3,
      speed: 120 + Math.random() * 120,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8,
      wobble: Math.random() * Math.PI * 2,
      paper: color === '#f8fafc' || color === '#e2e8f0',
      color
    };
  }

  makeStreak(randomPos) {
    return {
      ...this.spawnOnUpwindEdge(randomPos),
      len: 30 + Math.random() * 50,
      speed: 380 + Math.random() * 220
    };
  }

  // Punkt startowy po nawietrznej stronie planszy (albo losowy przy pierwszym rozmieszczeniu)
  spawnOnUpwindEdge(randomPos) {
    if (randomPos) return { x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT };
    const cx = Math.cos(this.windAngle);
    const cy = Math.sin(this.windAngle);
    if (Math.abs(cx) > Math.abs(cy)) {
      return { x: cx > 0 ? -20 : CANVAS_WIDTH + 20, y: Math.random() * CANVAS_HEIGHT };
    }
    return { x: Math.random() * CANVAS_WIDTH, y: cy > 0 ? -20 : CANVAS_HEIGHT + 20 };
  }

  isInsideRoom(x, y, margin = 0) {
    const rooms = this.game.rooms || [];
    return rooms.some(r => x > r.x - margin && x < r.x + r.w + margin && y > r.y - margin && y < r.y + r.h + margin);
  }

  generatePuddles(count) {
    const g = this.game;
    const result = [];
    let attempts = 0;
    while (result.length < count && attempts < 500) {
      attempts++;
      const r = 20 + Math.random() * 13;
      const x = 40 + Math.random() * (CANVAS_WIDTH - 80);
      const y = 40 + Math.random() * (CANVAS_HEIGHT - 80);
      if (g.checkWallCollision(x, y, r + 6)) continue;
      if (this.isInsideRoom(x, y, 8)) continue; // w salach jest sucho
      const starts = [g.player, g.examiner].filter(Boolean);
      if (starts.some(s => Math.hypot(x - s.x, y - s.y) < 65)) continue; // nie na starcie
      if ((g.bushes || []).some(b => Math.hypot(x - b.x, y - b.y) < r + b.radius + 6)) continue;
      if (result.some(p => Math.hypot(x - p.x, y - p.y) < r + p.r + 26)) continue;
      result.push({ x, y, r, ry: r * 0.62, seed: Math.random() * 10 });
    }
    return result;
  }

  generateSnowCover() {
    const patches = [];
    for (let i = 0; i < 70; i++) {
      const x = 24 + Math.random() * (CANVAS_WIDTH - 48);
      const y = 24 + Math.random() * (CANVAS_HEIGHT - 48);
      if (this.isInsideRoom(x, y, 4)) continue;
      patches.push({ x, y, r: 10 + Math.random() * 26, a: 0.06 + Math.random() * 0.1 });
    }
    return patches;
  }

  inPuddle(x, y) {
    for (const p of this.puddles) {
      const nx = (x - p.x) / p.r;
      const ny = (y - p.y) / p.ry;
      if (nx * nx + ny * ny <= 1) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------
  // Modyfikatory rozgrywki
  // ---------------------------------------------------------------------
  playerSpeedMul() {
    const p = this.game.player;
    let mul = this.def.playerSpeed;
    if (p && this.puddles.length && this.inPuddle(p.x, p.y)) mul *= 0.6;
    return mul;
  }

  enemySpeedMul(entity) {
    let mul = this.def.enemySpeed;
    if (this.puddles.length && this.inPuddle(entity.x, entity.y)) mul *= 0.6;
    if (this.def.wind && typeof entity.angle === 'number') {
      mul *= 1 + 0.12 * Math.cos(entity.angle - this.windAngle);
    }
    return mul;
  }

  staminaDrainMul() {
    return this.def.staminaDrain;
  }

  staminaRegenMul() {
    return this.def.staminaRegen;
  }

  scoreMul() {
    return this.def.scoreMul * (this.night ? NIGHT_SCORE_MUL : 1);
  }

  // Mgła i noc: gdy wykładowca nie widzi studenta, idzie tam, gdzie widział go chwilę temu
  adjustEnemyTarget(entity, tx, ty) {
    const p = this.game.player;
    if ((!this.def.fog && !this.night) || !p) return { x: tx, y: ty };
    const dist = Math.hypot(p.x - entity.x, p.y - entity.y);
    let sees = true;
    if (this.def.fog && dist >= FOG_SIGHT) sees = false;
    if (this.night && dist >= NIGHT_SIGHT_NEAR) {
      const facing = typeof entity.angle === 'number' ? entity.angle : 0;
      const toPlayer = Math.atan2(p.y - entity.y, p.x - entity.x);
      const diff = Math.abs(Math.atan2(Math.sin(toPlayer - facing), Math.cos(toPlayer - facing)));
      if (dist >= NIGHT_SIGHT_CONE || diff > NIGHT_CONE_HALF) sees = false;
    }
    const memo = entity._fogMemo;
    if (sees || !memo || memo.t > this.time || this.time - memo.t > 1.8) {
      entity._fogMemo = { x: tx, y: ty, t: this.time };
    }
    if (sees) return { x: tx, y: ty };
    return { x: entity._fogMemo.x, y: entity._fogMemo.y };
  }

  // ---------------------------------------------------------------------
  // Aktualizacja (wywoływana w każdej klatce rozgrywki)
  // ---------------------------------------------------------------------
  update(dt) {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;
    this.time += dt;
    const gust = this.gustActive > 0 ? 2 : 1;

    // Deszcz
    if (this.drops.length) {
      const slant = this.type === 'storm' ? 170 : 90;
      for (const d of this.drops) {
        d.y += d.speed * dt;
        d.x += slant * dt * (d.speed / 600);
        if (d.y > H + 20 || d.x > W + 60) Object.assign(d, this.makeDrop(false));
      }
      const rate = this.type === 'storm' ? 55 : 35;
      const spawn = Math.floor(rate * dt + Math.random());
      for (let i = 0; i < spawn; i++) {
        this.splashes.push({ x: Math.random() * W, y: Math.random() * H, life: 0.3, maxLife: 0.3 });
      }
    }
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      this.splashes[i].life -= dt;
      if (this.splashes[i].life <= 0) this.splashes.splice(i, 1);
    }

    // Śnieg
    for (const f of this.flakes) {
      f.y += f.speed * dt;
      f.x += Math.sin(this.time * 1.4 + f.sway) * 16 * dt + 6 * dt;
      if (f.y > H + 6) Object.assign(f, this.makeFlake(false));
      if (f.x > W + 6) f.x = -6;
    }

    // Liście, kartki z notatkami i smugi wiatru
    const wx = Math.cos(this.windAngle);
    const wy = Math.sin(this.windAngle);
    for (const l of this.leaves) {
      l.wobble += dt * 3;
      l.rot += l.spin * dt;
      const sp = l.speed * gust;
      l.x += (wx * sp - wy * Math.sin(l.wobble) * 30) * dt;
      l.y += (wy * sp + wx * Math.sin(l.wobble) * 30) * dt;
      if (l.x < -40 || l.x > W + 40 || l.y < -40 || l.y > H + 40) Object.assign(l, this.makeLeaf(false));
    }
    for (const s of this.streaks) {
      s.x += wx * s.speed * gust * dt;
      s.y += wy * s.speed * gust * dt;
      if (s.x < -90 || s.x > W + 90 || s.y < -90 || s.y > H + 90) Object.assign(s, this.makeStreak(false));
    }

    // Cienie chmur i płaty mgły
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x - c.r > W) c.x = -c.r;
    }
    for (const b of this.fogBlobs) {
      b.x += b.speed * dt;
      b.phase += dt * 0.4;
      if (b.x - b.r > W) b.x = -b.r;
    }

    this.updatePlayerTraces(dt);
    this.updateLightning(dt);
    this.updateWind(dt);
  }

  // Ślady stóp na śniegu i kręgi na wodzie przy wchodzeniu w kałużę
  updatePlayerTraces(dt) {
    const p = this.game.player;
    for (let i = this.footprints.length - 1; i >= 0; i--) {
      this.footprints[i].life -= dt;
      if (this.footprints[i].life <= 0) this.footprints.splice(i, 1);
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].life -= dt;
      if (this.ripples[i].life <= 0) this.ripples.splice(i, 1);
    }
    if (!p) return;
    if (!this.lastPlayerPos) this.lastPlayerPos = { x: p.x, y: p.y };
    const moved = Math.hypot(p.x - this.lastPlayerPos.x, p.y - this.lastPlayerPos.y);
    this.lastPlayerPos = { x: p.x, y: p.y };
    if (moved < 0.05 || moved > 40) return;

    if (this.def.footprints && !p.isHidden) {
      this.footDist += moved;
      if (this.footDist > 15) {
        this.footDist = 0;
        this.footSide *= -1;
        const a = p.direction || 0;
        this.footprints.push({
          x: p.x + Math.cos(a + Math.PI / 2) * 5 * this.footSide,
          y: p.y + 10 + Math.sin(a + Math.PI / 2) * 5 * this.footSide,
          a,
          life: 7,
          maxLife: 7
        });
        if (this.footprints.length > 120) this.footprints.shift();
      }
    }

    if (this.puddles.length && this.inPuddle(p.x, p.y)) {
      this.rippleTimer -= dt;
      if (this.rippleTimer <= 0) {
        this.rippleTimer = 0.12;
        this.ripples.push({ x: p.x, y: p.y + 10, life: 0.55, maxLife: 0.55 });
        if (Math.random() < 0.6) {
          this.game.particles.push({
            x: p.x + (Math.random() - 0.5) * 14,
            y: p.y + 10,
            vx: (Math.random() - 0.5) * 60,
            vy: -30 - Math.random() * 40,
            life: 0.3,
            maxLife: 0.3,
            color: 'rgba(147, 197, 253, 0.8)',
            size: 2
          });
        }
      }
    }
  }

  updateLightning(dt) {
    if (this.boltTimer > 0) this.boltTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    const g = this.game;
    if (!this.def.lightning || !g.player) return;

    if (this.lightning) {
      this.lightning.warn -= dt;
      if (this.lightning.warn <= 0) {
        this.strikeLightning(this.lightning);
        this.lightning = null;
        this.lightningTimer = 6 + Math.random() * 5;
      }
      return;
    }

    this.lightningTimer -= dt;
    if (this.lightningTimer > 0) return;

    const enemies = this.getFlashlightCarriers();
    let tx;
    let ty;
    if (enemies.length && Math.random() < 0.35) {
      // Piorun tam, dokąd za chwilę dobiegnie wykładowca (między nim a studentem)
      const e = enemies[Math.floor(Math.random() * enemies.length)];
      const dx = g.player.x - e.x;
      const dy = g.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ahead = Math.min(dist * 0.6, (e.speed || 2) * 60 * 1.2);
      tx = e.x + (dx / dist) * ahead;
      ty = e.y + (dy / dist) * ahead;
    } else {
      const a = Math.random() * Math.PI * 2;
      const d = 20 + Math.random() * 80;
      tx = g.player.x + Math.cos(a) * d;
      ty = g.player.y + Math.sin(a) * d;
    }
    tx = Math.max(30, Math.min(CANVAS_WIDTH - 30, tx));
    ty = Math.max(30, Math.min(CANVAS_HEIGHT - 30, ty));
    this.lightning = { x: tx, y: ty, r: 58, warn: 1.5, maxWarn: 1.5 };
    this.playLightningWarning();
  }

  strikeLightning(L) {
    const g = this.game;
    // Zygzak błyskawicy od górnej krawędzi do celu
    const pts = [];
    const sx = L.x + (Math.random() - 0.5) * 160;
    const sy = -10;
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 46 * (1 - t * 0.6);
      pts.push({ x: sx + (L.x - sx) * t + jitter, y: sy + (L.y - sy) * t });
    }
    this.bolt = { pts, x: L.x, y: L.y };
    this.boltTimer = 0.35;
    this.flashTimer = 0.4;
    this.playThunder();
    g.triggerScreenShake(7, 0.35);

    for (let i = 0; i < 20; i++) {
      g.particles.push({
        x: L.x,
        y: L.y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        life: 0.45,
        maxLife: 0.45,
        color: Math.random() < 0.5 ? '#fde047' : '#ffffff',
        size: 2.5
      });
    }

    for (const e of this.getFlashlightCarriers()) {
      if (!e) continue;
      if (Math.hypot(e.x - L.x, e.y - L.y) <= L.r + (e.radius || 16) * 0.5) {
        e.freezeTimer = Math.max(e.freezeTimer || 0, 2.5);
        e.path = [];
        g.addFloatingText('⚡ Porażony piorunem!', e.x, e.y - 32, '#fde047');
      }
    }

    const p = g.player;
    if (p && !p.isHidden && p.immunityTimer <= 0 && Math.hypot(p.x - L.x, p.y - L.y) <= L.r + p.radius * 0.5) {
      p.stunTimer = Math.max(p.stunTimer || 0, 1.2);
      g.addFloatingText('⚡ Trafił Cię piorun!', p.x, p.y - 28, '#fde047');
      soundSystem.play('stun');
    }
  }

  updateWind(dt) {
    const g = this.game;
    if (!this.def.wind || !g.player) return;
    if (this.gustActive > 0) {
      this.gustActive -= dt;
    } else {
      this.gustTimer -= dt;
      if (this.gustTimer <= 0) {
        this.gustActive = 1.1;
        this.gustTimer = 6 + Math.random() * 4;
        if (!this.isInsideRoom(g.player.x, g.player.y)) {
          g.addFloatingText('💨 Podmuch!', g.player.x, g.player.y - 30, '#e2e8f0');
        }
      }
    }
    const p = g.player;
    if (p.isHidden || p.stunTimer > 0) return;
    if (this.isInsideRoom(p.x, p.y)) return; // w salach nie wieje
    const force = (this.gustActive > 0 ? 1.35 : 0.5) * dt * 60;
    const vx = Math.cos(this.windAngle) * force;
    const vy = Math.sin(this.windAngle) * force;
    if (!g.checkWallCollision(p.x + vx, p.y, p.radius)) p.x += vx;
    if (!g.checkWallCollision(p.x, p.y + vy, p.radius)) p.y += vy;
  }

  // ---------------------------------------------------------------------
  // Rysowanie
  // ---------------------------------------------------------------------
  // Warstwa podłoża: cienie chmur, śnieg, ślady, kałuże (pod postaciami)
  renderGround(ctx) {
    this.renderDecor(ctx);
    if (this.clouds.length) {
      ctx.save();
      const alpha = this.type === 'cloudy' ? 0.2 : 0.14;
      for (const c of this.clouds) {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        grad.addColorStop(0, `rgba(2, 6, 23, ${alpha})`);
        grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.snowCover.length) {
      ctx.save();
      for (const s of this.snowCover) {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        grad.addColorStop(0, `rgba(241, 245, 255, ${s.a * 1.6})`);
        grad.addColorStop(1, 'rgba(241, 245, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.footprints.length) {
      ctx.save();
      for (const f of this.footprints) {
        ctx.globalAlpha = Math.min(1, f.life / f.maxLife * 1.4) * 0.5;
        ctx.fillStyle = '#94a3b8';
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    for (const p of this.puddles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, p.ry / p.r);
      const grad = ctx.createRadialGradient(0, 0, p.r * 0.15, 0, 0, p.r);
      grad.addColorStop(0, 'rgba(59, 130, 200, 0.6)');
      grad.addColorStop(0.75, 'rgba(37, 99, 170, 0.48)');
      grad.addColorStop(1, 'rgba(30, 64, 120, 0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(-p.r * 0.2, -p.r * 0.25, p.r * 0.5, Math.PI * 1.1, Math.PI * 1.55);
      ctx.stroke();
      // Kręgi od kropli deszczu
      for (let k = 0; k < 2; k++) {
        const t = (this.time * 0.9 + p.seed + k * 0.5) % 1;
        const ox = Math.sin(p.seed * 3 + k * 2.1) * p.r * 0.35;
        const oy = Math.cos(p.seed * 2 + k * 1.7) * p.r * 0.3;
        ctx.strokeStyle = `rgba(191, 219, 254, ${0.55 * (1 - t)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox, oy, 2 + t * p.r * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.ripples.length) {
      ctx.save();
      for (const r of this.ripples) {
        const t = 1 - r.life / r.maxLife;
        ctx.strokeStyle = `rgba(191, 219, 254, ${0.7 * (1 - t)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 4 + t * 16, (4 + t * 16) * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Warstwa nieba: opady, wiatr, mgła i ostrzeżenie przed piorunem (nad postaciami)
  renderSky(ctx) {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;

    // Barwa powietrza
    ctx.save();
    if (this.type === 'sunny' && !this.isNight) {
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(W * 0.88, -60, 10, W * 0.88, -60, W * 0.95);
      grad.addColorStop(0, 'rgba(255, 214, 120, 0.26)');
      grad.addColorStop(0.45, 'rgba(255, 190, 90, 0.08)');
      grad.addColorStop(1, 'rgba(255, 190, 90, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Delikatne promienie słońca
      ctx.translate(W * 0.88, -60);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.55 + i * 0.13 + Math.sin(this.time * 0.3 + i) * 0.02;
        ctx.fillStyle = `rgba(255, 220, 140, ${0.035 + 0.015 * Math.sin(this.time * 0.8 + i * 1.7)})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.035) * 900, Math.sin(a - 0.035) * 900);
        ctx.lineTo(Math.cos(a + 0.035) * 900, Math.sin(a + 0.035) * 900);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.type === 'storm') {
      ctx.fillStyle = 'rgba(6, 8, 28, 0.24)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.type === 'rain') {
      ctx.fillStyle = 'rgba(15, 30, 60, 0.14)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.type === 'snow') {
      ctx.fillStyle = 'rgba(210, 225, 255, 0.07)';
      ctx.fillRect(0, 0, W, H);
    } else if (this.type === 'cloudy') {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Rozbryzgi kropli na ziemi
    if (this.splashes.length) {
      ctx.save();
      ctx.lineWidth = 1;
      for (const s of this.splashes) {
        const t = 1 - s.life / s.maxLife;
        ctx.strokeStyle = `rgba(186, 215, 255, ${0.45 * (1 - t)})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 1.5 + t * 5, (1.5 + t * 5) * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Deszcz
    if (this.drops.length) {
      ctx.save();
      const slant = (this.type === 'storm' ? 170 : 90) / 600;
      ctx.strokeStyle = this.type === 'storm' ? 'rgba(190, 215, 255, 0.5)' : 'rgba(174, 205, 245, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant * d.len, d.y - d.len);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Śnieg
    if (this.flakes.length) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      for (const f of this.flakes) {
        ctx.moveTo(f.x + f.r, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }

    // Wichura: smugi powietrza, liście i kartki z notatkami
    if (this.streaks.length) {
      ctx.save();
      const wx = Math.cos(this.windAngle);
      const wy = Math.sin(this.windAngle);
      ctx.strokeStyle = `rgba(226, 232, 240, ${this.gustActive > 0 ? 0.32 : 0.16})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const s of this.streaks) {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - wx * s.len, s.y - wy * s.len);
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const l of this.leaves) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.fillStyle = l.color;
      ctx.globalAlpha = 0.85;
      if (l.paper) {
        ctx.fillRect(-l.size, -l.size * 0.7, l.size * 2, l.size * 1.4);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(-l.size * 0.7, -l.size * 0.25, l.size * 1.4, 0.8);
        ctx.fillRect(-l.size * 0.7, l.size * 0.2, l.size * 1.1, 0.8);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Mgła: widoczna tylko najbliższa okolica studenta
    if (this.def.fog) {
      ctx.save();
      for (const b of this.fogBlobs) {
        const r = b.r * (1 + Math.sin(b.phase) * 0.12);
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        grad.addColorStop(0, 'rgba(203, 213, 225, 0.2)');
        grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const p = this.game.player;
      if (p) {
        const grad = ctx.createRadialGradient(p.x, p.y, 60, p.x, p.y, 230);
        grad.addColorStop(0, 'rgba(100, 116, 139, 0)');
        grad.addColorStop(0.5, 'rgba(100, 116, 139, 0.6)');
        grad.addColorStop(1, 'rgba(94, 108, 130, 0.93)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      }
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

  }

  // Ostrzeżenie: tu za chwilę uderzy piorun (rysowane nad nocą i awarią prądu)
  renderLightningWarning(ctx) {
    if (this.lightning) {
      const L = this.lightning;
      const progress = 1 - L.warn / L.maxWarn;
      const pulse = 0.5 + 0.5 * Math.sin(this.time * (10 + progress * 18));
      ctx.save();
      ctx.fillStyle = `rgba(250, 204, 21, ${0.16 + 0.16 * pulse})`;
      ctx.beginPath();
      ctx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = -this.time * 30;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.65 + 0.3 * pulse})`;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(L.x, L.y, L.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', L.x, L.y);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------
  // Noc: ciemny kampus, latarnie i latarki wykładowców
  // ---------------------------------------------------------------------
  getFlashlightCarriers() {
    const g = this.game;
    const list = [g.examiner, g.instructor, g.deanClerk, g.securityGuard, g.boss];
    return list.filter((e, i) => e && typeof e.x === 'number' && list.indexOf(e) === i);
  }

  renderNight(ctx) {
    if (!this.night) return;
    const g = this.game;
    const canvas = g.canvas;
    if (!canvas) return;
    if (!this.nightLayer) this.nightLayer = document.createElement('canvas');
    const layer = this.nightLayer;
    if (layer.width !== canvas.width || layer.height !== canvas.height) {
      layer.width = canvas.width;
      layer.height = canvas.height;
    }
    const lctx = layer.getContext('2d');
    const scale = canvas.width / CANVAS_WIDTH;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, layer.width, layer.height);
    lctx.setTransform(scale, 0, 0, scale, 0, 0);
    lctx.fillStyle = 'rgba(3, 7, 24, 0.72)';
    lctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Światła wycinane tylko w warstwie ciemności
    lctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, strength) => {
      const grad = lctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
      grad.addColorStop(0.55, `rgba(0, 0, 0, ${strength * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(x, y, r, 0, Math.PI * 2);
      lctx.fill();
    };
    if (g.player) hole(g.player.x, g.player.y, 100, 0.95); // ekran telefonu studenta
    if (g.patio) {
      const { x, y, w, h } = g.patio;
      [[x + 18, y + 18], [x + w - 18, y + 18], [x + 18, y + h - 18], [x + w - 18, y + h - 18]]
        .forEach(([lx, ly]) => hole(lx, ly, 75, 0.85)); // latarnie na Patio
    }
    for (const r of g.rooms || []) {
      if (typeof r.labelX === 'number') hole(r.labelX, r.labelY, 65, 0.5); // lampy w salach
    }
    const carriers = this.getFlashlightCarriers();
    for (const e of carriers) {
      const a = typeof e.angle === 'number' ? e.angle : 0;
      const grad = lctx.createRadialGradient(e.x, e.y, 8, e.x, e.y, NIGHT_SIGHT_CONE);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.moveTo(e.x, e.y);
      lctx.arc(e.x, e.y, NIGHT_SIGHT_CONE, a - NIGHT_CONE_HALF, a + NIGHT_CONE_HALF);
      lctx.closePath();
      lctx.fill();
      hole(e.x, e.y, 34, 0.7);
    }
    lctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.drawImage(layer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Ciepła poświata snopów latarek: widać, gdzie patrzą wykładowcy
    ctx.globalCompositeOperation = 'lighter';
    for (const e of carriers) {
      const a = typeof e.angle === 'number' ? e.angle : 0;
      const grad = ctx.createRadialGradient(e.x, e.y, 10, e.x, e.y, NIGHT_SIGHT_CONE);
      grad.addColorStop(0, 'rgba(255, 228, 150, 0.2)');
      grad.addColorStop(1, 'rgba(255, 228, 150, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, NIGHT_SIGHT_CONE, a - NIGHT_CONE_HALF, a + NIGHT_CONE_HALF);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  // Kalendarz: dekoracje kampusu (grudzień i Halloween)
  // ---------------------------------------------------------------------
  renderDecor(ctx) {
    const decor = this.calendar && this.calendar.decor;
    if (!decor) return;
    const g = this.game;
    const p = g.patio;
    if (decor === 'xmas' && p) {
      // Lampki świąteczne wzdłuż krawędzi Patio
      const colors = ['#ef4444', '#facc15', '#22c55e', '#3b82f6'];
      const pts = [];
      for (let x = p.x + 10; x <= p.x + p.w - 10; x += 20) {
        pts.push([x, p.y + 4]);
        pts.push([x, p.y + p.h - 4]);
      }
      for (let y = p.y + 24; y <= p.y + p.h - 24; y += 20) {
        pts.push([p.x + 4, y]);
        pts.push([p.x + p.w - 4, y]);
      }
      ctx.save();
      pts.forEach(([x, y], i) => {
        const on = Math.sin(this.time * 3 + i * 1.3) > -0.2;
        ctx.globalAlpha = on ? 0.95 : 0.35;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      this.drawXmasTree(ctx, p.x + p.w / 2, p.y + p.h / 2 + 6);
    } else if (decor === 'halloween') {
      if (p) {
        const spots = [
          [p.x + 22, p.y + p.h / 2 - 30],
          [p.x + p.w - 22, p.y + p.h / 2 + 30],
          [p.x + p.w / 2 - 40, p.y + p.h - 18],
          [p.x + p.w / 2 + 40, p.y + 28]
        ];
        spots.forEach(([x, y], i) => this.drawPumpkin(ctx, x, y, i));
      }
      this.drawCobwebs(ctx);
    }
  }

  drawXmasTree(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 26, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y + 14, 8, 12);
    const tiers = [[y + 18, 24, '#166534'], [y + 2, 19, '#15803d'], [y - 13, 14, '#16a34a']];
    for (const [ty, half, color] of tiers) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, ty - half * 1.2);
      ctx.lineTo(x + half, ty);
      ctx.lineTo(x - half, ty);
      ctx.closePath();
      ctx.fill();
    }
    const baubles = [[-10, 12, '#ef4444'], [9, 10, '#facc15'], [-5, -2, '#3b82f6'], [7, -6, '#ef4444'], [0, 8, '#e879f9'], [-3, -15, '#facc15']];
    baubles.forEach(([dx, dy, c], i) => {
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.time * 2.5 + i);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y - 33);
    ctx.restore();
  }

  drawPumpkin(ctx, x, y, i) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ea580c';
    for (const dx of [-6, 6, 0]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, 7.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(124, 45, 18, 0.6)';
    ctx.lineWidth = 1;
    for (const dx of [-4, 4]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, 4, 8.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x - 1.5, y - 12, 3, 5);
    const glow = 0.7 + 0.3 * Math.sin(this.time * 4 + i * 2);
    ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 1);
    ctx.lineTo(x - 3, y - 5);
    ctx.lineTo(x - 1, y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 1);
    ctx.lineTo(x + 3, y - 5);
    ctx.lineTo(x + 6, y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 3);
    ctx.lineTo(x + 6, y + 3);
    ctx.lineTo(x + 3, y + 6);
    ctx.lineTo(x, y + 4.5);
    ctx.lineTo(x - 3, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawCobwebs(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = 0.8;
    const corners = [[20, 20, 1, 1], [CANVAS_WIDTH - 20, 20, -1, 1], [20, CANVAS_HEIGHT - 20, 1, -1], [CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20, -1, -1]];
    for (const [cx, cy, sx, sy] of corners) {
      for (let k = 0; k <= 4; k++) {
        const a = (Math.PI / 2) * (k / 4);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + sx * Math.cos(a) * 46, cy + sy * Math.sin(a) * 46);
        ctx.stroke();
      }
      for (const r of [14, 26, 38]) {
        ctx.beginPath();
        for (let k = 0; k <= 4; k++) {
          const a = (Math.PI / 2) * (k / 4);
          const px = cx + sx * Math.cos(a) * r;
          const py = cy + sy * Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Błyskawica i błysk (nad wszystkim, także nad ciemnością przy awarii prądu)
  renderFlash(ctx) {
    this.renderLightningWarning(ctx);
    if (this.boltTimer > 0 && this.bolt) {
      const a = Math.min(1, this.boltTimer / 0.35);
      const pts = this.bolt.pts;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const drawPath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      };
      ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.5 * a})`;
      ctx.lineWidth = 9;
      drawPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * a})`;
      ctx.lineWidth = 2.6;
      drawPath();
      const glow = ctx.createRadialGradient(this.bolt.x, this.bolt.y, 2, this.bolt.x, this.bolt.y, 70);
      glow.addColorStop(0, `rgba(255, 250, 200, ${0.8 * a})`);
      glow.addColorStop(1, 'rgba(255, 250, 200, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.bolt.x, this.bolt.y, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(226, 232, 255, ${0.45 * (this.flashTimer / 0.4)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------
  // Dźwięki pogody (Web Audio, przez kanał efektów SFX)
  // ---------------------------------------------------------------------
  syncAmbience() {
    const ss = soundSystem;
    if (!ss || !ss.ctx || !ss.noiseBuffer) return;
    const kindMap = { rain: 'rain', storm: 'storm', wind: 'wind', snow: 'snow' };
    const kind = kindMap[this.type] || null;
    let target = 0;
    if (kind && this.game.state === 'PLAYING' && !ss.muted) {
      target = { rain: 0.1, storm: 0.15, wind: 0.09, snow: 0.035 }[kind];
      if (kind === 'wind') target *= this.gustActive > 0 ? 2.6 : 1 + 0.25 * Math.sin(this.time * 1.7);
    }
    if (!this.ambience) {
      if (target <= 0) return;
      try {
        const src = ss.ctx.createBufferSource();
        src.buffer = ss.noiseBuffer;
        src.loop = true;
        const filter = ss.ctx.createBiquadFilter();
        const gain = ss.ctx.createGain();
        gain.gain.value = 0;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ss.getSFXDestination());
        src.start();
        this.ambience = { src, filter, gain, kind: null };
      } catch {
        return;
      }
    }
    const f = this.ambience.filter;
    const now = ss.ctx.currentTime;
    if (kind && this.ambience.kind !== kind) {
      if (kind === 'wind') {
        f.type = 'bandpass';
        f.Q.value = 0.9;
      } else if (kind === 'snow') {
        f.type = 'lowpass';
        f.frequency.value = 520;
        f.Q.value = 0.5;
      } else {
        f.type = 'highpass';
        f.frequency.value = kind === 'storm' ? 700 : 1100;
        f.Q.value = 0.4;
      }
      this.ambience.kind = kind;
    }
    if (kind === 'wind') {
      f.frequency.setTargetAtTime(this.gustActive > 0 ? 760 : 380 + 90 * Math.sin(this.time * 0.9), now, 0.3);
    }
    this.ambience.gain.gain.setTargetAtTime(target, now, 0.25);
  }

  playLightningWarning() {
    const ss = soundSystem;
    if (!ss || ss.muted || !ss.ctx) return;
    try {
      const ctx = ss.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(240, now + 1.4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
      osc.connect(gain);
      gain.connect(ss.getSFXDestination());
      osc.start(now);
      osc.stop(now + 1.5);
    } catch {}
  }

  playThunder() {
    const ss = soundSystem;
    if (!ss || ss.muted) return;
    ss.init();
    if (!ss.ctx || !ss.noiseBuffer) return;
    try {
      const ctx = ss.ctx;
      const now = ctx.currentTime;
      // Trzask uderzenia
      const crack = ctx.createBufferSource();
      crack.buffer = ss.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.0001, now);
      cg.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      crack.connect(hp);
      hp.connect(cg);
      cg.connect(ss.getSFXDestination());
      crack.start(now, Math.random());
      crack.stop(now + 0.3);
      // Grzmot
      const rumble = ctx.createBufferSource();
      rumble.buffer = ss.noiseBuffer;
      rumble.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(280, now);
      lp.frequency.exponentialRampToValueAtTime(70, now + 2.2);
      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0.0001, now);
      rg.gain.exponentialRampToValueAtTime(1.1, now + 0.08);
      rg.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      rumble.connect(lp);
      lp.connect(rg);
      rg.connect(ss.getSFXDestination());
      rumble.start(now);
      rumble.stop(now + 2.5);
    } catch {}
  }

  // ---------------------------------------------------------------------
  // Interfejs: panel na ekranie startowym, ustawienia i plakietka w grze
  // ---------------------------------------------------------------------
  bindUI() {
    this.ui = {
      panelIcon: document.getElementById('weather-panel-icon'),
      panelName: document.getElementById('weather-panel-name'),
      panelSource: document.getElementById('weather-panel-source'),
      panelBonus: document.getElementById('weather-panel-bonus'),
      panelEffects: document.getElementById('weather-panel-effects'),
      chips: document.getElementById('weather-chips'),
      select: document.getElementById('setting-weather'),
      settingInfo: document.getElementById('setting-weather-info'),
      badge: document.getElementById('weather-badge'),
      badgeIcon: document.getElementById('weather-badge-icon'),
      badgeText: document.getElementById('weather-badge-text')
    };

    if (this.ui.chips) {
      this.ui.chips.innerHTML = '';
      const options = [{ id: 'live', label: '📡 Na żywo' }].concat(
        WEATHER_ORDER.map(id => ({ id, label: `${WEATHER_TYPES[id].icon} ${WEATHER_TYPES[id].chip}` }))
      );
      for (const opt of options) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'weather-chip';
        btn.dataset.weather = opt.id;
        btn.setAttribute('role', 'radio');
        btn.textContent = opt.label;
        btn.addEventListener('click', (e) => {
          e.currentTarget.blur();
          soundSystem.init();
          this.setMode(opt.id);
        });
        this.ui.chips.appendChild(btn);
      }
    }

    if (this.ui.select) {
      this.ui.select.innerHTML = '';
      const addOption = (value, text) => {
        const op = document.createElement('option');
        op.value = value;
        op.textContent = text;
        this.ui.select.appendChild(op);
      };
      addOption('live', '📡 Na żywo (okolice ALK)');
      WEATHER_ORDER.forEach(id => addOption(id, `${WEATHER_TYPES[id].icon} ${WEATHER_TYPES[id].name}`));
      this.ui.select.addEventListener('change', (e) => {
        this.setMode(e.target.value);
      });
    }

    this.ui.daytimeChips = document.getElementById('daytime-chips');
    this.ui.daytimeSelect = document.getElementById('setting-daytime');
    this.ui.story = document.getElementById('start-story-text');
    this.ui.calendarLine = document.getElementById('weather-panel-calendar');
    if (this.ui.daytimeChips) {
      this.ui.daytimeChips.innerHTML = '';
      const dayOptions = [{ id: 'live', label: '🕒 Na żywo' }, { id: 'day', label: '☀️ Dzień' }, { id: 'night', label: '🌙 Noc' }];
      for (const opt of dayOptions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'weather-chip';
        btn.dataset.daytime = opt.id;
        btn.setAttribute('role', 'radio');
        btn.textContent = opt.label;
        btn.addEventListener('click', (e) => {
          e.currentTarget.blur();
          soundSystem.init();
          this.setDaytimeMode(opt.id);
        });
        this.ui.daytimeChips.appendChild(btn);
      }
    }
    if (this.ui.daytimeSelect) {
      this.ui.daytimeSelect.innerHTML = '';
      [['live', '🕒 Na żywo (dzień/noc przy ALK)'], ['day', '☀️ Zawsze dzień'], ['night', '🌙 Zawsze noc']].forEach(([value, text]) => {
        const op = document.createElement('option');
        op.value = value;
        op.textContent = text;
        this.ui.daytimeSelect.appendChild(op);
      });
      this.ui.daytimeSelect.addEventListener('change', (e) => {
        this.setDaytimeMode(e.target.value);
      });
    }

    this.updateUI();
  }

  // Status sesji w HUD zależny od daty (kalendarz akademicki)
  getCalendarStatus() {
    return this.calendar ? this.calendar.status : 'Sesja trwa';
  }

  notify() {
    this.updateUI();
  }

  getInfo() {
    const d = this.def;
    const icon = this.isNight && d.nightIcon ? d.nightIcon : d.icon;
    const name = this.isNight && d.nightName ? d.nightName : d.name;
    const isLive = this.mode === 'live';
    let source;
    let temp = null;
    if (isLive) {
      if (this.live && (this.liveStatus === 'ok' || this.liveStatus === 'stale')) {
        temp = Math.round(this.live.temp);
        const timeStr = this.live.fetchedAt ? new Date(this.live.fetchedAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
        source = `📡 Na żywo przy ALK · ${temp}°C · wiatr ${Math.round(this.live.wind)} km/h`;
        if (timeStr) source += ` · aktualizacja ${timeStr}`;
        if (this.liveStatus === 'stale') source += ' (brak połączenia, ostatni odczyt)';
      } else if (this.liveStatus === 'error') {
        source = '📡 Nie udało się pobrać pogody, więc gramy przy pochmurnym niebie. Możesz wybrać pogodę ręcznie.';
      } else {
        source = '📡 Sprawdzam pogodę przy ALK…';
      }
    } else {
      source = '🎛️ Pogoda wybrana ręcznie';
    }
    const showMoon = this.night && this.type !== 'sunny';
    return {
      icon: showMoon ? icon + '🌙' : icon,
      name: showMoon ? name + ' · noc' : name,
      source,
      temp,
      isLive,
      night: this.night,
      effects: this.night ? d.effects.concat([NIGHT_EFFECT_TEXT]) : d.effects,
      scoreMul: this.scoreMul()
    };
  }

  updateUI() {
    const ui = this.ui;
    if (!ui) return;
    const info = this.getInfo();
    const bonusText = info.scoreMul > 1 ? `🏆 Premia ${formatWeatherMul(info.scoreMul)} pkt` : 'Bez premii punktowej';

    if (ui.panelIcon) ui.panelIcon.textContent = info.icon;
    if (ui.panelName) ui.panelName.textContent = info.name;
    if (ui.panelSource) ui.panelSource.textContent = info.source;
    if (ui.panelBonus) {
      ui.panelBonus.textContent = bonusText;
      ui.panelBonus.classList.toggle('is-neutral', !(info.scoreMul > 1));
    }
    if (ui.panelEffects) {
      ui.panelEffects.innerHTML = '';
      for (const line of info.effects) {
        const li = document.createElement('li');
        li.textContent = line;
        ui.panelEffects.appendChild(li);
      }
    }
    if (ui.chips) {
      for (const btn of ui.chips.querySelectorAll('.weather-chip')) {
        const active = btn.dataset.weather === this.mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
        if (btn.dataset.weather === 'live') {
          const liveDef = this.live && this.live.type ? WEATHER_TYPES[this.live.type] : null;
          const liveIcon = liveDef ? (this.live.isDay === false && liveDef.nightIcon ? liveDef.nightIcon : liveDef.icon) : '';
          btn.textContent = liveIcon ? `📡 Na żywo (${liveIcon})` : '📡 Na żywo';
        }
      }
    }
    if (ui.select) {
      ui.select.value = this.mode;
    }
    if (ui.daytimeChips) {
      for (const btn of ui.daytimeChips.querySelectorAll('.weather-chip')) {
        const active = btn.dataset.daytime === this.daytimeMode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
        if (btn.dataset.daytime === 'live') btn.textContent = '🕒 Na żywo (' + (this.night ? '🌙' : '☀️') + ')';
      }
    }
    if (ui.daytimeSelect) {
      ui.daytimeSelect.value = this.daytimeMode;
    }
    if (ui.calendarLine && this.calendar) {
      ui.calendarLine.textContent = '📅 ' + this.calendar.status;
    }
    if (ui.story && this.calendar && !ui.storyPatched) {
      ui.story.innerHTML = ui.story.innerHTML.replace('Sesja letnia na Koźmińskim w pełni!', this.calendar.story);
      ui.storyPatched = true;
    }
    if (ui.settingInfo) {
      ui.settingInfo.textContent = `${info.icon} ${info.name}${info.temp !== null ? `, ${info.temp}°C` : ''} · ${info.scoreMul > 1 ? `premia ${formatWeatherMul(info.scoreMul)} pkt` : 'bez premii'}`;
    }
    if (ui.badge) {
      let text = info.name;
      if (info.temp !== null) text += ` · ${info.temp}°C`;
      if (info.scoreMul > 1) text += ` · ${formatWeatherMul(info.scoreMul)} pkt`;
      if (ui.badgeIcon) ui.badgeIcon.textContent = info.icon;
      if (ui.badgeText) ui.badgeText.textContent = text;
      ui.badge.title = `${info.name}: ${info.effects.join(' ')}`;
    }
  }
}

class KozminskiEscapeGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.viewport = document.getElementById('canvas-viewport');

    // Elementy HUD
    this.hudSemesterVal = document.getElementById('hud-semester-val');
    this.hudEctsVal = document.getElementById('hud-ects-val');
    this.hudStaminaVal = document.getElementById('hud-stamina-val');
    this.hudStaminaContainer = document.getElementById('hud-stamina-container');
    this.hudStaminaLabel = document.getElementById('hud-stamina-label');
    this.staminaFill = document.getElementById('stamina-fill');
    this.hudStatusBadge = document.getElementById('hud-status-badge');
    this.hudTimeVal = document.getElementById('hud-time-val');
    this.audioIcon = document.getElementById('audio-icon');
    this.btnQuotes = document.getElementById('btn-quotes');
    this.quotesIcon = document.getElementById('quotes-icon');

    // Dymki postaci
    this.speechBubbleProf = document.getElementById('professor-speech');
    this.speechQuoteProf = document.getElementById('speech-quote');

    this.speechBubbleInst = document.getElementById('instructor-speech');
    this.speechQuoteInst = document.getElementById('instructor-quote');

    this.speechBubbleDean = document.getElementById('deanclerk-speech');
    this.speechQuoteDean = document.getElementById('deanclerk-quote');

    // Banner wydarzenia losowego
    this.eventBanner = document.getElementById('event-banner');
    this.eventIcon = document.getElementById('event-icon');
    this.eventTitle = document.getElementById('event-title');
    this.eventDesc = document.getElementById('event-desc');
    this.eventTimer = document.getElementById('event-timer');

    // Ekrany modalne
    this.modalStart = document.getElementById('modal-start');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modalVictory = document.getElementById('modal-victory');

    this.hudScoreVal = document.getElementById('hud-score-val');
    this.hudComboContainer = document.getElementById('hud-combo-container');
    this.hudComboFill = document.getElementById('hud-combo-fill');

    // Statystyki końcowe
    this.gameoverEcts = document.getElementById('gameover-ects');
    this.gameoverTime = document.getElementById('gameover-time');
    this.gameoverScore = document.getElementById('gameover-score');
    this.gameoverCombo = document.getElementById('gameover-combo');
    this.gameoverItems = document.getElementById('gameover-items');
    this.gameoverQuote = document.getElementById('gameover-quote');
    this.gameoverSubtitle = document.getElementById('gameover-subtitle');

    this.victoryEcts = document.getElementById('victory-ects');
    this.victoryTime = document.getElementById('victory-time');
    this.victoryScore = document.getElementById('victory-score');
    this.victoryTimeBonus = document.getElementById('victory-time-bonus');
    this.victoryCombo = document.getElementById('victory-combo');
    this.victoryItems = document.getElementById('victory-items');
    this.victoryOralTime = document.getElementById('victory-oral-time');
    this.victoryGrade = document.getElementById('victory-grade');
    this.victoryTitle = document.getElementById('victory-title');
    this.victorySubtitle = document.getElementById('victory-subtitle');
    this.victoryQuote = document.getElementById('victory-quote');
    this.newRecordBadge = document.getElementById('new-record-badge');
    this.achievementsList = document.getElementById('achievements-list');
    this.btnNextSemester = document.getElementById('btn-next-semester');
    this.modalEnemies = document.getElementById('modal-enemies');
    this.btnCloseEnemies = document.getElementById('btn-close-enemies');
    this.previousStateBeforeEnemiesModal = null;

    // Elementy odliczania 3... 2... 1... START!
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownNumber = document.getElementById('countdown-number');
    this.countdownSub = document.getElementById('countdown-sub');
    this.countdownTimer = null;

    // Przycisk samouczka, wrogów i sklepu w menu startowym
    this.btnTutorial = document.getElementById('btn-tutorial');
    this.btnOpenEnemiesMenu = document.getElementById('btn-open-enemies-menu');
    this.btnOpenShop = document.getElementById('btn-open-shop');

    // Elementy Sklepu ALK i Stypendium
    this.modalShop = document.getElementById('modal-shop');
    this.btnCloseShop = document.getElementById('btn-close-shop');
    this.btnShopDone = document.getElementById('btn-shop-done');
    this.startWalletVal = document.getElementById('start-wallet-val');
    this.shopWalletVal = document.getElementById('shop-wallet-val');
    this.shopUpgradesGrid = document.getElementById('shop-upgrades-grid');
    this.shopSkinsGrid = document.getElementById('shop-skins-grid');
    this.gameoverStipendLine = document.getElementById('gameover-stipend-line');
    this.victoryStipendLine = document.getElementById('victory-stipend-line');
    this.previousStateBeforeShopModal = null;
    this.rewardGrantedThisGame = false;

    // Elementy samouczka (Modal Tutorial)
    this.modalTutorial = document.getElementById('modal-tutorial');
    this.btnCloseTutorial = document.getElementById('btn-close-tutorial');
    this.btnTutNext = document.getElementById('btn-tut-next');
    this.btnTutPrev = document.getElementById('btn-tut-prev');
    this.btnTutSkip = document.getElementById('btn-tut-skip');
    this.tutDots = document.querySelectorAll('.tut-dot');
    this.tutSlides = document.querySelectorAll('.tutorial-slide');
    this.currentTutorialSlide = 0;
    this.previousStateBeforeTutorialModal = null;

    // Elementy pauzy (Modal Pause)
    this.modalPause = document.getElementById('modal-pause');
    this.btnResumeGame = document.getElementById('btn-resume-game');
    this.btnPauseSettings = document.getElementById('btn-pause-settings');
    this.btnPauseMenu = document.getElementById('btn-pause-menu');

    // Elementy ustawień (Modal Settings)
    this.btnSettings = document.getElementById('btn-settings');
    this.modalSettings = document.getElementById('modal-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.settingMusicVol = document.getElementById('setting-music-vol');
    this.musicVolVal = document.getElementById('music-vol-val');
    this.settingSfxVol = document.getElementById('setting-sfx-vol');
    this.sfxVolVal = document.getElementById('sfx-vol-val');
    this.settingShake = document.getElementById('setting-shake');
    this.settingQuotes = document.getElementById('setting-quotes');
    this.screenShakeEnabled = true;
    this.previousStateBeforeSettingsModal = null;

    // Gwiazdki i powrót do menu
    this.gameoverStars = document.getElementById('gameover-stars');
    this.victoryStars = document.getElementById('victory-stars');
    this.btnGameoverMenu = document.getElementById('btn-gameover-menu');
    this.btnVictoryMenu = document.getElementById('btn-victory-menu');

    // Przycisk sprintu na dotyku
    this.btnTouchSprint = document.getElementById('btn-touch-sprint');

    // Stan ogólny gry
    this.state = 'TITLE_MENU'; // 'TITLE_MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'
    this.currentSemester = 1; // 1 | 2 | 3
    this.selectedSemester = 1; // semestr wybrany w menu / modalu
    this.selectedMap = this.loadSelectedMap();
    this.currentMap = this.selectedMap;
    this.quotesEnabled = true;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.lastLoopTime = 0;
    this.rafId = null;

    // Finał: „Egzamin ustny”
    this.finalPhase = false;
    this.finalTimer = 0;
    this.finalMaxTime = 25;
    this.oralExamSeconds = 0;
    this.oralExamPassed = false;
    this.finalTarget = null;
    this.bossAnswersCollected = 0;
    this.bossProjectiles = [];

    // System Wyniku (Score) & Combo za szybkie zbieranie
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.itemsCollectedCount = 0;

    // Game feel: hit-stop, biały błysk, drgania ekranu, sekwencja złapania, latające orby
    this.hitStopTimer = 0;
    this.whiteFlashTimer = 0;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.flyingOrbs = [];
    this.isCaughtSequence = false;
    this.caughtTimer = 0;
    this.caughtMessage = '';

    // Statystyki bieżącej sesji pod osiągnięcia
    this.sprintUsed = false;
    this.geminiCollected = 0;
    this.bushHidesCount = 0;
    this.goldEctsCollected = 0;
    this.cheatsCollected = 0;
    this.coffeesDrunk = 0;

    // Śledzenie sterowania
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false
    };

    // Obiekty gry
    this.player = null;
    this.examiner = null;
    this.instructor = null;
    this.deanClerk = null;
    this.securityGuard = null;
    this.rector = null;
    this.boss = null;
    this.items = [];
    this.walls = [];
    this.pillars = [];
    this.rooms = [];
    this.patio = null;
    this.bushes = [];
    this.npcs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.respawnQueue = [];
    this.npcCrowdTextTimer = 0;

    // System zdarzeń losowych
    this.activeEvent = null; // null | { id: string, name: string, desc: string, duration: number, maxDuration: number, icon: string }
    this.eventSchedulerTimer = 0;
    this.goldenSpawnTimer = 0;

    // Siatka BFS i ścieżki
    this.grid = []; // COLS x ROWS boolean (true = zablokowane)
    this.pathfindingCooldown = 0;

    // Ostatnia znana pozycja gracza (do zgubienia pościgu)
    this.lastKnownPlayerPos = { x: 90, y: 270 };

    // Prerenderowane statyczne tło kampusu (offscreen canvas)
    this.staticBgCanvas = null;
    this.staticBgCtx = null;

    this.initCampusLayout();
    this.initGrid();
    this.initStaticBgCanvas();
    this.initCanvasResolution();
    this.initEventListeners();
    this.loadSettings();

    // System pogody: aktualna pogoda spod ALK albo wybrana ręcznie
    this.weather = new WeatherSystem(this);
    this.weather.bindUI();
    this.weather.fetchLive();

    this.updateMapTabsUI(this.selectedMap);
    this.resetHUD();
    this.updateRecordDisplays();
    this.updateWalletDisplays();
    this.initPlayerAndEnemiesPositions();
    this.render(); // Początkowy render kampusu
    this.checkFirstTimeTutorial();
  }

  // =========================================================================
  // OBSŁUGA ROZDZIELCZOŚCI RETINA / HIDPI I RESPONSYWNOŚCI CANVAS
  // =========================================================================
  initCanvasResolution() {
    this.resizeCanvas();

    // 1. Obserwator zmian rozmiaru kontenera canvasa (viewport / okno / obrót telefonu)
    if (typeof ResizeObserver !== 'undefined' && this.viewport) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
      });
      this.resizeObserver.observe(this.viewport);
    }

    // 2. Obsługa resize i zmiany orientacji telefonu
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => this.resizeCanvas());

    // 3. Nasłuch dynamicznej zmiany devicePixelRatio (np. po przeniesieniu okna na inny monitor)
    this.watchDprChange();
  }

  watchDprChange() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const currentDpr = window.devicePixelRatio || 1;
    const mediaQuery = window.matchMedia(`(resolution: ${currentDpr}dppx)`);
    const handleDprChange = () => {
      this.resizeCanvas();
      this.watchDprChange();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDprChange, { once: true });
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleDprChange);
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;

    // Rzeczywisty rozmiar canvasa na podstawie rozmiaru wyświetlanego w CSS
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width > 0 ? rect.width : (this.viewport?.clientWidth || CANVAS_WIDTH);
    const dpr = window.devicePixelRatio || 1;

    // canvas.width = Math.round(szerokość w CSS × devicePixelRatio), max 2400 px
    const targetWidth = Math.min(2400, Math.max(1, Math.round(cssWidth * dpr)));
    const targetHeight = Math.round(targetWidth * (CANVAS_HEIGHT / CANVAS_WIDTH));

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    if (this.state !== 'PLAYING') {
      this.render();
    }
  }

  // =========================================================================
  // 1. UKŁAD KAMPUSU Z 2 WYJŚCIAMI Z KAŻDEGO BUDYNKU (MAPA BIEŻĄCA Z MAPS)
  // =========================================================================
  loadSelectedMap() {
    try {
      const saved = localStorage.getItem(MAP_KEY);
      if (saved && MAPS[saved]) return saved;
    } catch {}
    return 'parter';
  }

  saveSelectedMap(mapId) {
    try {
      if (MAPS[mapId]) {
        localStorage.setItem(MAP_KEY, mapId);
      }
    } catch {}
  }

  getCurrentMapConfig() {
    return MAPS[this.currentMap] || MAPS.parter;
  }

  updateMapTabsUI(mapId) {
    document.querySelectorAll('.map-tab').forEach((t) => {
      if (t.getAttribute('data-map') === mapId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }

  setMap(mapId, persist = true) {
    const validId = MAPS[mapId] ? mapId : 'parter';
    this.selectedMap = validId;
    if (persist) {
      this.saveSelectedMap(validId);
    }
    this.updateMapTabsUI(validId);

    if (this.state !== 'PAUSED') {
      this.currentMap = validId;
      this.initCampusLayout();
      this.initGrid();
      this.initStaticBgCanvas();

      if (this.state !== 'PLAYING') {
        this.initPlayerAndEnemiesPositions();
        if (this.weather) this.weather.onMenu();
        this.render();
      }
    }
  }

  initCampusLayout() {
    const mapCfg = this.getCurrentMapConfig();
    this.walls = mapCfg.walls.map(w => ({ ...w }));
    this.pillars = (mapCfg.pillars || []).map(p => ({ ...p }));
    this.rooms = mapCfg.rooms.map(r => ({ ...r }));
    this.patio = mapCfg.patio ? { ...mapCfg.patio } : null;
    this.bushes = mapCfg.bushes.map(b => ({ ...b, cooldown: 0 }));
    this.lastKnownPlayerPos = { ...mapCfg.playerStart };
  }

  // =========================================================================
  // 2. POŚCIG BEZ ZACINANIA SIĘ: SIATKA 20x20 px I WYSZUKIWANIE ŚCIEŻKI BFS
  // =========================================================================
  initGrid() {
    this.grid = [];
    const charInflationRadius = 14; // margines dla promienia postaci

    for (let c = 0; c < COLS; c++) {
      this.grid[c] = [];
      for (let r = 0; r < ROWS; r++) {
        const cellCenterX = c * GRID_SIZE + GRID_SIZE / 2;
        const cellCenterY = r * GRID_SIZE + GRID_SIZE / 2;

        let blocked = false;
        for (const w of this.walls) {
          if (
            cellCenterX >= w.x - charInflationRadius &&
            cellCenterX <= w.x + w.w + charInflationRadius &&
            cellCenterY >= w.y - charInflationRadius &&
            cellCenterY <= w.y + w.h + charInflationRadius
          ) {
            blocked = true;
            break;
          }
        }
        this.grid[c][r] = blocked;
      }
    }
  }

  // Algorytm BFS dla poruszania się przeciwników
  findBfsPath(startX, startY, targetX, targetY) {
    const startCol = Math.max(0, Math.min(COLS - 1, Math.floor(startX / GRID_SIZE)));
    const startRow = Math.max(0, Math.min(ROWS - 1, Math.floor(startY / GRID_SIZE)));
    const targetCol = Math.max(0, Math.min(COLS - 1, Math.floor(targetX / GRID_SIZE)));
    const targetRow = Math.max(0, Math.min(ROWS - 1, Math.floor(targetY / GRID_SIZE)));

    if (startCol === targetCol && startRow === targetRow) {
      return [{ x: targetX, y: targetY }];
    }

    const visited = Array.from({ length: COLS }, () => new Uint8Array(ROWS));
    const parent = Array.from({ length: COLS }, () => new Array(ROWS).fill(null));
    const queue = [];

    visited[startCol][startRow] = 1;
    queue.push({ c: startCol, r: startRow });

    const neighbors = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ];

    let found = false;
    let closestNode = { c: startCol, r: startRow, dist: Math.hypot(startCol - targetCol, startRow - targetRow) };

    while (queue.length > 0) {
      const curr = queue.shift();

      if (curr.c === targetCol && curr.r === targetRow) {
        found = true;
        break;
      }

      for (const n of neighbors) {
        const nc = curr.c + n.dc;
        const nr = curr.r + n.dr;

        if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
          if (!visited[nc][nr] && !this.grid[nc][nr]) {
            visited[nc][nr] = 1;
            parent[nc][nr] = curr;
            queue.push({ c: nc, r: nr });

            const dist = Math.hypot(nc - targetCol, nr - targetRow);
            if (dist < closestNode.dist) {
              closestNode = { c: nc, r: nr, dist };
            }
          }
        }
      }
    }

    // Odtworzenie ścieżki
    const endNode = found ? { c: targetCol, r: targetRow } : closestNode;
    const path = [];
    let curr = endNode;

    while (curr && !(curr.c === startCol && curr.r === startRow)) {
      path.unshift({
        x: curr.c * GRID_SIZE + GRID_SIZE / 2,
        y: curr.r * GRID_SIZE + GRID_SIZE / 2
      });
      curr = parent[curr.c][curr.r];
    }

    if (path.length === 0) {
      path.push({ x: targetX, y: targetY });
    }
    return path;
  }

  // Kolizja punktu/koła ze ścianami kampusu
  checkWallCollision(x, y, radius) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
      const distX = x - closestX;
      const distY = y - closestY;
      if (distX * distX + distY * distY < radius * radius) {
        return true;
      }
    }
    return false;
  }

  // Odrzut przeciwnika po użyciu Legitymacji (maksymalnie 120 px w krokach co 4 px)
  applyKnockback(enemy, maxDist = 120) {
    if (!enemy) return;

    let dirX = -Math.cos(enemy.angle);
    let dirY = -Math.sin(enemy.angle);
    const len = Math.hypot(dirX, dirY);
    if (len > 0.0001) {
      dirX /= len;
      dirY /= len;
    } else {
      const pushAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
      dirX = Math.cos(pushAngle);
      dirY = Math.sin(pushAngle);
    }

    const stepSize = 4;
    const steps = Math.floor(maxDist / stepSize);

    for (let s = 0; s < steps; s++) {
      const nextX = enemy.x + dirX * stepSize;
      const nextY = enemy.y + dirY * stepSize;

      // Zatrzymanie przed krawędzią mapy z uwzględnieniem promienia
      if (
        nextX - enemy.radius < 0 ||
        nextX + enemy.radius > CANVAS_WIDTH ||
        nextY - enemy.radius < 0 ||
        nextY + enemy.radius > CANVAS_HEIGHT
      ) {
        break;
      }

      // Zatrzymanie przed pierwszą kolizją ze ścianami (z promieniem wroga)
      if (this.checkWallCollision(nextX, nextY, enemy.radius)) {
        break;
      }

      enemy.x = nextX;
      enemy.y = nextY;
    }

    // Po odrzucie wyczyść jego ścieżkę BFS
    enemy.path = [];
  }

  isInRoomById(roomId, x, y) {
    const r = (this.rooms || []).find((room) => room.id === roomId);
    if (!r) return false;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // Sprawdzenie czy punkt znajduje się w Bibliotece / Czytelni (Strefa Ciszy)
  isInLibrary(x, y) {
    return this.isInRoomById('library', x, y);
  }

  // Sprawdzenie czy punkt znajduje się w Dziekanacie
  isInDeanOffice(x, y) {
    return this.isInRoomById('dean', x, y);
  }

  // Sprawdzenie czy punkt znajduje się w Auli
  isInAulaA(x, y) {
    return this.isInRoomById('aula', x, y);
  }

  // Sprawdzenie czy punkt znajduje się w Labie Komputerowym
  isInComputerLab(x, y) {
    return this.isInRoomById('lab', x, y);
  }

  // =========================================================================
  // Inicjalizacja nasłuchu zdarzeń (klawiatura, dotyk, przyciski UI)
  // =========================================================================
  initEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Usuwamy fokus po kliknięciu każdego przycisku, aby naciśnięcie spacji nie aktywowało ostatnio klikniętego przycisku
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .btn-tool, .btn-action, .sem-tab');
      if (btn) btn.blur();
    });

    // Resetowanie klawiszy przy utracie fokusu okna (alt-tab)
    window.addEventListener('blur', () => {
      this.resetInputs();
    });

    // Resetowanie klawiszy i automatyczna pauza przy przejściu karty w tło
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.resetInputs();
        if (this.state === 'PLAYING') {
          this.pauseGame();
        }
      }
    });

    // Przyciski rozpoczęcia / restartu
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.startGame();
      });
    }

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.startGame();
      });
    }

    const btnVictoryRestart = document.getElementById('btn-victory-restart');
    if (btnVictoryRestart) {
      btnVictoryRestart.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.startGame();
      });
    }

    if (this.btnNextSemester) {
      this.btnNextSemester.addEventListener('click', (e) => {
        e.currentTarget.blur();
        if (this.currentSemester < 3) {
          this.selectedSemester = this.currentSemester + 1;
        } else {
          this.selectedSemester = 1;
        }
        this.setSemester(this.selectedSemester);
        this.startGame();
      });
    }

    // Przyciski powrotu do menu głównego
    if (this.btnGameoverMenu) {
      this.btnGameoverMenu.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.returnToMenu();
      });
    }

    if (this.btnVictoryMenu) {
      this.btnVictoryMenu.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.returnToMenu();
      });
    }

    // Przełącznik audio w belce górnej
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', (e) => {
        e.currentTarget.blur();
        const isMuted = soundSystem.toggleMute();
        this.audioIcon.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Przełącznik wypowiedzi profesora i przeciwników
    if (this.btnQuotes) {
      this.btnQuotes.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.toggleQuotes();
      });
    }

    // Przycisk informacji o przeciwnikach (ℹ️): otwiera osobne okienko modalne
    const btnInfo = document.getElementById('btn-info');
    if (btnInfo) {
      btnInfo.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.openEnemiesModal();
      });
    }

    if (this.btnOpenEnemiesMenu) {
      this.btnOpenEnemiesMenu.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.openEnemiesModal();
      });
    }

    // Zamknięcie okienka przeciwników przyciskiem ✕
    if (this.btnCloseEnemies) {
      this.btnCloseEnemies.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeEnemiesModal();
      });
    }

    // Zamknięcie okienka przeciwników kliknięciem w przyciemnione tło
    if (this.modalEnemies) {
      this.modalEnemies.addEventListener('click', (e) => {
        if (e.target === this.modalEnemies) {
          this.closeEnemiesModal();
        }
      });
    }

    // Sklep ALK (#modal-shop)
    if (this.btnOpenShop) {
      this.btnOpenShop.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.openShopModal();
      });
    }

    if (this.btnCloseShop) {
      this.btnCloseShop.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeShopModal();
      });
    }

    if (this.btnShopDone) {
      this.btnShopDone.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeShopModal();
      });
    }

    if (this.modalShop) {
      this.modalShop.addEventListener('click', (e) => {
        if (e.target === this.modalShop) {
          this.closeShopModal();
        }
      });
    }

    // Samouczek (Modal Tutorial)
    if (this.btnTutorial) {
      this.btnTutorial.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.openTutorialModal();
      });
    }

    if (this.btnCloseTutorial) {
      this.btnCloseTutorial.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeTutorialModal();
      });
    }

    if (this.btnTutNext) {
      this.btnTutNext.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.nextTutorialSlide();
      });
    }

    if (this.btnTutPrev) {
      this.btnTutPrev.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.prevTutorialSlide();
      });
    }

    if (this.btnTutSkip) {
      this.btnTutSkip.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeTutorialModal();
      });
    }

    if (this.modalTutorial) {
      this.modalTutorial.addEventListener('click', (e) => {
        if (e.target === this.modalTutorial) {
          this.closeTutorialModal();
        }
      });
    }

    if (this.tutDots) {
      this.tutDots.forEach((dot) => {
        dot.addEventListener('click', (e) => {
          e.currentTarget.blur();
          const slideIdx = parseInt(dot.getAttribute('data-dot'), 10);
          this.setTutorialSlide(slideIdx);
        });
      });
    }

    // Pauza (Modal Pause)
    if (this.btnResumeGame) {
      this.btnResumeGame.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closePauseModal();
      });
    }

    if (this.btnPauseSettings) {
      this.btnPauseSettings.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closePauseModal(false);
        this.openSettingsModal();
      });
    }

    if (this.btnPauseMenu) {
      this.btnPauseMenu.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.returnToMenu();
      });
    }

    if (this.modalPause) {
      this.modalPause.addEventListener('click', (e) => {
        if (e.target === this.modalPause) {
          this.closePauseModal();
        }
      });
    }

    // Ustawienia (Modal Settings)
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.openSettingsModal();
      });
    }

    if (this.btnCloseSettings) {
      this.btnCloseSettings.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeSettingsModal();
      });
    }

    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', (e) => {
        e.currentTarget.blur();
        this.closeSettingsModal();
      });
    }

    if (this.modalSettings) {
      this.modalSettings.addEventListener('click', (e) => {
        if (e.target === this.modalSettings) {
          this.closeSettingsModal();
        }
      });
    }

    if (this.settingMusicVol) {
      this.settingMusicVol.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        soundSystem.setMusicVolume(val / 100);
        if (this.musicVolVal) this.musicVolVal.textContent = `${val}%`;
        this.saveSettings();
      });
    }

    if (this.settingSfxVol) {
      this.settingSfxVol.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        soundSystem.setSfxVolume(val / 100);
        if (this.sfxVolVal) this.sfxVolVal.textContent = `${val}%`;
        this.saveSettings();
      });
    }

    if (this.settingShake) {
      this.settingShake.addEventListener('change', (e) => {
        this.screenShakeEnabled = e.target.checked;
        if (!this.screenShakeEnabled && this.viewport) {
          this.viewport.classList.remove('screen-shake');
        }
        this.saveSettings();
      });
    }

    if (this.settingQuotes) {
      this.settingQuotes.addEventListener('change', (e) => {
        this.quotesEnabled = e.target.checked;
        if (this.quotesIcon) this.quotesIcon.textContent = this.quotesEnabled ? '💬' : '🚫';
        if (!this.quotesEnabled) {
          if (this.speechBubbleProf) this.speechBubbleProf.classList.add('hidden');
          if (this.speechBubbleInst) this.speechBubbleInst.classList.add('hidden');
          if (this.speechBubbleDean) this.speechBubbleDean.classList.add('hidden');
        }
        this.saveSettings();
      });
    }

    // Zakładki wyboru semestrów w ekranie startowym
    const semTabs = document.querySelectorAll('.sem-tab:not(.map-tab)');
    semTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.currentTarget.blur();
        const sem = parseInt(tab.getAttribute('data-sem'), 10);
        this.selectedSemester = sem;
        this.updateSemesterTabsUI(sem);
        // Zmiana zakładki podczas pauzy nie zmienia bieżącej gry, zaczyna obowiązywać dopiero po „Rozpocznij sesję”
        if (this.state !== 'PAUSED') {
          this.setSemester(sem);
        }
      });
    });

    // Zakładki wyboru mapy w ekranie startowym
    const mapTabs = document.querySelectorAll('.map-tab');
    mapTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.currentTarget.blur();
        const mapId = tab.getAttribute('data-map');
        this.setMap(mapId, true);
      });
    });

    this.setupTouchControls();
  }

  updateSemesterTabsUI(sem) {
    document.querySelectorAll('.sem-tab:not(.map-tab)').forEach((t) => {
      if (parseInt(t.getAttribute('data-sem'), 10) === sem) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const storyText = document.getElementById('start-story-text');
    if (storyText) {
      if (sem === 1) {
        storyText.innerHTML = `<strong>Semestr I (Zwykły):</strong> Profesor rusza w pościg. Prowadzący ćwiczenia dołącza od 10 ECTS, a Pani z Dziekanatu od 20 ECTS. Zbierz 30 ECTS, by zdać!`;
      } else if (sem === 2) {
        storyText.innerHTML = `<strong>Semestr II (Trudniejszy):</strong> Krótsze przerwy między wydarzeniami losowymi! Prowadzący pojawia się już przy 5 ECTS, a Pani z Dziekanatu przy 15 ECTS!`;
      } else {
        storyText.innerHTML = `<strong>Semestr III (Sesja poprawkowa):</strong> WSZYSCY przeciwnicy czyhają od 1 sekundy! Egzaminator jest o 15% szybszy. Stawką jest upragniony <em>Dyplom ALK</em>!`;
      }
    }
  }

  setSemester(sem) {
    this.currentSemester = sem;
    this.selectedSemester = sem;
    const semRoman = sem === 1 ? 'I' : sem === 2 ? 'II' : 'III';
    if (this.hudSemesterVal) this.hudSemesterVal.textContent = semRoman;
    this.updateSemesterTabsUI(sem);
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.openPauseModal();
  }

  // --- Modal Przeciwników (#modal-enemies) ---
  openEnemiesModal() {
    this.previousStateBeforeEnemiesModal = this.state;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
      this.state = 'PAUSED';
      soundSystem.pauseMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.resetInputs();
    }
    if (this.modalEnemies) {
      this.modalEnemies.classList.remove('hidden');
      this.modalEnemies.classList.add('active');
    }
  }

  closeEnemiesModal() {
    if (!this.modalEnemies || this.modalEnemies.classList.contains('hidden')) return;
    this.modalEnemies.classList.remove('active');
    this.modalEnemies.classList.add('hidden');

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const btnInfo = document.getElementById('btn-info');
    if (btnInfo) btnInfo.blur();
    if (this.btnCloseEnemies) this.btnCloseEnemies.blur();

    const wasPlaying = this.previousStateBeforeEnemiesModal === 'PLAYING';
    if (this.previousStateBeforeEnemiesModal) {
      this.state = this.previousStateBeforeEnemiesModal;
      this.previousStateBeforeEnemiesModal = null;
    }

    if (wasPlaying) {
      this.resumeGame();
    }
  }

  isEnemiesModalOpen() {
    return Boolean(this.modalEnemies && !this.modalEnemies.classList.contains('hidden'));
  }

  // --- Waluta „Stypendium” & Sklep ALK (#modal-shop) ---
  loadWallet() {
    try {
      const raw = localStorage.getItem(WALLET_KEY);
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  saveWallet(amount) {
    const clean = Math.max(0, Math.round(Number(amount) || 0));
    try {
      localStorage.setItem(WALLET_KEY, String(clean));
    } catch {}
    return clean;
  }

  loadUpgrades() {
    const defaults = { shoes: 0, thermos: 0, stamina: 0, idcard: 0 };
    try {
      const raw = localStorage.getItem(UPGRADES_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        shoes: Math.max(0, Math.min(3, Math.floor(Number(parsed.shoes) || 0))),
        thermos: Math.max(0, Math.min(3, Math.floor(Number(parsed.thermos) || 0))),
        stamina: Math.max(0, Math.min(3, Math.floor(Number(parsed.stamina) || 0))),
        idcard: Math.max(0, Math.min(1, Math.floor(Number(parsed.idcard) || 0)))
      };
    } catch {
      return defaults;
    }
  }

  saveUpgrades(upgrades) {
    try {
      localStorage.setItem(UPGRADES_KEY, JSON.stringify({
        shoes: Math.max(0, Math.min(3, Math.floor(Number(upgrades?.shoes) || 0))),
        thermos: Math.max(0, Math.min(3, Math.floor(Number(upgrades?.thermos) || 0))),
        stamina: Math.max(0, Math.min(3, Math.floor(Number(upgrades?.stamina) || 0))),
        idcard: Math.max(0, Math.min(1, Math.floor(Number(upgrades?.idcard) || 0)))
      }));
    } catch {}
  }

  isSem3Passed() {
    try {
      const raw = localStorage.getItem('kozminski_best_sem3');
      return Boolean(raw);
    } catch {
      return false;
    }
  }

  loadSkins() {
    const sem3Done = this.isSem3Passed();
    const validIds = new Set(SKINS_CONFIG.map(s => s.id));
    let owned = ['default'];
    let equipped = 'default';

    try {
      const raw = localStorage.getItem(SKINS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.owned)) {
          const filtered = parsed.owned.filter(id => validIds.has(id));
          owned = Array.from(new Set(['default', ...filtered]));
        }
        if (typeof parsed.equipped === 'string' && validIds.has(parsed.equipped)) {
          equipped = parsed.equipped;
        }
      }
    } catch {}

    if (sem3Done && !owned.includes('gown')) {
      owned.push('gown');
    }
    if (!owned.includes(equipped)) {
      equipped = 'default';
    }
    return { owned, equipped };
  }

  saveSkins(skins) {
    try {
      const owned = Array.from(new Set(['default', ...(Array.isArray(skins?.owned) ? skins.owned : [])]));
      const equipped = owned.includes(skins?.equipped) ? skins.equipped : 'default';
      localStorage.setItem(SKINS_KEY, JSON.stringify({ owned, equipped }));
    } catch {}
  }

  updateWalletDisplays() {
    const wallet = this.loadWallet();
    const formatted = wallet.toLocaleString('pl-PL');
    if (this.startWalletVal) {
      this.startWalletVal.textContent = formatted;
    }
    if (this.shopWalletVal) {
      this.shopWalletVal.textContent = formatted;
    }
  }

  grantEndGameStipend(isVictory, finalGrade) {
    const currentWallet = this.loadWallet();
    if (this.rewardGrantedThisGame) {
      return { earned: 0, balance: currentWallet };
    }
    this.rewardGrantedThisGame = true;

    let earned = Math.round(Math.max(0, this.score) / 10);
    if (isVictory) {
      earned += 50;
      if (String(finalGrade || '').startsWith('5.0')) {
        earned += 50;
      }
    }

    const newBalance = this.saveWallet(currentWallet + earned);
    const text = `💰 +${earned.toLocaleString('pl-PL')} zł stypendium · saldo: ${newBalance.toLocaleString('pl-PL')} zł`;

    if (isVictory && this.victoryStipendLine) {
      this.victoryStipendLine.textContent = text;
    } else if (!isVictory && this.gameoverStipendLine) {
      this.gameoverStipendLine.textContent = text;
    }

    this.updateWalletDisplays();
    return { earned, balance: newBalance };
  }

  openShopModal() {
    this.previousStateBeforeShopModal = this.state;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
      this.state = 'PAUSED';
      soundSystem.pauseMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.resetInputs();
    }
    this.renderShop();
    if (this.modalShop) {
      this.modalShop.classList.remove('hidden');
      this.modalShop.classList.add('active');
      const card = this.modalShop.querySelector('.modal-shop-card');
      if (card) card.scrollTop = 0;
    }
  }

  closeShopModal() {
    if (!this.modalShop || this.modalShop.classList.contains('hidden')) return;
    this.modalShop.classList.remove('active');
    this.modalShop.classList.add('hidden');

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (this.btnOpenShop) this.btnOpenShop.blur();
    if (this.btnCloseShop) this.btnCloseShop.blur();
    if (this.btnShopDone) this.btnShopDone.blur();

    this.updateWalletDisplays();

    const wasPlaying = this.previousStateBeforeShopModal === 'PLAYING';
    if (this.previousStateBeforeShopModal) {
      this.state = this.previousStateBeforeShopModal;
      this.previousStateBeforeShopModal = null;
    }

    if (wasPlaying) {
      this.resumeGame();
    } else {
      this.render();
    }
  }

  isShopModalOpen() {
    return Boolean(this.modalShop && !this.modalShop.classList.contains('hidden'));
  }

  buyUpgrade(upgradeId) {
    const cfg = UPGRADES_CONFIG.find(u => u.id === upgradeId);
    if (!cfg) return false;
    const upgrades = this.loadUpgrades();
    const level = upgrades[upgradeId] || 0;
    if (level >= cfg.maxLevel) return false;

    const price = cfg.prices[level];
    const wallet = this.loadWallet();
    if (wallet < price) return false;

    this.saveWallet(wallet - price);
    upgrades[upgradeId] = level + 1;
    this.saveUpgrades(upgrades);

    soundSystem.init();
    soundSystem.play('achievement');
    this.updateWalletDisplays();
    this.renderShop();
    return true;
  }

  handleSkinAction(skinId) {
    const cfg = SKINS_CONFIG.find(s => s.id === skinId);
    if (!cfg) return false;

    const skins = this.loadSkins();
    const isOwned = skins.owned.includes(skinId);

    if (isOwned) {
      if (skins.equipped === skinId) return false;
      skins.equipped = skinId;
      this.saveSkins(skins);
      soundSystem.init();
      soundSystem.play('ects');
      this.renderShop();
      this.render();
      return true;
    }

    if (cfg.requiresSem3 && !this.isSem3Passed()) {
      return false;
    }

    const wallet = this.loadWallet();
    if (wallet < cfg.price) return false;

    this.saveWallet(wallet - cfg.price);
    skins.owned.push(skinId);
    skins.equipped = skinId;
    this.saveSkins(skins);

    soundSystem.init();
    soundSystem.play('achievement');
    this.updateWalletDisplays();
    this.renderShop();
    this.render();
    return true;
  }

  renderShop() {
    const wallet = this.loadWallet();
    const upgrades = this.loadUpgrades();
    const skins = this.loadSkins();
    const sem3Passed = this.isSem3Passed();

    this.updateWalletDisplays();

    if (this.shopUpgradesGrid) {
      this.shopUpgradesGrid.innerHTML = '';
      for (const cfg of UPGRADES_CONFIG) {
        const level = upgrades[cfg.id] || 0;
        const isMax = level >= cfg.maxLevel;
        const nextPrice = isMax ? 0 : cfg.prices[level];
        const canAfford = !isMax && wallet >= nextPrice;

        let dotsHtml = '';
        for (let i = 0; i < cfg.maxLevel; i++) {
          dotsHtml += `<span class="shop-dot ${i < level ? 'filled' : ''}">${i < level ? '●' : '○'}</span>`;
        }

        const card = document.createElement('div');
        card.className = `shop-card ${isMax ? 'shop-card-maxed' : ''}`;

        let btnText = 'MAX ✓';
        let btnClass = 'shop-btn shop-btn-max';
        let disabledAttr = 'disabled';
        if (!isMax) {
          if (canAfford) {
            btnText = `Kup za ${nextPrice.toLocaleString('pl-PL')} zł`;
            btnClass = 'shop-btn shop-btn-buy';
            disabledAttr = '';
          } else {
            btnText = 'Za mało stypendium';
            btnClass = 'shop-btn shop-btn-locked';
          }
        }

        card.innerHTML = `
          <div class="shop-card-top">
            <div class="shop-card-icon">${cfg.icon}</div>
            <div class="shop-card-meta">
              <div class="shop-card-name">${cfg.name}</div>
              <div class="shop-level-dots" aria-label="Poziom ${level} z ${cfg.maxLevel}">${dotsHtml}</div>
            </div>
          </div>
          <p class="shop-card-desc">${cfg.desc}</p>
          <div class="shop-card-actions">
            ${!isMax ? `<span class="shop-price-hint">Następny poziom: <strong>${nextPrice.toLocaleString('pl-PL')} zł</strong></span>` : '<span class="shop-price-hint shop-price-done">Maksymalny poziom</span>'}
            <button type="button" class="${btnClass}" data-upgrade-id="${cfg.id}" ${disabledAttr}>${btnText}</button>
          </div>
        `;

        const btn = card.querySelector('button[data-upgrade-id]');
        if (btn && !isMax && canAfford) {
          btn.addEventListener('click', (e) => {
            e.currentTarget.blur();
            this.buyUpgrade(cfg.id);
          });
        }

        this.shopUpgradesGrid.appendChild(card);
      }
    }

    if (this.shopSkinsGrid) {
      this.shopSkinsGrid.innerHTML = '';
      for (const skin of SKINS_CONFIG) {
        const isOwned = skins.owned.includes(skin.id);
        const isEquipped = skins.equipped === skin.id;
        const isSem3Locked = Boolean(skin.requiresSem3 && !sem3Passed && !isOwned);
        const canAfford = !isOwned && !isSem3Locked && wallet >= skin.price;

        let btnText = '';
        let btnClass = 'shop-btn';
        let disabled = false;

        if (isSem3Locked) {
          btnText = '🔒 Zdaj Semestr III';
          btnClass += ' shop-btn-locked';
          disabled = true;
        } else if (isEquipped) {
          btnText = 'Założony ✓';
          btnClass += ' shop-btn-equipped';
          disabled = true;
        } else if (isOwned) {
          btnText = 'Załóż';
          btnClass += ' shop-btn-equip';
        } else if (canAfford) {
          btnText = `Kup za ${skin.price.toLocaleString('pl-PL')} zł`;
          btnClass += ' shop-btn-buy';
        } else {
          btnText = 'Za mało stypendium';
          btnClass += ' shop-btn-locked';
          disabled = true;
        }

        const priceLabel = isOwned
          ? (isEquipped ? 'Aktualnie założony' : 'Odblokowany')
          : (isSem3Locked ? 'Nagroda za Semestr III' : `${skin.price.toLocaleString('pl-PL')} zł`);

        const card = document.createElement('div');
        card.className = `shop-card shop-skin-card ${isEquipped ? 'shop-card-equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-skin-preview-wrap">
            <canvas class="shop-skin-preview" width="76" height="76" aria-hidden="true"></canvas>
          </div>
          <div class="shop-skin-info">
            <div class="shop-card-name">${skin.icon} ${skin.name}</div>
            <p class="shop-card-desc">${skin.desc}</p>
            <div class="shop-price-hint">${priceLabel}</div>
          </div>
          <button type="button" class="${btnClass}" data-skin-id="${skin.id}" ${disabled ? 'disabled' : ''}>${btnText}</button>
        `;

        const previewCanvas = card.querySelector('.shop-skin-preview');
        if (previewCanvas) {
          this.renderSkinPreview(previewCanvas, skin.id);
        }

        const btn = card.querySelector('button[data-skin-id]');
        if (btn && !disabled) {
          btn.addEventListener('click', (e) => {
            e.currentTarget.blur();
            this.handleSkinAction(skin.id);
          });
        }

        this.shopSkinsGrid.appendChild(card);
      }
    }
  }

  renderSkinPreview(canvasEl, skinId) {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    // Miękki okrągły podest w tle podglądu
    const grad = ctx.createRadialGradient(w / 2, h / 2 + 4, 4, w / 2, h / 2 + 4, w * 0.46);
    grad.addColorStop(0, 'rgba(242, 169, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 34, 68, 0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 2, w * 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(w / 2, h / 2 + 6);
    ctx.scale(1.85, 1.85);

    // Cień pod stopami jak na planszy
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawStudentFigure(ctx, {
      skinId,
      isFacingLeft: false,
      isFacingUp: false,
      walk: 0,
      breath: 1.0
    });
    ctx.restore();
  }

  // --- Modal Samouczka (#modal-tutorial) ---
  checkFirstTimeTutorial() {
    try {
      const seen = localStorage.getItem('kozminski_tutorial_seen');
      if (!seen) {
        this.openTutorialModal();
      }
    } catch {}
  }

  openTutorialModal() {
    this.previousStateBeforeTutorialModal = this.state;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
      this.state = 'PAUSED';
      soundSystem.pauseMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.resetInputs();
    }
    this.setTutorialSlide(0);
    if (this.modalTutorial) {
      this.modalTutorial.classList.remove('hidden');
      this.modalTutorial.classList.add('active');
    }
  }

  closeTutorialModal() {
    if (!this.modalTutorial || this.modalTutorial.classList.contains('hidden')) return;
    this.modalTutorial.classList.remove('active');
    this.modalTutorial.classList.add('hidden');

    try {
      localStorage.setItem('kozminski_tutorial_seen', 'true');
    } catch {}

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    const wasPlaying = this.previousStateBeforeTutorialModal === 'PLAYING';
    if (this.previousStateBeforeTutorialModal) {
      this.state = this.previousStateBeforeTutorialModal;
      this.previousStateBeforeTutorialModal = null;
    }

    if (wasPlaying) {
      this.resumeGame();
    }
  }

  isTutorialModalOpen() {
    return Boolean(this.modalTutorial && !this.modalTutorial.classList.contains('hidden'));
  }

  setTutorialSlide(index) {
    this.currentTutorialSlide = Math.max(0, Math.min(3, index));
    if (this.tutSlides && this.tutSlides.length) {
      this.tutSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === this.currentTutorialSlide);
      });
    }
    if (this.tutDots && this.tutDots.length) {
      this.tutDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.currentTutorialSlide);
      });
    }
    if (this.btnTutPrev) {
      this.btnTutPrev.classList.toggle('hidden', this.currentTutorialSlide === 0);
    }
    if (this.btnTutNext) {
      this.btnTutNext.textContent = this.currentTutorialSlide === 3 ? 'Rozumiem, gramy!' : 'Dalej ▶';
    }
  }

  nextTutorialSlide() {
    if (this.currentTutorialSlide < 3) {
      this.setTutorialSlide(this.currentTutorialSlide + 1);
    } else {
      this.closeTutorialModal();
    }
  }

  prevTutorialSlide() {
    if (this.currentTutorialSlide > 0) {
      this.setTutorialSlide(this.currentTutorialSlide - 1);
    }
  }

  // --- Modal Pauzy (#modal-pause) ---
  openPauseModal() {
    if (this.state !== 'PLAYING' && this.state !== 'COUNTDOWN') return;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    this.state = 'PAUSED';
    soundSystem.pauseMusic();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resetInputs();
    if (this.modalPause) {
      this.modalPause.classList.remove('hidden');
      this.modalPause.classList.add('active');
    }
  }

  closePauseModal(resume = true) {
    if (!this.modalPause || this.modalPause.classList.contains('hidden')) return;
    this.modalPause.classList.remove('active');
    this.modalPause.classList.add('hidden');

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    if (resume) {
      this.resumeGame();
    }
  }

  isPauseModalOpen() {
    return Boolean(this.modalPause && !this.modalPause.classList.contains('hidden'));
  }

  // --- Modal Ustawień (#modal-settings) ---
  openSettingsModal() {
    this.previousStateBeforeSettingsModal = this.state;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
      this.state = 'PAUSED';
      soundSystem.pauseMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.resetInputs();
    }

    if (this.settingMusicVol) {
      const volPct = Math.round(soundSystem.getMusicVolume() * 100);
      this.settingMusicVol.value = String(volPct);
      if (this.musicVolVal) this.musicVolVal.textContent = `${volPct}%`;
    }
    if (this.settingSfxVol) {
      const volPct = Math.round(soundSystem.getSfxVolume() * 100);
      this.settingSfxVol.value = String(volPct);
      if (this.sfxVolVal) this.sfxVolVal.textContent = `${volPct}%`;
    }
    if (this.settingShake) {
      this.settingShake.checked = this.screenShakeEnabled;
    }
    if (this.settingQuotes) {
      this.settingQuotes.checked = this.quotesEnabled;
    }

    if (this.modalSettings) {
      this.modalSettings.classList.remove('hidden');
      this.modalSettings.classList.add('active');
    }
  }

  closeSettingsModal() {
    if (!this.modalSettings || this.modalSettings.classList.contains('hidden')) return;
    this.modalSettings.classList.remove('active');
    this.modalSettings.classList.add('hidden');

    this.saveSettings();

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    const wasPlaying = this.previousStateBeforeSettingsModal === 'PLAYING';
    if (this.previousStateBeforeSettingsModal) {
      this.state = this.previousStateBeforeSettingsModal;
      this.previousStateBeforeSettingsModal = null;
    }

    if (wasPlaying) {
      this.resumeGame();
    }
  }

  isSettingsModalOpen() {
    return Boolean(this.modalSettings && !this.modalSettings.classList.contains('hidden'));
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem('kozminski_settings');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.musicVol === 'number') {
          soundSystem.setMusicVolume(data.musicVol);
        }
        if (typeof data.sfxVol === 'number') {
          soundSystem.setSfxVolume(data.sfxVol);
        }
        if (typeof data.screenShake === 'boolean') {
          this.screenShakeEnabled = data.screenShake;
        }
        if (typeof data.quotes === 'boolean') {
          this.quotesEnabled = data.quotes;
          if (this.quotesIcon) this.quotesIcon.textContent = this.quotesEnabled ? '💬' : '🚫';
        }
      }
    } catch {}
  }

  saveSettings() {
    try {
      const data = {
        musicVol: soundSystem.getMusicVolume(),
        sfxVol: soundSystem.getSfxVolume(),
        screenShake: this.screenShakeEnabled,
        quotes: this.quotesEnabled
      };
      localStorage.setItem('kozminski_settings', JSON.stringify(data));
    } catch {}
  }

  // --- Powrót do ekranu startowego (#modal-start) ---
  returnToMenu() {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    soundSystem.stopMusic();
    if (this.countdownOverlay) this.countdownOverlay.classList.add('hidden');
    if (this.modalGameOver) {
      this.modalGameOver.classList.add('hidden');
      this.modalGameOver.classList.remove('active');
    }
    if (this.modalVictory) {
      this.modalVictory.classList.add('hidden');
      this.modalVictory.classList.remove('active');
    }
    if (this.modalPause) {
      this.modalPause.classList.add('hidden');
      this.modalPause.classList.remove('active');
    }
    if (this.modalEnemies) {
      this.modalEnemies.classList.add('hidden');
      this.modalEnemies.classList.remove('active');
    }
    if (this.modalSettings) {
      this.modalSettings.classList.add('hidden');
      this.modalSettings.classList.remove('active');
    }
    if (this.modalTutorial) {
      this.modalTutorial.classList.add('hidden');
      this.modalTutorial.classList.remove('active');
    }
    if (this.modalShop) {
      this.modalShop.classList.add('hidden');
      this.modalShop.classList.remove('active');
    }

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();
    this.resetInputs();

    this.state = 'TITLE_MENU';
    this.resetHUD();
    this.updateRecordDisplays();
    this.updateWalletDisplays();
    if (this.modalStart) {
      this.modalStart.classList.remove('hidden');
      this.modalStart.classList.add('active');
    }

    this.initPlayerAndEnemiesPositions();
    if (this.weather) this.weather.onMenu();
    this.render();
  }

  // Zresetowanie wskaźników HUD (np. po powrocie do Menu startowego)
  resetHUD() {
    this.ectsCollected = 0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.itemsCollectedCount = 0;
    this.elapsedSeconds = 0;
    this.finalPhase = false;
    this.oralExamPassed = false;
    this.oralExamSeconds = 0;
    this.bossAnswersCollected = 0;
    this.bossProjectiles = [];
    this.securityGuard = null;
    this.rector = null;
    this.boss = null;
    this.activeEvent = null;
    this.hideEventBanner();

    if (this.hudEctsVal) {
      this.hudEctsVal.textContent = '0';
      this.hudEctsVal.classList.remove('ects-pop');
    }
    if (this.hudScoreVal) {
      this.hudScoreVal.textContent = '0 pkt';
    }
    if (this.hudStaminaVal) {
      this.hudStaminaVal.textContent = '100%';
    }
    if (this.staminaFill) {
      this.staminaFill.style.width = '100%';
    }
    if (this.hudStaminaContainer) {
      this.hudStaminaContainer.classList.remove('stamina-critical', 'stamina-disabled');
    }
    if (this.hudStaminaLabel) {
      this.hudStaminaLabel.textContent = 'Stamina';
    }
    if (this.hudTimeVal) {
      this.hudTimeVal.textContent = '00:00';
    }
    if (this.hudStatusBadge) {
      this.hudStatusBadge.textContent = this.weather ? '📅 ' + this.weather.getCalendarStatus() : 'Sesja trwa';
      this.hudStatusBadge.className = 'status-badge status-normal';
    }
    if (this.hudComboContainer) {
      this.hudComboContainer.classList.add('hidden');
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
  }

  initPlayerAndEnemiesPositions() {
    const mapCfg = this.getCurrentMapConfig();
    const pStart = mapCfg.playerStart;
    const eStart = mapCfg.examinerStart;

    this.player = {
      x: pStart.x,
      y: pStart.y,
      radius: 16,
      direction: 0,
      walkCycle: 0,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      canSprint: true,
      hasShield: false,
      shieldPulse: 0,
      isHidden: false,
      currentBush: null,
      bushTimer: 0,
      deanStandTimer: 0,
      deanPetitionActiveTimer: 0,
      deanCooldown: 0,
      stunTimer: 0,
      deanImmunityTimer: 0,
      immunityTimer: 0,
      slowTimer: 0,
      boostTimer: 0
    };
    const profBaseSpeed = this.currentSemester === 3 ? 2.45 : 2.15;
    this.examiner = {
      x: eStart.x,
      y: eStart.y,
      radius: 18,
      baseSpeed: profBaseSpeed,
      speed: profBaseSpeed,
      freezeTimer: 0,
      rageTimer: 0,
      alarmTimer: 0,
      angle: Math.PI,
      path: [],
      speechTimer: 0,
      speechText: '',
      targetX: pStart.x,
      targetY: pStart.y
    };
    this.lastKnownPlayerPos = { x: pStart.x, y: pStart.y };
    this.instructor = null;
    this.deanClerk = null;
    this.securityGuard = null;
    this.rector = null;
    this.boss = null;
    this.bossProjectiles = [];
    this.bossAnswersCollected = 0;
    this.items = [];
    this.npcs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.flyingOrbs = [];
  }

  // --- Ocena gwiazdkowa (Stars Rating) ---
  calculateStars(isVictory, score, grade) {
    if (!isVictory) return 0;
    const gradeStr = String(grade || '');
    if (score >= 7000 && gradeStr.startsWith('5.0')) {
      return 3;
    }
    if (score >= 4000) {
      return 2;
    }
    return 1;
  }

  renderStars(container, count) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      if (i <= count) {
        star.className = 'star-item star-filled pop-star';
        star.style.animationDelay = `${(i - 1) * 0.18}s`;
        star.textContent = '★';
        star.setAttribute('aria-label', `Zdobyta gwiazdka ${i}`);
      } else {
        star.className = 'star-item star-empty';
        star.textContent = '☆';
        star.setAttribute('aria-label', `Pusta gwiazdka ${i}`);
      }
      container.appendChild(star);
    }
  }

  resumeGame() {
    this.state = 'PLAYING';
    soundSystem.resumeMusic();
    this.lastLoopTime = performance.now();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  resetInputs() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false
    };
    document.querySelectorAll('.dpad-btn, .touch-sprint-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
  }

  setupTouchControls() {
    const bindTouch = (id, keyName) => {
      const el = document.getElementById(id);
      if (!el) return;

      const onStart = (e) => {
        e.preventDefault();
        this.keys[keyName] = true;
        el.classList.add('active');
        soundSystem.init();
      };

      const onEnd = (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
        el.classList.remove('active');
      };

      el.addEventListener('touchstart', onStart, { passive: false });
      el.addEventListener('touchend', onEnd, { passive: false });
      el.addEventListener('touchcancel', onEnd, { passive: false });
      el.addEventListener('mousedown', onStart);
      el.addEventListener('mouseup', onEnd);
      el.addEventListener('mouseleave', onEnd);
    };

    bindTouch('btn-touch-up', 'up');
    bindTouch('btn-touch-down', 'down');
    bindTouch('btn-touch-left', 'left');
    bindTouch('btn-touch-right', 'right');
    bindTouch('btn-touch-sprint', 'sprint');
  }

  handleKeyDown(e) {
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (this.state === 'PLAYING') {
        this.openPauseModal();
      } else if (this.isPauseModalOpen()) {
        this.closePauseModal();
      }
      return;
    }

    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.isShopModalOpen()) {
        this.closeShopModal();
        return;
      }
      if (this.isTutorialModalOpen()) {
        this.closeTutorialModal();
        return;
      }
      if (this.isSettingsModalOpen()) {
        this.closeSettingsModal();
        return;
      }
      if (this.isEnemiesModalOpen()) {
        this.closeEnemiesModal();
        return;
      }
      if (this.isPauseModalOpen()) {
        this.closePauseModal();
        return;
      }
      if (this.state === 'PLAYING') {
        this.openPauseModal();
        return;
      }
      return;
    }

    const isGameKey = (
      e.code === 'KeyW' || e.code === 'ArrowUp' ||
      e.code === 'KeyS' || e.code === 'ArrowDown' ||
      e.code === 'KeyA' || e.code === 'ArrowLeft' ||
      e.code === 'KeyD' || e.code === 'ArrowRight' ||
      e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
      e.code === 'Space'
    );

    if (isGameKey && this.state === 'PLAYING') {
      e.preventDefault();
    }

    soundSystem.init();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'Space':
        this.keys.sprint = true;
        break;
    }
  }

  handleKeyUp(e) {
    const isGameKey = (
      e.code === 'KeyW' || e.code === 'ArrowUp' ||
      e.code === 'KeyS' || e.code === 'ArrowDown' ||
      e.code === 'KeyA' || e.code === 'ArrowLeft' ||
      e.code === 'KeyD' || e.code === 'ArrowRight' ||
      e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
      e.code === 'Space'
    );

    if (isGameKey && this.state === 'PLAYING') {
      e.preventDefault();
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'Space':
        this.keys.sprint = false;
        break;
    }
  }

  toggleQuotes() {
    this.quotesEnabled = !this.quotesEnabled;
    if (this.quotesIcon) this.quotesIcon.textContent = this.quotesEnabled ? '💬' : '🚫';
    if (this.btnQuotes) {
      this.btnQuotes.title = this.quotesEnabled ? 'Wypowiedzi postaci: włączone' : 'Wypowiedzi postaci: wyłączone';
      if (this.quotesEnabled) {
        this.btnQuotes.classList.remove('tool-muted');
      } else {
        this.btnQuotes.classList.add('tool-muted');
        if (this.speechBubbleProf) this.speechBubbleProf.classList.add('hidden');
        if (this.speechBubbleInst) this.speechBubbleInst.classList.add('hidden');
        if (this.speechBubbleDean) this.speechBubbleDean.classList.add('hidden');
      }
    }
  }

  // =========================================================================
  // ROZPOCZĘCIE SESJI GRY
  // =========================================================================
  startGame() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }

    if (this.modalEnemies) {
      this.modalEnemies.classList.add('hidden');
      this.modalEnemies.classList.remove('active');
    }
    if (this.modalPause) {
      this.modalPause.classList.add('hidden');
      this.modalPause.classList.remove('active');
    }
    if (this.modalSettings) {
      this.modalSettings.classList.add('hidden');
      this.modalSettings.classList.remove('active');
    }
    if (this.modalTutorial) {
      this.modalTutorial.classList.add('hidden');
      this.modalTutorial.classList.remove('active');
    }
    if (this.modalShop) {
      this.modalShop.classList.add('hidden');
      this.modalShop.classList.remove('active');
    }

    this.modalStart.classList.add('hidden');
    this.modalStart.classList.remove('active');
    this.modalGameOver.classList.add('hidden');
    this.modalGameOver.classList.remove('active');
    this.modalVictory.classList.add('hidden');
    this.modalVictory.classList.remove('active');

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();

    // Nowa gra zatwierdza wybrany semestr i wybraną mapę
    this.setSemester(this.selectedSemester);
    this.setMap(this.selectedMap, false);
    this.rewardGrantedThisGame = false;

    // Reset statystyk osiągnięć
    this.sprintUsed = false;
    this.geminiCollected = 0;
    this.bushHidesCount = 0;
    this.goldEctsCollected = 0;
    this.cheatsCollected = 0;
    this.coffeesDrunk = 0;

    // Wczytanie ulepszeń ze Sklepu ALK
    const upgrades = this.loadUpgrades();
    const upgradedMaxStamina = 100 + 15 * upgrades.stamina;
    const upgradedSprintSpeed = 5.6 * (1 + 0.06 * upgrades.shoes);
    const startWithShield = upgrades.idcard >= 1;

    const mapCfg = this.getCurrentMapConfig();
    const pStart = mapCfg.playerStart;
    const eStart = mapCfg.examinerStart;

    // Student (Gracz)
    this.player = {
      x: pStart.x,
      y: pStart.y,
      radius: 16,
      baseSpeed: 3.2,
      sprintSpeed: upgradedSprintSpeed,
      currentSpeed: 3.2,
      stamina: upgradedMaxStamina,
      maxStamina: upgradedMaxStamina,
      isSprinting: false,
      canSprint: true,
      boostTimer: 0,
      hasShield: startWithShield,
      shieldPulse: 0,
      direction: 0,
      walkCycle: 0,
      // Stan ukrycia i stania w kolejce
      isHidden: false,
      currentBush: null,
      bushTimer: 0,
      deanStandTimer: 0,
      deanPetitionActiveTimer: 0,
      deanCooldown: 0,
      stunTimer: 0,
      deanImmunityTimer: 0,
      immunityTimer: 0,
      slowTimer: 0
    };

    // Egzaminator (Profesor z czerwonym długopisem)
    const profBaseSpeed = this.currentSemester === 3 ? 2.45 : 2.15;
    this.examiner = {
      x: eStart.x,
      y: eStart.y,
      radius: 18,
      baseSpeed: profBaseSpeed,
      speed: profBaseSpeed,
      freezeTimer: 0,
      rageTimer: 0,
      alarmTimer: 0,
      angle: Math.PI,
      path: [],
      speechTimer: 0,
      speechText: '',
      targetX: pStart.x,
      targetY: pStart.y
    };
    this.lastKnownPlayerPos = { x: pStart.x, y: pStart.y };

    // Prowadzący ćwiczenia (odcina drogę)
    this.instructor = null;
    if (this.currentSemester === 3) {
      this.spawnInstructor();
    }

    // Pani z Dziekanatu (patrol wokół Patio)
    this.deanClerk = null;
    if (this.currentSemester === 3) {
      this.spawnDeanClerk();
    }

    // Pan z ochrony (patrol korytarzy)
    this.securityGuard = null;
    if (this.currentSemester === 3) {
      this.spawnSecurityGuard();
    }

    // Rektor i Boss (Komisja Egzaminacyjna)
    this.rector = null;
    this.boss = null;
    this.bossProjectiles = [];
    this.bossAnswersCollected = 0;

    this.ectsCollected = 0;
    this.finalPhase = false;
    this.finalTimer = 0;
    this.finalMaxTime = this.currentSemester === 3 ? 35.0 : 25.0;
    this.oralExamSeconds = 0;
    this.oralExamPassed = false;
    this.finalTarget = null;

    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.itemsCollectedCount = 0;

    this.hitStopTimer = 0;
    this.whiteFlashTimer = 0;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.flyingOrbs = [];
    this.isCaughtSequence = false;
    this.caughtTimer = 0;
    this.caughtMessage = '';

    this.items = [];
    this.npcs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.respawnQueue = [];
    this.npcCrowdTextTimer = 0;
    this.activeEvent = null;
    this.goldenSpawnTimer = 18; // pierwszy złoty ECTS po ok. 18s
    this.eventSchedulerTimer = this.currentSemester === 2 ? 20 : 25; // pierwsze wydarzenie

    this.bushes.forEach(b => (b.cooldown = 0));

    // Pogoda na tę sesję (nowe kałuże, kierunek wiatru itd.)
    if (this.weather) this.weather.prepareForGame();

    this.elapsedSeconds = 0;
    this.updateTimeDisplay();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Spawnowanie początkowych przedmiotów
    this.spawnInitialItems();

    this.updateHUD();
    this.render();

    // Etap 4: Odliczanie przed rozpoczęciem sesji
    this.startCountdown();
  }

  startCountdown() {
    this.state = 'COUNTDOWN';
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.remove('hidden');
    }
    this.resetInputs();
    this.render();

    const setNumber = (text, isStart = false) => {
      if (this.countdownNumber) {
        this.countdownNumber.textContent = text;
        this.countdownNumber.classList.remove('pop-anim');
        void this.countdownNumber.offsetWidth;
        this.countdownNumber.classList.add('pop-anim');
        if (isStart) this.countdownNumber.classList.add('start-pulse');
        else this.countdownNumber.classList.remove('start-pulse');
      }
      if (this.countdownSub) {
        this.countdownSub.textContent = isStart ? 'SESJA ROZPOCZĘTA!' : 'PRZYGOTUJ SIĘ!';
      }
    };

    setNumber('3');
    soundSystem.play('countdown_beep');

    this.countdownTimer = setTimeout(() => {
      if (this.state !== 'COUNTDOWN') return;
      setNumber('2');
      soundSystem.play('countdown_beep');

      this.countdownTimer = setTimeout(() => {
        if (this.state !== 'COUNTDOWN') return;
        setNumber('1');
        soundSystem.play('countdown_beep');

        this.countdownTimer = setTimeout(() => {
          if (this.state !== 'COUNTDOWN') return;
          setNumber('START!', true);
          soundSystem.play('countdown_start');

          this.countdownTimer = setTimeout(() => {
            if (this.state !== 'COUNTDOWN') return;
            if (this.countdownOverlay) this.countdownOverlay.classList.add('hidden');
            this.state = 'PLAYING';
            soundSystem.startMusic();
            this.triggerSpeech(this.examiner, 'prof', '„Zaczynamy punktualnie! ECTS-y nie leżą na ulicy!”');
            this.lastLoopTime = performance.now();
            this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
          }, 500);
        }, 650);
      }, 650);
    }, 650);
  }

  // =========================================================================
  // SPAWNOWANIE NOWYCH PRZECIWNIKÓW
  // =========================================================================
  spawnInstructor() {
    if (this.instructor) return;
    const mapCfg = this.getCurrentMapConfig();
    // Pojawia się w wyjściu z sali najdalszym od studenta
    const candidateSpots = mapCfg.instructorSpawns.map(p => ({ ...p }));

    candidateSpots.sort((a, b) => {
      const distA = Math.hypot(a.x - this.player.x, a.y - this.player.y);
      const distB = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      return distB - distA;
    });

    const spawn = candidateSpots[0];
    this.instructor = {
      x: spawn.x,
      y: spawn.y,
      radius: 17,
      speed: this.examiner.baseSpeed * 0.85,
      freezeTimer: 0,
      path: [],
      angle: 0,
      speechTimer: 0,
      speechText: ''
    };

    this.addFloatingText("🧑‍🏫 Pojawił się Prowadzący ćwiczenia!", spawn.x, spawn.y - 20, '#10b981');
    soundSystem.play('event');
    this.triggerSpeech(this.instructor, 'instructor', '„Kartkówka za pięć minut!”');
  }

  spawnDeanClerk() {
    if (this.deanClerk) return;
    const mapCfg = this.getCurrentMapConfig();
    const start = mapCfg.deanClerkStart;
    this.deanClerk = {
      x: start.x,
      y: start.y,
      radius: 17,
      speed: 1.6, // stała prędkość patrolowa 1.6 px/klatkę
      freezeTimer: 0,
      angle: 0,
      speechTimer: 0,
      speechText: '',
      patrolIndex: 0,
      path: [],
      bfsTimer: 0,
      patrolPoints: mapCfg.deanClerkPatrol.map(pt => ({ ...pt }))
    };

    this.addFloatingText("👩‍💼 Pani z Dziekanatu ruszyła w obchód!", start.x, start.y - 20, '#a855f7');
    soundSystem.play('event');
    this.triggerSpeech(this.deanClerk, 'dean', '„Proszę zaświadczenie!”');
  }

  spawnSecurityGuard() {
    if (this.securityGuard) return;
    const mapCfg = this.getCurrentMapConfig();
    const start = mapCfg.securityGuardStart;
    this.securityGuard = {
      x: start.x,
      y: start.y,
      radius: 17,
      speed: 1.6,
      angle: Math.PI,
      freezeTimer: 0,
      path: [],
      bfsTimer: 0,
      patrolIndex: mapCfg.securityGuardPatrolIndex || 0,
      patrolPoints: mapCfg.securityGuardPatrol.map(pt => ({ ...pt })),
      whistleCooldown: 0,
      whistleText: '',
      whistleTextTimer: 0
    };

    this.addFloatingText("👮 Pan z ochrony pilnuje korytarzy!", start.x, start.y - 20, '#60a5fa');
    soundSystem.play('event');
  }

  spawnRector() {
    const mapCfg = this.getCurrentMapConfig();
    const start = mapCfg.rectorStart;
    this.rector = {
      x: start.x,
      y: start.y,
      radius: 17,
      speed: 1.3,
      angle: 0,
      freezeTimer: 0,
      path: [],
      bfsTimer: 0,
      patrolIndex: 0,
      patrolPoints: mapCfg.rectorPatrol.map(pt => ({ ...pt })),
      shookHand: false,
      speechText: '',
      speechTimer: 0
    };
  }

  spawnBoss() {
    if (this.boss) return;
    const mapCfg = this.getCurrentMapConfig();
    const start = mapCfg.bossStart;
    this.boss = {
      x: start.x,
      y: start.y,
      radius: 26,
      speed: 1.5,
      angle: Math.PI,
      freezeTimer: 0,
      path: [],
      bfsTimer: 0,
      shootTimer: 2.2
    };
    this.addFloatingText("🧑‍⚖️ Komisja Egzaminacyjna w komplecie!", start.x, start.y - 25, '#ef4444');
  }

  isBowingToRector(entity) {
    return Boolean(this.rector && entity && Math.hypot(entity.x - this.rector.x, entity.y - this.rector.y) < 160);
  }

  // =========================================================================
  // SPAWNOWANIE PRZEDMIOTÓW (ECTS, Kawa, Złote ECTS, Ściąga, Gemini AI, Legitymacja)
  // =========================================================================
  spawnInitialItems() {
    for (let i = 0; i < 7; i++) this.spawnItem('ects');
    for (let i = 0; i < 2; i++) this.spawnItem('coffee');
    this.spawnItem('shield');
    this.spawnItem('freeze');
    // Ściąga pojawia się losowo jako rzadki przedmiot
    if (Math.random() < 0.6) this.spawnItem('cheat');
  }

  spawnItem(type, forcedX = null, forcedY = null) {
    let valid = false;
    let x = 0, y = 0;
    let attempts = 0;

    // Helper: czy punkt jest zbyt blisko napisu sali (< 70 px w poziomie i < 24 px w pionie)
    const collidesWithRoomLabel = (px, py) => {
      if (!this.rooms || !this.rooms.length) return false;
      return this.rooms.some(
        (r) => Math.abs(px - r.labelX) < 70 && Math.abs(py - r.labelY) < 24
      );
    };

    const isInsideWall = (px, py) => {
      return this.walls.some(
        (w) => px >= w.x - 18 && px <= w.x + w.w + 18 && py >= w.y - 18 && py <= w.y + w.h + 18
      );
    };

    const isOnExisting = (px, py) => {
      return this.items.some((it) => Math.hypot(it.x - px, it.y - py) < 28);
    };

    const labRoom = (this.rooms || []).find((r) => r.id === 'lab');
    const aulaRoom = (this.rooms || []).find((r) => r.id === 'aula');
    const deanRoom = (this.rooms || []).find((r) => r.id === 'dean');

    // 1. Jeśli podano forcedX i forcedY (np. Złote ECTS), akceptujemy tylko gdy nie koliduje z napisami sal ani ścianami
    if (forcedX !== null && forcedY !== null) {
      if (!collidesWithRoomLabel(forcedX, forcedY) && !isInsideWall(forcedX, forcedY) && !isOnExisting(forcedX, forcedY)) {
        x = forcedX;
        y = forcedY;
        valid = true;
      }
    }

    // 2. 60% spawnów Gemini AI pojawia się w Labie / Sali komputerowej 2 (z ominięciem napisu)
    if (!valid && type === 'freeze' && forcedX === null && labRoom && Math.random() < 0.6) {
      while (!valid && attempts < 80) {
        attempts++;
        const testX = labRoom.x + 22 + Math.random() * Math.max(20, labRoom.w - 44);
        const testY = labRoom.y + 22 + Math.random() * Math.max(20, labRoom.h - 44);
        if (!collidesWithRoomLabel(testX, testY) && !isInsideWall(testX, testY) && !isOnExisting(testX, testY)) {
          x = testX;
          y = testY;
          valid = true;
        }
      }
    }

    // 3. Złote ECTS w Auli – jeśli forced coords kolidowały z napisem, szukamy w Auli z ominięciem napisu
    if (!valid && type === 'gold' && aulaRoom) {
      while (!valid && attempts < 100) {
        attempts++;
        const testX = aulaRoom.x + 22 + Math.random() * Math.max(20, aulaRoom.w - 44);
        const testY = aulaRoom.y + 18 + Math.random() * Math.max(20, aulaRoom.h - 36);
        if (!collidesWithRoomLabel(testX, testY) && !isInsideWall(testX, testY) && !isOnExisting(testX, testY)) {
          x = testX;
          y = testY;
          valid = true;
        }
      }
    }

    const isInsideDeanForAnswer = (px, py) => {
      if (type !== 'answer' || !deanRoom) return false;
      return (
        px >= deanRoom.x - 16 &&
        px <= deanRoom.x + deanRoom.w + 16 &&
        py >= deanRoom.y - 16 &&
        py <= deanRoom.y + deanRoom.h + 16
      );
    };

    // 4. Standardowe losowanie na kampusie (nigdy bliżej niż 70 px w poziomie i 24 px w pionie od napisu)
    while (!valid && attempts < 240) {
      attempts++;
      x = 35 + Math.random() * (CANVAS_WIDTH - 70);
      y = 35 + Math.random() * (CANVAS_HEIGHT - 70);

      if (!isInsideWall(x, y) && !isOnExisting(x, y) && !collidesWithRoomLabel(x, y) && !isInsideDeanForAnswer(x, y)) {
        valid = true;
      }
    }

    if (valid) {
      const newItem = {
        type,
        x,
        y,
        radius: type === 'gold' ? 15 : 13,
        pulse: Math.random() * Math.PI * 2,
        lifeTimer: type === 'gold' ? 5.0 : 0 // Złote ECTS znika po 5s
      };
      this.items.push(newItem);
      return newItem;
    }
    return null;
  }

  spawnGoldenEctsInAulaA() {
    const aula = (this.rooms || []).find((r) => r.id === 'aula') || { x: 20, y: 20, w: 200, h: 120, labelX: 120, labelY: 70 };
    let x = aula.x + 25 + Math.random() * Math.max(20, aula.w - 50);
    let y = aula.y + 22 + Math.random() * Math.max(20, aula.h - 44);
    let attempts = 0;
    while (Math.abs(x - aula.labelX) < 70 && Math.abs(y - aula.labelY) < 24 && attempts < 40) {
      x = aula.x + 22 + Math.random() * Math.max(20, aula.w - 44);
      y = aula.y + 18 + Math.random() * Math.max(20, aula.h - 36);
      attempts++;
    }
    const item = this.spawnItem('gold', x, y);
    const finalX = item ? item.x : x;
    const finalY = item ? item.y : y;
    const aulaLabel = this.getCurrentMapConfig().goldenAulaName || 'Auli A';
    this.addFloatingText(`🌟 Złote ECTS w ${aulaLabel}!`, finalX, finalY - 22, '#f2a900');
  }

  // =========================================================================
  // GŁÓWNA PĘTLA GRY (GAME LOOP)
  // =========================================================================
  gameLoop(currentTime) {
    if (this.state !== 'PLAYING') {
      this.rafId = null;
      return;
    }

    const dt = Math.min((currentTime - this.lastLoopTime) / 1000, 0.1);
    this.lastLoopTime = currentTime;

    this.update(dt);
    this.render();

    if (this.state === 'PLAYING') {
      this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    } else {
      this.rafId = null;
    }
  }

  // =========================================================================
  // LOGIKA AKTUALIZACJI STANU GRY
  // =========================================================================
  triggerScreenShake(magnitude, duration) {
    if (!this.screenShakeEnabled) return;
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  triggerHitStop(duration = 0.06) {
    this.hitStopTimer = duration;
  }

  startCaughtSequence(reason) {
    if (this.isCaughtSequence) return;
    this.isCaughtSequence = true;
    this.caughtTimer = 0.4; // 0.4s dramatycznego zwolnienia tempa
    this.caughtMessage = reason;
    soundSystem.play('hit');
    soundSystem.stopMusic();
    this.triggerScreenShake(14, 0.45); // mocne drgania przy złapaniu!
  }

  startFinalPhase() {
    if (this.finalPhase) return;
    const mapCfg = this.getCurrentMapConfig();
    this.finalPhase = true;
    this.finalMaxTime = this.currentSemester === 3 ? 35.0 : 25.0;
    this.finalTimer = this.finalMaxTime;
    this.oralExamSeconds = 0;
    this.oralExamPassed = false;
    if (this.currentMap === 'parter') {
      this.finalTarget = { x: 740, y: 65, w: 40, h: 40 };
    } else {
      this.finalTarget = { ...mapCfg.finalTarget };
    }

    // Usunięcie aktywnego wydarzenia losowego (np. Wizyta Rektora nie trwa w finale)
    if (this.activeEvent) {
      this.endEvent();
    }
    this.rector = null;

    // Usunięcie pozostałych ECTS z planszy i kolejki respawnu (nowe ECTS już się nie pojawiają)
    this.items = this.items.filter(it => it.type !== 'ects' && it.type !== 'gold');
    this.respawnQueue = this.respawnQueue.filter(r => r.type !== 'ects' && r.type !== 'gold');

    // Wszyscy przeciwnicy, którzy jeszcze się nie pojawili, pojawiają się od razu
    if (!this.instructor) {
      this.spawnInstructor();
    }
    if (!this.deanClerk) {
      this.spawnDeanClerk();
    }
    if (!this.securityGuard) {
      this.spawnSecurityGuard();
    }

    // Pani z dziekanatu w finale stoi przed ladą Dziekanatu i patroluje krótszą trasę wokół wejścia (utrudnia dojście)
    if (this.deanClerk) {
      this.deanClerk.patrolPoints = this.currentMap === 'parter'
        ? [
            { x: 630, y: 80 },
            { x: 675, y: 115 },
            { x: 690, y: 75 },
            { x: 640, y: 115 }
          ]
        : mapCfg.deanClerkFinalPatrol.map(pt => ({ ...pt }));
      this.deanClerk.patrolIndex = 0;
      this.deanClerk.path = [];
      this.deanClerk.bfsTimer = 0;
    }

    // Boss finałowy w Semestrze III: Komisja Egzaminacyjna + 3 kartki "Odpowiedzi"
    this.bossAnswersCollected = 0;
    this.bossProjectiles = [];
    if (this.currentSemester === 3) {
      this.spawnBoss();
      for (let i = 0; i < 3; i++) {
        this.spawnItem('answer');
      }
    }

    // Baner na górze: „📝 EGZAMIN USTNY! Zanieś indeks do Dziekanatu!” + odliczanie (25s / 35s w Sem. III)
    if (this.eventBanner) {
      this.eventIcon.textContent = '📝';
      this.eventTitle.textContent = 'EGZAMIN USTNY!';
      this.eventDesc.textContent = this.currentSemester === 3 ? '📄 Odpowiedzi: 0/3' : 'Zanieś indeks do Dziekanatu!';
      this.eventTimer.textContent = `${Math.ceil(this.finalTimer)}s`;
      this.eventBanner.classList.remove('hidden');
    }

    soundSystem.play('event');
    this.triggerScreenShake(8, 0.35);
    this.triggerSpeech(this.examiner, 'prof', '„To jeszcze nie koniec! Czas na egzamin ustny w Dziekanacie!”');
    const finalMsg = this.currentSemester === 3
      ? '📝 EGZAMIN USTNY! Zbierz 3 Odpowiedzi i uciekaj przed Komisją!'
      : '📝 EGZAMIN USTNY! Biegnij do Dziekanatu!';
    this.addFloatingText(finalMsg, this.player.x, this.player.y - 25, '#f59e0b');
  }

  spawnFlyingOrb(startX, startY, text) {
    this.flyingOrbs.push({
      x: startX,
      y: startY,
      startX,
      startY,
      targetX: 190,
      targetY: -15,
      progress: 0,
      text,
      color: '#ffc740'
    });
  }

  updateFlyingOrbs(dt) {
    for (let i = this.flyingOrbs.length - 1; i >= 0; i--) {
      const orb = this.flyingOrbs[i];
      orb.progress += dt * 2.2;
      if (orb.progress >= 1.0) {
        this.flyingOrbs.splice(i, 1);
        continue;
      }
      const t = orb.progress;
      const controlY = Math.min(orb.startY, orb.targetY) - 60;
      orb.x = (1 - t) * (1 - t) * orb.startX + 2 * (1 - t) * t * (orb.startX + (orb.targetX - orb.startX) * 0.5) + t * t * orb.targetX;
      orb.y = (1 - t) * (1 - t) * orb.startY + 2 * (1 - t) * t * controlY + t * t * orb.targetY;
    }
  }

  update(dt) {
    // 1. Drgania ekranu z czasem (dt)
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeMagnitude = 0;
      }
    }

    // 2. Biały błysk z czasem
    if (this.whiteFlashTimer > 0) {
      this.whiteFlashTimer -= dt;
    }

    // 3. Sekwencja złapania przez ciało pedagogiczne (0.4s zwolnionego tempa + zoom + skreślenie)
    if (this.isCaughtSequence) {
      this.caughtTimer -= dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      this.updateFlyingOrbs(dt);
      if (this.caughtTimer <= 0) {
        this.isCaughtSequence = false;
        this.triggerGameOver(this.caughtMessage);
      }
      return;
    }

    // 4. Hit-stop (zamrożenie pozycji na 60 ms przy Złotym ECTS i uderzeniu w tarczę)
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      this.updateFlyingOrbs(dt);
      return;
    }

    // 5. Odliczanie okna czasowego Combo (2.5s)
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    // 5b. Faza finałowa: „Egzamin ustny w Dziekanacie”
    if (this.finalPhase) {
      this.finalTimer -= dt;
      this.oralExamSeconds += dt;
      if (this.eventTimer) {
        this.eventTimer.textContent = `${Math.ceil(Math.max(0, this.finalTimer))}s`;
      }
      if (this.finalTimer <= 0) {
        this.triggerGameOver("Dziekanat zamknięty! Nie zdążyłeś oddać indeksu.");
        return;
      }

      // Sprawdzenie dotarcia do celu (strefa ok. 40x40 przy ladzie w Dziekanacie; w Sem. III po zebraniu 3 odpowiedzi)
      const finalTargetUnlocked = this.currentSemester !== 3 || this.bossAnswersCollected >= 3;
      if (this.finalTarget && this.player && finalTargetUnlocked) {
        const distToTarget = Math.hypot(this.player.x - this.finalTarget.x, this.player.y - this.finalTarget.y);
        if (distToTarget < this.player.radius + 20) {
          this.oralExamPassed = true;
          this.triggerVictory();
          return;
        }
      }
    }

    this.elapsedSeconds += dt;
    this.updateTimeDisplay();

    this.updatePlayer(dt);
    if (this.weather) this.weather.update(dt);
    this.updateEnemiesSpawnProgress();
    this.updateExaminer(dt);
    this.updateInstructor(dt);
    this.updateDeanClerk(dt);
    this.updateSecurityGuard(dt);
    this.updateRector(dt);
    this.updateBoss(dt);
    this.updateBossProjectiles(dt);
    this.updateBushes(dt);
    this.updateItemsAndCollisions(dt);
    this.updateEventsEngine(dt);
    this.updateSpeechBubbles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateFlyingOrbs(dt);
    this.updateAudioAndImmersion();
    this.updateHUD();
  }

  // Progresja pojawiania się nowych przeciwników w zależności od ECTS
  updateEnemiesSpawnProgress() {
    const instThreshold = this.currentSemester === 1 ? 10 : this.currentSemester === 2 ? 5 : 0;
    const deanThreshold = this.currentSemester === 1 ? 20 : this.currentSemester === 2 ? 15 : 0;
    const guardThreshold = this.currentSemester === 1 ? 15 : this.currentSemester === 2 ? 5 : 0;

    if (this.ectsCollected >= instThreshold && !this.instructor) {
      this.spawnInstructor();
    }
    if (this.ectsCollected >= guardThreshold && !this.securityGuard) {
      this.spawnSecurityGuard();
    }
    if (this.ectsCollected >= deanThreshold && !this.deanClerk) {
      this.spawnDeanClerk();
    }
  }

  // 3. STUDENT (GRACZ) - RUCH, STAMINA, KRYJÓWKI, CISZA W BIBLIOTECE & KOLEJKA
  updatePlayer(dt) {
    // Wspólny immunityTimer (po zużyciu Legitymacji) odliczany także w trakcie ogłuszenia
    if (this.player.immunityTimer > 0) {
      this.player.immunityTimer -= dt;
    }

    if (this.player.slowTimer > 0) {
      this.player.slowTimer -= dt;
    }

    if (this.player.deanCooldown > 0) {
      this.player.deanCooldown -= dt;
    }

    // Odliczanie ogłuszenia od Pani z Dziekanatu
    if (this.player.stunTimer > 0) {
      this.player.stunTimer -= dt;
      if (this.player.stunTimer <= 0) {
        this.player.stunTimer = 0;
        this.player.deanImmunityTimer = 3.0; // 3 s, liczony od końca ogłuszenia, chroni tylko przed Panią z dziekanatu
      }
      return; // student stoi w miejscu podczas ogłuszenia, pozostali przeciwnicy mogą go złapać
    }

    if (this.player.deanImmunityTimer > 0) {
      this.player.deanImmunityTimer -= dt;
    }

    // Sprawdzenie czy gracz znajduje się w Bibliotece (Strefa Ciszy)
    const inLibrary = this.isInLibrary(this.player.x, this.player.y);
    this.player.canSprint = !inLibrary;

    let dx = 0;
    let dy = 0;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const isMoving = dx !== 0 || dy !== 0;

    // Obsługa kryjówki w krzakach Patio ALK
    this.updatePlayerBushHiding(isMoving, dt);

    // Obsługa kolejki w Dziekanacie (Podanie o przedłużenie sesji)
    this.updatePlayerDeanQueue(isMoving, dt);

    // Mechanika staminy i prędkości
    let baseSpd = this.player.baseSpeed;
    if (this.player.slowTimer > 0) {
      baseSpd *= 0.5; // spowolnienie po zderzeniu z NPC podczas Przerwy
    }

    if (this.player.boostTimer > 0) {
      this.player.boostTimer -= dt;
      this.player.currentSpeed = this.player.sprintSpeed * 1.25;
      this.player.isSprinting = true;
      this.player.stamina = this.player.maxStamina;
    } else if (this.keys.sprint && isMoving && this.player.canSprint && this.player.stamina > 3) {
      this.sprintUsed = true;
      this.player.stamina = Math.max(0, this.player.stamina - 28 * dt * (this.weather ? this.weather.staminaDrainMul() : 1));
      this.player.currentSpeed = this.player.sprintSpeed * (this.player.slowTimer > 0 ? 0.6 : 1);
      this.player.isSprinting = true;
      soundSystem.playSprint();

      // Ślady kurzu i kroków przy sprincie
      if (Math.random() < 0.45) {
        this.particles.push({
          x: this.player.x - dx * 9,
          y: this.player.y - dy * 9 + 10,
          vx: (Math.random() - 0.5) * 16 - dx * 8,
          vy: (Math.random() - 0.5) * 16 - dy * 8,
          life: 0.28,
          maxLife: 0.28,
          color: 'rgba(203, 213, 225, 0.45)',
          size: 2.5
        });
      }
    } else {
      this.player.isSprinting = false;
      this.player.currentSpeed = baseSpd;
      const regenRate = isMoving ? 16 : 26;
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + regenRate * dt * (this.weather ? this.weather.staminaRegenMul() : 1));
    }

    // Dyszenie przy niskiej staminie (< 20%) podczas marszu/biegu
    if (this.player.stamina < this.player.maxStamina * 0.2 && isMoving) {
      soundSystem.play('breath');
    }

    // Aktualizacja pozycji gracza z kolizjami (ruch mnożony przez dt * 60)
    if (isMoving) {
      const step = this.player.currentSpeed * (dt * 60) * (this.weather ? this.weather.playerSpeedMul() : 1);
      const nextX = this.player.x + dx * step;
      const nextY = this.player.y + dy * step;

      if (!this.checkWallCollision(nextX, this.player.y, this.player.radius)) {
        this.player.x = nextX;
      }
      if (!this.checkWallCollision(this.player.x, nextY, this.player.radius)) {
        this.player.y = nextY;
      }

      this.player.direction = Math.atan2(dy, dx);
      this.player.walkCycle += dt * 10;

      // Zapisujemy pozycję gracza jeśli nie jest ukryty
      if (!this.player.isHidden) {
        this.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };
      }
    }
  }

  // Logika krzaków Patio ALK
  updatePlayerBushHiding(isMoving, dt) {
    let insideBush = null;
    for (const b of this.bushes) {
      if (Math.hypot(this.player.x - b.x, this.player.y - b.y) <= b.radius + 4) {
        insideBush = b;
        break;
      }
    }

    if (insideBush) {
      // Czy przeciwnik w momencie wejścia był dalej niż 150 px i krzak nie ma cooldownu?
      if (!this.player.isHidden && insideBush.cooldown <= 0) {
        const distProf = Math.hypot(this.examiner.x - this.player.x, this.examiner.y - this.player.y);
        const distInst = this.instructor
          ? Math.hypot(this.instructor.x - this.player.x, this.instructor.y - this.player.y)
          : 999;
        const nearestEnemyDist = Math.min(distProf, distInst);

        if (nearestEnemyDist > 150) {
          this.player.isHidden = true;
          this.player.currentBush = insideBush;
          this.player.bushTimer = 0;
          this.bushHidesCount++;
          soundSystem.play('hide');
          const hideMsg = insideBush.kind === 'ficus' ? '🪴 Schowany w donicy!' : '🌿 Schowany w krzakach!';
          this.addFloatingText(hideMsg, this.player.x, this.player.y - 20, '#10b981');
        }
      }

      // Jeżeli już jest ukryty w krzaku: odliczanie 5 sekund do kichnięcia!
      if (this.player.isHidden) {
        this.player.bushTimer += dt;
        if (this.player.bushTimer >= 5.0) {
          // Kichnięcie zdradza pozycję!
          this.player.isHidden = false;
          insideBush.cooldown = 10.0; // cooldown krzaka 10s
          this.player.currentBush = null;
          soundSystem.play('sneeze');
          this.addFloatingText("🤧 Apsik! (Wykryty!)", this.player.x, this.player.y - 25, '#ef4444');
          this.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };
          this.triggerSpeech(this.examiner, 'prof', '„Na zdrowie! Ale egzaminu i tak Pan nie zda!”');
        }
      }
    } else {
      if (this.player.isHidden) {
        if (this.player.currentBush) {
          this.player.currentBush.cooldown = 10.0;
        }
        this.player.isHidden = false;
        this.player.currentBush = null;
        this.player.bushTimer = 0;
      }
    }
  }

  // Logika Dziekanatu - Stanie w kolejce 3s daje Podanie o przedłużenie
  updatePlayerDeanQueue(isMoving, dt) {
    if (this.isInDeanOffice(this.player.x, this.player.y) && !isMoving && this.player.deanCooldown <= 0) {
      this.player.deanStandTimer += dt;

      if (this.player.deanStandTimer >= 3.0) {
        // Przyznanie Podania o przedłużenie!
        this.player.deanStandTimer = 0;
        this.player.deanCooldown = 30.0; // raz na 30s
        this.player.deanPetitionActiveTimer = 15.0; // spowalnia profesora do bazy na 15s

        soundSystem.play('achievement');
        this.addFloatingText("📋 Podanie o przedłużenie przyjęte!", this.player.x, this.player.y - 25, '#ffc740');
        this.triggerSpeech(this.examiner, 'prof', '„Podanie zatwierdzone przez Dziekana... zwalniam procedury na 15s!”');
      }
    } else if (isMoving) {
      this.player.deanStandTimer = 0;
    }

    if (this.player.deanPetitionActiveTimer > 0) {
      this.player.deanPetitionActiveTimer -= dt;
    }
  }

  updateBushes(dt) {
    for (const b of this.bushes) {
      if (b.cooldown > 0) b.cooldown -= dt;
    }
  }

  // =========================================================================
  // 4. PRZECIWNICY: EGZAMINATOR (PROFESOR) - BFS, SZAŁ ŚCIĄGI & ZGUBIENIE POŚCIGU
  // =========================================================================
  updateExaminer(dt) {
    if (this.examiner.rageTimer > 0) {
      this.examiner.rageTimer -= dt;
    }
    if (this.examiner.alarmTimer > 0) {
      this.examiner.alarmTimer -= dt;
    }

    if (this.examiner.freezeTimer > 0) {
      this.examiner.freezeTimer -= dt;
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.examiner.x + (Math.random() - 0.5) * 36,
          y: this.examiner.y + (Math.random() - 0.5) * 36,
          vx: (Math.random() - 0.5) * 35,
          vy: (Math.random() - 0.5) * 35,
          life: 0.25,
          maxLife: 0.25,
          color: '#38bdf8',
          size: 3
        });
      }
      return;
    }

    if (this.isBowingToRector(this.examiner)) {
      return;
    }

    // Określenie celu pościgu
    // Warunek ukrycia: krzak na Patio lub student w Bibliotece i profesor > 120 px od niego
    const distToStudent = Math.hypot(this.player.x - this.examiner.x, this.player.y - this.examiner.y);
    const inLib = this.isInLibrary(this.player.x, this.player.y);
    const lostInLibrary = inLib && !this.isInLibrary(this.examiner.x, this.examiner.y) && distToStudent > 120;
    const isPlayerLost = this.player.isHidden || lostInLibrary;

    let targetX = this.player.x;
    let targetY = this.player.y;

    if (isPlayerLost) {
      // Idzie do ostatniej znanej pozycji
      targetX = this.lastKnownPlayerPos.x;
      targetY = this.lastKnownPlayerPos.y;

      // Jeśli dotarł do ostatniej znanej pozycji, patroluje losową aulę
      if (Math.hypot(this.examiner.x - targetX, this.examiner.y - targetY) < 30) {
        const randomRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        this.lastKnownPlayerPos = { x: randomRoom.labelX, y: randomRoom.labelY };
      }
    }

    // Mgła: z daleka egzaminator goni miejsce, w którym widział studenta chwilę temu
    if (this.weather) {
      const fogTarget = this.weather.adjustEnemyTarget(this.examiner, targetX, targetY);
      targetX = fogTarget.x;
      targetY = fogTarget.y;
    }

    // Wyznaczanie prędkości profesora
    let targetSpeed = this.examiner.baseSpeed + this.ectsCollected * 0.085;
    if (this.player.deanPetitionActiveTimer > 0) {
      targetSpeed = this.examiner.baseSpeed; // Podanie o przedłużenie resetuje do bazy!
    }
    if (this.finalPhase) {
      targetSpeed *= 1.15; // Finał: +15% prędkości egzaminatora!
    }
    if (this.examiner.rageTimer > 0) {
      targetSpeed *= 1.4; // Szał ściągi (+40% prędkości!)
    }
    if (this.examiner.alarmTimer > 0) {
      targetSpeed *= 1.25; // Alarm ochroniarza (+25% prędkości przez 3s!)
    }
    this.examiner.speed = targetSpeed;

    // Przeliczanie ścieżki BFS co 300 ms lub gdy pusta
    this.pathfindingCooldown -= dt;
    if (this.pathfindingCooldown <= 0 || this.examiner.path.length === 0) {
      this.examiner.path = this.findBfsPath(this.examiner.x, this.examiner.y, targetX, targetY);
      this.pathfindingCooldown = 0.3; // 300 ms
    }

    this.followPath(this.examiner, dt);

    // Sprawdzenie kolizji ze studentem
    if (distToStudent < this.player.radius + this.examiner.radius) {
      if (this.player.immunityTimer > 0) return;

      if (this.examiner.rageTimer > 0) {
        // Szał ściągi ignoruje tarczę legitymacji!
        this.startCaughtSequence("Egzaminator wpadł w szał po odkryciu ściągi i natychmiast skreślił Cię z listy studentów!");
        return;
      }

      if (this.player.hasShield) {
        this.player.hasShield = false;
        this.player.immunityTimer = 1.5;
        soundSystem.play('shield');
        this.triggerHitStop(0.06); // Hit-stop 60 ms
        this.whiteFlashTimer = 0.08; // Biały błysk
        this.triggerScreenShake(7, 0.3); // Drgania ekranu
        this.createPickupParticles(this.player.x, this.player.y, '#f2a900');
        // Odrzut profesora (maksymalnie 120 px w krokach co 4 px, zatrzymanie przed kolizją i wyczyszczenie BFS)
        this.applyKnockback(this.examiner, 120);
        this.triggerSpeech(this.examiner, 'prof', '„Pańska legitymacja uratowała Pana tylko na chwilę!”');
      } else {
        this.startCaughtSequence("Egzaminator dogonił Cię i wpisał ocenę niedostateczną!");
      }
    }
  }

  // =========================================================================
  // 5. PROWADZĄCY ĆWICZENIA (ODCINA DROGĘ 4 POLA PRZED STUDENTEM)
  // =========================================================================
  updateInstructor(dt) {
    if (!this.instructor) return;

    if (this.instructor.freezeTimer > 0) {
      this.instructor.freezeTimer -= dt;
      return;
    }

    if (this.isBowingToRector(this.instructor)) {
      return;
    }

    // Prędkość w każdej klatce: 85% aktualnej prędkości egzaminatora (z bonusem za ECTS, bez szału po ściądze)
    let profBaseWithEcts = this.examiner.baseSpeed + this.ectsCollected * 0.085;
    if (this.player.deanPetitionActiveTimer > 0) {
      profBaseWithEcts = this.examiner.baseSpeed;
    }
    this.instructor.speed = profBaseWithEcts * 0.85;

    // Gdy student jest ukryty w krzaku albo w Bibliotece, prowadzący też traci go z oczu i idzie do ostatniej znanej pozycji
    const distToStudent = Math.hypot(this.player.x - this.instructor.x, this.player.y - this.instructor.y);
    const inLib = this.isInLibrary(this.player.x, this.player.y);
    const lostInLibrary = inLib && !this.isInLibrary(this.instructor.x, this.instructor.y) && distToStudent > 120;
    const isPlayerLost = this.player.isHidden || lostInLibrary;

    let targetX = this.player.x;
    let targetY = this.player.y;

    if (isPlayerLost) {
      targetX = this.lastKnownPlayerPos.x;
      targetY = this.lastKnownPlayerPos.y;

      if (Math.hypot(this.instructor.x - targetX, this.instructor.y - targetY) < 30) {
        const randomRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        this.lastKnownPlayerPos = { x: randomRoom.labelX, y: randomRoom.labelY };
      }
    } else {
      // Celuje w punkt 4 pola (80 px) przed studentem w kierunku jego ruchu
      const forwardDist = 80;
      targetX = this.player.x + Math.cos(this.player.direction) * forwardDist;
      targetY = this.player.y + Math.sin(this.player.direction) * forwardDist;

      // Jeżeli punkt trafia w ścianę lub poza mapę, celuje bezpośrednio w studenta
      if (
        this.checkWallCollision(targetX, targetY, 15) ||
        targetX < 30 || targetX > CANVAS_WIDTH - 30 ||
        targetY < 30 || targetY > CANVAS_HEIGHT - 30
      ) {
        targetX = this.player.x;
        targetY = this.player.y;
      }
    }

    // Mgła: z daleka prowadzący też widzi tylko, gdzie student był chwilę temu
    if (this.weather) {
      const fogTarget = this.weather.adjustEnemyTarget(this.instructor, targetX, targetY);
      targetX = fogTarget.x;
      targetY = fogTarget.y;
    }

    // BFS co 300 ms
    if (!this.instructor.bfsTimer) this.instructor.bfsTimer = 0;
    this.instructor.bfsTimer -= dt;
    if (this.instructor.bfsTimer <= 0 || !this.instructor.path || this.instructor.path.length === 0) {
      this.instructor.path = this.findBfsPath(this.instructor.x, this.instructor.y, targetX, targetY);
      this.instructor.bfsTimer = 0.3;
    }

    this.followPath(this.instructor, dt);

    // Kolizja ze studentem
    const dist = Math.hypot(this.player.x - this.instructor.x, this.player.y - this.instructor.y);
    if (dist < this.player.radius + this.instructor.radius) {
      if (this.player.immunityTimer > 0) return;

      if (this.player.hasShield) {
        this.player.hasShield = false;
        this.player.immunityTimer = 1.5;
        soundSystem.play('shield');
        this.triggerHitStop(0.06); // Hit-stop 60 ms
        this.whiteFlashTimer = 0.08; // Biały błysk
        this.triggerScreenShake(7, 0.3); // Drgania ekranu
        this.createPickupParticles(this.player.x, this.player.y, '#10b981');
        this.applyKnockback(this.instructor, 120);
        this.triggerSpeech(this.instructor, 'instructor', '„Legitymacja podbita, ale obecności brak!”');
      } else {
        this.startCaughtSequence("Prowadzący ćwiczenia odciął Ci drogę i wpisał 0 punktów z kolokwium!");
      }
    }
  }

  // =========================================================================
  // 6. PANI Z DZIEKANATU (PATROL PERYMETRU PATIO, OGŁUSZENIE 2S)
  // =========================================================================
  updateDeanClerk(dt) {
    if (!this.deanClerk) return;

    if (this.deanClerk.freezeTimer > 0) {
      this.deanClerk.freezeTimer -= dt;
      return;
    }

    if (this.isBowingToRector(this.deanClerk)) {
      return;
    }

    // Przechodzi między punktami patrolu przez findBfsPath i followPath (omija filary i ściany)
    const targetPt = this.deanClerk.patrolPoints[this.deanClerk.patrolIndex];
    const distToTarget = Math.hypot(targetPt.x - this.deanClerk.x, targetPt.y - this.deanClerk.y);

    if (distToTarget < 16) {
      this.deanClerk.patrolIndex = (this.deanClerk.patrolIndex + 1) % this.deanClerk.patrolPoints.length;
      this.deanClerk.path = [];
      this.deanClerk.bfsTimer = 0;
    }

    if (!this.deanClerk.bfsTimer) this.deanClerk.bfsTimer = 0;
    this.deanClerk.bfsTimer -= dt;
    if (this.deanClerk.bfsTimer <= 0 || !this.deanClerk.path || this.deanClerk.path.length === 0) {
      const curTarget = this.deanClerk.patrolPoints[this.deanClerk.patrolIndex];
      this.deanClerk.path = this.findBfsPath(this.deanClerk.x, this.deanClerk.y, curTarget.x, curTarget.y);
      this.deanClerk.bfsTimer = 0.4;
    }

    this.followPath(this.deanClerk, dt);

    // Dotknięcie nie kończy gry, ale ogłusza studenta na 2s!
    // Chroni przed tym wyłącznie deanImmunityTimer (3s po zakończeniu ogłuszenia)
    const distToPlayer = Math.hypot(this.player.x - this.deanClerk.x, this.player.y - this.deanClerk.y);
    if (distToPlayer < this.player.radius + this.deanClerk.radius) {
      if (this.player.stunTimer <= 0 && this.player.deanImmunityTimer <= 0) {
        this.player.stunTimer = 2.0; // 2 sekundy paraliżu
        this.combo = 1; // reset combo po ogłuszeniu
        this.comboTimer = 0;
        this.triggerScreenShake(4, 0.25); // lekkie drgania przy ogłuszeniu
        soundSystem.play('stun');
        this.addFloatingText("💫 OGŁUSZENIE! (Brak pieczątki)", this.player.x, this.player.y - 25, '#a855f7');
      }
    }
  }

  // =========================================================================
  // 6b. PAN Z OCHRONY (PATROL KORYTARZY, LATARKA I GWIZDEK)
  // =========================================================================
  updateSecurityGuard(dt) {
    if (!this.securityGuard) return;
    const guard = this.securityGuard;

    if (guard.whistleCooldown > 0) guard.whistleCooldown -= dt;
    if (guard.whistleTextTimer > 0) guard.whistleTextTimer -= dt;

    if (guard.freezeTimer > 0) {
      guard.freezeTimer -= dt;
      if (Math.random() < 0.35) {
        this.particles.push({
          x: guard.x + (Math.random() - 0.5) * 34,
          y: guard.y + (Math.random() - 0.5) * 34,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          life: 0.25,
          maxLife: 0.25,
          color: '#38bdf8',
          size: 3
        });
      }
      return;
    }

    if (this.isBowingToRector(guard)) {
      return;
    }

    const targetPt = guard.patrolPoints[guard.patrolIndex];
    if (Math.hypot(targetPt.x - guard.x, targetPt.y - guard.y) < 16) {
      guard.patrolIndex = (guard.patrolIndex + 1) % guard.patrolPoints.length;
      guard.path = [];
      guard.bfsTimer = 0;
    }

    guard.bfsTimer -= dt;
    if (guard.bfsTimer <= 0 || !guard.path || guard.path.length === 0) {
      const curTarget = guard.patrolPoints[guard.patrolIndex];
      guard.path = this.findBfsPath(guard.x, guard.y, curTarget.x, curTarget.y);
      guard.bfsTimer = 0.4;
    }

    this.followPath(guard, dt);

    // Wykrywanie sprintu w snopie latarki (90°, zasięg 150 px) lub z bliska (< 60 px)
    if (this.player && !this.player.isHidden && this.player.isSprinting && guard.whistleCooldown <= 0) {
      const dx = this.player.x - guard.x;
      const dy = this.player.y - guard.y;
      const dist = Math.hypot(dx, dy);
      const angleToPlayer = Math.atan2(dy, dx);
      const angleDiff = Math.abs(Math.atan2(Math.sin(angleToPlayer - guard.angle), Math.cos(angleToPlayer - guard.angle)));

      const inCone = dist <= 150 && angleDiff <= Math.PI / 4;
      const tooClose = dist < 60;

      if (inCone || tooClose) {
        soundSystem.play('whistle');
        guard.whistleCooldown = 6.0;
        guard.whistleText = '„Nie biegamy po korytarzu!”';
        guard.whistleTextTimer = 2.6;
        this.player.slowTimer = Math.max(this.player.slowTimer || 0, 1.5);
        this.addFloatingText('👮 Gwizdek! Zwolnij!', this.player.x, this.player.y - 24, '#60a5fa');

        if (this.examiner) {
          this.examiner.alarmTimer = 3.0;
          this.pathfindingCooldown = 0;
          if (this.examiner.freezeTimer <= 0) {
            let tx = this.player.x;
            let ty = this.player.y;
            if (this.weather) {
              const adjusted = this.weather.adjustEnemyTarget(this.examiner, tx, ty);
              tx = adjusted.x;
              ty = adjusted.y;
            }
            this.examiner.path = this.findBfsPath(this.examiner.x, this.examiner.y, tx, ty);
          }
          this.triggerSpeech(this.examiner, 'prof', '„Ochrona wzywa! Już tam biegnę!”');
        }
      }
    }
  }

  // =========================================================================
  // 6c. WIZYTA REKTORA (SOJUSZNIK PODCZAS WYDARZENIA)
  // =========================================================================
  updateRector(dt) {
    if (!this.rector) return;
    const rector = this.rector;

    if (rector.speechTimer > 0) rector.speechTimer -= dt;

    const targetPt = rector.patrolPoints[rector.patrolIndex];
    if (Math.hypot(targetPt.x - rector.x, targetPt.y - rector.y) < 16) {
      rector.patrolIndex = (rector.patrolIndex + 1) % rector.patrolPoints.length;
      rector.path = [];
      rector.bfsTimer = 0;
    }

    rector.bfsTimer -= dt;
    if (rector.bfsTimer <= 0 || !rector.path || rector.path.length === 0) {
      const curTarget = rector.patrolPoints[rector.patrolIndex];
      rector.path = this.findBfsPath(rector.x, rector.y, curTarget.x, curTarget.y);
      rector.bfsTimer = 0.4;
    }

    this.followPath(rector, dt);

    // Uściśnięcie dłoni Rektorowi (+500 pkt raz na wizytę)
    if (this.player && !rector.shookHand) {
      const dist = Math.hypot(this.player.x - rector.x, this.player.y - rector.y);
      if (dist < this.player.radius + rector.radius) {
        rector.shookHand = true;
        this.score += 500;
        soundSystem.play('achievement');
        this.createPickupParticles(rector.x, rector.y, '#ffc740');
        this.addFloatingText('🤝 Stypendium Rektora! +500 pkt', rector.x, rector.y - 28, '#ffc740');
        rector.speechText = '„Gratuluję wyników!”';
        rector.speechTimer = 2.8;
      }
    }
  }

  // =========================================================================
  // 6d. BOSS FINAŁOWY SEMESTRU III: KOMISJA EGZAMINACYJNA
  // =========================================================================
  updateBoss(dt) {
    if (!this.boss) return;
    const boss = this.boss;

    if (boss.freezeTimer > 0) {
      boss.freezeTimer -= dt;
      if (Math.random() < 0.45) {
        this.particles.push({
          x: boss.x + (Math.random() - 0.5) * 44,
          y: boss.y + (Math.random() - 0.5) * 44,
          vx: (Math.random() - 0.5) * 35,
          vy: (Math.random() - 0.5) * 35,
          life: 0.25,
          maxLife: 0.25,
          color: '#38bdf8',
          size: 3.5
        });
      }
      return;
    }

    if (this.isBowingToRector(boss)) {
      return;
    }

    const distToStudent = Math.hypot(this.player.x - boss.x, this.player.y - boss.y);
    const inLib = this.isInLibrary(this.player.x, this.player.y);
    const lostInLibrary = inLib && !this.isInLibrary(boss.x, boss.y) && distToStudent > 120;
    const isPlayerLost = this.player.isHidden || lostInLibrary;

    let targetX = this.player.x;
    let targetY = this.player.y;
    if (isPlayerLost) {
      targetX = this.lastKnownPlayerPos.x;
      targetY = this.lastKnownPlayerPos.y;
    }

    if (this.weather) {
      const fogTarget = this.weather.adjustEnemyTarget(boss, targetX, targetY);
      targetX = fogTarget.x;
      targetY = fogTarget.y;
    }

    boss.bfsTimer -= dt;
    if (boss.bfsTimer <= 0 || !boss.path || boss.path.length === 0) {
      boss.path = this.findBfsPath(boss.x, boss.y, targetX, targetY);
      boss.bfsTimer = 0.35;
    }

    this.followPath(boss, dt);

    // Strzał wachlarzem 3 pytań „❓” co 2.2 s
    boss.shootTimer -= dt;
    if (boss.shootTimer <= 0) {
      boss.shootTimer = 2.2;
      const aimAngle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
      const spreadOffsets = [-0.25, 0, 0.25];
      for (const offset of spreadOffsets) {
        const a = aimAngle + offset;
        this.bossProjectiles.push({
          x: boss.x + Math.cos(a) * (boss.radius + 4),
          y: boss.y + Math.sin(a) * (boss.radius + 4),
          vx: Math.cos(a) * 3.2,
          vy: Math.sin(a) * 3.2,
          life: 3.0
        });
      }
    }

    // Dotknięcie Komisji = złapanie jak u Egzaminatora (Legitymacja chroni raz)
    if (distToStudent < this.player.radius + boss.radius) {
      if (this.player.immunityTimer > 0) return;

      if (this.player.hasShield) {
        this.player.hasShield = false;
        this.player.immunityTimer = 1.5;
        soundSystem.play('shield');
        this.triggerHitStop(0.06);
        this.whiteFlashTimer = 0.08;
        this.triggerScreenShake(7, 0.3);
        this.createPickupParticles(this.player.x, this.player.y, '#f2a900');
        this.applyKnockback(boss, 120);
      } else {
        this.startCaughtSequence("Komisja Egzaminacyjna jednogłośnie oblała Twój egzamin ustny!");
      }
    }
  }

  updateBossProjectiles(dt) {
    if (!this.bossProjectiles || this.bossProjectiles.length === 0) return;
    const timeScale = dt * 60;

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.life -= dt;

      if (
        p.life <= 0 ||
        p.x < 16 || p.x > CANVAS_WIDTH - 16 ||
        p.y < 16 || p.y > CANVAS_HEIGHT - 16 ||
        this.checkWallCollision(p.x, p.y, 5)
      ) {
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      if (this.player && !this.player.isHidden) {
        const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (dist < this.player.radius + 7) {
          if (this.player.immunityTimer <= 0) {
            this.player.stunTimer = Math.max(this.player.stunTimer || 0, 0.8);
            this.combo = 1;
            this.comboTimer = 0;
            soundSystem.play('stun');
            this.triggerScreenShake(4, 0.2);
            this.addFloatingText('❓ Trudne pytanie!', this.player.x, this.player.y - 24, '#ef4444');
          }
          this.bossProjectiles.splice(i, 1);
        }
      }
    }
  }

  followPath(entity, dt) {
    if (!entity.path || entity.path.length === 0) return;

    const waypoint = entity.path[0];
    const dx = waypoint.x - entity.x;
    const dy = waypoint.y - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      entity.path.shift();
      return;
    }

    entity.angle = Math.atan2(dy, dx);
    const step = entity.speed * (dt * 60) * (this.weather ? this.weather.enemySpeedMul(entity) : 1);
    entity.x += (dx / dist) * step;
    entity.y += (dy / dist) * step;
  }

  // =========================================================================
  // 7. PRZEDMIOTY (RISK & REWARD) & OBSŁUGA ZBIERANIA
  // =========================================================================
  updateItemsAndCollisions(dt) {
    // Odliczanie kolejek respawnu przedmiotów w stanie gry (bez setTimeout, zerowane w startGame)
    for (let q = this.respawnQueue.length - 1; q >= 0; q--) {
      const itemReq = this.respawnQueue[q];
      itemReq.timer -= dt;
      if (itemReq.timer <= 0) {
        if (this.state === 'PLAYING') {
          // W fazie finałowej nowe ECTS już się nie pojawiają
          if (itemReq.type === 'ects') {
            if (!this.finalPhase) this.spawnItem('ects');
          } else if (itemReq.type === 'coffee') {
            this.spawnItem('coffee');
          } else if (itemReq.type === 'freeze') {
            this.spawnItem('freeze');
          } else if (itemReq.type === 'shield') {
            this.spawnItem('shield');
          } else if (itemReq.type === 'cheat' && !this.finalPhase && Math.random() < 0.5) {
            this.spawnItem('cheat');
          }
        }
        this.respawnQueue.splice(q, 1);
      }
    }

    // Spawnowanie Złotego ECTS w Auli A co 20 s (tylko przed finałem)
    if (!this.finalPhase) {
      this.goldenSpawnTimer -= dt;
      if (this.goldenSpawnTimer <= 0) {
        this.spawnGoldenEctsInAulaA();
        this.goldenSpawnTimer = 20.0;
      }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.pulse = (item.pulse + 0.06) % (Math.PI * 2);

      // Złote ECTS znika po 5 s
      if (item.type === 'gold') {
        item.lifeTimer -= dt;
        if (item.lifeTimer <= 0) {
          this.items.splice(i, 1);
          continue;
        }
      }

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < this.player.radius + item.radius) {
        this.itemsCollectedCount++;
        // Mnożnik wejściówki: podwójne punkty ECTS podczas wydarzenia
        const multiplier = this.activeEvent && this.activeEvent.id === 'quiz' ? 2 : 1;

        if (item.type === 'ects') {
          // Zwiększenie Combo za szybkie zbieranie (< 2.5 s)
          if (this.comboTimer > 0) {
            this.combo = Math.min(5, this.combo + 1);
          } else {
            this.combo = 1;
          }
          this.comboTimer = 2.5;
          this.maxCombo = Math.max(this.maxCombo, this.combo);

          const pts = 1 * multiplier;
          this.ectsCollected += pts;
          const scoreEarned = Math.round(100 * this.combo * (this.weather ? this.weather.scoreMul() : 1));
          this.score += scoreEarned;

          soundSystem.play('ects', this.combo);
          this.createPickupParticles(item.x, item.y, '#f2a900');
          this.spawnFlyingOrb(item.x, item.y, `+${pts}`);

          if (this.combo > 1) {
            this.addFloatingText(`🔥 COMBO x${this.combo}! (+${scoreEarned} pkt)`, item.x, item.y - 20, '#ffc740');
          } else {
            this.addFloatingText(`+${pts} ECTS (+${scoreEarned} pkt)`, item.x, item.y - 15, '#f2a900');
          }

          if (this.ectsCollected >= TARGET_ECTS) {
            if (!this.finalPhase) {
              this.startFinalPhase();
              return;
            }
          }
        } else if (item.type === 'gold') {
          // Złote ECTS (+3 pkt)
          if (this.comboTimer > 0) {
            this.combo = Math.min(5, this.combo + 1);
          } else {
            this.combo = 1;
          }
          this.comboTimer = 2.5;
          this.maxCombo = Math.max(this.maxCombo, this.combo);

          const pts = 3 * multiplier;
          this.ectsCollected += pts;
          this.goldEctsCollected++;
          const scoreEarned = Math.round(300 * this.combo * (this.weather ? this.weather.scoreMul() : 1));
          this.score += scoreEarned;

          soundSystem.play('gold');
          this.triggerHitStop(0.06); // 60 ms hit-stop
          this.whiteFlashTimer = 0.08; // Biały błysk
          this.triggerScreenShake(5, 0.2); // Lekkie drgania
          this.createPickupParticles(item.x, item.y, '#ffd700');
          this.spawnFlyingOrb(item.x, item.y, `+${pts}`);

          if (this.combo > 1) {
            this.addFloatingText(`🌟 COMBO x${this.combo}! (+${scoreEarned} pkt)`, item.x, item.y - 20, '#ffd700');
          } else {
            this.addFloatingText(`🌟 +${pts} ZŁOTE ECTS! (+${scoreEarned} pkt)`, item.x, item.y - 18, '#ffc740');
          }

          if (this.ectsCollected >= TARGET_ECTS) {
            if (!this.finalPhase) {
              this.startFinalPhase();
              return;
            }
          }
        } else if (item.type === 'cheat') {
          // Ściąga (+3 ECTS, stałe 200 pkt, ale szał profesora na 5s)
          const pts = 3 * multiplier;
          this.ectsCollected += pts;
          this.cheatsCollected++;
          this.score += 200;
          this.examiner.rageTimer = 5.0; // szał!
          soundSystem.play('cheat');
          this.triggerScreenShake(6, 0.25);
          this.createPickupParticles(item.x, item.y, '#ef4444');
          this.spawnFlyingOrb(item.x, item.y, `+${pts}`);
          this.addFloatingText(`📝 +${pts} ECTS (+200 pkt, SZAŁ!)`, item.x, item.y - 18, '#ef4444');
          this.triggerSpeech(this.examiner, 'prof', '„Co Pan tam chowa?! Czerwony długopis idzie w ruch!”');

          if (this.ectsCollected >= TARGET_ECTS) {
            if (!this.finalPhase) {
              this.startFinalPhase();
              return;
            }
          }
        } else if (item.type === 'coffee') {
          // Malejąca użyteczność krańcowa: 5s, 4s, 3s, min. 2s
          this.coffeesDrunk++;
          this.score += 50;
          let duration = 5.0;
          if (this.coffeesDrunk === 2) duration = 4.0;
          else if (this.coffeesDrunk === 3) duration = 3.0;
          else if (this.coffeesDrunk > 3) duration = 2.0;

          const upgrades = this.loadUpgrades();
          duration += upgrades.thermos * 1.0;

          this.player.boostTimer = duration;
          soundSystem.play('coffee');
          this.createPickupParticles(item.x, item.y, '#10b981');
          if (this.coffeesDrunk >= 2) {
            this.addFloatingText("☕ Malejąca użyteczność krańcowa! (+50 pkt)", item.x, item.y - 15, '#10b981');
          } else {
            this.addFloatingText("☕ Turbo Kawa! (+50 pkt)", item.x, item.y - 15, '#10b981');
          }
        } else if (item.type === 'freeze') {
          // Gemini AI: paraliżuje wszystkich przeciwników na 3.5s!
          this.geminiCollected++;
          this.score += 50;
          this.examiner.freezeTimer = 3.5;
          if (this.instructor) this.instructor.freezeTimer = 3.5;
          if (this.deanClerk) this.deanClerk.freezeTimer = 3.5;
          if (this.securityGuard) this.securityGuard.freezeTimer = 3.5;
          if (this.boss) this.boss.freezeTimer = 3.5;

          soundSystem.play('freeze');
          this.createPickupParticles(item.x, item.y, '#38bdf8');
          this.addFloatingText("💻 Gemini AI: Wszyscy zamrożeni! (+50 pkt)", item.x, item.y - 15, '#38bdf8');
          this.triggerSpeech(this.examiner, 'prof', '„Czy ten esej pisał Pan, czy ChatGPT?!”');
        } else if (item.type === 'shield') {
          this.player.hasShield = true;
          this.score += 50;
          soundSystem.play('shield');
          this.createPickupParticles(item.x, item.y, '#004b87');
          this.addFloatingText("🪪 Tarcza Legitymacji ALK! (+50 pkt)", item.x, item.y - 15, '#38bdf8');
        } else if (item.type === 'answer') {
          this.bossAnswersCollected++;
          this.score += 100;
          soundSystem.play('ects', Math.min(3, this.bossAnswersCollected));
          this.createPickupParticles(item.x, item.y, '#38bdf8');
          this.addFloatingText(`📄 Odpowiedź ${this.bossAnswersCollected}/3 (+100 pkt)`, item.x, item.y - 16, '#38bdf8');
          if (this.eventDesc && this.finalPhase) {
            if (this.bossAnswersCollected >= 3) {
              this.eventDesc.textContent = 'Zanieś indeks do Dziekanatu!';
              this.addFloatingText('🔓 Dziekanat odblokowany! Biegnij!', this.player.x, this.player.y - 32, '#ffc740');
            } else {
              this.eventDesc.textContent = `📄 Odpowiedzi: ${this.bossAnswersCollected}/3`;
            }
          }
        }

        const collectedType = item.type;
        this.items.splice(i, 1);

        // Respawn przedmiotów: w finale ECTS i odpowiedzi nie wracają do kolejki
        if (collectedType !== 'answer' && (!this.finalPhase || (collectedType !== 'ects' && collectedType !== 'gold' && collectedType !== 'cheat'))) {
          this.respawnQueue.push({
            type: collectedType,
            timer: collectedType === 'ects' ? 2.5 : 6.0
          });
        }
      }
    }
  }

  // =========================================================================
  // 8. SYSTEM LOSOWYCH WYDARZEŃ (AWARIA PRĄDU, PRZERWA, WEJŚCIÓWKA)
  // =========================================================================
  updateEventsEngine(dt) {
    if (this.finalPhase) return;
    if (this.activeEvent) {
      this.activeEvent.duration -= dt;
      if (this.eventTimer) {
        this.eventTimer.textContent = `${Math.ceil(this.activeEvent.duration)}s`;
      }

      if (this.activeEvent.id === 'break') {
        this.updateNpcStudents(dt);
      }

      if (this.activeEvent.duration <= 0) {
        this.endEvent();
      }
    } else {
      this.eventSchedulerTimer -= dt;
      if (this.eventSchedulerTimer <= 0) {
        this.triggerRandomEvent();
        const nextInterval = this.currentSemester === 2 ? 25 + Math.random() * 10 : 30 + Math.random() * 15;
        this.eventSchedulerTimer = nextInterval;
      }
    }
  }

  triggerRandomEvent() {
    const events = [
      {
        id: 'blackout',
        icon: '⚡',
        name: 'Awaria prądu!',
        desc: 'Ciemność na kampusie! Promień latarki 110 px i czerwone spojrzenia!'
      },
      {
        id: 'break',
        icon: '👥',
        name: 'Przerwa między zajęciami!',
        desc: 'Tłum studentów na korytarzach! Zderzenie spowalnia o 50%!'
      },
      {
        id: 'quiz',
        icon: '📝',
        name: 'Wejściówka!',
        desc: 'Szybkie pytania! Podwójne punkty ECTS przez 10 sekund!'
      },
      {
        id: 'rector',
        icon: '🎩',
        name: 'Wizyta Rektora!',
        desc: 'Wszyscy wykładowcy kłaniają się Rektorowi! Uściśnij mu dłoń: +500 pkt'
      }
    ];

    // Podczas burzy awarie prądu zdarzają się częściej
    const stormBlackout = this.weather && this.weather.type === 'storm' && Math.random() < 0.4;
    const ev = stormBlackout ? events[0] : events[Math.floor(Math.random() * events.length)];
    this.activeEvent = {
      ...ev,
      duration: 10.0,
      maxDuration: 10.0
    };

    soundSystem.play('event');
    this.showEventBanner(this.activeEvent);

    if (ev.id === 'break') {
      this.spawnNpcStudents();
    } else if (ev.id === 'rector') {
      this.spawnRector();
    }
  }

  endEvent() {
    this.activeEvent = null;
    this.npcs = [];
    this.rector = null;
    this.hideEventBanner();
  }

  showEventBanner(ev) {
    if (!this.eventBanner) return;
    this.eventIcon.textContent = ev.icon;
    this.eventTitle.textContent = ev.name;
    this.eventDesc.textContent = ev.desc;
    this.eventTimer.textContent = `${Math.ceil(ev.duration)}s`;
    this.eventBanner.classList.remove('hidden');
  }

  hideEventBanner() {
    if (this.eventBanner) {
      this.eventBanner.classList.add('hidden');
    }
  }

  spawnNpcStudents() {
    this.npcs = [];
    const freeCells = [];
    if (this.grid && this.grid.length) {
      for (let c = 2; c < COLS - 2; c++) {
        for (let r = 2; r < ROWS - 2; r++) {
          if (!this.grid[c][r]) {
            const cx = c * GRID_SIZE + GRID_SIZE / 2;
            const cy = r * GRID_SIZE + GRID_SIZE / 2;
            // Z dala od ścian (margines 22 px) i krawędzi mapy
            if (!this.checkWallCollision(cx, cy, 22) && cx >= 50 && cx <= CANVAS_WIDTH - 50 && cy >= 50 && cy <= CANVAS_HEIGHT - 50) {
              freeCells.push({ x: cx, y: cy });
            }
          }
        }
      }
    }

    const count = 7;
    for (let i = 0; i < count; i++) {
      let x = 240 + Math.random() * 320;
      let y = 100 + Math.random() * 340;
      if (freeCells.length > 0) {
        const picked = freeCells[Math.floor(Math.random() * freeCells.length)];
        x = picked.x;
        y = picked.y;
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 0.8;
      this.npcs.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 12,
        color: ['#0284c7', '#0d9488', '#eab308', '#ec4899'][i % 4]
      });
    }
  }

  updateNpcStudents(dt) {
    if (this.npcCrowdTextTimer > 0) {
      this.npcCrowdTextTimer -= dt;
    }

    const timeScale = dt * 60;
    for (const npc of this.npcs) {
      const prevX = npc.x;
      const prevY = npc.y;

      // Ruch w osi X: przy kolizji cofamy do poprzedniej pozycji przed odbiciem
      npc.x += npc.vx * timeScale;
      if (this.checkWallCollision(npc.x, npc.y, npc.radius) || npc.x < 30 || npc.x > CANVAS_WIDTH - 30) {
        npc.x = prevX;
        npc.vx *= -1;
      }

      // Ruch w osi Y: przy kolizji cofamy do poprzedniej pozycji przed odbiciem
      npc.y += npc.vy * timeScale;
      if (this.checkWallCollision(npc.x, npc.y, npc.radius) || npc.y < 30 || npc.y > CANVAS_HEIGHT - 30) {
        npc.y = prevY;
        npc.vy *= -1;
      }

      // Kolizja ze studentem -> spowolnienie o 50% na 1 s, napis max raz na sekundę
      const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dist < this.player.radius + npc.radius) {
        this.player.slowTimer = 1.0;
        if (this.npcCrowdTextTimer <= 0) {
          this.addFloatingText("Tłok! -50%", npc.x, npc.y - 12, '#f59e0b');
          this.npcCrowdTextTimer = 1.0;
        }
      }
    }
  }

  // =========================================================================
  // DYMKI KOMIKSOWE POSTACI (POZYCJONOWANE PRZY POSTACIACH)
  // =========================================================================
  triggerSpeech(entity, type, forcedText) {
    if (!this.quotesEnabled || !entity) return;

    let quotesArray = PROF_QUOTES;
    let bubbleEl = this.speechBubbleProf;
    let quoteEl = this.speechQuoteProf;

    if (type === 'instructor') {
      quotesArray = INSTRUCTOR_QUOTES;
      bubbleEl = this.speechBubbleInst;
      quoteEl = this.speechQuoteInst;
    } else if (type === 'dean') {
      quotesArray = DEAN_QUOTES;
      bubbleEl = this.speechBubbleDean;
      quoteEl = this.speechQuoteDean;
    }

    const text = forcedText || quotesArray[Math.floor(Math.random() * quotesArray.length)];
    entity.speechText = text;
    entity.speechTimer = 3.5;

    if (quoteEl) quoteEl.textContent = text;
    this.updateSingleBubblePosition(bubbleEl, entity);
    if (bubbleEl) bubbleEl.classList.remove('hidden');
  }

  updateSpeechBubbles(dt) {
    const list = [
      { entity: this.examiner, bubble: this.speechBubbleProf },
      { entity: this.instructor, bubble: this.speechBubbleInst },
      { entity: this.deanClerk, bubble: this.speechBubbleDean }
    ];

    for (const item of list) {
      if (item.entity && item.bubble) {
        if (item.entity.speechTimer > 0) {
          item.entity.speechTimer -= dt;
          this.updateSingleBubblePosition(item.bubble, item.entity);
          if (item.entity.speechTimer <= 0) {
            item.bubble.classList.add('hidden');
          }
        }
      }
    }
  }

  updateSingleBubblePosition(bubbleEl, entity) {
    if (!bubbleEl || !entity) return;

    const containerWidth =
      (this.viewport && this.viewport.clientWidth) ||
      (this.canvas && this.canvas.clientWidth) ||
      CANVAS_WIDTH;
    const containerHeight =
      (this.viewport && this.viewport.clientHeight) ||
      (this.canvas && this.canvas.clientHeight) ||
      CANVAS_HEIGHT;

    const charPxX = (entity.x / CANVAS_WIDTH) * containerWidth;
    const charPxY = (entity.y / CANVAS_HEIGHT) * containerHeight;

    const bubbleWidth = bubbleEl.offsetWidth || 180;
    const bubbleHeight = bubbleEl.offsetHeight || 60;
    const margin = 6;
    const halfBubble = bubbleWidth / 2;

    const minCenter = margin + halfBubble;
    const maxCenter = containerWidth - margin - halfBubble;

    let bubbleCenterPx;
    if (maxCenter >= minCenter) {
      bubbleCenterPx = Math.max(minCenter, Math.min(maxCenter, charPxX));
    } else {
      bubbleCenterPx = containerWidth / 2;
    }

    bubbleEl.style.left = `${bubbleCenterPx}px`;
    bubbleEl.style.right = 'auto';

    // Trójkątny wskaźnik ma dalej celować w postać, nawet gdy dymek jest przesunięty
    const bubbleLeftPx = bubbleCenterPx - halfBubble;
    const tailOffsetPx = charPxX - bubbleLeftPx;
    const minTailX = 14;
    const maxTailX = Math.max(minTailX, bubbleWidth - 14);
    const clampedTailX = Math.max(minTailX, Math.min(maxTailX, tailOffsetPx));

    bubbleEl.style.setProperty('--tail-x', `${clampedTailX}px`);
    const tailEl = bubbleEl.querySelector('.speech-tail');
    if (tailEl) {
      tailEl.style.left = `${clampedTailX}px`;
    }

    // Decyzja czy dymek jest nad czy pod postacią na podstawie pikseli i rzeczywistej wysokości dymka (offsetHeight):
    // Dymek nad postacią ma kotwicę w charPxY - 28 (w CSS: transform: translate(-50%, -100%)).
    // Jego górna krawędź to charPxY - 28 - bubbleHeight.
    // Jeśli wyszedłby ponad górną krawędź z marginesem 6 px (< 6), umieszczamy go pod postacią.
    const wouldOverflowTop = charPxY - 28 - bubbleHeight < margin;

    if (wouldOverflowTop) {
      bubbleEl.classList.add('bubble-below');
      // Dymek pod postacią: transform: translate(-50%, 0), top to górna krawędź dymka
      const targetTop = charPxY + 34;
      const minTop = margin;
      const maxTop = Math.max(minTop, containerHeight - margin - bubbleHeight);
      const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop));
      bubbleEl.style.top = `${clampedTop}px`;
    } else {
      bubbleEl.classList.remove('bubble-below');
      // Dymek nad postacią: transform: translate(-50%, -100%), top to dolna krawędź dymka
      const targetTop = charPxY - 28;
      const minTop = margin + bubbleHeight;
      const maxTop = Math.max(minTop, containerHeight - margin);
      const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop));
      bubbleEl.style.top = `${clampedTop}px`;
    }
  }

  // =========================================================================
  // IMMERSJA: BICIE SERCA (HEARTBEAT) & TRZĘSIENIE EKRANU (SCREEN SHAKE)
  // =========================================================================
  updateAudioAndImmersion() {
    if (this.state !== 'PLAYING') return;

    const distProf = Math.hypot(this.player.x - this.examiner.x, this.player.y - this.examiner.y);
    const distInst = this.instructor
      ? Math.hypot(this.player.x - this.instructor.x, this.player.y - this.instructor.y)
      : 999;
    const closestEnemyDist = Math.min(distProf, distInst);

    // 1. Dźwięk bicia serca gdy profesor zbliży się na < 200 px
    if (distProf < 200) {
      const distFactor = Math.max(0, Math.min(1, distProf / 200));
      soundSystem.play('heartbeat', distFactor);
    }

    // 2. Aktualizacja intensywności muzyki 8-bit chiptune
    if (this.finalPhase) {
      soundSystem.updateMusicIntensity(0, true);
    } else {
      soundSystem.updateMusicIntensity(distProf, this.examiner.rageTimer > 0);
    }

    // 3. Trzęsienie ekranu gdy przeciwnik zbliży się na < 80 px
    if (this.viewport) {
      if (this.screenShakeEnabled && closestEnemyDist < 80) {
        this.viewport.classList.add('screen-shake');
      } else {
        this.viewport.classList.remove('screen-shake');
      }
    }
  }

  // =========================================================================
  // CZĄSTECZKI & PŁYWAJĄCE NAPISY (FLOATING TEXTS)
  // =========================================================================
  createPickupParticles(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 40 + Math.random() * 55;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -22,
      color,
      life: 1.2,
      maxLife: 1.2
    });
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  // =========================================================================
  // AKTUALIZACJA HUD
  // =========================================================================
  formatTime(seconds) {
    const totalSecs = Math.floor(Number(seconds) || 0);
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  updateTimeDisplay() {
    if (this.hudTimeVal) this.hudTimeVal.textContent = this.formatTime(this.elapsedSeconds);
  }

  updateHUD() {
    if (this.hudEctsVal) {
      const currentVal = String(this.ectsCollected);
      if (this.hudEctsVal.textContent !== currentVal) {
        this.hudEctsVal.textContent = currentVal;
        this.hudEctsVal.classList.remove('ects-pop');
        void this.hudEctsVal.offsetWidth;
        this.hudEctsVal.classList.add('ects-pop');
      }
    }

    if (this.hudScoreVal) {
      this.hudScoreVal.textContent = `${this.score.toLocaleString('pl-PL')} pkt`;
    }

    if (this.hudComboContainer && this.hudComboFill) {
      if (this.comboTimer > 0 && this.combo > 1) {
        this.hudComboContainer.classList.remove('hidden');
        const pct = Math.max(0, Math.min(100, (this.comboTimer / 2.5) * 100));
        this.hudComboFill.style.width = `${pct}%`;
      } else {
        this.hudComboContainer.classList.add('hidden');
      }
    }

    const staminaPct = Math.round((this.player.stamina / this.player.maxStamina) * 100);
    if (this.hudStaminaVal) this.hudStaminaVal.textContent = `${staminaPct}%`;
    if (this.staminaFill) this.staminaFill.style.width = `${staminaPct}%`;

    // Pulsujący pasek staminy przy niskim poziomie (< 20%)
    if (this.hudStaminaContainer) {
      if (staminaPct < 20) {
        this.hudStaminaContainer.classList.add('stamina-critical');
      } else {
        this.hudStaminaContainer.classList.remove('stamina-critical');
      }
    }

    // Stan wyłączonego sprintu w Bibliotece
    if (this.player && !this.player.canSprint) {
      if (this.hudStaminaContainer) this.hudStaminaContainer.classList.add('stamina-disabled');
      if (this.btnTouchSprint) this.btnTouchSprint.classList.add('disabled');
      if (this.hudStaminaLabel) this.hudStaminaLabel.textContent = 'Cisza w bibliotece';
    } else {
      if (this.hudStaminaContainer) this.hudStaminaContainer.classList.remove('stamina-disabled');
      if (this.btnTouchSprint) this.btnTouchSprint.classList.remove('disabled');
      if (this.hudStaminaLabel) this.hudStaminaLabel.textContent = 'Stamina';
    }

    // Dynamiczny badge statusu
    if (this.finalPhase) {
      this.hudStatusBadge.textContent = `📝 Egzamin ustny (${Math.ceil(Math.max(0, this.finalTimer))}s) – Dziekanat!`;
      this.hudStatusBadge.className = 'status-badge status-alert';
    } else if (this.player.stunTimer > 0) {
      this.hudStatusBadge.textContent = '💫 Ogłuszenie (Pani z dziekanatu)';
      this.hudStatusBadge.className = 'status-badge status-alert';
    } else if (this.player.isHidden) {
      this.hudStatusBadge.textContent = this.getCurrentMapConfig().hideHudLabel || '🌿 Ukryty w Patio (5s do kichnięcia)';
      this.hudStatusBadge.className = 'status-badge status-sprint';
    } else if (this.isInLibrary(this.player.x, this.player.y)) {
      this.hudStatusBadge.textContent = '🤫 Cisza w bibliotece (Radar czysty)';
      this.hudStatusBadge.className = 'status-badge status-normal';
    } else if (this.examiner.rageTimer > 0) {
      this.hudStatusBadge.textContent = '🔥 SZAŁ PROFESORA (Ściąga!)';
      this.hudStatusBadge.className = 'status-badge status-alert';
    } else if (this.player.boostTimer > 0) {
      this.hudStatusBadge.textContent = '☕ Turbo Kawa z Patio ALK';
      this.hudStatusBadge.className = 'status-badge status-sprint';
    } else if (this.player.hasShield) {
      this.hudStatusBadge.textContent = '🪪 Legitymacja ALK (Tarcza)';
      this.hudStatusBadge.className = 'status-badge status-sprint';
    } else if (this.player.isSprinting) {
      this.hudStatusBadge.textContent = '⚡ Sprint po kampusie';
      this.hudStatusBadge.className = 'status-badge status-sprint';
    } else {
      this.hudStatusBadge.textContent = this.weather ? `📅 ${this.weather.getCalendarStatus()}` : `Sesja semestru ${this.currentSemester === 1 ? 'I' : this.currentSemester === 2 ? 'II' : 'III'} trwa`;
      this.hudStatusBadge.className = 'status-badge status-normal';
    }
  }

  // =========================================================================
  // OBSŁUGA PORAŻKI I ZWYCIĘSTWA (OCENY, REKORDY, OSIĄGNIĘCIA)
  // =========================================================================
  triggerGameOver(customReason) {
    this.state = 'GAME_OVER';
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.modalPause) {
      this.modalPause.classList.add('hidden');
      this.modalPause.classList.remove('active');
    }
    if (this.modalSettings) {
      this.modalSettings.classList.add('hidden');
      this.modalSettings.classList.remove('active');
    }
    if (this.modalTutorial) {
      this.modalTutorial.classList.add('hidden');
      this.modalTutorial.classList.remove('active');
    }
    if (this.modalEnemies) {
      this.modalEnemies.classList.add('hidden');
      this.modalEnemies.classList.remove('active');
    }
    if (this.modalShop) {
      this.modalShop.classList.add('hidden');
      this.modalShop.classList.remove('active');
    }
    soundSystem.play('hit');
    soundSystem.stopMusic();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();

    this.gameoverEcts.textContent = `${this.ectsCollected} / ${TARGET_ECTS}`;
    this.gameoverTime.textContent = this.formatTime(this.elapsedSeconds);
    if (this.gameoverScore) this.gameoverScore.textContent = `${this.score.toLocaleString('pl-PL')} pkt`;
    if (this.gameoverCombo) this.gameoverCombo.textContent = `x${this.maxCombo}`;
    if (this.gameoverItems) this.gameoverItems.textContent = String(this.itemsCollectedCount);
    if (this.gameoverSubtitle && customReason) this.gameoverSubtitle.textContent = customReason;

    // Naliczanie Stypendium (raz na grę)
    this.grantEndGameStipend(false, '');

    // Etap 4: Ocena gwiazdkowa dla porażki (0 gwiazdek)
    this.renderStars(this.gameoverStars, 0);

    this.modalGameOver.classList.remove('hidden');
    this.modalGameOver.classList.add('active');
  }

  triggerVictory() {
    this.state = 'VICTORY';
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.modalPause) {
      this.modalPause.classList.add('hidden');
      this.modalPause.classList.remove('active');
    }
    if (this.modalSettings) {
      this.modalSettings.classList.add('hidden');
      this.modalSettings.classList.remove('active');
    }
    if (this.modalTutorial) {
      this.modalTutorial.classList.add('hidden');
      this.modalTutorial.classList.remove('active');
    }
    if (this.modalEnemies) {
      this.modalEnemies.classList.add('hidden');
      this.modalEnemies.classList.remove('active');
    }
    if (this.modalShop) {
      this.modalShop.classList.add('hidden');
      this.modalShop.classList.remove('active');
    }
    soundSystem.play('win');
    soundSystem.stopMusic();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();

    const timeStr = this.formatTime(this.elapsedSeconds);
    const finalGrade = this.calculateGrade(this.elapsedSeconds);

    // Premia za zdany egzamin ustny (+1000 pkt)
    if (this.finalPhase || this.oralExamPassed) {
      this.score += 1000;
    }

    // Bonus za czas: max(0, 240 - floor(sekundy)) * 10
    const timeBonus = Math.max(0, 240 - Math.floor(this.elapsedSeconds)) * 10;
    this.score += timeBonus;

    this.victoryEcts.textContent = `${this.ectsCollected} / ${TARGET_ECTS}`;
    this.victoryTime.textContent = timeStr;
    this.victoryGrade.textContent = finalGrade;

    if (this.victoryScore) {
      this.victoryScore.textContent = `${this.score.toLocaleString('pl-PL')} pkt`;
    }
    if (this.victoryTimeBonus) {
      const weatherInfo = this.weather ? this.weather.getInfo() : null;
      const weatherNote = weatherInfo && weatherInfo.scoreMul > 1 ? ` · ${weatherInfo.icon} premia pogodowa ${formatWeatherMul(weatherInfo.scoreMul)} za ECTS` : '';
      this.victoryTimeBonus.textContent = `Bonus: +${timeBonus.toLocaleString('pl-PL')} pkt${weatherNote}`;
    }
    if (this.victoryCombo) {
      this.victoryCombo.textContent = `x${this.maxCombo}`;
    }
    if (this.victoryItems) {
      this.victoryItems.textContent = String(this.itemsCollectedCount);
    }
    if (this.victoryOralTime) {
      const oralSecs = Math.max(1, Math.round(this.oralExamSeconds));
      this.victoryOralTime.textContent = `Zdany w ${oralSecs}s`;
    }

    // Etap 4: Ocena gwiazdkowa dla wygranej (1-3 gwiazdki)
    const stars = this.calculateStars(true, this.score, finalGrade);
    this.renderStars(this.victoryStars, stars);

    // Obsługa semestru III („Sesja poprawkowa” -> „Dyplom ALK”)
    if (this.currentSemester === 3) {
      this.victoryTitle.textContent = "🎓 Dyplom ALK Zdobyty! 🎓";
      this.victorySubtitle.textContent = "Przeszedłeś całą sesję poprawkową, obroniłeś indeks w Dziekanacie i ukończyłeś Akademię z wyróżnieniem!";
      this.victoryQuote.textContent = "Rektor osobiście wręcza Ci dyplom ukończenia studiów z czerwonym paskiem!";
      if (this.btnNextSemester) this.btnNextSemester.textContent = "🎓 Rozpocznij od nowa";
    } else {
      this.victoryTitle.textContent = `Semestr ${this.currentSemester === 1 ? 'I' : 'II'} Zaliczony!`;
      this.victorySubtitle.textContent = "Udało Ci się uzbierać 30 ECTS, zdać egzamin ustny i uciec na zasłużone wakacje!";
      this.victoryQuote.textContent = "Indeks podbity, egzaminator schował czerwony długopis do kieszeni. Jesteś dumą ALK!";
      if (this.btnNextSemester) this.btnNextSemester.textContent = `🎓 Przejdź do Semestru ${this.currentSemester + 1}`;
    }

    // Sprawdzenie i zapisanie rekordu (czas, ocena, wynik) — przed sprawdzeniem odblokowania Togi!
    const isNewRecord = this.saveBestRecord(this.currentSemester, this.elapsedSeconds, finalGrade, this.score);
    if (this.newRecordBadge) {
      if (isNewRecord) {
        this.newRecordBadge.classList.remove('hidden');
      } else {
        this.newRecordBadge.classList.add('hidden');
      }
    }

    // Naliczanie Stypendium (raz na grę)
    this.grantEndGameStipend(true, finalGrade);

    // Sprawdzenie i odblokowanie osiągnięć
    this.evaluateAchievements();

    this.modalVictory.classList.remove('hidden');
    this.modalVictory.classList.add('active');
  }

  calculateGrade(seconds) {
    if (seconds <= 120) return "5.0 (Bardzo dobry)";
    if (seconds <= 150) return "4.5 (Dobry plus)";
    if (seconds <= 180) return "4.0 (Dobry)";
    if (seconds <= 240) return "3.5 (Dostateczny plus)";
    return "3.0 (Dostateczny)";
  }

  saveBestRecord(sem, seconds, grade, score = 0) {
    try {
      const key = `kozminski_best_sem${sem}`;
      const existing = localStorage.getItem(key);
      let isNew = false;
      let bestSeconds = seconds;
      let bestGrade = grade;
      let bestScore = score;
      const curMap = this.currentMap || 'parter';
      let bestMap = curMap;
      let bestScoreMap = curMap;

      if (!existing) {
        isNew = true;
      } else {
        const parsed = JSON.parse(existing);
        bestMap = parsed.map || 'parter';
        bestScoreMap = parsed.scoreMap || parsed.map || 'parter';
        if (typeof parsed.seconds === 'number') {
          if (seconds < parsed.seconds) {
            isNew = true;
            bestSeconds = seconds;
            bestGrade = grade;
            bestMap = curMap;
          } else {
            bestSeconds = parsed.seconds;
            bestGrade = parsed.grade || grade;
          }
        }
        if (typeof parsed.score === 'number') {
          if (score >= parsed.score) {
            bestScore = score;
            bestScoreMap = curMap;
          } else {
            bestScore = parsed.score;
          }
        }
      }

      const timeStr = this.formatTime(bestSeconds);
      localStorage.setItem(key, JSON.stringify({
        seconds: bestSeconds,
        timeStr,
        grade: bestGrade,
        score: bestScore,
        map: bestMap,
        scoreMap: bestScoreMap
      }));
      this.updateRecordDisplays();
      return isNew;
    } catch {
      return false;
    }
  }

  updateRecordDisplays() {
    try {
      for (let s = 1; s <= 3; s++) {
        const legacyEl = document.getElementById(`rec-sem-${s}`);
        const timeEl = document.getElementById(`rec-sem-${s}-time`);
        const gradeEl = document.getElementById(`rec-sem-${s}-grade`);
        const scoreEl = document.getElementById(`rec-sem-${s}-score`);

        const data = localStorage.getItem(`kozminski_best_sem${s}`);
        if (data) {
          const parsed = JSON.parse(data);
          let timeStr = parsed.timeStr;
          // Jeśli timeStr zawiera kropkę, przelicz go ponownie z pola seconds
          if (typeof timeStr === 'string' && timeStr.includes('.')) {
            timeStr = this.formatTime(parsed.seconds);
            parsed.timeStr = timeStr;
            try {
              localStorage.setItem(`kozminski_best_sem${s}`, JSON.stringify(parsed));
            } catch {}
          } else if (!timeStr && typeof parsed.seconds === 'number') {
            timeStr = this.formatTime(parsed.seconds);
          }
          const shortGrade = parsed.grade ? parsed.grade.split(' ')[0] : '—';
          const scoreStr = typeof parsed.score === 'number' ? `${parsed.score.toLocaleString('pl-PL')} pkt` : '—';
          const recMapId = parsed.scoreMap || parsed.map || 'parter';
          const mapIcon = recMapId === 'atrium' ? '🏢' : '🌿';
          const mapTitle = recMapId === 'atrium' ? 'I piętro (Atrium)' : 'Parter (Patio)';

          if (legacyEl) {
            const gradePart = parsed.grade ? ` (Ocena: ${shortGrade})` : '';
            const scorePart = typeof parsed.score === 'number' ? ` · ${mapIcon} ${scoreStr}` : '';
            legacyEl.textContent = `${timeStr}${gradePart}${scorePart}`;
          }
          if (timeEl) timeEl.textContent = timeStr || '—';
          if (gradeEl) gradeEl.textContent = shortGrade;
          if (scoreEl) {
            if (typeof parsed.score === 'number') {
              scoreEl.innerHTML = `<span class="record-map-icon" title="${mapTitle}">${mapIcon}</span>${scoreStr}`;
            } else {
              scoreEl.textContent = '—';
            }
          }
        } else {
          if (legacyEl) legacyEl.textContent = 'Brak zapisu';
          if (timeEl) timeEl.textContent = '—';
          if (gradeEl) gradeEl.textContent = '—';
          if (scoreEl) scoreEl.textContent = '—';
        }
      }
    } catch {
      // ignore
    }
  }

  evaluateAchievements() {
    const list = [
      {
        id: 'no_sprint',
        name: 'Bez sprintu',
        icon: '🚶‍♂️',
        desc: 'Wygraj semestr ani razu nie używając sprintu',
        earned: !this.sprintUsed
      },
      {
        id: 'analog',
        name: 'Analogowo',
        icon: '📚',
        desc: 'Wygraj bez podnoszenia Gemini AI',
        earned: this.geminiCollected === 0
      },
      {
        id: 'ninja',
        name: 'Ninja z Patio',
        icon: '🌿',
        desc: 'Schowaj się w krzakach 5 razy w 1 grze',
        earned: this.bushHidesCount >= 5
      },
      {
        id: 'nerd',
        name: 'Kujon',
        icon: '🌟',
        desc: 'Zbierz 3 Złote ECTS w jednej rozgrywce',
        earned: this.goldEctsCollected >= 3
      },
      {
        id: 'gambler',
        name: 'Ryzykant',
        icon: '📝',
        desc: 'Zbierz co najmniej 2 ściągi w jednej grze',
        earned: this.cheatsCollected >= 2
      },
      {
        id: 'boss_slayer',
        name: 'Pogromca Komisji',
        icon: '⚖️',
        desc: 'Pokonaj Komisję Egzaminacyjną w finale Semestru III',
        earned: this.currentSemester === 3
      }
    ];

    let newlyUnlocked = false;
    let savedAchievements = {};
    try {
      savedAchievements = JSON.parse(localStorage.getItem('kozminski_achievements') || '{}');
    } catch {
      savedAchievements = {};
    }

    if (this.achievementsList) {
      this.achievementsList.innerHTML = '';
      list.forEach((ach) => {
        const isUnlocked = ach.earned || savedAchievements[ach.id];
        if (ach.earned && !savedAchievements[ach.id]) {
          savedAchievements[ach.id] = true;
          newlyUnlocked = true;
        }

        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <span class="achievement-badge">${ach.icon}</span>
          <div class="achievement-text">
            <span class="achievement-name">${ach.name}</span>
            <span class="achievement-desc">${ach.desc}</span>
          </div>
        `;
        this.achievementsList.appendChild(card);
      });
    }

    try {
      localStorage.setItem('kozminski_achievements', JSON.stringify(savedAchievements));
    } catch {
      // ignore
    }

    if (newlyUnlocked) {
      soundSystem.play('achievement');
    }
  }

  // =========================================================================
  // WARSTWA PRERENDEROWANA: STATYCZNE TŁO KAMPUSU (OFFSCREEN CANVAS 800x540)
  // Prerenderowane raz przy starcie i zmianie rozmiaru dla stabilnego 60 FPS
  // =========================================================================
  initStaticBgCanvas() {
    if (typeof document === 'undefined') return;
    if (!this.staticBgCanvas) {
      this.staticBgCanvas = document.createElement('canvas');
      this.staticBgCanvas.width = CANVAS_WIDTH;
      this.staticBgCanvas.height = CANVAS_HEIGHT;
      this.staticBgCtx = this.staticBgCanvas.getContext('2d');
    }
    this.prerenderStaticCampus();
  }

  prerenderStaticCampus() {
    if (!this.staticBgCtx) return;
    const ctx = this.staticBgCtx;
    const mapCfg = this.getCurrentMapConfig();

    // 1. Tło bazowe i podłoga korytarzy
    if (mapCfg.floorTheme === 'atrium') {
      // I piętro – Atrium: jasne panele drewniane z delikatnym usłojeniem i fugami
      ctx.fillStyle = '#735736';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const plankW = 40;
      const plankH = 12;
      for (let py = 0; py < CANVAS_HEIGHT; py += plankH) {
        const row = Math.floor(py / plankH);
        const shift = (row % 2) * 20;
        for (let px = -20; px < CANVAS_WIDTH + 20; px += plankW) {
          const hash = ((px + row * 19) * 31) & 3;
          ctx.fillStyle = hash === 0 ? '#8c6b43' : hash === 1 ? '#997549' : hash === 2 ? '#80613c' : '#a37e50';
          ctx.fillRect(px + shift, py, plankW - 1, plankH - 1);
          // Połysk górnej krawędzi i subtelny słój
          ctx.fillStyle = 'rgba(255, 245, 225, 0.08)';
          ctx.fillRect(px + shift, py, plankW - 1, 1);
          ctx.fillStyle = 'rgba(40, 22, 8, 0.16)';
          ctx.fillRect(px + shift, py + plankH - 1, plankW - 1, 1);
        }
      }
      // Delikatna nocna aura galerii, żeby elementy HUD/żetony wyraźnie odcinały się od drewna
      ctx.fillStyle = 'rgba(8, 14, 30, 0.24)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Parter: głęboki nocny granat i płytki w szachownicę z fugami
      ctx.fillStyle = '#060a19';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const tileSize = 20;
      for (let c = 0; c < CANVAS_WIDTH; c += tileSize) {
        for (let r = 0; r < CANVAS_HEIGHT; r += tileSize) {
          const isAlt = (Math.floor(c / tileSize) + Math.floor(r / tileSize)) % 2 === 0;
          ctx.fillStyle = isAlt ? '#091124' : '#0d1732';
          ctx.fillRect(c, r, tileSize, tileSize);

          // Fuga 1 px
          ctx.strokeStyle = '#040714';
          ctx.lineWidth = 1;
          ctx.strokeRect(c + 0.5, r + 0.5, tileSize - 1, tileSize - 1);

          // Subtelny połysk gresu na krawędzi górnej i lewej
          ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          ctx.fillRect(c + 1, r + 1, tileSize - 2, 1);
          ctx.fillRect(c + 1, r + 1, 1, tileSize - 2);
        }
      }
    }

    // 3. Herb / Medalion „ALK” wyryty w podłodze
    const logoPos = mapCfg.logoPos || { x: 400, y: 88 };
    this.prerenderCorridorLogo(ctx, logoPos.x, logoPos.y);

    // 4. Podłogi sal
    this.prerenderRoomsFloors(ctx);

    // 5. Patio ALK / Atrium ze szklaną balustradą i donicami
    this.prerenderPatio(ctx);

    // 6. Meble i wyposażenie sal i korytarzy (dekoracja, bez kolizji)
    this.prerenderFurnitureAndDetails(ctx);

    // 7. Ściany i kolumny z cieniem rzucanym na podłogę
    this.prerenderWallsAndPillars(ctx);

    // 8. Eleganckie mosiężne szyldy i etykiety sal
    this.prerenderRoomLabels(ctx);
  }

  prerenderCorridorLogo(ctx, cx, cy) {
    ctx.save();
    // Zewnętrzny mosiężny medalion
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#0a1428';
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Podwójny mosiężny pierścień
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 199, 64, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 23, 0, Math.PI * 2);
    ctx.stroke();

    // Wytłoczony napis ALK
    ctx.fillStyle = '#f2a900';
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ALK", cx, cy - 2);

    // Wieniec / rok 1993
    ctx.fillStyle = 'rgba(255, 199, 64, 0.7)';
    ctx.font = '700 7px Plus Jakarta Sans, sans-serif';
    ctx.fillText("EST. 1993", cx, cy + 10);

    ctx.restore();
  }

  prerenderRoomsFloors(ctx) {
    const aula = (this.rooms || []).find(r => r.id === 'aula');
    const dean = (this.rooms || []).find(r => r.id === 'dean');
    const lib = (this.rooms || []).find(r => r.id === 'library');
    const lab = (this.rooms || []).find(r => r.id === 'lab');

    // AULA (Drewniany ciepły parkiet)
    if (aula) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(aula.x, aula.y, aula.w, aula.h);
      ctx.clip();

      ctx.fillStyle = '#26160c';
      ctx.fillRect(aula.x, aula.y, aula.w, aula.h);

      const plankW = 20;
      const plankH = 10;
      for (let py = aula.y; py < aula.y + aula.h; py += plankH) {
        const row = Math.floor((py - aula.y) / plankH);
        const offset = (row % 2) * 10;
        for (let px = aula.x - 10; px < aula.x + aula.w; px += plankW) {
          const tone = ((px + py) * 17) % 4;
          ctx.fillStyle = tone === 0 ? '#382212' : tone === 1 ? '#422815' : tone === 2 ? '#331d0f' : '#4b2e19';
          ctx.fillRect(px + offset, py, plankW - 1, plankH - 1);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(px + offset, py, plankW - 1, 1);
        }
      }
      const aulaGloss = ctx.createLinearGradient(aula.x, aula.y, aula.x + aula.w, aula.y + aula.h);
      aulaGloss.addColorStop(0, 'rgba(242, 169, 0, 0.08)');
      aulaGloss.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = aulaGloss;
      ctx.fillRect(aula.x, aula.y, aula.w, aula.h);
      ctx.restore();
    }

    // DZIEKANAT (Pluszowy dywan z geometrycznym wzorem rombów)
    if (dean) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(dean.x, dean.y, dean.w, dean.h);
      ctx.clip();

      ctx.fillStyle = '#20122a';
      ctx.fillRect(dean.x, dean.y, dean.w, dean.h);

      ctx.strokeStyle = 'rgba(242, 169, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let x = dean.x - 40; x < dean.x + dean.w + 40; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, dean.y);
        ctx.lineTo(x + dean.h, dean.y + dean.h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, dean.y + dean.h);
        ctx.lineTo(x + dean.h, dean.y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(242, 169, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(dean.x + 6, dean.y + 6, dean.w - 12, dean.h - 12);
      ctx.strokeStyle = '#422456';
      ctx.lineWidth = 4;
      ctx.strokeRect(dean.x + 2, dean.y + 2, dean.w - 4, dean.h - 4);
      ctx.restore();
    }

    // BIBLIOTEKA / CZYTELNIA (Ciepłe drewniane deski)
    if (lib) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(lib.x, lib.y, lib.w, lib.h);
      ctx.clip();

      ctx.fillStyle = '#22140a';
      ctx.fillRect(lib.x, lib.y, lib.w, lib.h);

      const boardH = 15;
      for (let by = lib.y; by < lib.y + lib.h; by += boardH) {
        const tone = (by * 13) % 3;
        ctx.fillStyle = tone === 0 ? '#2c1b0e' : tone === 1 ? '#352011' : '#3d2514';
        ctx.fillRect(lib.x, by, lib.w, boardH - 1);

        ctx.fillStyle = '#170c06';
        ctx.fillRect(lib.x, by + boardH - 1, lib.w, 1);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fillRect(lib.x, by, lib.w, 1);

        const seamX = lib.x + ((by * 7) % Math.max(40, lib.w - 40)) + 20;
        ctx.fillStyle = '#170c06';
        ctx.fillRect(seamX, by, 1, boardH - 1);
      }
      ctx.restore();
    }

    // LAB KOMPUTEROWY / SALA KOMPUTEROWA 2 (Szare płytki techniczne z liniami światłowodów)
    if (lab) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(lab.x, lab.y, lab.w, lab.h);
      ctx.clip();

      ctx.fillStyle = '#111724';
      ctx.fillRect(lab.x, lab.y, lab.w, lab.h);

      const techTile = 20;
      for (let tx = lab.x; tx < lab.x + lab.w; tx += techTile) {
        for (let ty = lab.y; ty < lab.y + lab.h; ty += techTile) {
          ctx.fillStyle = (tx + ty) % 40 === 0 ? '#162030' : '#131b29';
          ctx.fillRect(tx, ty, techTile, techTile);

          ctx.strokeStyle = '#0c121c';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx + 0.5, ty + 0.5, techTile - 1, techTile - 1);
        }
      }

      const midX = lab.x + lab.w / 2;
      const midY = lab.y + lab.h / 2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lab.x, midY);
      ctx.lineTo(lab.x + lab.w, midY);
      ctx.moveTo(midX, lab.y);
      ctx.lineTo(midX, lab.y + lab.h);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      const nodes = [
        [midX - 40, midY], [midX, midY], [midX + 40, midY],
        [midX, midY - 30], [midX, midY + 30]
      ];
      for (const [nx, ny] of nodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  prerenderPatio(ctx) {
    if (!this.patio) return;
    const { x, y, w, h, isAtrium } = this.patio;

    if (isAtrium) {
      ctx.save();
      // 1. Widok piętro niżej na ciemniejszą zieleń Patio
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      ctx.fillStyle = '#02261c';
      ctx.fillRect(x, y, w, h);

      // Przyciemniona trawa z fakturą piętro niżej
      for (let gy = y + 4; gy < y + h - 4; gy += 7) {
        for (let gx = x + 4; gx < x + w - 4; gx += 7) {
          const hash = (gx * 41 + gy * 29) % 5;
          if (hash === 0) {
            ctx.fillStyle = '#033528';
            ctx.fillRect(gx, gy, 2, 3);
          } else if (hash === 1) {
            ctx.fillStyle = '#044232';
            ctx.fillRect(gx + 1, gy + 1, 2, 2);
          }
        }
      }

      // Przyciemnione alejki z kostki i miniaturki krzewów Patio widziane z góry
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(x + w / 2 - 12, y, 24, h);
      ctx.fillRect(x, y + h / 2 - 12, w, 24);

      const lowerBushes = [
        [x + 42, y + 26], [x + w - 42, y + 26],
        [x + 42, y + h - 26], [x + w - 42, y + h - 26]
      ];
      for (const [lbx, lby] of lowerBushes) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(lbx + 2, lby + 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#033d2e';
        ctx.beginPath();
        ctx.arc(lbx, lby, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#05543f';
        ctx.beginPath();
        ctx.arc(lbx - 2, lby - 2, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Głęboki cień krawędzi stropu z I piętra w dół
      const dropShadow = ctx.createLinearGradient(x, y, x, y + 24);
      dropShadow.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      dropShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dropShadow;
      ctx.fillRect(x, y, w, 24);

      const leftShadow = ctx.createLinearGradient(x, y, x + 22, y);
      leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftShadow;
      ctx.fillRect(x, y, 22, h);

      // Subtelny błękitny odblask na tafli pustki
      ctx.fillStyle = 'rgba(125, 211, 252, 0.05)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();

      // 2. Szklana balustrada wokół otworu Atrium
      ctx.save();
      // Cień zewnętrzny poręczy na drewnianej podłodze
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 7;
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

      // Tafla szkła (jasnobłękitna półprzezroczysta)
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.58)';
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, w, h);

      // Stalowa / aluminiowa poręcz na górze szkła
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 0.9;
      ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);

      // Słupki balustrady co ~32 px
      ctx.fillStyle = '#94a3b8';
      for (let px = x; px <= x + w; px += 36) {
        ctx.fillRect(px - 2, y - 2, 4, 4);
        ctx.fillRect(px - 2, y + h - 2, 4, 4);
      }
      for (let py = y + 28; py < y + h; py += 28) {
        ctx.fillRect(x - 2, py - 2, 4, 4);
        ctx.fillRect(x + w - 2, py - 2, 4, 4);
      }
      ctx.restore();

      // 3. 4 duże donice z fikusami przy balustradzie
      for (const b of this.bushes) {
        this.drawFicusPot(ctx, b.x, b.y, b.radius);
      }
      return;
    }

    ctx.save();
    // Trawa Patio ALK (Parter)
    ctx.fillStyle = '#064434';
    ctx.fillRect(x, y, w, h);

    // Tekstura źdźbeł trawy
    for (let gy = y + 4; gy < y + h - 4; gy += 8) {
      for (let gx = x + 4; gx < x + w - 4; gx += 8) {
        const hash = (gx * 37 + gy * 53) % 5;
        if (hash === 0) {
          ctx.fillStyle = '#07523f';
          ctx.fillRect(gx, gy, 2, 3);
        } else if (hash === 1) {
          ctx.fillStyle = '#09634c';
          ctx.fillRect(gx + 1, gy + 1, 2, 2);
        }
      }
    }

    // Alejki z kostki brukowej: krzyż i obwódka placu
    ctx.fillStyle = '#172033';
    ctx.fillRect(x + w / 2 - 16, y, 32, h);
    ctx.fillRect(x, y + h / 2 - 16, w, 32);

    ctx.strokeStyle = '#27354f';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w / 2 - 16, y, 32, h);
    ctx.strokeRect(x, y + h / 2 - 16, w, 32);

    // Ławki parkowe
    const benches = [
      { bx: x + 40, by: y + h / 2 - 24, w: 24, h: 6 },
      { bx: x + w - 64, by: y + h / 2 - 24, w: 24, h: 6 },
      { bx: x + 40, by: y + h / 2 + 18, w: 24, h: 6 },
      { bx: x + w - 64, by: y + h / 2 + 18, w: 24, h: 6 }
    ];
    for (const bn of benches) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(bn.bx + 2, bn.by + 2, bn.w, bn.h);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bn.bx, bn.by, bn.w, bn.h);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(bn.bx + 1, bn.by + 1, bn.w - 2, 1);
      ctx.fillRect(bn.bx + 1, bn.by + 4, bn.w - 2, 1);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bn.bx, bn.by, 2, bn.h);
      ctx.fillRect(bn.bx + bn.w - 2, bn.by, 2, bn.h);
    }

    // Latarnie parkowe (4 sztuki)
    const lanterns = [
      [x + 18, y + 18],
      [x + w - 18, y + 18],
      [x + 18, y + h - 18],
      [x + w - 18, y + h - 18]
    ];
    for (const [lx, ly] of lanterns) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(lx + 2, ly + 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lx - 2, ly - 3, 4, 6);
      ctx.fillStyle = '#f2a900';
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bujne krzewy kryjówki (4 sztuki)
    for (const b of this.bushes) {
      this.drawLushBush(ctx, b.x, b.y, b.radius);
    }

    // Obramowanie patio
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
  }

  drawFicusPot(ctx, bx, by, radius) {
    ctx.save();
    // 1. Cień donicy na panelach
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + 4, radius + 1, radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Kwadratowo-zaokrąglona donica ceramiczna ze złotym rantem
    const potR = radius * 0.76;
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.roundRect(bx - potR, by - potR, potR * 2, potR * 2, 6);
    ctx.fill();

    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ziemia w donicy
    ctx.fillStyle = '#291709';
    ctx.beginPath();
    ctx.roundRect(bx - potR + 3, by - potR + 3, (potR - 3) * 2, (potR - 3) * 2, 4);
    ctx.fill();

    // 3. Korona fikusa (liście warstwowe)
    const leaves = [
      { dx: -7, dy: -6, r: radius * 0.56, color: '#065f46' },
      { dx: 7, dy: -5, r: radius * 0.54, color: '#047857' },
      { dx: -6, dy: 6, r: radius * 0.52, color: '#065f46' },
      { dx: 6, dy: 6, r: radius * 0.56, color: '#059669' },
      { dx: 0, dy: -1, r: radius * 0.62, color: '#10b981' }
    ];
    for (const lf of leaves) {
      ctx.fillStyle = lf.color;
      ctx.beginPath();
      ctx.arc(bx + lf.dx, by + lf.dy, lf.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Połysk na liściach fikusa
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(bx - 4, by - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(bx + 4, by - 3, 2, 0, Math.PI * 2);
    ctx.arc(bx + 1, by + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLushBush(ctx, bx, by, radius) {
    ctx.save();
    // 1. Cień krzewu na trawie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + 3, radius + 2, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Warstwa ciemna podstawy
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Bujne kępy liściaste (struktura organiczna)
    const lobes = [
      { dx: -7, dy: -6, r: radius * 0.62, color: '#047857' },
      { dx: 7, dy: -5, r: radius * 0.60, color: '#059669' },
      { dx: -6, dy: 6, r: radius * 0.58, color: '#047857' },
      { dx: 6, dy: 6, r: radius * 0.62, color: '#059669' },
      { dx: 0, dy: -2, r: radius * 0.68, color: '#10b981' }
    ];

    for (const lobe of lobes) {
      ctx.fillStyle = lobe.color;
      ctx.beginPath();
      ctx.arc(bx + lobe.dx, by + lobe.dy, lobe.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Rozświetlenia liści na wierzchołkach
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(bx - 3, by - 4, 3, 0, Math.PI * 2);
    ctx.arc(bx + 4, by - 5, 2.5, 0, Math.PI * 2);
    ctx.arc(bx + 2, by + 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  prerenderFurnitureAndDetails(ctx) {
    if (this.currentMap === 'atrium') {
      this.prerenderAtriumFurnitureAndDetails(ctx);
      return;
    }

    // AULA A:
    ctx.fillStyle = '#0a2318';
    ctx.fillRect(55, 21, 110, 12);
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 21, 110, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 6px sans-serif';
    ctx.fillText("∑ ECTS = 30", 62, 29);
    ctx.fillText("f'(x) > 0", 125, 29);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(172, 36, 16, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(173, 37, 14, 10);
    ctx.fillStyle = '#f2a900';
    ctx.fillRect(178, 35, 4, 2);

    for (let cy of [44, 58]) {
      for (let cx = 45; cx <= 155; cx += 22) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, cy, 14, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 1, cy + 1, 12, 6);
      }
    }

    // DZIEKANAT:
    ctx.fillStyle = '#3f1f0a';
    ctx.fillRect(720, 36, 56, 10);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(721, 37, 54, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(722, 35, 52, 2);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(602, 34, 12, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(604, 37, 8, 4);

    const stanchions = [655, 680, 705];
    for (const sx of stanchions) {
      ctx.fillStyle = '#f2a900';
      ctx.beginPath();
      ctx.arc(sx, 90, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(655, 90);
    ctx.lineTo(705, 90);
    ctx.stroke();

    // BIBLIOTEKA:
    ctx.fillStyle = '#3e2212';
    ctx.fillRect(21, 412, 12, 94);
    for (let ky = 416; ky < 504; ky += 8) {
      const bookColors = ['#f59e0b', '#dc2626', '#059669', '#2563eb', '#9333ea', '#d97706'];
      ctx.fillStyle = bookColors[(ky * 7) % bookColors.length];
      ctx.fillRect(23, ky, 8, 6);
    }

    ctx.fillStyle = '#78350f';
    ctx.fillRect(56, 442, 30, 14);
    for (const lx of [62, 78]) {
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(lx - 1, 445, 2, 4);
      ctx.fillStyle = '#059669';
      ctx.fillRect(lx - 3, 443, 6, 3);
    }

    // LAB KOMPUTEROWY:
    const desks = [
      { x: 610, y: 430, w: 50, h: 14 },
      { x: 700, y: 430, w: 50, h: 14 },
      { x: 610, y: 485, w: 50, h: 14 },
      { x: 700, y: 485, w: 50, h: 14 }
    ];
    for (const d of desks) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(d.x, d.y, d.w, d.h);

      for (const mx of [d.x + 8, d.x + 30]) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 6, d.y + 2, 12, 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(mx - 5, d.y + 2, 10, 1.5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(mx - 5, d.y + 6, 10, 5);
      }
    }
  }

  prerenderAtriumFurnitureAndDetails(ctx) {
    ctx.save();

    // 1. Schody ruchome w lewym górnym rogu (dekoracja)
    const escX = 28, escY = 24, escW = 64, escH = 38;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(escX + 2, escY + 3, escW, escH);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(escX, escY, escW, escH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(escX, escY, escW, escH);

    // Dwa pasy schodów (góra/dół) + stopnie
    for (const laneY of [escY + 4, escY + 21]) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(escX + 4, laneY, escW - 8, 13);
      ctx.fillStyle = '#475569';
      for (let sx = escX + 7; sx < escX + escW - 7; sx += 5) {
        ctx.fillRect(sx, laneY + 1, 2, 11);
      }
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(escX + 4, laneY, 2, 13);
      ctx.fillRect(escX + escW - 6, laneY, 2, 13);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '700 7px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ SCHODY ▼', escX + escW / 2, escY + escH + 9);

    // 2. Ławki wypoczynkowe na korytarzach Atrium
    const atriumBenches = [
      { x: 132, y: 496, w: 38, h: 10 },
      { x: 196, y: 496, w: 38, h: 10 },
      { x: 565, y: 30, w: 38, h: 10 },
      { x: 716, y: 30, w: 38, h: 10 }
    ];
    for (const bn of atriumBenches) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(bn.x + 2, bn.y + 2, bn.w, bn.h);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bn.x, bn.y, bn.w, bn.h);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(bn.x + 2, bn.y + 2, bn.w - 4, 2);
      ctx.fillRect(bn.x + 2, bn.y + 6, bn.w - 4, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bn.x + 2, bn.y, 2, bn.h);
      ctx.fillRect(bn.x + bn.w - 4, bn.y, 2, bn.h);
    }

    // 3. Automat z kawą przy dolnej ścianie (po prawej od Dziekanatu)
    const vmX = 540, vmY = 502, vmW = 24, vmH = 14;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(vmX + 2, vmY + 2, vmW, vmH);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(vmX, vmY, vmW, vmH);
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 1;
    ctx.strokeRect(vmX, vmY, vmW, vmH);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(vmX + 3, vmY + 3, 10, 7);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(vmX + 16, vmY + 3, 5, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕ KAWA', vmX + vmW / 2, vmY - 4);

    // 4. AULA B ([290..510] x [20..120]): tablica, katedra i krzesła
    ctx.fillStyle = '#0a2318';
    ctx.fillRect(345, 22, 110, 10);
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 1;
    ctx.strokeRect(345, 22, 110, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 6px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("NPV > 0", 352, 29);
    ctx.fillText("ROE = 18%", 412, 29);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(468, 34, 16, 10);
    ctx.fillStyle = '#f2a900';
    ctx.fillRect(474, 32, 4, 2);

    for (const cy of [42, 92]) {
      for (let cx = 318; cx <= 450; cx += 26) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, cy, 14, 7);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 1, cy + 1, 12, 5);
      }
    }

    // 5. DZIEKANAT ([300..500] x [420..520]): lada obsługi po lewej na dole (obok finalTarget {342, 480}), biletomat
    ctx.fillStyle = '#3f1f0a';
    ctx.fillRect(312, 505, 62, 10);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(313, 506, 60, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(314, 504, 58, 2);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(470, 428, 12, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(472, 431, 8, 4);

    // 6. CZYTELNIA ([20..170] x [185..355]): regały i stół z lampkami
    ctx.fillStyle = '#3e2212';
    ctx.fillRect(22, 198, 11, 144);
    for (let ky = 202; ky < 338; ky += 9) {
      const bookColors = ['#f59e0b', '#dc2626', '#059669', '#2563eb', '#9333ea', '#d97706'];
      ctx.fillStyle = bookColors[(ky * 5) % bookColors.length];
      ctx.fillRect(24, ky, 7, 6);
    }
    ctx.fillStyle = '#78350f';
    ctx.fillRect(50, 218, 32, 16);
    for (const lx of [58, 74]) {
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(lx - 1, 222, 2, 4);
      ctx.fillStyle = '#059669';
      ctx.fillRect(lx - 3, 220, 6, 3);
    }

    // 7. SALA KOMPUTEROWA 2 ([630..780] x [185..355]): stanowiska PC
    const labDesks = [
      { x: 650, y: 205, w: 50, h: 13 },
      { x: 716, y: 205, w: 50, h: 13 },
      { x: 650, y: 318, w: 50, h: 13 },
      { x: 716, y: 318, w: 50, h: 13 }
    ];
    for (const d of labDesks) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      for (const mx of [d.x + 10, d.x + 34]) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 6, d.y + 2, 12, 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(mx - 5, d.y + 2, 10, 1.5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(mx - 5, d.y + 6, 10, 5);
      }
    }

    ctx.restore();
  }

  prerenderWallsAndPillars(ctx) {
    ctx.save();
    const regularWalls = this.walls.filter(w => w.kind !== 'atrium');

    // 1. Cień rzucany przez ściany na podłogę
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (const w of regularWalls) {
      ctx.fillRect(w.x + 4, w.y + 5, w.w, w.h);
    }

    // 2. Korpus ścian (głęboki granat ALK)
    for (const w of regularWalls) {
      ctx.fillStyle = '#001a35';
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Wewnętrzny cień ściany
      ctx.fillStyle = '#000f20';
      ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);

      // Złoty gzyms na wierzchu ściany
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(w.x, w.y, w.w, 2.5);

      // Lśniąca krawędź gzymsu
      ctx.fillStyle = '#ffc740';
      ctx.fillRect(w.x, w.y, w.w, 1);
    }

    // 3. Filary korytarzowe jako klasyczne kolumny z bazą, kanelurami i głowicą
    for (const p of (this.pillars || [])) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(p.x + 4, p.y + 5, p.w, p.h);

      ctx.fillStyle = '#00254c';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = '#001933';
      ctx.fillRect(p.x + 4, p.y + 4, 2, p.h - 8);
      ctx.fillRect(p.x + 8, p.y + 4, 2, p.h - 8);
      ctx.fillRect(p.x + 12, p.y + 4, 2, p.h - 8);

      ctx.fillStyle = '#f2a900';
      ctx.fillRect(p.x - 2, p.y + p.h - 4, p.w + 4, 4);

      ctx.fillStyle = '#ffc740';
      ctx.fillRect(p.x - 2, p.y, p.w + 4, 4);
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(p.x - 1, p.y + 4, p.w + 2, 2);
    }

    ctx.restore();
  }

  prerenderRoomLabels(ctx) {
    for (const r of this.rooms) {
      ctx.save();
      ctx.fillStyle = '#ffc740';
      const fontSize = r.name.length > 15 ? 11.5 : 13;
      ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillText(`${r.icon} ${r.name}`, r.labelX, r.labelY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.font = '600 9.5px Plus Jakarta Sans, sans-serif';
      ctx.shadowBlur = 4;
      ctx.fillText(r.info, r.labelX, r.labelY + 15);
      ctx.restore();
    }

    // Szyld Patio ALK / Atrium
    if (this.patio) {
      ctx.save();
      if (this.patio.isAtrium) {
        ctx.fillStyle = '#bae6fd';
        ctx.font = '800 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#020617';
        ctx.shadowBlur = 6;
        ctx.fillText("🏢 Atrium · Widok na Patio", this.patio.x + this.patio.w / 2, this.patio.y + 22);
      } else {
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '800 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#064e3b';
        ctx.shadowBlur = 6;
        ctx.fillText("🌿 Patio ALK 🌿", this.patio.x + this.patio.w / 2, this.patio.y + 24);
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // GŁÓWNA METODA RENDERUJĄCA W KAŻDEJ KLATCE
  // =========================================================================
  render() {
    const scale = this.canvas.width / CANVAS_WIDTH;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Drgania ekranu (screen shake na canvasie)
    if (this.shakeDuration > 0 && this.shakeMagnitude > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.ctx.translate(offsetX, offsetY);
    }

    // Zoom na studenta podczas sekwencji złapania
    if (this.isCaughtSequence && this.player) {
      const zoom = 1.25;
      this.ctx.translate(this.player.x, this.player.y);
      this.ctx.scale(zoom, zoom);
      this.ctx.translate(-this.player.x, -this.player.y);
    }

    // 1. Błyskawiczny transfer prerenderowanego tła kampusu (1 drawImage call)
    if (this.staticBgCanvas) {
      this.ctx.drawImage(this.staticBgCanvas, 0, 0);
    } else {
      this.ctx.fillStyle = '#060a19';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Miękkie światła latarni i lamp (tryb 'lighter' z niskim alpha)
    this.drawDynamicLights();

    // 3. Dynamiczne wskaźniki krzaków (cooldown)
    this.drawDynamicBushes();

    // 3a. Pogoda: kałuże, cienie chmur, śnieg i ślady (pod postaciami)
    if (this.weather) this.weather.renderGround(this.ctx);

    // 3b. Pulsujący cel finałowy „ODDAJ INDEKS” w Dziekanacie
    if (this.finalPhase) {
      this.drawFinalTarget();
    }

    // 4. Studenci-NPC spacerujący podczas Przerwy
    this.drawNpcStudents();

    // 5. Przedmioty na planszy (obracające się żetony ECTS, laptopy Gemini, kubki kawy)
    this.drawItems();

    // 6. Cząsteczki
    this.drawParticles();

    // 7. Postacie przeciwników, sojuszników i studenta w rzucie 3/4
    if (this.securityGuard) this.drawSecurityGuardFlashlight();
    if (this.examiner) this.drawExaminer();
    if (this.instructor) this.drawInstructor();
    if (this.deanClerk) this.drawDeanClerk();
    if (this.securityGuard) this.drawSecurityGuard();
    if (this.rector) this.drawRector();
    if (this.boss) this.drawBoss();
    if (this.player) this.drawPlayer();
    this.drawBossProjectiles();

    // 7b. Złota strzałka nad studentem do celu finałowego
    if (this.finalPhase) {
      this.drawTargetPointer();
    }

    // 8. Pływające teksty i orby lecące do licznika
    this.drawFloatingTexts();
    this.drawFlyingOrbs();

    // 8b. Pogoda: deszcz, śnieg, wiatr, mgła i ostrzeżenia przed piorunem
    if (this.weather) this.weather.renderSky(this.ctx);

    // 8c. Noc: ciemny kampus, latarnie i latarki wykładowców
    if (this.weather) this.weather.renderNight(this.ctx);

    // 9. Nocna winieta na obrzeżach canvasu
    this.drawVignette();

    // 9b. Czerwona winieta podczas finału
    if (this.finalPhase) {
      this.drawFinalVignette();
    }

    // 10. Efekt ciemności i latarki podczas Awarii prądu
    if (this.activeEvent && this.activeEvent.id === 'blackout') {
      this.drawBlackoutEffect();
    }

    // 10b. Błyskawica rozświetla kampus (także podczas awarii prądu)
    if (this.weather) this.weather.renderFlash(this.ctx);

    // 11. Skreślenie czerwonym długopisem podczas sekwencji złapania
    if (this.isCaughtSequence) {
      this.drawCatchScratch();
    }

    // 12. Biały błysk ekranu (hit-stop przy Złotym ECTS / tarczy)
    if (this.whiteFlashTimer > 0) {
      this.drawWhiteFlash();
    }
  }

  drawDynamicLights() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const mapCfg = this.getCurrentMapConfig();
    const lightsCfg = mapCfg.lights || {};

    // Ciepłe plamy światła pod 4 latarniami na Patio (lub wokół szklanej balustrady w Atrium)
    if (this.patio && lightsCfg.patioLanterns) {
      const { x, y, w, h } = this.patio;
      const lanterns = [
        [x + 18, y + 18],
        [x + w - 18, y + 18],
        [x + 18, y + h - 18],
        [x + w - 18, y + h - 18]
      ];
      for (const [lx, ly] of lanterns) {
        const rad = 46;
        const g = this.ctx.createRadialGradient(lx, ly, 2, lx, ly, rad);
        g.addColorStop(0, 'rgba(255, 215, 120, 0.16)');
        g.addColorStop(0.5, 'rgba(255, 215, 120, 0.06)');
        g.addColorStop(1, 'rgba(255, 215, 120, 0)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, rad, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (this.patio && lightsCfg.atriumRim) {
      const { x, y, w, h } = this.patio;
      const rimLights = [
        [x + 24, y - 10],
        [x + w - 24, y - 10],
        [x + 24, y + h + 10],
        [x + w - 24, y + h + 10]
      ];
      for (const [lx, ly] of rimLights) {
        const rad = 54;
        const g = this.ctx.createRadialGradient(lx, ly, 2, lx, ly, rad);
        g.addColorStop(0, 'rgba(186, 230, 253, 0.12)');
        g.addColorStop(0.5, 'rgba(255, 224, 150, 0.05)');
        g.addColorStop(1, 'rgba(186, 230, 253, 0)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, rad, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Szmaragdowe światło lampek bankierskich w Bibliotece / Czytelni
    const libLight = lightsCfg.libraryLamp || { x: 70, y: 448, radius: 40 };
    const bibGrad = this.ctx.createRadialGradient(libLight.x, libLight.y, 2, libLight.x, libLight.y, libLight.radius);
    bibGrad.addColorStop(0, 'rgba(74, 222, 128, 0.12)');
    bibGrad.addColorStop(1, 'rgba(74, 222, 128, 0)');
    this.ctx.fillStyle = bibGrad;
    this.ctx.beginPath();
    this.ctx.arc(libLight.x, libLight.y, libLight.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Cyjanowa poświata monitorów w Labie Komputerowym / Sali komputerowej 2
    const labLight = lightsCfg.labGlow || { x: 680, y: 460, radius: 65 };
    const labFlicker = 0.08 + Math.sin(Date.now() / 400) * 0.03;
    const labGrad = this.ctx.createRadialGradient(labLight.x, labLight.y, 4, labLight.x, labLight.y, labLight.radius);
    labGrad.addColorStop(0, `rgba(56, 189, 248, ${labFlicker})`);
    labGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    this.ctx.fillStyle = labGrad;
    this.ctx.beginPath();
    this.ctx.arc(labLight.x, labLight.y, labLight.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawVignette() {
    this.ctx.save();
    const g = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.32,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.65
    );
    g.addColorStop(0, 'rgba(4, 8, 20, 0)');
    g.addColorStop(0.8, 'rgba(4, 8, 20, 0.35)');
    g.addColorStop(1, 'rgba(2, 5, 14, 0.65)');

    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.restore();
  }

  drawDynamicBushes() {
    for (const b of this.bushes) {
      if (b.cooldown > 0) {
        // Czas ostygania kryjówki - czerwony wskaźnik
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '800 10px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${b.cooldown.toFixed(1)}s`, b.x, b.y - b.radius - 4);
        this.ctx.restore();
      }
    }
  }

  drawEnemyMarker(yOffset, color) {
    this.ctx.save();
    this.ctx.translate(0, yOffset);
    // Mały trójkącik skierowany w dół z subtelnym cieniem i obwódką
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetY = 1;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0); // wierzchołek w dół
    this.ctx.lineTo(-5, -7);
    this.ctx.lineTo(5, -7);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawNpcStudents() {
    const hairColors = ['#78350f', '#1e293b', '#f59e0b', '#b45309', '#475569'];
    const bagColors = ['#f2a900', '#38bdf8', '#fb923c', '#a855f7'];

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      this.ctx.save();
      this.ctx.translate(npc.x, npc.y);

      // 1. Cień pod stopami (czarny, alfa 0.35)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 10, 10, 4.2, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Kierunek ruchu NPC
      const isFacingLeft = npc.vx < -0.08;
      const isFacingUp = npc.vy < -0.65 && Math.abs(npc.vx) < 0.65;
      const speed = Math.hypot(npc.vx, npc.vy);
      const isMoving = speed > 0.05;
      const walk = isMoving ? Math.sin(Date.now() / 110 + i * 2) * 3 : 0;
      const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 350 + i) * 0.02);

      if (isFacingLeft) {
        this.ctx.scale(-1, 1);
      }

      // 2. Nogi w spodniach i trampki
      this.ctx.fillStyle = '#334155'; // dżinsy
      this.ctx.fillRect(-5, 4 + walk, 3.5, 6);
      this.ctx.fillRect(1.5, 4 - walk, 3.5, 6);

      this.ctx.fillStyle = '#0f172a'; // trampki
      this.ctx.fillRect(-5.5, 9 + walk, 4.5, 2.5);
      this.ctx.fillRect(1, 9 - walk, 4.5, 2.5);
      this.ctx.fillStyle = '#ffffff'; // biała podeszwa
      this.ctx.fillRect(-5.5, 11 + walk, 4.5, 1);
      this.ctx.fillRect(1, 11 - walk, 4.5, 1);

      // 3. Tułów - kolorowa bluza z oddychaniem
      this.ctx.save();
      this.ctx.scale(1, breath);

      const hairColor = hairColors[i % hairColors.length];
      const bagColor = bagColors[i % bagColors.length];

      if (isFacingUp) {
        // Widok od tyłu: plecak na plecach i tył głowy
        this.ctx.fillStyle = npc.color;
        this.ctx.beginPath();
        this.ctx.roundRect(-6, -6, 12, 11, 3);
        this.ctx.fill();

        // Plecak na środku
        this.ctx.fillStyle = bagColor;
        this.ctx.beginPath();
        this.ctx.roundRect(-4.5, -4, 9, 8, 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(-3, -2, 6, 1.5);

        // Tył głowy z włosami (brak twarzy)
        this.ctx.fillStyle = hairColor;
        this.ctx.beginPath();
        this.ctx.arc(0, -9, 6.5, 0, Math.PI * 2);
        this.ctx.fill();

      } else {
        // Plecak wystający z boku/tyłu
        this.ctx.fillStyle = bagColor;
        this.ctx.beginPath();
        this.ctx.roundRect(-8, -4, 3.5, 8, 1.5);
        this.ctx.fill();

        // Tułów w bluzie
        this.ctx.fillStyle = npc.color;
        this.ctx.beginPath();
        this.ctx.roundRect(-6, -6, 12, 11, 3);
        this.ctx.fill();

        // Ręce machające naprzemiennie
        this.ctx.fillStyle = npc.color;
        this.ctx.fillRect(-7.5, -4 - walk * 0.7, 3, 7);
        this.ctx.fillRect(4.5, -4 + walk * 0.7, 3, 7);
        this.ctx.fillStyle = '#fed7aa'; // dłonie
        this.ctx.fillRect(-7.5, 2.5 - walk * 0.7, 3, 2.5);
        this.ctx.fillRect(4.5, 2.5 + walk * 0.7, 3, 2.5);

        // Głowa z twarzą w widoku 3/4
        this.ctx.fillStyle = '#fed7aa';
        this.ctx.beginPath();
        this.ctx.arc(0, -9, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Włosy z grzywką
        this.ctx.fillStyle = hairColor;
        this.ctx.beginPath();
        this.ctx.arc(0, -11, 6.2, Math.PI * 0.8, Math.PI * 2.2);
        this.ctx.fill();

        // Oczy patrzące do przodu
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(1, -9.5, 1.5, 1.8);
      }

      this.ctx.restore(); // koniec tułowia
      this.ctx.restore(); // koniec NPC
    }
  }

  drawItems() {
    for (const item of this.items) {
      const pulseSize = Math.sin(item.pulse) * 2;
      const bounceY = Math.sin(item.pulse * 3) * 3;

      // Miganie Złotego ECTS przed zniknięciem
      if (item.type === 'gold' && item.lifeTimer < 1.5 && Math.floor(Date.now() / 120) % 2 === 0) {
        continue;
      }

      this.ctx.save();
      this.ctx.translate(item.x, item.y + bounceY);

      // Cień podnoszący się / zmniejszający wraz z wysokością
      const shadowScale = Math.max(0.6, 1 - bounceY / 12);
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 14 - bounceY, (item.radius + 2) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (item.type === 'ects') {
        // Obracający się złoty żeton z literami „ECTS”
        const rotScale = Math.cos(item.pulse * 2.2);

        // Złota poświata
        this.ctx.fillStyle = 'rgba(242, 169, 0, 0.28)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 4 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.scale(rotScale, 1.0);

        // Krawędź 3D monety
        this.ctx.fillStyle = '#b45309';
        this.ctx.beginPath();
        this.ctx.arc(0, 1, item.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Awers monety
        const coinGrad = this.ctx.createLinearGradient(-item.radius, -item.radius, item.radius, item.radius);
        coinGrad.addColorStop(0, '#ffea79');
        coinGrad.addColorStop(0.5, '#f2a900');
        coinGrad.addColorStop(1, '#d97706');
        this.ctx.fillStyle = coinGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#fffbeb';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        // Wytłoczony napis „ECTS”
        if (Math.abs(rotScale) > 0.35) {
          this.ctx.fillStyle = '#002244';
          this.ctx.font = '800 8.5px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText("ECTS", 0, 0.5);
        }
        this.ctx.restore();

      } else if (item.type === 'gold') {
        // ZŁOTE ECTS: większy złoty medalion z promieniami gwiazdy i napisem „+3”
        const rotScale = Math.cos(item.pulse * 2.5);
        const spinAngle = item.pulse * 1.5;

        // Wirujące promienie gwiazdy
        this.ctx.save();
        this.ctx.rotate(spinAngle);
        this.ctx.fillStyle = 'rgba(255, 199, 64, 0.25)';
        for (let ray = 0; ray < 8; ray++) {
          this.ctx.rotate(Math.PI / 4);
          this.ctx.fillRect(-2, -item.radius - 8, 4, (item.radius + 8) * 2);
        }
        this.ctx.restore();

        this.ctx.save();
        this.ctx.scale(rotScale, 1.0);

        // Złoty lśniący krążek
        const goldGrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, item.radius + 3);
        goldGrad.addColorStop(0, '#ffffff');
        goldGrad.addColorStop(0.3, '#ffeb78');
        goldGrad.addColorStop(0.8, '#f59e0b');
        goldGrad.addColorStop(1, '#b45309');
        this.ctx.fillStyle = goldGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.8;
        this.ctx.stroke();

        if (Math.abs(rotScale) > 0.3) {
          this.ctx.fillStyle = '#001a35';
          this.ctx.font = '900 11px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText("+3", 0, 0);
        }
        this.ctx.restore();

      } else if (item.type === 'coffee') {
        // Kawa z Patio: kubek termiczny ALK z parą
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 4 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Korpus kubka (papierowy kubek)
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.beginPath();
        this.ctx.moveTo(-7, -7);
        this.ctx.lineTo(7, -7);
        this.ctx.lineTo(5.5, 9);
        this.ctx.lineTo(-5.5, 9);
        this.ctx.closePath();
        this.ctx.fill();

        // Tekturowy brązowy kołnierz ochronny
        this.ctx.fillStyle = '#92400e';
        this.ctx.fillRect(-6.5, -2, 13, 6);

        // Logo ALK na kubku
        this.ctx.fillStyle = '#002244';
        this.ctx.fillRect(-2, 0, 4, 2);

        // Plastikowe wieczko z ustnikiem
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-8, -9, 16, 3);

        // Unosząca się para z kawy
        const steamShift = Math.sin(Date.now() / 150) * 2;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(-2 + steamShift, -10);
        this.ctx.quadraticCurveTo(-4, -14, -1 + steamShift, -18);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(3 - steamShift, -10);
        this.ctx.quadraticCurveTo(5, -14, 2 - steamShift, -18);
        this.ctx.stroke();

      } else if (item.type === 'freeze') {
        // Gemini AI: otwarty mały laptop ze świecącą gwiazdką Gemini
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 6 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Klawiatura / podstawa laptopa
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(-10, 2, 20, 8);
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillRect(-8, 3, 16, 5); // klawisze

        // Ekran otwarty
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(-10, -9, 20, 11);
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-10, -9, 20, 11);

        // 4-ramienna gwiazdka Gemini na ekranie
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -7);
        this.ctx.quadraticCurveTo(0, -3.5, 3.5, -3.5);
        this.ctx.quadraticCurveTo(0, -3.5, 0, 0);
        this.ctx.quadraticCurveTo(0, -3.5, -3.5, -3.5);
        this.ctx.quadraticCurveTo(0, -3.5, 0, -7);
        this.ctx.fill();

      } else if (item.type === 'shield') {
        // Legitymacja ALK: karta plastikowa z hologramem
        this.ctx.fillStyle = 'rgba(242, 169, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 5 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Karta ALK
        this.ctx.fillStyle = '#002244';
        this.ctx.fillRect(-12, -8, 24, 16);
        this.ctx.strokeStyle = '#f2a900';
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeRect(-12, -8, 24, 16);

        // Pasek magnetyczny i zdjęcie
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(-10, -5, 6, 7); // zdjęcie
        this.ctx.fillStyle = '#f2a900';
        this.ctx.fillRect(-2, -5, 10, 2); // pasek ALK

        // Tęczowy hologram chipu
        const holoHue = (Date.now() / 20) % 360;
        this.ctx.fillStyle = `hsl(${holoHue}, 80%, 65%)`;
        this.ctx.fillRect(2, -1, 4, 4);

      } else if (item.type === 'cheat') {
        // Ściąga: zwinięta kartka z czerwonym wykrzyknikiem
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 5 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Kartka papieru
        this.ctx.fillStyle = '#fef08a';
        this.ctx.fillRect(-9, -9, 18, 18);
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(-9, -9, 18, 18);

        // Drobne linijki ściągi
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(-6, -6, 12, 1);
        this.ctx.fillRect(-6, -3, 12, 1);
        this.ctx.fillRect(-6, 0, 12, 1);

        // Czerwony wykrzyknik
        this.ctx.fillStyle = '#dc2626';
        this.ctx.font = '900 11px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("!", 0, 8);
      } else if (item.type === 'answer') {
        // Kartka „📄 Odpowiedzi” do finału Semestru III
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius + 6 + pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Arkusz papieru z zagiętym rogiem
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(-9, -11, 18, 22);
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.lineWidth = 1.6;
        this.ctx.strokeRect(-9, -11, 18, 22);

        // Linijki odpowiedzi
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(-6, -7, 11, 2);
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(-6, -3, 12, 1.5);
        this.ctx.fillRect(-6, 0, 10, 1.5);
        this.ctx.fillRect(-6, 3, 11, 1.5);

        this.ctx.fillStyle = '#0369a1';
        this.ctx.font = '900 6.5px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("ODP", 0, 9);
      }

      this.ctx.restore();
    }
  }

  drawPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Efekt nietykalności / mrugania
    if (this.player.immunityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.4;
    }

    // 1. Miękki owalny cień pod stopami (czarny, alfa 0.35)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 13, 14, 5.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Smugi sprintu (afterimage effect)
    if (this.player.isSprinting) {
      const trailAngle = this.player.direction + Math.PI;
      for (const dist of [10, 18]) {
        this.ctx.save();
        this.ctx.translate(Math.cos(trailAngle) * dist, Math.sin(trailAngle) * dist);
        this.ctx.fillStyle = dist === 10 ? 'rgba(0, 75, 135, 0.35)' : 'rgba(242, 169, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius * 0.85, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    // 3. Złota tarcza Legitymacji (wirujący pulsujący heksagon)
    if (this.player.hasShield) {
      this.player.shieldPulse = (this.player.shieldPulse + 0.06) % (Math.PI * 2);
      const shieldR = this.player.radius + 11 + Math.sin(this.player.shieldPulse) * 2;
      this.ctx.save();
      this.ctx.rotate(this.player.shieldPulse);
      this.ctx.strokeStyle = '#f2a900';
      this.ctx.lineWidth = 2.2;
      this.ctx.fillStyle = 'rgba(242, 169, 0, 0.15)';
      this.ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const hx = Math.cos(a) * shieldR;
        const hy = Math.sin(a) * shieldR;
        if (s === 0) this.ctx.moveTo(hx, hy);
        else this.ctx.lineTo(hx, hy);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 4. Efekt ogłuszenia (wirujące gwiazdki nad głową)
    if (this.player.stunTimer > 0) {
      const angle = (Date.now() / 150) % (Math.PI * 2);
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText("💫", Math.cos(angle) * 16, Math.sin(angle) * 16 - 22);
    }

    // 5. Okrągły pasek postępu stania w kolejce w Dziekanacie
    if (this.player.deanStandTimer > 0) {
      const pct = Math.min(1, this.player.deanStandTimer / 3.0);
      this.ctx.strokeStyle = '#ffc740';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, -30, 10, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      this.ctx.stroke();
    }

    // 6. Ukrycie w krzaku: tylko półprzezroczysty zarys i błyszczące oczy
    if (this.player.isHidden) {
      this.ctx.globalAlpha = 0.45;
      this.ctx.strokeStyle = '#6ee7b7';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Błyszczące oczy wyglądające z krzaka
      this.ctx.globalAlpha = 1.0;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(-3, -2, 2.2, 0, Math.PI * 2);
      this.ctx.arc(3, -2, 2.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#10b981';
      this.ctx.beginPath();
      this.ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
      this.ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
      return;
    }

    // 7. Rysowanie figurki studenta w widoku 3/4 (wspólna funkcja dla gry i podglądu w sklepie)
    const cosDir = Math.cos(this.player.direction);
    const sinDir = Math.sin(this.player.direction);
    const isFacingLeft = cosDir < -0.15;
    const isFacingUp = sinDir < -0.65 && Math.abs(cosDir) < 0.65;

    const isMoving = Boolean(
      this.keys.up || this.keys.down || this.keys.left || this.keys.right ||
      this.isJoystickActive
    );
    const walk = isMoving ? Math.sin(this.player.walkCycle) * 4.5 : 0;
    const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 350) * 0.02);

    const equippedSkin = this.loadSkins().equipped;
    this.drawStudentFigure(this.ctx, {
      skinId: equippedSkin,
      isFacingLeft,
      isFacingUp,
      walk,
      breath
    });

    this.ctx.restore(); // koniec studenta
  }

  getSkinPalette(skinId) {
    switch (skinId) {
      case 'hoodie':
        return {
          torso: '#002244',
          hoodBack: '#001a35',
          sleeve: '#002244',
          chestText: 'ALK',
          chestTextColor: '#f2a900',
          drawstring: '#f2a900',
          pants: '#334155',
          shoe: '#001a35',
          shoeAccent: '#f2a900',
          backpack: '#f2a900',
          backpackPocket: '#d97706',
          isSport: false,
          isXmas: false,
          isGown: false
        };
      case 'sport':
        return {
          torso: '#dc2626',
          hoodBack: '#991b1b',
          sleeve: '#dc2626',
          chestText: 'AZS',
          chestTextColor: '#ffffff',
          drawstring: '#ffffff',
          pants: '#f8fafc',
          shoe: '#dc2626',
          shoeAccent: '#ffffff',
          backpack: '#ffffff',
          backpackPocket: '#dc2626',
          isSport: true,
          isXmas: false,
          isGown: false
        };
      case 'xmas':
        return {
          torso: '#b91c1c',
          hoodBack: '#15803d',
          sleeve: '#b91c1c',
          chestText: '',
          chestTextColor: '#ffffff',
          drawstring: '#15803d',
          pants: '#1e3a5f',
          shoe: '#451a03',
          shoeAccent: '#f8fafc',
          backpack: '#15803d',
          backpackPocket: '#dc2626',
          isSport: false,
          isXmas: true,
          isGown: false
        };
      case 'gown':
        return {
          torso: '#0f172a',
          hoodBack: '#020617',
          sleeve: '#0f172a',
          chestText: '',
          chestTextColor: '#f2a900',
          drawstring: '#f2a900',
          pants: '#0f172a',
          shoe: '#090d16',
          shoeAccent: '#334155',
          backpack: '#1e293b',
          backpackPocket: '#f2a900',
          isSport: false,
          isXmas: false,
          isGown: true
        };
      case 'default':
      default:
        return {
          torso: '#002244',
          hoodBack: '#001a35',
          sleeve: '#002244',
          chestText: 'ALK',
          chestTextColor: '#ffffff',
          drawstring: '#ffffff',
          pants: '#cbd5e1',
          shoe: '#002244',
          shoeAccent: '#ffffff',
          backpack: '#f2a900',
          backpackPocket: '#d97706',
          isSport: false,
          isXmas: false,
          isGown: false
        };
    }
  }

  drawStudentFigure(ctx, { skinId = 'default', isFacingLeft = false, isFacingUp = false, walk = 0, breath = 1.0 } = {}) {
    const pal = this.getSkinPalette(skinId);
    ctx.save();

    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // Nogi w spodniach i trampki/buty
    ctx.fillStyle = pal.pants;
    ctx.fillRect(-6.5, 5 + walk, 4.5, 7);
    ctx.fillRect(2, 5 - walk, 4.5, 7);

    if (pal.isSport) {
      // Czerwony lampas sportowy na spodenkach/dresie
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6.5, 5 + walk, 1.3, 6.5);
      ctx.fillRect(5.2, 5 - walk, 1.3, 6.5);
    }

    // Buty / Trampki
    ctx.fillStyle = pal.shoe;
    ctx.fillRect(-7, 11 + walk, 5.5, 3);
    ctx.fillRect(1.5, 11 - walk, 5.5, 3);
    ctx.fillStyle = pal.shoeAccent;
    ctx.fillRect(-7, 13 + walk, 5.5, 1.4);
    ctx.fillRect(1.5, 13 - walk, 5.5, 1.4);
    ctx.fillRect(-3, 11 + walk, 1.5, 2);
    ctx.fillRect(5.5, 11 - walk, 1.5, 2);

    // Tułów z delikatnym oddychaniem
    ctx.save();
    ctx.scale(1, breath);

    if (isFacingUp) {
      if (pal.isGown) {
        // Czarna toga absolwenta od tyłu (dłuższa)
        ctx.fillStyle = pal.torso;
        ctx.beginPath();
        ctx.roundRect(-8.5, -7, 17, 16, 3);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Złota szarfa absolwenta na ramionach
        ctx.fillStyle = '#f2a900';
        ctx.fillRect(-6, -7, 12, 3);
      } else {
        // Widok od tyłu: tył bluzy/swetra i plecak na plecach
        ctx.fillStyle = pal.torso;
        ctx.beginPath();
        ctx.roundRect(-8, -7, 16, 13, 3);
        ctx.fill();

        if (pal.isSport) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-8, -3, 16, 2);
        } else if (pal.isXmas) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(-8, 3, 16, 3);
        }

        // Plecak na środku
        ctx.fillStyle = pal.backpack;
        ctx.beginPath();
        ctx.roundRect(-5.5, -5, 11, 10, 2);
        ctx.fill();
        ctx.fillStyle = pal.backpackPocket;
        ctx.fillRect(-4.5, 1, 9, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -2, 6, 1.2);

        // Kaptur / kołnierz z tyłu
        ctx.fillStyle = pal.hoodBack;
        ctx.beginPath();
        ctx.ellipse(0, -7.5, 7.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tył głowy z brązowymi włosami (bez twarzy)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      if (!pal.isGown) {
        // Plecak wystający z tyłu/boku
        ctx.fillStyle = pal.backpack;
        ctx.beginPath();
        ctx.roundRect(-10.5, -5, 4.5, 10, 2);
        ctx.fill();
        ctx.fillStyle = pal.backpackPocket;
        ctx.fillRect(-9.5, -1, 3.5, 5);
      }

      // Tułów
      if (pal.isGown) {
        // Dłuższa czarna toga absolwenta
        ctx.fillStyle = pal.torso;
        ctx.beginPath();
        ctx.roundRect(-8.5, -7, 17, 16, 3);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Złota stuła akademicka z przodu
        ctx.fillStyle = '#f2a900';
        ctx.fillRect(-3.8, -7, 2.4, 13);
        ctx.fillRect(1.8, -7, 2.4, 13);
        // Biała koszula pod spodem u góry
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1.4, -7, 3.2, 4);
      } else {
        ctx.fillStyle = pal.torso;
        ctx.beginPath();
        ctx.roundRect(-7.5, -7, 15, 13, 3);
        ctx.fill();

        if (pal.isSport) {
          // Biały pas i kołnierzyk AZS
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-7.5, -7, 15, 2.2);
          ctx.fillRect(-7.5, 3.2, 15, 2.2);
        } else if (pal.isXmas) {
          // Zielony ściągacz i zygzak świąteczny na swetrze
          ctx.fillStyle = '#15803d';
          ctx.fillRect(-7.5, -7, 15, 2.2);
          ctx.fillRect(-7.5, 3.5, 15, 2.5);
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-6, 0.5);
          ctx.lineTo(-3, -2.5);
          ctx.lineTo(0, 0.5);
          ctx.lineTo(3, -2.5);
          ctx.lineTo(6, 0.5);
          ctx.stroke();
          // Złota gwiazdka / bąbelki śnieżne
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-0.8, -4.5, 1.8, 1.8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-4.8, 1.2, 1.4, 1.4);
          ctx.fillRect(3.6, 1.2, 1.4, 1.4);
        }

        // Napis na piersi („ALK” biały w default, złoty w hoodie, „AZS” w sport)
        if (pal.chestText) {
          ctx.fillStyle = pal.chestTextColor;
          ctx.font = '900 6.5px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (pal.chestText === 'ALK') {
            ctx.fillText("ALK", 0.5, -0.5);
          } else {
            ctx.fillText(pal.chestText, 0.5, -0.5);
          }
        }

        if (!pal.isSport && !pal.isXmas) {
          // Sznurki kaptura
          ctx.strokeStyle = pal.drawstring;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-2, -5);
          ctx.lineTo(-2, -2);
          ctx.moveTo(3, -5);
          ctx.lineTo(3, -2);
          ctx.stroke();
        }
      }

      // Ręce machające naprzemiennie
      ctx.fillStyle = pal.sleeve;
      ctx.fillRect(-9.5, -5 - walk * 0.7, 3.5, 8);
      ctx.fillRect(6, -5 + walk * 0.7, 3.5, 8);
      if (pal.isSport) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-9.5, -1 - walk * 0.7, 3.5, 1.8);
        ctx.fillRect(6, -1 + walk * 0.7, 3.5, 1.8);
      } else if (pal.isXmas) {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-9.5, 1 - walk * 0.7, 3.5, 1.8);
        ctx.fillRect(6, 1 + walk * 0.7, 3.5, 1.8);
      } else if (skinId === 'hoodie' || pal.isGown) {
        ctx.fillStyle = '#f2a900';
        ctx.fillRect(-9.5, 1 - walk * 0.7, 3.5, 1.4);
        ctx.fillRect(6, 1 + walk * 0.7, 3.5, 1.4);
      }
      ctx.fillStyle = '#fed7aa'; // dłonie
      ctx.fillRect(-9.5, 2.5 - walk * 0.7, 3.5, 3);
      ctx.fillRect(6, 2.5 + walk * 0.7, 3.5, 3);

      // Głowa z twarzą w widoku 3/4
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0.5, -11, 7.2, 0, Math.PI * 2);
      ctx.fill();

      // Włosy z modną grzywką
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -13, 7.5, Math.PI * 0.75, Math.PI * 2.25);
      ctx.fill();

      // Oczy patrzące w przód
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, -12, 1.8, 2.2);
    }

    // Biret akademicki na głowie dla stroju 'gown' (widoczny z każdej strony!)
    if (pal.isGown) {
      // Kapturek bazowy biretu
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5.5, -18.5, 11, 3.5);

      // Kwadratowa płyta biretu w rzucie 3/4
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -22.5);
      ctx.lineTo(10, -19);
      ctx.lineTo(0, -15.5);
      ctx.lineTo(-10, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Złoty guzik na czubku i frędzel zwisający z boku
      ctx.fillStyle = '#f2a900';
      ctx.beginPath();
      ctx.arc(0, -19, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f2a900';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.lineTo(7.5, -17.5);
      ctx.lineTo(8.5, -12.5);
      ctx.stroke();
      ctx.fillStyle = '#ffc740';
      ctx.fillRect(7.5, -13, 2.2, 2.8);
    }

    ctx.restore(); // koniec tułowia
    ctx.restore(); // koniec figurki
  }

  drawExaminer() {
    this.ctx.save();
    this.ctx.translate(this.examiner.x, this.examiner.y);

    // 1. Miękki owalny cień pod stopami (czarny, alfa 0.35)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 15, 16, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Paraliż Gemini AI - lśniąca bryła lodu z cyfrowymi iskrami
    if (this.examiner.freezeTimer > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2.5;
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.examiner.radius + 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Pęknięcia lodu
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(-10, -10);
      this.ctx.lineTo(0, -3);
      this.ctx.lineTo(12, -8);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Szał ściągi - płomienna czerwona aura i para z uszu
    if (this.examiner.rageTimer > 0) {
      const ragePulse = Math.sin(Date.now() / 80) * 3;
      this.ctx.save();
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 3;
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.examiner.radius + 16 + ragePulse, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Para unosząca się z uszu
      const steamY = Math.sin(Date.now() / 90) * 4;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.beginPath();
      this.ctx.arc(-14, -14 + steamY, 3.5, 0, Math.PI * 2);
      this.ctx.arc(14, -14 - steamY, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 4. Znacznik nad głową przeciwnika (czerwony) lub pokłon dla Rektora
    const examinerBowing = this.isBowingToRector(this.examiner);
    this.drawEnemyMarker(-33, '#ef4444');
    if (examinerBowing) {
      this.drawBowBadge(-44);
    }

    // 5. Figurka profesora w widoku 3/4
    const cosA = Math.cos(this.examiner.angle);
    const sinA = Math.sin(this.examiner.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.examiner.freezeTimer <= 0 && !examinerBowing;
    const walk = isMoving ? Math.sin(Date.now() / 90) * 4.5 : 0;
    const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 320) * 0.02);

    if (isFacingLeft) {
      this.ctx.scale(-1, 1);
    }

    // Nogi w szarych spodniach i czarne eleganckie buty
    this.ctx.fillStyle = '#334155'; // szare spodnie
    this.ctx.fillRect(-7, 6 + walk, 5, 8);
    this.ctx.fillRect(2, 6 - walk, 5, 8);

    this.ctx.fillStyle = '#090d16'; // czarne buty
    this.ctx.fillRect(-7.5, 13 + walk, 6, 3);
    this.ctx.fillRect(1.5, 13 - walk, 6, 3);

    // Tułów - szara marynarka z oddychaniem
    this.ctx.save();
    this.ctx.scale(1, breath);

    if (isFacingUp) {
      // Widok od tyłu: szara marynarka i tył głowy z wiankiem siwych włosów i łysiną
      this.ctx.fillStyle = '#475569';
      this.ctx.beginPath();
      this.ctx.roundRect(-9, -8, 18, 15, 3);
      this.ctx.fill();

      // Kołnierz marynarki
      this.ctx.fillStyle = '#334155';
      this.ctx.fillRect(-6, -9, 12, 2.5);

      // Tył głowy: siwe włosy po bokach i z tyłu
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.beginPath();
      this.ctx.arc(0, -12, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Łysina na czubku głowy
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.beginPath();
      this.ctx.ellipse(0, -13, 5, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();

    } else {
      // Szara marynarka
      this.ctx.fillStyle = '#475569';
      this.ctx.beginPath();
      this.ctx.roundRect(-9, -8, 18, 15, 3);
      this.ctx.fill();

      // Biała koszula pod marynarką
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(-3, -8);
      this.ctx.lineTo(3, -8);
      this.ctx.lineTo(0, -1);
      this.ctx.closePath();
      this.ctx.fill();

      // Czerwony krawat
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.moveTo(-1.5, -6);
      this.ctx.lineTo(1.5, -6);
      this.ctx.lineTo(1.2, 4);
      this.ctx.lineTo(0, 6.5);
      this.ctx.lineTo(-1.2, 4);
      this.ctx.closePath();
      this.ctx.fill();

      // Lewa ręka
      this.ctx.fillStyle = '#475569';
      this.ctx.fillRect(-11, -6 - walk * 0.6, 4, 9);
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-11, 2.5 - walk * 0.6, 4, 3);

      // Głowa: twarz, siwe włosy i łysina
      this.ctx.fillStyle = '#94a3b8'; // siwe włosy po bokach
      this.ctx.beginPath();
      this.ctx.arc(0, -12, 8.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fed7aa'; // twarz
      this.ctx.beginPath();
      this.ctx.arc(1, -11.5, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Łysina na czubku
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.beginPath();
      this.ctx.ellipse(0, -14, 5, 3.5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Druciane okulary
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 1.3;
      this.ctx.strokeRect(2, -13.5, 4, 3.5);
      this.ctx.strokeRect(-2.5, -13.5, 4, 3.5);
      this.ctx.beginPath();
      this.ctx.moveTo(1.5, -12);
      this.ctx.lineTo(2, -12);
      this.ctx.stroke();

      // Prawa ręka z dużym czerwonym długopisem wymachiwanym w ruchu
      const penSwing = Math.sin(Date.now() / 85) * 0.45;
      this.ctx.save();
      this.ctx.translate(8, -3);
      this.ctx.rotate(0.2 + penSwing);

      // Rękaw
      this.ctx.fillStyle = '#475569';
      this.ctx.fillRect(-2, -3, 4.5, 8);
      // Dłoń
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-2, 4.5, 4.5, 3.5);

      // Duży czerwony długopis
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(0, 0, 16, 3.5);
      // Złoty klips
      this.ctx.fillStyle = '#f2a900';
      this.ctx.fillRect(3, -1.2, 7, 1.5);
      // Stalówka
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(16, 0);
      this.ctx.lineTo(21, 1.75);
      this.ctx.lineTo(16, 3.5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    this.ctx.restore(); // koniec tułowia
    this.ctx.restore(); // koniec profesora
  }

  drawInstructor() {
    this.ctx.save();
    this.ctx.translate(this.instructor.x, this.instructor.y);

    // 1. Miękki owalny cień pod stopami (czarny, alfa 0.35)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 15, 5.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Paraliż Gemini AI - lśniąca bryła lodu
    if (this.instructor.freezeTimer > 0) {
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2.5;
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.instructor.radius + 13, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // 3. Znacznik nad głową przeciwnika (zielony) lub pokłon dla Rektora
    const instBowing = this.isBowingToRector(this.instructor);
    this.drawEnemyMarker(-31, '#10b981');
    if (instBowing) {
      this.drawBowBadge(-42);
    }

    // 4. Figurka prowadzącego ćwiczenia w widoku 3/4
    const cosA = Math.cos(this.instructor.angle);
    const sinA = Math.sin(this.instructor.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.instructor.freezeTimer <= 0 && !instBowing;
    const walk = isMoving ? Math.sin(Date.now() / 100) * 4 : 0;
    const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 340) * 0.02);

    if (isFacingLeft) {
      this.ctx.scale(-1, 1);
    }

    // Nogi w ciemnych chinosach i brązowe buty
    this.ctx.fillStyle = '#1e293b'; // chinosy
    this.ctx.fillRect(-6.5, 5 + walk, 4.5, 7.5);
    this.ctx.fillRect(2, 5 - walk, 4.5, 7.5);

    this.ctx.fillStyle = '#451a03'; // brązowe buty
    this.ctx.fillRect(-7, 12 + walk, 5.5, 3);
    this.ctx.fillRect(1.5, 12 - walk, 5.5, 3);

    // Tułów - zielony sweter w serek z oddychaniem
    this.ctx.save();
    this.ctx.scale(1, breath);

    if (isFacingUp) {
      // Widok od tyłu: zielony sweter i tył głowy z brązowymi włosami
      this.ctx.fillStyle = '#059669';
      this.ctx.beginPath();
      this.ctx.roundRect(-8, -7, 16, 14, 3);
      this.ctx.fill();

      // Ściągacz swetra
      this.ctx.fillStyle = '#047857';
      this.ctx.fillRect(-6, -8, 12, 2);

      // Tył głowy z brązowymi włosami
      this.ctx.fillStyle = '#78350f';
      this.ctx.beginPath();
      this.ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

    } else {
      // Zielony sweter
      this.ctx.fillStyle = '#059669';
      this.ctx.beginPath();
      this.ctx.roundRect(-8, -7, 16, 14, 3);
      this.ctx.fill();

      // Dekolt w serek ze ściągaczem
      this.ctx.fillStyle = '#047857';
      this.ctx.beginPath();
      this.ctx.moveTo(-3, -7);
      this.ctx.lineTo(3, -7);
      this.ctx.lineTo(0, -1);
      this.ctx.closePath();
      this.ctx.fill();

      // Biały kołnierzyk koszuli
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(-2, -7);
      this.ctx.lineTo(2, -7);
      this.ctx.lineTo(0, -2.5);
      this.ctx.closePath();
      this.ctx.fill();

      // Lewa ręka
      this.ctx.fillStyle = '#059669';
      this.ctx.fillRect(-10, -5 - walk * 0.6, 3.5, 8);
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-10, 2.5 - walk * 0.6, 3.5, 2.5);

      // Głowa: twarz, brązowe włosy, zarost i okulary na czole
      this.ctx.fillStyle = '#78350f'; // włosy
      this.ctx.beginPath();
      this.ctx.arc(0, -11, 7.8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fed7aa'; // twarz
      this.ctx.beginPath();
      this.ctx.arc(0.5, -10.5, 6.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Przystrzyżona broda na linii szczęki
      this.ctx.fillStyle = '#78350f';
      this.ctx.beginPath();
      this.ctx.arc(1, -9.5, 6.2, Math.PI * 0.15, Math.PI * 0.85);
      this.ctx.fill();

      // Oczy
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(2, -11, 1.6, 1.8);

      // Okulary zsunięte na czoło
      this.ctx.strokeStyle = '#0284c7';
      this.ctx.lineWidth = 1.2;
      this.ctx.strokeRect(-2, -16, 3.5, 3);
      this.ctx.strokeRect(2.5, -16, 3.5, 3);
      this.ctx.beginPath();
      this.ctx.moveTo(1.5, -14.5);
      this.ctx.lineTo(2.5, -14.5);
      this.ctx.stroke();

      // Prawa ręka trzymająca skórzaną teczkę akademicką
      this.ctx.save();
      this.ctx.translate(7.5, -2);

      // Rękaw
      this.ctx.fillStyle = '#059669';
      this.ctx.fillRect(-1.5, -3, 3.5, 7);
      // Dłoń
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-1.5, 4, 3.5, 2.5);

      // Teczka akademicka ze skóry
      this.ctx.fillStyle = '#78350f';
      this.ctx.beginPath();
      this.ctx.roundRect(0, 2, 13, 9, 1.5);
      this.ctx.fill();
      this.ctx.strokeStyle = '#b45309';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Rączka teczki
      this.ctx.strokeStyle = '#451a03';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.arc(6.5, 2, 2.5, Math.PI, 0);
      this.ctx.stroke();

      // Mosiężny zamek / klamra teczki
      this.ctx.fillStyle = '#f2a900';
      this.ctx.fillRect(5, 5.5, 3, 2);

      this.ctx.restore();
    }

    this.ctx.restore(); // koniec tułowia
    this.ctx.restore(); // koniec prowadzącego
  }

  drawDeanClerk() {
    this.ctx.save();
    this.ctx.translate(this.deanClerk.x, this.deanClerk.y);

    // 1. Miękki owalny cień pod stopami (czarny, alfa 0.35)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 14, 5.2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Paraliż Gemini AI - lśniąca bryła lodu
    if (this.deanClerk.freezeTimer > 0) {
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2.5;
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.deanClerk.radius + 13, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // 3. Znacznik nad głową przeciwnika (fioletowy) lub pokłon dla Rektora
    const deanBowing = this.isBowingToRector(this.deanClerk);
    this.drawEnemyMarker(-32, '#a855f7');
    if (deanBowing) {
      this.drawBowBadge(-43);
    }

    // 4. Figurka Pani z dziekanatu w widoku 3/4
    const cosA = Math.cos(this.deanClerk.angle);
    const sinA = Math.sin(this.deanClerk.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.deanClerk.freezeTimer <= 0 && !deanBowing;
    const walk = isMoving ? Math.sin(Date.now() / 115) * 3.5 : 0;
    const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 360) * 0.02);

    if (isFacingLeft) {
      this.ctx.scale(-1, 1);
    }

    // Fioletowa spódnica ołówkowa
    this.ctx.fillStyle = '#6b21a8';
    this.ctx.beginPath();
    this.ctx.roundRect(-6.5, 2.5, 13, 6.5, 1.5);
    this.ctx.fill();

    // Nogi w ciemnych rajstopach
    this.ctx.fillStyle = '#1e1b4b';
    this.ctx.fillRect(-5, 8.5 + walk, 3.5, 5);
    this.ctx.fillRect(1.5, 8.5 - walk, 3.5, 5);

    // Buty czółenka na niskim obcasie
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(-5.5, 12.5 + walk, 4.5, 2.5);
    this.ctx.fillRect(1, 12.5 - walk, 4.5, 2.5);

    // Tułów - fioletowy żakiet z oddychaniem
    this.ctx.save();
    this.ctx.scale(1, breath);

    if (isFacingUp) {
      // Widok od tyłu: fioletowy taliowany żakiet i tył głowy z blond kokiem i czerwoną szpilką
      this.ctx.fillStyle = '#7e22ce';
      this.ctx.beginPath();
      this.ctx.roundRect(-7.5, -7, 15, 11, 2.5);
      this.ctx.fill();

      // Tył głowy z blond włosami
      this.ctx.fillStyle = '#fde047';
      this.ctx.beginPath();
      this.ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Kok na czubku głowy
      this.ctx.fillStyle = '#eab308';
      this.ctx.beginPath();
      this.ctx.arc(0, -16, 5, 0, Math.PI * 2);
      this.ctx.fill();

      // Czerwona szpilka przebijająca kok
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(-6, -17.5);
      this.ctx.lineTo(6, -14.5);
      this.ctx.stroke();

    } else {
      // Fioletowy żakiet taliowany
      this.ctx.fillStyle = '#7e22ce';
      this.ctx.beginPath();
      this.ctx.roundRect(-7.5, -7, 15, 11, 2.5);
      this.ctx.fill();

      // Klapy żakietu i biała apaszka
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.beginPath();
      this.ctx.moveTo(-2.5, -7);
      this.ctx.lineTo(2.5, -7);
      this.ctx.lineTo(0, -2);
      this.ctx.closePath();
      this.ctx.fill();

      // Perłowe guziki
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
      this.ctx.arc(0, 2.5, 1.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Lewa ręka
      this.ctx.fillStyle = '#7e22ce';
      this.ctx.fillRect(-9.5, -5 - walk * 0.5, 3.2, 7.5);
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-9.5, 2 - walk * 0.5, 3.2, 2.5);

      // Głowa: twarz, blond włosy
      this.ctx.fillStyle = '#fde047'; // włosy
      this.ctx.beginPath();
      this.ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fed7aa'; // twarz
      this.ctx.beginPath();
      this.ctx.arc(0.5, -10.5, 6.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Kok na górze głowy
      this.ctx.fillStyle = '#eab308';
      this.ctx.beginPath();
      this.ctx.arc(0, -16, 4.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Czerwona szpilka do koka
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(-5.5, -17.5);
      this.ctx.lineTo(5.5, -14.5);
      this.ctx.stroke();

      // Okulary urzędnicze na złotym łańcuszku
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 1.2;
      this.ctx.strokeRect(-2, -12, 3.2, 3);
      this.ctx.strokeRect(2.2, -12, 3.2, 3);
      this.ctx.beginPath();
      this.ctx.moveTo(1.2, -10.5);
      this.ctx.lineTo(2.2, -10.5);
      // Łańcuszek opadający ku ramionom
      this.ctx.moveTo(-2, -10.5);
      this.ctx.quadraticCurveTo(-4, -8, -3, -5);
      this.ctx.stroke();

      // Oczy o surowym spojrzeniu
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(2.8, -11, 1.6, 1.5);

      // Prawa ręka trzymająca urzędową pieczątkę
      const stampPulse = Math.sin(Date.now() / 90) * 0.2;
      this.ctx.save();
      this.ctx.translate(7, -2);
      this.ctx.rotate(stampPulse);

      // Rękaw
      this.ctx.fillStyle = '#7e22ce';
      this.ctx.fillRect(-1.5, -3, 3.2, 6.5);
      // Dłoń
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.fillRect(-1.5, 3.5, 3.2, 2.5);

      // Urzędowa pieczątka: drewniany trzonek i czerwona głowica
      this.ctx.fillStyle = '#78350f'; // drewniany uchwyt
      this.ctx.fillRect(0, 1, 3.5, 6);
      this.ctx.fillStyle = '#f2a900'; // mosiężna główka
      this.ctx.beginPath();
      this.ctx.arc(1.75, 1, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Czerwona podstawa pieczątki (stempel)
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(-1, 7, 5.5, 3);
      this.ctx.restore();
    }

    this.ctx.restore(); // koniec tułowia
    this.ctx.restore(); // koniec Pani z dziekanatu

    // Efekt stempla „PIECZĄTKA!” gdy gracz jest ogłuszony przez Panią z dziekanatu
    if (this.player && this.player.stunTimer > 0) {
      this.ctx.save();
      this.ctx.translate(this.player.x, this.player.y - 32);
      this.ctx.rotate(-0.18);
      this.ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
      this.ctx.strokeStyle = '#dc2626';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-45, -12, 90, 24);
      this.ctx.strokeRect(-42, -9, 84, 18);
      this.ctx.font = '900 12px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText("PIECZĄTKA!", 0, 0);
      this.ctx.restore();
    }
  }

  drawBowBadge(yOffset) {
    this.ctx.save();
    this.ctx.font = '15px "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('🙇', 0, yOffset);
    this.ctx.restore();
  }

  drawSecurityGuardFlashlight() {
    if (!this.securityGuard) return;
    const guard = this.securityGuard;
    if (guard.freezeTimer > 0 || this.isBowingToRector(guard)) return;

    this.ctx.save();
    const range = 150;
    const halfSpread = Math.PI / 4; // 90 stopni stożek światła
    const grad = this.ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, range);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.34)');
    grad.addColorStop(0.65, 'rgba(250, 204, 21, 0.14)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(guard.x, guard.y);
    this.ctx.arc(guard.x, guard.y, range, guard.angle - halfSpread, guard.angle + halfSpread);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSecurityGuard() {
    const guard = this.securityGuard;
    if (!guard) return;

    this.ctx.save();
    this.ctx.translate(guard.x, guard.y);

    // 1. Cień pod stopami
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 15, 5.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Zamrożenie Gemini AI
    if (guard.freezeTimer > 0) {
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2.5;
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, guard.radius + 13, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // 3. Znacznik ochroniarza i pokłon dla Rektora
    const guardBowing = this.isBowingToRector(guard);
    this.drawEnemyMarker(-32, '#3b82f6');
    if (guardBowing) {
      this.drawBowBadge(-43);
    }

    // 4. Figurka Pana z ochrony w widoku 3/4 (granatowy mundur, czapka z daszkiem, latarka)
    const cosA = Math.cos(guard.angle);
    const sinA = Math.sin(guard.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = guard.freezeTimer <= 0 && !guardBowing;
    const walk = isMoving ? Math.sin(Date.now() / 105) * 4 : 0;

    this.ctx.save();
    if (isFacingLeft) this.ctx.scale(-1, 1);

    // Spodnie mundurowe i ciężkie buty
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-6.5, 5 + walk, 4.5, 8);
    this.ctx.fillRect(2, 5 - walk, 4.5, 8);
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(-7, 12 + walk, 5.5, 3);
    this.ctx.fillRect(1.5, 12 - walk, 5.5, 3);

    // Granatowy mundur
    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.beginPath();
    this.ctx.roundRect(-8.5, -7, 17, 14, 3);
    this.ctx.fill();

    // Pagon i pas służbowy
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-8.5, 3.5, 17, 2.5);
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillRect(-1.5, 3.5, 3, 2.5); // klamra pasa

    if (!isFacingUp) {
      // Krawat i srebrna odznaka ochrony na piersi
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(-1.5, -6, 3, 8);
      this.ctx.fillStyle = '#93c5fd';
      this.ctx.beginPath();
      this.ctx.arc(4.2, -2.5, 2.1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Lewa ręka
    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.fillRect(-10.5, -5 - walk * 0.6, 3.5, 8);
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(-10.5, 2.5 - walk * 0.6, 3.5, 2.5);

    // Głowa i czapka z daszkiem
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.beginPath();
    this.ctx.arc(0, -11, 7, 0, Math.PI * 2);
    this.ctx.fill();

    // Czapka służbowa z daszkiem
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(0, -13.5, 7.6, Math.PI, 0);
    this.ctx.fill();
    this.ctx.fillStyle = '#1e40af';
    this.ctx.fillRect(-7.5, -14.5, 15, 2.8);
    if (!isFacingUp) {
      // Daszek czapki skierowany w przód
      this.ctx.fillStyle = '#020617';
      this.ctx.fillRect(0, -12.5, 9.5, 2.4);
      // Złoty znaczek na czapce
      this.ctx.fillStyle = '#f2a900';
      this.ctx.fillRect(0.5, -16, 2.5, 2);
      // Oko
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(2.5, -10.5, 1.6, 1.8);
    }

    // Prawa ręka z latarką
    this.ctx.save();
    this.ctx.translate(7.5, -2);
    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.fillRect(-1.5, -3, 3.5, 6.5);
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(-1.5, 3, 3.5, 2.5);
    // Korpus latarki
    this.ctx.fillStyle = '#334155';
    this.ctx.fillRect(0, 1, 9, 3.5);
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillRect(8.5, 0.5, 2.5, 4.5);
    this.ctx.restore();

    this.ctx.restore(); // koniec odbicia kierunku

    // Tekst nad ochroniarzem po gwizdku („Nie biegamy po korytarzu!”)
    if (guard.whistleTextTimer > 0 && guard.whistleText) {
      this.ctx.save();
      this.ctx.font = '800 10.5px Outfit, sans-serif';
      const textWidth = this.ctx.measureText(guard.whistleText).width;
      const boxW = textWidth + 14;
      const boxY = -52;
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(-boxW / 2, boxY - 11, boxW, 20, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#fef08a';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(guard.whistleText, 0, boxY - 1);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  drawRector() {
    const rector = this.rector;
    if (!rector) return;

    this.ctx.save();
    this.ctx.translate(rector.x, rector.y);

    // Złota poświata sojusznika (zachęta do uścisku dłoni)
    if (!rector.shookHand) {
      const pulse = 0.25 + Math.sin(Date.now() / 160) * 0.1;
      const grad = this.ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
      grad.addColorStop(0, `rgba(242, 169, 0, ${pulse})`);
      grad.addColorStop(1, 'rgba(242, 169, 0, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Cień
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 15, 5.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Złota ikona nad Rektorem
    this.ctx.font = '14px "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎩', 0, -31);

    const cosA = Math.cos(rector.angle);
    const sinA = Math.sin(rector.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const walk = Math.sin(Date.now() / 130) * 3.5;

    this.ctx.save();
    if (isFacingLeft) this.ctx.scale(-1, 1);

    // Eleganckie czarne spodnie i lakierki
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(-6.5, 5 + walk, 4.5, 8);
    this.ctx.fillRect(2, 5 - walk, 4.5, 8);
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(-7, 12 + walk, 5.5, 3);
    this.ctx.fillRect(1.5, 12 - walk, 5.5, 3);

    // Elegancki czarny garnitur / marynarka
    this.ctx.fillStyle = '#111827';
    this.ctx.beginPath();
    this.ctx.roundRect(-8.5, -7, 17, 14, 3);
    this.ctx.fill();

    if (!isFacingUp) {
      // Biała koszula
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(-3, -7);
      this.ctx.lineTo(3, -7);
      this.ctx.lineTo(0, 0);
      this.ctx.closePath();
      this.ctx.fill();

      // Złoty łańcuch rektorski z medalionem ALK
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.moveTo(-5.5, -7);
      this.ctx.quadraticCurveTo(0, 1.5, 5.5, -7);
      this.ctx.stroke();
      this.ctx.fillStyle = '#f2a900';
      this.ctx.beginPath();
      this.ctx.arc(0, -1, 2.4, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Złote obszycie kołnierza od tyłu
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 1.6;
      this.ctx.strokeRect(-5, -7, 10, 2);
    }

    // Ręce
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(-10.5, -5 - walk * 0.5, 3.2, 8);
    this.ctx.fillRect(7.3, -5 + walk * 0.5, 3.2, 8);
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(-10.5, 2.5 - walk * 0.5, 3.2, 2.5);
    this.ctx.fillRect(7.3, 2.5 + walk * 0.5, 3.2, 2.5);

    // Głowa: dostojne siwe włosy
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.beginPath();
    this.ctx.arc(0, -11, 7.6, 0, Math.PI * 2);
    this.ctx.fill();

    if (!isFacingUp) {
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.beginPath();
      this.ctx.arc(0.5, -10.5, 6.6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(2.2, -11, 1.5, 1.7);
    }

    this.ctx.restore(); // koniec odbicia

    // Wypowiedź po uścisku dłoni („Gratuluję wyników!”)
    if (rector.speechTimer > 0 && rector.speechText) {
      this.ctx.save();
      this.ctx.font = '800 10.5px Outfit, sans-serif';
      const w = this.ctx.measureText(rector.speechText).width + 14;
      const by = -49;
      this.ctx.fillStyle = 'rgba(0, 34, 68, 0.94)';
      this.ctx.strokeStyle = '#ffc740';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(-w / 2, by - 11, w, 20, 6);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#fde68a';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(rector.speechText, 0, by - 1);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  drawBoss() {
    const boss = this.boss;
    if (!boss) return;

    this.ctx.save();
    this.ctx.translate(boss.x, boss.y);

    // 1. Cień pod dużym stołem komisji
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 16, 30, 9, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Zamrożenie Gemini AI
    if (boss.freezeTimer > 0) {
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, boss.radius + 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // 3. Znacznik bossa nad głową
    this.drawEnemyMarker(-35, '#dc2626');
    if (this.isBowingToRector(boss)) {
      this.drawBowBadge(-46);
    }

    // 4. Trzech egzaminatorów siedzących za stołem komisji (styl 3/4)
    const bob = boss.freezeTimer <= 0 ? Math.sin(Date.now() / 130) * 1.6 : 0;
    const members = [
      { ox: -16, oy: -4 + bob, suit: '#334155', hair: '#94a3b8' },
      { ox: 0, oy: -6 - bob, suit: '#1e293b', hair: '#475569' },
      { ox: 16, oy: -4 + bob, suit: '#334155', hair: '#78350f' }
    ];

    for (const m of members) {
      // Marynarka
      this.ctx.fillStyle = m.suit;
      this.ctx.beginPath();
      this.ctx.roundRect(m.ox - 6.5, m.oy - 4, 13, 10, 2.5);
      this.ctx.fill();
      // Krawat czerwony/złoty
      this.ctx.fillStyle = m.ox === 0 ? '#f2a900' : '#dc2626';
      this.ctx.fillRect(m.ox - 1, m.oy - 3, 2, 6);
      // Głowa i włosy
      this.ctx.fillStyle = m.hair;
      this.ctx.beginPath();
      this.ctx.arc(m.ox, m.oy - 9, 5.8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.beginPath();
      this.ctx.arc(m.ox, m.oy - 8.2, 4.8, 0, Math.PI * 2);
      this.ctx.fill();
      // Okulary przewodniczącego
      if (m.ox === 0) {
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(m.ox - 3.5, m.oy - 9.5, 2.8, 2.2);
        this.ctx.strokeRect(m.ox + 0.7, m.oy - 9.5, 2.8, 2.2);
      }
    }

    // 5. Długi mahoniowy stół egzaminacyjny na pierwszym planie
    this.ctx.fillStyle = '#78350f';
    this.ctx.beginPath();
    this.ctx.roundRect(-27, 0, 54, 13, 3);
    this.ctx.fill();
    this.ctx.strokeStyle = '#f2a900';
    this.ctx.lineWidth = 1.4;
    this.ctx.stroke();

    // Zielone sukno / blacha frontowa i stosy arkuszy pytań na stole
    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(-25, 9, 50, 5);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(-18, 2, 9, 5);
    this.ctx.fillRect(9, 2, 9, 5);
    this.ctx.fillStyle = '#dc2626';
    this.ctx.fillRect(-2, 3, 4, 3); // czerwony dzwonek/pieczątka

    this.ctx.restore();
  }

  drawBossProjectiles() {
    if (!this.bossProjectiles || this.bossProjectiles.length === 0) return;
    this.ctx.save();
    for (const p of this.bossProjectiles) {
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = 'bold 14px "Segoe UI Emoji", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('❓', p.x, p.y);
    }
    this.ctx.restore();
  }

  drawBlackoutEffect() {
    this.ctx.save();
    // 1. Ciemność rysowana na OSOBNEJ warstwie (offscreen canvas).
    //    Dzięki temu 'destination-out' wycina dziurę tylko w ciemności,
    //    a nie w całej planszy pod spodem (wcześniej latarka pokazywała czarną dziurę).
    const mainCanvas = this.canvas;
    if (!this._darkCanvas) this._darkCanvas = document.createElement('canvas');
    const dc = this._darkCanvas;
    if (dc.width !== mainCanvas.width || dc.height !== mainCanvas.height) {
      dc.width = mainCanvas.width;
      dc.height = mainCanvas.height;
    }
    const dctx = dc.getContext('2d');
    const scale = mainCanvas.width / CANVAS_WIDTH;
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, dc.width, dc.height);
    dctx.setTransform(scale, 0, 0, scale, 0, 0);
    dctx.fillStyle = 'rgba(2, 6, 18, 0.96)';
    dctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Miękki stożek latarki studenta — wycinany tylko w warstwie ciemności
    dctx.globalCompositeOperation = 'destination-out';

    // Okrąg światła wokół studenta (promień 60 px)
    const footGrad = dctx.createRadialGradient(this.player.x, this.player.y, 8, this.player.x, this.player.y, 60);
    footGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    footGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.75)');
    footGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dctx.fillStyle = footGrad;
    dctx.beginPath();
    dctx.arc(this.player.x, this.player.y, 60, 0, Math.PI * 2);
    dctx.fill();

    // Stożek latarki skierowany w kierunku ruchu studenta (kąt ~65°, zasięg 180 px)
    const coneAngle = this.player.direction || 0;
    const halfSpread = 0.55;
    const range = 180;
    const coneGrad = dctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, range);
    coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    coneGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.8)');
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dctx.fillStyle = coneGrad;
    dctx.beginPath();
    dctx.moveTo(this.player.x, this.player.y);
    dctx.arc(this.player.x, this.player.y, range, coneAngle - halfSpread, coneAngle + halfSpread);
    dctx.closePath();
    dctx.fill();
    dctx.globalCompositeOperation = 'source-over';

    // Nałożenie gotowej warstwy ciemności na planszę (w tej samej skali i z drganiami ekranu)
    this.ctx.drawImage(dc, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 3. Klimatyczne ciepłe ziarno światła latarki
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const flashGrad = this.ctx.createRadialGradient(this.player.x, this.player.y, 4, this.player.x, this.player.y, range);
    flashGrad.addColorStop(0, 'rgba(255, 245, 200, 0.18)');
    flashGrad.addColorStop(0.5, 'rgba(255, 245, 200, 0.08)');
    flashGrad.addColorStop(1, 'rgba(255, 245, 200, 0)');
    this.ctx.fillStyle = flashGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x, this.player.y);
    this.ctx.arc(this.player.x, this.player.y, range, coneAngle - halfSpread, coneAngle + halfSpread);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 4. Świecące czerwone oczy przeciwników w ciemności
    const enemies = [this.examiner, this.instructor, this.deanClerk, this.securityGuard, this.boss];
    for (const en of enemies) {
      if (en) {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(en.x - 4, en.y - 2, 2.8, 0, Math.PI * 2);
        this.ctx.arc(en.x + 4, en.y - 2, 2.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }

    this.ctx.restore();
  }

  drawParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  drawFloatingTexts() {
    this.ctx.save();
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      this.ctx.globalAlpha = alpha;
      this.ctx.font = '800 12px Outfit, sans-serif';
      this.ctx.textAlign = 'center';

      // Ciemna obwódka (strokeText) zapewniająca czytelność na każdej podłodze
      this.ctx.strokeStyle = 'rgba(6, 10, 25, 0.95)';
      this.ctx.lineWidth = 3.5;
      this.ctx.lineJoin = 'round';
      this.ctx.strokeText(ft.text, ft.x, ft.y);

      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.restore();
  }

  drawFinalTarget() {
    if (!this.finalPhase || !this.finalTarget) return;

    const { x, y, w, h } = this.finalTarget;
    const isLocked = this.currentSemester === 3 && this.bossAnswersCollected < 3;
    const pulse = Math.sin(Date.now() / 150);
    const glowAlpha = isLocked ? 0.2 : (0.35 + pulse * 0.15);
    const bounce = isLocked ? 0 : Math.sin(Date.now() / 200) * 3;

    this.ctx.save();
    // 1. Poświata obszaru oddania indeksu (szara gdy zablokowane w Sem. III, złota gdy odblokowane)
    const grad = this.ctx.createRadialGradient(x, y, 6, x, y, 42);
    if (isLocked) {
      grad.addColorStop(0, `rgba(148, 163, 184, ${glowAlpha})`);
      grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
    } else {
      grad.addColorStop(0, `rgba(255, 199, 64, ${glowAlpha})`);
      grad.addColorStop(0.7, `rgba(242, 169, 0, ${glowAlpha * 0.4})`);
      grad.addColorStop(1, 'rgba(242, 169, 0, 0)');
    }
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 42, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Obrys strefy 40x40
    this.ctx.strokeStyle = isLocked ? '#94a3b8' : '#ffd700';
    this.ctx.lineWidth = isLocked ? 2 : (2.5 + pulse * 0.5);
    this.ctx.setLineDash([6, 4]);
    this.ctx.lineDashOffset = isLocked ? 0 : -Date.now() / 50;
    this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    this.ctx.setLineDash([]); // reset kreskowania

    // 3. Wypełnienie wnętrza
    this.ctx.fillStyle = isLocked ? 'rgba(100, 116, 139, 0.25)' : 'rgba(242, 169, 0, 0.18)';
    this.ctx.fillRect(x - w / 2, y - h / 2, w, h);

    // 4. Ikona kłódki lub indeksu unosząca się w środku
    this.ctx.font = '20px "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(isLocked ? '🔒' : '📑', x, y - 2 + bounce);

    // 5. Napis nad/pod strefą
    this.ctx.font = '900 10px Outfit, sans-serif';
    this.ctx.fillStyle = isLocked ? '#cbd5e1' : '#ffc740';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 6;
    this.ctx.fillText(isLocked ? `ZABLOKOWANE (${this.bossAnswersCollected}/3)` : 'ODDAJ INDEKS', x, y + h / 2 + 13);
    this.ctx.restore();
  }

  drawTargetPointer() {
    if (!this.finalPhase || !this.finalTarget || !this.player) return;

    const dx = this.finalTarget.x - this.player.x;
    const dy = this.finalTarget.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 35) return; // bardzo blisko celu nie rysujemy strzałki

    const angle = Math.atan2(dy, dx);
    const pulse = Math.sin(Date.now() / 120) * 3;
    const arrowDist = 28 + pulse;

    const arrowX = this.player.x + Math.cos(angle) * arrowDist;
    const arrowY = this.player.y + Math.sin(angle) * arrowDist;

    this.ctx.save();
    this.ctx.translate(arrowX, arrowY);
    this.ctx.rotate(angle);

    // Złota strzałka
    this.ctx.shadowColor = 'rgba(242, 169, 0, 0.8)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#ffd700';
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0); // czubek strzałki
    this.ctx.lineTo(-6, -6);
    this.ctx.lineTo(-3, 0);
    this.ctx.lineTo(-6, 6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawFinalVignette() {
    if (!this.finalPhase) return;

    const pulse = 0.25 + Math.sin(Date.now() / 250) * 0.08;
    this.ctx.save();
    const g = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.35,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.68
    );
    g.addColorStop(0, 'rgba(220, 38, 38, 0)');
    g.addColorStop(0.7, `rgba(185, 28, 28, ${pulse * 0.4})`);
    g.addColorStop(1, `rgba(127, 29, 29, ${pulse})`);

    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.restore();
  }

  drawFlyingOrbs() {
    if (!this.flyingOrbs || this.flyingOrbs.length === 0) return;
    this.ctx.save();
    for (const orb of this.flyingOrbs) {
      const alpha = Math.max(0, 1 - orb.progress * 0.8);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = orb.color || '#ffc740';
      this.ctx.shadowColor = orb.color || '#ffc740';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = '800 11px Outfit, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(orb.text, orb.x, orb.y - 8);
    }
    this.ctx.restore();
  }

  drawCatchScratch() {
    if (!this.isCaughtSequence) return;
    this.ctx.save();
    // Czerwone przekreślenie egzaminatora czerwonym długopisem
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = 'rgba(185, 28, 28, 0.8)';
    this.ctx.shadowBlur = 12;

    const progress = Math.min(1.0, (0.4 - this.caughtTimer) / 0.25);
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.8);
    this.ctx.lineTo(
      CANVAS_WIDTH * 0.15 + (CANVAS_WIDTH * 0.7) * progress,
      CANVAS_HEIGHT * 0.8 - (CANVAS_HEIGHT * 0.6) * progress
    );
    this.ctx.stroke();

    if (progress > 0.5) {
      const p2 = (progress - 0.5) * 2;
      this.ctx.beginPath();
      this.ctx.moveTo(CANVAS_WIDTH * 0.18, CANVAS_HEIGHT * 0.25);
      this.ctx.lineTo(
        CANVAS_WIDTH * 0.18 + (CANVAS_WIDTH * 0.64) * p2,
        CANVAS_HEIGHT * 0.25 + (CANVAS_HEIGHT * 0.55) * p2
      );
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawWhiteFlash() {
    if (this.whiteFlashTimer <= 0) return;
    this.ctx.save();
    const alpha = Math.min(0.6, this.whiteFlashTimer * 7.5);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.restore();
  }
}

// Inicjalizacja gry po załadowaniu drzewa DOM
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.kozminskiGame = new KozminskiEscapeGame();
  });
} else {
  window.kozminskiGame = new KozminskiEscapeGame();
}

