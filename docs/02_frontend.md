# 02 Frontend

## 1. Every Part the Visitor Sees (Each on Its Own)

### Part 1: Top Header Bar — Dashboard Title
- **What it shows (exact words):**
  - Title text: `"ESP32 REACTION LAB"`
  - Subtitle text: `"Hardware-Timed Millisecond Reflex Test"`
- **What the visitor can do with it:**
  - Read-only header; cannot be clicked or edited.

### Part 2: Connection Control Pill (Top-Left / Header Area)
- **What it shows (exact words):**
  - Status dot + Status label when disconnected: `"ESP32: Disconnected"`
  - Status dot + Status label when connected: `"ESP32: Connected (115200 baud)"`
  - Connect button label when disconnected: `"Connect ESP32"`
  - Connect button label when connected: `"Disconnect"`
- **What the visitor can do with it:**
  - Click `"Connect ESP32"` to open the browser Web Serial port picker and connect the ESP32-SC over USB.
  - Click `"Disconnect"` to close the active serial port connection.

### Part 3: Personal Best Card (Top-Right Corner)
- **What it shows (exact words):**
  - Label: `"PERSONAL BEST"`
  - Value before any completed round: `"-- ms"`
  - Value after at least 1 valid round (for example, 215 ms): `"215 ms"`
- **What the visitor can do with it:**
  - Read-only score display in the top-right corner so the visitor can recall their best time during the current session.

### Part 4: Error / System Banner (Top of Main Arena, Hidden When Normal)
- **What it shows (exact words):**
  - Hidden by default (`""`).
  - When browser does not support Web Serial: `"Web Serial is not supported in this browser. Open this page in Chrome or Edge."`
  - When visitor cancels the serial port picker: `"Connection cancelled. Click Connect ESP32 to select your board."`
  - When a second tab/person tries to open the port: `"Device busy in another tab."`
  - When USB cable is unplugged or connection drops: `"ESP32 disconnected. Reconnect USB and click Connect ESP32."`
  - When 60 minutes pass with no activity: `"Session reset after 60 minutes of inactivity."`
- **What the visitor can do with it:**
  - Read the exact error message and use the `"Connect ESP32"` or `"Start Test"` button to recover.

### Part 5: Main Game Arena Card — Virtual LED Ring & Status Indicator
- **What it shows (exact words):**
  - Before starting (Idle state): `"Press Start Test to begin"`
  - Waiting for random 1–5s delay (Armed state): `"Wait for the green light on your ESP32..."`
  - Green LED is ON (Stimulus state): `"PRESS THE BUTTON NOW!"`
  - Early press state: `"Too early! Wait for the green light."`
  - Missed 5-second window state: `"You missed it! Try again."`
  - Completed reaction test state (shows measured time in milliseconds, e.g.): `"242 ms"`
- **What the visitor can do with it:**
  - View the real-time state, measured reaction time, and color-coded glow matching the outcome.

### Part 6: Quirky Comment Line (Inside Main Game Arena Card, Below Main Time/Message)
- **What it shows (exact words):**
  - Before starting (Idle state): `"Connect your ESP32-SC and test your reflexes."`
  - Waiting for green light: `"Keep your finger ready on the ESP32 button (GPIO 4)..."`
  - While green light is ON: `"Timer running! Hit the physical button on the ESP32!"`
  - Result `< 200 ms` (`1–199 ms`, Green `#22c55e`): `"Lightning reflexes! Are you even human?"`
  - Result `200–300 ms` (`200–300 ms`, Yellow `#eab308`): `"Sharp and speedy! Nice reaction."`
  - Result `300–400 ms` (`301–400 ms`, Orange `#f97316`): `"Not bad, but you could use a coffee."`
  - Result `> 400 ms` (`401–5000 ms`, Red `#ef4444`): `"Did you fall asleep? My grandma clicks faster!"`
  - On early press: `"Red LED blinking rapidly — don't jump the gun!"`
  - On missed press (5s timeout): `"5 seconds passed without a button press."`
- **What the visitor can do with it:**
  - Read-only feedback line underneath the main time/status text.

### Part 7: Primary Action Button (`"Start Test"` / `"Try Again"`)
- **What it shows (exact words):**
  - Initial screen before a test runs: `"Start Test"`
  - While waiting for green light or while green light is active: Hidden / disabled so the visitor uses the physical ESP32 button.
  - After a valid reaction time, an early press, or a missed 5s timeout: `"Try Again"`
- **What the visitor can do with it:**
  - Click `"Start Test"` on the initial screen to begin a reaction test round.
  - Click `"Try Again"` after any outcome (valid press, early press, or missed press) to reset the round and start again.

### Part 8: Color Legend Bar (Bottom of Dashboard)
- **What it shows (exact words):**
  - Pill 1 (Green `#22c55e`): `"<200ms - Green"`
  - Pill 2 (Yellow `#eab308`): `"200-300ms - Yellow"`
  - Pill 3 (Orange `#f97316`): `"300-400ms - Orange"`
  - Pill 4 (Red `#ef4444`): `">400ms - Red"`
- **What the visitor can do with it:**
  - Read-only color legend explaining the 4 dashboard performance brackets. When a round completes, the matching bracket pill highlights.

---

## 2. The Screen Before Anyone Does Anything

