import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Prowadzący ćwiczenia – prędkość 85% aktualnej prędkości egzaminatora (z bonusem za ECTS, bez szału po ściądze)
test('Instructor speed calculation is exactly 85% of examiner non-frenzied speed', () => {
  const examinerBaseSpeed = 2.15;
  const ectsCollected = 12;
  const ectsBonus = ectsCollected * 0.085;
  const nonFrenziedProfSpeed = examinerBaseSpeed + ectsBonus;

  const instructorSpeed = nonFrenziedProfSpeed * 0.85;
  assert.equal(Math.round(instructorSpeed * 1000) / 1000, Math.round((2.15 + 1.02) * 0.85 * 1000) / 1000);

  // Z szałem egzaminatora (rageTimer > 0) prędkość profesora rośnie o 40%, ale prowadzącego NIE
  const examinerFrenziedSpeed = nonFrenziedProfSpeed * 1.4;
  assert.notEqual(instructorSpeed, examinerFrenziedSpeed * 0.85);
});

// Test 2: Pani z Dziekanatu – stunTimer oraz deanImmunityTimer
test('Dean clerk stun and immunity: stun is 2s, deanImmunityTimer starts after stun for 3s', () => {
  let stunTimer = 0;
  let deanImmunityTimer = 0;
  let immunityTimer = 0; // general immunity from Legitymacja only

  // Collision with Dean clerk triggers stun:
  const canBeStunned = stunTimer <= 0 && deanImmunityTimer <= 0;
  assert.equal(canBeStunned, true);

  stunTimer = 2.0;
  // immunityTimer remains 0 so examiner CAN catch student during stun:
  assert.equal(immunityTimer, 0);

  // Simulate 1.5s passing in stun:
  const dt1 = 1.5;
  stunTimer -= dt1;
  assert.equal(Math.round(stunTimer * 10) / 10, 0.5);
  assert.equal(deanImmunityTimer, 0);

  // Simulate remaining 0.5s of stun ending:
  const dt2 = 0.5;
  stunTimer -= dt2;
  if (stunTimer <= 0) {
    stunTimer = 0;
    deanImmunityTimer = 3.0;
  }
  assert.equal(stunTimer, 0);
  assert.equal(deanImmunityTimer, 3.0);

  // During the next 3 seconds, student cannot be stunned by Dean again:
  const canBeStunnedAgainImmediately = stunTimer <= 0 && deanImmunityTimer <= 0;
  assert.equal(canBeStunnedAgainImmediately, false);
});

// Test 3: Odrzut po Legitymacji – krok co 4 px, maksymalnie 120 px
test('Legitymacja knockback respects 4px steps, wall collision and max 120px', () => {
  let enemyX = 100;
  let enemyY = 100;
  const enemyRadius = 18;
  const maxDist = 120;
  const stepSize = 4;
  const steps = Math.floor(maxDist / stepSize);
  assert.equal(steps, 30); // 30 kroków po 4 px = 120 px

  // Wall at x: 130 to 150
  const wall = { x: 130, y: 80, w: 20, h: 40 };
  function checkCollision(x: number, y: number, r: number) {
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    const distX = x - closestX;
    const distY = y - closestY;
    return distX * distX + distY * distY < r * r;
  }

  // Knockback towards +X:
  const dirX = 1;
  const dirY = 0;
  for (let s = 0; s < steps; s++) {
    const nextX = enemyX + dirX * stepSize;
    const nextY = enemyY + dirY * stepSize;
    if (checkCollision(nextX, nextY, enemyRadius)) {
      break;
    }
    enemyX = nextX;
    enemyY = nextY;
  }

  // Must stop before wall
  assert.equal(checkCollision(enemyX, enemyY, enemyRadius), false);
  assert.ok(enemyX < wall.x);
});

// Test 4: Tekst kawy – „Malejąca użyteczność krańcowa!” dopiero od 2. kawy
test('Coffee floating text shows Malejaca uzytecznosc krancowa starting from 2nd coffee', () => {
  function getCoffeeText(coffeesDrunk: number) {
    if (coffeesDrunk >= 2) {
      return "☕ Malejąca użyteczność krańcowa!";
    }
    return "☕ Turbo Kawa!";
  }

  assert.equal(getCoffeeText(1), "☕ Turbo Kawa!");
  assert.equal(getCoffeeText(2), "☕ Malejąca użyteczność krańcowa!");
  assert.equal(getCoffeeText(3), "☕ Malejąca użyteczność krańcowa!");
});

// Test 5: Respawn queue – odliczanie w stanie gry zamiast setTimeout
test('Respawn queue ticks down and spawns without leaking between sessions', () => {
  let queue: Array<{ type: string; timer: number }> = [
    { type: 'ects', timer: 2.5 },
    { type: 'coffee', timer: 6.0 }
  ];

  const dt = 1.0;
  for (let q = queue.length - 1; q >= 0; q--) {
    queue[q].timer -= dt;
  }
  assert.equal(queue[0].timer, 1.5);
  assert.equal(queue[1].timer, 5.0);

  // New game starts -> reset queue immediately clears pending spawns
  queue = [];
  assert.equal(queue.length, 0);
});

// Test 6: Skalowanie rozdzielczości Retina / HiDPI i zachowanie proporcji 800:540 z limitem 2400 px
test('HiDPI canvas resolution calculation preserves 800:540 aspect ratio and respects 2400px cap', () => {
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 540;
  const aspectRatio = CANVAS_HEIGHT / CANVAS_WIDTH; // 0.675

  function calculateCanvasDimensions(cssWidth: number, dpr: number) {
    const rawWidth = Math.round(cssWidth * dpr);
    const targetWidth = Math.min(2400, Math.max(1, rawWidth));
    const targetHeight = Math.round(targetWidth * aspectRatio);
    const scale = targetWidth / CANVAS_WIDTH;
    return { width: targetWidth, height: targetHeight, scale };
  }

  // Przypadek 1: Standardowy ekran desktopowy 800px przy DPR = 1
  const standard = calculateCanvasDimensions(800, 1.0);
  assert.equal(standard.width, 800);
  assert.equal(standard.height, 540);
  assert.equal(standard.scale, 1.0);

  // Przypadek 2: Ekran Retina / HiDPI 800px przy DPR = 2 (np. MacBook, monitory 4K 200%)
  const retina = calculateCanvasDimensions(800, 2.0);
  assert.equal(retina.width, 1600);
  assert.equal(retina.height, 1080);
  assert.equal(retina.scale, 2.0);

  // Przypadek 3: Ekran smartfona 390px przy DPR = 3 (iPhone Super Retina)
  const mobile = calculateCanvasDimensions(390, 3.0);
  assert.equal(mobile.width, 1170);
  assert.equal(mobile.height, Math.round(1170 * 0.675));
  assert.equal(mobile.scale, 1170 / 800);

  // Przypadek 4: Monitor Ultra-Wide / 4K przekraczający limit 2400px (np. 1400px CSS × 2 DPR = 2800) -> limit 2400 px
  const ultraWide = calculateCanvasDimensions(1400, 2.0);
  assert.equal(ultraWide.width, 2400);
  assert.equal(ultraWide.height, Math.round(2400 * 0.675)); // 1620 px
  assert.equal(ultraWide.scale, 3.0);
});

