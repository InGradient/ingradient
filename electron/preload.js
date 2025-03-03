const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    send: (channel, data) => {
        // 보안 문제 방지를 위해 특정 채널만 허용
        if (["message"].includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
});
