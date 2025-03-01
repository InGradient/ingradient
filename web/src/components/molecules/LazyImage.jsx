import React from "react";
import { useInView } from "react-intersection-observer";

export function LazyImage({ src, alt, className }) {
  const [ref, inView] = useInView({
    triggerOnce: true,      // 한 번 로딩되면 다시는 관찰 필요 없음
    rootMargin: "100px",    // 화면 바깥 100px 정도 범위부터 미리 로드
  });

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {inView ? (
        <img className={className} alt={alt} src={src} />
      ) : (
        // 아직 화면에 보이지 않으면, 빈 div 혹은 Skeleton UI 등을 표시
        <div style={{ width: "100%", height: "100%", background: "#eee" }} />
      )}
    </div>
  );
}
