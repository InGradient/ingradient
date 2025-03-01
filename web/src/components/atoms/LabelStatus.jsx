import PropTypes from "prop-types";
import React from "react";
import styled, { css } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheck, 
  faCloudArrowUp,
} from "@fortawesome/free-solid-svg-icons";

const statusBackgrounds = {
  confirm: <FontAwesomeIcon icon={faCheck} />,
  reject: <FontAwesomeIcon icon={faCloudArrowUp} />,
};

const StyledLabelStatus = styled.div`
  background-size: 100% 100%;
  height: 16px;
  width: 16px;

  ${(props) =>
    props.status &&
    css`
      background-image: url(${statusBackgrounds[props.status]});
    `}
`;

export const LabelStatus = ({ status, className }) => {
  return <StyledLabelStatus className={`label-status ${className}`} status={status} />;
};
