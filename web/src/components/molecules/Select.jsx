// Select.jsx
import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import useOutsideClick from "hooks/useOutsideClick";

const SelectContainer = styled.div`
  padding: 8px 12px;
  border: 1px solid #d0dae8;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: ${(props) => props.width || "auto"};
`;

const OptionsContainer = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d0dae8;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1002;
`;

const Select = ({ width, label, selectedOption, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <SelectContainer width={width} onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption || label}</span>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
      </SelectContainer>
      {isOpen && (
        <OptionsContainer>
          {children}
        </OptionsContainer>
      )}
    </div>
  );
};

Select.propTypes = {
  width: PropTypes.string,
  label: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedOption: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Select;
