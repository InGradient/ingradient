import PropTypes from "prop-types";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Card } from "components/molecules/Card";
import { getServerBaseUrl } from "config/environment";

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow-y: auto;
`;

const GroupContainer = styled.div``;

const GroupHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isAll",
})`
  cursor: pointer;
  padding: 4px 8px;
  display: ${({ isAll }) => (isAll ? "none" : "flex")}; /* isAll이 true면 숨김 */
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: var(--background-muted);
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(173px, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
`;

const ArrowContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 8px;
  height: 8px;
  cursor: pointer;
`;

const SERVER_BASE_URL = getServerBaseUrl();

const MemoizedImageItem = React.memo(
  function MemoizedImageItem({ item, isSelected, onClick, onDoubleClick }) {
    // ✅ 서버 주소 + file_location 조합
    const imageURL = item.fileLocation
      ? `${SERVER_BASE_URL}/${item.fileLocation}`
      : null;

    // ✅ 서버 주소 + thumbnail_location 조합
    const thumbnailURL = item.thumbnailLocation
      ? `${SERVER_BASE_URL}/${item.thumbnailLocation}`
      : null;

    return (
      <div
        style={{ width: "100%", overflow: "hidden", transition: "transform 0.2s" }}
        onClick={(e) => onClick(item.id, e)}
        onDoubleClick={() => onDoubleClick(item)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Card
          className="card-instance"
          imageURL={imageURL} // ✅ 변환된 URL 사용
          thumbnailURL={thumbnailURL} // ✅ 변환된 썸네일 URL 사용
          fileName={item.filename}
          imageDescription={item.properties?.description}
          isSelected={isSelected}
          status={item.status}
        />
      </div>
    );
  },
  (prev, next) => {
    // item.id 또는 isSelected가 바뀌었는지 비교
    if (prev.item.id !== next.item.id) return false;
    if (prev.isSelected !== next.isSelected) return false;
    return true;
  }
);

export const ImageGrid = ({
  groupedImages,
  activeClasses,
  selectedImageIds,
  setSelectedImageIds,
  onImageDoubleClick,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const shiftStartIdRef = useRef(null);

  // 그룹 접기/펼치기 토글
  const handleCollapseToggle = useCallback((groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  // 그리드 빈 공간 클릭 시 선택 해제
  const handleContainerClick = useCallback(() => {
    setSelectedImageIds([]);
    shiftStartIdRef.current = null; // Shift 클릭 시작 ID 초기화
  }, [setSelectedImageIds]);

  // groupKey -> 실제 클래스 이름
  const getGroupName = useCallback(
    (groupKey) => {
      const activeClass = activeClasses.find((cls) => cls.id === groupKey);
      return activeClass ? activeClass.name : "No Class";
    },
    [activeClasses]
  );

  // 그룹명 정렬
  const sortedGroupedData = useMemo(() => {
    return [...groupedImages].sort((a, b) => {
      const nameA = getGroupName(a.key);
      const nameB = getGroupName(b.key);
      if (nameA === "No Class") return -1;
      if (nameB === "No Class") return 1;
      return nameA.localeCompare(nameB);
    });
  }, [groupedImages, getGroupName]);

  
  // 그룹의 모든 이미지를 1차원 배열로 합치기
  const allImages = useMemo(
    () => groupedImages.flatMap((group) => group.values),
    [groupedImages]
  );
  
  // 아이템 클릭 (Shift, Ctrl/Meta, 단일)
  const handleClick = useCallback(
    (id, event) => {
      event.stopPropagation();
  
      setSelectedImageIds((prevSelectedIds) => {
        let updatedSelectedIds = [];
  
        if (event.shiftKey && prevSelectedIds.length > 0) {
          // Shift 클릭: 시작 ID를 기준으로 범위 선택
          const shiftStartId = shiftStartIdRef.current || prevSelectedIds[0]; // Shift 시작 ID
          const startIdx = allImages.findIndex((item) => item.id === shiftStartId);
          const currentIdx = allImages.findIndex((item) => item.id === id);
  
          const [start, end] = [Math.min(startIdx, currentIdx), Math.max(startIdx, currentIdx)];
          const rangeIds = allImages.slice(start, end + 1).map((item) => item.id);
  
          // 순서를 결정: 현재 클릭한 항목이 시작 항목보다 앞에 있으면 뒤집기
          updatedSelectedIds = currentIdx < startIdx ? rangeIds.reverse() : rangeIds;
        } else if (event.ctrlKey || event.metaKey) {
          // Ctrl/Meta 클릭: 다중 선택
          if (prevSelectedIds.includes(id)) {
            updatedSelectedIds = prevSelectedIds.filter((selectedId) => selectedId !== id);
          } else {
            updatedSelectedIds = [...prevSelectedIds, id];
          }
        } else {
          // 단일 클릭: 현재 ID만 선택
          updatedSelectedIds = [id];
        }
  
        // Shift 클릭 시작 ID 갱신
        if (event.shiftKey) {
          shiftStartIdRef.current = updatedSelectedIds[0];
        } else {
          shiftStartIdRef.current = id;
        }
  
        return updatedSelectedIds;
      });
    },
    [allImages, setSelectedImageIds]
  );
  
  const handleKeyDown = useCallback(
    (event) => {
      if (!selectedImageIds.length) return;

      const currentIndex = allImages.findIndex((item) => item.id === selectedImageIds[0]);

      if (event.key === "a" && currentIndex > 0) {
        // Select previous image
        setSelectedImageIds([allImages[currentIndex - 1].id]);
      } else if (event.key === "d" && currentIndex < allImages.length - 1) {
        // Select next image
        setSelectedImageIds([allImages[currentIndex + 1].id]);
      }
    },
    [allImages, selectedImageIds, setSelectedImageIds]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Container onClick={handleContainerClick}>
      {sortedGroupedData.map((group) => {
        const groupName = getGroupName(group.key);
        const isCollapsed = collapsedGroups[group.key] === true;

        return (
          <GroupContainer key={group.key}>
            <GroupHeader
              isAll={group.key === "all"}
              onClick={() => handleCollapseToggle(group.key)}
            >
              <HeaderTitle>
                <ArrowContainer>
                  <FontAwesomeIcon
                    icon={isCollapsed ? faChevronRight : faChevronDown}
                    size="xs"
                  />
                </ArrowContainer>
                {groupName}
              </HeaderTitle>
              {group.values.length} items
            </GroupHeader>

            {!isCollapsed && (
              <StyledImageGrid>
                {group.values.map((item) => {
                  const isSelected = selectedImageIds.includes(item.id);

                  // MemoizedImageItem 사용
                  return (
                    <MemoizedImageItem
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      onClick={handleClick}
                      onDoubleClick={onImageDoubleClick}
                    />
                  );
                })}
              </StyledImageGrid>
            )}
          </GroupContainer>
        );
      })}
    </Container>
  );
};

ImageGrid.propTypes = {
  groupedImages: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      values: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          imageURL: PropTypes.string,
          thumbnailURL: PropTypes.string,
          filename: PropTypes.string,
          properties: PropTypes.object,
          status: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  activeClasses: PropTypes.array.isRequired,
  selectedImageIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelectedImageIds: PropTypes.func.isRequired,
  onImageDoubleClick: PropTypes.func.isRequired,
};
