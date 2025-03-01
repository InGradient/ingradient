import React, { useRef } from "react";
import styled from "styled-components";

const DragDropContainer = styled.div`
  width: 100%;
  height: 100px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  color: var(--lightbasebase-03);

  &:hover {
    background-color: var(--lightaccentsblue-03);
  color: var(--lightbasebase-02);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const DragDropArea = ({ onFilesDrop, acceptedFileType, children }) => {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilesDrop && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        !acceptedFileType || file.type.match(new RegExp(acceptedFileType.replace("*", ".*")))
      );
      onFilesDrop(files);
    }
  };

  const handleInputChange = (e) => {
    if (onFilesDrop && e.target.files) {
      const files = Array.from(e.target.files).filter((file) =>
        !acceptedFileType || file.type.match(new RegExp(acceptedFileType.replace("*", ".*")))
      );
      onFilesDrop(files);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  return (
    <DragDropContainer
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileSelector}
    >
      {children}
      <HiddenInput
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileType}
        onChange={handleInputChange}
      />
    </DragDropContainer>
  );
};

export default DragDropArea;
