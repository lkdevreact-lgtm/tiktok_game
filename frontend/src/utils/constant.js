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
