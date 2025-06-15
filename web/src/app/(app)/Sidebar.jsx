"use client";

import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import { usePathname } from "next/navigation";

import Logo from "components/atoms/Logo";
import { Grid } from "@/components/atoms/Icon";
import { TabMenu } from "components/molecules/TabMenu";

const StyledSidebar = styled.div`
  background-color: var(--background-dark);
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .logo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  & .menu-wrapper {
    display: flex;
    flex-direction: column;
    padding: 16px 0px;
  }

  .user-initial {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin: 16px auto;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
    }
  }
`;

export const Sidebar = ({ className }) => {
  const pathname = usePathname();
  const isActiveCatalog = pathname === "/catalog/";
  
  // TODO: 실제 사용자 정보로 교체 필요
  const userInitial = "J"; // 임시로 하드코딩된 이니셜

  return (
    <StyledSidebar className={`sidebar ${className}`}>
      <div className="main-menu">
        <div className="logo-container">
          <Logo mode="radius" />
        </div>
        <div className="menu-wrapper">
          <TabMenu
            icon={<Grid color="white" />}
            status={isActiveCatalog ? "active" : "default"}
            to="/project"
          />
        </div>
      </div>
      <div className="user-initial" onClick={() => window.location.href = "/profile"}>
        {userInitial}
      </div>
    </StyledSidebar>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
};
