(() => {
  const GUITAR_STRINGS = [
    { name: "E2", freq: 82.41 },
    { name: "A2", freq: 110.0 },
    { name: "D3", freq: 146.83 },
    { name: "G3", freq: 196.0 },
    { name: "B3", freq: 246.94 },
    { name: "E4", freq: 329.63 },
  ];

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusEl = document.getElementById("status");
  const stringEl = document.getElementById("stringName");
  const freqEl = document.getElementById("frequency");
  const noteEl = document.getElementById("note");
  const centsEl = document.getElementById("cents");
  const needleEl = document.getElementById("needle");
  const stringButtons = Array.from(document.querySelectorAll(".string-btn"));
  const beepBtn = document.getElementById("beepBtn");

  let audioContext = null;
  let analyser = null;
  let mediaStream = null;
  let timeData = null;
  let rafId = null;
  let running = false;
  let selectedTarget = "AUTO";
  let smoothedCents = 0;
  let beepContext = null;
  let freqHistory = []; // for median filtering
  let lastCents = 0;
  let velocity = 0;
  let confidence = 0;

  function logStatus(msg) {
    statusEl.textContent = msg;
  }

  function getNearestString(frequency) {
    let best = GUITAR_STRINGS[0];
    let minDiff = Math.abs(frequency - best.freq);
    for (let i = 1; i < GUITAR_STRINGS.length; i++) {
      const diff = Math.abs(frequency - GUITAR_STRINGS[i].freq);
      if (diff < minDiff) {
        minDiff = diff;
        best = GUITAR_STRINGS[i];
      }
    }
    return best;
  }

  function getTargetString() {
    if (selectedTarget === "AUTO") return null;
    return GUITAR_STRINGS.find((s) => s.name === selectedTarget) || null;
  }

  function frequencyToNoteName(frequency) {
    if (!frequency || frequency <= 0) return "—";
    const A4 = 440;
    const NOTES = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const midi = Math.round(12 * Math.log2(frequency / A4) + 69);
    const note = NOTES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  }

  function centsOff(frequency, target) {
    if (!frequency || !target || frequency <= 0 || target <= 0) return 0;
    return Math.round(1200 * Math.log2(frequency / target));
  }

  function medianFilter(value, history, size = 5) {
    history.push(value);
    if (history.length > size) history.shift();
    const sorted = [...history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  function correctOctave(detected, target) {
    // If detected frequency is too far from target, check if it's an octave jump
    let corrected = detected;
    while (corrected > target * 1.5) corrected /= 2; // octave down
    while (corrected < target * 0.75) corrected *= 2; // octave up
    return corrected;
  }

  function ensureBeepContext() {
    if (beepContext && beepContext.state !== "closed") return beepContext;
    beepContext = new (window.AudioContext || window.webkitAudioContext)();
    return beepContext;
  }

  function playReferenceBeep() {
    const target = getTargetString();
    if (!target) {
      logStatus("Select a string to play reference beep.");
      return;
    }
    const ctx = ensureBeepContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(target.freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.05);
    logStatus(`Reference beep: ${target.name}`);
  }

  // Autocorrelation-based pitch detection adapted for Web Audio time-domain data
  function autoCorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.005) return -1; // too quiet (lowered threshold for better sensitivity)

    // Guitar frequency range: ~80Hz to ~500Hz (extended for high E4)
    const minPeriod = Math.floor(sampleRate / 500); // high E4 string + margin
    const maxPeriod = Math.floor(sampleRate / 75); // below low E2 string

    let r1 = 0,
      r2 = SIZE - 1,
      thresh = 0.15;
    // Trim buffer edges where amplitude is below threshold
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thresh) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thresh) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    const newSize = trimmed.length;
    const autocorr = new Float32Array(newSize);

    // Normalized autocorrelation for better stability
    for (let lag = 0; lag < newSize; lag++) {
      let sum = 0;
      for (let i = 0; i < newSize - lag; i++)
        sum += trimmed[i] * trimmed[i + lag];
      autocorr[lag] = sum;
    }

    // Normalize by first value
    const norm = autocorr[0];
    if (norm === 0) return -1;
    for (let i = 0; i < newSize; i++) autocorr[i] /= norm;

    // Find best peak within guitar frequency range
    let peakIndex = -1;
    let peakValue = 0;
    const searchStart = Math.max(minPeriod, 1);
    const searchEnd = Math.min(maxPeriod, newSize - 1);

    for (let i = searchStart; i < searchEnd; i++) {
      // Look for local maxima above threshold (lowered for high frequencies)
      if (
        autocorr[i] > 0.4 &&
        autocorr[i] > autocorr[i - 1] &&
        autocorr[i] >= autocorr[i + 1] &&
        autocorr[i] > peakValue
      ) {
        peakValue = autocorr[i];
        peakIndex = i;
      }
    }

    if (peakIndex <= 0 || peakValue < 0.4) return -1;

    // Parabolic interpolation to refine peak position
    const x0 = peakIndex - 1;
    const x2 = peakIndex + 1;
    const y0 = autocorr[x0];
    const y1 = autocorr[peakIndex];
    const y2 = autocorr[x2];
    const denom = y0 - 2 * y1 + y2;
    const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
    const refined = peakIndex + shift;

    const freq = sampleRate / refined;
    if (!isFinite(freq) || freq <= 0 || freq < 70 || freq > 500) return -1;
    return freq;
  }

  function update() {
    if (!running) return;
    analyser.getFloatTimeDomainData(timeData);
    let freq = autoCorrelate(timeData, audioContext.sampleRate);

    if (freq > 0) {
      const target = getTargetString();
      const base = target ? target : getNearestString(freq);

      // Apply octave correction when locked to a specific string
      if (target) {
        freq = correctOctave(freq, base.freq);
      }

      // Adaptive median filter: smaller window for high frequencies
      const filterSize = freq > 200 ? 4 : 7;
      freq = medianFilter(freq, freqHistory, filterSize);

      const cents = centsOff(freq, base.freq);
      const noteName = frequencyToNoteName(freq);

      // Frequency-adaptive smoothing with velocity damping
      const baseDiff = Math.abs(cents - smoothedCents);
      const isHighFreq = freq > 200;

      // Calculate velocity (rate of change)
      velocity = 0.7 * velocity + 0.3 * (cents - lastCents);
      lastCents = cents;

      // Reduce alpha when velocity is high (adds damping/momentum)
      const velocityFactor = Math.max(0.5, 1 - Math.abs(velocity) / 30);

      let alpha;
      if (target) {
        // Locked to string: more stable, velocity-damped
        alpha = isHighFreq
          ? baseDiff > 15
            ? 0.3
            : 0.2
          : baseDiff > 15
            ? 0.25
            : 0.15;
        alpha *= velocityFactor; // apply damping
      } else {
        // Auto mode: responsive but still damped
        alpha = (baseDiff > 10 ? 0.45 : 0.35) * velocityFactor;
      }
      smoothedCents = smoothedCents + alpha * (cents - smoothedCents);
      const clamped = Math.max(-50, Math.min(50, smoothedCents));

      // Calculate confidence based on stability
      const stability = 1 - Math.min(1, Math.abs(velocity) / 20);
      confidence = 0.8 * confidence + 0.2 * stability;

      // Map cents [-50, 50] to horizontal translation in pixels
      const meterEl = needleEl.parentElement;
      const maxShift = Math.max(40, meterEl.clientWidth / 2 - 12);
      const x = (clamped / 50) * maxShift;

      stringEl.textContent = target ? target.name : "Auto";
      freqEl.textContent = freq.toFixed(2);
      noteEl.textContent = noteName;
      centsEl.textContent = Math.round(smoothedCents);
      needleEl.style.transform = `translateX(${x}px)`;

      // Visual feedback based on confidence and tuning accuracy
      const good = Math.abs(smoothedCents) <= 5 && confidence > 0.6;
      const settling = confidence < 0.5;
      needleEl.classList.toggle("good", good);
      needleEl.classList.toggle("bad", !good && !settling);
      needleEl.classList.toggle("settling", settling);
      needleEl.style.opacity = Math.max(0.4, confidence);

      const statusMsg = good ? "In tune!" : settling ? "Settling…" : "Tuning…";
      logStatus(statusMsg);
    } else {
      logStatus("Listening… (no stable pitch)");
    }

    rafId = requestAnimationFrame(update);
  }

  async function start() {
    if (running) return;
    try {
      logStatus("Requesting microphone…");
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      timeData = new Float32Array(analyser.fftSize);
      source.connect(analyser);
      running = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      logStatus("Listening…");
      update();
    } catch (err) {
      console.error(err);
      logStatus("Microphone permission denied or unavailable.");
    }
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop();
      mediaStream = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    logStatus("Stopped");
    stringEl.textContent = "—";
    freqEl.textContent = "—";
    noteEl.textContent = "—";
    centsEl.textContent = "0";
    needleEl.style.transform = "translateX(0px)";
    needleEl.style.opacity = "1";
    needleEl.classList.remove("good", "bad", "settling");
  }

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);

  stringButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      stringButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTarget = btn.dataset.string || "AUTO";
      stringEl.textContent =
        selectedTarget === "AUTO" ? "Auto" : selectedTarget;
      smoothedCents = 0;
      freqHistory = [];
      lastCents = 0;
      velocity = 0;
      confidence = 0;
      beepBtn.disabled = selectedTarget === "AUTO";
    });
  });

  beepBtn.addEventListener("click", playReferenceBeep);

  // Feature detection
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    logStatus("getUserMedia not supported in this browser.");
    startBtn.disabled = true;
  }

  // Initialize beep button disabled in Auto mode
  beepBtn.disabled = selectedTarget === "AUTO";
})();