When the page first loads and nobody has clicked anything yet:
1. **Top Header Bar:** Displays `"ESP32 REACTION LAB"` and subtitle `"Hardware-Timed Millisecond Reflex Test"`.
2. **Connection Control Pill:** Shows a gray dot with `"ESP32: Disconnected"` and an active `"Connect ESP32"` button.
3. **Personal Best Card (Top Right):** Shows `"PERSONAL BEST"` and `"-- ms"`.
4. **Error Banner:** Hidden.
5. **Main Game Arena Card:** Neutral dark slate styling (`#1e293b`), virtual LED indicator is off, main heading reads `"Press Start Test to begin"`, and the quirky comment line reads `"Connect your ESP32-SC and test your reflexes."`.
6. **Primary Action Button:** Visible and labeled `"Start Test"`, underneath the main message.
7. **Color Legend Bar:** Shows all 4 color pills (`"<200ms - Green"`, `"200-300ms - Yellow"`, `"300-400ms - Orange"`, `">400ms - Red"`) in their resting unhighlighted state.
8. **Physical ESP32-SC RGB LED (GPIO 12, 13, 14):** All 3 channels are OFF.

---

## 3. What Changes After Each Action

### Action A: Visitor clicks `"Connect ESP32"` and selects the USB port
- **Connection Control Pill:** Changes from `"ESP32: Disconnected"` to `"ESP32: Connected (115200 baud)"` with a green status dot, and button text changes to `"Disconnect"`.
- **Error Banner:** Hides if any warning was previously visible.
- **ESP32-SC Hardware:** Receives `"RESET\n"` over serial and ensures GPIO 12, 13, and 14 are OFF.

### Action B: Visitor clicks `"Start Test"` (or `"Try Again"` after a round)
- **If not connected to ESP32 yet:** Prompts the Web Serial port selector first (or shows connection error if cancelled).
- **Once connected:**
  - Browser sends `"START\n"` to the ESP32-SC.
  - **Main Game Arena Card:** Border and indicator change to amber/waiting mode; main text changes to `"Wait for the green light on your ESP32..."`; subtext changes to `"Keep your finger ready on the ESP32 button (GPIO 4)..."`.
  - **Primary Action Button (`"Start Test"` / `"Try Again"`):** Hides while the round is active.
  - **Color Legend Bar:** Clears any active highlight from the previous round.
  - **ESP32-SC Hardware:** Starts a random countdown between **1000 ms** and **5000 ms** with all LED pins OFF.

### Action C: Random 1–5s timer finishes on the ESP32-SC (Green LED turns ON)
- **ESP32-SC Hardware:** Turns **GPIO 13 (Green)** HIGH, starts its internal millisecond timer (`millis()`), and sends `"GO\n"` to the webpage.
- **Main Game Arena Card:** Glows bright green; main text changes to `"PRESS THE BUTTON NOW!"`; subtext changes to `"Timer running! Hit the physical button on the ESP32!"`.

### Action D: Visitor presses the physical ESP32 button (GPIO 4) WHILE the green light is ON (within 5000 ms)
- **ESP32-SC Hardware:** Stops the internal timer, calculates elapsed milliseconds `T`, turns **GPIO 13 (Green)** LOW, turns **GPIO 14 (Blue)** HIGH for **1000 ms**, and sends `"RESULT:<T>\n"` (e.g., `"RESULT:184\n"`) to the webpage.
- **Main Game Arena Card:**
  - Main text changes to `"<T> ms"` (e.g., `"184 ms"`).
  - Card accent color, time color, and matching Color Legend pill change to:
    - **Green (`#22c55e`)** if `T < 200`, with quirky comment `"Lightning reflexes! Are you even human?"`
    - **Yellow (`#eab308`)** if `200 <= T <= 300`, with quirky comment `"Sharp and speedy! Nice reaction."`
    - **Orange (`#f97316`)** if `301 <= T <= 400`, with quirky comment `"Not bad, but you could use a coffee."`
    - **Red (`#ef4444`)** if `T > 400`, with quirky comment `"Did you fall asleep? My grandma clicks faster!"`
- **Personal Best Card (Top Right):** If `personalBest` is `null` or `T < personalBest`, updates to `"<T> ms"` with a brief highlight pulse.
- **Primary Action Button:** Appears underneath the quirky comment with the exact label `"Try Again"`.

### Action E: Visitor presses the physical ESP32 button (GPIO 4) BEFORE the green light turns ON
- **ESP32-SC Hardware:** Cancels the random wait timer, sends `"EARLY\n"` to the webpage, and blinks **GPIO 12 (Red)** rapidly (100 ms ON / 100 ms OFF) for **2500 ms (2.5 seconds)** before turning all LED pins OFF.
- **Main Game Arena Card:** Flashes red (`#ef4444`); main text changes to `"Too early! Wait for the green light."`; quirky comment line changes to `"Red LED blinking rapidly — don't jump the gun!"`.
- **Personal Best Card (Top Right):** Unchanged.
- **Primary Action Button:** Appears underneath with the exact label `"Try Again"`.

### Action F: Visitor does NOT press the physical ESP32 button within 5000 ms of the green light turning ON
- **ESP32-SC Hardware:** At **5000 ms**, turns **GPIO 13 (Green)** LOW and sends `"MISS\n"` to the webpage.
- **Main Game Arena Card:** Changes to red/muted timeout styling; main text changes to `"You missed it! Try again."`; quirky comment line changes to `"5 seconds passed without a button press."`.
- **Personal Best Card (Top Right):** Unchanged.
- **Primary Action Button:** Appears underneath with the exact label `"Try Again"`.

