import React, { useMemo } from "react";
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

const UploadModal = ({
  title,
  acceptedFileType,
  files,
  onFilesDrop,
  onClose,
  onConfirm,
}) => {
  const progress = useMemo(() => {
    if (files.length === 0) return 0;
    const completed = files.filter(
      (file) => file.status === "success" || file.status === "failure"
    ).length;
    return Math.round((completed / files.length) * 100);
  }, [files]);
  
  const { successCount, failureCount } = useMemo(() => {
    const successCount = files.filter((file) => file.status === "success").length;
    const failureCount = files.filter((file) => file.status === "failure").length;
    return { successCount, failureCount };
  }, [files]);  

  return (
    <>
      <ModalOverlay onClick={onClose} />
      <Dialog>
        <DialogTitle>
          <h3>{title}</h3>
        </DialogTitle>
        <DialogContent>
          <DragDropArea acceptedFileType={acceptedFileType} onFilesDrop={onFilesDrop}>
            Drag & Drop files here or click to select
          </DragDropArea>
          <FileList files={files} />
          {progress > 0 && (
            <ProgressContainer>
              <ProgressBar progress={progress} />
            </ProgressContainer>
          )}
          {progress === 100 && (
            <StatusMessage>
              Success: {successCount}, Failed: {failureCount}
            </StatusMessage>
          )}
        </DialogContent>
        <DialogActions>
          <button 
            className="outlined" 
            onClick={onClose}
            style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
          >
            Cancel
          </button>
          <button onClick={onConfirm}>Confirm</button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadModal;
