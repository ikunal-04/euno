import { AnimatePresence, motion } from 'framer-motion'
import React, { useState, useRef } from 'react'
import { signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import PricingButton from "@/components/pricingButton"
import { useUserStore } from '@/store/useUser'
 import Logo from "@/components/logo"

const NavBarMain = () => {

    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const user = useUserStore((state) => state.user);

  return (
    <div>
       {/* Navigation - Made fixed and added background/shadow for visibility */}
       <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 ">
        
       
            <Logo />
          
          <PricingButton />
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 focus:outline-none group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {user?.image && (
                  <motion.div
                    className="relative"
                    animate={{ 
                      boxShadow: open 
                        ? "0 0 0 2px rgba(59, 130, 246, 0.3)" 
                        : "0 0 0 0px rgba(59, 130, 246, 0)" 
                    }}
                    style={{ borderRadius: "50%" }}
                  >
                    <Image
                      src={user?.image}
                      alt="Profile Picture"
                      width={28}
                      height={28}
                      className="rounded-full border border-gray-200/60"
                    />
                  </motion.div>
                )}
                
                <span className="text-sm font-normal text-white group-hover:text-gray-900 transition-colors">
                  {user?.name?.toLowerCase()}
                </span>
                
                <motion.svg
                  className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-44 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/20 py-2"
                  >
                    <motion.button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 transition-all duration-200 rounded-xl mx-2"
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
                        </svg>
                        sign out
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={() => signIn("google")}
              className="px-6 py-2.5 rounded-2xl bg-gray-900/95 hover:bg-gray-800 text-white text-sm font-normal transition-all duration-300 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/25"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                sign in
              </div>
            </motion.button>
          )}
        
      </nav>
    </div>
  )
}

export default NavBarMain
