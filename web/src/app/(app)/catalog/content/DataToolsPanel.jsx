"use client";

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";

import { ArrowDownUp, Filter, LayerGroup } from "@/components/atoms/Icon";
import SortDropdown from "./TableMenu/SortMenu";
import FilterDropdown from "./TableMenu/FilterMenu";
import GroupByDropdown, { getGroupLabel } from "./TableMenu/GroupByMenu";

const DataToolsContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px;
  align-items: center;
  position: relative;
  background-color: var(--neutral-100);
  border-radius: 8px;
`;

const ExtraButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
`;

const SummaryButton = styled.button`
  border: 1px solid ${(props) => (props.$isActive ? "#006AFF" : "var(--neutral-300)")};
  background: ${(props) => (props.$isActive ? "#F0F6FF" : "white")};
  color: ${(props) => (props.$isActive ? "#006AFF" : "var(--neutral-900)")};
  border-radius: 8px;
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InteractiveIcon = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["isFilterOpen", "isActive", "hasFilters", "hasSort", "hasGroup"].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  background-color: ${({ isFilterOpen, isActive }) =>
    isFilterOpen || isActive ? "var(--neutral-light)" : "transparent"};
  position: relative;

  &:hover {
    background-color: var(--neutral-light);
  }

  ${({ hasFilters, hasSort, hasGroup }) =>
    (hasFilters || hasSort || hasGroup) &&
    `
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

const SortDropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  margin-top: 4px;
`;

export default function DataToolsPanel({
  filters,
  setFilters,
  filterSummaries,
  activeFilterGroup,
  setActiveFilterGroup,
  activeClasses,
  extractedData,

  sortCriteria,
  setSortCriteria,
  activeIndex,
  setActiveIndex,

  groupByOption,
  setGroupByOption,
}) {
  /** === Local States === */
  const [showSortButtons, setShowSortButtons] = useState(false);
  const [showFilterButtons, setShowFilterButtons] = useState(false);
  const [showGroupButtons, setShowGroupButtons] = useState(false);

  const [isSortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [isFilterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [isGroupByDropdownVisible, setGroupByDropdownVisible] = useState(false);

  /** === Refs === */
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  /** === Effect: sort 드롭다운 외부 클릭 감지 === */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target) &&
        !event.target.closest(".sort-summary-button")
      ) {
        setSortDropdownVisible(false);
        setActiveIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveIndex]);

  /** === 핸들러 === */
  const handleSortIconClick = () => {
    setShowSortButtons((prev) => !prev);
    setShowFilterButtons(false);
    setShowGroupButtons(false);
    // 정렬 옵션이 없으면 바로 열기
    if (sortCriteria.length === 0) {
      setSortDropdownVisible(true);
      setActiveIndex(0);
    }
  };

  const handleFilterIconClick = () => {
    setShowFilterButtons((prev) => !prev);
    setShowSortButtons(false);
    setShowGroupButtons(false);
    // setFilterDropdownVisible(true); // 필요시
    setActiveFilterGroup(null);
  };

  const handleGroupIconClick = () => {
    setShowGroupButtons((prev) => !prev);
    setShowFilterButtons(false);
    setShowSortButtons(false);
    if (!groupByOption) {
      setGroupByDropdownVisible(true);
    }
  };

  return (
    <>
      {/* === 기본 아이콘들: Sort / Filter / GroupBy === */}
      <DataToolsContainer>
        {/* 정렬 아이콘 */}
        <InteractiveIcon onClick={handleSortIconClick} hasSort={sortCriteria.length > 0}>
          <ArrowDownUp color={sortCriteria.length > 0 ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>
        {/* 정렬 드롭다운 (sortCriteria.length === 0 일때) */}
        {showSortButtons && sortCriteria.length === 0 && (
          <SortDropdownContainer ref={sortDropdownRef}>
            <SortDropdown
              isOpen={isSortDropdownVisible}
              onClose={() => {
                setSortDropdownVisible(false);
                setActiveIndex(null);
                if (sortCriteria.length === 0) setShowSortButtons(false);
              }}
              sortCriteria={sortCriteria}
              setSortCriteria={setSortCriteria}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              showInitialOptions={true}
              setShowSortButtons={setShowSortButtons}
            />
          </SortDropdownContainer>
        )}

        {/* 필터 아이콘 */}
        <InteractiveIcon onClick={handleFilterIconClick} hasFilters={filterSummaries.length > 0}>
          <Filter color={filterSummaries.length > 0 ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>
        {/* 필터 드롭다운 (filterSummaries.length === 0 일때) */}
        {showFilterButtons && filterSummaries.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "8px",
              zIndex: 1001,
              marginTop: "4px",
            }}
            ref={filterDropdownRef}
          >
            <FilterDropdown
              isOpen={isFilterDropdownVisible}
              onClose={() => {
                setFilterDropdownVisible(false);
                setActiveFilterGroup(null);
                if (filterSummaries.length === 0) {
                  setShowFilterButtons(false);
                }
              }}
              activeFilterGroup={activeFilterGroup}
              setActiveFilterGroup={setActiveFilterGroup}
              activeClasses={activeClasses}
              extractedData={extractedData}
              filters={filters}
              setFilters={setFilters}
              filterConfigs={{}} // 필요하다면 전달
            />
          </div>
        )}

        {/* 그룹 아이콘 */}
        <InteractiveIcon onClick={handleGroupIconClick} hasGroup={!!groupByOption}>
          <LayerGroup color={!!groupByOption ? "#006AFF" : "currentColor"} />
        </InteractiveIcon>
      </DataToolsContainer>

      {/* === 필터 Summaries === */}
      {showFilterButtons && filterSummaries.length > 0 && (
        <div style={{ position: "relative" }}>
          <ExtraButtonContainer>
            {filterSummaries.map(([key, value]) => (
              <SummaryButton
                key={key}
                $isActive={isFilterDropdownVisible && activeFilterGroup === key}
                onClick={() => {
                  if (isFilterDropdownVisible) {
                    setFilterDropdownVisible(false);
                    setActiveFilterGroup(null);
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
            <div style={{ position: "relative", zIndex: isFilterDropdownVisible && !activeFilterGroup ? 1001 : 1 }}>
              <button
                className={`outlined small`}
                style={{
                  borderColor: isFilterDropdownVisible && !activeFilterGroup ? "#006AFF" : "var(--neutral-300)",
                  background: isFilterDropdownVisible && !activeFilterGroup ? "#F0F6FF" : "white",
                  color: isFilterDropdownVisible && !activeFilterGroup ? "#006AFF" : "var(--neutral-900)",
                }}
                onClick={() => {
                  if (isFilterDropdownVisible) {
                    setFilterDropdownVisible(false);
                    setActiveFilterGroup(null);
                  } else {
                    setFilterDropdownVisible(true);
                    setActiveFilterGroup(null);
                  }
                }}
              >
                + Add Filter
              </button>
            </div>
          </ExtraButtonContainer>
          {isFilterDropdownVisible && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 1001,
                marginTop: "4px",
              }}
            >
              <FilterDropdown
                isOpen={isFilterDropdownVisible}
                onClose={() => {
                  setFilterDropdownVisible(false);
                  setActiveFilterGroup(null);
                }}
                activeFilterGroup={activeFilterGroup}
                setActiveFilterGroup={setActiveFilterGroup}
                activeClasses={activeClasses}
                extractedData={extractedData}
                filters={filters}
                setFilters={setFilters}
                filterConfigs={{}} // 필요시 전달
              />
            </div>
          )}
        </div>
      )}

      {/* === Sort Summaries === */}
      {showSortButtons && sortCriteria.length > 0 && (
        <div style={{ position: "relative" }}>
          <ExtraButtonContainer>
            {sortCriteria.map((criteria, index) => (
              <div key={index} style={{ position: "relative", zIndex: isSortDropdownVisible && activeIndex === index ? 1001 : 1 }}>
                <SummaryButton
                  className="sort-summary-button"
                  $isActive={isSortDropdownVisible && activeIndex === index}
                  onClick={() => {
                    if (isSortDropdownVisible) {
                      setSortDropdownVisible(false);
                      setActiveIndex(null);
                    } else {
                      setSortDropdownVisible(true);
                      setActiveIndex(index);
                    }
                  }}
                >
                  <FontAwesomeIcon
                    icon={criteria.order === "asc" ? faArrowUp : faArrowDown}
                    style={{ marginRight: "8px" }}
                  />
                  {criteria.option /* getSortLabel(criteria.option) 를 써도 됨 */}
                  <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
                </SummaryButton>
              </div>
            ))}
            {/* +Add Sort 버튼 */}
            <div style={{ position: "relative", zIndex: isSortDropdownVisible && activeIndex === sortCriteria.length ? 1001 : 1 }}>
              <button
                className={`outlined small sort-summary-button`}
                style={{
                  borderColor: isSortDropdownVisible && activeIndex === sortCriteria.length ? "#006AFF" : "var(--neutral-300)",
                  background: isSortDropdownVisible && activeIndex === sortCriteria.length ? "#F0F6FF" : "white",
                  color: isSortDropdownVisible && activeIndex === sortCriteria.length ? "#006AFF" : "var(--neutral-900)",
                }}
                onClick={() => {
                  if (activeIndex === sortCriteria.length && isSortDropdownVisible) {
                    setSortDropdownVisible(false);
                    setActiveIndex(null);
                  } else if (!isSortDropdownVisible) {
                    setSortDropdownVisible(true);
                    setActiveIndex(sortCriteria.length);
                  }
                }}
              >
                + Add Sort
              </button>
            </div>
          </ExtraButtonContainer>
          {isSortDropdownVisible && (
            <SortDropdownContainer>
              <SortDropdown
                isOpen={isSortDropdownVisible}
                onClose={() => {
                  setSortDropdownVisible(false);
                  setActiveIndex(null);
                }}
                sortCriteria={sortCriteria}
                setSortCriteria={setSortCriteria}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                showInitialOptions={activeIndex === sortCriteria.length}
                setShowSortButtons={setShowSortButtons}
              />
            </SortDropdownContainer>
          )}
        </div>
      )}

      {/* === Group By Summaries === */}
      {showGroupButtons && (
        <div style={{ position: "relative" }}>
          <ExtraButtonContainer>
            {groupByOption && (
              <SummaryButton
                $isActive={isGroupByDropdownVisible}
                onClick={() => {
                  setGroupByDropdownVisible(true);
                }}
              >
                <span>{getGroupLabel(groupByOption)}</span>
                <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: "8px" }} />
              </SummaryButton>
            )}
          </ExtraButtonContainer>

          {isGroupByDropdownVisible && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 1001,
                marginTop: "4px",
              }}
            >
              <GroupByDropdown
                isOpen={isGroupByDropdownVisible}
                onClose={() => setGroupByDropdownVisible(false)}
                groupByOption={groupByOption}
                setGroupByOption={setGroupByOption}
                setShowGroupButtons={setShowGroupButtons}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
