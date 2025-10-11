"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PricingButton() {
  const router = useRouter();

  return (
    <motion.button
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/price")}
      className="md:mt-3 flex items-center gap-2 bg-[#a8e3ff] text-black font-medium text-sm tracking-wide px-2 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 border border-indigo-400/20"
    >
      <span>View Plans</span>
    </motion.button>
  );
}
