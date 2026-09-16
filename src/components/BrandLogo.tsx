import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Brand logo for Amouei Interior Decoration & Cabinetry
 * Vector implementation of the architectural EI monogram logo (white elements with transparent background)
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="لوگوی دکوراسیون و کابینت عمویی"
    >
      <defs>
        {/* Mask to create the horizontal stencil slits on the concentric circles at 9 and 3 o'clock */}
        <mask id="concentric-slits">
          {/* White fills everything (visible) */}
          <rect width="200" height="200" fill="white" />
          {/* Black rectangle creates the clean horizontal gap cutting through the circles */}
          <rect x="20" y="111" width="160" height="6.5" fill="black" />
        </mask>
      </defs>

      {/* 1. House Roof (Gable structure with eaves) */}
      {/* Roof peak at (100, 22), left eave at (31, 82), right eave at (169, 82) */}
      <path
        d="M 100 22 L 171 82.5 L 160 82.5 L 100 32 L 40 82.5 L 29 82.5 Z"
        fill="white"
      />

      {/* 2. Left Vertical Column / Chimney */}
      {/* Rises above roof slope on the left, extends down into outer circle */}
      <rect x="56.5" y="49" width="7" height="38" rx="0" fill="white" />

      {/* 3. Right Vertical Column */}
      {/* Extends downwards from the outer circle to bottom right */}
      <rect x="131.5" y="142" width="7" height="35" rx="0" fill="white" />

      {/* 4. Concentric Rings with horizontal slits */}
      <g mask="url(#concentric-slits)">
        {/* Outer Ring */}
        <circle
          cx="100"
          cy="114"
          r="54"
          stroke="white"
          strokeWidth="7"
        />
        {/* Inner Ring */}
        <circle
          cx="100"
          cy="114"
          r="36"
          stroke="white"
          strokeWidth="7"
        />
      </g>

      {/* 5. Central EI Monogram */}
      {/* Stylized rounded 'E' and 'I' inside the circle */}
      <g fill="white">
        {/* 'E' Letter */}
        <path
          d="
            M 91 93
            C 81 93, 76 97, 76 105
            L 76 123
            C 76 131, 81 135, 91 135
            L 107 135
            C 109 135, 110.5 133.5, 110.5 131.5
            C 110.5 129.5, 109 128, 107 128
            L 89 128
            C 85 128, 83.5 126, 83.5 121
            L 83.5 117.5
            L 103 117.5
            C 105 117.5, 106.5 116, 106.5 114
            C 106.5 112, 105 110.5, 103 110.5
            L 83.5 110.5
            L 83.5 107
            C 83.5 102, 85 100, 89 100
            L 107 100
            C 109 100, 110.5 98.5, 110.5 96.5
            C 110.5 94.5, 109 93, 107 93
            Z
          "
        />

        {/* 'I' Letter (Vertical rounded pill) */}
        <rect
          x="115"
          y="93"
          width="8.5"
          height="42"
          rx="4.25"
        />
      </g>
    </svg>
  );
};
