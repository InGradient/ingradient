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
  display: ${({ isAll }) => (isAll ? "none" : "flex")};
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
    const imageURL = item.fileLocation
      ? `${SERVER_BASE_URL}/${item.fileLocation}`
      : null;

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
          imageURL={imageURL}
          thumbnailURL={thumbnailURL}
          fileName={item.filename}
          imageDescription={item.properties?.description}
          isSelected={isSelected}
          status={item.status}
        />
      </div>
    );
  },
  (prev, next) => {
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

  const handleCollapseToggle = useCallback((groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const handleContainerClick = useCallback(() => {
    setSelectedImageIds([]);
    shiftStartIdRef.current = null;
  }, [setSelectedImageIds]);

  const getGroupName = useCallback(
    (groupKey) => {
      const activeClass = activeClasses.find((cls) => cls.id === groupKey);
      return activeClass ? activeClass.name : "No Class";
    },
    [activeClasses]
  );

  const sortedGroupedData = useMemo(() => {
    return [...groupedImages].sort((a, b) => {
      const nameA = getGroupName(a.key);
      const nameB = getGroupName(b.key);
      if (nameA === "No Class") return -1;
      if (nameB === "No Class") return 1;
      return nameA.localeCompare(nameB);
    });
  }, [groupedImages, getGroupName]);

  const allImages = useMemo(
    () => groupedImages.flatMap((group) => group.values),
    [groupedImages]
  );
  
  const handleClick = useCallback(
    (id, event) => {
      event.stopPropagation();
  
      setSelectedImageIds((prevSelectedIds) => {
        let updatedSelectedIds = [];
  
        if (event.shiftKey && prevSelectedIds.length > 0) {
          const shiftStartId = shiftStartIdRef.current || prevSelectedIds[0];
          const startIdx = allImages.findIndex((item) => item.id === shiftStartId);
          const currentIdx = allImages.findIndex((item) => item.id === id);
  
          const [start, end] = [Math.min(startIdx, currentIdx), Math.max(startIdx, currentIdx)];
          const rangeIds = allImages.slice(start, end + 1).map((item) => item.id);
  
          updatedSelectedIds = currentIdx < startIdx ? rangeIds.reverse() : rangeIds;
        } else if (event.ctrlKey || event.metaKey) {
          if (prevSelectedIds.includes(id)) {
            updatedSelectedIds = prevSelectedIds.filter((selectedId) => selectedId !== id);
          } else {
            updatedSelectedIds = [...prevSelectedIds, id];
          }
        } else {
          updatedSelectedIds = [id];
        }
  
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
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (!selectedImageIds.length) return;

      const currentIndex = allImages.findIndex((item) => item.id === selectedImageIds[0]);
      const key = event.key.toLowerCase();

      if ((key === "a") && currentIndex > 0) {
        setSelectedImageIds([allImages[currentIndex - 1].id]);
      } else if ((key === "d") && currentIndex < allImages.length - 1) {
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
