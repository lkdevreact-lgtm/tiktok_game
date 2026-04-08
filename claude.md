# TikTok Live Game — Project Documentation for Claude

> Tài liệu này mô tả toàn bộ kiến trúc, luồng dữ liệu và các file quan trọng của project để Claude có thể hiểu và hỗ trợ phát triển một cách chính xác.

---

## Tổng quan Project

**TikTok Live Game** là ứng dụng game 3D real-time tích hợp với TikTok Live. Khi người xem trên TikTok gửi quà, các phi thuyền sẽ xuất hiện trong game và tấn công enemy boss. Mục tiêu là tiêu diệt boss trước khi boss tiếp cận phòng thủ.

### Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Three.js, @react-three/fiber, @react-three/drei, TailwindCSS v4 |
| Backend | Node.js, Express, Socket.IO, tiktok-live-connector |
| State | React Context API (không dùng Zustand) |
| Realtime | Socket.IO (WebSocket + polling fallback) |
| Storage | JSON files trên filesystem (không có DB) |

### Cách chạy

```bash
# Backend (port 8888)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

---

## Backend (`/backend`)

### Entry Point: `server.js`
- Express app + HTTP server
- Khởi tạo Socket.IO qua `initSocket(httpServer)`
- Mount API routes tại `/api`
- Port: `process.env.PORT || 8888`

### Architecture Flow

```
TikTok Live User sends Gift
        ↓
tiktokService.js (WebcastPushConnection)
        ↓  emit "gift" event
socket.js → io.to(socketId).emit("gift_received", giftData)
        ↓
Frontend socketClient.js → socket.on("gift_received")
        ↓
GameCanvas.jsx → handleGift() → spawnShip / bossHeal / bossShield
        ↓
