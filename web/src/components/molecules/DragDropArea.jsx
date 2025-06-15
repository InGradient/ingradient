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

export const DragDropArea = React.forwardRef(({ onFilesDrop, acceptedFileType, children, ...props }, ref) => {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilesDrop && e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      const files = await processDroppedItems(items);
      const imageFiles = files.filter(file => !acceptedFileType || file.type.match(new RegExp(acceptedFileType.replace("*", ".*"))));
      onFilesDrop(imageFiles);
    }
  };

  const handleInputChange = async (e) => {
    if (onFilesDrop && e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => !acceptedFileType || file.type.match(new RegExp(acceptedFileType.replace("*", ".*"))));
      onFilesDrop(imageFiles);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  return (
    <DragDropContainer
      ref={ref}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileSelector}
      {...props}
    >
      {children}
      <HiddenInput
        ref={fileInputRef}
        type="file"
        multiple
        webkitdirectory="true"
        accept={acceptedFileType}
        onChange={handleInputChange}
      />
    </DragDropContainer>
  );
});

async function processDroppedItems(items) {
  const files = [];
  const promises = items.map(async (item) => {
    const entry = item.webkitGetAsEntry();
    if (entry) {
      await traverseFileTree(entry, files);
    }
  });
  await Promise.all(promises);
  return files;
}

async function traverseFileTree(entry, files) {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file(
        (file) => {
          files.push(file);
          resolve();
        },
        (err) => reject(err)
      );
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    return new Promise((resolve, reject) => {
      const readEntries = async () => {
        dirReader.readEntries(async (entries) => {
          if (entries.length > 0) {
            const promises = entries.map((e) => traverseFileTree(e, files));
            await Promise.all(promises);
            await readEntries();
          } else {
            resolve();
          }
        }, reject);
      };
      readEntries();
    });
  }
}
