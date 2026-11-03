# 🎓 Kozminski Escape: Polowanie na ECTS

> Zaawansowana, retro-arcade gra przeglądarkowa 2D osadzona w realiach kampusu **Akademii Leona Koźmińskiego (ALK)** w Warszawie (ul. Jagiellońska 57/59).

---

## 📖 Fabuła i Cel Gry (Lore ALK)

Sesja na Koźmińskim osiągnęła punkt kulminacyjny. Gracz wciela się w studenta uciekającego korytarzami uczelni, aulami specjalnymi i przez zielone **Patio ALK** przed bezwzględnym **Egzaminatorem z czerwonym długopisem**, **Prowadzącym ćwiczenia** oraz **Panią z Dziekanatu**.

- **Główny cel**: Zgromadzenie **30 punktów ECTS**, a następnie pomyślne zdanie dramatycznego finału – **Egzaminu ustnego** w Dziekanacie i odbiór zaliczenia lub Dyplomu ALK.
- **Zagrożenie**: Złapanie przez egzaminatora lub prowadzącego oznacza natychmiastową ocenę niedostateczną i bolesną **„Kampanię Wrześniową”**!

---

## 🗺️ Kampus i Mechaniki Sal

Każdy z 4 głównych budynków posiada **dwa niezależne wyjścia o szerokości $\ge 48\text{ px}$** (jedno ku Patio, drugie ku korytarzom bocznym), co gwarantuje pełną ciągłość ruchu i **brak jakichkolwiek ślepych zaułków**.

| Sala / Strefa | Funkcja Specjalna w Grze |
| :--- | :--- |
| **🏛️ Aula A** | **Strefa Egzaminacyjna**: co 20 sekund pojawia się tu unikalne **Złote ECTS (+3 pkt)**, które znika po 5 sekundach (miga przed despawnem). |
| **📋 Dziekanat** | **Strefa Formalności & Kolejka**: stanie bez ruchu przez **3 sekundy** (okrągły wskaźnik nad głową) nagradza **Podaniem o przedłużenie**, które resetuje prędkość profesora do bazy na 15 sekund (cooldown: 30 s). |
| **📚 Biblioteka** | **Strefa Ciszy**: zakaz sprintu (pasek staminy szarzeje). Przeciwnicy znajdujący się poza Biblioteką i dalej niż 120 px **tracą studenta z radaru**. |
| **💻 Lab Komputerowy** | **AI Hub**: **60% spawnów Gemini AI** pojawia się bezpośrednio w tej sali. |
| **🌿 Patio ALK** | **Zielone Schronienie**: 4 krzaki służą jako kryjówki. Wejście gdy przeciwnik jest dalej niż 150 px ukrywa gracza. **Po 5 sekundach student kicha („Apsik!”)**, zdradzając swoją pozycję (cooldown krzaka: 10 s). |

---

## 👨‍🏫 Przeciwnicy (Sztuczna Inteligencja & Wyszukiwanie Ścieżki BFS)

Pościg realizowany jest w oparciu o siatkę **20×20 px** i ciągłe przeliczanie najkrótszej drogi algorytmem **BFS (Breadth-First Search)** co 300 ms, dzięki czemu przeciwnicy nigdy nie blokują się na ścianach, filarach ani w drzwiach.

1. **👨‍🏫 Prof. Egzaminator**:
   - Przyspiesza z każdym zdobytym ECTS.
   - Posiada pozycję studenta, chyba że gracz jest ukryty (krzak lub stealth w Bibliotece) – wówczas sprawdza ostatnią znaną pozycję i aule.
   - Wejście w **Szał (+40% prędkości)** po zebraniu przez studenta Ściągi!
2. **🧑‍🏫 Prowadzący ćwiczenia**:
   - Spawnuje się przy 10 ECTS (Semestr I), 5 ECTS (Semestr II) lub od startu (Semestr III) w najdalszym wyjściu.
   - Nie goni w linii prostej – celuje **4 pola (80 px) przed studentem**, odcinając drogę ucieczki!
   - Prędkość: 85% prędkości egzaminatora. Złapanie kończy grę (chyba że chroni Legitymacja).
3. **👩‍💼 Pani z Dziekanatu**:
   - Dołącza przy 20 ECTS (Semestr I), 15 ECTS (Semestr II) lub od startu (Semestr III).
   - Patroluje obwód Patio ze stałą prędkością 1.6 px/klatkę.
   - Kontakt **ogłusza studenta na 2 sekundy** (paraliż ruchu + komiczne gwiazdki), po czym zapewnia 3 sekundy nietykalności.

