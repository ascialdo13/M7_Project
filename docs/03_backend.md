# 03 Backend

Nobody logs in.

## 1. What Runs Out of Sight, in Order

The backend consists of the out-of-sight state controller in the browser (`script.js` Web Serial stream handler and timers) working in lockstep with the real-time firmware loop on the **ESP32-SC** (`esp32_reaction.ino`).

1. **Hardware Boot & Pin Initialization (ESP32-SC `setup()`):**
   - Configures serial communication over USB at **115200** baud.
   - Configures **GPIO 12** (Red LED), **GPIO 13** (Green LED), and **GPIO 14** (Blue LED) as digital `OUTPUT` pins and sets all 3 pins to `LOW` (`0`).
   - Configures **GPIO 4** (Push Button) as `INPUT_PULLUP` (resting state `HIGH`, pressed state `LOW`).
   - Seeds the hardware random number generator using `esp_random()`.
   - Sends `"READY\n"` over USB serial.

2. **Web Serial Handshake & Stream Pipeline (Browser `script.js`):**
   - When the visitor clicks `"Connect ESP32"`, the browser calls `navigator.serial.requestPort()` and opens the port at `{ baudRate: 115200 }`.
   - Starts an asynchronous line reader loop that buffers incoming UTF-8 chunks and splits on newline (`\n`), plus a UTF-8 writer for sending commands.
   - Sends `"RESET\n"` to guarantee the ESP32-SC starts in the `IDLE` state with all LEDs off.
   - Starts the **60-minute (3,600,000 ms)** inactivity watchdog timer in the browser, which resets whenever a command or serial event occurs.

3. **Round Arming & Random Delay Generation:**
   - When the visitor clicks `"Start Test"` or `"Try Again"`, the browser resets the 60-minute inactivity timer, sets `gameState` to `"WAITING"`, and sends `"START\n"` over USB serial.
   - Upon receiving `"START\n"`, the ESP32-SC turns all 3 RGB pins `LOW`, records `waitStartMs = millis()`, generates a random delay `randomDelayMs = random(1000, 5001)` (between **1000 ms** and **5000 ms** inclusive), sets its internal firmware state to `STATE_WAITING`, and replies `"WAITING\n"`.

4. **Early-Press Detection Loop (During the 1000–5000 ms Random Wait):**
   - On every iteration of `loop()`, while in `STATE_WAITING`, the ESP32-SC reads `digitalRead(4)` with a **20 ms** debounce check.
   - If the button is pressed (`LOW`) before `millis() - waitStartMs >= randomDelayMs`:
     - The ESP32-SC cancels the wait, transitions to `STATE_EARLY_BLINK`, records `blinkStartMs = millis()`, and immediately sends `"EARLY\n"` to the browser.
     - For the next **2500 ms (2.5 seconds)**, the ESP32-SC toggles **GPIO 12 (Red)** every **100 ms** (`HIGH` for 100 ms, `LOW` for 100 ms) while keeping **GPIO 13** and **GPIO 14** `LOW`.
     - After **2500 ms**, the ESP32-SC sets **GPIO 12** `LOW` and returns to `STATE_IDLE`.

5. **Stimulus Activation & Internal Reaction Timer Start:**
   - When `millis() - waitStartMs >= randomDelayMs` without an early press, the ESP32-SC sets **GPIO 13 (Green)** `HIGH` (and **GPIO 12**, **GPIO 14** `LOW`), captures the exact timestamp `stimulusStartMs = millis()`, transitions to `STATE_ACTIVE`, and sends `"GO\n"` to the browser.

6. **Button Capture or 5000 ms Timeout Evaluation:**
   - While in `STATE_ACTIVE`, on every pass of `loop()`:
     - **Case A — Button Pressed in Time:** If `digitalRead(4) == LOW` (debounced **20 ms**) and `millis() - stimulusStartMs <= 5000`:
       - Calculates `reactionTimeMs = millis() - stimulusStartMs` (clamped to a minimum of `1 ms`).
       - Sets **GPIO 13 (Green)** `LOW` and sets **GPIO 14 (Blue)** `HIGH` for **1000 ms** to confirm the press visually.
       - Sends `"RESULT:" + reactionTimeMs + "\n"` (for example, `"RESULT:218\n"`) over USB serial to the browser.
       - Transitions to `STATE_BLUE_HOLD` for **1000 ms**, then turns **GPIO 14** `LOW` and enters `STATE_IDLE`.
     - **Case B — 5000 ms Timeout Elapsed:** If `millis() - stimulusStartMs > 5000` with no button press:
       - Sets **GPIO 13 (Green)** `LOW`.
       - Sends `"MISS\n"` over USB serial to the browser.
       - Transitions immediately to `STATE_IDLE`.

