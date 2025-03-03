const { app, BrowserWindow, autoUpdater, dialog } = require("electron");
const path = require("path");

const server = "https://update.electronjs.org"; 
const feed = `${server}/ingradient/ingradient/${process.platform}-${process.arch}/${app.getVersion()}`;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    const webAppPath = "http://localhost:3000"; // Next.js 서버가 실행되는 경로
    mainWindow.loadURL(webAppPath);

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    return mainWindow;
}

app.whenReady().then(() => {
    const mainWindow = createWindow();

    // 자동 업데이트 확인 (5초 후 실행)
    setTimeout(() => {
        checkForUpdates(mainWindow);
    }, 5000);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// 🔹 자동 업데이트 설정
autoUpdater.setFeedURL({ url: feed });

function checkForUpdates(mainWindow) {
    autoUpdater.checkForUpdates();

    autoUpdater.on("update-available", () => {
        dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Update Available",
            message: "A new update is available. Downloading now...",
        });
    });

    autoUpdater.on("update-downloaded", () => {
        dialog.showMessageBox(mainWindow, {
            type: "question",
            buttons: ["Install and Restart", "Later"],
            defaultId: 0,
            title: "Update Ready",
            message: "Update downloaded. Do you want to install it now?",
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on("error", (err) => {
        console.error("Update Error:", err);
    });
}
