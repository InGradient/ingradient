"use client";

import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import ToolBar from "./Editors/ToolBar";

const ZoomedImageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 300px;  
  bottom: 0;
  background-color: var(--neutral-900);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ZoomedImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  max-height: 100%;
`;

const ZoomedImage = styled.img`
  /* 화면(오버레이) 내부에 맞추기 */
  max-width: calc(100vw - 300px); /* 오른쪽 패널 300px 제외한 최대 너비 */
  max-height: 100vh;             /* 화면 최대 높이 */
  object-fit: contain;           /* 종횡비 유지하며 축소/확대 */
  user-select: none;
  -webkit-user-drag: none;
`;

const CanvasOverlay = styled.canvas`
  position: absolute;
  pointer-events: none; /* 마우스 이벤트는 이미지/부모가 받도록 */
`;

const ResetButton = styled.button`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  transition: 0.3s;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

function ImageEditor({ 
  image, 
  saveImage,
  classes, 
  onClose 
}) {
  console.log("ImageEditor", image);
  const [boundingBoxes, setBoundingBoxes] = useState(image.boundingBoxes || []);
  const [points, setPoints] = useState(image.points || []);
  const [masks, setMasks] = useState(image.masks || []);

  console.log("points", points);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [mode, setMode] = useState("bbox");

  const MIN_BBOX_SIZE = 5; 
  const brushRadius = 10;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // imageRef와 boundingBoxesRef 등은 최신 state 저장용
  const imageRef = useRef(image); 
  const boundingBoxesRef = useRef([]);
  const pointsRef = useRef([]);
  const masksRef = useRef([]);

  /* 
    image가 변경될 때마다 라벨 상태를 업데이트. 
    (image.classId 등의 변화도 반영) 
  */
  useEffect(() => {
    setBoundingBoxes(image.boundingBoxes ?? []);
    setPoints(image.points ?? []);
    setMasks(image.masks ?? []);
  }, [image.id]);

  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  useEffect(() => { boundingBoxesRef.current = boundingBoxes; }, [boundingBoxes]);
  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { masksRef.current = masks; }, [masks]);

  // 화면 리사이즈 or 데이터 변동 시 Canvas 크기 재조정 + 다시 그리기
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      const imgElement = imgRef.current;
      if (!canvas || !imgElement) return;

      // 이미지 실제 화면 표시 크기
      const displayedWidth = imgElement.offsetWidth;
      const displayedHeight = imgElement.offsetHeight;

      canvas.width = displayedWidth;
      canvas.height = displayedHeight;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, displayedWidth, displayedHeight);
      drawAllAnnotations(ctx);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [image, boundingBoxes, points, masks]);

  /** 어노테이션(Boxes, Points, Masks) 모두 그리기 */
  const drawAllAnnotations = (ctx) => {
    const { width, height } = ctx.canvas;

    // 1) BoundingBox
    boundingBoxes.forEach((box) => {
      const classItem = Object.values(classes).find((c) => c.id === box.classId);
      ctx.strokeStyle = classItem?.color || "grey";
      ctx.lineWidth = 2;

      const absMinX = box.minX * width;
      const absMinY = box.minY * height;
      const absMaxX = box.maxX * width;
      const absMaxY = box.maxY * height;
      ctx.strokeRect(absMinX, absMinY, absMaxX - absMinX, absMaxY - absMinY);
    });

    // 2) Points
    points.forEach((pt) => {
      const classItem = Object.values(classes).find((c) => c.id === pt.classId);
      const color = classItem?.color || "grey";
      const radius = 5;

      // 검은색 외곽선
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, radius + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 내부 색
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // 3) Segmentation Masks
    masks.forEach((stroke) => {
      stroke.circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(circle.x * width, circle.y * height, brushRadius, 0, 2 * Math.PI);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      });
    });
  };

  /** Mouse Down */
  const handleMouseDown = (e) => {
    // classId가 null이면 라벨 추가 불가
    if (image.classId === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getMouseOnCanvas(e);

    if (mode === "bbox") {
      setIsDrawing(true);
      setStartPoint({ x, y });
    } else if (mode === "point") {
      const relX = x / canvas.width;
      const relY = y / canvas.height;
      setPoints((prev) => [
        ...prev,
        { x: relX, y: relY, classId: image.classId },
      ]);
    } else if (mode === "segmentation") {
      setIsDrawing(true);

      const relX = x / canvas.width;
      const relY = y / canvas.height;
      const classItem = classes[image.classId];
      const brushColor = classItem?.color || "green";

      setMasks((prev) => [
        ...prev,
        {
          color: brushColor,
          circles: [{ x: relX, y: relY }],
        },
      ]);
    }
  };

  /** Mouse Move */
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAllAnnotations(ctx);

    const { x, y } = getMouseOnCanvas(e);
    const classItem = classes[image.classId];
    const classColor = classItem?.color || "grey";

    // 3) 십자선
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = classColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    // bbox 미리보기 or segmentation 드래그
    if (mode === "bbox" && isDrawing && startPoint) {
      ctx.strokeStyle = classColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
    } else if (mode === "segmentation" && isDrawing) {
      // brush painting
      const relX = x / canvas.width;
      const relY = y / canvas.height;
      setMasks((prev) => {
        const strokes = [...prev];
        const last = strokes[strokes.length - 1];
        if (last) {
          last.circles.push({ x: relX, y: relY });
        }
        return strokes;
      });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAllAnnotations(ctx);
    }

    // segmentation 브러시 미리보기
    if (mode === "segmentation") {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = classColor;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  };

  /** Mouse Up */
  const handleMouseUp = (e) => {
    if (mode === "bbox" && isDrawing && startPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getMouseOnCanvas(e);

      const minX = Math.min(startPoint.x, x);
      const minY = Math.min(startPoint.y, y);
      const maxX = Math.max(startPoint.x, x);
      const maxY = Math.max(startPoint.y, y);

      const width = maxX - minX;
      const height = maxY - minY;

      if (width < MIN_BBOX_SIZE || height < MIN_BBOX_SIZE) {
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }
      const relMinX = minX / canvas.width;
      const relMinY = minY / canvas.height;
      const relMaxX = maxX / canvas.width;
      const relMaxY = maxY / canvas.height;

      setBoundingBoxes((prev) => [
        ...prev,
        {
          minX: relMinX,
          minY: relMinY,
          maxX: relMaxX,
          maxY: relMaxY,
          classId: image.classId,
        },
      ]);

      setIsDrawing(false);
      setStartPoint(null);
    }

    if (mode === "segmentation") {
      setIsDrawing(false);
    }
  };

  /** 컴포넌트 언마운트 or 이미지 변경 시 라벨 저장 */
  useEffect(() => {
    return () => {
      saveImage({
        ...imageRef.current,
        boundingBoxes: boundingBoxesRef.current,
        points: pointsRef.current,
        masks: masksRef.current,
      });
    };
  }, [image.id]);

  /** Helper */
  const getMouseOnCanvas = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleResetAnnotations = () => {
    setBoundingBoxes([]);
    setPoints([]);
    setMasks([]);
  };

  return (
    <ZoomedImageOverlay onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <ToolBar mode={mode} setMode={setMode} />
      <ZoomedImageContainer ref={containerRef}>
        <ImageWrapper>
          <ZoomedImage ref={imgRef} src={image.imageURL} alt="Zoomed" />
          <CanvasOverlay ref={canvasRef} />
        </ImageWrapper>
        <ResetButton onClick={handleResetAnnotations}>Reset</ResetButton>
      </ZoomedImageContainer>
    </ZoomedImageOverlay>
  );
}

export default ImageEditor;
