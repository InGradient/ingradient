"use client";

import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

import { ArrowDownUp, Filter, LayerGroup } from "@/components/atoms/Icon";
// import MenuContainer from "./MenuContainer";
import SortMenu from "./SortMenu";
import FilterMenu from "./FilterMenu";
import GroupByMenu from "./GroupByMenu";
import { filterConfigs } from "./FilterConfigs";
// import { getSortLabel } from "../utils/getSortLabel";
// import { findGroupLabel } from "../utils/findGroupLabel";

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

const MenuContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  margin-top: 4px;
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

/** 필요한 styled-components 예시 */
const DataToolsContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px;
  align-items: center;
  position: relative;
  background-color: var(--neutral-100);
  border-radius: 8px;
`;

export default function TableMenu({
  /** ContentSection에서 넘어올 props */
  openTool, setOpenTool,
  sortCriteria, setSortCriteria,
  activeIndex, setActiveIndex,
  isSummaryVisible, setIsSummaryVisible,
  filterSummaries, isFilterDropdownVisible,
  setFilterDropdownVisible,
  activeFilterGroup, setActiveFilterGroup,
  groupByOption, setGroupByOption,
  showGroupButtons, setShowGroupButtons,
  isGroupByDropdownVisible, setGroupByDropdownVisible,
  activeClasses, extractedData, filters, setFilters,
  selectedImageIds,

}) {

  /** 정렬 아이콘 클릭 시 */
  const handleSortIcon = () => {
    setOpenTool(openTool === "sort" ? null : "sort");
  };

  /** 필터 아이콘 클릭 시 */
  const handleFilterIcon = () => {
    setOpenTool(openTool === "filter" ? null : "filter");
  };

  /** 그룹 아이콘 클릭 시 */
  const handleGroupIcon = () => {
    if (groupByOption !== null) {
      // 그룹핑 옵션이 이미 존재하면 토글로 showGroupButtons
      setShowGroupButtons(!showGroupButtons);
      setOpenTool(null);
    } else {
      // 그룹핑 옵션이 없으면 openTool "group"으로
      setOpenTool(openTool === "group" ? null : "group");
    }
  };


  return (
    <>
      {/* 상단 아이콘 3개 (Sort/Filter/Group) */}
      <DataToolsContainer>
        {/* 정렬 아이콘 */}
        <InteractiveIcon
          onMouseDown={handleSortIcon}
          hasSort={sortCriteria.length > 0}
        >
          <ArrowDownUp color={sortCriteria.length > 0 ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>

        {/* 필터 아이콘 */}
        <InteractiveIcon
          onMouseDown={handleFilterIcon}
          hasFilters={filterSummaries.length > 0}
        >
          <Filter color={filterSummaries.length > 0 ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>

        {/* 그룹 아이콘 */}
        <InteractiveIcon
          onMouseDown={handleGroupIcon}
          hasGroup={!!groupByOption}
        >
          <LayerGroup color={groupByOption ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>
      </DataToolsContainer>

      {/* 정렬 옵션 (openTool === "sort") */}
      {openTool === "sort" && sortCriteria.length === 0 && (
        <MenuContainer /* position: absolute ... */>
          <SortMenu
            onClose={() => setOpenTool(null)}
            sortCriteria={sortCriteria}
            setSortCriteria={setSortCriteria}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            setOpenTool={setOpenTool}
          />
        </MenuContainer>
      )}

      {/* 정렬 요약 버튼들 (sortCriteria.length > 0) */}
      {openTool === "sort" && sortCriteria.length > 0 && (
        <div style={{ position: 'relative' }}>
          <ExtraButtonContainer>
            {sortCriteria.map((criteria, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  zIndex: isSummaryVisible && activeIndex === index ? 1001 : 1
                }}
              >
                <SummaryButton
                  $isActive={isSummaryVisible && activeIndex === index}
                  onMouseDown={() => {
                    setActiveIndex(index);
                    setIsSummaryVisible(
                      isSummaryVisible && activeIndex === index ? false : true
                    );
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

            {/* +Add Sort 버튼 */}
            <div
              style={{
                position: 'relative',
                zIndex: isSummaryVisible && activeIndex === sortCriteria.length ? 1001 : 1
              }}
            >
              <SummaryButton
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

          {/* 아래 SortMenu (Add Sort / Edit Sort 아이템) */}
          {isSummaryVisible && (
            <SortMenu
              onClose={() => setOpenTool(null)}
              sortCriteria={sortCriteria}
              setSortCriteria={setSortCriteria}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              setOpenTool={setOpenTool}
            />
          )}
        </div>
      )}

      {/* 필터 옵션 (openTool === "filter") */}
      {openTool === "filter" && filterSummaries.length === 0 && (
        <MenuContainer /* position: absolute ... */>
          <FilterMenu
            onClose={() => setOpenTool(null)}
            activeFilterGroup={activeFilterGroup}
            setActiveFilterGroup={setActiveFilterGroup}
            activeClasses={activeClasses}
            extractedData={extractedData}
            filters={filters}
            setFilters={setFilters}
          />
        </MenuContainer>
      )}

      {/* 필터 요약 버튼들 (filterSummaries.length > 0) */}
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

            {/* +Add Filter 버튼 */}
            <div
              style={{
                position: 'relative',
                zIndex: isFilterDropdownVisible && !activeFilterGroup ? 1001 : 1
              }}
            >
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

          {/* 아래 FilterMenu */}
          {isFilterDropdownVisible && (
            <FilterMenu
              onClose={() => {
                setFilterDropdownVisible(false);
                setOpenTool(null);
              }}
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

      {/* 그룹 옵션 (showGroupButtons / openTool === 'group') */}
      {showGroupButtons && (
        <div style={{ position: 'relative' }}>
          <ExtraButtonContainer>
            {groupByOption && (
              <SummaryButton
                $isActive={isGroupByDropdownVisible}
                onClick={() => {
                  setOpenTool(openTool === "group" ? null : "group");
                }}
              >
                <span>{findGroupLabel(groupByOption)}</span>
                <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
              </SummaryButton>
            )}
          </ExtraButtonContainer>
        </div>
      )}
    </>
  );
}
