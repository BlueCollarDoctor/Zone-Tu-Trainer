# Zone Tu Trainer 

A simple Green, Yellow, Red screen heart rate zone monitor Progressive Web App (PWA) with BLE chest strap support, demo mode, audio beep alerts, and vibration feedback.

**Live App:** https://zvfyn6yvpuxsk.kimi.page

---

## How to Install on Your Phone

### iPhone (Safari)

1. Open Safari on your iPhone and go to: `https://zvfyn6yvpuxsk.kimi.page`
2. Tap the **Share button** (square with arrow icon) at the bottom of Safari
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top-right corner
5. The app icon will appear on your home screen — tap it to launch fullscreen like a native app

> **Important for iPhone:** Vibration only works when the app is launched from the Home Screen icon (not in Safari). Also, you must tap the vibration icon to enable it after the app loads — iOS requires a user gesture before vibration works.

### Android (Chrome)

1. Open Chrome on your Android phone and go to: `https://zvfyn6yvpuxsk.kimi.page`
2. Tap the **three-dot menu (⋮)** in the top-right corner
3. Tap **"Add to Home screen"** (or "Install app")
4. Tap **"Add"** or **"Install"**
5. The app icon will appear on your home screen — tap it to launch fullscreen

---

## Using with a Real Heart Rate Monitor

1. Put on your BLE chest strap or armband (Polar H10, Wahoo TICKR, Garmin HRM, etc.)
2. Make sure it's turned on and the sensor contacts are moist
3. In the app, tap **"BLE HR"** tab
4. Tap **"Connect BLE HR Monitor"**
5. Select your device from the popup list
6. Your live heart rate will appear and zones will change automatically

---

## Using Demo Mode

The app starts in Demo Mode which simulates a workout:

- Starts around **70 BPM** (Zone 1, Green)
- Ramps up to **130 BPM** (Zone 2, Yellow — Beep-Beep)
- Climbs to **160 BPM** (Zone 3, Red — Beep-Beep-Beep + vibration)
- Peaks at **180+ BPM** (Zone 4, Flashing White/Red — rapid beeps + intense vibration)
- Then cycles back down

Tap **"Pause"** to stop the simulation, tap **"Start"** to resume.

---

## Using Manual Mode

1. Tap **"Manual"** tab
2. Drag the slider to set any BPM from 40–200
3. Use this to test how the zones, colors, beeps, and vibration feel before a workout

---

## Enabling Alerts

- **Speaker icon** (top left) — tap to enable audio beep alerts
- **Vibration icon** (top left, next to speaker) — tap to enable phone vibration

Both work in Demo and BLE mode.

---

## Heart Rate Zones

| Zone | Name | BPM Range | Color | Alerts |
|------|------|-----------|-------|--------|
| 1 | Recovery | < 100 BPM | Green | None |
| 2 | Aerobic | 101–140 BPM | Yellow | 2 beeps |
| 3 | Peak | 141–170 BPM | Red | 3 beeps + vibration |
| 4 | Critical | 171+ BPM | Flashing Red/White | Rapid beeps + intense vibration |

---

## Files

- `index.html` — App structure and UI
- `style.css` — Styles, animations, and zone colors
- `app.js` — All app logic (zones, BLE, demo simulator, audio, vibration)
