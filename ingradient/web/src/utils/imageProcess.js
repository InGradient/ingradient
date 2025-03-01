  /**
   * DataURL을 Image 객체로 로딩해서 width, height를 추출
   */
  export function getImageSize(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }