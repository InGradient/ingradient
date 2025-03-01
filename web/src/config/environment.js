const isElectron = () => {
  return typeof window !== "undefined" && window.process && window.process.type === "renderer";
};

const isOnline = () => {
  return navigator.onLine; // 브라우저가 온라인 상태인지 확인
};

export const getExecutionMode = () => {
  if (isElectron()) {
    return isOnline() ? "electron-online" : "electron-offline";
  }
  return isOnline() ? "web-online" : "web-offline";
};
