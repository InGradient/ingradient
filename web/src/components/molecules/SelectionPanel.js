import React, { useState } from "react";
import styled from "styled-components";

const PanelWrapper = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 250px;
  /* 투명 배경, 그림자 제거 */
  background: transparent;
  box-shadow: none;
  z-index: 10;
  overflow: hidden; /* 패널을 오른쪽으로 숨길 때 내부 콘텐츠 가려주기 */
  transition: transform 0.3s ease;
  /* collapsed일 때 오른쪽으로 패널 전체를 밀어내고, 60px만 화면에 남김 */
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
  height: calc(100% - 40px);
`;

const ImageCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  background: #fff;
  border-radius: 8px;
  /* 그림자, 테두리 등 필요 시 조정 */
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  box-sizing: border-box;
  padding: 8px;
  border: 2px solid
    ${({ $isHovered }) => ($isHovered ? "blue" : "transparent")};
`;

const Image = styled.img`
  width: 100px;   /* 필요에 따라 조절 */
  height: 80px;   /* 필요에 따라 조절 */
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 4px;
`;

const SelectionPanel = ({ selectedPoints, hoveredPoint }) => {
  const [collapsed, setCollapsed] = useState(false);

  const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;
  // 선택된 이미지가 없으면 패널 자체를 렌더링하지 않음
  if (!selectedPoints || selectedPoints.length === 0) return null;

  return (
    <PanelWrapper $collapsed={collapsed}>
      {/* 토글 영역 (클릭 시 펼침/접힘 상태 변경) */}
      <Header onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? "<< Selected Images" : ">> Selected Images"}
      </Header>

      <ImagesContainer>
        {selectedPoints.map((point, index) => {
          const thumbnailURL = point.thumbnailLocation
            ? `${SERVER_BASE_URL}/${point.thumbnailLocation}`
            : point.imageURL; // fallback

          return (
            <ImageCard key={index} $isHovered={hoveredPoint === point}>
              <Image src={thumbnailURL} alt={point.filename} />
              <div>{point.filename}</div>
            </ImageCard>
          );
        })}
      </ImagesContainer>
    </PanelWrapper>
  );
};

export default SelectionPanel;
