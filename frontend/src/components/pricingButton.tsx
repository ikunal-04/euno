"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function PricingButton() {
  const router = useRouter();

  return (
    <motion.button
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 12px rgba(99, 102, 241, 0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/price")}
      className="mt-3 flex items-center gap-2 bg-indigo-500/90 hover:bg-indigo-500 text-white font-medium text-sm tracking-wide px-4 py-2 rounded-full transition-all duration-300 border border-indigo-400/20"
    >
      <span>View Plans</span>
      <ArrowRight size={16} strokeWidth={2} />
    </motion.button>
  );
}

