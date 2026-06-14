const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");

let mainWindow;
let server;

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

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: "pinkfontbtw",
    backgroundColor: "#fbf8f4",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    const url = await startStaticServer();
    await mainWindow.loadURL(url);
  } else {
    await mainWindow.loadURL("http://localhost:3000");
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