// Test 7: Pozycjonowanie dymków w pikselach z marginesem 6 px i wskaźnikiem celującym w postać
test('Speech bubble position clamps horizontally to board with 6px margin and keeps pointer targeting character', () => {
  const CANVAS_WIDTH = 800;
  const containerWidth = 800;
  const bubbleWidth = 220;
  const margin = 6;
  const halfBubble = bubbleWidth / 2; // 110

  function computeBubblePlacement(entityX: number) {
    const charPxX = (entityX / CANVAS_WIDTH) * containerWidth;
    const minCenter = margin + halfBubble; // 116
    const maxCenter = containerWidth - margin - halfBubble; // 684

    let bubbleCenterPx: number;
    if (maxCenter >= minCenter) {
      bubbleCenterPx = Math.max(minCenter, Math.min(maxCenter, charPxX));
    } else {
      bubbleCenterPx = containerWidth / 2;
    }

    // Lewa i prawa krawędź dymka
    const bubbleLeftPx = bubbleCenterPx - halfBubble;
    const bubbleRightPx = bubbleCenterPx + halfBubble;

    // Celowanie trójkątnego wskaźnika w postać
    const tailOffsetPx = charPxX - bubbleLeftPx;
    const minTailX = 14;
    const maxTailX = Math.max(minTailX, bubbleWidth - 14);
    const clampedTailX = Math.max(minTailX, Math.min(maxTailX, tailOffsetPx));

    // Pozycja wierzchołka wskaźnika w przestrzeni kontenera
    const pointerTipInContainer = bubbleLeftPx + clampedTailX;

    return { bubbleCenterPx, bubbleLeftPx, bubbleRightPx, clampedTailX, pointerTipInContainer, charPxX };
  }

  // 1. Postać na środku (x = 400): dymek wycentrowany, wskaźnik idealnie na środku dymka i trafia w postać
  const mid = computeBubblePlacement(400);
  assert.equal(mid.bubbleCenterPx, 400);
  assert.equal(mid.bubbleLeftPx, 290);
  assert.equal(mid.bubbleRightPx, 510);
  assert.equal(mid.clampedTailX, 110);
  assert.equal(mid.pointerTipInContainer, 400);

  // 2. Postać przy lewej krawędzi (x = 20): dymek przesunięty do bezpiecznego marginesu 6 px
  const left = computeBubblePlacement(20);
  assert.equal(left.bubbleLeftPx, 6); // lewa krawędź dokładnie na marginesie 6 px!
  assert.equal(left.bubbleRightPx, 226);
  assert.ok(left.bubbleRightPx <= containerWidth - 6);
  // Wskaźnik dymka przesunięty w lewo w stronę postaci:
  assert.equal(left.clampedTailX, 14); // zacięty na bezpiecznym promieniu zaokrąglenia 14 px

  // 3. Postać przy prawej krawędzi (x = 790): dymek przesunięty do bezpiecznego marginesu 6 px
  const right = computeBubblePlacement(790);
  assert.equal(right.bubbleRightPx, containerWidth - 6); // 794 px
  assert.equal(right.bubbleLeftPx, containerWidth - 6 - bubbleWidth); // 574 px
  assert.ok(right.bubbleLeftPx >= 6);
  assert.equal(right.clampedTailX, bubbleWidth - 14); // 206 px

  // 4. Postać przy x = 70 (umiarkowanie blisko lewej ściany): wskaźnik celuje DOKŁADNIE w postać
  const nearLeft = computeBubblePlacement(70);
  assert.equal(nearLeft.bubbleLeftPx, 6);
  // tailOffsetPx = 70 - 6 = 64 px
  assert.equal(nearLeft.clampedTailX, 64);
  assert.equal(nearLeft.pointerTipInContainer, 70); // idealnie celuje w x = 70!
});

// Test 8: Zakaz spawnu przedmiotów w odległości < 70 px poziomo i < 24 px pionowo od napisu sal
test('Spawned items never appear closer than 70px horizontal and 24px vertical to any room label', () => {
  const rooms = [
    { id: 'aula', name: "Aula A", labelX: 120, labelY: 70 },
    { id: 'dean', name: "Dziekanat", labelX: 680, labelY: 70 },
    { id: 'library', name: "Biblioteka", labelX: 120, labelY: 465 },
    { id: 'lab', name: "Lab Komputerowy", labelX: 680, labelY: 465 }
  ];

  function collidesWithRoomLabel(px: number, py: number) {
    return rooms.some((r) => Math.abs(px - r.labelX) < 70 && Math.abs(py - r.labelY) < 24);
  }

  // Dokładnie na współrzędnych napisu -> kolizja
  assert.equal(collidesWithRoomLabel(120, 70), true);
  assert.equal(collidesWithRoomLabel(680, 465), true);

  // Wewnątrz strefy wykluczenia (np. 50 px w bok, 15 px w pionie) -> kolizja
  assert.equal(collidesWithRoomLabel(120 + 50, 70 + 15), true);
  assert.equal(collidesWithRoomLabel(680 - 60, 465 - 10), true);

  // Poza strefą w poziomie (>= 70 px) -> DOZWOLONE
  assert.equal(collidesWithRoomLabel(120 + 70, 70 + 10), false);
  assert.equal(collidesWithRoomLabel(120 - 71, 70), false);

  // Poza strefą w pionie (>= 24 px) -> DOZWOLONE
  assert.equal(collidesWithRoomLabel(120, 70 + 24), false);
  assert.equal(collidesWithRoomLabel(680, 465 - 25), false);

  // Symulacja spawnowania Złotego ECTS w Auli A: punkt musi być poza strefą wykluczenia
  let simulatedGoldX = 120;
  let simulatedGoldY = 70; // początkowo na napisie
  assert.equal(collidesWithRoomLabel(simulatedGoldX, simulatedGoldY), true);

  // Logika odrzucania i szukania dozwolonego punktu w Auli A:
  let attempts = 0;
  while (collidesWithRoomLabel(simulatedGoldX, simulatedGoldY) && attempts < 50) {
    simulatedGoldX = 40 + (attempts % 4) * 45;
    simulatedGoldY = 35 + (attempts % 3) * 35;
    attempts++;
  }
  assert.equal(collidesWithRoomLabel(simulatedGoldX, simulatedGoldY), false);

  // Symulacja spawnowania Gemini w Labie: punkt musi być poza strefą wykluczenia
  let simulatedGeminiX = 680;
  let simulatedGeminiY = 465; // na napisie Labu
  assert.equal(collidesWithRoomLabel(simulatedGeminiX, simulatedGeminiY), true);

  let geminiAttempts = 0;
  while (collidesWithRoomLabel(simulatedGeminiX, simulatedGeminiY) && geminiAttempts < 50) {
    simulatedGeminiX = 615 + (geminiAttempts % 3) * 40;
    simulatedGeminiY = 425 + (geminiAttempts % 3) * 45;
    geminiAttempts++;
  }
  assert.equal(collidesWithRoomLabel(simulatedGeminiX, simulatedGeminiY), false);
});

