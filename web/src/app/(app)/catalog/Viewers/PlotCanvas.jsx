import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { UMAP } from "umap-js";
import ColorCriteriaDropdown from "@/components/molecules/ColorCriteriaDropdown";
import SelectionPanel from "@/components/molecules/SelectionPanel";
import LoadingOverlay from "@/components/organisms/LoadingOverlay";
import useLoadingStore from "@/state/loading";

import { getMemoryUsage } from "@/utils/Optimizer";


export default function PlotCanvas({
  images,
  classes,
  selectedPoints,
  setSelectedPoints,
  loading,
  // setLoading,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const processedIdsRef = useRef(new Set());

  const [reducedData, setReducedData] = useState([]);
  const [umapBoundingBox, setUmapBoundingBox] = useState({
    minX: 0,
    maxX: 1,
    minY: 0,
    maxY: 1,
  });
  // const [loading, setLoading] = useState(true);

  const { startLoading, stopLoading, setProgress, setLoadingStatus } = useLoadingStore();

  const [criteria, setCriteria] = useState("Class");
  const [selectionBox, setSelectionBox] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState(null);
  const [mouseDownScreenPos, setMouseDownScreenPos] = useState(null);
  const [mouseDownDataPos, setMouseDownDataPos] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    startLoading();
    setLoadingStatus("Preparing Dimension Reduction...");
    if (processedIdsRef.current.size === images.length) {
      stopLoading();
      return;
    }

    setTimeout(async () => {
      setLoadingStatus("Filtering Images...");
      const validImages = images.filter((img) => img.model?.dinov2);
      const rowCount = validImages.length;

      if (rowCount === 0) {
        setReducedData([]);
        stopLoading();
        return;
      }

      const newImages = validImages.filter(
        (img) => !processedIdsRef.current.has(img.id)
      );

      if (newImages.length === 0) {
        stopLoading();
        return;
      }

      setLoadingStatus("Calculating Dimension Reduction...");
      getMemoryUsage();

      const colCount = validImages[0].model.dinov2.length;
      const bigFloat32Arr = new Float32Array(rowCount * colCount);

      validImages.forEach((img, i) => {
        bigFloat32Arr.set(img.model.dinov2, i * colCount);
      });

      const featureMatrix = Array.from({ length: rowCount }, (_, i) =>
        bigFloat32Arr.subarray(i * colCount, (i + 1) * colCount)
      );

      const nNeighbors = Math.min(15, rowCount - 1);
      const umap = new UMAP({ nComponents: 2, nNeighbors });

      console.log("⚡ Initializing UMAP computation...");

      // ✅ UMAP 초기화
      umap.initializeFit(featureMatrix);

      const totalIterations = 100; // UMAP 내부 iteration 수
      let progress = 0;

      async function runUMAP() {
        for (let i = 0; i < totalIterations; i++) {
          umap.step(); // ✅ 한 스텝씩 실행
          progress = Math.round(((i + 1) / totalIterations) * 100);
          setProgress(progress);

          // UI가 업데이트될 시간을 주기 위해 약간의 delay 추가
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }

      await runUMAP(); // ✅ 비동기 실행

      const embedding = umap.getEmbedding();

      const newReducedData = embedding.map(([x, y], idx) => ({
        ...validImages[idx],
        x,
        y,
      }));

      const minX = Math.min(...newReducedData.map((p) => p.x));
      const maxX = Math.max(...newReducedData.map((p) => p.x));
      const minY = Math.min(...newReducedData.map((p) => p.y));
      const maxY = Math.max(...newReducedData.map((p) => p.y));

      setReducedData(newReducedData);
      setUmapBoundingBox({ minX, maxX, minY, maxY });

      processedIdsRef.current = new Set(validImages.map((img) => img.id));

      console.log("✅ UMAP finished, stopping loading...");
      stopLoading();
      getMemoryUsage();
    }, 0);
  }, [images?.length]);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }

  function generatePastelJetPalette(steps) {
    const colors = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(255 * t + 180 * (1 - t));
      const g = Math.round(180 * (1 - t) + 150 * t);
      const b = Math.round(255 * (1 - t) + 150 * t);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return colors;
  }

  function computePointColor(point) {
    if (criteria === "Class") {
      const classColor = classes.find((c) => c.id === point.classId)?.color;
      return classColor || "grey";
    }
    if (criteria === "Edited At" || criteria === "Uploaded At") {
      const key = criteria === "Edited At" ? "updatedAt" : "uploadedAt";
      const arr = reducedData.map((p) => new Date(p[key]).getTime());
      const minDate = Math.min(...arr);
      const maxDate = Math.max(...arr);
      if (minDate === maxDate) return "rgb(180, 180, 255)";
      const dateVal = new Date(point[key]).getTime();
      const normalized = (dateVal - minDate) / (maxDate - minDate);
      const palette = generatePastelJetPalette(100);
      const colorIndex = Math.round(normalized * (palette.length - 1));
      return palette[colorIndex];
    }
    if (criteria === "Approval") {
      if (point.approval === "approved") return "green";
      if (point.approval === "rejected") return "red";
      return "gray";
    }
    return "grey";
  }

  const dataToCanvas = useCallback(
    (dataX, dataY) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const { width, height } = canvas;
      const marginRatio = 0.1;
      const plotWidth = width * (1 - 2 * marginRatio);
      const plotHeight = height * (1 - 2 * marginRatio);
      const plotSize = Math.min(plotWidth, plotHeight);
      const { minX, maxX, minY, maxY } = umapBoundingBox;
      const normX = (dataX - minX) / (maxX - minX || 1);
      const normY = (dataY - minY) / (maxY - minY || 1);
      return {
        x: offset.x + width * marginRatio + normX * plotSize * scale,
        y: offset.y + height * marginRatio + normY * plotSize * scale,
      };
    },
    [umapBoundingBox, offset, scale]
  );

  const canvasToData = useCallback(
    (canvasX, canvasY) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const { width, height } = canvas;
      const marginRatio = 0.1;
      const plotWidth = width * (1 - 2 * marginRatio);
      const plotHeight = height * (1 - 2 * marginRatio);
      const plotSize = Math.min(plotWidth, plotHeight);
      const { minX, maxX, minY, maxY } = umapBoundingBox;
      const adjX = canvasX - offset.x - width * marginRatio;
      const adjY = canvasY - offset.y - height * marginRatio;
      const normX = adjX / (plotSize * scale);
      const normY = adjY / (plotSize * scale);
      return {
        x: normX * (maxX - minX) + minX,
        y: normY * (maxY - minY) + minY,
      };
    },
    [umapBoundingBox, offset, scale]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (reducedData.length === 0) return;
    reducedData.forEach((point) => {
      const { x, y } = dataToCanvas(point.x, point.y);
      ctx.fillStyle = computePointColor(point);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      if (selectedPoints.includes(point.id)) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    if (selectionBox) {
      const { x, y, width, height } = selectionBox;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.strokeRect(x, y, width, height);
    }
  }, [
    reducedData,
    dataToCanvas,
    computePointColor,
    selectedPoints,
    selectionBox,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      resizeCanvas();
      draw();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    resizeCanvas();
    draw();
  }, [reducedData, scale, offset, selectionBox, selectedPoints, criteria, draw]);

  function getMousePosition(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startAction(e) {
    e.preventDefault();
    const { x, y } = getMousePosition(e);
    if (e.button === 2) {
      setIsPanning(true);
      setPanStartOffset({ ...offset });
      setMouseDownScreenPos({ x, y });
    } else {
      setIsSelecting(true);
      setSelectionBox({ x, y, width: 0, height: 0 });
      setMouseDownDataPos(canvasToData(x, y));
    }
  }

  function updateAction(e) {
    const { x, y } = getMousePosition(e);
    if (isPanning && mouseDownScreenPos && panStartOffset) {
      setHoveredPoint(null);
      const dx = x - mouseDownScreenPos.x;
      const dy = y - mouseDownScreenPos.y; 
      setOffset({
        x: panStartOffset.x + dx,
        y: panStartOffset.y + dy,
      });      
      return;
    }
    if (isSelecting && selectionBox) {
      setSelectionBox((prev) => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y,
      }));
      return;
    }
    if (!isSelecting && !isPanning && reducedData.length > 0) {
      let found = null;
      const hoverRadius = 10;
      for (const p of reducedData) {
        const { x: cx, y: cy } = dataToCanvas(p.x, p.y);
        const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
        if (dist < hoverRadius) {
          found = p;
          break;
        }
      }
      if (found) {
        setHoveredPoint(found);
        setTooltipPos({ x, y });
      } else {
        setHoveredPoint(null);
      }
    }
  }

  function endAction(e) {
    const isShift = e.shiftKey;
    if (isPanning) {
      setIsPanning(false);
      setPanStartOffset(null);
      setMouseDownScreenPos(null);
      return;
    }
    if (isSelecting && selectionBox) {
      const { x, y, width, height } = selectionBox;
      if (Math.abs(width) < 5 && Math.abs(height) < 5 && mouseDownDataPos) {
        const clickRadius = 10;
        let clickedPoint = null;
        for (const p of reducedData) {
          const { x: cx, y: cy } = dataToCanvas(p.x, p.y);
          const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
          if (dist < clickRadius) {
            clickedPoint = p;
            break;
          }
        }
        if (clickedPoint) {
          if (isShift) {
            setSelectedPoints((prev) => {
              if (prev.includes(clickedPoint.id)) {
                return prev.filter((id) => id !== clickedPoint.id);
              }
              return [...prev, clickedPoint.id];
            });
          } else {
            setSelectedPoints([clickedPoint.id]);
          }
        } else if (!isShift) {
          setSelectedPoints([]);
        }
      } else {
        const left = Math.min(x, x + width);
        const right = Math.max(x, x + width);
        const top = Math.min(y, y + height);
        const bottom = Math.max(y, y + height);
        const newSelected = reducedData.filter((p) => {
          const { x: cx, y: cy } = dataToCanvas(p.x, p.y);
          return cx >= left && cx <= right && cy >= top && cy <= bottom;
        });
        if (isShift) {
          setSelectedPoints((prev) =>
            Array.from(new Set([...prev, ...newSelected.map((pp) => pp.id)]))
          );
        } else {
          setSelectedPoints(newSelected.map((pp) => pp.id));
        }
      }
      setSelectionBox(null);
      setIsSelecting(false);
      setMouseDownDataPos(null);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function wheelHandler(e) {
      e.preventDefault();
      const zoomFactor = 1.1;
      const minScale = 0.1;
      const maxScale = 10;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const newScale = Math.min(
        Math.max(scale * (e.deltaY > 0 ? 1 / zoomFactor : zoomFactor), minScale),
        maxScale
      );
      const scaleFactor = newScale / scale;
      setOffset((prev) => ({
        x: mouseX - scaleFactor * (mouseX - prev.x),
        y: mouseY - scaleFactor * (mouseY - prev.y),
      }));
      setScale(newScale);
    }
    canvas.addEventListener("wheel", wheelHandler, { passive: false });
    return () => canvas.removeEventListener("wheel", wheelHandler);
  }, [scale, offset]);

  function disableContextMenu(e) {
    e.preventDefault();
  }

  function generateColorBarInfo(points, c) {
    if (!["Edited At", "Uploaded At"].includes(c)) return null;
    const key = c === "Edited At" ? "updatedAt" : "uploadedAt";
    const dates = points.map((p) => new Date(p[key]).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const palette = generatePastelJetPalette(10);
    return {
      minDate: new Date(minDate).toLocaleDateString(),
      maxDate: new Date(maxDate).toLocaleDateString(),
      palette,
    };
  }

  const colorBarInfo = useMemo(
    () => generateColorBarInfo(reducedData, criteria),
    [reducedData, criteria]
  );

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: isPanning ? "grab" : "default",
          }}
          onMouseDown={startAction}
          onMouseMove={updateAction}
          onMouseUp={endAction}
          onMouseOut={endAction}
          onContextMenu={disableContextMenu}
        />
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              top: tooltipPos.y + 10,
              left: tooltipPos.x + 10,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "8px",
              borderRadius: "8px",
              pointerEvents: "none",
              fontSize: "12px",
              whiteSpace: "nowrap",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={hoveredPoint.imageURL}
              alt={hoveredPoint.filename}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "4px",
                marginBottom: "8px",
              }}
            />
            <span>{hoveredPoint.filename}</span>
          </div>
        )}
      </div>
      <ColorCriteriaDropdown
        criteria={criteria}
        setCriteria={setCriteria}
        colorBarInfo={colorBarInfo}
      />
      <SelectionPanel
        isVisible={selectedPoints.length > 0}
        selectedPoints={images.filter((img) => selectedPoints.includes(img.id))}
        hoveredPoint={hoveredPoint}
      />
    </>
  );
}
