import React, { useState } from "react";
import Checkbox from "@/components/atoms/Checkbox";
import styled from "styled-components";
import { XMark, Trash } from "@/components/atoms/Icon";
import Menu, { MenuTitle } from "components/molecules/Menu";
import MenuItem from "components/molecules/MenuItem";
import { filterConfigs } from "./FilterConfigs";

const supportedConfigs = filterConfigs.filter(
  (cfg) => cfg.type === "multiSelect" || cfg.type === "dateRange"
);

// 공통 스타일 컴포넌트
const SearchContainer = styled.div`
  border: 1px solid #d0dae8;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
`;

const Chip = styled.div`
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  background: #f0f4f8;
`;

const RemoveIcon = styled.span`
  cursor: pointer;
  font-size: 12px;
  &:hover {
    color: #999;
  }
`;

const ColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ color }) => color || "#000"};
`;

export default function FilterMenu({
  onClose,
  menuRef,
  activeFilterGroup,
  setActiveFilterGroup,
  activeClasses,
  extractedData,
  filters,
  setFilters
}) {
  const [classSearch, setClassSearch] = useState("");

  // multiSelect는 배열로 관리 (키는 config.value)
  const toggleFilterOption = (key, value) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const handleDateRangeChange = (type, key, value) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange || {},
        [type]: {
          ...(prev.dateRange?.[type] || {}),
          [key]: value,
        },
      },
    }));
  };

  const clearFilter = (filterKey, config) => {
    switch (config.type) {
      case "dateRange":
        setFilters((prev) => ({
          ...prev,
          dateRange: {
            ...prev.dateRange,
            [config.rangeKey]: { start: "", end: "" },
          },
        }));
        break;
      case "multiSelect":
        setFilters((prev) => ({
          ...prev,
          [filterKey]: [],
        }));
        break;
      default:
        break;
    }
  };

  const hasFilterValue = (filterKey, config) => {
    switch (config.type) {
      case "dateRange": {
        const hasStart = !!filters.dateRange?.[config.rangeKey]?.start;
        const hasEnd = !!filters.dateRange?.[config.rangeKey]?.end;
        return hasStart || hasEnd;
      }
      case "multiSelect":
        return filters[filterKey]?.length > 0;
      default:
        return false;
    }
  };

  // activeFilterGroup는 config.value (예: "Class", "Created Date" 등)로 관리
  const activeConfig = supportedConfigs.find((cfg) => cfg.value === activeFilterGroup);
  const activeGroupHasValue = activeConfig ? hasFilterValue(activeConfig.value, activeConfig) : false;


  return (
    <Menu ref={menuRef} width="350px">
      <MenuTitle>
        <h5 style={{ color: "var(--neutral)" }}>
          {activeConfig ? activeConfig.label : "Filter Options"}
        </h5>
        {activeConfig && activeConfig.showClear && (
          <button
            className="icon"
            onClick={() => {
              if (activeGroupHasValue) {
                clearFilter(activeConfig.value, activeConfig);
                onClose();
              }
            }}
          >
            <Trash color={activeGroupHasValue ? "red" : "grey"} />
          </button>
        )}
      </MenuTitle>
      {activeConfig ? (
        activeConfig.type === "multiSelect" ? (
          <>
            <SearchContainer>
              {filters[activeConfig.value]?.map((id) => {
                const item = activeClasses.find((c) => c.id === id);
                if (!item) return null;
                return (
                  <Chip key={item.id}>
                    <ColorDot color={item.color} />
                    <span>{item.name}</span>
                    <RemoveIcon onClick={() => toggleFilterOption(activeConfig.value, item.id)}>
                      <XMark />
                    </RemoveIcon>
                  </Chip>
                );
              })}
              <input
                type="text"
                placeholder={`Search for ${activeConfig.label}`}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </SearchContainer>
            {activeConfig
              .getOptions(activeClasses)
              .filter(
                (item) =>
                  item.name.toLowerCase().includes(classSearch.toLowerCase()) &&
                  !(filters[activeConfig.value] || []).includes(item.id)
              )
              .map((item) => (
                <MenuItem
                  key={item.id}
                  onClick={() => {
                    toggleFilterOption(activeConfig.value, item.id);
                    setClassSearch("");
                  }}
                >
                  <Checkbox
                    isChecked={filters[activeConfig.value]?.includes(item.id) || false}
                    onChange={() => {}}
                  />
                  <span style={{ marginLeft: "8px" }}>{item.name}</span>
                </MenuItem>
              ))}
          </>
        ) : activeConfig.type === "dateRange" ? (
          <>
            <SearchContainer style={{ minHeight: "40px" }}>
              {(!!filters.dateRange?.[activeConfig.rangeKey]?.start ||
                !!filters.dateRange?.[activeConfig.rangeKey]?.end) && (
                <Chip>
                  <span>
                    {activeConfig.label} |{" "}
                    {filters.dateRange?.[activeConfig.rangeKey]?.start || "Any"} ~{" "}
                    {filters.dateRange?.[activeConfig.rangeKey]?.end || "Any"}
                  </span>
                  <RemoveIcon
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          [activeConfig.rangeKey]: { start: "", end: "" }
                        }
                      }));
                    }}
                  >
                    <XMark />
                  </RemoveIcon>
                </Chip>
              )}
            </SearchContainer>
            <MenuItem>
              From:{" "}
              <input
                type="date"
                value={filters.dateRange?.[activeConfig.rangeKey]?.start || ""}
                onChange={(e) =>
                  handleDateRangeChange(activeConfig.rangeKey, "start", e.target.value)
                }
                min={extractedData?.[`${activeConfig.rangeKey}Range`]?.min || ""}
                max={extractedData?.[`${activeConfig.rangeKey}Range`]?.max || ""}
              />
            </MenuItem>
            <MenuItem>
              To:{" "}
              <input
                type="date"
                value={filters.dateRange?.[activeConfig.rangeKey]?.end || ""}
                onChange={(e) =>
                  handleDateRangeChange(activeConfig.rangeKey, "end", e.target.value)
                }
                min={extractedData?.[`${activeConfig.rangeKey}Range`]?.min || ""}
                max={extractedData?.[`${activeConfig.rangeKey}Range`]?.max || ""}
              />
            </MenuItem>
          </>
        ) : null
      ) : (
        supportedConfigs.map((config) => {
          const hasValue = hasFilterValue(config.value, config);
          return (
            <MenuItem
              key={config.value}
              onClick={() => setActiveFilterGroup(config.value)}
              justifyContent="space-between"
            >
              <h5>{config.label}</h5>
              {hasValue && (
                <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                  {config.type === "dateRange"
                    ? `${filters.dateRange[config.rangeKey].start || "Any"} ~ ${
                        filters.dateRange[config.rangeKey].end || "Any"
                      }`
                    : Array.isArray(filters[config.value])
                    ? `${filters[config.value].length} selected`
                    : ""}
                </span>
              )}
            </MenuItem>
          );
        })
      )}
    </Menu>
  );
}