*Każda postać posiada własny, komiksowy, półprzezroczysty dymek z wypowiedziami akademickimi, który płynnie podąża za jej pozycją i respektuje przełącznik wyciszenia `💬`.*

---

## 🎒 Przedmioty (Risk & Reward)

- 📜 **ECTS (+1 pkt)** – standardowy punkt zaliczeniowy (cel: 30 ECTS).
- 🌟 **Złote ECTS (+3 pkt)** – pojawia się w Auli A, trwa 5 sekund, krystaliczny dźwięk arpeggio.
- 📝 **Ściąga (+3 pkt, Duże Ryzyko!)** – daje natychmiast 3 ECTS, ale wprowadza profesora w **5-sekundowy szał (+40% prędkości, czerwona poświata, ignoruje tarczę legitymacji!)**.
- ☕ **Kawa z Patio ALK** – turbo-przyspieszenie i odnowienie energii. Działa zgodnie z zasadą mikroekonomii: **malejąca użyteczność krańcowa** (1. kubek = 5 s, 2. = 4 s, 3. = 3 s, kolejne = min. 2 s).
- 💻 **Gemini AI** – cybernetyczny paraliż zamrażający **wszystkich przeciwników** na 3.5 sekundy.
- 🪪 **Legitymacja ALK** – tarcza absorbująca 1 uderzenie i odpychająca rywala.

---

## ⚡ Wydarzenia Losowe na Kampusie (Events Engine)

Pierwsze zdarzenie następuje po 25 sekundach, a kolejne co 30–45 sekund (czas trwania: 10 sekund) z powiadomieniem w górnym bannerze i sygnałem retro:
1. **Awaria prądu**: plansza spowita mrokiem, widoczny jedynie snop latarki o promieniu 110 px wokół studenta oraz groźne, czerwone oczy polujących wykładowców.
2. **Przerwa między zajęciami**: 7 spacerujących studentów-NPC pojawia się w korytarzach; zderzenie spowalnia gracza o 50% na 1 sekundę.
3. **Wejściówka**: przez 10 sekund wszystkie zebrane punkty ECTS (zwykłe i złote) liczą się **podwójnie**!

---

## 🎓 Semestry, Oceny & Osiągnięcia

### System Semestrów:
- **Semestr I**: standardowy rytm sesji letniej.
- **Semestr II**: krótsze interwały wydarzeń, szybsze pojawienie się Prowadzącego (5 ECTS) i Dziekanatu (15 ECTS).
- **Semestr III („Sesja poprawkowa”)**: wszyscy wrogowie na mapie od 1 sekundy, egzaminator o 15% szybszy. Zwycięstwo nagradzane prestiżowym **Dyplomem ALK**!

### Skala Ocen:
- $\le \text{2:00}$ $\rightarrow$ **5.0 (Bardzo dobry)**
- $\le \text{2:30}$ $\rightarrow$ **4.5 (Dobry plus)**
- $\le \text{3:00}$ $\rightarrow$ **4.0 (Dobry)**
- $\le \text{4:00}$ $\rightarrow$ **3.5 (Dostateczny plus)**
- $> \text{4:00}$ $\rightarrow$ **3.0 (Dostateczny)**

*Najlepsze czasy i oceny są trwale zapisywane w `localStorage` (Kozminski Hall of Fame).*

### Odznaki Osiągnięć:
- 🚶‍♂️ **Bez sprintu** – wygraj semestr bez użycia biegu.
- 📚 **Analogowo** – zdaj bez pomocy Gemini AI.
- 🌿 **Ninja z Patio** – schowaj się w krzakach co najmniej 5 razy w 1 grze.
- 🌟 **Kujon** – zdobądź 3 Złote ECTS w jednej rozgrywce.
- 📝 **Ryzykant** – zaryzykuj zebranie przynajmniej 2 ściąg.

---

## 📝 Finał: Egzamin Ustny w Dziekanacie

Po zgromadzeniu 30 ECTS rozgrywka przechodzi w tryb wielkiego finału (Egzamin ustny):
- **Czas na dobiegnięcie**: 25 sekund (w Semestrze III „Sesja poprawkowa”: 20 sekund) na zaniesienie indeksu do Dziekanatu.
- **Punkt docelowy**: Pulsujące złote okienko „ODDAJ INDEKS” przy ladzie obsługi w Dziekanacie, wskazywane przez dynamiczną złotą strzałkę nad studentem.
- **Maksymalna presja**: Wszyscy przeciwnicy natychmiast pojawiają się na kampusie, Egzaminator zyskuje +15% prędkości, muzyka 8-bit gra na najwyższych obrotach (140 BPM, werbel), a brzegi ekranu otacza czerwona winieta.
- **Obrona Dziekanatu**: Pani z Dziekanatu patroluje ciasny obchód wejścia do Dziekanatu, utrudniając dojście do lady bez blokowania celu.
- **Sukces i Nagroda**: Dotarcie do celu przed czasem nagradzane jest premią **+1000 pkt** do wyniku, zaliczeniem sesji i wpisem do Kozminski Hall of Fame. Przekroczenie czasu zamyka Dziekanat i kończy grę porażką!

