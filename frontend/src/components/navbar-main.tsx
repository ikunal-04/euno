import { AnimatePresence, motion } from 'framer-motion'
import React, { useState, useRef } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import PricingButton from "@/components/pricingButton"
import { UserSettings } from './user-settings'

const NavBarMain = () => {

    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const user = session?.user;

  return (
    <div>
       {/* Navigation - Made fixed and added background/shadow for visibility */}
       <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
        
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
          <PricingButton />
          {user ? (
            <UserSettings />
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
