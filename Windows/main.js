const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

let mainWindow = null;

function isAllowedLocalUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "file:") return false;
    const appRoot = path.resolve(__dirname);
    const targetPath = path.resolve(decodeURIComponent(parsed.pathname.replace(/^\/([A-Za-z]:)/, "$1")));
    return targetPath.startsWith(appRoot);
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
      spellcheck: false
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedLocalUrl(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            devTools: false,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webviewTag: false,
            allowRunningInsecureContent: false,
            spellcheck: false
          }
        }
      };
    }
    if (/^https?:$/.test(new URL(url).protocol)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isAllowedLocalUrl(targetUrl)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("did-create-window", (win) => {
    win.removeMenu();
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (isAllowedLocalUrl(url)) return { action: "allow" };
      if (/^https?:$/.test(new URL(url).protocol)) shell.openExternal(url);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (event, targetUrl) => {
      if (!isAllowedLocalUrl(targetUrl)) event.preventDefault();
    });
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("web-contents-created", (event, contents) => {
  contents.on("will-attach-webview", (e) => e.preventDefault());
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
