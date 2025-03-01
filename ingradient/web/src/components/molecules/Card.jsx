import PropTypes from "prop-types";
import React, { memo, useMemo } from "react";
import { LabelStatus } from "components/atoms/LabelStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { LazyImage } from "components/molecules/LazyImage";
import styled from "styled-components";

const StyledCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected",
})`
  display: flex;
  flex-direction: column;
  width: 160px;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  border-radius: 4px;
  border: 1px solid var(--neutral-hover);
  transition: border-color 0.2s ease-in-out;

  ${(props) =>
    props.isSelected &&
    `
      border: 2px solid var(--accent-active);
    `}

  & .image-frame {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 127px;
    border: 1px solid var(--neutral-hover);
    border-radius: 4px;
    position: relative;

    ${(props) =>
      props.isSelected &&
      `
        &::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--accent-active);
          opacity: 0.3;
          pointer-events: none;
        }
      `}
  }

  & .dataset-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  & .image-properties {
    display: flex;
    flex-direction: column;
    padding: 8px;
  }

  & .frame {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  & .file-name {
    color: ${({ isSelected }) => isSelected ? "var(--accent-active)" : "none"};
    font-weight: ${({ isSelected }) => (isSelected ? "500" : "400")};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .label-status-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  & .sync-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
  }
`;

export const Card = memo(function Card({
  imageURL,
  thumbnailURL,
  fileName,
  imageDescription,
  isSelected,
  status,
}) {
  // 1) Blob -> URL.createObjectURL() 메모이제이션
  const memoizedImageUrl = useMemo(() => {
    if (imageURL instanceof Blob) {
      return URL.createObjectURL(imageURL);
    } else {
      return imageURL || thumbnailURL;
    }
  }, [imageURL, thumbnailURL]);

  return (
    <StyledCard isSelected={isSelected}>
      <div className="image-frame">
        {/* 2) Lazy Loading 적용 (Intersection Observer) */}
        <LazyImage
          className="dataset-image"
          alt={fileName}
          src={memoizedImageUrl}
        />
      </div>

      <div className="image-properties">
        <div className="frame">
          <div className="file-name">{fileName}</div>
          <div className="label-status-wrapper">
            <LabelStatus status={status} />
          </div>
        </div>
      </div>

      {status === "uploading" && (
        <FontAwesomeIcon className="sync-icon" icon={faRotate} spin />
      )}
    </StyledCard>
  );
});

Card.propTypes = {
  imageURL: PropTypes.instanceOf(Blob),
  thumbnailURL: PropTypes.string,
  fileName: PropTypes.string.isRequired,
  imageDescription: PropTypes.string,
  isSelected: PropTypes.bool,
  status: PropTypes.string,
};
