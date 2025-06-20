import React, { useMemo, useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import styled from "styled-components";
import { DragDropArea } from "@/components/molecules/DragDropArea";
import FileList from "@/components/molecules/FileList";
import {
  Dialog,
  ModalOverlay,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/molecules/Dialog";

import { uploadFiles, confirmUploads, cancelUploads } from "@/lib/api";

const ProgressContainer = styled.div`
  margin-top: 16px;
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  width: ${({ progress }) => progress}%;
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease-in-out;
`;

const StatusMessage = styled.div`
  text-align: right;
`;

const UploadModal = ({ saveImage, selectedDatasetIds, onClose }) => {
  const [sessionId] = useState(uuidv4());
  const [uploadList, setUploadList] = useState([]);
  const [controllers, setControllers] = useState([]);

  const [commitProgress, setCommitProgress] = useState({ processed: 0, total: 0 });
  const [isCommitting, setIsCommitting] = useState(false);
  const wsRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          setIsDraggingOver(false);
          dragCounter.current = 0;
        }
      }
    };

    const handleDrop = () => {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  function readImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const overallProgress = useMemo(() => {
    if (uploadList.length === 0) return 0;
    const completedCount = uploadList.filter(
      (f) => f.status === "success" || f.status === "failure"
    ).length;
    return Math.round((completedCount / uploadList.length) * 100);
  }, [uploadList]);

  const { successCount, failureCount } = useMemo(() => {
    const successCount = uploadList.filter((f) => f.status === "success").length;
    const failureCount = uploadList.filter((f) => f.status === "failure").length;
    return { successCount, failureCount };
  }, [uploadList]);

  const isUploadComplete = overallProgress === 100;

  const onFilesDrop = async (droppedFiles) => {
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const startIndex = uploadList.length;
    const PREVIEW_LIMIT = 1000;
    const DIMENSION_LIMIT = 2000;
    const shouldReadDimensions = droppedFiles.length <= DIMENSION_LIMIT;

    // Preview array limited to first PREVIEW_LIMIT files
    const previewPromises = droppedFiles.slice(0, PREVIEW_LIMIT).map(async (file, idx) => {
      let fileObj = file;
      if (typeof file === 'string' && file.startsWith('data:image/')) {
        const res = await fetch(file);
        const blob = await res.blob();
        fileObj = new File([blob], 'pasted-image.png', { type: 'image/png' });
      }

      let width = null;
      let height = null;
      if (shouldReadDimensions) {
        try {
          const dims = await readImageDimensions(fileObj);
          width = dims.width;
          height = dims.height;
        } catch {}
      }

      return {
        status: "idle",
        filename: fileObj.name,
        originalFile: fileObj,
        progress: 0,
        size: fileObj.size,
        type: fileObj.type,
        width,
        height,
      };
    });

    const initialList = await Promise.all(previewPromises);
    const remainingCount = droppedFiles.length - PREVIEW_LIMIT;
    if (remainingCount > 0) {
      initialList.push({
        status: "info",
        filename: `+ ${remainingCount.toLocaleString()} more files ...`,
        originalFile: { name: "", size: 0 },
        progress: 0,
      });
    }

    setUploadList((prev) => [...prev, ...initialList]);

    const { controllers: newControllers } = uploadFiles(
      droppedFiles.map(file => typeof file === 'string' ? new File([file], 'pasted-image.png', { type: 'image/png' }) : file),
      sessionId,
      (progressInfo) => {
        if (progressInfo.index < PREVIEW_LIMIT) {
        setUploadList((prev) =>
          prev.map((item, i) => {
            const realIndex = startIndex + progressInfo.index;
            if (i === realIndex) {
              return { ...item, progress: progressInfo.progress };
            }
            return item;
          })
        );
        }
      },
      (fileResult) => {
        if (fileResult.index < PREVIEW_LIMIT) {
        setUploadList((prev) =>
          prev.map((item, i) => {
            const realIndex = startIndex + fileResult.index;
            if (i === realIndex) {
                return { ...item, status: fileResult.status, fileId: fileResult.fileId };
            }
            return item;
          })
        );
      }
      },
      10 // concurrency limit
    );

    setControllers((prev) => [...prev, ...newControllers]);
  };

  const connectWebSocket = (sessionId) => {
    const serverBaseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL
      ? `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}:${process.env.NEXT_PUBLIC_SERVER_PORT}`
      : "http://localhost:8000";
    try {
      console.log("serverBaseUrl :", serverBaseUrl)
      const url = new URL(serverBaseUrl);
      const apiHost = url.host;
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${apiHost}/api/uploads/ws/commit-progress/${sessionId}`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected!");
        triggerConfirmUploads(); 
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        if (data.type === "progress") {
          setCommitProgress({ processed: data.processed, total: data.total });
        } else if (data.type === "complete") {
          console.log('Commit complete, movedFiles:', data.movedFiles);
          // isCommitting은 handleSaveMovedFiles에서 false로 설정합니다.
          handleSaveMovedFiles(data.movedFiles);
          // 여기서 WebSocket을 닫을 수도 있고, handleSaveMovedFiles 후 닫을 수도 있습니다.
          // 지금은 handleSaveMovedFiles가 최종적으로 닫도록 합니다.
        } else if (data.type === "error") {
          console.error("Commit error from server:", data.message);
          setIsCommitting(false); // 서버로부터 명시적 에러 시 false
          if (wsRef.current) wsRef.current.close();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket connection error:", error);
        setIsCommitting(false); // WebSocket 연결 자체 에러 시 false
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected.");
        // isCommitting이 여전히 true라면, 예상치 못한 종료로 간주하고 false로 설정
        // (handleSaveMovedFiles 또는 에러 핸들러에서 이미 false로 설정했을 수 있음)
        if (isCommitting) { // 이 조건은 선택적. 현재 isCommitting 상태에 따라 결정
            setIsCommitting(false);
        }
        wsRef.current = null;
      };

    } catch (error) {
      console.error("Failed to construct WebSocket URL from", serverBaseUrl, ":", error);
      setIsCommitting(false);
    }
  };

  const triggerConfirmUploads = async () => {
    console.log("uploadList :", uploadList)
    const successFileIds = uploadList
      .filter((f) => f.status === "success" && f.fileId)
      .map((f) => f.fileId);

    console.log("successFileIds :", successFileIds)

    if (successFileIds.length === 0 && isCommitting) { // isCommitting 확인 추가
        setIsCommitting(false); // 커밋할 파일이 없으면 커밋 상태 해제
        onClose();
        return;
    } else if (successFileIds.length === 0) {
        onClose();
        return;
    }
    
    try {
      const response = await confirmUploads(sessionId, successFileIds);
      console.log("Commit started:", response.data);
    } catch (err) {
      console.error("Failed to start commitUploads (HTTP request):", err);
      setIsCommitting(false); // HTTP 요청 실패 시 false
      if (wsRef.current) wsRef.current.close();
    }
  };

  const handleSaveMovedFiles = async (movedFiles) => {
    try {
      for (const file of movedFiles) {
        const localFileItem = uploadList.find(
          (item) => item.fileId === file.id
        );
        await saveImage({
          ...file,
          datasetIds: selectedDatasetIds,
          userId: "user1",
          size: localFileItem?.size,
          type: localFileItem?.type,
          width: localFileItem?.width,
          height: localFileItem?.height,
        });
      }
    } catch (err) {
      console.error("saveImage error:", err);
      // 여기서도 isCommitting을 false로 설정할 수 있지만, finally에서 일괄 처리
    } finally {
      // 모든 처리가 끝난 후 (성공/실패 무관) isCommitting을 false로 설정
      setIsCommitting(false); 
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      setUploadList([]);
      setControllers([]);
      onClose(); // 모달 닫기
    }
  };

  const handleConfirm = async () => {
    setIsCommitting(true);
    setCommitProgress({ processed: 0, total: 0 });
    connectWebSocket(sessionId);
  };

  const handleCancel = async () => {
    // 진행 중인 초기 업로드 중단 (controllers)
    controllers.forEach((ctrl) => ctrl.abort());
    setControllers([]);

    // WebSocket 연결 중단
    if (wsRef.current) {
      wsRef.current.close(); // onclose 핸들러에서 wsRef.current = null 및 setIsCommitting(false) 처리
    } else {
      // WebSocket 연결 시도 전이거나 이미 닫힌 경우, isCommitting 상태 직접 관리
      setIsCommitting(false);
    }
    
    // 서버에 업로드된 임시 파일 삭제 요청 (필요시)
    const uploadedFileIds = uploadList
        .filter(f => f.status === 'success' && f.fileId)
        .map(f => f.fileId);

    if (uploadedFileIds.length > 0 || isCommitting) { // isCommitting은 sessionId가 생성되었다는 의미
        try {
            await cancelUploads(sessionId);
            console.log("Server temp files cancellation requested for session:", sessionId);
        } catch (err) {
            console.error("cancelUploads error:", err);
        }
    }

    setUploadList([]);
    onClose();
  };

  const commitPercentage = useMemo(() => {
    if (!isCommitting || commitProgress.total === 0) return 0;
    return Math.round((commitProgress.processed / commitProgress.total) * 100);
  }, [isCommitting, commitProgress]);

  return (
    <>
      <ModalOverlay onClick={isCommitting ? undefined : handleCancel} />
      <Dialog>
        <DialogTitle>
          <h3>Upload Images</h3>
        </DialogTitle>
        <DialogContent>
          <DragDropArea 
            acceptedFileType="image/*" 
            onFilesDrop={onFilesDrop}
            disabled={isCommitting}
            style={
              isDraggingOver
                ? {
                    position: "relative",
                    zIndex: 1, // Dialog 내 다른 요소와의 관계를 위해
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                    backgroundColor: "white", // 호버 효과 등을 덮기 위해
                  }
                : {}
            }
          >
            Drag & Drop files here or click to select
          </DragDropArea>

          <FileList files={uploadList} />

          {overallProgress > 0 && !isCommitting && (
            <>
              <ProgressContainer>
                <ProgressBar progress={overallProgress} />
              </ProgressContainer>
              {isUploadComplete && (
                <StatusMessage>
                  Upload: Success: {successCount}, Failed: {failureCount}
                </StatusMessage>
              )}
            </>
          )}

          {isCommitting && (
            <>
              <div style={{marginTop: '16px', textAlign: 'center'}}>Committing files...</div>
              <ProgressContainer>
                <ProgressBar progress={commitPercentage} style={{backgroundColor: '#3498db'}} />
              </ProgressContainer>
              <StatusMessage>
                Processing: {commitProgress.processed} / {commitProgress.total}
              </StatusMessage>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <button
            className="outlined"
            onClick={handleCancel}
            disabled={isCommitting}
            style={{ color: "var(--color-warning)", borderColor: "var(--color-warning)" }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!isUploadComplete || isCommitting}
          >
            {isCommitting ? 'Committing...' : 'Confirm'}
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadModal;