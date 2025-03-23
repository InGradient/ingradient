import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

const PanelWrapper = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 250px;
  background: transparent;
  box-shadow: none;
  z-index: 10;
  overflow: hidden;
  transition: transform 0.3s ease;
  transform: ${({ $collapsed }) =>
    $collapsed ? "translateX(calc(100% - 60px))" : "translateX(0)"};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 0px 16px;
  border-bottom: none;
  cursor: pointer;
  font-weight: bold;
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px 16px;
  overflow-x: auto; /* 가로 스크롤 */
  box-sizing: border-box;
`;

const ImageCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 160px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  box-sizing: border-box;
  border: 2px solid
    ${({ $isHovered }) => ($isHovered ? "blue" : "transparent")};
`;

const Image = styled.img`
  width: 160px;
  height: 128px;
  object-fit: cover;
  border-radius: 4px;
`;

const Filename = styled.div`
  padding: 8px;
`;

const SelectionPanel = ({ selectedPoints, hoveredPoint }) => {
  const [collapsed, setCollapsed] = useState(false);

  const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

  if (!selectedPoints || selectedPoints.length === 0) return null;

  return (
    <PanelWrapper $collapsed={collapsed}>
      <Header onClick={() => setCollapsed(!collapsed)}>
        <span style={{ display: "flex", marginRight: 8, gap: 0 }}>
          <FontAwesomeIcon icon={collapsed ? faChevronLeft : faChevronRight} />
          <FontAwesomeIcon icon={collapsed ? faChevronLeft : faChevronRight} />
        </span>
        Selected Images
      </Header>

      <ImagesContainer>
        {selectedPoints.map((point, index) => {
          const thumbnailURL = point.thumbnailLocation
            ? `${SERVER_BASE_URL}/${point.thumbnailLocation}`
            : point.imageURL;

          return (
            <ImageCard key={index} $isHovered={hoveredPoint === point}>
              <Image src={thumbnailURL} alt={point.filename} />
              <Filename>{point.filename}</Filename>
            </ImageCard>
          );
        })}
      </ImagesContainer>
    </PanelWrapper>
  );
};

export default SelectionPanel;
