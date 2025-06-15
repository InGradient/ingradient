import React from "react";
import styled from "styled-components";

const StyledEmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  height: 100%;
  
  & .upload-message {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  & .text-wrapper-2 {
    color: #000000;
    margin-top: -1px;
    position: relative;
    text-align: center;
    white-space: nowrap;
    width: fit-content;
  }

  & .p {
    color: #000000;
    position: relative;
    text-align: center;
    white-space: nowrap;
    width: fit-content;
  }

  & .button-2 {
    align-self: stretch !important;
    flex: 1 !important;
    flex-grow: 1 !important;
    height: unset !important;
    width: unset !important;
  }
`;

export const EmptyMessage = ({ children, onCreate }) => {
  return (
    <StyledEmptyMessage>
      <div className="upload-message">
        <h3>No {children} Found</h3>
        You need to create new {children}.
        {onCreate && (
          <button
            className="button"
            onClick={onCreate}
            style={{ marginTop: 16 }}
          >
            Create {children}
          </button>
        )}
      </div>
    </StyledEmptyMessage>
  );
};
