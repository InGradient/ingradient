import React, { useEffect } from "react";
import styled from "styled-components";

const ToggleContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background-color: var(--neutral-light);
  border-radius: 8px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  background-color: ${(props) =>
    props.$active ? "var(--background-dark)" : "transparent"};
  transition: background-color 0.3s ease;

  svg {
    color: ${(props) => (props.$active ? "white" : "var(--dark-muted)")};
    fill: ${(props) => (props.$active ? "white" : "var(--dark-muted)")};
    transition: color 0.3s ease, fill 0.3s ease;
  }
`;

export const Toggle = ({ children, selectedIcon, onChange }) => {
  useEffect(() => {
    // If no selectedIcon yet, default to the first child
    if (!selectedIcon && React.Children.count(children) > 0) {
      const firstChild = React.Children.toArray(children)[0];
      if (firstChild?.props?.name) {
        onChange(firstChild.props.name);
      }
    }
  }, [children, selectedIcon, onChange]);

  return (
    <ToggleContainer>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          $active: selectedIcon === child.props.name,
          onClick: () => onChange(child.props.name),
        })
      )}
    </ToggleContainer>
  );
};

export const ToggleIcon = ({ name, $active, onClick, children }) => {
  return (
    <IconWrapper $active={$active} onClick={onClick}>
      {children}
    </IconWrapper>
  );
};
