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
`;

export const Sidebar = ({ className }) => {
  const pathname = usePathname();
  const isActiveCatalog = pathname === "/catalog/";

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
            to="/catalog"
          />
        </div>
      </div>
    </StyledSidebar>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
};
