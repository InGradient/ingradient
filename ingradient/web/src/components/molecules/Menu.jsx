import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

const StyledMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--neutral-300);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  overflow: visible;
  z-index: 1001;
  padding: 8px;

  /* width prop을 받아 적용 */
  width: ${(props) => props.$width || "auto"};

  /* Adjust margin for direct child MenuItem components if needed */
  > div > & {
    margin-bottom: 4px;
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

export const MenuTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
`;

const Menu = React.forwardRef(({ width, children, ...props }, ref) => {
  return (
    <StyledMenu ref={ref} $width={width} {...props}>
      {children}
    </StyledMenu>
  );
});

Menu.propTypes = {
  width: PropTypes.string,
  children: PropTypes.node,
};

export default Menu;
