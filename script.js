// 03 Backend & 06 Tech Spec: In-memory session state only (0 bytes kept after page closes, nobody logs in)
let isConnected = false;
let gameState = "IDLE"; // "IDLE" | "WAITING" | "GO" | "RESULT" | "EARLY" | "MISS"
let lastReactionMs = null;
let personalBestMs = null;
let inactivityTimerId = null;
let serialBuffer = "";

let serialPort = null;
let serialReader = null;
let serialWriter = null;
let keepReading = false;
let earlyBlinkTimeoutId = null;
let blueHoldTimeoutId = null;

const BAUD_RATE = 115200;
const INACTIVITY_LIMIT_MS = 3600000; // 60 minutes (1 hour)
const EARLY_BLINK_DURATION_MS = 2500; // 2.5 seconds rapid red blink
const BLUE_HOLD_DURATION_MS = 1000; // 1 second blue confirmation LED

// DOM References (Parts 1 to 8 from 02_frontend.md)
const statusDot = document.getElementById("statusDot");
const connectionStatusText = document.getElementById("connectionStatusText");
const connectBtn = document.getElementById("connectBtn");
const personalBestCard = document.getElementById("personalBestCard");
const personalBestValue = document.getElementById("personalBestValue");
const errorBanner = document.getElementById("errorBanner");
const arenaCard = document.getElementById("arenaCard");
const virtualLed = document.getElementById("virtualLed");
const mainStatusText = document.getElementById("mainStatusText");
const quirkyCommentText = document.getElementById("quirkyCommentText");
const primaryActionBtn = document.getElementById("primaryActionBtn");

const legendGreen = document.getElementById("legendGreen");
const legendYellow = document.getElementById("legendYellow");
const legendOrange = document.getElementById("legendOrange");
const legendRed = document.getElementById("legendRed");

// Show or hide exact error banner message (05_error_states.md)
function showErrorBanner(exactMessage) {
  if (!exactMessage) {
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
    return;
  }
  errorBanner.textContent = exactMessage;
  errorBanner.classList.remove("hidden");
}

function clearLegendHighlights() {
  legendGreen.classList.remove("active-pill");
  legendYellow.classList.remove("active-pill");
  legendOrange.classList.remove("active-pill");
  legendRed.classList.remove("active-pill");
}

function clearArenaStateClasses() {
  arenaCard.classList.remove(
    "state-idle",
    "state-waiting",
    "state-go",
    "state-early",
    "state-miss",
    "tier-green",
    "tier-yellow",
    "tier-orange",
    "tier-red"
  );
}

function setVirtualLedState(mode) {
  if (earlyBlinkTimeoutId) {
    clearTimeout(earlyBlinkTimeoutId);
    earlyBlinkTimeoutId = null;
  }
  if (blueHoldTimeoutId) {
    clearTimeout(blueHoldTimeoutId);
    blueHoldTimeoutId = null;
  }
  virtualLed.className = "virtual-led";
  if (mode === "GREEN") {
    virtualLed.classList.add("led-green");
  } else if (mode === "BLUE") {
    virtualLed.classList.add("led-blue");
    blueHoldTimeoutId = setTimeout(() => {
      virtualLed.className = "virtual-led led-off";
    }, BLUE_HOLD_DURATION_MS);
  } else if (mode === "RED_BLINK") {
    virtualLed.classList.add("led-red-blink");
    earlyBlinkTimeoutId = setTimeout(() => {
      virtualLed.className = "virtual-led led-off";
    }, EARLY_BLINK_DURATION_MS);
  } else {
    virtualLed.classList.add("led-off");
  }
}

// Reset 60-minute (3,600,000 ms) inactivity watchdog (Edge Cases 2 & 3)
function resetInactivityWatchdog() {
  if (inactivityTimerId !== null) {
    clearTimeout(inactivityTimerId);
  }
  inactivityTimerId = setTimeout(() => {
    handleInactivityReset();
  }, INACTIVITY_LIMIT_MS);
}

async function handleInactivityReset() {
  await sendSerialCommand("RESET\n");
  setIdleScreen("Start Test");
  showErrorBanner("Session reset after 60 minutes of inactivity.");
  resetInactivityWatchdog();
}

function updateConnectionUI(connected) {
  isConnected = connected;
  if (connected) {
    statusDot.classList.add("connected");
    connectionStatusText.textContent = "ESP32: Connected (115200 baud)";
    connectBtn.textContent = "Disconnect";
    connectBtn.classList.add("connected");
  } else {
    statusDot.classList.remove("connected");
    connectionStatusText.textContent = "ESP32: Disconnected";
    connectBtn.textContent = "Connect ESP32";
    connectBtn.classList.remove("connected");
  }
}

