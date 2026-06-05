// ===== NEO-RHYTHM - Heart Rate Zone Monitor =====
// Pure vanilla JavaScript - no frameworks, no build step

// ===== ZONE CONFIG =====
const ZONES = {
  1: { name: 'RECOVERY', label: 'Zone 1', bg: '#28CD41', text: '#FFFFFF', min: 0, max: 100, beepFreq: 0, beepTimes: 0, beepInterval: 0, vibPattern: [], vibInterval: 0 },
  2: { name: 'AEROBIC', label: 'Zone 2', bg: '#FFD60A', text: '#000000', min: 101, max: 140, beepFreq: 440, beepTimes: 2, beepInterval: 150, vibPattern: [], vibInterval: 0 },
  3: { name: 'PEAK', label: 'Zone 3', bg: '#FF3B30', text: '#FFFFFF', min: 141, max: 170, beepFreq: 880, beepTimes: 3, beepInterval: 100, vibPattern: [200], vibInterval: 1000 },
  4: { name: 'CRITICAL', label: 'Zone 4', bg: '#FF3B30', text: '#FFFFFF', min: 171, max: 220, beepFreq: 1200, beepTimes: 4, beepInterval: 80, vibPattern: [400,100,400], vibInterval: 400 },
};

// ===== STATE =====
let state = {
  bpm: 72,
  zone: 1,
  mode: 'demo', // 'demo' | 'bluetooth' | 'manual'
  audioEnabled: false,
  vibEnabled: false,
  simRunning: false,
  simInterval: null,
  simPhase: 0,
  simTarget: 72,
  bleDevice: null,
  bleChar: null,
  bleStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
  lastZone: 1,
  vibrateTimer: null,
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const app = $('app');
const bpmDisplay = $('bpm-display');
const zoneDisplay = $('zone-display');
const zoneName = $('zone-name');
const zoneRange = $('zone-range');
const zoneProgress = $('zone-progress');
const pulseGlow = $('pulse-glow');
const heartWrap = $('heart-wrap');
const intensityBar = $('intensity-bar');
const statusText = $('status-text');
const clockEl = $('clock');
const btnAudio = $('btn-audio');
const btnVib = $('btn-vib');
const iconVolOn = $('icon-vol-on');
const iconVolOff = $('icon-vol-off');
const manualSlider = $('manual-slider');
const manualValue = $('manual-value');
const btnDemoToggle = $('btn-demo-toggle');
const iconPlay = $('icon-play');
const iconPause = $('icon-pause');
const demoBtnText = $('demo-btn-text');
const btnBleConnect = $('btn-ble-connect');
const bleBtnText = $('ble-btn-text');
const bleError = $('ble-error');

// ===== AUDIO =====
let audioCtx = null;

function enableAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  state.audioEnabled = true;
  btnAudio.classList.add('on');
  btnAudio.classList.remove('off');
  iconVolOn.classList.remove('hidden');
  iconVolOff.classList.add('hidden');
  playBeep(440, 100, 1, 0);
}

function disableAudio() {
  state.audioEnabled = false;
  btnAudio.classList.remove('on');
  btnAudio.classList.add('off');
  iconVolOn.classList.add('hidden');
  iconVolOff.classList.remove('hidden');
}

function playBeep(freq, duration, times, interval) {
  if (!state.audioEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  for (let i = 0; i < times; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * (duration/1000 + interval/1000));
    const t = now + i * (duration/1000 + interval/1000);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
    gain.gain.linearRampToValueAtTime(0.3, t + duration/1000 - 0.01);
    gain.gain.linearRampToValueAtTime(0, t + duration/1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration/1000);
  }
}

// ===== VIBRATION =====
function enableVibration() {
  state.vibEnabled = true;
  btnVib.classList.add('on');
  btnVib.classList.remove('off');
  if (navigator.vibrate) navigator.vibrate(50);
}

function disableVibration() {
  state.vibEnabled = false;
  btnVib.classList.remove('on');
  btnVib.classList.add('off');
  if (state.vibrateTimer) { clearInterval(state.vibrateTimer); state.vibrateTimer = null; }
  if (navigator.vibrate) navigator.vibrate(0);
}

