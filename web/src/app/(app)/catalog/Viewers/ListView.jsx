import React, { useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import Checkbox from "@/components/atoms/Checkbox";
import { getServerBaseUrl } from "config/environment";

const TableContainer = styled.div`
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 8px 12px;
    border: 1px solid #ddd;
  }

  th {
    background-color: #f4f4f4;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f1f1f1;
    cursor: pointer;
  }

  td:first-child {
    width: 40px;
    text-align: center;
  }
`;

const Tooltip = styled.div`
  position: fixed; /* Fixed position to follow the mouse */
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px;
  z-index: 9999;
  pointer-events: none;

  img {
    width: 150px;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
  }
`;

const Chip = styled.span`
  display: inline-block;
  padding: 4px 8px;
  margin-right: 4px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  background-color: ${({ color }) => color || "#cccccc"};
`;

const StatusTag = styled.span`
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: white;
  background-color: ${({ status }) => {
    if (status === "pass") return "#4CAF50";
    if (status === "reject") return "#FF5722";
    return "#FFC107"; // pending
  }};
`;

const ListView = ({ images, classes, setSelectedImageIds, selectedImageIds }) => {
  const SERVER_BASE_URL = getServerBaseUrl();

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    imagePath: "",
  });

  const classMap = classes.reduce((acc, cls) => {
    acc[cls.id] = { name: cls.name, color: cls.color };
    return acc;
  }, {});

  const handleRowClick = (id) => {
    setSelectedImageIds([id]);
  };

  const handleCheckboxChange = (id) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const showTooltip = (event, imagePath) => {
    setTooltip({
      visible: true,
      x: event.clientX + 10, // Tooltip appears slightly to the right of the cursor
      y: event.clientY + 10, // Tooltip appears slightly below the cursor
      imagePath,
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, imagePath: "" });
  };

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // console.log("Images", images)

  return (
    <TableContainer>
      <StyledTable>
        <thead>
          <tr>
            <th></th>
            <th>Filename</th>
            <th>Class</th>
            <th>Approval</th>
            <th>Models</th>
            <th>Uploaded At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {images.map((image) => (
            <tr
              key={image.id}
              onClick={() => handleRowClick(image.id)}
              onMouseMove={(e) => showTooltip(e, image.thumbnailLocation)}
              onMouseLeave={hideTooltip}
              style={{
                backgroundColor: selectedImageIds.includes(image.id)
                  ? "var(--background-overlay)"
                  : "inherit",
              }}
            >
              <td
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Checkbox
                  isChecked={selectedImageIds.includes(image.id)}
                  onChange={() => handleCheckboxChange(image.id)}
                />
              </td>
              <td>{image.filename}</td>
              <td>
                <Chip color={classMap[image.classId]?.color}>
                  {classMap[image.classId]?.name || "Unknown"}
                </Chip>
              </td>
              <td>
                <StatusTag status={image.approval}>{image.approval}</StatusTag>
              </td>
              <td>
                {image.model &&
                  Object.keys(image.model).map((modelKey) => (
                    <Chip key={modelKey} color="#2196F3">
                      {modelKey}
                    </Chip>
                  ))}
              </td>
              <td>{dateFormatter.format(new Date(image.uploadAt))}</td>
              <td>{dateFormatter.format(new Date(image.updatedAt))}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
      {tooltip.visible &&
        ReactDOM.createPortal(
          <Tooltip style={{ top: tooltip.y, left: tooltip.x }}>
            <img
              src={
                tooltip.imagePath
                  ? `${SERVER_BASE_URL}/${tooltip.imagePath}`
                  : tooltip.imagePath
              }
              alt="Thumbnail" 
            />

          </Tooltip>,
          document.body
        )}
    </TableContainer>
  );
};

export default ListView;
