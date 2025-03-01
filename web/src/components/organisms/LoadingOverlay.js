import React from "react";
import styled from "styled-components";
import useLoadingStore from "@/state/loading";

const LoadingOverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const StatusText = styled.p`
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 10px;
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
`;

const ProgressContainer = styled.div`
  position: relative;
  width: 300px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  color: white;
  text-align: center;
  margin-top: 10px;
`;

const LoadingOverlay = () => {
  const { loading, progress, loadingStatus } = useLoadingStore();

  if (!loading) return null;

  return (
    <LoadingOverlayContainer>
      <StatusText>{loadingStatus}</StatusText>
      <ProgressContainer>
        <ProgressBar style={{ width: `${progress}%` }} />
      </ProgressContainer>
      <ProgressText>{Math.round(progress)}% Complete</ProgressText>
    </LoadingOverlayContainer>
  );
};

export default LoadingOverlay;