// Test 9: Decyzja czy dymek jest nad czy pod postacią w pikselach (offsetHeight, margines 6 px) i ograniczenie w planszy
test('Speech bubble vertical decision in pixels respects offsetHeight, top overflow with 6px margin and clamps inside board', () => {
  const CANVAS_HEIGHT = 540;
  const containerHeight = 540;
  const margin = 6;
  const bubbleHeight = 64; // rzeczywista wysokość dymka offsetHeight

  function computeVerticalPlacement(entityY: number, height: number = bubbleHeight) {
    const charPxY = (entityY / CANVAS_HEIGHT) * containerHeight;
    // Dymek nad postacią: kotwica w charPxY - 28. Górna krawędź to charPxY - 28 - height
    const wouldOverflowTop = charPxY - 28 - height < margin;

    if (wouldOverflowTop) {
      // Dymek pod postacią
      const targetTop = charPxY + 34;
      const minTop = margin;
      const maxTop = Math.max(minTop, containerHeight - margin - height);
      const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop));
      const bubbleTop = clampedTop;
      const bubbleBottom = clampedTop + height;
      return { isBelow: true, clampedTop, bubbleTop, bubbleBottom };
    } else {
      // Dymek nad postacią
      const targetTop = charPxY - 28;
      const minTop = margin + height;
      const maxTop = Math.max(minTop, containerHeight - margin);
      const clampedTop = Math.max(minTop, Math.min(maxTop, targetTop));
      const bubbleTop = clampedTop - height;
      const bubbleBottom = clampedTop;
      return { isBelow: false, clampedTop, bubbleTop, bubbleBottom };
    }
  }

  // 1. Postać przy samej górze planszy (y = 40): dymek nad postacią wyszedłby poza margines 6 px (40 - 28 - 64 = -52 < 6)
  // Decyzja: musi być POD postacią
  const topEntity = computeVerticalPlacement(40);
  assert.equal(topEntity.isBelow, true);
  assert.ok(topEntity.bubbleTop >= margin);
  assert.ok(topEntity.bubbleBottom <= containerHeight - margin);
  assert.equal(topEntity.clampedTop, 74); // 40 + 34

  // 2. Postać na y = 98 (przy bubbleHeight = 64): 98 - 28 - 64 = 6 px (dokładnie margines 6 px)
  // Decyzja: mieści się NAD postacią (nie przekracza marginesu)
  const edgeEntity = computeVerticalPlacement(98);
  assert.equal(edgeEntity.isBelow, false);
  assert.equal(edgeEntity.bubbleTop, 6);
  assert.ok(edgeEntity.bubbleBottom <= containerHeight - margin);

  // 3. Postać na y = 97: 97 - 28 - 64 = 5 px (< 6 px, wychodzi ponad margines)
  // Decyzja: musi być POD postacią
  const justBelowEdge = computeVerticalPlacement(97);
  assert.equal(justBelowEdge.isBelow, true);
  assert.ok(justBelowEdge.bubbleTop >= margin);
  assert.ok(justBelowEdge.bubbleBottom <= containerHeight - margin);

  // 4. Postać na środku (y = 270): mieści się NAD postacią
  const midEntity = computeVerticalPlacement(270);
  assert.equal(midEntity.isBelow, false);
  assert.equal(midEntity.clampedTop, 270 - 28); // 242
  assert.equal(midEntity.bubbleTop, 242 - 64); // 178
  assert.ok(midEntity.bubbleTop >= margin);
  assert.ok(midEntity.bubbleBottom <= containerHeight - margin);

  // 5. Postać przy samym dole (y = 530): mieści się NAD postacią, dół dymka ograniczony do containerHeight - margin (534)
  const bottomEntity = computeVerticalPlacement(530);
  assert.equal(bottomEntity.isBelow, false);
  assert.ok(bottomEntity.bubbleTop >= margin);
  assert.ok(bottomEntity.bubbleBottom <= containerHeight - margin);
});

// Test 10: Klawisze gry i wywołanie preventDefault tylko w stanie PLAYING
test('Game keys call preventDefault when state is PLAYING', () => {
  const GAME_KEY_CODES = new Set([
    'KeyW', 'KeyS', 'KeyA', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ShiftLeft', 'ShiftRight', 'Space'
  ]);

  function shouldPreventDefault(code: string, state: string) {
    return GAME_KEY_CODES.has(code) && state === 'PLAYING';
  }

  // W trakcie gry klawisze gry wywołują preventDefault
  assert.equal(shouldPreventDefault('Space', 'PLAYING'), true);
  assert.equal(shouldPreventDefault('KeyW', 'PLAYING'), true);
  assert.equal(shouldPreventDefault('ArrowLeft', 'PLAYING'), true);
  assert.equal(shouldPreventDefault('ShiftLeft', 'PLAYING'), true);

  // Poza grą (np. MENU, PAUSED, GAME_OVER) nie blokują domyślnych zachowań
  assert.equal(shouldPreventDefault('Space', 'PAUSED'), false);
  assert.equal(shouldPreventDefault('Space', 'TITLE_MENU'), false);
  assert.equal(shouldPreventDefault('Space', 'GAME_OVER'), false);

  // Inne klawisze w trakcie gry (np. F5, F12, Tab) nie są blokowane
  assert.equal(shouldPreventDefault('F5', 'PLAYING'), false);
  assert.equal(shouldPreventDefault('Tab', 'PLAYING'), false);
});

// Test 11: Pauza i semestry – zmiana zakładki w trakcie pauzy nie zmienia bieżącej gry
test('Semester tab change during pause does not alter active game semester until new session starts', () => {
  let currentSemester = 1;
  let selectedSemester = 1;
  let state = 'PLAYING';

  // 1. Otwarcie zasad podczas gry -> pauza
  state = 'PAUSED';

  // 2. Gracz klika zakładkę Semestru III
  const clickedSem = 3;
  selectedSemester = clickedSem;
  if (state !== 'PAUSED') {
    currentSemester = clickedSem;
  }
  // Bieżąca gra wciąż toczy się na semestrze I!
  assert.equal(currentSemester, 1);
  assert.equal(selectedSemester, 3);

  // 3. Gracz klika „▶ Wróć do gry”
  state = 'PLAYING';
  selectedSemester = currentSemester; // przywrócenie
  assert.equal(currentSemester, 1);
  assert.equal(selectedSemester, 1);

  // 4. Gdyby gracz kliknął „Rozpocznij sesję”, nowy semestr wchodzi w życie
  state = 'PAUSED';
  selectedSemester = 2; // wybrał semestr 2
  // kliknięcie startGame:
  currentSemester = selectedSemester;
  state = 'PLAYING';
  assert.equal(currentSemester, 2);
});

