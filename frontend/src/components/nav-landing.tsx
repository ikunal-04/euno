import { motion } from 'framer-motion'
import React from 'react'

const NavLanding = () => {
  return (
    <div>
       {/* Navigation - Made fixed and added background/shadow for visibility */}
       <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#141413] backdrop-blur-sm">
        
        {/* Logo - Using the user-provided motion.div structure */}
        <motion.div
            className="cursor-pointer"
            // Replaced router.push with simple window reload for simulation
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 pl-16">
              {/* Minimalist logo */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/20 to-gray-500/30 flex items-center justify-center shadow-sm">
                <div className="w-3 h-3 rounded-full bg-white/90"></div>
              </div>
              
              {/* Brand name - Color adjusted to text-[#faf9f5] for visibility on dark background */}
              <h1 className="text-xl font-light text-[#faf9f5] tracking-wide lowercase">
                mindspace
              </h1>
            </div>
          </motion.div>
        
        {/* Navigation links adjusted to mimic the reference image's simple navigation */}
        <div className="flex items-center gap-8 pr-10">
          <button className="text-[#faf9f5] hover:text-white transition-colors text-sm font-light">
            About
          </button>
          <button className="text-[#faf9f5] hover:text-white transition-colors text-sm font-light">
            Features
          </button>
          <button className="text-[#faf9f5] hover:text-white transition-colors text-sm font-light">
            Pricing
          </button>
          <button className="text-[#faf9f5] hover:text-white transition-colors text-sm font-light">
            Contact Sales
          </button>
          <button className="px-5 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-lg">
            Try MindSpace
          </button>
        </div>
      </nav>
    </div>
  )
}

export default NavLanding
