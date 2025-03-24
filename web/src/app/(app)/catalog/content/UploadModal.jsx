import React, { useMemo, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import styled from "styled-components";
import DragDropArea from "@/components/molecules/DragDropArea";
import FileList from "@/components/molecules/FileList";
import {
  Dialog,
  ModalOverlay,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/molecules/Dialog";

// 업로드 관련 유틸 함수들 (AbortController, 진행률, 커밋/취소 API 포함)
import { uploadFiles, confirmUploads, cancelUploads } from "@/lib/api"

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

const UploadModal = ({ saveImage, selectedDatasetIds, onClose}) => {
  const [sessionId] = useState(uuidv4());
  const [uploadList, setUploadList] = useState([]); 
  const [controllers, setControllers] = useState([]); 

  // file -> { width, height }를 Promise로 리턴
  function readImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);  // 메모리 정리
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // 전체 진행률 계산 (완료된 파일 수 기준)
  const overallProgress = useMemo(() => {
    if (uploadList.length === 0) return 0;
    const completedCount = uploadList.filter(
      (f) => f.status === "success" || f.status === "failure"
    ).length;
    return Math.round((completedCount / uploadList.length) * 100);
  }, [uploadList]);

  // 성공/실패 파일 개수 계산
  const { successCount, failureCount } = useMemo(() => {
    const successCount = uploadList.filter((f) => f.status === "success").length;
    const failureCount = uploadList.filter((f) => f.status === "failure").length;
    return { successCount, failureCount };
  }, [uploadList]);

  // 전체 업로드가 끝났는지 여부
  const isUploadComplete = overallProgress === 100;

  const onFilesDrop = async (droppedFiles) => {
    const startIndex = uploadList.length;

    // 각 파일에 대해 width, height를 읽어들인다.
    const newFilePromises = droppedFiles.map(async (file) => {
      const { width, height } = await readImageDimensions(file);
      return {
        status: "idle",
        filename: file.name,
        originalFile: file,
        progress: 0,
        size: file.size,
        type: file.type,
        width,
        height,
      };
    });

    // Promise.all로 모든 파일의 width/height를 구한 뒤, uploadList에 저장
    const initialList = await Promise.all(newFilePromises);
    setUploadList((prev) => [...prev, ...initialList]);

    // 이후 uploadFiles로 업로드 진행
    const { controllers: newControllers } = uploadFiles(
      droppedFiles,
      sessionId,
      // onProgress
      (progressInfo) => {
        setUploadList((prev) =>
          prev.map((item, i) => {
            const realIndex = startIndex + progressInfo.index;
            if (i === realIndex) {
              return { ...item, progress: progressInfo.progress };
            }
            return item;
          })
        );
      },
      // onFileComplete
      (fileResult) => {
        setUploadList((prev) =>
          prev.map((item, i) => {
            const realIndex = startIndex + fileResult.index;
            if (i === realIndex) {
              return {
                ...item,
                status: fileResult.status,
                fileId: fileResult.fileId,
                error: fileResult.error,
              };
            }
            return item;
          })
        );
      }
    );

    setControllers((prev) => [...prev, ...newControllers]);
  };

  // Cancel 버튼 클릭 시 처리: 진행중인 요청 중단 및 서버의 임시 파일 삭제
  const handleCancel = async () => {
    // 1) 진행 중인 업로드 요청을 abort()로 중단
    controllers.forEach((ctrl) => ctrl.abort());

    // 2) 이미 완료된 업로드 파일들의 fileId를 모아 서버에 삭제 요청
    const uploadedFileIds = uploadList
      .filter((f) => f.status === "success" && f.fileId)
      .map((f) => f.fileId);

    if (uploadedFileIds.length > 0) {
      try {
        await cancelUploads(sessionId);
      } catch (err) {
        console.error("cancelUploads error:", err);
      }
    }

    // 3) 로컬 상태 초기화 후 모달 닫기
    setUploadList([]);
    setControllers([]);
    onClose();
  };

  // Confirm 버튼 클릭 시 처리: 완료된 파일들 최종 커밋 (예: 임시 파일을 최종 위치로 이동)
  const handleConfirm = async () => {
    const successFileIds = uploadList
      .filter((f) => f.status === "success" && f.fileId)
      .map((f) => f.fileId);
    
    if (successFileIds.length === 0) {
      onClose();
      return;
    }
  
    try {
      // 서버 최종 커밋
      const response = await confirmUploads(sessionId, successFileIds);
      const movedFiles = response.data.movedFiles; 
      // movedFiles = [ { fileId, filename, finalPath, ... }, ... ]
      
      for (const file of movedFiles) {
        // uploadList에서 localFileItem 찾기
        
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
      console.error("confirmUploads error:", err);
    }
  
    setUploadList([]);
    setControllers([]);
    onClose();
  };
  
  return (
    <>
      <ModalOverlay onClick={handleCancel} />
      <Dialog>
        <DialogTitle>
          <h3>Upload Images</h3>
        </DialogTitle>
        <DialogContent>
          <DragDropArea acceptedFileType="image/*" onFilesDrop={onFilesDrop}>
            Drag & Drop files here or click to select
          </DragDropArea>

          {/* 파일 목록 (상태, 에러 메시지 등) */}
          <FileList files={uploadList} />

          {/* 전체 진행률 표시 */}
          {overallProgress > 0 && (
            <ProgressContainer>
              <ProgressBar progress={overallProgress} />
            </ProgressContainer>
          )}

          {/* 업로드 완료 시 성공/실패 개수 표시 */}
          {isUploadComplete && (
            <StatusMessage>
              Success: {successCount}, Failed: {failureCount}
            </StatusMessage>
          )}
        </DialogContent>
        <DialogActions>
          <button
            className="outlined"
            onClick={handleCancel}
            style={{ color: "var(--color-warning)", borderColor: "var(--color-warning)" }}
          >
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!isUploadComplete}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadModal;
