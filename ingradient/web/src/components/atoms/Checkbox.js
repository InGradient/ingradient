"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";

const CheckboxContainer = styled.div`
  width: 28px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Icon = styled(FontAwesomeIcon)`
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  color: gray;
`;

const Checkbox = ({ isChecked, onChange }) => {
  return (
    <CheckboxContainer onClick={onChange}>
      <Icon icon={isChecked ? faSquareCheck : faSquare} />
    </CheckboxContainer>
  );
};

export default Checkbox;
