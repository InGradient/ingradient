"use client";

// import { DataProvider } from "@/contexts/DataProvider";
import { Sidebar } from "@/app/(app)/Sidebar";
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

export default function ClientLayout({ children }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <StyledMain>
      <SidebarContainer>
        <Sidebar />
      </SidebarContainer>
      <LayoutContainer>{children}</LayoutContainer>
    </StyledMain>
  );
}
