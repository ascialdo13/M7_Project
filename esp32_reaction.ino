/*
 * ESP32-SC Reaction Test Firmware (esp32_reaction.ino)
 *
 * Hardware Configuration (from 01_overview.md & 06_tech_spec.md):
 * - RGB LED Red Channel:   GPIO 12
 * - RGB LED Green Channel: GPIO 13
 * - RGB LED Blue Channel:  GPIO 14
 * - Push Button:           GPIO 7 (INPUT_PULLUP, active LOW, 20 ms debounce)
 * - Serial Baud Rate:      115200 bps
 */

#ifdef ARDUINO
#include <Arduino.h>
#else
// Editor C/C++ IntelliSense declarations (skipped automatically when compiled by PlatformIO / Arduino)
#define HIGH 0x1
#define LOW 0x0
#define OUTPUT 0x02
#define INPUT_PULLUP 0x05
void pinMode(int pin, int mode);
void digitalWrite(int pin, int val);
int digitalRead(int pin);
unsigned long millis();
unsigned long micros();
void randomSeed(unsigned long seed);
long random(long howsmall, long howbig);
class String {
public:
  String(const char* s = "") {}
  void trim() {}
  String& operator+=(char c) { return *this; }
  bool operator==(const char* rhs) const { return false; }
};
struct HardwareSerialStub {
  void begin(unsigned long baud) {}
  int available() { return 0; }
  int read() { return -1; }
  void print(const char* s) {}
  void println(const char* s) {}
  void println(unsigned long n) {}
};
static HardwareSerialStub Serial;
#endif

const int PIN_LED_RED   = 12;
const int PIN_LED_GREEN = 13;
const int PIN_LED_BLUE  = 14;
const int PIN_BUTTON    = 7;

enum FirmwareState {
  STATE_IDLE        = 0,
  STATE_WAITING     = 1,
  STATE_ACTIVE      = 2,
  STATE_EARLY_BLINK = 3,
  STATE_BLUE_HOLD   = 4
};

FirmwareState firmwareState = STATE_IDLE;
unsigned long randomDelayMs      = 0;
unsigned long waitStartMs        = 0;
unsigned long stimulusStartMs    = 0;
unsigned long blinkStartMs       = 0;
unsigned long lastButtonChangeMs = 0;

bool debouncedButtonPressed = false;
String serialCommandBuffer = "";

void setRgbLed(bool redOn, bool greenOn, bool blueOn) {
  digitalWrite(PIN_LED_RED,   redOn   ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN, greenOn ? HIGH : LOW);
  digitalWrite(PIN_LED_BLUE,  blueOn  ? HIGH : LOW);
}

// Instant-edge detection with 20 ms lockout debounce so 0 ms lag is added to reaction time
bool checkButtonJustPressed() {
  bool isPressedNow = (digitalRead(PIN_BUTTON) == LOW);
  unsigned long now = millis();

  if ((now - lastButtonChangeMs) < 20) {
    return false;
  }

  if (isPressedNow && !debouncedButtonPressed) {
    debouncedButtonPressed = true;
    lastButtonChangeMs = now;
    return true;
  } else if (!isPressedNow && debouncedButtonPressed) {
    debouncedButtonPressed = false;
    lastButtonChangeMs = now;
  }
  return false;
}

void handleSerialCommand(String cmd) {
  cmd.trim();
  if (cmd == "RESET") {
    firmwareState = STATE_IDLE;
    setRgbLed(false, false, false);
  } else if (cmd == "START") {
    setRgbLed(false, false, false);
    randomSeed(micros());
    waitStartMs = millis();
    randomDelayMs = random(1000, 5001); // 1000 ms to 5000 ms inclusive
    firmwareState = STATE_WAITING;
    Serial.println("WAITING");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED_RED,   OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE,  OUTPUT);
  pinMode(PIN_BUTTON,    INPUT_PULLUP);

  setRgbLed(false, false, false);
  randomSeed(micros());

  Serial.println("READY");
}

void loop() {
  // 1. Read incoming serial commands from the webpage
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      handleSerialCommand(serialCommandBuffer);
      serialCommandBuffer = "";
    } else if (c != '\r') {
      serialCommandBuffer += c;
    }
  }

  bool buttonJustPressed = checkButtonJustPressed();
  unsigned long now = millis();

  // 2. State Machine
  if (firmwareState == STATE_WAITING) {
    // Early press before random 1000-5000 ms delay finishes
    if (buttonJustPressed) {
      firmwareState = STATE_EARLY_BLINK;
      blinkStartMs = now;
      Serial.println("EARLY");
      return;
    }

    // Random wait completed -> turn Green LED (GPIO 13) ON and start reaction timer
    if ((now - waitStartMs) >= randomDelayMs) {
      setRgbLed(false, true, false);
      stimulusStartMs = millis();
      firmwareState = STATE_ACTIVE;
      Serial.println("GO");
    }
  } else if (firmwareState == STATE_ACTIVE) {
    unsigned long elapsedMs = now - stimulusStartMs;

    if (buttonJustPressed && elapsedMs <= 5000) {
      unsigned long reactionTimeMs = (elapsedMs < 1) ? 1 : elapsedMs;
      // Turn Green OFF and Blue (GPIO 14) ON for 1000 ms
      setRgbLed(false, false, true);
      blinkStartMs = now;
      firmwareState = STATE_BLUE_HOLD;
      Serial.print("RESULT:");
      Serial.println(reactionTimeMs);
      return;
    }

    // Missed 5000 ms window
    if (elapsedMs > 5000) {
      setRgbLed(false, false, false);
      firmwareState = STATE_IDLE;
      Serial.println("MISS");
    }
  } else if (firmwareState == STATE_EARLY_BLINK) {
    unsigned long blinkElapsed = now - blinkStartMs;
    if (blinkElapsed >= 2500) {
      setRgbLed(false, false, false);
      firmwareState = STATE_IDLE;
    } else {
      // Rapid red blink every 100 ms (5 Hz) for 2500 ms
      bool redPhaseOn = ((blinkElapsed / 100) % 2) == 0;
      setRgbLed(redPhaseOn, false, false);
    }
  } else if (firmwareState == STATE_BLUE_HOLD) {
    if ((now - blinkStartMs) >= 1000) {
      setRgbLed(false, false, false);
      firmwareState = STATE_IDLE;
    }
  }
}