GameScene.jsx → 3D animation
```

### `socket/socket.js`
Socket.IO server. Lắng nghe 3 event từ client:
- `connect_tiktok` → gọi `connectTikTok(username, socketId, io)`
- `update_gift_mapping` → lưu `socket._giftMapping`
- `disconnect` → gọi `disconnectTikTok(socketId)`

Export: `initSocket(httpServer)`, `getIO()`

### `services/tiktokService.js`
Quản lý kết nối TikTok Live qua `tiktok-live-connector`.

- `connections` Map: `socketId → WebcastPushConnection`
- `connectTikTok(username, socketId, io)`: tạo connection mới, lắng nghe event `gift` và forward qua socket
- `disconnectTikTok(socketId)`: ngắt kết nối và xóa khỏi Map

**Gift data format** được emit qua socket:
```js
{
  giftId, giftName, diamonds,
  userId, uniqueId, nickname,
  repeatCount, imgUrl, avatarUrl
}
```

### `routes/index.js`
Tất cả API routes đều có prefix `/api`:

| Method | Path | Controller | Mô tả |
|--------|------|------------|-------|
| GET | `/gifts` | giftController | Lấy danh sách gifts |
| PUT | `/gifts/:giftId` | giftController | Toggle active gift |
| POST | `/connect` | connectController | Kết nối TikTok (HTTP fallback) |
| POST | `/disconnect` | connectController | Ngắt kết nối |
| GET | `/models` | modelController | Lấy danh sách models |
| POST | `/models/upload` | modelController | Upload GLB + icon |
| POST | `/models/:id/glb` | modelController | Thay file GLB |
| POST | `/models/:id/icon` | modelController | Upload icon mới |
| PUT | `/models/:id` | modelController | Cập nhật metadata |
| DELETE | `/models/:id` | modelController | Xóa model |

### `controllers/modelController.js`
CRUD cho models. Dữ liệu lưu tại:
- `backend/data/models.json` — database JSON
- `frontend/public/models/` — file GLB
- `frontend/public/images/icons/` — file icon ảnh

**Model schema:**
```js
{
  id, filename, label, emoji, iconUrl,
  role: "ship" | "boss",
  path, scale, gunTipOffset, rotationY,
  bulletColor, damage, fireRate,
  gifts: [giftId],        // gift IDs map ship này
  healGifts: [giftId],    // gift IDs hồi máu boss
  shieldGifts: [giftId],  // gift IDs kích hoạt khiên boss
  builtIn: boolean,
  active: boolean,
  uploadedAt, updatedAt
}
```

**Multer config:**
- `upload` → GLB only, max 150MB → `/models/`
- `uploadIcon` → image only (jpg/png/webp/gif/svg), max 5MB → `/images/icons/`
- `uploadModelWithIcon` → multipart với cả 2 field

### `controllers/giftController.js`
CRUD đơn giản cho `backend/data/gifts.json`.
- `getGifts`: trả về toàn bộ gifts
- `updateGift`: cập nhật field `active` của gift theo `giftId`

### `controllers/connectController.js`
HTTP fallback cho kết nối TikTok (thường dùng socket trực tiếp).

---

## Frontend (`/frontend/src`)

### Entry: `main.jsx` → `App.jsx`

`App.jsx` wrap providers theo thứ tự:
```
ModelProvider → GiftProvider → GameProvider → AppInner
```

`AppInner` lắng nghe socket `tiktok_connected`:
- Nếu `connected = false` → render `<ConnectForm />`
- Nếu `connected = true` → render `<GameCanvas />`

> ⚠️ **Chú ý logic ngược**: `connected = false` mới hiện ConnectForm. Đây là deliberate để hiển thị form trước khi có kết nối.

### State Management: React Context

#### `store/gameStore.jsx` — `GameContext`
State game runtime:
```js
{
  connected, setConnected,
  username, setUsername,
  bossHp, setBossHp,        // 0–100
  bossShield, setBossShield, // boolean
  gameStatus, setGameStatus, // "idle" | "playing" | "win" | "lose"
  shipCount, setShipCount,
  notifications, addNotification,
  resetGame
}
```
Hook: `useGame()` từ `hooks/useGame.js`

#### `store/modelStore.jsx` — `ModelContext`
Quản lý danh sách ship/boss models:
```js
{
  models, loading,
  allShipModels, allBossModels,
  shipModels,           // ship đang active
  activeBossModel,      // boss đang được chọn
  activeBossId,
  giftModelMap,         // { giftId: model } — gift → ship mapping
  bossHealGiftMap,      // { giftId: true } — heal gifts
  bossShieldGiftMap,    // { giftId: true } — shield gifts
  addModel, updateModel, removeModel,
  toggleShipActive, setActiveBoss, refreshModels
}
```
- Load từ `GET /api/models` khi mount
- Cache vào `localStorage["modelsCache"]`
- Persist changes lên server qua PUT/DELETE API
- Hook: `useModels()` từ `hooks/useModels.js`

#### `store/giftStore.jsx` — `GiftContext`
```js
{
  gifts, activeGifts, loading,
  toggleGiftActive, fetchGifts
}
```
- Load từ `GET /api/gifts`, lọc chỉ gifts có `diamonds > 0`
- Sort theo diamonds tăng dần
- default `active = true`
- Hook: `useGifts()` từ `hooks/useGifts.js`

### `socket/socketClient.js`
Singleton Socket.IO client:
```js
const socket = io(API_URL, { autoConnect: true, transports: ["websocket", "polling"] });
export default socket;
```

### `components/GameCanvas.jsx`
Component trung tâm kết nối socket events với 3D game scene.

**Ref pattern để tránh stale closures:**
```js
const spawnShipRef = useRef(null);
const bossHealRef = useRef(null);
const bossShieldRef = useRef(null);
const giftModelMapRef = useRef(giftModelMap);   // updated via useEffect
const bossHealGiftMapRef = useRef(bossHealGiftMap);
const bossShieldGiftMapRef = useRef(bossShieldGiftMap);
```

**Gift handling logic** (`socket.on("gift_received", handleGift)`):
1. Nếu `giftId` trong `bossHealGiftMap` → gọi `bossHealRef.current()`
2. Nếu `giftId` trong `bossShieldGiftMap` → gọi `bossShieldRef.current()`
3. Nếu `giftId` trong `giftModelMap` → spawn ship(s)
   - `repeatCount` ships, mỗi cái delay 150ms
   - Max 5 ships per gift

**Dev tools** (global functions):
- `window.__simulateGift(giftId)` — simulate receiving a gift

**Canvas camera**: `position: [0, 1.5, 9]`, `fov: 55`

### `game/GameScene.jsx` — Core Game Logic

Component chính chứa toàn bộ game loop (785 lines).

#### Refs (không trigger re-render):
```js
bossRef            // THREE.Group của boss
bossHpRef          // HP thực tế (0-100)
shipsRef           // mảng ship objects
bulletsRef         // mảng bullet objects
explosionsRef      // mảng explosion particles
gameActiveRef      // boolean, có đang chạy không
statusRef          // "idle" | "playing" | "win" | "lose"
bossOrigMatsRef    // materials gốc của boss (để restore sau flash)
bossFlashStateRef  // "none" | "red" | "green"
bossShieldActiveRef
bossShieldEndRef   // timestamp ms
```

#### Ship Object Structure:
```js
{
  id: string,
  mesh: THREE.Group,
  aliveRef: { current: boolean },
  type: string,         // model id
  damage: number,
  fireRate: number,     // shots per second
  fireTimer: number,
  recoil: number,       // 0.0 -> 1.0 (trượt lùi về phía sau)
  recoilTarget: number, // 0.0 (hồi vị) hoặc 1.0 (giật mạnh)
  baseY: number,        // vị trí Y ban đầu
  hoverPhase: number,   // phase cho animation hover
  orbitPhaseX: number,  // phase cho bay lượn (banking)
  nickname: string,
  avatarUrl: string
}
```

#### Visual Effects (VFX) System:
- **Engine Pulse**: Toàn bộ mes có tên động cơ (`engine`, `glow`, `thruster`...) hoặc có `emissive` color sẽ nhấp nháy (pulse) theo nhịp thở. Tự động tìm và sửa lỗi `emissive` đen bằng cách copy base color.
- **Mega Exhaust Flares (Vệt Lửa)**:
    - Cấu trúc 2 lớp: **Outer Neon Shell** (quầng sáng ngoài) + **Inner White Core** (lõi năng lượng trắng rực).
    - **Root Attachment Strategy**: Flares được gắn trực tiếp vào ship root thay vì deep child meshes để tránh lỗi `Scale/Rotation` của model GLB.
    - **Fallback Logic**: Tự động gắn 1 vệt lửa tại tâm sau tàu nếu không tìm thấy mesh động cơ nào.
- **Deluxe Slide Recoil**: Hệ thống giật lùi 2 pha (Push Back nhanh và Drifting Forward chậm) mang lại cảm giác bắn điện ảnh, không bị giật lag (jitter).

#### Spawn System (Slot-based):
- `NUM_Y_SLOTS = 10`, `Y_RANGE = 8`
- Ships được phân bổ vào 10 rãnh Y, xoay vòng
- Jitter nhỏ `±0.15` để tự nhiên
- Z ngẫu nhiên `±1.0`
- Spawn tại `x = 7.0` (phía phải màn hình)
- Max ships: `SETTINGS_GAME.MAX_SHIPS = 60`

#### Game Loop (`useFrame`):
1. **Boss movement**: `boss.position.x += BOSS_SPEED * 60 * delta` → di chuyển sang phải
2. **Win/lose check**: boss.x >= `BOSS_END_X` (5.2) → "lose"
3. **Ship update**:
   - **Deluxe Recoil**: `ship.recoil` lướt mượt về `recoilTarget` (0.0 hoặc 1.0) bằng `Math.exp(-delta * speed)`.
   - **Positioning**: Vị trí cuối = `Orbital + Recoil offset`.
   - **Banking**: `ship.mesh.rotation.z` xoay nghiêng theo quỹ đạo orbit.
   - **Engine Pulse**: Modulate `emissiveIntensity` của động cơ theo sin wave.
   - **Flare Flicker**: Modulate `scale` và `opacity` của Exhaust Flares (Inner + Outer) ngẫu nhiên (seed qua `baseY`).
   - Fire bullet khi `fireTimer >= 1 / fireRate` + Trigger `recoilTarget = 1.0`.
4. **Bullet movement**: `bullet.mesh.position.add(bullet.velocity)`
5. **Collision detection**: AABB check giữa bullet và boss
6. **Boss flash**: đỏ khi trúng đạn, xanh khi heal
7. **Explosion particles**: fade out và cleanup

#### Boss Mechanics:
- **Heal**: `+3% HP` mỗi lần, cooldown 500ms, flash xanh lá
- **Shield**: cộng dồn thời gian, max 30s, đạn nổ nhưng không damage
- **HP loss check**: HP <= 0 → "win"

#### Settings (`utils/constant.js`):
```js
SETTINGS_GAME = {
  MAX_SHIPS: 60,
  BOSS_START_X: -11,
  BOSS_END_X: 5.2,
  BOSS_SPEED: 0.005,    // units/frame * 60
  BULLET_SPEED: 0.07,   // units/frame
}
```

### `game/BossModel.jsx`
Load boss GLB động theo `url` prop.
- Clone scene khi mount
- Set `scale` prop
- Expose `groupRef` qua `externalRef` (bossRef)

### `game/models.js`
Định nghĩa geometry Three.js cho built-in models (procedural, không dùng GLB):
- `createSpaceship1()` — Fighter cyan
- `createSpaceship2()` — Cruiser purple
- `createSpaceship3()` — Destroyer gold
- `createBoss()` — Built-in boss (octahedron + spikes)
- `createBullet(color)` — Sphere + trail
- `createExplosion(position, color)` — 12 particles

> **Lưu ý**: Các hàm này tồn tại nhưng game hiện tại chủ yếu dùng GLB models qua `useShipModels`. Built-in procedural models chỉ là fallback.

### `hooks/useShipModels.js`
Dynamic GLB loader cho ship models.

- Preload 3 built-in GLBs khi module load
- Hỗ trợ tối đa 8 ship models song song (fixed hook calls)
- `cloneShipMesh(type)`: clone GLB scene, set scale/rotation, thêm `gun_tip` object
- `getBulletColor(type)`: lấy màu đạn từ model metadata
- Fallback: BoxGeometry cyan nếu load GLB thất bại

**Pattern đặc biệt**: Hooks phải được gọi unconditionally nên dùng 8 fixed slots:
```js
const s0 = useGlbScene(urlSlots[0]);
const s1 = useGlbScene(urlSlots[1]);
// ... đến s7
```

### `components/model-manager/`
Bảng quản lý models (UI admin):
- `ModelManagerPanel.jsx` — Container chính, tab Ship/Boss
- `ModelCard.jsx` — Card hiển thị từng model, toggle active, chọn boss
- `EditForm.jsx` — Form chỉnh sửa metadata (scale, fireRate, gifts, etc.)
- `UploadForm.jsx` — Form upload GLB mới + icon

---

## Data Flow: Khi nhận quà TikTok

```
TikTok Live → WebcastPushConnection.on("gift")
    → tiktokService emits "gift_received" qua Socket.IO
    → Frontend: socket.on("gift_received", handleGift)
    → GameCanvas.handleGift():
        - Check bossHealGiftMap → bossHealRef() → GameScene.onBossHeal handler
        - Check bossShieldGiftMap → bossShieldRef() → GameScene.onBossShield handler
        - Check giftModelMap → spawnShipRef() → GameScene.spawnShip()
    → GameScene.spawnShip():
        - Slot-based Y position
        - Clone GLB mesh từ useShipModels
        - Push vào shipsRef
        - Register label trong shipLabels state
    → useFrame game loop:
        - Ship hover animation
        - Fire bullets toward boss
        - Collision detection → damage boss
