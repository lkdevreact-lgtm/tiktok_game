const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("https://tiktok-game-three.vercel.app/");

//   win.webContents.openDevTools();

  win.webContents.on("did-finish-load", () => {
    console.log("App loaded thành công");
  });
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error(" Load fail:", errorCode, errorDescription);
  });

  win.webContents.on("console-message", (event, level, message) => {
    console.log(" FE LOG:", message);
  });
}

app.whenReady().then(createWindow);