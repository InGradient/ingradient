import React from 'react';

const Sidebar = ({ width = 21, height = 19, color = "currentColor" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 21 19"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.25 2.625V16.375H18C18.3438 16.375 18.625 16.0938 18.625 15.75V3.25C18.625 2.90625 18.3438 2.625 18 2.625H9.25ZM0.5 3.25C0.5 1.87109 1.62109 0.75 3 0.75H18C19.3789 0.75 20.5 1.87109 20.5 3.25V15.75C20.5 17.1289 19.3789 18.25 18 18.25H3C1.62109 18.25 0.5 17.1289 0.5 15.75V3.25Z"
    />
  </svg>
);

export default Sidebar;