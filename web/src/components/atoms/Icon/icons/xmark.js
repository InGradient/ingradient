import React from 'react';

const XMark = ({ width = 14, height = 14, color = "currentColor" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 15 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.0861 5.21113C11.3064 4.99082 11.3064 4.63457 11.0861 4.4166C10.8658 4.19863 10.5096 4.19629 10.2916 4.4166L7.50254 7.20566L4.71113 4.41426C4.49082 4.19395 4.13457 4.19395 3.9166 4.41426C3.69863 4.63457 3.69629 4.99082 3.9166 5.20879L6.70566 7.99785L3.91426 10.7893C3.69395 11.0096 3.69395 11.3658 3.91426 11.5838C4.13457 11.8018 4.49082 11.8041 4.70879 11.5838L7.49785 8.79473L10.2893 11.5861C10.5096 11.8064 10.8658 11.8064 11.0838 11.5861C11.3018 11.3658 11.3041 11.0096 11.0838 10.7916L8.29473 8.00254L11.0861 5.21113Z"
    />
  </svg>
);

export default XMark;
