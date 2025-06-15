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

export const getServerBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_SERVER_BASE_URL && process.env.NEXT_PUBLIC_SERVER_PORT) {
      return `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}`;
    }
    return process.env.NEXT_PUBLIC_SERVER_BASE_URL || `${window.location.origin}`;
  }
  if (process.env.NEXT_PUBLIC_SERVER_BASE_URL && process.env.NEXT_PUBLIC_SERVER_PORT) {
    return `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}`;
  }
  return process.env.NEXT_PUBLIC_SERVER_BASE_URL || "";
};