function setIdleScreen(buttonLabel = "Start Test") {
  gameState = "IDLE";
  clearArenaStateClasses();
  arenaCard.classList.add("state-idle");
  clearLegendHighlights();
  setVirtualLedState("OFF");
  mainStatusText.textContent = "Press Start Test to begin";
  quirkyCommentText.textContent = "Connect your ESP32-SC and test your reflexes.";
  primaryActionBtn.textContent = buttonLabel;
  primaryActionBtn.classList.remove("hidden");
}

// Classify reaction time into the 4 brackets from 01_overview.md & 02_frontend.md
function getReactionBracket(ms) {
  if (ms < 200) {
    return {
      arenaClass: "tier-green",
      legendEl: legendGreen,
      comment: "Lightning reflexes! Are you even human?"
    };
  }
  if (ms <= 300) {
    return {
      arenaClass: "tier-yellow",
      legendEl: legendYellow,
      comment: "Sharp and speedy! Nice reaction."
    };
  }
  if (ms <= 400) {
    return {
      arenaClass: "tier-orange",
      legendEl: legendOrange,
      comment: "Not bad, but you could use a coffee."
    };
  }
  return {
    arenaClass: "tier-red",
    legendEl: legendRed,
    comment: "Did you fall asleep? My grandma clicks faster!"
  };
}

// Handle incoming newline-delimited messages from ESP32-SC (03_backend.md)
function handleSerialLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  resetInactivityWatchdog();

  if (trimmed === "READY") {
    return;
  }

  if (trimmed === "WAITING") {
    gameState = "WAITING";
    clearArenaStateClasses();
    arenaCard.classList.add("state-waiting");
    clearLegendHighlights();
    setVirtualLedState("OFF");
    mainStatusText.textContent = "Wait for the green light on your ESP32...";
    quirkyCommentText.textContent = "Keep your finger ready on the ESP32 button (GPIO 7)...";
    primaryActionBtn.classList.add("hidden");
    return;
  }

  if (trimmed === "GO") {
    gameState = "GO";
    clearArenaStateClasses();
    arenaCard.classList.add("state-go");
    setVirtualLedState("GREEN");
    mainStatusText.textContent = "PRESS THE BUTTON NOW!";
    quirkyCommentText.textContent = "Timer running! Hit the physical button on the ESP32!";
    primaryActionBtn.classList.add("hidden");
    return;
  }

  if (trimmed.startsWith("RESULT:")) {
    const rawValue = parseInt(trimmed.slice("RESULT:".length), 10);
    if (Number.isNaN(rawValue) || rawValue < 1) return;

    gameState = "RESULT";
    lastReactionMs = rawValue;

    const bracket = getReactionBracket(rawValue);
    clearArenaStateClasses();
    arenaCard.classList.add(bracket.arenaClass);
    clearLegendHighlights();
    bracket.legendEl.classList.add("active-pill");

    setVirtualLedState("BLUE");
    mainStatusText.textContent = `${rawValue} ms`;
    quirkyCommentText.textContent = bracket.comment;

    // Update Personal Best in top-right corner if first valid score or lower time
    if (personalBestMs === null || rawValue < personalBestMs) {
      personalBestMs = rawValue;
      personalBestValue.textContent = `${personalBestMs} ms`;
      personalBestCard.classList.add("pb-updated");
      setTimeout(() => {
        personalBestCard.classList.remove("pb-updated");
      }, 600);
    }

    primaryActionBtn.textContent = "Try Again";
    primaryActionBtn.classList.remove("hidden");
    return;
  }

  if (trimmed === "EARLY") {
    gameState = "EARLY";
    clearArenaStateClasses();
    arenaCard.classList.add("state-early");
    clearLegendHighlights();
    setVirtualLedState("RED_BLINK");
    mainStatusText.textContent = "Too early! Wait for the green light.";
    quirkyCommentText.textContent = "Red LED blinking rapidly — don't jump the gun!";
    primaryActionBtn.textContent = "Try Again";
    primaryActionBtn.classList.remove("hidden");
    return;
  }

  if (trimmed === "MISS") {
    gameState = "MISS";
    clearArenaStateClasses();
    arenaCard.classList.add("state-miss");
    clearLegendHighlights();
    setVirtualLedState("OFF");
    mainStatusText.textContent = "You missed it! Try again.";
    quirkyCommentText.textContent = "5 seconds passed without a button press.";
    primaryActionBtn.textContent = "Try Again";
    primaryActionBtn.classList.remove("hidden");
  }
}

