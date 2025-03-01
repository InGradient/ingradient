// File: ./DataTools/styles.js

import styled from "styled-components";

export const DatePickerContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export const Select = styled.select`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
`;

export const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

export const Chip = styled.div`
  padding: 8px 16px;
  border-radius: 16px;
  background-color: ${({ selected, color }) => (selected ? "transparent" : color)};
  border: 2px solid ${({ selected, color }) => (selected ? color : color)};
  color: ${({ selected }) => (selected ? "#000" : "#fff")};
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    background-color: ${({ selected, color }) => (selected ? "#f0f0f0" : color)};
  }
`;

export const SelectChip = styled.div`
  padding: 8px 16px;
  border-radius: 16px;
  background-color: ${({ selected }) => (selected ? "#000" : "transparent")};
  border: 2px solid ${({ selected }) => (selected ? "#000" : "#ccc")};
  color: ${({ selected }) => (selected ? "#fff" : "#000")};
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    background-color: ${({ selected }) => (selected ? "#000" : "#f0f0f0")};
  }
`;

export const DropdownContainer = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 16px;
  width: ${({ width }) => width || "320px"};
`;

export const DropdownTitle = styled.div`
  margin-bottom: 9px;
`;

export const DropdownContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
`;