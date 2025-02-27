"use client";
import React from "react";
import { motion } from "framer-motion";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

export const Spotlight = ({
  gradientFirst = "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 25%, transparent 50%)",
  gradientSecond = "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 25%, transparent 50%)",
  gradientThird = "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 25%, transparent 50%)",
  translateY = -200,
  width = 800,
  height = 1200,
  smallWidth = 400,
  duration = 10,
  xOffset = 200,
}: SpotlightProps = {}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 2,
      }}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden"
    >
      <motion.div
        animate={{
          x: [0, xOffset, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: "50%",
          }}
          className="absolute top-1/4 left-1/4 opacity-60"
        />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -xOffset, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: duration * 1.2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY * 1.2}px)`,
            background: gradientSecond,
            width: `${width * 0.8}px`,
            height: `${height * 0.8}px`,
            borderRadius: "50%",
          }}
          className="absolute top-1/3 right-1/4 opacity-40"
        />
      </motion.div>
    </motion.div>
  );
};

export const GridBackground = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 z-0 bg-black"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    />
  );
};
