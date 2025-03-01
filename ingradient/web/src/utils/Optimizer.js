export function getMemoryUsage() {
  if (performance.memory) {
    const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
    console.log(`🔹 현재 사용 중인 메모리: ${usedMB.toFixed(2)} MB`);
  } else {
    console.warn("🚨 메모리 사용량 측정을 지원하지 않는 환경입니다.");
  }
}