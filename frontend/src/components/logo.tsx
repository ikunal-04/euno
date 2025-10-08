import React from 'react'
import { motion } from 'framer-motion'

const Logo = () => {
  return (
    <div className="flex items-center gap-3 pl-16">
              {/* Euno logo - Playful monochrome design */}
              <motion.div 
                className="relative w-9 h-9"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer ring */}
                  <circle cx="18" cy="18" r="16" stroke="white" strokeWidth="2" opacity="0.9"/>
                  
                  {/* Letter 'e' stylized as connected dots */}
                  <circle cx="12" cy="14" r="2.5" fill="white"/>
                  <circle cx="18" cy="12" r="2.5" fill="white"/>
                  <circle cx="24" cy="14" r="2.5" fill="white"/>
                  <circle cx="18" cy="22" r="2.5" fill="white"/>
                  
                  {/* Connecting lines for playful effect */}
                  <path d="M12 14 L18 12 L24 14 L18 22 Z" stroke="white" strokeWidth="1.5" opacity="0.6" fill="none"/>
                </svg>
              </motion.div>
              
              {/* Brand name - euno */}
              <h1 className="text-xl font-medium text-white tracking-wider lowercase">
                euno
              </h1>
            </div>
  )
}

export default Logo
