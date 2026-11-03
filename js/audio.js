/**
 * Kozminski Escape: Polowanie na ECTS
 * Akademia Leona Koźmińskiego (ALK)
 * Moduł dźwiękowy: /js/audio.js
 * 
 * Czysta synteza 8-bitowych i retro efektów dźwiękowych oraz dynamicznej
 * muzyki chiptune przy użyciu Web Audio API (AudioContext, OscillatorNode, GainNode, BiquadFilterNode)
 * bez żadnych zewnętrznych plików audio.
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.lastHeartbeatTime = 0;
    this.lastSprintTime = 0;
    this.lastBreathingTime = 0;

    // Sekwencer muzyki chiptune
    this.isPlayingMusic = false;
    this.isMusicPaused = false;
    this.currentBpm = 110;
    this.targetBpm = 110;
    this.currentIntensity = 1; // 1: bas+hi-hat (>250px), 2: +arpeggio (<250px), 3: +werbel i 140 BPM (<120px/szał)
    this.targetIntensity = 1;
    this.currentStep = 0;      // 0..63 (4 takty po 16 kroków)
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.noiseBuffer = null;
  }

  /**
   * Inicjalizuje AudioContext po pierwszej interakcji użytkownika
   * (wymóg przeglądarek: autoplay policy).
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Osobny węzeł głośności muzyki
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // Osobny węzeł głośności efektów dźwiękowych (SFX)
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.initNoiseBuffer();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initNoiseBuffer() {
    if (this.noiseBuffer || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 sekundy białego szumu
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Ustawia głośność muzyki w tle (0.0 do 1.0)
   */
  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.musicGain && this.ctx && this.isPlayingMusic && !this.isMusicPaused) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(0.32 * this.musicVolume, now);
    }
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  /**
   * Ustawia głośność efektów dźwiękowych SFX (0.0 do 1.0)
   */
  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  getSfxVolume() {
    return this.sfxVolume;
  }

  /**
   * Przełącza wyciszenie dźwięków i muzyki
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // =========================================================================
  // SEKWENCER CHIPTUNE 8-BIT W TONACJI MOLOWEJ (D-MOLL)
  // =========================================================================

  startMusic() {
    this.init();
    if (!this.ctx) return;

    if (this.isPlayingMusic) {
      this.resumeMusic();
      return;
    }

    this.isPlayingMusic = true;
    this.isMusicPaused = false;
    this.currentStep = 0;
    this.currentBpm = this.targetBpm;
    this.currentIntensity = this.targetIntensity;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Płynne podgłośnienie muzyki
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(0.001, now);
    this.musicGain.gain.linearRampToValueAtTime(0.32 * this.musicVolume, now + 0.25);

    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => this.musicScheduler(), 35);
  }

  stopMusic() {
    if (!this.ctx || !this.isPlayingMusic) return;
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    }

    setTimeout(() => {
      if (this.schedulerTimer) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      this.isPlayingMusic = false;
      this.isMusicPaused = false;
    }, 220);
  }

  pauseMusic() {
    if (!this.ctx || !this.isPlayingMusic || this.isMusicPaused) return;
    this.isMusicPaused = true;
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    }
  }

  resumeMusic() {
    if (!this.ctx || !this.isPlayingMusic) {
      this.startMusic();
      return;
    }
    this.isMusicPaused = false;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(0.32 * this.musicVolume, now + 0.2);
    }
  }

  /**
   * Zmienia intensywność i tempo w zależności od odległości egzaminatora
   */
  updateMusicIntensity(distToExaminer, isRaging) {
    if (isRaging || distToExaminer < 120) {
      this.targetIntensity = 3;
      this.targetBpm = 140;
    } else if (distToExaminer < 250) {
      this.targetIntensity = 2;
      this.targetBpm = 110;
    } else {
      this.targetIntensity = 1;
      this.targetBpm = 110;
    }
  }

  musicScheduler() {
    if (!this.isPlayingMusic || this.isMusicPaused || !this.ctx) return;

    // Lookahead: planowanie nut do przodu o ~0.12 s
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleMusicStep(this.currentStep, this.nextNoteTime);
      this.advanceMusicStep();
    }
  }

  advanceMusicStep() {
    const secondsPerBeat = 60.0 / this.currentBpm;
    const stepDuration = 0.25 * secondsPerBeat; // 16-tka
    this.nextNoteTime += stepDuration;
    this.currentStep++;

    if (this.currentStep >= 64) {
      this.currentStep = 0;
    }

    // Płynna zmiana tempa i intensywności NA GRANICY TAKTU (co 16 kroków = 1 takt)
    if (this.currentStep % 16 === 0) {
      if (this.targetBpm !== this.currentBpm) {
        this.currentBpm = this.targetBpm;
      }
      if (this.targetIntensity !== this.currentIntensity) {
        this.currentIntensity = this.targetIntensity;
      }
    }
  }

  scheduleMusicStep(step, time) {
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const secondsPerBeat = 60.0 / this.currentBpm;
    const stepDuration = 0.25 * secondsPerBeat;

    // 1. Linia basowa (fala trójkątna, gra zawsze)
    // Akordy: 0: Dm (D2), 1: Bb (Bb1), 2: C (C2), 3: Am (A1)
    const bassRoots = [73.42, 58.27, 65.41, 55.00]; // D2, Bb1, C2, A1
    const bassPatterns = [
      [1, 0, 1, 0, 1.2, 0, 1, 0, 1.5, 0, 1.2, 0, 1, 0, 1.12, 0], // Dm
      [1, 0, 1, 0, 1.25, 0, 1, 0, 1.5, 0, 1.25, 0, 1, 0, 1.12, 0], // Bb
      [1, 0, 1, 0, 1.25, 0, 1, 0, 1.5, 0, 1.25, 0, 1, 0, 1.12, 0], // C
      [1, 0, 1, 0, 1.2, 0, 1, 0, 1.5, 0, 1.2, 0, 1, 0, 1.41, 0]   // Am / C#
    ];

    const mult = bassPatterns[bar][stepInBar];
    if (mult > 0) {
      this.playBassNote(bassRoots[bar] * mult, time, stepDuration * 0.85);
    }

    // 2. Perkusja z szumu (Hi-hat gra zawsze na ósemkach, werbel od intensywności 3)
    if (stepInBar % 2 === 0) {
      // Hi-hat (zamknięty, krótki szum high-pass)
      this.playHiHat(time);
    }

    if (this.currentIntensity >= 3 && (stepInBar === 4 || stepInBar === 12)) {
      // Werbel na 2 i 4 miarze taktu (kroki 4 i 12)
      this.playSnare(time);
    }

    // 3. Arpeggio chiptune (fala prostokątna z filtrem, od poziomu 2 - <250 px)
    if (this.currentIntensity >= 2) {
      const arpTables = [
        // Dm: D4, F4, A4, D5, F5, D5, A4, F4...
        [293.66, 349.23, 440.00, 587.33, 698.46, 587.33, 440.00, 349.23],
        // Bb: Bb3, D4, F4, Bb4, D5, Bb4, F4, D4
        [233.08, 293.66, 349.23, 466.16, 587.33, 466.16, 349.23, 293.66],
        // C: C4, E4, G4, C5, E5, C5, G4, E4
        [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63],
        // Am: A3, C4, E4, A4, C5, A4, E4, C4
        [220.00, 261.63, 329.63, 440.00, 523.25, 440.00, 329.63, 261.63]
      ];

      const arpNote = arpTables[bar][stepInBar % 8];
      this.playArpNote(arpNote, time, stepDuration * 0.7);
    }
  }

  playBassNote(freq, time, duration) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playArpNote(freq, time, duration) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    // Filtr bandpass łagodzący 8-bitowy square wave
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.2, time);

    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playHiHat(time) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.065, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(time);
    source.stop(time + 0.038);
  }

  playSnare(time) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    // Składowa szumowa werbla
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(1.4, time);

    const gainNoise = this.ctx.createGain();
    gainNoise.gain.setValueAtTime(0.18, time);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    source.connect(filter);
    filter.connect(gainNoise);
    gainNoise.connect(this.musicGain);

    source.start(time);
    source.stop(time + 0.13);

    // Składowa tonalna (uderzenie pałki)
    const osc = this.ctx.createOscillator();
    const gainTone = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.06);

    gainTone.gain.setValueAtTime(0.18, time);
    gainTone.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gainTone);
    gainTone.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // =========================================================================
  // EFEKTY DŹWIĘKOWE (SFX)
  // =========================================================================
  // OBSŁUGA EFEKTÓW DŹWIĘKOWYCH (SFX)
  // =========================================================================

  getSFXDestination() {
    return this.sfxGain || this.masterGain;
  }

  play(type, extraParam) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    switch (type) {
      case 'ects':
        this.playECTS(extraParam);
        break;
      case 'gold':
        this.playGold();
        break;
      case 'cheat':
        this.playCheat();
        break;
      case 'coffee':
        this.playCoffee();
        break;
      case 'shield':
        this.playShield();
        break;
      case 'freeze':
        this.playFreeze();
        break;
      case 'hide':
        this.playHide();
        break;
      case 'sneeze':
        this.playSneeze();
        break;
      case 'stun':
        this.playStun();
        break;
      case 'hit':
        this.playHit();
        break;
      case 'win':
        this.playWin();
        break;
      case 'event':
        this.playEvent();
        break;
      case 'heartbeat':
        this.playHeartbeat(extraParam);
        break;
      case 'achievement':
        this.playAchievement();
        break;
      case 'breath':
        this.playBreathing();
        break;
      case 'countdown_beep':
        this.playCountdownBeep();
        break;
      case 'countdown_start':
        this.playCountdownStart();
        break;
      default:
        console.warn(`[SoundSystem] Nieznany typ dźwięku: ${type}`);
    }
  }

  playCountdownBeep() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCountdownStart() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.28);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * 1. 'ects': melodyjny, wysoki dwuton monety (trójkątna fala).
   * Dźwięk podnosi się o półton z każdym poziomem combo (combo x1 -> x5)!
   */
  playECTS(combo = 1) {
    const now = this.ctx.currentTime;
    const semitone = Math.max(0, Math.min(4, (combo || 1) - 1));
    const pitchRatio = Math.pow(2, semitone / 12);

    // Ton 1: B5 (987.77 Hz * pitchRatio)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77 * pitchRatio, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.getSFXDestination());
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Ton 2: E6 (1318.51 Hz * pitchRatio)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51 * pitchRatio, now + 0.08);
    gain2.gain.setValueAtTime(0.35, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.getSFXDestination());
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  }

  // 'gold': Złote ECTS (+3 pkt) - lśniąca, kryształowa kaskada arpeggio
  playGold() {
    const now = this.ctx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.getSFXDestination());
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  // 'cheat': Ściąga (+3 ECTS, szał profesora) - mroczny, zgrzytliwy akord niepokoju
  playCheat() {
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(220, now); // A3
    osc1.frequency.linearRampToValueAtTime(185, now + 0.35); // Dissonance
    osc2.frequency.setValueAtTime(311.13, now); // Eb4 (tryton)
    osc2.frequency.linearRampToValueAtTime(370, now + 0.35);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.getSFXDestination());

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  // 'coffee': dźwięk przyspieszenia (rosnąca częstotliwość fali piłokształtnej)
  playCoffee() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(960, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(1440, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // 'shield': aktywacja tarczy legitymacji studenckiej (akord sinusoidalny)
  playShield() {
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const startTime = now + idx * 0.03;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.getSFXDestination());
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  // 'freeze': cybernetyczny paraliż przeciwników przez Gemini AI (fala prostokątna)
  playFreeze() {
    const now = this.ctx.currentTime;
    const sequence = [620, 480, 740, 360, 880, 520, 240];
    const stepDuration = 0.045;

    sequence.forEach((freq, i) => {
      const t = now + i * stepDuration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration * 0.95);

      osc.connect(gain);
      gain.connect(this.getSFXDestination());
      osc.start(t);
      osc.stop(t + stepDuration);
    });
  }

  // 'hide': Schowanie się w krzakach Patio - cichy szelest liści
  playHide() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 'sneeze': Kichnięcie w krzakach ("Ap-sik!") zdradzające kryjówkę
  playSneeze() {
    const now = this.ctx.currentTime;

    // Faza 1: "Ap..." (wznoszący wdech)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.linearRampToValueAtTime(680, now + 0.14);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.getSFXDestination());
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Faza 2: "...SIK!" (gwałtowny, wysoki podmuch)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1200, now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 0.38);
    gain2.gain.setValueAtTime(0.35, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(this.getSFXDestination());
    osc2.start(now + 0.16);
    osc2.stop(now + 0.4);
  }

  // 'stun': Ogłuszenie przez Panią z dziekanatu (komiczne "bonk" + vibrato)
  playStun() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.05;
      osc.frequency.setValueAtTime(340 - i * 35 + (i % 2 === 0 ? 30 : -30), t);
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 'hit': faul/przegrana (dramatycznie opadający bas)
  playHit() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.4);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // 'win': triumfalna fanfara zaliczenia sesji z chiptune arpeggiem
  playWin() {
    const now = this.ctx.currentTime;
    const fanfareNotes = [
      { freq: 523.25, duration: 0.12, type: 'triangle' }, // C5
      { freq: 659.25, duration: 0.12, type: 'triangle' }, // E5
      { freq: 783.99, duration: 0.14, type: 'triangle' }, // G5
      { freq: 1046.50, duration: 0.75, type: 'square' }    // C6
    ];

    let offset = 0;
    fanfareNotes.forEach((note) => {
      const startTime = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

      osc.connect(gain);
      gain.connect(this.getSFXDestination());
      osc.start(startTime);
      osc.stop(startTime + note.duration);

      offset += note.duration * 0.92;
    });

    // Dodatkowy kryształowy akord na zakończenie
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.getSFXDestination());
        osc.start(t);
        osc.stop(t + 0.6);
      });
    }, 450);
  }

  // 'event': Sygnał losowego wydarzenia na kampusie (alert retro)
  playEvent() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    osc.frequency.setValueAtTime(440, now + 0.2);
    osc.frequency.setValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // 'heartbeat': Syntetyczne bicie serca (głęboki sub-bas: lub-dub)
  playHeartbeat(distFactor = 0.5) {
    const nowMs = performance.now();
    const intervalMs = 280 + distFactor * 480;
    if (nowMs - this.lastHeartbeatTime < intervalMs) return;
    this.lastHeartbeatTime = nowMs;

    const now = this.ctx.currentTime;
    
    // Lub
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(75, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain1);
    gain1.connect(this.getSFXDestination());
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Dub
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, now + 0.11);
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gain2.gain.setValueAtTime(0.28, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc2.connect(gain2);
    gain2.connect(this.getSFXDestination());
    osc2.start(now + 0.11);
    osc2.stop(now + 0.22);
  }

  // 'achievement': Złota odznaka osiągnięcia - wznosząca arpeggiacja sukcesu
  playAchievement() {
    const now = this.ctx.currentTime;
    const chords = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.getSFXDestination());
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // 'breath': Dyszenie przy niskiej staminie (< 20%) - krótki szum powietrza
  playBreathing() {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBreathingTime < 1100) return;
    this.lastBreathingTime = nowMs;

    this.init();
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Faza wydechu przez filtr dolnoprzepustowy
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSFXDestination());

    source.start(now);
    source.stop(now + 0.4);
  }

  // Pomocniczy dźwięk sprintu (ograniczony do najwyżej raz na 220 ms)
  playSprint() {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSprintTime < 220) return;
    this.lastSprintTime = nowMs;

    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.getSFXDestination());
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

// Eksportujemy singleton
export const soundSystem = new SoundSystem();
export const audio = soundSystem;
