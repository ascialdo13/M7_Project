# 05 Error States

## 1. Things That Can Go Wrong

### Error 1: Visitor presses the physical button before the green light turns on (Early Press)
- **Exact message:**
  - Main Arena Heading: `"Too early! Wait for the green light."`
  - Quirky Comment Line: `"Red LED blinking rapidly — don't jump the gun!"`
- **Where it shows:** Inside the center Main Game Arena Card (Part 5 and Part 6).
- **What the system does meanwhile:**
  - The ESP32-SC immediately aborts the 1000–5000 ms countdown so the green LED never turns on.
  - The ESP32-SC blinks the Red LED channel (**GPIO 12**) rapidly every **100 ms** (**5 Hz**) for **2500 ms (2.5 seconds)** while keeping Green (**GPIO 13**) and Blue (**GPIO 14**) OFF, then turns Red OFF.
  - The Personal Best score is not modified.
- **How it gets back to normal:**
  - The `"Try Again"` button appears immediately underneath the message. Clicking `"Try Again"` clears the red error state and starts a fresh 1000–5000 ms countdown.

### Error 2: Visitor does not press the button within 5 seconds of the green light turning on (Missed Press / Timeout)
- **Exact message:**
  - Main Arena Heading: `"You missed it! Try again."`
  - Quirky Comment Line: `"5 seconds passed without a button press."`
- **Where it shows:** Inside the center Main Game Arena Card (Part 5 and Part 6).
- **What the system does meanwhile:**
  - At **5000 ms** after `"GO\n"`, the ESP32-SC turns the Green LED (**GPIO 13**) OFF, stops the internal timer, sends `"MISS\n"`, and returns to `STATE_IDLE`.
  - The Personal Best score is not modified.
- **How it gets back to normal:**
  - The `"Try Again"` button appears underneath the message. Clicking `"Try Again"` resets the arena and starts a new test round.

### Error 3: USB cable unplugged or ESP32-SC loses power mid-session
- **Exact message:**
  - `"ESP32 disconnected. Reconnect USB and click Connect ESP32."`
- **Where it shows:** In the top Error / System Banner (Part 4), while the Connection Control Pill (Part 2) changes to `"ESP32: Disconnected"`.
- **What the system does meanwhile:**
  - The browser's Web Serial `disconnect` event handler closes the broken reader/writer streams, cancels any active round on the UI, resets `gameState` to `"IDLE"`, shows `"Press Start Test to begin"` in the Main Game Arena Card, and preserves the session's `personalBestMs` in memory.
- **How it gets back to normal:**
  - The visitor plugs the ESP32-SC USB cable back in and clicks `"Connect ESP32"` in the top header bar. Once connected, the error banner disappears and `"Start Test"` is ready.

### Error 4: Browser does not support the Web Serial API (e.g., Firefox or Safari)
- **Exact message:**
  - `"Web Serial is not supported in this browser. Open this page in Chrome or Edge."`
- **Where it shows:** In the top Error / System Banner (Part 4) immediately on page load or when clicking `"Connect ESP32"`.
- **What the system does meanwhile:**
  - Disables the serial connection attempt and keeps `gameState` in `"IDLE"`.
- **How it gets back to normal:**
  - The visitor opens the page in Google Chrome or Microsoft Edge (version 89+) where `navigator.serial` is available.

### Error 5: Visitor closes or cancels the browser USB port chooser dialog
- **Exact message:**
  - `"Connection cancelled. Click Connect ESP32 to select your board."`
- **Where it shows:** In the top Error / System Banner (Part 4).
- **What the system does meanwhile:**
  - Keeps `isConnected = false` and `gameState = "IDLE"` without crashing or starting a round.
- **How it gets back to normal:**
  - The visitor clicks `"Connect ESP32"` again and selects the ESP32-SC port from the browser list.

---

## 2. Edge Cases

### Edge Case 1: Two people at once (Two browser tabs or two visitors trying to use the ESP32-SC simultaneously)
- **Exact message:**
  - `"Device busy in another tab."`
- **Where it shows:** In the top Error / System Banner (Part 4) of the second tab/visitor when they click `"Connect ESP32"` and select the already-open serial port.
- **What the system does meanwhile:**
  - The operating system and Web Serial API enforce an exclusive hardware lock on the USB serial port for the first connected tab (`NetworkError` / `InvalidStateError` when opening an already locked port).
  - The first tab continues running normally without interruption; the second tab remains in `isConnected = false` and `gameState = "IDLE"`.
- **How it gets back to normal:**
  - When the first tab clicks `"Disconnect"` or closes its tab, the OS releases the USB serial lock. The second visitor can then click `"Connect ESP32"` to claim the board.

### Edge Case 2: Someone who never leaves (Visitor completes or abandons a round and leaves the tab open indefinitely)
- **Exact message:**
  - `"Session reset after 60 minutes of inactivity."`
- **Where it shows:** In the top Error / System Banner (Part 4).
- **What the system does meanwhile:**
  - If a round is in progress (`STATE_ACTIVE`), the ESP32-SC automatically turns the Green LED (**GPIO 13**) OFF after **5000 ms** and returns to `STATE_IDLE` so the LED never stays stuck ON.
  - Meanwhile, the browser tracks the last user interaction timestamp. After **60 minutes (3,600,000 ms)** with no clicks or button presses, the browser sends `"RESET\n"` to the ESP32-SC and returns the screen to `"Press Start Test to begin"`.
- **How it gets back to normal:**
  - As soon as the visitor (or the next visitor at the station) clicks `"Start Test"` or `"Try Again"`, the inactivity banner clears and a new round starts immediately.

### Edge Case 3: Nothing for an hour (60 minutes of total inactivity while idle or connected)
- **Exact message:**
  - `"Session reset after 60 minutes of inactivity."`
- **Where it shows:** In the top Error / System Banner (Part 4).
- **What the system does meanwhile:**
  - The **3,600,000 ms (60-minute)** inactivity timer in `script.js` fires, sends `"RESET\n"` to the ESP32-SC to ensure all 3 RGB pins (**GPIO 12, 13, 14**) are `LOW`, clears any previous round display back to `"Press Start Test to begin"`, and restarts the 60-minute watchdog.
- **How it gets back to normal:**
  - Clicking `"Start Test"` hides the banner and begins a new 1000–5000 ms reaction test round.

