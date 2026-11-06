# 06 Tech Spec

## 1. HTML, CSS, and JavaScript in Three Files

The web application is built in exactly **3** frontend files (plus **1** optional Arduino firmware file `esp32_reaction.ino` for the ESP32-SC microcontroller):

1. **`index.html` (HTML5 Structure):**
   - Contains the semantic game dashboard layout:
     - Top Header Bar with title (`"ESP32 REACTION LAB"`), Connection Control Pill (`"Connect ESP32"`), and Top-Right Personal Best Card (`"PERSONAL BEST"`, `"-- ms"`).
     - Error / System Banner for connection and edge-case alerts.
     - Main Game Arena Card with virtual LED status ring, main status/time readout, quirky comment line, and `"Start Test"` / `"Try Again"` button.
     - Bottom Color Legend Bar showing the 4 color brackets (`"<200ms - Green"`, `"200-300ms - Yellow"`, `"300-400ms - Orange"`, `">400ms - Red"`).
2. **`style.css` (CSS3 Game Dashboard Styling):**
   - Implements the dark-mode professional game dashboard theme, responsive layout, top-right personal best badge, glowing virtual LED indicator, rapid red blink animation for early presses, and color-coded state classes for Green (`#22c55e`), Yellow (`#eab308`), Orange (`#f97316`), and Red (`#ef4444`).
3. **`script.js` (Vanilla ES6+ JavaScript Logic):**
   - Manages the Web Serial API connection (`115200` baud), newline-delimited serial protocol parser (`READY`, `WAITING`, `GO`, `RESULT:<ms>`, `EARLY`, `MISS`), outgoing serial commands (`START\n`, `RESET\n`), Personal Best session comparison, 4-tier color and quirky comment selection, error state transitions, and the **60-minute (3,600,000 ms)** inactivity reset timer.

*(Companion Hardware Firmware: `esp32_reaction.ino` drives GPIO 12 Red, GPIO 13 Green, GPIO 14 Blue, and GPIO 4 Button at 115200 baud.)*

---

## 2. Libraries and Frameworks

- **Framework:** `none` (Pure vanilla HTML5, CSS3, and ES6+ JavaScript).
- **External CSS Libraries:** `none` (All styles and animations are written directly in `style.css`).
- **External JavaScript Libraries:** `none` (Uses the native browser `navigator.serial` Web Serial API and standard DOM APIs).
- **ESP32 Firmware Libraries:** `none` beyond built-in Arduino core (`Arduino.h` / `digitalWrite` / `digitalRead` / `millis`).

---

## 3. What Is Saved and Where

- **After the page closes:** **Nothing (`0` bytes)** is saved. No `localStorage`, no `sessionStorage`, no cookies, no IndexedDB, and no remote database are used.
- **While the page is open:** All state (`personalBestMs`, `lastReactionMs`, `gameState`, `isConnected`, and the 60-minute inactivity timer) is held solely in volatile JavaScript RAM inside `script.js` and resets completely when the browser tab is closed or refreshed.

---

## 4. Do List and Do Not List

### Do List
- **Do** split the web app into exactly three files: `index.html`, `style.css`, and `script.js`.
- **Do** connect to the ESP32-SC over the Web Serial API at **115200** baud.
- **Do** configure the ESP32-SC RGB LED on **GPIO 12** (Red), **GPIO 13** (Green), and **GPIO 14** (Blue), and the button on **GPIO 4** (`INPUT_PULLUP`).
- **Do** wait a random duration between **1000 ms** and **5000 ms** before turning the Green LED (**GPIO 13**) ON.
- **Do** measure the reaction time in **milliseconds** on the ESP32-SC from the instant the Green LED turns ON until the button is pressed, and turn the LED Blue (**GPIO 14**) when pressed in time.
- **Do** color-code the dashboard and show the exact quirky comment for each bracket:
  - `< 200 ms`: Green (`#22c55e`) — `"Lightning reflexes! Are you even human?"`
  - `200–300 ms`: Yellow (`#eab308`) — `"Sharp and speedy! Nice reaction."`
  - `300–400 ms`: Orange (`#f97316`) — `"Not bad, but you could use a coffee."`
  - `> 400 ms`: Red (`#ef4444`) — `"Did you fall asleep? My grandma clicks faster!"`
- **Do** blink the Red LED (**GPIO 12**) rapidly (every **100 ms**) for **2500 ms (2.5 seconds)** and display `"Too early! Wait for the green light."` if the button is pressed before the green light turns on.
- **Do** stop waiting after **5000 ms (5 seconds)** of the green light being ON without a press, turn the Green LED OFF, and display `"You missed it! Try again."`.
- **Do** show the `"Try Again"` button underneath the result after every completed, early, or missed round.
- **Do** display the session's Personal Best score in the top-right corner and auto-reset the session after **60 minutes (3,600,000 ms)** of inactivity.

### Do Not List
- **Do not** add any user login, sign-up, authentication, or account system (nobody logs in).
- **Do not** import any external JavaScript or CSS frameworks, npm packages, or CDN libraries.
- **Do not** save the Personal Best score or any user data to `localStorage`, `sessionStorage`, cookies, or a server.
- **Do not** turn the LED red when a valid button press occurs (red is reserved exclusively for the rapid early-press blink).
- **Do not** leave any RGB LED channel stuck ON if the visitor misses the 5-second window, disconnects, or stays idle for 60 minutes.