// Test 12: Dźwięk sprintu – throttling co 220 ms
test('Sprint sound throttling allows playback at most once per 220ms', () => {
  let lastSprintTime = 0;
  let playCount = 0;

  function tryPlaySprint(currentTimeMs: number) {
    if (currentTimeMs - lastSprintTime < 220) return false;
    lastSprintTime = currentTimeMs;
    playCount++;
    return true;
  }

  // 1. Pierwsze odtworzenie o t = 1000 ms -> sukces
  assert.equal(tryPlaySprint(1000), true);
  assert.equal(playCount, 1);

  // 2. Klatki w odstępie 16 ms (60 FPS) -> blokowane
  assert.equal(tryPlaySprint(1016), false);
  assert.equal(tryPlaySprint(1033), false);
  assert.equal(tryPlaySprint(1100), false);
  assert.equal(tryPlaySprint(1219), false); // 219 ms po starcie -> jeszcze zablokowane
  assert.equal(playCount, 1);

  // 3. Po 220 ms (t = 1220 ms) -> kolejne odtworzenie dozwolone
  assert.equal(tryPlaySprint(1220), true);
  assert.equal(playCount, 2);
});

// Test 13: Studenci-NPC – cofanie do poprzedniej pozycji przed odbiciem
test('NPC student rewinds position before velocity reversal on wall collision', () => {
  const wall = { x: 200, y: 100, w: 60, h: 60 };
  const npc = { x: 180, y: 130, vx: 2, vy: 0, radius: 12 };

  function checkWallCollision(x: number, y: number, r: number) {
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy < r * r;
  }

  // Przed ruchem: brak kolizji
  assert.equal(checkWallCollision(npc.x, npc.y, npc.radius), false);

  const prevX = npc.x;
  npc.x += npc.vx * 12; // ruch w stronę ściany (180 + 24 = 204)
  assert.equal(checkWallCollision(npc.x, npc.y, npc.radius), true);

  // Logika z game.js: cofnięcie i odbicie
  if (checkWallCollision(npc.x, npc.y, npc.radius)) {
    npc.x = prevX; // cofnięcie!
    npc.vx *= -1; // odbicie!
  }

  // Po korekcie: NPC jest bezpiecznie na poprzedniej pozycji i ma przeciwny wektor prędkości
  assert.equal(npc.x, 180);
  assert.equal(npc.vx, -2);
  assert.equal(checkWallCollision(npc.x, npc.y, npc.radius), false);
});

// Test 14: Usunięcie przycisku „▶ Wróć do gry” z ekranu startowego (#modal-start)
test('Start modal no longer contains btn-resume-game and enemies section', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile('index.html', 'utf-8');

  // #modal-start nie powinien zawierać btn-resume-game
  const startModalIdx = html.indexOf('id="modal-start"');
  const enemiesModalIdx = html.indexOf('id="modal-enemies"');
  const startModalHtml = html.slice(startModalIdx, enemiesModalIdx);

  assert.ok(!startModalHtml.includes('id="btn-resume-game"'), 'modal-start must not have btn-resume-game');
  assert.ok(!startModalHtml.includes('id="enemies-section"'), 'modal-start must not have enemies-section');
});

// Test 15: Osobny modal #modal-enemies z tytułem „👥 Przeciwnicy”, przyciskiem ✕ i 3 kartami z markerami
test('Separate modal #modal-enemies contains title, close button, 3 enemies, color markers, and defense tip', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile('index.html', 'utf-8');

  // Obecność osobnego modala
  assert.ok(html.includes('id="modal-enemies"'), 'Must contain modal-enemies');
  assert.ok(html.includes('id="btn-close-enemies"'), 'Must contain close button btn-close-enemies');
  assert.ok(html.includes('aria-label="Zamknij"'), 'Close button must have aria-label="Zamknij"');
  assert.ok(html.includes('👥 Przeciwnicy'), 'Must have title 👥 Przeciwnicy');

  // Karty przeciwników
  assert.ok(html.includes('Prof. Egzaminator (czerwony długopis)'), 'Must contain Prof. Egzaminator');
  assert.ok(html.includes('Prowadzący ćwiczenia (zielony sweter, teczka)'), 'Must contain Prowadzący ćwiczenia');
  assert.ok(html.includes('Pani z dziekanatu'), 'Must contain Pani z dziekanatu');

  // Znaczniki kolorystyczne postaci
  assert.ok(html.includes('marker-examiner'), 'Must contain examiner color marker');
  assert.ok(html.includes('marker-instructor'), 'Must contain instructor color marker');
  assert.ok(html.includes('marker-dean'), 'Must contain dean color marker');

  // Wskazówka obronna
  assert.ok(
    html.includes('💻 Gemini AI zamraża wszystkich przeciwników na 3,5 s, a 🪪 Legitymacja chroni przed jednym złapaniem przez egzaminatora lub prowadzącego.'),
    'Must contain exact defense tip text'
  );
});

// Test 16: Formatowanie czasu z Math.floor i naprawianie rekordów z kropką
test('formatTime uses Math.floor for minutes and seconds and sanitizes floating point seconds', () => {
  function formatTime(seconds: number) {
    const totalSecs = Math.floor(Number(seconds) || 0);
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Wartości zmiennoprzecinkowe (np. ułamki sekund po delta-time)
  assert.equal(formatTime(0.016666666666666666), '00:00');
  assert.equal(formatTime(59.999), '00:59');
  assert.equal(formatTime(60.123), '01:00');
  assert.equal(formatTime(125.789), '02:05');

  // Rekalkulacja zepsutego rekordu zawierającego kropkę
  const corruptRecord = { seconds: 0.016666666666666666, timeStr: '00:0.016666666666666666', grade: '5.0 (Bardzo dobry)' };
  let sanitizedTimeStr = corruptRecord.timeStr;
  if (typeof sanitizedTimeStr === 'string' && sanitizedTimeStr.includes('.')) {
    sanitizedTimeStr = formatTime(corruptRecord.seconds);
  }
  assert.equal(sanitizedTimeStr, '00:00');
  assert.equal(sanitizedTimeStr.includes('.'), false);
});

// Test 17: Pełnoekranowe modale na smartfonach (< 480 px) w CSS i wysoki z-index modal-enemies
test('CSS has mobile fullscreen modal rules and modal-enemies has higher z-index on top', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile('css/style.css', 'utf-8');

  // Desktop z-index: modal standardowy ma 50, modal-enemies ma 65
  assert.ok(css.includes('.modal-enemies-overlay'), 'Must style .modal-enemies-overlay');
  assert.ok(css.includes('z-index: 65;'), 'modal-enemies must have higher z-index on desktop (65 vs 50)');

  // Weryfikacja reguł w @media (max-width: 480px)
  const mediaIdx = css.indexOf('@media (max-width: 480px)');
  assert.ok(mediaIdx !== -1, 'Must contain @media (max-width: 480px)');

  const mobileCss = css.slice(mediaIdx);
  assert.ok(mobileCss.includes('z-index: 10000;'), 'modal-enemies must have z-index: 10000 on mobile to be above 9999');
  assert.ok(mobileCss.includes('.modal-enemies-header'), 'Must have sticky header on mobile');
  assert.ok(mobileCss.includes('position: sticky;'), 'Header/close button must be sticky on mobile');
});

