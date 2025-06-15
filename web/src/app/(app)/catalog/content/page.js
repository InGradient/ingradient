"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronDown,
  faList,
  faChartLine,
  faArrowDown,
  faArrowUp,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useSearchParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/api";

import Statics from "../Viewers/Statics";
import ListView from "../Viewers/ListView";
import PlotCanvas from "@/app/(app)/catalog/Viewers/PlotCanvas";
import { ImageGrid } from "@/app/(app)/catalog/Viewers/ImageGrid";

import SortMenu from "./TableMenu/SortMenu";
import GroupByMenu, { groupLabels } from "./TableMenu/GroupByMenu";
import FilterMenu from "./TableMenu/FilterMenu";
import { filterConfigs } from "./TableMenu/FilterConfigs";

import { ArrowDownUp, Filter, LayerGroup, Grid, ChartScatter } from "@/components/atoms/Icon";
import Checkbox from "@/components/atoms/Checkbox";
import { Toggle, ToggleIcon } from "@/components/molecules/Toggle";
import UploadModal from "@/app/(app)/catalog/content/UploadModal";
import { EmptyMessage } from "@/components/organisms/EmptyMessage";

import { extractUniqueAndRange, filterData, sortData, groupData } from "@/utils/dataProcessing";
import { handleImageUpload, handleDownload } from "@/utils/fileHandler";

import useOutsideClick from "hooks/useOutsideClick";

// Content.jsx
const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: auto;

  container-type: inline-size;
  container-name: contentContainer;

  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE/Edge */

  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari */
  }
`;

const ToggleButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: ${({ $isDrawerOpen }) => ($isDrawerOpen ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  color: var(--color-black);
  background-color: var(--neutral-200);

  & > svg + svg {
    margin-left: -4px;
  }
`;

const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
`;

const StyledTableMenu = styled.div`
  /* 기존 스타일 */
  display: flex;
  align-items: center;
  padding: 12px 0 0 0;
  gap: 8px;

  /* 수평 스크롤이 생기지 않도록 wrap 허용 */
  flex-wrap: wrap;

  /* 특정 너비 이하가 되면 컬럼 방향으로 전환 */
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;


const ViewerOption = styled.div`
  align-items: center;
  gap: 16px;
`;

const Divider = styled.div`
  width: 1px;
  height: 40px;
  background-color: var(--neutral-300);

  @media (max-width: 768px) {
    display: none !important;
  }
`;

const TableOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex: 1;

  @container contentContainer (max-width: 350px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;


const LeftOptions = styled.div`
  display: flex;
  flex-direction: column;
`;

const DataToolsOption = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const DataToolsContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px;
  align-items: center;
  position: relative;
  background-color: var(--neutral-100);
  border-radius: 8px;
`;

const FileButtons = styled.div`
  display: flex;
  gap: 16px;
  position: relative;
`;

const DataViewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ImageContentContainer = styled.div.attrs((props) => ({
  className: props.className,
}))`
  display: flex;
  flex-grow: 1;
  position: relative;
  height: 100%;
  min-height: 0;
  justify-content: center;
`;

const InteractiveIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isFilterOpen', 'isActive', 'hasFilters', 'hasSort', 'hasGroup'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  background-color: ${({ isFilterOpen, isActive }) =>
    isFilterOpen || isActive ? 'var(--neutral-light)' : 'transparent'};
  position: relative;

  &:hover {
    background-color: var(--neutral-light);
  }

  ${({ hasFilters, hasSort, hasGroup }) => (hasFilters || hasSort || hasGroup) && `
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background-color: #006AFF;
      border-radius: 50%;
    }
  `}
`;

const ExtraButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
`;

const SummaryButton = styled.button`
  border: 1px solid ${props => props.$isActive ? '#006AFF' : 'var(--neutral-300)'};
  background: ${props => props.$isActive ? '#F0F6FF' : 'white'};
  color: ${props => props.$isActive ? '#006AFF' : 'var(--neutral-900)'};
  border-radius: 8px;
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  margin-top: 4px;
`;

const getSortLabel = (option) => {
  switch (option) {
    case "class":
      return "Class";
    case "uploadedAt":
      return "Created Time";
    case "fileName":
      return "File Name";
    case "updatedTime":
      return "Updated Time";
    default:
      return "Created Time";
  }
};

const findGroupLabel = (optionValue) => {
  const found = groupLabels.find((item) => item.value === optionValue);
  return found ? found.label : optionValue;
};

const ProjectTitle = ({ projectId }) => {
  const [projectName, setProjectName] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (projectId) {
      getProject(projectId).then((p) => setProjectName(p.name));
    }
  }, [projectId]);
  return (
    <span
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      onClick={() => router.push('/project')}
    >
      <FontAwesomeIcon icon={faChevronLeft} style={{ width: 21, height: 20 }} />
      <h1 style={{ margin: 0 }}>{projectName}</h1>
    </span>
  );
};

const ContentSection = ({
  images,
  saveImage,
  deleteImage,
  selectedDatasetIds,
  classes,
  activeClasses,
  isSidebarVisible,
  setIsSidebarVisible,
  selectedImageIds,
  setSelectedImageIds,
  onImageDoubleClick,
  projectId,
}) => {
  const [viewMode, setViewMode] = useState("grid");
  const [isImageUploadModalVisible, setImageUploadModalVisible] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  
  const [groupByOption, setGroupByOption] = useState(null);
  const [isGroupByDropdownVisible, setGroupByDropdownVisible] = useState(false);

  const [openTool, setOpenTool] = useState(null); // "sort", "filter", "group", or null
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  
  const [showGroupButtons, setShowGroupButtons] = useState(false);
  
  const sortMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const groupByMenuRef = useRef(null);

  const [isFilterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeFilterGroup, setActiveFilterGroup] = useState(null);

  const [sortCriteria, setSortCriteria] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);


  const extractedData = useMemo(() => extractUniqueAndRange(images), [images]);
  
  const filteredData = filterData(images, filters);
  const sortedData = sortData(filteredData, sortCriteria);
  const groupedData = groupData(sortedData, groupByOption);
  
  useOutsideClick(filterMenuRef, () => {
    setFilterDropdownVisible(false)
    setOpenTool(null);
  });

  const getFilterSummaries = () => {
    const summaries = [];
    filterConfigs.forEach((config) => {
      if (config.type === "dateRange") {
        const hasStart = !!filters.dateRange?.[config.rangeKey]?.start;
        const hasEnd = !!filters.dateRange?.[config.rangeKey]?.end;
        if (hasStart || hasEnd) {
          summaries.push([
            config.label,
            [`${filters.dateRange[config.rangeKey].start || "Any"} ~ ${filters.dateRange[config.rangeKey].end || "Any"}`]
          ]);
        }
      } else if (config.type === "multiSelect") {
        if (filters[config.value]?.length > 0) {
          if (config.value === "Class") {
            const classNames = filters[config.value]
              .map(id => activeClasses.find(c => c.id === id)?.name)
              .filter(Boolean);
            summaries.push([config.label, classNames]);
          } else {
            summaries.push([config.label, filters[config.value]]);
          }
        }
      }
    });
    return summaries;
  };

  const filterSummaries = getFilterSummaries();

  const handleDownloadFiles = async () => {
    await handleDownload(sortedData, activeClasses);
  };

  const handleSelectAllImages = () => {
    setSelectedImageIds(
      selectedImageIds.length === filteredData.length
        ? []
        : filteredData.map((image) => image.id)
    );
  };

  // 선택 이미지 삭제
  const handleDelete = () => {
    selectedImageIds.forEach((id) => deleteImage(id, selectedDatasetIds));
    setSelectedImageIds([]);
  };

  return (
    <Content>
      <ContentHeader>
        {!isSidebarVisible && (
          <ToggleButton onClick={() => setIsSidebarVisible((prev) => !prev)}>
            <>
              <FontAwesomeIcon icon={faChevronRight} />
              <FontAwesomeIcon icon={faChevronRight} />
            </>
          </ToggleButton>
        )}
        <ProjectTitle projectId={projectId} />
      </ContentHeader>

      <StyledTableMenu>
        <ViewerOption>
          <Toggle selectedIcon={viewMode} onChange={setViewMode}>
            <ToggleIcon name="grid">
              <Grid />
            </ToggleIcon>
            <ToggleIcon name="list">
              <FontAwesomeIcon icon={faList} />
            </ToggleIcon>
            <ToggleIcon name="scatter">
              <ChartScatter />
            </ToggleIcon>
            <ToggleIcon name="lineChart">
              <FontAwesomeIcon icon={faChartLine} />
            </ToggleIcon>
          </Toggle>
        </ViewerOption>
        <Divider />
        <TableOption>
          <LeftOptions>
            <DataToolsOption>

              <DataToolsContainer>
                <InteractiveIcon
                  onMouseDown={() => setOpenTool(openTool === "sort" ? null : "sort")}
                  hasSort={sortCriteria.length > 0}
                >
                  <ArrowDownUp color={sortCriteria.length > 0 ? "#006AFF" : "currentColor"} />
                </InteractiveIcon>
                {openTool === "sort" && sortCriteria.length === 0 && (
                  <MenuContainer ref={sortMenuRef}>
                    <SortMenu
                      onClose={() => setOpenTool(null)}
                      menuRef={sortMenuRef}
                      sortCriteria={sortCriteria}
                      setSortCriteria={setSortCriteria}
                      activeIndex={activeIndex}
                      setActiveIndex={setActiveIndex}
                      setOpenTool={setOpenTool}
                    />
                  </MenuContainer>
                )}
                <InteractiveIcon
                  onMouseDown={() => setOpenTool(openTool === "filter" ? null : "filter")}
                  hasFilters={filterSummaries.length > 0}
                >
                  <Filter color={filterSummaries.length > 0 ? "#006AFF" : "currentColor"} />
                </InteractiveIcon>
                {openTool === "filter" && filterSummaries.length === 0 && (
                  <MenuContainer ref={filterMenuRef}>
                    <FilterMenu
                      onClose={() => {}}
                      activeFilterGroup={activeFilterGroup}
                      setActiveFilterGroup={setActiveFilterGroup}
                      activeClasses={activeClasses}
                      extractedData={extractedData}
                      filters={filters}
                      setFilters={setFilters}
                    />
                  </MenuContainer>
                )}
                <InteractiveIcon
                  onMouseDown={() => {
                    if (groupByOption !== null) {
                      setShowGroupButtons(!showGroupButtons);
                      setOpenTool(null);
                    } else {
                      setOpenTool(openTool === "group" ? null : "group")
                    }
                  }}
                  hasGroup={!!groupByOption}
                >
                  <LayerGroup color={!!groupByOption ? "#006AFF" : "currentColor"} />
                </InteractiveIcon>
                {openTool === "group" && (
                  <MenuContainer ref={groupByMenuRef}>
                    <GroupByMenu
                      onClose={() => setOpenTool(null)}
                      groupByOption={groupByOption}
                      setGroupByOption={setGroupByOption}
                      setShowGroupButtons={setShowGroupButtons}
                    />
                  </MenuContainer>
                )}
              </DataToolsContainer>
            </DataToolsOption>
          </LeftOptions>
          <FileButtons>
            <button
              onClick={() => setImageUploadModalVisible(true)}
              disabled={selectedDatasetIds.length === 0}
            >
              Upload
            </button>
            <button 
              className="outlined" 
              onClick={handleDelete}
              style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
            >
              Delete
            </button>
            <button 
              className="outlined" 
              onClick={handleDownloadFiles}
              // style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              Export
            </button>
            {/* Upload Modal */}
            {isImageUploadModalVisible && (
              <UploadModal
                saveImage={saveImage}
                selectedDatasetIds={selectedDatasetIds}
                onClose={() => {
                  setImageUploadModalVisible(false);
                  setImageFiles([]);
                }}
              />
            )}
          </FileButtons>
        </TableOption>
      </StyledTableMenu>

      {openTool === "sort" && sortCriteria.length > 0 && (
        <div style={{ position: 'relative' }}>
          <ExtraButtonContainer>
            {sortCriteria.map((criteria, index) => (
              <div key={index} style={{ position: 'relative', zIndex: isSummaryVisible && activeIndex === index ? 1001 : 1 }}>
                <SummaryButton
                  className="sort-summary-button"
                  $isActive={isSummaryVisible && activeIndex === index}
                  onMouseDown={() => {
                    setActiveIndex(index);
                    if (isSummaryVisible && activeIndex === index) {
                      setIsSummaryVisible(false);
                    } else {
                      setIsSummaryVisible(true);
                    }
                  }}
                >
                  <FontAwesomeIcon
                    icon={criteria.order === "asc" ? faArrowUp : faArrowDown}
                    style={{ marginRight: "8px" }}
                  />
                  {getSortLabel(criteria.option)}
                  <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
                </SummaryButton>
              </div>
            ))}
            <div style={{ position: 'relative', zIndex: isSummaryVisible && activeIndex === sortCriteria.length ? 1001 : 1 }}>
              <SummaryButton
                className={`sort-summary-button`}
                $isActive={isSummaryVisible && activeIndex === sortCriteria.length}
                onMouseDown={() => {
                  if (isSummaryVisible && activeIndex === sortCriteria.length) {
                    setIsSummaryVisible(false);
                  } else {
                    setActiveIndex(sortCriteria.length);
                    setIsSummaryVisible(true);
                  }
                }}
              >
                + Add Sort
              </SummaryButton>
            </div>
          </ExtraButtonContainer>
          {isSummaryVisible && (
            <SortMenu
              onClose={() => setOpenTool(null)}
              menuRef={sortMenuRef}
              sortCriteria={sortCriteria}
              setSortCriteria={setSortCriteria}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              setOpenTool={setOpenTool}
            />
          )}
        </div>
      )}

      {openTool === "filter" && filterSummaries.length > 0 && (
        <div style={{ position: 'relative' }}>
          <ExtraButtonContainer>
            {filterSummaries.map(([key, value]) => (
              <SummaryButton
                key={key}
                $isActive={isFilterDropdownVisible && activeFilterGroup === key}
                onMouseDown={() => {
                  if (isFilterDropdownVisible && activeFilterGroup === key) {
                    setFilterDropdownVisible(false);
                  } else {
                    setFilterDropdownVisible(true);
                    setActiveFilterGroup(key);
                  }
                }}
              >
                {`${key} | ${value.join(", ")}`}
                <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
              </SummaryButton>
            ))}
            <div style={{ position: 'relative', zIndex: isFilterDropdownVisible && !activeFilterGroup ? 1001 : 1 }}>
              <SummaryButton
                $isActive={isFilterDropdownVisible && activeFilterGroup === null}
                onMouseDown={() => {
                  if (isFilterDropdownVisible && activeFilterGroup === null) {
                    setFilterDropdownVisible(false);
                  } else {
                    setFilterDropdownVisible(true);
                  }
                  setActiveFilterGroup(null);
                }}
              >
                + Add Filter
              </SummaryButton>
            </div>
          </ExtraButtonContainer>
          {isFilterDropdownVisible && (
            <FilterMenu
              onClose={() => setFilterDropdownVisible(false)}
              menuRef={filterMenuRef}
              activeFilterGroup={activeFilterGroup}
              setActiveFilterGroup={setActiveFilterGroup}
              activeClasses={activeClasses}
              extractedData={extractedData}
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>
      )}

      {showGroupButtons && (
        <div style={{ position: 'relative' }}>
          <ExtraButtonContainer>
            {groupByOption && (
              <SummaryButton
                $isActive={isGroupByDropdownVisible}
                onClick={() => setOpenTool(openTool === "group" ? null : "group")}
              >
                <span>{findGroupLabel(groupByOption)}</span>
                <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
              </SummaryButton>
            )}
          </ExtraButtonContainer>
        </div>
      )}

      <DataViewHeader>
        <CheckboxContainer>
          <Checkbox
            isChecked={
              sortedData.length > 0 && 
              selectedImageIds.length === sortedData.length
            }
            onChange={handleSelectAllImages}
          />
          Select all
        </CheckboxContainer>
        Selected: {selectedImageIds.length} / Total: {sortedData.length}
      </DataViewHeader>

      <ImageContentContainer className="ImageContentContainer">
        {viewMode === "scatter" ? (
          <>
            {/* {console.log("🎯 PlotCanvas 렌더링됨")} */}
            <PlotCanvas
              images={sortedData}
              classes={activeClasses.map((id) => classes[id]).filter(Boolean)}
              selectedPoints={selectedImageIds}
              setSelectedPoints={setSelectedImageIds}
            />
          </>
        ) : viewMode === "list" ? (
          <>
            {/* {console.log("🎯 ListView 렌더링됨")} */}
            <ListView 
              images={sortedData} 
              classes={activeClasses} 
              setSelectedImageIds={setSelectedImageIds}
              selectedImageIds={selectedImageIds}
            />
          </>
        ) : viewMode === "lineChart" ? (
          <>
            {/* {console.log("🎯 Statics 렌더링됨")} */}
            <Statics 
              images={sortedData} 
              classes={activeClasses.map((id) => classes[id]).filter(Boolean)}
              selectedImageIds={selectedImageIds}
              setSelectedImageIds={setSelectedImageIds}
            />
          </>
          
        ) : sortedData.length === 0 ? (
          <EmptyMessage>Images</EmptyMessage>
        ) : (
          <>
            {/* {console.log("🎯 ImageGrid 렌더링됨")} */}
            <ImageGrid
              groupedImages={groupedData}
              activeClasses={activeClasses}
              selectedImageIds={selectedImageIds}
              setSelectedImageIds={setSelectedImageIds}
              onImageDoubleClick={onImageDoubleClick}
            />
          </>
        )}
      </ImageContentContainer>
    </Content>
  );
};

export default ContentSection;
