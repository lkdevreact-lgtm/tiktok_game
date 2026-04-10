// ── Attack Sound Pool ────────────────────────────────────────────
const POOL_SIZE = 10;
const attackPool = Array.from({ length: POOL_SIZE }, () => {
  const a = new Audio("/sound/sound_attack.mp3");
  a.volume = 0.35;
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
  a.volume = 0.4;
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
  a.volume = 0.6;
  return a;
});
let hiddenPoolIdx = 0;

export function playHiddenSound() {
  const audio = hiddenPool[hiddenPoolIdx];
  hiddenPoolIdx = (hiddenPoolIdx + 1) % HIDDEN_POOL_SIZE;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
