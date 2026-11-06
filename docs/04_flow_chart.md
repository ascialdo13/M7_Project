# 04 Flow Chart

Every action is a rectangular box (`[...]`), every question is a diamond (`{...}`) containing a number, every diamond has both a **Yes** and a **No** path out of it, and every path leads back to the Start state.

```mermaid
flowchart TD
    START(["START STATE: Page loaded, Personal Best = -- ms, RGB LED GPIO 12/13/14 OFF"])
    
    START --> Q1{"Q1: Is 1 ESP32-SC connected at 115200 baud?"}
    
    Q1 -- "No" --> A1["Action: Visitor clicks Connect ESP32 and selects 1 USB port"]
    A1 --> Q2{"Q2: Did 1 serial port open within 10000 ms without lock error?"}
    Q2 -- "No" --> A2["Action: Show exact error banner on screen and keep LEDs at 0"]
    A2 --> START
    Q2 -- "Yes" --> A3["Action: Send RESET command, set status to Connected at 115200 baud"]
    
    Q1 -- "Yes" --> Q3{"Q3: Have 60 minutes (3600000 ms) passed with 0 actions?"}
    A3 --> Q3
    
    Q3 -- "Yes" --> A4["Action: Send RESET, turn all 3 LED pins OFF, show 60-minute reset banner"]
    A4 --> START
    
    Q3 -- "No" --> Q4{"Q4: Did visitor click the 1 Start Test or Try Again button?"}
    Q4 -- "No" --> Q3
    
    Q4 -- "Yes" --> A5["Action: Send START to ESP32-SC, hide button, pick random wait between 1000 ms and 5000 ms"]
    A5 --> Q5{"Q5: Was GPIO 4 button pressed > 0 times before the 1000-5000 ms wait finished?"}
    
    Q5 -- "Yes" --> A6["Action: Send EARLY, blink Red LED (GPIO 12) every 100 ms for 2500 ms, show 'Too early! Wait for the green light.' and Try Again button"]
    A6 --> Q4
    
    Q5 -- "No" --> A7["Action: Turn Green LED (GPIO 13) ON, send GO, start 1 ms internal timer"]
    A7 --> Q6{"Q6: Was GPIO 4 button pressed within 5000 ms of Green LED turning ON?"}
    
    Q6 -- "No" --> A8["Action: Turn Green LED (GPIO 13) OFF, send MISS, show 'You missed it! Try again.' and Try Again button"]
    A8 --> Q4
    
    Q6 -- "Yes" --> A9["Action: Stop timer, turn Green LED OFF, turn Blue LED (GPIO 14) ON for 1000 ms, send RESULT in ms"]
    A9 --> Q7{"Q7: Is reaction time < 200 ms?"}
    
    Q7 -- "Yes" --> A10["Action: Color dashboard Green, show 'Lightning reflexes! Are you even human?'"]
    Q7 -- "No" --> Q8{"Q8: Is reaction time <= 300 ms?"}
    
    Q8 -- "Yes" --> A11["Action: Color dashboard Yellow, show 'Sharp and speedy! Nice reaction.'"]
    Q8 -- "No" --> Q9{"Q9: Is reaction time <= 400 ms?"}
    
    Q9 -- "Yes" --> A12["Action: Color dashboard Orange, show 'Not bad, but you could use a coffee.'"]
    Q9 -- "No" --> A13["Action: Color dashboard Red, show 'Did you fall asleep? My grandma clicks faster!'"]
    
    A10 --> Q10{"Q10: Is reaction time < current Personal Best (or is Personal Best 0 / empty)?"}
    A11 --> Q10
    A12 --> Q10
    A13 --> Q10
    
    Q10 -- "Yes" --> A14["Action: Update Top-Right Personal Best to new ms value and show Try Again button"]
    Q10 -- "No" --> A15["Action: Keep existing Personal Best and show Try Again button"]
    
    A14 --> Q4
    A15 --> Q4
```

