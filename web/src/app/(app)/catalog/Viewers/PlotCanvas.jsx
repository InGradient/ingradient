import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import ColorCriteriaDropdown from "@/components/molecules/ColorCriteriaDropdown";
import SelectionPanel from "@/components/molecules/SelectionPanel";
import LoadingOverlay from "@/components/organisms/LoadingOverlay";
import useLoadingStore from "@/state/loading";

import { getMemoryUsage } from "@/utils/Optimizer";
import { compressFeatures } from "@/lib/api";

import { listModels } from "@/lib/api";

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

  // const processedIdsRef = useRef(new Set());

  const [reducedData, setReducedData] = useState([]);
  const [umapBoundingBox, setUmapBoundingBox] = useState({
    minX: 0,
    maxX: 1,
    minY: 0,
    maxY: 1,
  });
  // const [loading, setLoading] = useState(true);
  const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

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

  const imagesClassIdsSignature = useMemo(() => {
    return images.map((img) => {
      const sorted = (img.classIds || []).slice().sort().join(",");
      return `${img.id}:${sorted}`;
    }).join("|");
  }, [images]);
  
  // 2) reduceData와 images를 머지하는 함수
  function mergeReducedData(reducedData, images) {
    return reducedData.map((rdPoint) => {
      // 해당 rdPoint와 동일한 id를 가진 image를 찾는다
      const latestImage = images.find((img) => img.id === rdPoint.id);
      if (latestImage) {
        // x,y는 유지하고, 나머지 필드는 latestImage로 갱신
        return {
          ...rdPoint,
          ...latestImage,
          x: rdPoint.x, // 혹시 ...latestImage에 x,y가 없다면 이 라인은 생략 가능
          y: rdPoint.y,
        };
      } else {
        // 혹은 없는 경우 그대로 반환 or 제외
        return rdPoint; 
      }
    });
  }
  
  // 3) classIds가 바뀔 때만 merge해서 setReducedData
  useEffect(() => {
    if (reducedData.length > 0) {
      const newMerged = mergeReducedData(reducedData, images);
      setReducedData(newMerged);
    }
  }, [imagesClassIdsSignature]);

  /************************************************
   * 1) 서버로부터 2D 좌표(UMAP) 받아오기
   ************************************************/
  useEffect(() => {
    (async () => {
      if (!images || images.length === 0) {
        setReducedData([]);
        return;
      }

      // 1. 서버에 보낼 image IDs와 model id 준비
      // 예: dinov2 등 실제 모델 ID를 사용
      const modelCads = await listModels("feature_extract");
      const targetModel = modelCads.find((m) => m.name === "DinoV2");
      const modelId = targetModel?.id;
      const imageIds = images
        .filter((img) => img.model && img.model[modelId]) 
        .map((img) => img.id);

      if (imageIds.length === 0) {
        setReducedData([]);
        return;
      }

      try {
        startLoading();
        setLoadingStatus("Fetching compressed features from server...");
        setProgress(0);

        // 2. 서버에 요청
        const res = await compressFeatures(imageIds, modelId, "umap");

        if (res.error) {
          console.error("compressFeatures error:", res.error);
          stopLoading();
          return;
        }

        const { featureCoordinates } = res; 
        if (!featureCoordinates) {
          console.warn("No 'featureCoordinates' returned from server");
          stopLoading();
          return;
        }

        // 3. featureCoordinates 예: { "imgId1": [x,y], ... }
        // 이를 reducedData 형식으로 변환
        const newReducedData = [];
        for (const [imgId, [x, y]] of Object.entries(featureCoordinates)) {
          const original = images.find((img) => img.id === imgId);
          if (original) {
            newReducedData.push({
              ...original,
              x,
              y,
            });
          }
        }

        // 4. UMAP 범위 계산
        if (newReducedData.length > 0) {
          const minX = Math.min(...newReducedData.map((p) => p.x));
          const maxX = Math.max(...newReducedData.map((p) => p.x));
          const minY = Math.min(...newReducedData.map((p) => p.y));
          const maxY = Math.max(...newReducedData.map((p) => p.y));
          setUmapBoundingBox({ minX, maxX, minY, maxY });
        }

        setReducedData(newReducedData);

        stopLoading();
      } catch (err) {
        console.error("Dimension reduction error:", err);
        stopLoading();
      }
    })();
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
      const classColor = classes.find((c) => c.id === point.classIds?.[0])?.color;
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

  // 캔버스 좌표 → 데이터 좌표
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
      // 선택 여부 시각화
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
  }, [reducedData, dataToCanvas, computePointColor, selectedPoints, selectionBox]);

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
  }, [imagesClassIdsSignature, scale, offset, selectionBox, selectedPoints, criteria, draw]);  

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
              src={
                hoveredPoint.thumbnailLocation
                  ? `${SERVER_BASE_URL}/${hoveredPoint.thumbnailLocation}`
                  : hoveredPoint.imageURL
              }
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
