"use client";

import { DataProvider } from "@/contexts/DataProvider";
import { Sidebar } from "components/organisms/Sidebar";
import styled from "styled-components";
import { useState, useEffect } from "react";

const StyledMain = styled.div`
  display: flex;
`;

const SidebarContainer = styled.div`
  width: 80px;
  flex-shrink: 0;
`;

const LayoutContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const LoadingContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f4f4;
  font-size: 1.5rem;
  color: #666;
`;

export default function ClientLayout({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }

  return (
    <DataProvider>
      <StyledMain>
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>
        <LayoutContainer>{children}</LayoutContainer>
      </StyledMain>
    </DataProvider>
  );
}
