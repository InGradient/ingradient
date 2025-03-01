"use client";

import PropTypes from "prop-types";
import styled from "styled-components";
import { useReducer } from "react";
import { useRouter } from "next/navigation";

const StyledTabMenu = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  cursor: pointer;
  box-sizing: border-box;

  &.clicked .icon-container,
  &.hover .icon-container,
  &.active .icon-container {
    background-color: var(--accent-active);
  }

  .icon-container {
    border-radius: 12px;
    width: 56px;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
  }

  &.show-title-false {
    opacity: 0;
  }
`;

const reducer = (state, action) => {
  switch (action) {
    case "mouse_enter":
      return { ...state, status: "hover" };
    case "mouse_leave":
      return { ...state, status: "default" };
    case "click":
      return { ...state, status: "clicked" };
    default:
      return state;
  }
};

export const TabMenu = ({
  children,
  status,
  showTitle,
  className,
  icon,
  to,
  onClick: customOnClick,
}) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    status: status || "default",
    showTitle: showTitle !== undefined ? showTitle : true,
  });

  const handleClick = () => {
    // 만약 customOnClick이 전달되면 그 함수를 우선 실행합니다.
    if (typeof customOnClick === "function") {
      customOnClick();
    } else if (to) {
      router.push(to);
    }
    dispatch("click");
  };

  return (
    <StyledTabMenu
      className={`menu-icon ${state.status} ${className} ${
        status === "active" ? "active" : ""
      }`}
      onMouseEnter={() => dispatch("mouse_enter")}
      onMouseLeave={() => dispatch("mouse_leave")}
      onClick={handleClick}
    >
      <div className={`icon-container ${state.status}`}>{icon}</div>
      {state.showTitle && children}
    </StyledTabMenu>
  );
};

TabMenu.propTypes = {
  children: PropTypes.node,
  status: PropTypes.string,
  showTitle: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node.isRequired,
  to: PropTypes.string, // 이제 선택적으로 사용할 수 있습니다.
  onClick: PropTypes.func,
};

TabMenu.defaultProps = {
  to: "#", // 기본 dummy 값
  onClick: null,
};
