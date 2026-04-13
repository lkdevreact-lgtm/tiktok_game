export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

/** Prepend backend URL to asset paths (models, icons) so they load from the server */
export const assetUrl = (path) => path ? `${API_URL}${path}` : path;

export const ROUTE_URLS = {
  HOME: "/",
};

export const IMAGES = {
  LOGO: "/images/logoMeow.png",
  COIN: "/images/coin.png",
  SHIP_USER: "/images/default_spaceship.jpg",
  SHIP_BOSS: "/images/evil_boss.png",
  GAME_BUTTON: "/images/gameUI.png",
};

export const SETTINGS_GAME = {
  MAX_SHIPS: 60,
  BOSS_START_X: -10,
  BOSS_END_X: 5.2,
  BOSS_SPEED: 0.0005,
  BULLET_SPEED: 0.2,
};

/** Settings riêng cho màn hình Mobile (portrait / dọc)
 *  - Boss xuất hiện ở TRÊN (Y cao) → đi dần xuống (Y thấp hơn)
 *  - Ship user spawn ở vùng DƯỚI (Y âm)
 */
export const SETTINGS_GAME_MOBILE = {
  MAX_SHIPS: 30,
  // Boss bắt đầu từ trên cùng, tiến xuống dưới
  BOSS_START_Y: 7.0,
  BOSS_END_Y: -3.5,     // khi boss tới đây → LOSE
  BOSS_SPEED: 0.0004,   // chậm hơn chút vì khoảng cách nhỏ hơn
  BULLET_SPEED: 0.18,
  // Ship user spawn ở vùng dưới
  SHIP_BASE_Y: -5.5,    // Y cố định phía dưới cho ship
  SHIP_X_RANGE: 6.0,    // tổng bề rộng theo X cho ship (~±3.0)
  NUM_X_SLOTS: 8,       // số slot ngang
  CAMERA_ZOOM: 55,      // zoom nhỏ hơn một chút để thấy toàn cảnh dọc
};
