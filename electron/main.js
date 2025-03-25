const { app, BrowserWindow, autoUpdater, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let uvicornProcess;

function startUvicorn() {
    uvicornProcess = spawn('uvicorn', ['server.main:app', '--host', '0.0.0.0', '--port', '8000'], {
        shell: true,
        // 필요에 따라 cwd(working directory) 지정 가능
    });

    uvicornProcess.stdout.on('data', (data) => {
        console.log(`uvicorn: ${data}`);
    });
    
    uvicornProcess.stderr.on('data', (data) => {
        console.error(`uvicorn error: ${data}`);
    });
    
    uvicornProcess.on('close', (code) => {
        console.log(`uvicorn process exited with code ${code}`);
    });
}

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

    // 프론트엔드 개발 서버가 http://localhost:3000 에서 실행되고 있다고 가정
    mainWindow.loadURL("http://localhost:3000");

    mainWindow.on("closed", () => {
        // 창이 닫힐 때 uvicorn 프로세스 종료
        if (uvicornProcess) {
            uvicornProcess.kill();
        }
    });

    return mainWindow;
}

app.whenReady().then(() => {
    // 백엔드 서버 시작
    startUvicorn();
    
    const mainWindow = createWindow();

    // 자동 업데이트 확인 (예시)
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

autoUpdater.setFeedURL({ url: "https://update.electronjs.org/ingradient/ingradient/" + `${process.platform}-${process.arch}/${app.getVersion()}` });

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