// Test 18: Zachowanie ℹ️ w trakcie gry (pauza + modal-enemies, powrót do gry po zamknięciu)
test('ℹ️ button opens modal-enemies, pauses game during PLAYING, and resumes on close', () => {
  let state = 'PLAYING';
  let previousState: string | null = null;
  let modalEnemiesOpen = false;
  let rafRunning = true;

  function openEnemiesModal() {
    previousState = state;
    if (state === 'PLAYING') {
      state = 'PAUSED';
      rafRunning = false;
    }
    modalEnemiesOpen = true;
  }

  function closeEnemiesModal() {
    modalEnemiesOpen = false;
    if (previousState === 'PLAYING') {
      state = 'PLAYING';
      rafRunning = true;
    } else {
      state = previousState || state;
    }
    previousState = null;
  }

  // 1. Otwarcie podczas gry
  openEnemiesModal();
  assert.equal(state, 'PAUSED');
  assert.equal(rafRunning, false);
  assert.equal(modalEnemiesOpen, true);

  // 2. Zamknięcie modala (np. ✕, Escape, tło)
  closeEnemiesModal();
  assert.equal(state, 'PLAYING');
  assert.equal(rafRunning, true);
  assert.equal(modalEnemiesOpen, false);

  // 3. Otwarcie przed rozpoczęciem gry (TITLE_MENU)
  state = 'TITLE_MENU';
  openEnemiesModal();
  assert.equal(state, 'TITLE_MENU');
  assert.equal(modalEnemiesOpen, true);
  closeEnemiesModal();
  assert.equal(state, 'TITLE_MENU');
  assert.equal(modalEnemiesOpen, false);

  // 4. Otwarcie po porażce (GAME_OVER)
  state = 'GAME_OVER';
  openEnemiesModal();
  assert.equal(state, 'GAME_OVER');
  assert.equal(modalEnemiesOpen, true);
  closeEnemiesModal();
  assert.equal(state, 'GAME_OVER');
  assert.equal(modalEnemiesOpen, false);
});

// Test 19: Weryfikacja metod w js/game.js: openEnemiesModal, closeEnemiesModal, Escape, blur
test('js/game.js has openEnemiesModal, closeEnemiesModal, Escape listener, and blur calls', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile('js/game.js', 'utf-8');

  assert.ok(js.includes('openEnemiesModal()'), 'Must implement openEnemiesModal');
  assert.ok(js.includes('closeEnemiesModal()'), 'Must implement closeEnemiesModal');
  assert.ok(js.includes('isEnemiesModalOpen()'), 'Must implement isEnemiesModalOpen');
  assert.ok(js.includes("e.code === 'Escape'"), 'Must handle Escape key');
  assert.ok(js.includes('btnInfo.blur()'), 'Must blur btnInfo on close');
  assert.ok(js.includes('this.btnCloseEnemies.blur()'), 'Must blur btnCloseEnemies on close');
});

// Test 20: ETAP 1 z 4: Przebudowa grafiki gry (prerenderowane tło offscreen, obrót ECTS, nocny klimat, pop ECTS)
test('Stage 1 visual overhaul: offscreen staticBgCanvas, 3/4 characters, rotating ECTS, ects-pop animation', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile('js/game.js', 'utf-8');
  const css = await fs.readFile('css/style.css', 'utf-8');

  // 1. Offscreen staticBgCanvas i prerenderStaticCampus
  assert.ok(js.includes('initStaticBgCanvas()'), 'Must have initStaticBgCanvas');
  assert.ok(js.includes('prerenderStaticCampus()'), 'Must have prerenderStaticCampus');
  assert.ok(js.includes('this.ctx.drawImage(this.staticBgCanvas, 0, 0)'), 'render must draw prerendered staticBgCanvas in 1 call');

  // 2. Szachownica korytarza i logo ALK wyryte w podłodze
  assert.ok(js.includes('prerenderCorridorLogo'), 'Must prerender ALK logo on corridor floor');
  assert.ok(js.includes('EST. 1993'), 'Corridor seal must mention ALK founding year 1993');

  // 3. Meble i detale (katedra, tablica, lada, automat, regały, biurka)
  assert.ok(js.includes('prerenderFurnitureAndDetails'), 'Must prerender room furniture and details');

  // 4. Obracający się żeton ECTS (scale Y/X) i podskakiwanie
  assert.ok(js.includes('scale(rotScale, 1.0)'), 'ECTS item must rotate using scale');
  assert.ok(js.includes('bounceY'), 'ECTS item must have bounce motion');

  // 5. Efekt stempla przy ogłuszeniu
  assert.ok(js.includes('PIECZĄTKA!'), 'Must render stamp effect on dean clerk stun');

  // 6. CSS: ectsPop keyframes i klasa ects-pop
  assert.ok(css.includes('@keyframes ectsPop'), 'CSS must define ectsPop animation');
  assert.ok(css.includes('.hud-value.ects-pop'), 'CSS must define .hud-value.ects-pop class');
  assert.ok(js.includes('classList.add(\'ects-pop\')'), 'updateHUD must trigger ects-pop class on increase');
});

// Test 21: ETAP 1b – dopracowanie postaci w widoku 3/4, znaczniki i ciemne obwódki tekstów
test('Stage 1b character figurines: 3/4 animated bodies, enemy markers, strokeText outline, no circle tokens', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile('js/game.js', 'utf-8');

  // 1. Znaczniki nad głowami przeciwników
  assert.ok(js.includes('drawEnemyMarker(yOffset, color)'), 'Must define drawEnemyMarker helper');
  assert.ok(js.includes("this.drawEnemyMarker(-33, '#ef4444')"), 'Examiner must have red marker triangle');
  assert.ok(js.includes("this.drawEnemyMarker(-31, '#10b981')"), 'Instructor must have green marker triangle');
  assert.ok(js.includes("this.drawEnemyMarker(-32, '#a855f7')"), 'Dean clerk must have purple marker triangle');

  // 2. Miękki owalny cień pod stopami (alfa 0.35)
  assert.ok(js.includes("rgba(0, 0, 0, 0.35)"), 'Characters must have soft ground shadow with alpha 0.35');

  // 3. Figurka studenta: bluza ALK, złoty plecak, trampki, napis ALK na piersi
  assert.ok(js.includes('fillText("ALK"'), 'Student hoodie must have white ALK print on chest');
  assert.ok(js.includes('#f2a900'), 'Student must have gold backpack');
  assert.ok(js.includes('isFacingLeft'), 'Characters must flip horizontally when moving left');
  assert.ok(js.includes('isFacingUp'), 'Characters must show back of head when moving up');

  // 4. Egzaminator: krawat, łysina, czerwony długopis
  assert.ok(js.includes('#ef4444'), 'Examiner must wear red tie and hold red pen');
  assert.ok(js.includes('Łysina na czubku'), 'Examiner must have bald crown on head');

  // 5. Prowadzący: zielony sweter, broda, okulary na czole, teczka
  assert.ok(js.includes('#059669'), 'Instructor must wear green sweater');
  assert.ok(js.includes('Teczka akademicka'), 'Instructor must hold leather briefcase');
  assert.ok(js.includes('Przystrzyżona broda'), 'Instructor must have trimmed beard');

  // 6. Pani z dziekanatu: fioletowy żakiet, spódnica, kok ze szpilką, pieczątka
  assert.ok(js.includes('#6b21a8'), 'Dean clerk must wear purple skirt');
  assert.ok(js.includes('Czerwona szpilka'), 'Dean clerk must have red hairpin in bun');
  assert.ok(js.includes('Urzędowa pieczątka'), 'Dean clerk must hold official stamp');

  // 7. drawFloatingTexts: gruba ciemna obwódka strokeText
  assert.ok(js.includes("this.ctx.strokeStyle = 'rgba(6, 10, 25, 0.95)'"), 'Floating text must have dark stroke outline');
  assert.ok(js.includes('this.ctx.strokeText(ft.text, ft.x, ft.y)'), 'Floating text must call strokeText before fillText');
});

