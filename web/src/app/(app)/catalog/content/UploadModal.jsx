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
import { uploadFiles, confirmUploads, cancelUploads } from "@/utils/fileHandler";

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

  const onFilesDrop = (droppedFiles) => {
    // 1) 우선 "idle" 상태로 uploadList에 넣어줌
    const startIndex = uploadList.length;
    const initialList = droppedFiles.map((file) => ({
      status: "idle",
      filename: file.name,
      originalFile: file,
      progress: 0,
    }));
    setUploadList((prev) => [...prev, ...initialList]);

    // 2) 업로드 실행
    const { controllers: newControllers, promises } = uploadFiles(
      droppedFiles,
      sessionId,
      (progressInfo) => {
        // progressInfo: { index, progress }
        // index는 droppedFiles 배열 기준의 인덱스
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
      // onFileComplete: 파일 업로드가 완료되는 즉시 상태 업데이트
      (fileResult) => {
        // fileResult: { index, status, fileId?, error? }
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

    // 3) AbortController들 저장
    setControllers((prev) => [...prev, ...newControllers]);

    // Promise.all(promises).then(() => {
    //   console.log("모든 파일 업로드 완료!");
    //   // 필요 시 어떤 로직
    // });
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
      // confirmUploads는 movedFiles 배열을 반환한다고 가정합니다.
      const response = await confirmUploads(sessionId, successFileIds);
      const movedFiles = response.data.movedFiles;
      console.log("MovedFiles", movedFiles)
      
      // 각 파일에 대해 추가 정보를 붙여서 saveImage 호출
      for (const file of movedFiles) {
        await saveImage({
          ...file,
          datasetIds: selectedDatasetIds,
          userId: "user1",
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
