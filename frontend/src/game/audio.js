// ── Attack Sound Pool ────────────────────────────────────────────
// Pre-allocate pool để tránh delay khi bắn nhanh liên tục
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
