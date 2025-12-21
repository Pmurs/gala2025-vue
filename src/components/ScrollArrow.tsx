import { useEffect, useState } from 'react'

const ScrollArrow = () => {
  const [visible, setVisible] = useState(true)
  const [hasFlickered, setHasFlickered] = useState(false)

  useEffect(() => {
    if (visible && !hasFlickered) {
      const timer = setTimeout(() => {
        setHasFlickered(true)
      }, 3000) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [visible, hasFlickered])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setVisible(false)
      } else {
        setVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const animation = visible
    ? hasFlickered
      ? 'pulse 0.8s ease-in-out infinite'
      : 'arrowFlicker 3s steps(1) forwards, pulse 0.8s ease-in-out infinite 3s'
    : 'none'

  return (
    <div
      style={{
        position: 'fixed',
        // Position above the sticky RSVP pill (pill is ~60px + 20px safe area + margin)
        bottom: 'calc(100px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        zIndex: 90,
        animation,
        color: '#000'
      }}
      className="scroll-arrow"
    >
      <svg
        width="60"
        height="80"
        viewBox="0 0 100 140"
        fill="none"
        stroke="#000000" // Black arrow
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))' }}
      >
        {/* Hand-drawn swirling arrow path */}
        <path d="M 70 20 C 30 10, 10 60, 40 75 C 65 85, 75 45, 45 45 C 25 45, 30 110, 50 130" />
        <path d="M 30 110 L 50 130 L 70 110" />
      </svg>
      <style>
        {`
          @keyframes arrowFlicker {
            0% { opacity: 0; }
            1% { opacity: 1; }
            2% { opacity: 0; }
            3% { opacity: 1; }
            4% { opacity: 0; }
            5% { opacity: 1; }
            6% { opacity: 0; }
            7% { opacity: 1; }
            8% { opacity: 0; }
            9% { opacity: 1; }
            12% { opacity: 0; }
            13% { opacity: 1; }
            14% { opacity: 0; }
            18% { opacity: 0; }
            19% { opacity: 1; }
            21% { opacity: 0; }
            30% { opacity: 0; }
            32% { opacity: 1; }
            35% { opacity: 0; }
            50% { opacity: 0; }
            52% { opacity: 1; }
            53% { opacity: 0; }
            54% { opacity: 1; }
            55% { opacity: 0; }
            70% { opacity: 0; }
            72% { opacity: 1; }
            74% { opacity: 0; }
            75% { opacity: 1; }
            85% { opacity: 1; }
            86% { opacity: 0; }
            87% { opacity: 1; }
            100% { opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: translate(-50%, 0) scale(1); }
            50% { transform: translate(-50%, 0) scale(1.1); }
            100% { transform: translate(-50%, 0) scale(1); }
          }
        `}
      </style>
    </div>
  )
}

export default ScrollArrow
