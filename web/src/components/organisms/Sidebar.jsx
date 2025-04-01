"use client";

import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faTag,
  faUser,
  faRightFromBracket,
  faTv,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "components/atoms/Logo";
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

const StyledIcon = styled(FontAwesomeIcon)`
  color: white;
`;

export const Sidebar = ({ className }) => {
  // const router = useRouter();

  // const handleLogout = async () => {
  //   try {
  //     await signOut(auth);
  //     router.push("/login");
  //   } catch (error) {
  //     console.error("로그아웃 실패:", error);
  //   }
  // };

  return (
    <StyledSidebar className={`sidebar ${className}`}>
      <div className="main-menu">
        <div className="logo-container">
          <Logo mode="radius" />
        </div>
        <div className="menu-wrapper">
          <TabMenu icon={<StyledIcon icon={faTableCellsLarge} />} status="default" to="/catalog" />
          {/* <TabMenu icon={<StyledIcon icon={faTv} />} status="default" to="/compare" />
          <TabMenu icon={<StyledIcon icon={faTag} />} showTitle status="default" to="/classbook" /> */}
        </div>
      </div>
      {/* <div className="user-menu">
        <TabMenu icon={<StyledIcon icon={faUser} />} status="default" to="/profile" />

        <TabMenu
          icon={<StyledIcon icon={faRightFromBracket} />}
          status="default"
          onClick={handleLogout}
        />
      </div> */}
    </StyledSidebar>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
};
