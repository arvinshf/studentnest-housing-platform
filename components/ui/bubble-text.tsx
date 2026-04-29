import React, { useState } from "react";

export const BubbleText = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const text = "Find Your Perfect Student Room";

  return (
    <h2
      onMouseLeave={() => setHoveredIndex(null)}
      className="text-center text-5xl font-thin text-indigo-300"
    >
      {text.split("").map((char, idx) => {
        const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - idx) : null;
        let classes = "transition-all duration-300 ease-in-out cursor-default";
        switch (distance) {
          case 0:
            classes += " font-black text-indigo-50";
            break;
          case 1:
            classes += " font-medium text-indigo-200";
            break;
          case 2:
            classes += " font-light";
            break;
          default:
            break;
        }
        return (
          <span
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            className={classes}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </h2>
  );
};
