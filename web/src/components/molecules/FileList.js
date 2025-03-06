import React from "react";
import styled from "styled-components";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { TriangleExclamation } from "@/components/atoms/Icon";

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ddd;
`;

const FileDetailsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileNameContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileSizeRow = styled.div`
  font-size: 12px;
  color: #666;
`;

const StyledFileList = styled.div`
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
`;

const StatusIconContainer = styled.div`
  display: flex;
  width: 24px;
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
        <FileDetailsContainer>
          <FontAwesomeIcon
            icon={faFile}
            style={{ color: "#555", fontSize: "24px" }}
          />
          <FileNameContainer>
            {f.file.name}
            <FileSizeRow>{formatFileSize(f.file.size)}</FileSizeRow>
          </FileNameContainer>
        </FileDetailsContainer>
        <StatusIconContainer>
          {f.status === "failure" ? (
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div style={{ cursor: "pointer" }}>
                    <TriangleExclamation color="red" width={16} height={14} />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    sideOffset={5}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      zIndex: 9999,
                    }}
                  >
                    {f.error}
                    <Tooltip.Arrow offset={10} width={11} height={5} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          ) : f.status === "success" ? (
            <FontAwesomeIcon
              icon={faCheck}
              style={{ color: "green", fontSize: "20px" }}
            />
          ) : (
            <div />
          )}
        </StatusIconContainer>
      </FileItem>
    ))}
  </StyledFileList>
);

export default FileList;
