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

    // Przycisk samouczka i wrogów w menu startowym
    this.btnTutorial = document.getElementById('btn-tutorial');
    this.btnOpenEnemiesMenu = document.getElementById('btn-open-enemies-menu');

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
    this.items = [];
    this.walls = [];
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
    this.resetHUD();
    this.updateRecordDisplays();
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
  // 1. UKŁAD KAMPUSU Z 2 WYJŚCIAMI Z KAŻDEGO BUDYNKU (BRAK ŚLEPYCH ZAUŁKÓW)
  //    - Aula A, Dziekanat, Biblioteka, Lab Komputerowy
  //    - Każde wyjście ma szerokość >= 48 px (użyto 60 px)
  //    - Centralny plac: Patio ALK 🌿 z krzakami kryjówkami
  // =========================================================================
  initCampusLayout() {
    // Obwód zewnętrzny kampusu (zostawia wewnętrzną przestrzeń 760x500)
    this.walls = [
      { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
      { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
      { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },

      // --- AULA A (Lewy górny: [20..220] x [20..140]) ---
      // Wyjście 1: dolna ściana w stronę korytarza Patio (prześwit x: 80..140, w=60)
      { x: 20, y: 140, w: 60, h: 16 },
      { x: 140, y: 140, w: 80, h: 16 },
      // Wyjście 2: prawa ściana w stronę bocznego korytarza (prześwit y: 50..110, h=60)
      { x: 220, y: 20, w: 16, h: 30 },
      { x: 220, y: 110, w: 16, h: 46 },

      // --- DZIEKANAT (Prawy górny: [580..780] x [20..140]) ---
      // Wyjście 1: lewa ściana w stronę korytarza Patio (prześwit y: 50..110, h=60)
      { x: 580, y: 20, w: 16, h: 30 },
      { x: 580, y: 110, w: 16, h: 46 },
      // Wyjście 2: dolna ściana w stronę korytarza (prześwit x: 640..700, w=60)
      { x: 580, y: 140, w: 60, h: 16 },
      { x: 700, y: 140, w: 80, h: 16 },

      // --- BIBLIOTEKA (Lewy dolny: [20..220] x [400..520]) ---
      // Wyjście 1: górna ściana w stronę korytarza Patio (prześwit x: 80..140, w=60)
      { x: 20, y: 384, w: 60, h: 16 },
      { x: 140, y: 384, w: 80, h: 16 },
      // Wyjście 2: prawa ściana w stronę dolnego korytarza (prześwit y: 430..490, h=60)
      { x: 220, y: 384, w: 16, h: 46 },
      { x: 220, y: 490, w: 16, h: 30 },

      // --- LAB KOMPUTEROWY (Prawy dolny: [580..780] x [400..520]) ---
      // Wyjście 1: górna ściana w stronę bocznego korytarza (prześwit x: 640..700, w=60)
      { x: 580, y: 384, w: 60, h: 16 },
      { x: 700, y: 384, w: 80, h: 16 },
      // Wyjście 2: lewa ściana w stronę korytarza Patio (prześwit y: 430..490, h=60)
      { x: 580, y: 384, w: 16, h: 46 },
      { x: 580, y: 490, w: 16, h: 30 },

      // --- Wewnętrzne filary korytarzowe (z zaokrąglonym marginesem) ---
      { x: 236, y: 245, w: 18, h: 50 },
      { x: CANVAS_WIDTH - 254, y: 245, w: 18, h: 50 }
    ];

    // Obszary i strefy sal
    this.rooms = [
      { id: 'aula', name: "Aula A", x: 20, y: 20, w: 200, h: 120, labelX: 120, labelY: 70, icon: "🏛️", info: "Złote ECTS (+3)" },
      { id: 'dean', name: "Dziekanat", x: CANVAS_WIDTH - 220, y: 20, w: 200, h: 120, labelX: CANVAS_WIDTH - 120, labelY: 70, icon: "📋", info: "Kolejka (Podanie)" },
      { id: 'library', name: "Biblioteka", x: 20, y: CANVAS_HEIGHT - 140, w: 200, h: 120, labelX: 120, labelY: CANVAS_HEIGHT - 75, icon: "📚", info: "Strefa Ciszy (Brak sprintu)" },
      { id: 'lab', name: "Lab Komputerowy", x: CANVAS_WIDTH - 220, y: CANVAS_HEIGHT - 140, w: 200, h: 120, labelX: CANVAS_WIDTH - 120, labelY: CANVAS_HEIGHT - 75, icon: "💻", info: "AI Gemini Hub" }
    ];

    // Centralne Patio ALK
    this.patio = {
      name: "Patio ALK 🌿",
      x: 270,
      y: 160,
      w: 260,
      h: 220
    };

    // Krzaki kryjówki na Patio (promień 20 px)
    this.bushes = [
      { id: 1, x: 315, y: 205, radius: 20, cooldown: 0 },
      { id: 2, x: 485, y: 205, radius: 20, cooldown: 0 },
      { id: 3, x: 315, y: 335, radius: 20, cooldown: 0 },
      { id: 4, x: 485, y: 335, radius: 20, cooldown: 0 }
    ];
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

  // Sprawdzenie czy punkt znajduje się w Bibliotece (Strefa Ciszy)
  isInLibrary(x, y) {
    return x >= 20 && x <= 220 && y >= CANVAS_HEIGHT - 140 && y <= CANVAS_HEIGHT - 20;
  }

  // Sprawdzenie czy punkt znajduje się w Dziekanacie
  isInDeanOffice(x, y) {
    return x >= CANVAS_WIDTH - 220 && x <= CANVAS_WIDTH - 20 && y >= 20 && y <= 140;
  }

  // Sprawdzenie czy punkt znajduje się w Auli A
  isInAulaA(x, y) {
    return x >= 20 && x <= 220 && y >= 20 && y <= 140;
  }

  // Sprawdzenie czy punkt znajduje się w Labie Komputerowym
  isInComputerLab(x, y) {
    return x >= CANVAS_WIDTH - 220 && x <= CANVAS_WIDTH - 20 && y >= CANVAS_HEIGHT - 140 && y <= CANVAS_HEIGHT - 20;
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
    const semTabs = document.querySelectorAll('.sem-tab');
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

    this.setupTouchControls();
  }

  updateSemesterTabsUI(sem) {
    document.querySelectorAll('.sem-tab').forEach((t) => {
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

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();
    this.resetInputs();

    this.state = 'TITLE_MENU';
    this.resetHUD();
    this.updateRecordDisplays();
    if (this.modalStart) {
      this.modalStart.classList.remove('hidden');
      this.modalStart.classList.add('active');
    }

    this.initPlayerAndEnemiesPositions();
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
      this.hudStatusBadge.textContent = 'Sesja letnia trwa';
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
    this.player = {
      x: 90,
      y: 270,
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
      x: 710,
      y: 270,
      radius: 18,
      baseSpeed: profBaseSpeed,
      speed: profBaseSpeed,
      freezeTimer: 0,
      rageTimer: 0,
      angle: Math.PI,
      path: [],
      speechTimer: 0,
      speechText: '',
      targetX: 90,
      targetY: 270
    };
    this.instructor = null;
    this.deanClerk = null;
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

    this.modalStart.classList.add('hidden');
    this.modalStart.classList.remove('active');
    this.modalGameOver.classList.add('hidden');
    this.modalGameOver.classList.remove('active');
    this.modalVictory.classList.add('hidden');
    this.modalVictory.classList.remove('active');

    if (this.viewport) this.viewport.classList.remove('screen-shake');
    this.hideEventBanner();

    // Nowa gra zatwierdza wybrany semestr
    this.setSemester(this.selectedSemester);

    // Reset statystyk osiągnięć
    this.sprintUsed = false;
    this.geminiCollected = 0;
    this.bushHidesCount = 0;
    this.goldEctsCollected = 0;
    this.cheatsCollected = 0;
    this.coffeesDrunk = 0;

    // Student (Gracz)
    this.player = {
      x: 90,
      y: 270,
      radius: 16,
      baseSpeed: 3.2,
      sprintSpeed: 5.6,
      currentSpeed: 3.2,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      canSprint: true,
      boostTimer: 0,
      hasShield: false,
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
      x: 710,
      y: 270,
      radius: 18,
      baseSpeed: profBaseSpeed,
      speed: profBaseSpeed,
      freezeTimer: 0,
      rageTimer: 0,
      angle: Math.PI,
      path: [],
      speechTimer: 0,
      speechText: '',
      targetX: 90,
      targetY: 270
    };

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

    this.ectsCollected = 0;
    this.finalPhase = false;
    this.finalTimer = 0;
    this.finalMaxTime = this.currentSemester === 3 ? 20.0 : 25.0;
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
    // Pojawia się w wyjściu z budynku najdalszym od studenta
    const candidateSpots = [
      { x: 110, y: 155 }, // wyjście Aula A
      { x: 670, y: 155 }, // wyjście Dziekanat
      { x: 110, y: 370 }, // wyjście Biblioteka
      { x: 670, y: 370 }  // wyjście Lab
    ];

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
    // Trasa patrolowa wokół obwodu Patio
    this.deanClerk = {
      x: 250,
      y: 140,
      radius: 17,
      speed: 1.6, // stała prędkość patrolowa 1.6 px/klatkę
      freezeTimer: 0,
      angle: 0,
      speechTimer: 0,
      speechText: '',
      patrolIndex: 0,
      path: [],
      bfsTimer: 0,
      patrolPoints: [
        { x: 550, y: 140 },
        { x: 550, y: 400 },
        { x: 250, y: 400 },
        { x: 250, y: 140 }
      ]
    };

    this.addFloatingText("👩‍💼 Pani z Dziekanatu ruszyła w obchód!", 250, 120, '#a855f7');
    soundSystem.play('event');
    this.triggerSpeech(this.deanClerk, 'dean', '„Proszę zaświadczenie!”');
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

    // 1. Jeśli podano forcedX i forcedY (np. Złote ECTS), akceptujemy tylko gdy nie koliduje z napisami sal ani ścianami
    if (forcedX !== null && forcedY !== null) {
      if (!collidesWithRoomLabel(forcedX, forcedY) && !isInsideWall(forcedX, forcedY) && !isOnExisting(forcedX, forcedY)) {
        x = forcedX;
        y = forcedY;
        valid = true;
      }
    }

    // 2. 60% spawnów Gemini AI pojawia się w Labie Komputerowym (z ominięciem napisu Labu)
    if (!valid && type === 'freeze' && forcedX === null && Math.random() < 0.6) {
      while (!valid && attempts < 80) {
        attempts++;
        const testX = 610 + Math.random() * 140;
        const testY = CANVAS_HEIGHT - 120 + Math.random() * 80;
        if (!collidesWithRoomLabel(testX, testY) && !isInsideWall(testX, testY) && !isOnExisting(testX, testY)) {
          x = testX;
          y = testY;
          valid = true;
        }
      }
    }

    // 3. Złote ECTS w Auli A – jeśli forced coords kolidowały z napisem, szukamy w Auli z ominięciem napisu
    if (!valid && type === 'gold') {
      while (!valid && attempts < 100) {
        attempts++;
        const testX = 40 + Math.random() * 160;
        const testY = 35 + Math.random() * 85;
        if (!collidesWithRoomLabel(testX, testY) && !isInsideWall(testX, testY) && !isOnExisting(testX, testY)) {
          x = testX;
          y = testY;
          valid = true;
        }
      }
    }

    // 4. Standardowe losowanie na kampusie (nigdy bliżej niż 70 px w poziomie i 24 px w pionie od napisu)
    while (!valid && attempts < 240) {
      attempts++;
      x = 35 + Math.random() * (CANVAS_WIDTH - 70);
      y = 35 + Math.random() * (CANVAS_HEIGHT - 70);

      if (!isInsideWall(x, y) && !isOnExisting(x, y) && !collidesWithRoomLabel(x, y)) {
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
    let x = 50 + Math.random() * 140;
    let y = 45 + Math.random() * 70;
    const aula = this.rooms.find((r) => r.id === 'aula');
    let attempts = 0;
    while (aula && Math.abs(x - aula.labelX) < 70 && Math.abs(y - aula.labelY) < 24 && attempts < 40) {
      x = 40 + Math.random() * 160;
      y = 35 + Math.random() * 85;
      attempts++;
    }
    const item = this.spawnItem('gold', x, y);
    const finalX = item ? item.x : x;
    const finalY = item ? item.y : y;
    this.addFloatingText("🌟 Złote ECTS w Auli A!", finalX, finalY - 22, '#f2a900');
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
    this.finalPhase = true;
    this.finalMaxTime = this.currentSemester === 3 ? 20.0 : 25.0;
    this.finalTimer = this.finalMaxTime;
    this.oralExamSeconds = 0;
    this.oralExamPassed = false;
    this.finalTarget = { x: 740, y: 65, w: 40, h: 40 };

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

    // Pani z dziekanatu w finale stoi przed ladą Dziekanatu i patroluje krótszą trasę wokół wejścia (utrudnia dojście)
    if (this.deanClerk) {
      this.deanClerk.patrolPoints = [
        { x: 630, y: 80 },
        { x: 675, y: 115 },
        { x: 690, y: 75 },
        { x: 640, y: 115 }
      ];
      this.deanClerk.patrolIndex = 0;
      this.deanClerk.path = [];
      this.deanClerk.bfsTimer = 0;
    }

    // Baner na górze: „📝 EGZAMIN USTNY! Zanieś indeks do Dziekanatu!” + odliczanie 25s
    if (this.eventBanner) {
      this.eventIcon.textContent = '📝';
      this.eventTitle.textContent = 'EGZAMIN USTNY!';
      this.eventDesc.textContent = 'Zanieś indeks do Dziekanatu!';
      this.eventTimer.textContent = `${Math.ceil(this.finalTimer)}s`;
      this.eventBanner.classList.remove('hidden');
    }

    soundSystem.play('event');
    this.triggerScreenShake(8, 0.35);
    this.triggerSpeech(this.examiner, 'prof', '„To jeszcze nie koniec! Czas na egzamin ustny w Dziekanacie!”');
    this.addFloatingText("📝 EGZAMIN USTNY! Biegnij do Dziekanatu!", this.player.x, this.player.y - 25, '#f59e0b');
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

      // Sprawdzenie dotarcia do celu (strefa ok. 40x40 przy ladzie w Dziekanacie)
      if (this.finalTarget && this.player) {
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
    this.updateEnemiesSpawnProgress();
    this.updateExaminer(dt);
    this.updateInstructor(dt);
    this.updateDeanClerk(dt);
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

    if (this.ectsCollected >= instThreshold && !this.instructor) {
      this.spawnInstructor();
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
      this.player.stamina = Math.max(0, this.player.stamina - 28 * dt);
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
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + regenRate * dt);
    }

    // Dyszenie przy niskiej staminie (< 20%) podczas marszu/biegu
    if (this.player.stamina < this.player.maxStamina * 0.2 && isMoving) {
      soundSystem.play('breath');
    }

    // Aktualizacja pozycji gracza z kolizjami (ruch mnożony przez dt * 60)
    if (isMoving) {
      const step = this.player.currentSpeed * (dt * 60);
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
          this.addFloatingText("🌿 Schowany w krzakach!", this.player.x, this.player.y - 20, '#10b981');
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

    if (this.examiner.rageTimer > 0) {
      this.examiner.rageTimer -= dt;
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
    const step = entity.speed * (dt * 60);
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
          const scoreEarned = 100 * this.combo;
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
          const scoreEarned = 300 * this.combo;
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
        }

        const collectedType = item.type;
        this.items.splice(i, 1);

        // Respawn przedmiotów: w finale ECTS nie wraca do kolejki
        if (!this.finalPhase || (collectedType !== 'ects' && collectedType !== 'gold' && collectedType !== 'cheat')) {
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
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = {
      ...ev,
      duration: 10.0,
      maxDuration: 10.0
    };

    soundSystem.play('event');
    this.showEventBanner(this.activeEvent);

    if (ev.id === 'break') {
      this.spawnNpcStudents();
    }
  }

  endEvent() {
    this.activeEvent = null;
    this.npcs = [];
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
      this.hudStatusBadge.textContent = '🌿 Ukryty w Patio (5s do kichnięcia)';
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
      this.hudStatusBadge.textContent = `Sesja semestru ${this.currentSemester === 1 ? 'I' : this.currentSemester === 2 ? 'II' : 'III'} trwa`;
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
      this.victoryTimeBonus.textContent = `Bonus: +${timeBonus.toLocaleString('pl-PL')} pkt`;
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

    // Sprawdzenie i zapisanie rekordu (czas, ocena, wynik)
    const isNewRecord = this.saveBestRecord(this.currentSemester, this.elapsedSeconds, finalGrade, this.score);
    if (this.newRecordBadge) {
      if (isNewRecord) {
        this.newRecordBadge.classList.remove('hidden');
      } else {
        this.newRecordBadge.classList.add('hidden');
      }
    }

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

      if (!existing) {
        isNew = true;
      } else {
        const parsed = JSON.parse(existing);
        if (typeof parsed.seconds === 'number') {
          if (seconds < parsed.seconds) {
            isNew = true;
            bestSeconds = seconds;
            bestGrade = grade;
          } else {
            bestSeconds = parsed.seconds;
            bestGrade = parsed.grade || grade;
          }
        }
        if (typeof parsed.score === 'number') {
          bestScore = Math.max(parsed.score, score);
        }
      }

      const timeStr = this.formatTime(bestSeconds);
      localStorage.setItem(key, JSON.stringify({
        seconds: bestSeconds,
        timeStr,
        grade: bestGrade,
        score: bestScore
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

          if (legacyEl) {
            const gradePart = parsed.grade ? ` (Ocena: ${shortGrade})` : '';
            const scorePart = typeof parsed.score === 'number' ? ` · ${scoreStr}` : '';
            legacyEl.textContent = `${timeStr}${gradePart}${scorePart}`;
          }
          if (timeEl) timeEl.textContent = timeStr || '—';
          if (gradeEl) gradeEl.textContent = shortGrade;
          if (scoreEl) scoreEl.textContent = scoreStr;
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

    // 1. Głęboki nocny granat bazowy
    ctx.fillStyle = '#060a19';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Korytarze: płytki w szachownicę z fugami i subtelnym połyskiem
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

    // 3. Herb / Medalion „ALK” wyryty w podłodze na środku korytarza (nad Patio)
    this.prerenderCorridorLogo(ctx, 400, 88);

    // 4. Podłogi sal
    this.prerenderRoomsFloors(ctx);

    // 5. Patio ALK: trawa z fakturą, alejki z kostki, ławki, latarnie, krzaki
    this.prerenderPatio(ctx);

    // 6. Meble i wyposażenie sal (dekoracja, bez kolizji)
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
    // AULA A (x: 20, y: 20, w: 200, h: 120) - Drewniany ciepły parkiet
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 20, 200, 120);
    ctx.clip();

    ctx.fillStyle = '#26160c';
    ctx.fillRect(20, 20, 200, 120);

    const plankW = 20;
    const plankH = 10;
    for (let py = 20; py < 140; py += plankH) {
      const row = Math.floor((py - 20) / plankH);
      const offset = (row % 2) * 10;
      for (let px = 20 - 10; px < 220; px += plankW) {
        const tone = ((px + py) * 17) % 4;
        ctx.fillStyle = tone === 0 ? '#382212' : tone === 1 ? '#422815' : tone === 2 ? '#331d0f' : '#4b2e19';
        ctx.fillRect(px + offset, py, plankW - 1, plankH - 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(px + offset, py, plankW - 1, 1);
      }
    }
    // Gradient lakieru od wejść
    const aulaGloss = ctx.createLinearGradient(20, 20, 220, 140);
    aulaGloss.addColorStop(0, 'rgba(242, 169, 0, 0.08)');
    aulaGloss.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = aulaGloss;
    ctx.fillRect(20, 20, 200, 120);
    ctx.restore();

    // DZIEKANAT (x: 580, y: 20, w: 200, h: 120) - Pluszowy dywan z geometrycznym wzorem rombów
    ctx.save();
    ctx.beginPath();
    ctx.rect(580, 20, 200, 120);
    ctx.clip();

    ctx.fillStyle = '#20122a';
    ctx.fillRect(580, 20, 200, 120);

    // Siatka rombów
    ctx.strokeStyle = 'rgba(242, 169, 0, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 580 - 20; x < 780 + 20; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 120, 140);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.lineTo(x + 120, 20);
      ctx.stroke();
    }
    // Ozdobna bordiura dywanu
    ctx.strokeStyle = 'rgba(242, 169, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(586, 26, 188, 108);
    ctx.strokeStyle = '#422456';
    ctx.lineWidth = 4;
    ctx.strokeRect(582, 22, 196, 116);
    ctx.restore();

    // BIBLIOTEKA (x: 20, y: 400, w: 200, h: 120) - Ciepłe drewniane deski
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 400, 200, 120);
    ctx.clip();

    ctx.fillStyle = '#22140a';
    ctx.fillRect(20, 400, 200, 120);

    const boardH = 15;
    for (let by = 400; by < 520; by += boardH) {
      const tone = (by * 13) % 3;
      ctx.fillStyle = tone === 0 ? '#2c1b0e' : tone === 1 ? '#352011' : '#3d2514';
      ctx.fillRect(20, by, 200, boardH - 1);

      ctx.fillStyle = '#170c06';
      ctx.fillRect(20, by + boardH - 1, 200, 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fillRect(20, by, 200, 1);

      // Piony łączeń desek
      const seamX = 20 + ((by * 7) % 150) + 20;
      ctx.fillStyle = '#170c06';
      ctx.fillRect(seamX, by, 1, boardH - 1);
    }
    ctx.restore();

    // LAB KOMPUTEROWY (x: 580, y: 400, w: 200, h: 120) - Szare płytki techniczne z liniami światłowodów
    ctx.save();
    ctx.beginPath();
    ctx.rect(580, 400, 200, 120);
    ctx.clip();

    ctx.fillStyle = '#111724';
    ctx.fillRect(580, 400, 200, 120);

    const techTile = 20;
    for (let tx = 580; tx < 780; tx += techTile) {
      for (let ty = 400; ty < 520; ty += techTile) {
        ctx.fillStyle = (tx + ty) % 40 === 0 ? '#162030' : '#131b29';
        ctx.fillRect(tx, ty, techTile, techTile);

        ctx.strokeStyle = '#0c121c';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, techTile - 1, techTile - 1);
      }
    }

    // Świecące kable i światłowody w fugach
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Główna magistrala danych
    ctx.moveTo(580, 460);
    ctx.lineTo(780, 460);
    ctx.moveTo(680, 400);
    ctx.lineTo(680, 520);
    ctx.stroke();

    // Punkty węzłowe LED
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    const nodes = [
      [640, 460], [680, 460], [720, 460],
      [680, 430], [680, 490]
    ];
    for (const [nx, ny] of nodes) {
      ctx.beginPath();
      ctx.arc(nx, ny, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  prerenderPatio(ctx) {
    if (!this.patio) return;
    const { x, y, w, h } = this.patio;

    ctx.save();
    // Trawa Patio ALK
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
    // Ścieżka pionowa (szerokość 32 px na środku)
    ctx.fillRect(x + w / 2 - 16, y, 32, h);
    // Ścieżka pozioma (szerokość 32 px na środku)
    ctx.fillRect(x, y + h / 2 - 16, w, 32);

    // Krawężniki alejek
    ctx.strokeStyle = '#27354f';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w / 2 - 16, y, 32, h);
    ctx.strokeRect(x, y + h / 2 - 16, w, 32);

    // Ławki parkowe (dębowe szczeble, żeliwne oparcia)
    const benches = [
      { bx: x + 40, by: y + h / 2 - 24, w: 24, h: 6 },
      { bx: x + w - 64, by: y + h / 2 - 24, w: 24, h: 6 },
      { bx: x + 40, by: y + h / 2 + 18, w: 24, h: 6 },
      { bx: x + w - 64, by: y + h / 2 + 18, w: 24, h: 6 }
    ];
    for (const bn of benches) {
      // Cień ławki
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(bn.bx + 2, bn.by + 2, bn.w, bn.h);
      // Drewno
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bn.bx, bn.by, bn.w, bn.h);
      // Szczebelki
      ctx.fillStyle = '#b45309';
      ctx.fillRect(bn.bx + 1, bn.by + 1, bn.w - 2, 1);
      ctx.fillRect(bn.bx + 1, bn.by + 4, bn.w - 2, 1);
      // Żeliwne nóżki
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
      // Cień słupa
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(lx + 2, ly + 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mosiężny słupek
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lx - 2, ly - 3, 4, 6);
      ctx.fillStyle = '#f2a900';
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
      // Żarówka
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bujne krzewy kryjówki (4 sztuki, zachowaj dokładnie x, y i promień 20 px)
    for (const b of this.bushes) {
      this.drawLushBush(ctx, b.x, b.y, b.radius);
    }

    // Obramowanie patio
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x, y, w, h);

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
    // AULA A:
    // Tablica akademicka na północnej ścianie
    ctx.fillStyle = '#0a2318';
    ctx.fillRect(55, 21, 110, 12);
    ctx.strokeStyle = '#f2a900';
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 21, 110, 12);
    // Kredowe formuły
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 6px sans-serif';
    ctx.fillText("∑ ECTS = 30", 62, 29);
    ctx.fillText("f'(x) > 0", 125, 29);

    // Katedra wykładowcy (drewniana mównica)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(172, 36, 16, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(173, 37, 14, 10);
    ctx.fillStyle = '#f2a900';
    ctx.fillRect(178, 35, 4, 2); // lampka mównicy

    // 2 rzędy składanych krzeseł audytoryjnych (nie zasłaniają środka ani wyjść)
    for (let cy of [44, 58]) {
      for (let cx = 45; cx <= 155; cx += 22) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, cy, 14, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx + 1, cy + 1, 12, 6);
      }
    }

    // DZIEKANAT:
    // Lada z okienkiem obsługi
    ctx.fillStyle = '#3f1f0a';
    ctx.fillRect(720, 36, 56, 10);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(721, 37, 54, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(722, 35, 52, 2); // szklana osłonka

    // Automat z numerkami biletowymi
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(602, 34, 12, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(604, 37, 8, 4); // ekran biletu

    // Kolejka z taśmą odgradzającą
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
    // Regały z książkami wzdłuż ściany lewej
    ctx.fillStyle = '#3e2212';
    ctx.fillRect(21, 412, 12, 94);
    for (let ky = 416; ky < 504; ky += 8) {
      const bookColors = ['#f59e0b', '#dc2626', '#059669', '#2563eb', '#9333ea', '#d97706'];
      ctx.fillStyle = bookColors[(ky * 7) % bookColors.length];
      ctx.fillRect(23, ky, 8, 6);
    }

    // Lampki bankierskie ze szmaragdowym kloszem na stole czytelniczym
    ctx.fillStyle = '#78350f';
    ctx.fillRect(56, 442, 30, 14);
    // 2 lampki
    for (const lx of [62, 78]) {
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(lx - 1, 445, 2, 4);
      ctx.fillStyle = '#059669';
      ctx.fillRect(lx - 3, 443, 6, 3);
    }

    // LAB KOMPUTEROWY:
    // Biurka z monitorami
    const desks = [
      { x: 610, y: 430, w: 50, h: 14 },
      { x: 700, y: 430, w: 50, h: 14 },
      { x: 610, y: 485, w: 50, h: 14 },
      { x: 700, y: 485, w: 50, h: 14 }
    ];
    for (const d of desks) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(d.x, d.y, d.w, d.h);

      // Monitory LCD
      for (const mx of [d.x + 8, d.x + 30]) {
        // Obudowa monitora
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 6, d.y + 2, 12, 2);
        // Ekran
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(mx - 5, d.y + 2, 10, 1.5);
        // Podświetlana klawiatura
        ctx.fillStyle = '#334155';
        ctx.fillRect(mx - 5, d.y + 6, 10, 5);
      }
    }
  }

  prerenderWallsAndPillars(ctx) {
    ctx.save();
    // 1. Cień rzucany przez ściany na podłogę
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (const w of this.walls) {
      ctx.fillRect(w.x + 4, w.y + 5, w.w, w.h);
    }

    // 2. Korpus ścian (głęboki granat ALK)
    for (const w of this.walls) {
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
    const pillarCoords = [
      { x: 236, y: 245, w: 18, h: 50 },
      { x: CANVAS_WIDTH - 254, y: 245, w: 18, h: 50 }
    ];
    for (const p of pillarCoords) {
      // Cień kolumny
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(p.x + 4, p.y + 5, p.w, p.h);

      // Trzon kolumny
      ctx.fillStyle = '#00254c';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Kanelury pionowe (rowki)
      ctx.fillStyle = '#001933';
      ctx.fillRect(p.x + 4, p.y + 4, 2, p.h - 8);
      ctx.fillRect(p.x + 8, p.y + 4, 2, p.h - 8);
      ctx.fillRect(p.x + 12, p.y + 4, 2, p.h - 8);

      // Baza dolna
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(p.x - 2, p.y + p.h - 4, p.w + 4, 4);

      // Głowica górna ze złotym kapitelem
      ctx.fillStyle = '#ffc740';
      ctx.fillRect(p.x - 2, p.y, p.w + 4, 4);
      ctx.fillStyle = '#f2a900';
      ctx.fillRect(p.x - 1, p.y + 4, p.w + 2, 2);
    }

    ctx.restore();
  }

  prerenderRoomLabels(ctx) {
    for (const r of this.rooms) {
      // Mosiężny szyld sali
      ctx.save();
      ctx.fillStyle = '#ffc740';
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillText(`${r.icon} ${r.name}`, r.labelX, r.labelY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
      ctx.shadowBlur = 4;
      ctx.fillText(r.info, r.labelX, r.labelY + 16);
      ctx.restore();
    }

    // Szyld Patio ALK
    if (this.patio) {
      ctx.save();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#064e3b';
      ctx.shadowBlur = 6;
      ctx.fillText("🌿 Patio ALK 🌿", this.patio.x + this.patio.w / 2, this.patio.y + 24);
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

    // 7. Postacie przeciwników i studenta w rzucie 3/4
    if (this.examiner) this.drawExaminer();
    if (this.instructor) this.drawInstructor();
    if (this.deanClerk) this.drawDeanClerk();
    if (this.player) this.drawPlayer();

    // 7b. Złota strzałka nad studentem do celu finałowego
    if (this.finalPhase) {
      this.drawTargetPointer();
    }

    // 8. Pływające teksty i orby lecące do licznika
    this.drawFloatingTexts();
    this.drawFlyingOrbs();

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

    // Ciepłe plamy światła pod 4 latarniami na Patio
    if (this.patio) {
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
    }

    // Szmaragdowe światło lampek bankierskich w Bibliotece
    const bibGrad = this.ctx.createRadialGradient(70, 448, 2, 70, 448, 40);
    bibGrad.addColorStop(0, 'rgba(74, 222, 128, 0.12)');
    bibGrad.addColorStop(1, 'rgba(74, 222, 128, 0)');
    this.ctx.fillStyle = bibGrad;
    this.ctx.beginPath();
    this.ctx.arc(70, 448, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Cyjanowa poświata monitorów w Labie Komputerowym (delikatne pulsowanie)
    const labFlicker = 0.08 + Math.sin(Date.now() / 400) * 0.03;
    const labGrad = this.ctx.createRadialGradient(680, 460, 4, 680, 460, 65);
    labGrad.addColorStop(0, `rgba(56, 189, 248, ${labFlicker})`);
    labGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    this.ctx.fillStyle = labGrad;
    this.ctx.beginPath();
    this.ctx.arc(680, 460, 65, 0, Math.PI * 2);
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

    // 7. Rysowanie figurki studenta w widoku 3/4
    const cosDir = Math.cos(this.player.direction);
    const sinDir = Math.sin(this.player.direction);
    const isFacingLeft = cosDir < -0.15;
    const isFacingUp = sinDir < -0.65 && Math.abs(cosDir) < 0.65;

    const isMoving = Boolean(
      this.keys.ArrowUp || this.keys.ArrowDown || this.keys.ArrowLeft || this.keys.ArrowRight ||
      this.keys.KeyW || this.keys.KeyA || this.keys.KeyS || this.keys.KeyD ||
      this.isJoystickActive
    );
    const walk = isMoving ? Math.sin(this.player.walkCycle) * 4.5 : 0;
    const breath = isMoving ? 1.0 : (1.0 + Math.sin(Date.now() / 350) * 0.02);

    if (isFacingLeft) {
      this.ctx.scale(-1, 1);
    }

    // Nogi w jasnych spodniach i trampki z białymi podeszwami
    this.ctx.fillStyle = '#cbd5e1'; // jasne spodnie
    this.ctx.fillRect(-6.5, 5 + walk, 4.5, 7);
    this.ctx.fillRect(2, 5 - walk, 4.5, 7);

    // Trampki
    this.ctx.fillStyle = '#002244'; // granatowe trampki
    this.ctx.fillRect(-7, 11 + walk, 5.5, 3);
    this.ctx.fillRect(1.5, 11 - walk, 5.5, 3);
    this.ctx.fillStyle = '#ffffff'; // biały nosek i podeszwa
    this.ctx.fillRect(-7, 13 + walk, 5.5, 1.4);
    this.ctx.fillRect(1.5, 13 - walk, 5.5, 1.4);
    this.ctx.fillRect(-3, 11 + walk, 1.5, 2);
    this.ctx.fillRect(5.5, 11 - walk, 1.5, 2);

    // Tułów - bluza ALK z delikatnym oddychaniem
    this.ctx.save();
    this.ctx.scale(1, breath);

    if (isFacingUp) {
      // Widok od tyłu: tył granatowej bluzy i złoty plecak na plecach
      this.ctx.fillStyle = '#002244';
      this.ctx.beginPath();
      this.ctx.roundRect(-8, -7, 16, 13, 3);
      this.ctx.fill();

      // Złoty plecak ALK na środku
      this.ctx.fillStyle = '#f2a900';
      this.ctx.beginPath();
      this.ctx.roundRect(-5.5, -5, 11, 10, 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillRect(-4.5, 1, 9, 3); // kieszeń
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-3, -2, 6, 1.2); // suwak

      // Kaptur z tyłu
      this.ctx.fillStyle = '#001a35';
      this.ctx.beginPath();
      this.ctx.ellipse(0, -7.5, 7.5, 4.5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Tył głowy z brązowymi włosami (bez twarzy)
      this.ctx.fillStyle = '#78350f';
      this.ctx.beginPath();
      this.ctx.arc(0, -11, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

    } else {
      // Złoty plecak wystający z tyłu/boku
      this.ctx.fillStyle = '#f2a900';
      this.ctx.beginPath();
      this.ctx.roundRect(-10.5, -5, 4.5, 10, 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillRect(-9.5, -1, 3.5, 5);

      // Granatowa bluza ALK
      this.ctx.fillStyle = '#002244';
      this.ctx.beginPath();
      this.ctx.roundRect(-7.5, -7, 15, 13, 3);
      this.ctx.fill();

      // Biały napis „ALK” na piersi
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '900 6.5px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText("ALK", 0.5, -0.5);

      // Sznurki kaptura
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(-2, -5);
      this.ctx.lineTo(-2, -2);
      this.ctx.moveTo(3, -5);
      this.ctx.lineTo(3, -2);
      this.ctx.stroke();

      // Ręce machające naprzemiennie
      this.ctx.fillStyle = '#002244';
      this.ctx.fillRect(-9.5, -5 - walk * 0.7, 3.5, 8);
      this.ctx.fillRect(6, -5 + walk * 0.7, 3.5, 8);
      this.ctx.fillStyle = '#fed7aa'; // dłonie
      this.ctx.fillRect(-9.5, 2.5 - walk * 0.7, 3.5, 3);
      this.ctx.fillRect(6, 2.5 + walk * 0.7, 3.5, 3);

      // Głowa z twarzą w widoku 3/4
      this.ctx.fillStyle = '#fed7aa';
      this.ctx.beginPath();
      this.ctx.arc(0.5, -11, 7.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Włosy z modną grzywką
      this.ctx.fillStyle = '#78350f';
      this.ctx.beginPath();
      this.ctx.arc(0, -13, 7.5, Math.PI * 0.75, Math.PI * 2.25);
      this.ctx.fill();

      // Oczy patrzące w przód
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(2, -12, 1.8, 2.2);
    }

    this.ctx.restore(); // koniec tułowia
    this.ctx.restore(); // koniec studenta
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

    // 4. Znacznik nad głową przeciwnika (czerwony)
    this.drawEnemyMarker(-33, '#ef4444');

    // 5. Figurka profesora w widoku 3/4
    const cosA = Math.cos(this.examiner.angle);
    const sinA = Math.sin(this.examiner.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.examiner.freezeTimer <= 0;
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

    // 3. Znacznik nad głową przeciwnika (zielony)
    this.drawEnemyMarker(-31, '#10b981');

    // 4. Figurka prowadzącego ćwiczenia w widoku 3/4
    const cosA = Math.cos(this.instructor.angle);
    const sinA = Math.sin(this.instructor.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.instructor.freezeTimer <= 0;
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

    // 3. Znacznik nad głową przeciwnika (fioletowy)
    this.drawEnemyMarker(-32, '#a855f7');

    // 4. Figurka Pani z dziekanatu w widoku 3/4
    const cosA = Math.cos(this.deanClerk.angle);
    const sinA = Math.sin(this.deanClerk.angle);
    const isFacingLeft = cosA < -0.15;
    const isFacingUp = sinA < -0.65 && Math.abs(cosA) < 0.65;
    const isMoving = this.deanClerk.freezeTimer <= 0;
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

  drawBlackoutEffect() {
    this.ctx.save();
    // 1. Warstwa całkowitego zaciemnienia kampusu
    this.ctx.fillStyle = 'rgba(2, 6, 18, 0.96)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Miękki stożek latarki studenta
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';

    // Okrąg wokół nóg studenta (promień 38 px)
    const footGrad = this.ctx.createRadialGradient(this.player.x, this.player.y, 6, this.player.x, this.player.y, 38);
    footGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    footGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.65)');
    footGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = footGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, 38, 0, Math.PI * 2);
    this.ctx.fill();

    // Stożek latarki skierowany w kierunku studenta (kąt 65°, zasięg 180 px)
    const coneAngle = this.player.direction;
    const halfSpread = 0.55;
    const range = 180;

    const coneGrad = this.ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, range);
    coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    coneGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.7)');
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = coneGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x, this.player.y);
    this.ctx.arc(this.player.x, this.player.y, range, coneAngle - halfSpread, coneAngle + halfSpread);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

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
    const enemies = [this.examiner, this.instructor, this.deanClerk];
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
    const pulse = Math.sin(Date.now() / 150);
    const glowAlpha = 0.35 + pulse * 0.15;
    const bounce = Math.sin(Date.now() / 200) * 3;

    this.ctx.save();
    // 1. Złota poświata obszaru oddania indeksu
    const grad = this.ctx.createRadialGradient(x, y, 6, x, y, 42);
    grad.addColorStop(0, `rgba(255, 199, 64, ${glowAlpha})`);
    grad.addColorStop(0.7, `rgba(242, 169, 0, ${glowAlpha * 0.4})`);
    grad.addColorStop(1, 'rgba(242, 169, 0, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 42, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Pulsujący złoty obrys strefy 40x40
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2.5 + pulse * 0.5;
    this.ctx.setLineDash([6, 4]);
    this.ctx.lineDashOffset = -Date.now() / 50;
    this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    this.ctx.setLineDash([]); // reset kreskowania

    // 3. Wypełnienie wnętrza
    this.ctx.fillStyle = 'rgba(242, 169, 0, 0.18)';
    this.ctx.fillRect(x - w / 2, y - h / 2, w, h);

    // 4. Ikona indeksu unosząca się w środku
    this.ctx.font = '20px "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText("📑", x, y - 2 + bounce);

    // 5. Napis „ODDAJ INDEKS” nad strefą
    this.ctx.font = '900 10.5px Outfit, sans-serif';
    this.ctx.fillStyle = '#ffc740';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 6;
    this.ctx.fillText("ODDAJ INDEKS", x, y + h / 2 + 13);
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
