// ── Sound Volume Settings ─────────────────────────────────────────
const LS_KEY = "soundVolumes";

const DEFAULT_VOLUMES = {
  attack: 0.35,
  spawn: 0.4,
  hidden: 0.6,
  heal: 0.5,
};

function loadVolumes() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved === "object") return { ...DEFAULT_VOLUMES, ...saved };
  } catch { /* ignore */ }
  return { ...DEFAULT_VOLUMES };
}

let volumes = loadVolumes();

export function getVolumes() {
  return { ...volumes };
}

export function setVolumes(next) {
  volumes = { ...volumes, ...next };
  localStorage.setItem(LS_KEY, JSON.stringify(volumes));
  attackPool.forEach((a) => { a.volume = volumes.attack; });
  spawnPool.forEach((a) => { a.volume = volumes.spawn; });
  hiddenPool.forEach((a) => { a.volume = volumes.hidden; });
}

// ── Attack Sound Pool ────────────────────────────────────────────
const POOL_SIZE = 10;
const attackPool = Array.from({ length: POOL_SIZE }, () => {
  const a = new Audio("/sound/sound_attack.mp3");
  a.volume = volumes.attack;
  return a;
});
let poolIdx = 0;

export function playAttackSound() {
  const audio = attackPool[poolIdx];
  poolIdx = (poolIdx + 1) % POOL_SIZE;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ── Ship Spawn Sound Pool ─────────────────────────────────────────
const SPAWN_POOL_SIZE = 10;
const spawnPool = Array.from({ length: SPAWN_POOL_SIZE }, () => {
  const a = new Audio("/sound/start_sound.mp3");
  a.volume = volumes.spawn;
  return a;
});
let spawnPoolIdx = 0;

export function playSpawnSound() {
  const audio = spawnPool[spawnPoolIdx];
  spawnPoolIdx = (spawnPoolIdx + 1) % SPAWN_POOL_SIZE;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ── Ship Hidden (Dissolve) Sound Pool ────────────────────────────
const HIDDEN_POOL_SIZE = 10;
const hiddenPool = Array.from({ length: HIDDEN_POOL_SIZE }, () => {
  const a = new Audio("/sound/sound_hidden.mp3");
  a.volume = volumes.hidden;
  return a;
});
let hiddenPoolIdx = 0;

export function playHiddenSound() {
  const audio = hiddenPool[hiddenPoolIdx];
  hiddenPoolIdx = (hiddenPoolIdx + 1) % HIDDEN_POOL_SIZE;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ── Heal volume helper ───────────────────────────────────────────
export function getHealVolume() {
  return volumes.heal;
}

// ── Security Alert Sound (boss passes midscreen) ─────────────────
const securityAudio = new Audio("/sound/sound_security.mp3");
securityAudio.volume = 0.85;

export function playSecuritySound() {
  securityAudio.currentTime = 0;
  securityAudio.play().catch(() => {});
}