---

## 🎵 Moduł Audio (100% Web Audio API)

Żadnych zewnętrznych plików `.mp3` czy `.wav`. Dźwięki są syntetyzowane w czasie rzeczywistym z dwoma niezależnymi torami wzmocnienia (`musicGain` oraz `sfxGain`):
- **Dynamiczna muzyka 8-bit chiptune**: bas (fala trójkątna), arpeggia (fala prostokątna 25%), perkusja szumowa, płynne przejścia 110–140 BPM.
- **Bicie serca (`heartbeat`)**: sub-basowy puls przyspieszający proporcjonalnie do bliskości profesora (< 200 px).
- **Trzęsienie kamery (`screen-shake`)**: wibracja ekranu przy bezpośrednim zagrożeniu (< 80 px) z możliwością wyłączenia w Ustawieniach.
- **Sygnały odliczania**: retro piknięcia `countdown_beep` i wysoki akord startu `countdown_start`.
- Dźwięki dwutonu ECTS, fanfara wygranej, kichnięcie (`sneeze`), komiczne ogłuszenie (`stun`), arpeggia złota i osiągnięć.

---

## ⚙️ Menu, Samouczek, Ustawienia i Gwiazdki (Etap 4)

- **Uporządkowany Ekran Startowy**: Elegancki tytuł z przesuwającym się złotym połyskiem, wybór semestru na górze, zwięzły opis fabularny, tabela **Kozminski Hall of Fame** (Czas, Ocena, Wynik), zwijana legenda przedmiotów i sterowania oraz pulsujący przycisk „Rozpocznij sesję”.
- **Interaktywny Samouczek**: 4 plansze z prezentacją mechanik (ruch/sprint, cel 30 ECTS i ucieczka, przedmioty specjalne, finał w Dziekanacie). Uruchamia się automatycznie przy pierwszej wizycie (`localStorage: kozminski_tutorial_seen`) oraz na żądanie przyciskiem **❓ Jak grać**.
- **Odliczanie przed sesją**: Animowane „3… 2… 1… START!” (~2,5 s) z zamrożonymi postaciami i wstrzymanym czasem sesji.
- **Panel Ustawień (⚙️)**: Osobna regulacja głośności Muzyki (0–100%) i Efektów SFX (0–100%), przełącznik wstrząsów kamery oraz wypowiedzi postaci. Zapisywane trwale w `localStorage`.
- **System Pauzy (<kbd>P</kbd> / <kbd>Escape</kbd>)**: Przejrzyste okno z opcjami wznowienia gry, przejścia do ustawień lub powrotu do Menu startowego.
- **Ocena Gwiazdkowa (1–3 ★)**:
  - 0 ★ – porażka (skreślenie z listy studentów),
  - 1 ★ – zdanie semestru z podstawowym wynikiem (< 4000 pkt),
  - 2 ★ – wysoki wynik ($\ge 4000\text{ pkt}$),
  - 3 ★ – absolutna perfekcja ($\ge 7000\text{ pkt}$ ORAZ ocena 5.0).
- **Przycisk 🏠 Menu**: Dostępny na ekranie pauzy, porażki i wygranej, umożliwiający czysty powrót do ekranu startowego.

---

## 🎮 Sterowanie

- **PC**:
  - <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> lub <kbd>Strzałki</kbd> – poruszanie się po kampusie,
  - <kbd>Shift</kbd> / <kbd>Spacja</kbd> – sprint (zużywa staminę),
  - <kbd>P</kbd> lub <kbd>Escape</kbd> – pauza i menu gry / zamknięcie aktywnego okna.
- **Mobile**: Wirtualny ekranowy **D-pad** i okrągły przycisk **BIEG**.
- **Pasek narzędzi**:
  - ⚙️ Ustawienia głośności i efektów,
  - 🔊 Szybkie wyciszenie master audio,
  - 💬 Przełącznik komiksowych dymków postaci,
  - ℹ️ Informacje o przeciwnikach.
