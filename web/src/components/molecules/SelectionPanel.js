import React from "react";
import styled from "styled-components";

const PanelContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  width: 300px;
  height: 100%;
  max-height: calc(100% - 48px); /* 화면 높이 - 여백(top + bottom padding) */
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  z-index: 10;
`;

const ImageCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  padding: 8px;
  margin-bottom: 16px;
  text-align: center;
  border: 2px solid ${({ $isHovered }) => ($isHovered ? "blue" : "transparent")};
  box-sizing: border-box;
`;

const Image = styled.img`
  width: 268px;
  height: 128px;
  object-fit: cover;
  border-radius: 4px;
`;

const SelectionPanel = ({ selectedPoints, hoveredPoint }) => {
  if (selectedPoints.length === 0) return null;

  return (
    <PanelContainer>
      {selectedPoints.map((point, index) => (
        <ImageCard key={index} $isHovered={hoveredPoint === point}>
          <Image src={point.imageURL} alt={point.filename} />
          {point.filename}
        </ImageCard>
      ))}
    </PanelContainer>
  );
};

export default SelectionPanel;