async function sendSerialCommand(command) {
  if (!isConnected || !serialWriter) return false;
  try {
    const encoded = new TextEncoder().encode(command);
    await serialWriter.write(encoded);
    return true;
  } catch (err) {
    await handleUnexpectedDisconnect();
    return false;
  }
}

async function readSerialLoop() {
  const decoder = new TextDecoder();
  while (serialPort && serialPort.readable && keepReading) {
    try {
      serialReader = serialPort.readable.getReader();
      while (true) {
        const { value, done } = await serialReader.read();
        if (done) break;
        if (value) {
          serialBuffer += decoder.decode(value, { stream: true });
          const lines = serialBuffer.split(/\r?\n/);
          serialBuffer = lines.pop() || "";
          for (const line of lines) {
            handleSerialLine(line);
          }
        }
      }
    } catch (err) {
      if (keepReading) {
        await handleUnexpectedDisconnect();
      }
      break;
    } finally {
      if (serialReader) {
        try {
          serialReader.releaseLock();
        } catch (_) {}
        serialReader = null;
      }
    }
  }
}

async function connectEsp32() {
  if (!("serial" in navigator)) {
    showErrorBanner("Web Serial is not supported in this browser. Open this page in Chrome or Edge.");
    return false;
  }

  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });

    serialPort = port;
    serialWriter = serialPort.writable.getWriter();
    keepReading = true;
    serialBuffer = "";

    updateConnectionUI(true);
    showErrorBanner("");
    resetInactivityWatchdog();

    readSerialLoop();
    await sendSerialCommand("RESET\n");
    return true;
  } catch (err) {
    updateConnectionUI(false);
    if (err && err.name === "NotFoundError") {
      showErrorBanner("Connection cancelled. Click Connect ESP32 to select your board.");
    } else if (err && (err.name === "NetworkError" || err.name === "InvalidStateError")) {
      showErrorBanner("Device busy in another tab.");
    } else {
      showErrorBanner("ESP32 disconnected. Reconnect USB and click Connect ESP32.");
    }
    return false;
  }
}

async function disconnectEsp32(showDisconnectError = false) {
  keepReading = false;
  if (serialReader) {
    try {
      await serialReader.cancel();
    } catch (_) {}
    serialReader = null;
  }
  if (serialWriter) {
    try {
      const resetBytes = new TextEncoder().encode("RESET\n");
      await serialWriter.write(resetBytes);
    } catch (_) {}
    try {
      serialWriter.releaseLock();
    } catch (_) {}
    serialWriter = null;
  }
  if (serialPort) {
    try {
      await serialPort.close();
    } catch (_) {}
    serialPort = null;
  }

  updateConnectionUI(false);
  setIdleScreen("Start Test");

  if (showDisconnectError) {
    showErrorBanner("ESP32 disconnected. Reconnect USB and click Connect ESP32.");
  }
}

async function handleUnexpectedDisconnect() {
  await disconnectEsp32(true);
}

// Start or retry a reaction test round (Action B in 02_frontend.md)
async function startTestRound() {
  resetInactivityWatchdog();

  if (!isConnected) {
    const connected = await connectEsp32();
    if (!connected) return;
    // Wait 600 ms after opening USB serial port so the ESP32-SC finishes its DTR/RTS boot reset
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  showErrorBanner("");
  gameState = "WAITING";
  clearArenaStateClasses();
  arenaCard.classList.add("state-waiting");
  clearLegendHighlights();
  setVirtualLedState("OFF");
  mainStatusText.textContent = "Wait for the green light on your ESP32...";
  quirkyCommentText.textContent = "Keep your finger ready on the ESP32 button (GPIO 7)...";
  primaryActionBtn.classList.add("hidden");

  await sendSerialCommand("START\n");
}

// Event Listeners
connectBtn.addEventListener("click", async () => {
  resetInactivityWatchdog();
  if (isConnected) {
    await disconnectEsp32(false);
  } else {
    await connectEsp32();
  }
});

primaryActionBtn.addEventListener("click", () => {
  startTestRound();
});

if ("serial" in navigator) {
  navigator.serial.addEventListener("disconnect", (event) => {
    if (serialPort && event.target === serialPort) {
      handleUnexpectedDisconnect();
    }
  });
} else {
  showErrorBanner("Web Serial is not supported in this browser. Open this page in Chrome or Edge.");
}

// Initialize start state
setIdleScreen("Start Test");
resetInactivityWatchdog();