function doVibrate(pattern) {
  if (!state.vibEnabled || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch(e) {}
}

function updateVibration() {
  if (state.vibrateTimer) { clearInterval(state.vibrateTimer); state.vibrateTimer = null; }
  if (!state.vibEnabled) return;

  if (state.zone === 3) {
    const intensity = Math.min(1, Math.max(0, (state.bpm - ZONES[3].min) / (ZONES[3].max - ZONES[3].min)));
    const interval = Math.round(1200 - intensity * 800);
    const duration = Math.round(150 + intensity * 200);
    state.vibrateTimer = setInterval(() => doVibrate([duration]), interval);
  } else if (state.zone === 4) {
    state.vibrateTimer = setInterval(() => doVibrate(ZONES[4].vibPattern), ZONES[4].vibInterval);
  }
}

// ===== ZONE LOGIC =====
function getZone(bpm) {
  if (bpm >= ZONES[4].min) return 4;
  if (bpm >= ZONES[3].min) return 3;
  if (bpm >= ZONES[2].min) return 2;
  return 1;
}

function updateZone() {
  const newZone = getZone(state.bpm);
  const prevZone = state.zone;
  state.zone = newZone;

  const z = ZONES[newZone];

  // Background color
  if (newZone === 4) {
    app.classList.add('zone4-flash');
    const excess = state.bpm - ZONES[4].min;
    const speed = Math.max(0.12, 0.5 - excess * 0.006);
    app.style.setProperty('--flash-speed', speed + 's');
    app.style.backgroundColor = '';
  } else {
    app.classList.remove('zone4-flash');
    app.style.backgroundColor = z.bg;
    app.style.setProperty('--flash-speed', '0.5s');
  }

  // Text color
  app.style.color = z.text;

  // Glow color
  const glowColor = newZone === 4
    ? 'rgba(255,59,48,0.5)'
    : (newZone === 1 ? 'rgba(40,205,65,0.15)' : 'rgba(255,255,255,0.12)');
  app.style.setProperty('--glow-color', glowColor);

  // Pulse duration
  const pulseSec = (60 / Math.max(state.bpm, 40)).toFixed(2) + 's';
  app.style.setProperty('--pulse-dur', pulseSec);

  // BPM display
  bpmDisplay.textContent = state.bpm || '--';
  bpmDisplay.style.color = z.text;

  // Zone display
  zoneDisplay.textContent = newZone;
  zoneDisplay.style.color = z.text;
  zoneName.textContent = z.name;
  zoneName.style.color = z.text;

  // Zone range text
  if (z.min === 0) zoneRange.textContent = '< ' + z.max + ' BPM';
  else zoneRange.textContent = z.min + '+ BPM';
  zoneRange.style.color = z.text;

  // Progress bar
  const range = z.max - z.min;
  const pos = state.bpm - z.min;
  const pct = Math.min(100, Math.max(0, (pos / range) * 100));
  zoneProgress.style.width = pct + '%';
  zoneProgress.style.background = z.text;

  // Intensity bar (Zone 3 only)
  if (newZone === 3) {
    intensityBar.classList.add('show');
    intensityBar.classList.remove('hidden');
    intensityBar.style.color = z.text;
    const segs = intensityBar.querySelectorAll('.intensity-seg');
    segs.forEach((seg, i) => {
      const threshold = ZONES[3].min + (i * 6);
      seg.classList.toggle('active', state.bpm >= threshold);
    });
  } else {
    intensityBar.classList.remove('show');
  }

  // Zone transition alerts
  if (newZone !== prevZone) {
    if (state.audioEnabled && z.beepTimes > 0) {
      playBeep(z.beepFreq, 120, z.beepTimes, z.beepInterval);
    }
    if (state.vibEnabled && z.vibPattern.length > 0) {
      doVibrate(z.vibPattern);
    }
    updateVibration();
  }
}

// ===== DEMO SIMULATOR =====
function startDemo() {
  state.simRunning = true;
  state.simPhase = 0;
  state.simTarget = 72;
  iconPlay.classList.add('hidden');
  iconPause.classList.remove('hidden');
  demoBtnText.textContent = 'Pause';

  state.simInterval = setInterval(() => {
    state.simPhase += 200;

    // Phase machine: rest -> warmup -> climb -> peak -> recover -> loop
    if (state.simPhase < 3000) {
      state.simTarget = 70 + Math.random() * 10; // rest ~70
    } else if (state.simPhase < 7000) {
      state.simTarget = 100 + Math.random() * 15; // warmup ~110
    } else if (state.simPhase < 11000) {
      state.simTarget = 130 + Math.random() * 15; // climb ~140
    } else if (state.simPhase < 16000) {
      state.simTarget = 155 + Math.random() * 20; // peak ~170
    } else if (state.simPhase < 20000) {
      state.simTarget = 175 + Math.random() * 20; // critical ~190
    } else {
      state.simPhase = 0; // loop
      state.simTarget = 72;
    }

    // Smooth toward target
    const diff = state.simTarget - state.bpm;
    state.bpm = Math.round(state.bpm + diff * 0.08 + (Math.random() - 0.5) * 2);
    state.bpm = Math.max(50, Math.min(200, state.bpm));
    updateZone();
  }, 200);
}

function stopDemo() {
  state.simRunning = false;
  if (state.simInterval) { clearInterval(state.simInterval); state.simInterval = null; }
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');
  demoBtnText.textContent = 'Start';
}

// ===== BLUETOOTH =====
const HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_CHAR = '00002a37-0000-1000-8000-00805f9b34fb';

async function connectBLE() {
  if (!navigator.bluetooth) {
    showBleError('Web Bluetooth not supported. Use Chrome, Edge, or Opera on Android/Windows/Mac.');
    return;
  }
  state.bleStatus = 'connecting';
  updateBleUI();

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [HR_SERVICE] }],
      optionalServices: [HR_SERVICE],
    });
    state.bleDevice = device;
    device.addEventListener('gattserverdisconnected', onBleDisconnected);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(HR_SERVICE);
    const characteristic = await service.getCharacteristic(HR_CHAR);
    state.bleChar = characteristic;

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', onHrData);

    state.bleStatus = 'connected';
    hideBleError();
    updateBleUI();
    statusText.textContent = device.name || 'HR Monitor';
  } catch (err) {
    const msg = err.message || 'Unknown error';
    if (msg.includes('cancel') || msg.includes('User')) {
      state.bleStatus = 'disconnected';
      updateBleUI();
      return;
    }
    showBleError(msg);
    state.bleStatus = 'error';
    updateBleUI();
  }
}

