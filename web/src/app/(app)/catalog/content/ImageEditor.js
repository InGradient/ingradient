"use client";

import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNodes } from "@fortawesome/free-solid-svg-icons";
import { DashedBox, RotateLeft, XMark } from "@/components/atoms/Icon";

const ZoomedImageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 80px;
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
  overflow: hidden;
  max-width: 100%;
  max-height: 100%;
`;

const ZoomedImage = styled.img`
  /* 화면(오버레이) 내부에 맞추기 */
  max-width: calc(100vw - 300px);
  max-height: 100vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
`;

const CanvasOverlay = styled.canvas`
  position: absolute;
  pointer-events: none;
`;

const ToolContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.30);
  display: flex;
  gap: 8px;
  z-index: 1100;
  padding: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 56px;
  height: 56px;
  border: none;
  background: ${({ $active }) => ($active ? "var(--accent)" : "white")};
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $active }) => ($active ? "white" : "var(--color-black)")};
  transition: background-color 0.3s;
  &:hover {
    background-color: ${({ $active }) =>
      $active ? "var(--accent)" : "var(--accent-hover)"};
  }
`;

const CustomDashedBox = styled.div`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
  border: 3px solid ${({ $active }) => ($active ? "white" : "#000")};
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.30);
  color: white;
  border-radius: 8px;
  z-index: 1100; /* Add a high z-index here */
  &:hover {
    background: rgba(0, 0, 0, 0.40);
  }
`;

function ImageEditor({ 
  image,
  classes, 
  labels,
  saveLabels,
  onClose 
}) {
  const [boundingBoxes, setBoundingBoxes] = useState(image.boundingBoxes || []);
  const [keyPoints, setKeyPoints] = useState(image.points || []);
  const [segmentations, setSegmentations] = useState(image.segmentations || []);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [mode, setMode] = useState("bbox");

  const MIN_BBOX_SIZE = 5; 
  const brushRadius = 10;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const imageRef = useRef(image); 
  const boundingBoxesRef = useRef([]);
  const keyPointsRef = useRef([]);
  const segmentationsRef = useRef([]);

  const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;
  
  const imageURL = image.fileLocation ? `${SERVER_BASE_URL}/${image.fileLocation}` : null;

  useEffect(() => {
    setBoundingBoxes(labels[image.id]?.boundingBoxes || []);
    setKeyPoints(labels[image.id]?.keyPoints || []);
    setSegmentations(labels[image.id]?.segmentations || []);
  }, [image.id, labels]);  

  useEffect(() => { imageRef.current = image; }, [image]);

  useEffect(() => { boundingBoxesRef.current = boundingBoxes; }, [boundingBoxes]);
  useEffect(() => { keyPointsRef.current = keyPoints; }, [keyPoints]);
  useEffect(() => { segmentationsRef.current = segmentations; }, [segmentations]);

  useEffect(() => {
    return () => {
      saveLabels({
        imageId: image.id,
        boundingBoxes: boundingBoxesRef.current,
        keyPoints: keyPointsRef.current,
        segmentations: segmentationsRef.current,
      });
    };
  }, [image.id]);

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
  }, [image, boundingBoxes, keyPoints, segmentations]);

  const drawAllAnnotations = (ctx) => {
    const { width, height } = ctx.canvas;

    // 1) BoundingBox
    boundingBoxes.forEach((box) => {
      const classItem = Object.values(classes).find((c) => c.id === box.classId);
      ctx.strokeStyle = classItem?.color || "grey";
      ctx.lineWidth = 2;

      const absMinX = box.xMin * width;
      const absMinY = box.yMin * height;
      const absMaxX = box.xMax * width;
      const absMaxY = box.yMax * height;
      ctx.strokeRect(absMinX, absMinY, absMaxX - absMinX, absMaxY - absMinY);
    });

    // 2) Points
    keyPoints.forEach((pt) => {
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

    // 3) Segmentation
    segmentations.forEach((stroke) => {
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
    if (image.classIds.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getMouseOnCanvas(e);

    if (mode === "bbox") {
      setIsDrawing(true);
      setStartPoint({ x, y });
    } else if (mode === "point") {
      const relX = x / canvas.width;
      const relY = y / canvas.height;
      setKeyPoints((prev) => [
        ...prev,
        { x: relX, y: relY, classId: image.classIds[0] },
      ]);
    } else if (mode === "segmentation") {
      setIsDrawing(true);

      const relX = x / canvas.width;
      const relY = y / canvas.height;
      const classItem = classes[image.classIds[0]];
      const brushColor = classItem?.color || "green";

      setSegmentations((prev) => [
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
    const classItem = classes[image.classIds[0]];
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
      setSegmentations((prev) => {
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
          xMin: relMinX,
          yMin: relMinY,
          xMax: relMaxX,
          yMax: relMaxY,
          classId: image.classIds[0],
        },
      ]);

      setIsDrawing(false);
      setStartPoint(null);
    }

    if (mode === "segmentation") {
      setIsDrawing(false);
    }
  };

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
    setKeyPoints([]);
    setSegmentations([]);
  };

  return (
    <ZoomedImageOverlay onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <CloseButton onClick={onClose}>
        <XMark height="17" width="17" />
      </CloseButton>
      <ZoomedImageContainer ref={containerRef}>
        <ImageWrapper>
          <ZoomedImage ref={imgRef} src={imageURL} alt="Zoomed" />
          <CanvasOverlay ref={canvasRef} />
        </ImageWrapper>
        <ToolContainer>
          <ButtonGroup>
            <IconButton onClick={() => setMode("bbox")} $active={mode === "bbox"}>
              <CustomDashedBox $active={mode === "bbox"} />
            </IconButton>
            <IconButton onClick={() => setMode("point")} $active={mode === "point"}>
              <FontAwesomeIcon icon={faCircleNodes} style={{ fontSize: "20px" }} />
            </IconButton>
          </ButtonGroup>
          <div style={{ width: "16px" }} />
          <IconButton onClick={handleResetAnnotations}>
            <RotateLeft />
          </IconButton>
        </ToolContainer>
      </ZoomedImageContainer>
    </ZoomedImageOverlay>
  );
}

export default ImageEditor;
