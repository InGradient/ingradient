import React from 'react';

const ArrowDownUp = ({ size = 20, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    fill={color}
  >
    <path
      d="M2.4687 13.7809L5.4687 16.7809C5.76245 17.0746 6.23745 17.0746 6.52808 16.7809L9.52808 13.7809C9.82183 13.4871 9.82183 13.0121 9.52808 12.7215C9.23433 12.4309 8.75933 12.4277 8.4687 12.7215L6.74995 14.4402V3.74961C6.74995 3.33398 6.41558 2.99961 5.99995 2.99961C5.58433 2.99961 5.24995 3.33398 5.24995 3.74961V14.4402L3.5312 12.7184C3.23745 12.4246 2.76245 12.4246 2.47183 12.7184C2.1812 13.0121 2.17808 13.4871 2.47183 13.7777L2.4687 13.7809ZM13.4687 3.21836L10.4687 6.21836C10.175 6.51211 10.175 6.98711 10.4687 7.27773C10.7625 7.56836 11.2375 7.57148 11.5281 7.27773L13.2468 5.55898L13.25 16.2496C13.25 16.6652 13.5843 16.9996 14 16.9996C14.4156 16.9996 14.75 16.6652 14.75 16.2496V5.55898L16.4687 7.27773C16.7625 7.57148 17.2375 7.57148 17.5281 7.27773C17.8187 6.98398 17.8218 6.50898 17.5281 6.21836L14.5312 3.21836C14.2375 2.92461 13.7625 2.92461 13.4718 3.21836H13.4687Z"
    />
  </svg>
);

export default ArrowDownUp;
