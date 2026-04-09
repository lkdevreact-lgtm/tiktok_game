export const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8888";

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
  BOSS_START_X: -11,
  BOSS_END_X: 5.2,
  BOSS_SPEED: 0.05,
  BULLET_SPEED: 0.2,
};
