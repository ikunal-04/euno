"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#141413] flex flex-col items-center justify-center">
      {/* Logo as loader */}
      <motion.div
        className="w-24 h-24"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Image src="/logo.svg" alt="Euno Logo" width={96} height={96} />
      </motion.div>

      {/* Three loading dots */}
      <div className="flex space-x-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-white"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
