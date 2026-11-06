# 01 Overview

## Original Overview & Clarified Answers

A reaction test website is used to test how fast someone can react to a visual stimulus. When the light on the ESP32 lights up, the user must press the button as quickly as possible. It measures the reaction time in milliseconds and sends the result to the webpage in real time. The user will press a "Start Test" button on the webpage. The light will light up at any random time between 1 to 5 seconds. When the LED turns on, an internal timer starts and stops when the button is pressed. If the button is pressed, it shows the time on the screen and has a quirky little comment underneath depending on how well the user did. Instead of displaying plain text, make it look like a professional game dashboard, with colour coding such as "<200ms - Green, 200-300ms - Yellow, 300-400ms - Orange, >400ms - Red." A personal best score on the top right will help the user recall their best time and strive to do better. If the button is pressed before the light turns on, have the LED light blink red rapidly and display a message on the screen that tells the user they were early, then have the 'try again' button underneath to reset so the user can try again. This button should also appear even when the user successfully presses the button at any time. If the button is not pressed at all within 5 seconds of the LED turning on, display a message on the webpage that says they missed it and to try again, having the 'try again' button under it.

### Clarified Answers Added
- **Connection & Hardware Model:** The webpage connects to an **ESP32-SC** board over a USB cable using the browser **Web Serial API** at **115200** baud.
- **GPIO Pins & LED Colors:** The RGB LED uses **GPIO 12** (Red), **GPIO 13** (Green), and **GPIO 14** (Blue). The physical push button uses **GPIO 4** (`INPUT_PULLUP`, active LOW with a **20 ms** debounce window). The RGB LED turns **green** (**GPIO 13**) when ready to press, turns **blue** (**GPIO 14**) when pressed successfully, and blinks **red** (**GPIO 12**) rapidly (every **100 ms** on/off) for **2500 ms (2.5 seconds)** when pressed early.
- **Exact Dashboard Messages & Quirky Comments:**
  - `< 200 ms` (Green): `"Lightning reflexes! Are you even human?"`
  - `200–300 ms` (Yellow): `"Sharp and speedy! Nice reaction."`
  - `300–400 ms` (Orange): `"Not bad, but you could use a coffee."`
  - `> 400 ms` (Red): `"Did you fall asleep? My grandma clicks faster!"`
  - Early press: `"Too early! Wait for the green light."`
  - Missed press (after **5000 ms**): `"You missed it! Try again."`
- **Persistence:** **0** data is saved after the page closes. The Personal Best score resets when the tab closes. Nobody logs in.
- **Error & Edge Cases:**
  - **2** tabs/people at once: The Web Serial port locks to **1** tab; a second tab shows `"Device busy in another tab."`
  - USB disconnect: Shows `"ESP32 disconnected. Reconnect USB and click Connect ESP32."`
  - Idle for **1 hour (60 minutes / 3,600,000 ms)** or someone who never leaves: Auto-resets to the initial start state and turns the RGB LED off.
- **Tech Stack & Deliverables:** **3** web files (`index.html`, `style.css`, `script.js`) using **0** external libraries or frameworks (`none`), plus **1** ESP32 firmware sketch (`esp32_reaction.ino`).

---

## All Ten Questions Answered (With the Numbers)

1. **What does this system do and what unit does it measure?**
   It is a real-time hardware-to-web reaction speed game for **1** player at a time that measures human visual reaction time in **1 millisecond (ms)** increments from the instant an LED turns green until a physical button is pressed.

2. **How do the webpage and the microcontroller communicate?**
   The browser communicates directly with **1** ESP32-SC board over **1** USB serial connection using the Web Serial API at a baud rate of **115200** bps, exchanging newline-delimited ASCII messages in under **5 ms**.

3. **Which physical pins on the ESP32-SC are wired to the components?**
   The RGB LED uses **3** output pins—**GPIO 12** (Red), **GPIO 13** (Green), and **GPIO 14** (Blue)—and the push button uses **1** input pin on **GPIO 4** configured with an internal pull-up resistor (`INPUT_PULLUP`) and a **20 ms** debounce filter.

4. **How long is the random wait before the light turns green?**
   After the visitor clicks the `"Start Test"` button, the system waits a random duration between **1000 ms (1 second)** and **5000 ms (5 seconds)** while all **3** RGB LED channels remain off (`0`).

5. **What happens if the visitor presses the physical button before the green light turns on?**
   If the button on **GPIO 4** is pressed before the **1000–5000 ms** random wait ends, the test aborts immediately, the red LED channel on **GPIO 12** blinks rapidly every **100 ms** (**5 Hz**, **12–13** flashes total) for **2500 ms (2.5 seconds)**, the screen shows `"Too early! Wait for the green light."`, and **1** `"Try Again"` button appears.

6. **What happens when the green light turns on and the visitor presses the button in time?**
   The green channel on **GPIO 13** lights up and a **1 ms** timer starts; when the visitor presses the button on **GPIO 4** within **5000 ms (5 seconds)**, the timer stops, the green channel turns off, the blue channel on **GPIO 14** lights up for **1000 ms (1 second)**, and the exact elapsed time in milliseconds is displayed on the webpage with **1** `"Try Again"` button underneath.

7. **How are the reaction time results color-coded and scored on the dashboard?**
   Results are grouped into **4** color-coded brackets:
   - **Under 200 ms (`1–199 ms`):** Green (`#22c55e`) — `"Lightning reflexes! Are you even human?"`
   - **200 to 300 ms (`200–300 ms`):** Yellow (`#eab308`) — `"Sharp and speedy! Nice reaction."`
   - **300 to 400 ms (`301–400 ms`):** Orange (`#f97316`) — `"Not bad, but you could use a coffee."`
   - **Over 400 ms (`401–5000 ms`):** Red (`#ef4444`) — `"Did you fall asleep? My grandma clicks faster!"`

8. **What happens if the visitor does not press the button after the green light turns on?**
   If **5000 ms (5 seconds)** pass after the green LED on **GPIO 13** turns on without a button press on **GPIO 4**, the green LED turns off, the round ends as a timeout, the screen displays `"You missed it! Try again."`, and **1** `"Try Again"` button appears.

9. **How is the Personal Best score tracked and is anything kept after closing the page?**
   The lowest valid reaction time (`1–5000 ms`) achieved during the current session is shown in **1** Personal Best box in the top-right corner; **0** scores or user records are saved to disk or `localStorage`, so **100%** of state resets when the tab closes and **0** users log in.

10. **What are the limits for idle time and simultaneous visitors?**
    Only **1** browser tab can hold the USB serial lock at a time (a **2nd** tab receives `"Device busy in another tab."`), and if **0** actions occur for **60 minutes (3,600,000 ms / 1 hour)**—or a visitor walks away and never leaves the page—the system automatically turns off all **3** LED pins and resets to the initial start screen.
