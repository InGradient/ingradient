import React from "react";

const ColorCriteriaDropdown = ({ criteria, setCriteria, colorBarInfo }) => {
  const options = ["Class", "Edited At", "Uploaded At", "Approval"];

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 10,
        background: "#fff",
        padding: "8px 12px",
        borderRadius: "8px",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.15)",
        fontFamily: "Pretendard",
        width: "240px",
      }}
    >
      <label style={{ marginBottom: "8px" }}>
        Color by:
      </label>
      <select
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        style={{
          marginLeft: "8px",
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontSize: "14px",
          marginBottom: "12px",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Show color bar only for date-based criteria */}
      {["Edited At", "Uploaded At"].includes(criteria) && colorBarInfo && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            <span>{colorBarInfo.minDate}</span>
            <span>{colorBarInfo.maxDate}</span>
          </div>
          <div
            style={{
              height: "12px",
              width: "100%",
              background: `linear-gradient(to right, ${colorBarInfo.palette.join(
                ", "
              )})`,
              borderRadius: "6px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ColorCriteriaDropdown;
