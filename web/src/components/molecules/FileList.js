import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faExclamation } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { Tooltip as ReactTooltip } from "react-tooltip";

const FileItem = styled.div`
  display: flex;
  justify-content: space-between; /* Push icon and status to opposite ends */
  align-items: center; /* Align items vertically */
  padding: 8px;
  border-bottom: 1px solid #ddd; /* Optional: to separate items visually */
`;

const FileDetailsContainer = styled.div`
  display: flex;
  align-items: center; /* Align icon and file details vertically */
  gap: 12px; /* Space between icon and file details */
`;

const FileNameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileSizeRow = styled.div`
  font-size: 12px; /* Smaller font size for size info */
  color: #666; /* Subtle color for the size text */
`;

const StyledFileList = styled.div`
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;

  /* WebKit browsers (Chrome, Edge, Safari) */
  ::-webkit-scrollbar {
    width: 6px; /* Thin scrollbar */
    background-color: transparent; /* Transparent background for the scrollbar */
  }
  ::-webkit-scrollbar-thumb {
    background-color: rgba(150, 150, 150, 0.6); /* Light gray thumb */
    border-radius: 8px; /* Rounded scrollbar thumb */
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(150, 150, 150, 0.8); /* Darker gray on hover */
  }
  ::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.1); /* Subtle background for the track */
    border-radius: 8px; /* Rounded scrollbar track */
  }
  ::-webkit-scrollbar-button {
    display: none; /* Hide up/down arrow buttons */
  }

  /* Firefox */
  scrollbar-width: thin; /* Thin scrollbar */
  scrollbar-color: rgba(150, 150, 150, 0.6) transparent; /* Thumb and transparent track */
`;

const StatusIconContainer = styled.div`
  display: flex;
  width: 12px;
  align-items: center;
  justify-content: center;
`;

const formatFileSize = (sizeInBytes) => {
  const sizeInKB = sizeInBytes / 1024;
  return `${sizeInKB.toFixed(2)} KB`;
};

const FileList = ({ files }) => (
  <StyledFileList>
    {files.map((f, index) => (
      <FileItem key={index}>
        {/* Icon and File Details */}
        <FileDetailsContainer>
          <FontAwesomeIcon icon={faFile} style={{ color: "#555", fontSize: "24px" }} />
          <FileNameContainer>
            {f.file.name}
            <FileSizeRow>
              {formatFileSize(f.file.size)}
            </FileSizeRow>
          </FileNameContainer>
        </FileDetailsContainer>

        {/* Status Icons */}
        <StatusIconContainer>
          {/* Assuming all files are pending or success */}
          <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />
        </StatusIconContainer>
      </FileItem>
    ))}
  </StyledFileList>
);

export default FileList;
