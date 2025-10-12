import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const Logo = () => {
  const logoRef = useRef<HTMLDivElement>(null)

  // Magnet effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { damping: 15, stiffness: 150 }
  const xSpring = useSpring(x, springConfig)
  const ySpring = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!logoRef.current) return
    const rect = logoRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    const magnetStrength = 0.3
    x.set(distanceX * magnetStrength)
    y.set(distanceY * magnetStrength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div className="flex items-center gap-3 pl-16">
      <motion.div
        ref={logoRef}
        className="relative w-9 h-9 cursor-pointer"
        style={{ x: xSpring, y: ySpring }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Soft outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          animate={{
            background: [
              'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(210,210,255,0.35) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 🔹 Brighter metallic silver gradient */}
            <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#e5e5e5" />
              <stop offset="50%" stopColor="#fefefe" />
              <stop offset="75%" stopColor="#d0d0d0" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* 🔹 Stronger shine gradient */}
            <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="40%" stopColor="rgba(255,255,255,1)" />
              <stop offset="60%" stopColor="rgba(255,255,255,1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Mask to keep shine within circle */}
            <mask id="circle-mask">
              <rect width="36" height="36" fill="black" />
              <circle cx="18" cy="18" r="16" fill="white" />
            </mask>

            {/* More reflective metallic sheen */}
            <filter id="metallic-sheen">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.9" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring */}
          <circle
            cx="18"
            cy="18"
            r="16"
            stroke="url(#metallic-gradient)"
            strokeWidth="2"
            opacity="1"
            filter="url(#metallic-sheen)"
          />

          {/* Inner design (stylized 'e') */}
          <circle cx="12" cy="14" r="2.5" fill="url(#metallic-gradient)" filter="url(#metallic-sheen)" />
          <circle cx="18" cy="12" r="2.5" fill="url(#metallic-gradient)" filter="url(#metallic-sheen)" />
          <circle cx="24" cy="14" r="2.5" fill="url(#metallic-gradient)" filter="url(#metallic-sheen)" />
          <circle cx="18" cy="22" r="2.5" fill="url(#metallic-gradient)" filter="url(#metallic-sheen)" />
          <path
            d="M12 14 L18 12 L24 14 L18 22 Z"
            stroke="url(#metallic-gradient)"
            strokeWidth="1.8"
            opacity="0.85"
            fill="none"
            filter="url(#metallic-sheen)"
          />

          {/* ✨ Brighter and more visible shine sweep */}
          <motion.rect
            x="-36"
            y="0"
            width="36"
            height="36"
            fill="url(#shine-gradient)"
            mask="url(#circle-mask)"
            animate={{ x: [-36, 36] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
        </svg>

        {/* Stronger rim shimmer */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.8) 0%, transparent 60%)',
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="text-xl font-bold text-white tracking-wider"
        style={{ x: useTransform(xSpring, [0, 10], [0, 2]) }}
      >
        Euno
      </motion.h1>
    </div>
  )
}

export default Logo