7. **Browser Score Processing & Session Update:**
   - When the browser receives `"RESULT:<ms>"`, it parses the integer `reactionTimeMs`, classifies it into 1 of the 4 color brackets (`<200`, `200–300`, `301–400`, `>400`), updates `personalBestMs` in memory if `personalBestMs === null || reactionTimeMs < personalBestMs`, and renders the result and the `"Try Again"` button.

8. **Idle Cleanup (60 Minutes of Inactivity):**
   - If **3,600,000 ms (60 minutes)** pass without any user click or serial event, the browser sends `"RESET\n"` to the ESP32-SC, turns all LEDs off, and returns the UI to the initial start screen.

---

## 2. Each Message, With Who Sends It and Who Receives It

All messages travel over the USB Web Serial connection at **115200** baud as newline-terminated ASCII strings (`\n`):

| Exact Message | Sender | Receiver | Meaning & Trigger |
| :--- | :--- | :--- | :--- |
| `"READY\n"` | ESP32-SC | Browser (`script.js`) | Sent once when the ESP32-SC boots or finishes a hardware reset. |
| `"START\n"` | Browser (`script.js`) | ESP32-SC | Sent when the visitor clicks `"Start Test"` or `"Try Again"` to begin a new round. |
| `"RESET\n"` | Browser (`script.js`) | ESP32-SC | Sent on initial connect, disconnect cleanup, or after 60 minutes of inactivity to abort any timer and turn GPIO 12, 13, 14 OFF. |
| `"WAITING\n"` | ESP32-SC | Browser (`script.js`) | Sent immediately after receiving `"START\n"` to confirm the 1000–5000 ms random countdown has started with LEDs OFF. |
| `"GO\n"` | ESP32-SC | Browser (`script.js`) | Sent at the exact millisecond GPIO 13 (Green LED) turns ON and the internal timer starts. |
| `"RESULT:<ms>\n"` (e.g. `"RESULT:192\n"`) | ESP32-SC | Browser (`script.js`) | Sent when the button on GPIO 4 is pressed while the green LED is ON; `<ms>` is the integer reaction time from `1` to `5000`. |
| `"EARLY\n"` | ESP32-SC | Browser (`script.js`) | Sent when the button on GPIO 4 is pressed before the 1000–5000 ms random wait ends; triggers 2500 ms rapid red blinking on GPIO 12. |
| `"MISS\n"` | ESP32-SC | Browser (`script.js`) | Sent when 5000 ms elapse after `"GO\n"` without the button on GPIO 4 being pressed. |

---

## 3. Each Thing It Remembers

| Name | Where It Lives | Kind of Value (Type) | What It Starts As | Kept After the Page Closes? |
| :--- | :--- | :--- | :--- | :--- |
| `isConnected` | Browser RAM (`script.js`) | Boolean | `false` | No |
| `gameState` | Browser RAM (`script.js`) | String (`"IDLE"`, `"WAITING"`, `"GO"`, `"RESULT"`, `"EARLY"`, `"MISS"`) | `"IDLE"` | No |
| `lastReactionMs` | Browser RAM (`script.js`) | Integer (milliseconds) or `null` | `null` | No |
| `personalBestMs` | Browser RAM (`script.js`) | Integer (milliseconds) or `null` | `null` | No |
| `inactivityTimerId` | Browser RAM (`script.js`) | Integer (timer handle) or `null` | `null` | No |
| `serialBuffer` | Browser RAM (`script.js`) | String | `""` | No |
| `firmwareState` | ESP32-SC RAM (`esp32_reaction.ino`) | Integer enum (`0=IDLE`, `1=WAITING`, `2=ACTIVE`, `3=EARLY_BLINK`, `4=BLUE_HOLD`) | `0` (`STATE_IDLE`) | No |
| `randomDelayMs` | ESP32-SC RAM (`esp32_reaction.ino`) | Unsigned 32-bit integer (`uint32_t`, ms) | `0` | No |
| `waitStartMs` | ESP32-SC RAM (`esp32_reaction.ino`) | Unsigned 32-bit integer (`uint32_t`, ms) | `0` | No |
| `stimulusStartMs` | ESP32-SC RAM (`esp32_reaction.ino`) | Unsigned 32-bit integer (`uint32_t`, ms) | `0` | No |
| `blinkStartMs` | ESP32-SC RAM (`esp32_reaction.ino`) | Unsigned 32-bit integer (`uint32_t`, ms) | `0` | No |
| `lastButtonChangeMs` | ESP32-SC RAM (`esp32_reaction.ino`) | Unsigned 32-bit integer (`uint32_t`, ms) | `0` | No |

