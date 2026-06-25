const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");

let mainWindow;
let server;

const DEV_PORT = 47831;
const PACKAGED_PORT = 47832;

function startStaticServer() {
  return new Promise((resolve) => {
    const outDir = path.join(__dirname, "../out");

    server = http.createServer((request, response) => {
      return handler(request, response, {
        public: outDir,
        rewrites: [
          { source: "/stars/folder", destination: "/stars/folder/index.html" },
          { source: "/stars", destination: "/stars/index.html" },
          { source: "/", destination: "/index.html" },
        ],
      });
    });

    server.listen(PACKAGED_PORT, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${PACKAGED_PORT}`);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: "Subtext",
    backgroundColor: "#fbf8f4",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    const url = await startStaticServer();
    await mainWindow.loadURL(url);
  } else {
    await mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});