const SETTINGS_KEY = 'tidehaven_settings';

const DEFAULT_SETTINGS = {
  sfx: {
    낚시시작: true,
    포획: true,
    채굴: true,
    요리: true,
    판매: true,
    입장: true,
    NPC: true,
    레벨업: true,
    수영: true,
  },
  canvasQuality: 'high', // 'low' | 'medium' | 'high'
  colorBlindMode: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, sfx: { ...DEFAULT_SETTINGS.sfx } };
    const s = JSON.parse(raw);
    return {
      sfx: { ...DEFAULT_SETTINGS.sfx, ...(s.sfx ?? {}) },
      canvasQuality: s.canvasQuality ?? 'high',
      colorBlindMode: s.colorBlindMode ?? false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, sfx: { ...DEFAULT_SETTINGS.sfx } };
  }
}

let _settings = loadSettings();
const _listeners = new Set();

export function getSettings() { return _settings; }

export function setSfxEnabled(key, enabled) {
  _settings = { ..._settings, sfx: { ..._settings.sfx, [key]: enabled } };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings));
  _listeners.forEach(fn => fn(_settings));
}

export function setCanvasQuality(q) {
  _settings = { ..._settings, canvasQuality: q };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings));
  _listeners.forEach(fn => fn(_settings));
}

export function setColorBlindMode(enabled) {
  _settings = { ..._settings, colorBlindMode: enabled };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings));
  _listeners.forEach(fn => fn(_settings));
}

export function isSfxEnabled(key) {
  return _settings.sfx[key] !== false;
}

export function subscribeSettings(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
