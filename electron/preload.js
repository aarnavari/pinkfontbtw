const fs = require("fs");
const path = require("path");
const { app } = require("@electron/remote");

function getBackupPath() {
  const userDataPath =
    process.env.SUBTEXT_USER_DATA_PATH ||
    path.join(process.env.HOME || "", "Library", "Application Support", "Subtext");

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  return path.join(userDataPath, "subtext-storage-backup.json");
}

function readBackup() {
  try {
    const backupPath = getBackupPath();

    if (!fs.existsSync(backupPath)) {
      return {};
    }

    const rawBackup = fs.readFileSync(backupPath, "utf8");
    return JSON.parse(rawBackup);
  } catch {
    return {};
  }
}

function writeBackup() {
  try {
    const backupPath = getBackupPath();
    const storageSnapshot = {};

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key) {
        storageSnapshot[key] = window.localStorage.getItem(key);
      }
    }

    fs.writeFileSync(backupPath, JSON.stringify(storageSnapshot, null, 2), "utf8");
  } catch {
    // keep app silent if backup fails
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const backup = readBackup();

  Object.entries(backup).forEach(([key, value]) => {
    if (typeof value === "string" && window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, value);
    }
  });

  const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
  const originalRemoveItem = window.localStorage.removeItem.bind(
    window.localStorage
  );
  const originalClear = window.localStorage.clear.bind(window.localStorage);

  window.localStorage.setItem = function patchedSetItem(key, value) {
    originalSetItem(key, value);
    writeBackup();
  };

  window.localStorage.removeItem = function patchedRemoveItem(key) {
    originalRemoveItem(key);
    writeBackup();
  };

  window.localStorage.clear = function patchedClear() {
    originalClear();
    writeBackup();
  };

  writeBackup();
});

window.addEventListener("beforeunload", writeBackup);
window.addEventListener("pagehide", writeBackup);
document.addEventListener("visibilitychange", writeBackup);