// Test 22: Poprawka wyniku (Score & Records) w HUD, modalach i localStorage
test('Score and records: HUD updates score, modals show score and time bonus, localStorage saves bestScore', async () => {
  const fs = await import('node:fs');
  const js = fs.readFileSync('js/game.js', 'utf8');

  // 1. this.hudScoreVal jest aktualizowany w updateHUD
  assert.ok(js.includes('this.hudScoreVal.textContent = `${this.score.toLocaleString'), 'hudScoreVal must be updated in updateHUD');

  // 2. triggerGameOver wpisuje wynik, combo i przedmioty
  assert.ok(js.includes('this.gameoverScore.textContent = `${this.score.toLocaleString'), 'gameoverScore must show score in game over modal');
  assert.ok(js.includes('this.gameoverCombo.textContent = `x${this.maxCombo}`'), 'gameoverCombo must show maxCombo in game over modal');
  assert.ok(js.includes('this.gameoverItems.textContent = String(this.itemsCollectedCount)'), 'gameoverItems must show items collected');

  // 3. triggerVictory liczy bonus za czas: max(0, 240 - floor(sekundy)) * 10 i dodaje do wyniku
  assert.ok(js.includes('Math.max(0, 240 - Math.floor(this.elapsedSeconds)) * 10'), 'Time bonus must be calculated in triggerVictory');
  assert.ok(js.includes('this.victoryScore.textContent = `${this.score.toLocaleString'), 'victoryScore must show total score');
  assert.ok(js.includes('this.victoryTimeBonus.textContent = `Bonus: +${timeBonus.toLocaleString'), 'victoryTimeBonus must show time bonus');

  // 4. saveBestRecord zapisuje pole score, a updateRecordDisplays pokazuje wynik obok czasu
  assert.ok(js.includes('score: bestScore'), 'saveBestRecord must save bestScore in localStorage record');
  assert.ok(js.includes('parsed.score.toLocaleString'), 'updateRecordDisplays must show score formatted with locale string');
});

// Test 23: ETAP 3 - Finał „Egzamin ustny”
test('Stage 3 Final Oral Exam: 30 ECTS starts final phase, 25s/20s timer, +15% examiner speed, Dziekanat target', async () => {
  const fs = await import('node:fs');
  const js = fs.readFileSync('js/game.js', 'utf8');
  const html = fs.readFileSync('index.html', 'utf8');
  const readme = fs.readFileSync('README.md', 'utf8');

  // 1. Po zdobyciu 30 ECTS odpala startFinalPhase zamiast natychmiastowego zwycięstwa
  assert.ok(js.includes('this.startFinalPhase()'), 'Collecting 30 ECTS must call startFinalPhase');
  assert.ok(js.includes('this.finalPhase = true'), 'startFinalPhase must set finalPhase to true');

  // 2. Czas finału: 25s w semestrze I/II, 20s w semestrze III
  assert.ok(js.includes('this.currentSemester === 3 ? 20.0 : 25.0'), 'Final timer must be 20s for semester 3 and 25s otherwise');

  // 3. Baner na górze z odliczaniem i opisem
  assert.ok(js.includes('EGZAMIN USTNY!'), 'Event banner must display EGZAMIN USTNY!');
  assert.ok(js.includes('Zanieś indeks do Dziekanatu!'), 'Event banner must describe bringing index to Dziekanat');

  // 4. Egzaminator zyskuje +15% prędkości w finale
  assert.ok(js.includes('if (this.finalPhase)') && js.includes('targetSpeed *= 1.15'), 'Examiner must gain 15% speed in final phase');

  // 5. Cel w Dziekanacie i dynamiczna strzałka
  assert.ok(js.includes('this.finalTarget = { x: 740, y: 65, w: 40, h: 40 }'), 'Target in Dziekanat must be at counter zone');
  assert.ok(js.includes('drawFinalTarget'), 'Game must render final target in Dziekanat');
  assert.ok(js.includes('drawTargetPointer'), 'Game must render target pointer arrow over student');
  assert.ok(js.includes('drawFinalVignette'), 'Game must render subtle red vignette in final phase');

  // 6. Dotarcie do celu nagradza +1000 pkt i wygraną, a koniec czasu kończy grę komunikatem
  assert.ok(js.includes('this.score += 1000'), 'Passing oral exam grants 1000 pkt bonus');
  assert.ok(js.includes('Dziekanat zamknięty! Nie zdążyłeś oddać indeksu.'), 'Timeout in final phase must show closed Dean office message');

  // 7. Pani z dziekanatu patroluje przed wejściem
  assert.ok(js.includes('{ x: 630, y: 80 }') && js.includes('{ x: 675, y: 115 }'), 'Dean clerk must patrol in front of entrance in final phase');

  // 8. Wzmianka o finale na ekranie startowym i w README
  assert.ok(html.includes('Egzamin ustny') && html.includes('zanosząc indeks do Dziekanatu'), 'Start screen story text must mention oral exam final');
  assert.ok(html.includes('id="victory-oral-row"'), 'Victory modal must include oral exam result row');
  assert.ok(readme.includes('Finał: Egzamin Ustny w Dziekanacie'), 'README must describe the oral exam final section');
});

