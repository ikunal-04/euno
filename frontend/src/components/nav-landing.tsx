"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/logo";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const NavLanding = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      {/* === Navigation === */}
      <nav
        className="
          fixed top-0 left-0 right-0 z-50 
          flex items-center justify-between
          px-3 sm:px-6 md:px-8 lg:px-12 
          py-3 sm:py-4 
          bg-[#141413]
        "
      >
        {/* === Logo (flush left) === */}
        <motion.div
          className="cursor-pointer flex-shrink-0 ml-0"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-[110px] sm:w-[130px] md:w-[150px]">
            <Logo />
          </div>
        </motion.div>

        {/* === Desktop Navigation Links === */}
        <div
          className="
            hidden sm:flex items-center
            gap-4 sm:gap-6 md:gap-8 lg:gap-10 
            pr-2 sm:pr-6 md:pr-10
          "
        >
          <button onClick={() => router.push('/about')} className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
            About
          </button>
          <button onClick={() => router.push('/price')} className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
            Pricing
          </button>
          <button onClick={() => router.push('/contact')} className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
            Contact
          </button>
          <button
            onClick={() => signIn("google")}
            className="
              px-3 sm:px-4 md:px-5 
              py-1.5 sm:py-2 md:py-2.5
              bg-white text-gray-900 
              rounded-md sm:rounded-lg md:rounded-xl
              text-xs sm:text-sm md:text-base font-medium
              hover:bg-gray-100 transition-all duration-300
              shadow-md hover:shadow-lg
            "
          >
            Try Euno
          </button>
        </div>

        {/* === Mobile Actions === */}
        <div className="flex items-center sm:hidden gap-3">
          {/* Full Try Euno button (shown on small screens too) */}
          <button
            onClick={() => signIn("google")}
            className="
              px-3 py-1.5 bg-white text-gray-900 
              rounded-md text-xs font-medium 
              hover:bg-gray-100 transition-colors shadow-sm
            "
          >
            Try Euno
          </button>

          {/* Hamburger menu toggle */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-white p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* === Mobile Glassmorphic Dropdown Menu === */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
            />

            {/* Glass dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="
                fixed top-[70px] left-4 right-4 z-50
                mx-auto max-w-sm
                bg-gradient-to-b from-[#1a1a1a]/95 to-[#0f0f0f]/95 
                backdrop-blur-xl 
                border border-white/10 
                rounded-2xl 
                shadow-2xl shadow-black/50
                overflow-hidden
                sm:hidden
              "
            >
              <div className="p-2">
                {[
                  { label: "About", route: "/about" },
                  { label: "Pricing", route: "/price" },
                  { label: "Contact", route: "/contact" },
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(item.route);
                    }}
                    className="
                      w-full text-left
                      px-4 py-3
                      text-[#faf9f5]/90 hover:text-white 
                      hover:bg-white/5
                      transition-all duration-200
                      rounded-xl
                      text-sm font-light
                      border-b border-white/5 last:border-0
                    "
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavLanding;