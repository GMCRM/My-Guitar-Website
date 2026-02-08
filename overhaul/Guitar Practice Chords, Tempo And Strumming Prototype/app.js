// Sample data for prototype selections
const backingTracks = [
  { id: "slow-blues", name: "Slow Blues Groove" },
  { id: "medium-rock", name: "Medium Rock Groove" },
  { id: "pop-strum", name: "Pop Strum Practice" },
];

const keyProgressions = {
  C: ["C", "F", "G"],
  D: ["D", "G", "A"],
  E: ["E", "A", "B"],
  G: ["G", "C", "D"],
  A: ["A", "D", "E"],
};

const strummingPatterns = [
  { id: "pattern-1", arrows: "↓ ↓ ↑ ↑ ↓" },
  { id: "pattern-2", arrows: "↓ ↑ ↓ ↑" },
  { id: "pattern-3", arrows: "↓ ↓ ↑" },
];

// Placeholder audio data URI (short tone) reused for all tracks
const placeholderAudioSrc =
  "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YVQAAAAA/////wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAA";

const elements = {
  trackList: document.getElementById("track-list"),
  keyList: document.getElementById("key-list"),
  patternList: document.getElementById("pattern-list"),
  selectedTrack: document.getElementById("selected-track"),
  selectedKey: document.getElementById("selected-key"),
  selectedChords: document.getElementById("selected-chords"),
  selectedPattern: document.getElementById("selected-pattern"),
  audioPlayer: document.getElementById("audio-player"),
};

let activeTrackId = null;
let activeKey = null;
let activePatternId = null;

function renderTracks() {
  elements.trackList.innerHTML = "";
  backingTracks.forEach((track) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "option-button";
    button.textContent = track.name;
    button.addEventListener("click", () => selectTrack(track));
    li.appendChild(button);
    elements.trackList.appendChild(li);
  });
}

function renderKeys() {
  elements.keyList.innerHTML = "";
  Object.keys(keyProgressions).forEach((key) => {
    const button = document.createElement("button");
    button.className = "pill-button";
    button.textContent = `Key of ${key}`;
    button.addEventListener("click", () => selectKey(key));
    elements.keyList.appendChild(button);
  });
}

function renderPatterns() {
  elements.patternList.innerHTML = "";
  strummingPatterns.forEach((pattern) => {
    const button = document.createElement("button");
    button.className = "pattern-button";
    button.textContent = pattern.arrows;
    button.addEventListener("click", () => selectPattern(pattern));
    elements.patternList.appendChild(button);
  });
}

// Selection logic: updates active state and UI highlight
function selectTrack(track) {
  activeTrackId = track.id;
  elements.selectedTrack.textContent = track.name;

  // Audio selection: load placeholder audio and auto-play
  elements.audioPlayer.src = placeholderAudioSrc;
  elements.audioPlayer.play().catch(() => {
    // Autoplay may be blocked; user can press play in controls.
  });

  updateButtonStates(
    elements.trackList,
    "option-button",
    activeTrackId,
    backingTracks,
  );
}

function selectKey(key) {
  activeKey = key;
  elements.selectedKey.textContent = `Key of ${key}`;

  // Chord progression determination from hard-coded data
  const chords = keyProgressions[key] || [];
  elements.selectedChords.textContent = chords.join(" – ");

  updateButtonStates(
    elements.keyList,
    "pill-button",
    activeKey,
    Object.keys(keyProgressions),
  );
}

function selectPattern(pattern) {
  activePatternId = pattern.id;
  elements.selectedPattern.textContent = pattern.arrows;
  updateButtonStates(
    elements.patternList,
    "pattern-button",
    activePatternId,
    strummingPatterns,
  );
}

// Utility to update selected styling in a list
function updateButtonStates(container, className, activeId, data) {
  const buttons = container.querySelectorAll(`.${className}`);
  buttons.forEach((button, index) => {
    let compareValue = null;

    if (Array.isArray(data)) {
      const item = data[index];
      compareValue = item.id || item;
    } else {
      compareValue = data[index];
    }

    if (compareValue === activeId) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });
}

renderTracks();
renderKeys();
renderPatterns();
