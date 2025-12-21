import { useEffect, useState } from 'react'

interface StickyCTAProps {
  isOpen: boolean
  label: string
  sublabel?: string
  onClick: () => void
}

const StickyCTA = ({ isOpen, label, sublabel, onClick }: StickyCTAProps) => {
  const [isCompressed, setIsCompressed] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let scrollTimeout: number | null = null

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100

      setIsCompressed(isScrollingDown)
      setLastScrollY(currentScrollY)

      // Expand back after scroll stops
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      scrollTimeout = window.setTimeout(() => {
        setIsCompressed(false)
      }, 800)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [lastScrollY])

  // Don't render when sheet is open
  if (isOpen) {
    return null
  }

  return (
    <button
      type="button"
      className={`sticky-cta ${isCompressed ? 'compressed' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="sticky-cta-label">{label}</span>
      {sublabel && !isCompressed && (
        <span className="sticky-cta-sublabel">{sublabel}</span>
      )}
    </button>
  )
}

export default StickyCTA