```

---

## Common Patterns & Gotchas

### 1. Ref Pattern cho Game Loop
Tất cả game state phải dùng `useRef` để tránh stale closures trong `useFrame`:
```js
// ĐÚNG: dùng ref trong game loop
bossHpRef.current = Math.max(0, bossHpRef.current - bullet.damage);
setBossHp(Math.round(bossHpRef.current * 10) / 10); // chỉ setState khi cần UI update

// SAI: trực tiếp setState trong useFrame
setBossHp(bossHp - bullet.damage); // bossHp sẽ stale
```

### 2. Material Flash System
Boss materials phải được lưu 1 lần duy nhất (lần đầu bị trúng đạn):
```js
if (!bossOrigMatsRef.current) {
  // chỉ lưu khi chưa có
  bossOrigMatsRef.current = savedMaterials;
}
```

### 3. Audio Pool Pattern
Pool 10 Audio objects để tránh lag khi nhiều đạn cùng bắn:
```js
const attackPool = Array.from({ length: 10 }, () => new Audio("/sound/sound_attack.mp3"));
```

### 4. Ship Label Sync
`ShipLabel` component dùng `useFrame` để sync vị trí với ship mesh:
```js
groupRef.current.position.copy(mesh.position);
```

### 5. Boss Shield Stack
Thời gian shield **cộng dồn** (không reset), giới hạn 30s:
```js
const newDuration = Math.min(remaining + ADD_MS, MAX_MS);
```

---

## File Structure Quick Reference

```
tiktok_game/
├── backend/
│   ├── server.js              # Express entry point
│   ├── socket/socket.js       # Socket.IO server
│   ├── services/tiktokService.js  # TikTok connection manager
│   ├── controllers/
│   │   ├── modelController.js # Model CRUD + file upload
│   │   ├── giftController.js  # Gift CRUD
│   │   └── connectController.js # TikTok connect HTTP endpoint
│   ├── routes/index.js        # All API routes
│   └── data/
│       ├── models.json        # Model database
│       └── gifts.json         # Gift database
│
└── frontend/src/
    ├── App.jsx                # Root, Providers, socket listeners
    ├── socket/socketClient.js # Singleton socket.io client
    ├── store/
    │   ├── gameStore.jsx      # Game runtime state (Context)
    │   ├── modelStore.jsx     # Models state + API sync
    │   └── giftStore.jsx      # Gifts state + API sync
    ├── hooks/
    │   ├── useGame.js         # Access GameContext
    │   ├── useModels.js       # Access ModelContext
    │   ├── useGifts.js        # Access GiftContext
    │   └── useShipModels.js   # GLB loader + cloneShipMesh()
    ├── components/
    │   ├── GameCanvas.jsx     # Canvas wrapper + gift → spawn bridge
    │   ├── ConnectForm.jsx    # TikTok username form
    │   ├── Navbar.jsx         # Top navigation
    │   └── model-manager/     # Admin UI components
    ├── game/
    │   ├── GameScene.jsx      # Main game loop (785 lines)
    │   ├── BossModel.jsx      # Dynamic GLB boss loader
    │   └── models.js          # Procedural Three.js geometry
    └── utils/
        └── constant.js        # SETTINGS_GAME, API_URL, etc.
```

---

## TODO / Known Issues

- **Random ship movement**: **[MỘT PHẦN]** Đã thêm `recoil` và `banking` (nghiêng tàu). Cần hoàn thiện di chuyển quỹ đạo (Orbit) tự do quanh boss thay vì chỉ đứng yên trên X-axis.
- **Particle Refactor**: Nên chuyển explosions sang dùng InstancedMesh để tối ưu hiệu năng khi có nhiều ship bắn cùng lúc.
- **Boss Death Sequence**: Cần thêm chuỗi nổ nhiều giai đoạn (Multi-stage explosion) khi boss thua.
