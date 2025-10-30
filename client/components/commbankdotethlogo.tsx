"use client";

import { motion } from "framer-motion";

const CommBankDotETHLogo = () => {
  return (
    <motion.svg
      width="300"
      height="300"
      viewBox="0 0 400 400"
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
        ease: "easeInOut",
      }}
      className="cursor-pointer pr-1"
      aria-label="Pulsating triangle. Click to toggle animation."
    >
      {/* Apply translation to center, then rotation of 40 degrees clockwise */}
      <g transform="translate(200, 200) rotate(30)">
        {/* Outer triangle */}
        <motion.path
          d="M0,-150 L130,75 L-130,75 Z"
          className="fill-primary"
          // stroke="#000"
          strokeWidth="2"
        />

        {/* Inner triangle 1 - 80% scale */}
        <motion.path
          d="M0,-120 L104,60 L-104,60 Z"
          className="dark:fill-black fill-white"
          // stroke="#000"
          strokeWidth="2"
        />

        {/* Inner triangle 2 - 60% scale */}
        <motion.path
          d="M0,-90 L78,45 L-78,45 Z"
          fill="#e69c40"
          className="fill-primary/60"
          // stroke="#000"
          strokeWidth="2"
        />

        {/* Inner triangle 3 - 40% scale */}
        <motion.path
          d="M0,-60 L52,30 L-52,30 Z"
          fill="dark:black white"
          strokeWidth="2"
          className="dark:fill-black fill-white"
        />

        {/* Center triangle - 20% scale */}
        <motion.path
          d="M0,-30 L26,15 L-26,15 Z"
          className="fill-primary/30"
          // stroke="#000"
          strokeWidth="2"
        />
      </g>
    </motion.svg>
  );
};

export { CommBankDotETHLogo };
