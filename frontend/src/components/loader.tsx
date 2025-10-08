"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#141413] flex items-center justify-center relative overflow-hidden">


      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        
        {/* Animated euno logo */}
        <motion.div 
          className="relative w-24 h-24"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg width="96" height="96" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring with glow */}
            <motion.circle 
              cx="18" 
              cy="18" 
              r="16" 
              stroke="white" 
              strokeWidth="2" 
              opacity="0.9"
              animate={{
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Animated dots */}
            <motion.circle 
              cx="12" 
              cy="14" 
              r="2.5" 
              fill="white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
                ease: "easeInOut"
              }}
            />
            <motion.circle 
              cx="18" 
              cy="12" 
              r="2.5" 
              fill="white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2,
                ease: "easeInOut"
              }}
            />
            <motion.circle 
              cx="24" 
              cy="14" 
              r="2.5" 
              fill="white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.4,
                ease: "easeInOut"
              }}
            />
            <motion.circle 
              cx="18" 
              cy="22" 
              r="2.5" 
              fill="white"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.6,
                ease: "easeInOut"
              }}
            />
            
            {/* Connecting lines with animated opacity */}
            <motion.path 
              d="M12 14 L18 12 L24 14 L18 22 Z" 
              stroke="white" 
              strokeWidth="1.5" 
              opacity="0.6" 
              fill="none"
              animate={{
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
          
          {/* Outer glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255, 255, 255, 0.1)",
                "0 0 40px rgba(255, 255, 255, 0.2)",
                "0 0 20px rgba(255, 255, 255, 0.1)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Minimalist loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
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
      </div>
    </div>
  );
}