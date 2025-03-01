import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Trash } from "@/components/atoms/Icon";

import useOutsideClick from "hooks/useOutsideClick";
import Menu, { MenuTitle } from "components/molecules/Menu";
import MenuItem from "components/molecules/MenuItem";

export const groupLabels = [
  { value: "class", label: "Class" },
  { value: "UploadedAt", label: "Uploaded At" },
  { value: "updatedAt", label: "Updated At" },
  { value: "inferenceBy", label: "Inference By" },
];

const GroupByMenu = ({
  isOpen,
  onClose,
  groupByOption,
  setGroupByOption,
  setShowGroupButtons,
  width,
}) => {
  const menuRef = useRef();

  useOutsideClick(menuRef, () => {
    onClose();
  });

  return (
    <Menu ref={menuRef} isOpen={isOpen} width={width}>
      <MenuTitle>
        <h5 style={{ color: "var(--neutral)" }}>Group By</h5>
        <button
          className="icon"
          onClick={() => {
            if (groupByOption && groupByOption !== "none") {
              setGroupByOption(null);
              onClose();
              if (setShowGroupButtons) {
                setShowGroupButtons(false);
              }
            }
          }}
          disabled={!groupByOption || groupByOption === "none"}
        >
          <Trash color={groupByOption && groupByOption !== "none" ? "red" : "grey"} />
        </button>
      </MenuTitle>
      {groupLabels.map((option) => (
        <MenuItem
          key={option.value}
          justifyContent="space-between"
          onClick={() => {
            setGroupByOption(option.value);
            if (setShowGroupButtons) setShowGroupButtons(true);
            onClose();
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Menu>
  );
};

GroupByMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  groupByOption: PropTypes.string,
  setGroupByOption: PropTypes.func.isRequired,
  setShowGroupButtons: PropTypes.func,
  width: PropTypes.string,
};

export default GroupByMenu;
