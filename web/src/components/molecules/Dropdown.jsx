import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const DropdownContainer = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 16px;
  width: ${({ width }) => width || "350px"};
`;

const DropdownTitle = styled.div`
  margin-bottom: 9px;
`;

const Dropdown = ({
  title,
  children,
  isOpen,
  onClose,
  top,
  left,
  width,
}) => {
  const dropdownRef = useRef();

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <DropdownContainer ref={dropdownRef} top={top} left={left} width={width}>
      {title && (
        <DropdownTitle>
          <h5 style={{ color: "var(--neutral)" }}>{title}</h5>
        </DropdownTitle>
      )}
      {children}
    </DropdownContainer>
  );
};

Dropdown.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  top: PropTypes.string,
  left: PropTypes.string,
  width: PropTypes.string,
};

export default Dropdown;
