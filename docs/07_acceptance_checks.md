# 07 Acceptance Checks

1. **True or False:** Clicking the `"Start Test"` button starts a random wait between 1000 ms and 5000 ms with GPIO 12, GPIO 13, and GPIO 14 turned off before GPIO 13 lights up green.
2. **True or False:** Pressing the physical button on GPIO 4 within 5000 ms of GPIO 13 turning green stops the internal timer, turns GPIO 14 blue for 1000 ms, and displays the reaction time in milliseconds with the `"Try Again"` button underneath.
3. **True or False:** A reaction time of 180 ms turns the dashboard green with the exact comment `"Lightning reflexes! Are you even human?"`, 250 ms turns it yellow with `"Sharp and speedy! Nice reaction."`, 350 ms turns it orange with `"Not bad, but you could use a coffee."`, and 450 ms turns it red with `"Did you fall asleep? My grandma clicks faster!"`.
4. **True or False:** Pressing the button on GPIO 4 before the 1000 ms to 5000 ms wait finishes causes GPIO 12 to blink red every 100 ms for 2500 ms and displays `"Too early! Wait for the green light."` with the `"Try Again"` button underneath.
5. **True or False:** Waiting more than 5000 ms after GPIO 13 turns green without pressing the button on GPIO 4 turns the green LED off and displays `"You missed it! Try again."` with the `"Try Again"` button underneath.
6. **True or False:** The Personal Best box in the top-right corner updates whenever a new lowest reaction time between 1 ms and 5000 ms is recorded during the session and resets to `"-- ms"` when the browser tab is closed and reopened.
7. **True or False:** If a 2nd browser tab attempts to connect to the same ESP32-SC over 115200 baud USB serial at the same time, the 2nd tab displays `"Device busy in another tab."` while the 1st tab stays connected, and 60 minutes (3,600,000 ms) of inactivity resets the dashboard to the start screen with all 3 LED pins turned off.