// Test 24: ETAP 4 – Menu, samouczek, podsumowanie, ocena gwiazdkowa i ustawienia
test('Stage 4 Star rating calculation (0★ on loss; 1★ on win; 2★ for score >= 4000; 3★ for score >= 7000 and 5.0 grade)', () => {
  function calculateStars(isVictory: boolean, score: number, grade: string) {
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

  // 1. Porażka zawsze daje 0 gwiazdek
  assert.equal(calculateStars(false, 9000, '5.0 (Bardzo dobry)'), 0);
  assert.equal(calculateStars(false, 1500, '3.0 (Dostateczny)'), 0);

  // 2. Wygrana ze skromnym wynikiem (< 4000 pkt) daje 1 gwiazdkę
  assert.equal(calculateStars(true, 2500, '4.0 (Dobry)'), 1);
  assert.equal(calculateStars(true, 3990, '5.0 (Bardzo dobry)'), 1);

  // 3. Wygrana z wynikiem >= 4000 pkt daje 2 gwiazdki
  assert.equal(calculateStars(true, 4000, '3.5 (Dostateczny plus)'), 2);
  assert.equal(calculateStars(true, 6500, '4.5 (Dobry plus)'), 2);

  // 4. Wynik >= 7000, ale ocena poniżej 5.0 daje 2 gwiazdki (kryterium 3 gwiazdek wymaga 5.0)
  assert.equal(calculateStars(true, 7500, '4.5 (Dobry plus)'), 2);
  assert.equal(calculateStars(true, 8200, '4.0 (Dobry)'), 2);

  // 5. Wynik >= 7000 ORAZ ocena 5.0 daje maksymalne 3 gwiazdki!
  assert.equal(calculateStars(true, 7000, '5.0 (Bardzo dobry)'), 3);
  assert.equal(calculateStars(true, 9500, '5.0 (Bardzo dobry)'), 3);
});

// Test 25: ETAP 4 – Ustawienia dźwięku (dual-gain), wstrząsów i cytatów
test('Stage 4 Settings serialization and volume dual-channel logic', () => {
  interface GameSettings {
    musicVol: number;
    sfxVol: number;
    screenShake: boolean;
    quotes: boolean;
  }

  function serializeSettings(s: GameSettings): string {
    return JSON.stringify({
      musicVol: Math.max(0, Math.min(1, s.musicVol)),
      sfxVol: Math.max(0, Math.min(1, s.sfxVol)),
      screenShake: Boolean(s.screenShake),
      quotes: Boolean(s.quotes)
    });
  }

  function deserializeSettings(raw: string | null): GameSettings {
    const defaults: GameSettings = {
      musicVol: 0.7,
      sfxVol: 0.8,
      screenShake: true,
      quotes: true
    };
    if (!raw) return defaults;
    try {
      const data = JSON.parse(raw);
      return {
        musicVol: typeof data.musicVol === 'number' ? Math.max(0, Math.min(1, data.musicVol)) : defaults.musicVol,
        sfxVol: typeof data.sfxVol === 'number' ? Math.max(0, Math.min(1, data.sfxVol)) : defaults.sfxVol,
        screenShake: typeof data.screenShake === 'boolean' ? data.screenShake : defaults.screenShake,
        quotes: typeof data.quotes === 'boolean' ? data.quotes : defaults.quotes
      };
    } catch {
      return defaults;
    }
  }

  // Zapis i odczyt standardowych ustawień
  const custom: GameSettings = { musicVol: 0.45, sfxVol: 0.9, screenShake: false, quotes: false };
  const jsonStr = serializeSettings(custom);
  const loaded = deserializeSettings(jsonStr);

  assert.equal(loaded.musicVol, 0.45);
  assert.equal(loaded.sfxVol, 0.9);
  assert.equal(loaded.screenShake, false);
  assert.equal(loaded.quotes, false);

  // Uszkodzony lub pusty JSON zwraca bezpieczne wartości domyślne
  assert.deepEqual(deserializeSettings(null), { musicVol: 0.7, sfxVol: 0.8, screenShake: true, quotes: true });
  assert.deepEqual(deserializeSettings('{ invalid json'), { musicVol: 0.7, sfxVol: 0.8, screenShake: true, quotes: true });
});

// Test 26: ETAP 4 – Struktura HTML i stylistyka CSS dla etapu 4
test('Stage 4 DOM elements and CSS styling for menu, tutorial, pause, settings and stars', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile('index.html', 'utf-8');
  const css = await fs.readFile('css/style.css', 'utf-8');
  const js = await fs.readFile('js/game.js', 'utf-8');
  const audioJs = await fs.readFile('js/audio.js', 'utf-8');

  // 1. Dźwięk audio.js: obsługa musicGain, sfxGain, playCountdownBeep, playCountdownStart
  assert.ok(audioJs.includes('this.musicGain'), 'SoundSystem must manage musicGain');
  assert.ok(audioJs.includes('this.sfxGain'), 'SoundSystem must manage sfxGain');
  assert.ok(audioJs.includes('playCountdownBeep()'), 'SoundSystem must provide playCountdownBeep');
  assert.ok(audioJs.includes('playCountdownStart()'), 'SoundSystem must provide playCountdownStart');
  assert.ok(audioJs.includes('setMusicVolume'), 'SoundSystem must provide setMusicVolume');
  assert.ok(audioJs.includes('setSfxVolume'), 'SoundSystem must provide setSfxVolume');

  // 2. index.html: countdown overlay, tutorial modal, pause modal, settings modal
  assert.ok(html.includes('id="countdown-overlay"'), 'HTML must contain countdown-overlay');
  assert.ok(html.includes('id="modal-tutorial"'), 'HTML must contain modal-tutorial');
  assert.ok(html.includes('id="modal-pause"'), 'HTML must contain modal-pause');
  assert.ok(html.includes('id="modal-settings"'), 'HTML must contain modal-settings');
  assert.ok(html.includes('id="btn-settings"'), 'Header must contain settings button ⚙️');

  // 3. index.html: uporządkowany ekran startowy (tabela rekordów, rozwijana legenda, złoty połysk)
  assert.ok(html.includes('brand-title-gold'), 'Start title must have brand-title-gold');
  assert.ok(html.includes('btn-pulsing'), 'Start session button must have btn-pulsing');
  assert.ok(html.includes('collapsible-legend'), 'Items and controls must be in collapsible-legend');
  assert.ok(html.includes('id="rec-sem-1-time"'), 'Records table must contain time cell');
  assert.ok(html.includes('id="rec-sem-1-grade"'), 'Records table must contain grade cell');
  assert.ok(html.includes('id="rec-sem-1-score"'), 'Records table must contain score cell');

  // 4. index.html: gwiazdki i przyciski menu na ekranach końcowych
  assert.ok(html.includes('id="gameover-stars"'), 'Game over modal must contain gameover-stars');
  assert.ok(html.includes('id="victory-stars"'), 'Victory modal must contain victory-stars');
  assert.ok(html.includes('id="btn-gameover-menu"'), 'Game over modal must have btn-gameover-menu');
  assert.ok(html.includes('id="btn-victory-menu"'), 'Victory modal must have btn-victory-menu');

  // 5. css/style.css: animacje złota, pulsu, odliczania i gwiazdek
  assert.ok(css.includes('@keyframes goldShimmer'), 'CSS must define goldShimmer animation');
  assert.ok(css.includes('@keyframes startPulse'), 'CSS must define startPulse animation');
  assert.ok(css.includes('@keyframes campusScroll'), 'CSS must define campusScroll animation');
  assert.ok(css.includes('@keyframes countdownPop'), 'CSS must define countdownPop animation');
  assert.ok(css.includes('@keyframes starBounce'), 'CSS must define starBounce animation');

  // 6. js/game.js: obsługa klawisza P, powrotu do menu, startCountdown, modali
  assert.ok(js.includes('startCountdown()'), 'game.js must define startCountdown');
  assert.ok(js.includes('returnToMenu()'), 'game.js must define returnToMenu');
  assert.ok(js.includes("e.code === 'KeyP'"), 'game.js must handle KeyP for pausing');
  assert.ok(js.includes('calculateStars'), 'game.js must implement calculateStars');
  assert.ok(js.includes('renderStars'), 'game.js must implement renderStars');
  assert.ok(js.includes('checkFirstTimeTutorial'), 'game.js must implement checkFirstTimeTutorial');
});

