"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function LoadingScreen() {
  // === Magnetic Effect Logic ===
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = (e.clientX - centerX) * 0.05;
      const dy = (e.clientY - centerY) * 0.05;
      x.set(dx);
      y.set(dy);
    };

    const resetPosition = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", resetPosition);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", resetPosition);
    };
  }, [x, y]);

  return (
    <div className="min-h-screen bg-[#141413] flex items-center justify-center relative overflow-hidden">
      {/* Animated silver light sweep background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#444] to-[#1a1a1a]"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: "200% 200%",
          opacity: 0.15,
        }}
      />

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center space-y-8"
        style={{ x: springX, y: springY }}
      >
        {/* Silver-shine animated logo */}
        <motion.div
          className="relative w-24 h-24"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Silver gradient */}
              <linearGradient id="silverGradient" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#c0c0c0" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#b0b0b0" />
              </linearGradient>
            </defs>

            {/* Outer ring with glow */}
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              stroke="url(#silverGradient)"
              strokeWidth="2"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Dots */}
            {[{ cx: 12, cy: 14, delay: 0 },
              { cx: 18, cy: 12, delay: 0.2 },
              { cx: 24, cy: 14, delay: 0.4 },
              { cx: 18, cy: 22, delay: 0.6 }]
              .map(({ cx, cy, delay }, i) => (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="2.5"
                  fill="url(#silverGradient)"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut",
                  }}
                />
              ))}

            {/* Connecting shape */}
            <motion.path
              d="M12 14 L18 12 L24 14 L18 22 Z"
              stroke="url(#silverGradient)"
              strokeWidth="1.5"
              opacity="0.8"
              fill="none"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>

          {/* Pulsating outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 25px rgba(255,255,255,0.15)",
                "0 0 60px rgba(255,255,255,0.3)",
                "0 0 25px rgba(255,255,255,0.15)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Floating "loading" dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#aaa] to-[#fff]"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
