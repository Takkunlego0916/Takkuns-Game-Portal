const { app, BrowserWindow, Menu } = require("electron");

function createWindow() {

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false
    }
  });

  Menu.setApplicationMenu(null);

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