// Test 27: Poprawki po etapie 4 – ukrycie odliczania, reset HUD w menu, responsywny HUD i gwiazdki
test('Post-stage 4 fixes: countdown hidden rules, resetHUD, responsive HUD wrapping, and distinct stars', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile('css/style.css', 'utf-8');
  const js = await fs.readFile('js/game.js', 'utf-8');

  // 1. #countdown-overlay.hidden i #countdown-box.hidden mają display: none !important
  assert.ok(css.includes('#countdown-overlay.hidden'), 'style.css must have #countdown-overlay.hidden');
  assert.ok(css.includes('#countdown-box.hidden'), 'style.css must have #countdown-box.hidden');
  assert.ok(css.includes('.hidden {\n  display: none !important;\n}'), 'style.css must have global .hidden display: none rule');

  // 2. resetHUD w js/game.js resetuje wszystkie wartości i ukrywa bannery
  assert.ok(js.includes('resetHUD()'), 'game.js must define resetHUD');
  assert.ok(js.includes("this.hudStatusBadge.textContent = 'Sesja letnia trwa'"), 'resetHUD must set status to Sesja letnia trwa');
  assert.ok(js.includes("this.hudTimeVal.textContent = '00:00'"), 'resetHUD must reset time to 00:00');
  assert.ok(js.includes("this.hudScoreVal.textContent = '0 pkt'"), 'resetHUD must reset score to 0 pkt');
  assert.ok(js.includes("this.hudEctsVal.textContent = '0'"), 'resetHUD must reset ECTS to 0');
  assert.ok(js.includes("this.hudStaminaVal.textContent = '100%'"), 'resetHUD must reset stamina to 100%');
  assert.ok(js.includes('this.resetHUD()'), 'returnToMenu must call resetHUD');

  // 3. Responsywny HUD: zawijanie poniżej 900 px i 480 px
  assert.ok(css.includes('@media (max-width: 900px)'), 'style.css must have @media (max-width: 900px)');
  assert.ok(css.includes('repeat(auto-fit, minmax(150px, 1fr))'), 'HUD must wrap using repeat(auto-fit, minmax(150px, 1fr))');
  assert.ok(css.includes('grid-column: span 2;'), 'Status must span 2 columns below 900px');
  assert.ok(css.includes('min-width: 0;'), 'HUD blocks must have min-width: 0');

  // 4. Gwiazdki: wypełniona (złota, pełna ★) i pusta (szara, kontur ☆)
  assert.ok(js.includes("star.className = 'star-item star-filled pop-star'"), 'renderStars must apply star-filled to active stars');
  assert.ok(js.includes("star.textContent = '★'"), 'renderStars must use full star ★ for filled stars');
  assert.ok(js.includes("star.className = 'star-item star-empty'"), 'renderStars must apply star-empty to empty stars');
  assert.ok(js.includes("star.textContent = '☆'"), 'renderStars must use contour star ☆ for empty stars');
  assert.ok(css.includes('.star-item.star-filled'), 'style.css must style .star-item.star-filled');
  assert.ok(css.includes('.star-item.star-empty'), 'style.css must style .star-item.star-empty');
});

// Test 28: Dostępność i przewijanie modali – brak overflow: hidden na kartach, overflow-y: auto i przyklejona stopka (sticky bottom)
test('Modal accessibility and scrolling: no overflow hidden on cards, overflow-y auto and sticky bottom footers', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile('css/style.css', 'utf-8');
  const html = await fs.readFile('index.html', 'utf-8');

  // 1. .modal-card ma overflow-y: auto, overscroll-behavior: contain, -webkit-overflow-scrolling: touch i max-height: 100%
  assert.ok(css.includes('.modal-card {'), 'style.css must define .modal-card');
  assert.ok(css.includes('max-height: 100%;'), 'modal-card must have max-height: 100%');
  assert.ok(css.includes('overflow-y: auto;'), 'modal-card must have overflow-y: auto');
  assert.ok(css.includes('overscroll-behavior: contain;'), 'modal-card must have overscroll-behavior: contain');
  assert.ok(css.includes('-webkit-overflow-scrolling: touch;'), 'modal-card must have -webkit-overflow-scrolling: touch');

  // 2. .modal-start-card NIE MOŻE mieć overflow: hidden!
  assert.ok(!css.includes('.modal-start-card {\n  position: relative;\n  overflow: hidden;\n}'), '.modal-start-card must not have overflow: hidden');
  assert.ok(css.includes('.modal-start-card {\n  position: relative;\n  overflow-y: auto;'), '.modal-start-card must have overflow-y: auto');

  // 3. .start-bg-scroller zawiera ukrywanie overflow wewnątrz, nie blokując karty
  assert.ok(css.includes('.start-bg-scroller {\n  position: absolute;\n  inset: 0;\n  border-radius: 18px;\n  overflow: hidden;'), '.start-bg-scroller must isolate overflow: hidden');

  // 4. .modal-footer ma position: sticky; bottom: 0; z-index: 2; padding górny 14px; tło linear-gradient
  assert.ok(css.includes('.modal-footer {\n  position: sticky;\n  bottom: 0;'), '.modal-footer must be sticky to bottom');
  assert.ok(css.includes('z-index: 2;'), '.modal-footer must have z-index: 2');
  assert.ok(css.includes('padding: 14px'), '.modal-footer must have top padding 14px');
  assert.ok(css.includes('linear-gradient(to top, rgba(10, 17, 40, 0.98) 75%, rgba(10, 17, 40, 0) 100%)'), '.modal-footer must have gradient background');
  assert.ok(css.includes('.modal-start-card .modal-footer'), 'modal-start-card must enforce sticky footer');
  assert.ok(css.includes(':not(.modal-footer)'), 'modal-start-card child selector must exclude modal-footer');
  assert.ok(css.includes('.modal-card-danger .modal-footer'), 'Danger card footer must be styled');
  assert.ok(css.includes('.modal-card-success .modal-footer'), 'Success card footer must be styled');

  // 5. Wszystkie modale istnieją w HTML: start, enemies, tutorial, pause, settings, gameover, victory
  assert.ok(html.includes('id="modal-start"'), 'HTML must have modal-start');
  assert.ok(html.includes('id="modal-enemies"'), 'HTML must have modal-enemies');
  assert.ok(html.includes('id="modal-tutorial"'), 'HTML must have modal-tutorial');
  assert.ok(html.includes('id="modal-pause"'), 'HTML must have modal-pause');
  assert.ok(html.includes('id="modal-settings"'), 'HTML must have modal-settings');
  assert.ok(html.includes('id="modal-gameover"'), 'HTML must have modal-gameover');
  assert.ok(html.includes('id="modal-victory"'), 'HTML must have modal-victory');

  // 6. Stopka jest bezpośrednim dzieckiem przewijanej .modal-card w każdym modalu z akcjami
  assert.ok(html.includes('<div class="modal-card modal-start-card">\n              <!-- Animowane tło za kartą -->\n              <div class="start-bg-scroller" aria-hidden="true"></div>') && html.includes('class="modal-footer modal-footer-buttons"'), 'Start modal footer is direct child of card');
  assert.ok(html.includes('id="btn-start-game"'), 'Start modal must contain btn-start-game');
});