function disconnectBLE() {
  if (state.bleChar) {
    try { state.bleChar.stopNotifications(); } catch(e) {}
    state.bleChar = null;
  }
  if (state.bleDevice?.gatt?.connected) {
    state.bleDevice.gatt.disconnect();
  }
  state.bleDevice = null;
  onBleDisconnected();
}

function onBleDisconnected() {
  state.bleStatus = 'disconnected';
  state.bleDevice = null;
  state.bleChar = null;
  updateBleUI();
  statusText.textContent = 'BLE';
}

function onHrData(event) {
  const value = event.target.value;
  if (!value) return;
  const flags = value.getUint8(0);
  const is16bit = flags & 0x01;
  const hr = is16bit ? value.getUint16(1, true) : value.getUint8(1);
  state.bpm = hr;
  updateZone();
}

function updateBleUI() {
  const s = state.bleStatus;
  if (s === 'connected') {
    bleBtnText.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      Disconnect
    `;
    btnBleConnect.disabled = false;
  } else if (s === 'connecting') {
    bleBtnText.innerHTML = `<div class="spinner"></div> Scanning...`;
    btnBleConnect.disabled = true;
  } else {
    bleBtnText.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline></svg>
      Connect BLE HR Monitor
    `;
    btnBleConnect.disabled = false;
  }
}

function showBleError(msg) {
  bleError.textContent = msg;
  bleError.classList.remove('hidden');
}
function hideBleError() {
  bleError.classList.add('hidden');
}

// ===== MODE SWITCHING =====
function setMode(mode) {
  if (mode === state.mode) return;

  // Cleanup current mode
  if (state.mode === 'demo') stopDemo();
  if (state.mode === 'bluetooth') disconnectBLE();

  state.mode = mode;

  // Update tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  // Update panels
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.add('hidden'));
  $('panel-' + mode).classList.remove('hidden');

  // Update status text
  const labels = { demo: 'Demo Mode', bluetooth: 'BLE', manual: 'Manual' };
  statusText.textContent = labels[mode];

  // Start demo if entering demo mode
  if (mode === 'demo') startDemo();

  // Reset BPM for manual
  if (mode === 'manual') {
    state.bpm = parseInt(manualSlider.value) || 85;
    updateZone();
  }
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== EVENT LISTENERS =====
btnAudio.addEventListener('click', () => {
  if (state.audioEnabled) disableAudio(); else enableAudio();
});

btnVib.addEventListener('click', () => {
  if (state.vibEnabled) disableVibration(); else enableVibration();
});

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

btnDemoToggle.addEventListener('click', () => {
  if (state.simRunning) stopDemo(); else startDemo();
});

btnBleConnect.addEventListener('click', () => {
  if (state.bleStatus === 'connected') disconnectBLE(); else connectBLE();
});

manualSlider.addEventListener('input', () => {
  const val = parseInt(manualSlider.value);
  state.bpm = val;
  manualValue.textContent = val;
  updateZone();
});

// ===== INIT =====
function init() {
  state.bpm = 72;
  updateZone();
  startDemo();

  btnAudio.classList.add('off');
  btnVib.classList.add('off');
}

init();
