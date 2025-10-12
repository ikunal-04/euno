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
          <button onClick={ () => router.push('/about') } className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
            About
          </button>
          <button onClick={ () => router.push('/price') } className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
            Pricing
          </button>
          <button onClick={ () => router.push('/contact') } className="text-[#faf9f5]/90 hover:text-white transition-colors text-xs sm:text-sm md:text-base font-light">
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
            className="
              px-4 py-1.5 bg-white text-gray-900 
              rounded-md text-sm font-medium 
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

      {/* === Mobile Dropdown Menu === */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="
              fixed top-[60px] left-0 right-0 z-40 
              bg-[#141413]/95 backdrop-blur-md border-t border-white/10 
              flex flex-col items-center gap-4 py-4
              sm:hidden
            "
          >
            {[
              { label: "About", route: "/about" },
              { label: "Pricing", route: "/price" },
              { label: "Contact", route: "/contact" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMenuOpen(false); // close menu
                  router.push(item.route); // navigate
                }}
                className="
                  text-[#faf9f5]/90 hover:text-white 
                  transition-colors text-sm font-light
                "
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default NavLanding;
