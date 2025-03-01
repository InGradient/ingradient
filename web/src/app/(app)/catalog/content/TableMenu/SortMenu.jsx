import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import useOutsideClick from "hooks/useOutsideClick";

import Menu, { MenuTitle } from "components/molecules/Menu";
import MenuItem from "components/molecules/MenuItem";
import Select from "components/molecules/Select";

import { sortLabels, orderLabels } from "./SortConfigs";

const getSortLabel = (value) => {
  const found = sortLabels.find((item) => item.value === value);
  return found ? found.label : value;
};

const getOrderLabel = (value) => {
  const found = orderLabels.find((item) => item.value === value);
  return found ? found.label : value;
};

const SortMenu = ({
  onClose,
  menuRef,
  sortCriteria,
  setSortCriteria,
  activeIndex,
  setActiveIndex,
  setOpenTool,
}) => {
  useOutsideClick(menuRef, () => {
    onClose();
  });

  const availableOptions = sortLabels.filter(
    (option) =>
      !sortCriteria.some((criteria) => criteria.option === option.value)
  );

  const handleOptionSelect = (optionValue) => {
    const newCriteria = [...sortCriteria];
    if (!newCriteria[activeIndex]) {
      newCriteria[activeIndex] = { option: optionValue, order: "asc" };
    } else {
      newCriteria[activeIndex] = { ...newCriteria[activeIndex], option: optionValue };
    }
    setSortCriteria(newCriteria);
  };

  const handleSortOrderSelect = (value, index) => {
    const newCriteria = [...sortCriteria];
    newCriteria[index] = { ...newCriteria[index], order: value };
    setSortCriteria(newCriteria);
  };

  const removeSortCriteria = (index) => {
    setSortCriteria((prev) => {
      const newCriteria = prev.filter((_, i) => i !== index);
      if (newCriteria.length === 0) {
        setOpenTool(null);
      } else {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
      return newCriteria;
    });
  };

  return (
    <Menu ref={menuRef}>
      <MenuTitle>
        <h5 style={{ color: "var(--neutral)" }}>Sort Options</h5>
      </MenuTitle>
      {sortCriteria.length === 0 || activeIndex === sortCriteria.length? (
        <div>
          {availableOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </div>
      ) : (
        sortCriteria.map((criteria, index) => (
          <MenuItem key={index}>
            <Select
              width="157px"
              label={getSortLabel(criteria.option)}
              selectedOption={getSortLabel(criteria.option)}
              onSelect={(optionValue) => {
                setActiveIndex(index);
                handleOptionSelect(optionValue);
              }}
            >
              {availableOptions
                .concat(sortLabels.find((item) => item.value === criteria.option))
                .map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </MenuItem>
                ))}
            </Select>
            <Select
              width="109px"
              label={getOrderLabel(criteria.order)}
              selectedOption={getOrderLabel(criteria.order)}
              onSelect={(value) => handleSortOrderSelect(value, index)}
            >
              {orderLabels.map((order) => (
                <MenuItem
                  key={order.value}
                  onClick={() => handleSortOrderSelect(order.value, index)}
                >
                  {order.label}
                </MenuItem>
              ))}
            </Select>
            <button className="icon" onClick={() => removeSortCriteria(index)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </MenuItem>
        ))
      )}
    </Menu>
  );
};

SortMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sortCriteria: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string.isRequired,
      order: PropTypes.string.isRequired,
    })
  ).isRequired,
  setSortCriteria: PropTypes.func.isRequired,
  activeIndex: PropTypes.number.isRequired,
  setActiveIndex: PropTypes.func.isRequired,
  showInitialOptions: PropTypes.bool.isRequired,
  setOpenTool: PropTypes.func.isRequired,
};

export default SortMenu;
