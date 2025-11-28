import { useEffect, useState } from 'react'

const ScrollArrow = () => {
  const [visible, setVisible] = useState(true)

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

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        zIndex: 90,
        animation: visible
          ? 'entrance 2s ease-out forwards, pulse 0.5s ease-in-out infinite 2s'
          : 'none',
        color: '#000' // Default to black for contrast on orange/white? Wait, first page is white with orange text? No, hero has white background?
        // Let's check: Hero is on white or orange?
        // App.tsx: <div className="hero">...</div>
        // onOrange logic implies it starts on something else.
        // The "white-section" starts at top:0 and transforms UP.
        // So the initial background is WHITE.
        // So the arrow should be ORANGE (to match the text "the gala").
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
          @keyframes entrance {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
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
