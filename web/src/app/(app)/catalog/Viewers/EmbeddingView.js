import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

function scaleValue(value, min, max, canvasSize) {
  if (max === min) return canvasSize / 2;
  return ((value - min) / (max - min)) * canvasSize;
}

const EmbeddingView = ({ imageData = [] }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1); // 줌 레벨
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // 드래그 오프셋
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (imageData.length === 0) return;

    const xVals = imageData.map((d) => d.model?.dino2d?.[0] ?? 0);
    const yVals = imageData.map((d) => d.model?.dino2d?.[1] ?? 0);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    // Transform for zoom and pan
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw points
    imageData.forEach((img) => {
      const [px, py] = img.model?.dino2d ?? [0, 0];
      const x = scaleValue(px, xMin, xMax, canvas.width);
      const y = scaleValue(py, yMin, yMax, canvas.height);

      ctx.beginPath();
      ctx.arc(x, canvas.height - y, 5 / scale, 0, 2 * Math.PI);
      ctx.fillStyle = "#3399ff";
      ctx.fill();
    });

    ctx.restore();
  }, [imageData, scale, offset]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newScale = scale - e.deltaY * zoomSpeed;
    setScale(Math.min(Math.max(newScale, 0.1), 10));
  }, [scale]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleWheel]);

  return (
    <Content>
      <CanvasWrapper>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </CanvasWrapper>
    </Content>
  );
};

export default EmbeddingView;