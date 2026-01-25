# Guitar Tuner Prototype

A standalone, minimal guitar tuner prototype built with HTML/CSS/JS using the Web Audio API. This is disconnected from the Next.js site and suitable for class submission.

## Features

- Microphone-based pitch detection via autocorrelation
- Maps detected pitch to standard guitar strings (E2, A2, D3, G3, B3, E4)
- Per-string selection (Auto, E2, A2, D3, G3, B3, E4)
- Shows frequency, musical note, cents detune, and an improved needle meter with smoothing
- Reference beep: plays a short sine tone for the selected string

## Run Locally (localhost required)

Browser microphone access requires a secure context (https or localhost). Use one of the following:

### Option 1: Python

```bash
cd "prototype - Senior Project"
python3 -m http.server 5500
```

Visit http://localhost:5500 and click "Start Microphone".

### Option 2: Node (serve)

```bash
npm install -g serve
cd "prototype - Senior Project"
serve -l 5500
```

Visit http://localhost:5500.

## Files

- index.html: UI and controls
- style.css: minimal styles and meter visuals
- tuner.js: microphone, pitch detection, and UI updates

## Notes

- For best results, tune one string at a time in a relatively quiet environment.
- Disable OS/system audio enhancements (noise suppression/AGC) if possible for more stable readings.
- Use the selector to lock to a target string; "Auto" picks the nearest string automatically.
- The Reference Beep is available only when a specific string (not Auto) is selected.
