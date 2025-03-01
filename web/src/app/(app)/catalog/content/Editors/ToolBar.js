"use client";

import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowPointer, faSquare, faPaintBrush, faCircleNodes } from "@fortawesome/free-solid-svg-icons";
import { DashedBox } from "@/components/atoms/Icon";

import Logo from "components/atoms/Logo";

const ToolbarContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  background-color: var(--background-dark);
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 16px;
  gap: 16px;
  z-index: 1100;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
`;

const ToolbarButton = styled.button`
  width: 56px;
  height: 56px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background-color: var(--accent-active);
  }
  
  &:hover {
    background-color: var(--accent-hover);
  }

  svg {
    width: 28px;
    height: 28px;
  }
`;

const StyledLogoContainer = styled.div`
  margin-bottom: 16px;
`;

function ToolBar({ mode, setMode }) {
  return (
    <ToolbarContainer>
      <StyledLogoContainer>
        <Logo mode="radius" />
      </StyledLogoContainer>

      {/* Select (Pointer) 모드 */}
      <ToolbarButton
        onClick={() => setMode("select")}
        className={mode === "select" ? "active" : ""}
      >
        <FontAwesomeIcon icon={faArrowPointer} />
      </ToolbarButton>

      {/* Bounding Box (Bbox) 모드 */}
      <ToolbarButton
        onClick={() => setMode("bbox")}
        className={mode === "bbox" ? "active" : ""}
      >
        <DashedBox />
      </ToolbarButton>

      {/* Segmentation 모드 */}
      <ToolbarButton
        onClick={() => setMode("segmentation")}
        className={mode === "segmentation" ? "active" : ""}
      >
        <FontAwesomeIcon icon={faPaintBrush} />
      </ToolbarButton>

      {/* Point 모드 */}
      <ToolbarButton
        onClick={() => setMode("point")}
        className={mode === "point" ? "active" : ""}
      >
        <FontAwesomeIcon icon={faCircleNodes} />
      </ToolbarButton>
    </ToolbarContainer>
  );
}

export default ToolBar;
