import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface RSVPBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  title?: string
  children: ReactNode
}

const RSVPBottomSheet = ({ isOpen, onClose, onBack, title = 'RSVP', children }: RSVPBottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  
  // Track closing animation state
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300) // Match animation duration
  }, [onClose])

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleClose],
  )

  // Show/hide with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen && !isClosing) {
      scrollYRef.current = window.scrollY

      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollYRef.current}px`

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.top = ''
        window.scrollTo(0, scrollYRef.current)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, isClosing, handleKeyDown])

  // Focus trap - focus the sheet when it opens
  useEffect(() => {
    if (isOpen && !isClosing && sheetRef.current) {
      const firstFocusable = sheetRef.current.querySelector<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    }
  }, [isOpen, isClosing])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      handleClose()
    }
  }

  // Reset visibility after close animation completes
  useEffect(() => {
    if (!isOpen && !isClosing) {
      setIsVisible(false)
    }
  }, [isOpen, isClosing])

  if (!isVisible && !isOpen) {
    return null
  }

  // Render directly (not as portal) for better accessibility tree support
  return (
    <div
      className={`bottom-sheet-backdrop ${isClosing ? 'closing' : ''}`}
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="RSVP"
    >
      <div className={`bottom-sheet ${isClosing ? 'closing' : ''}`} ref={sheetRef}>
        <div className="bottom-sheet-header">
          {onBack ? (
            <button
              type="button"
              className="bottom-sheet-back"
              onClick={onBack}
              aria-label="Back"
            >
              ←
            </button>
          ) : (
            <div className="bottom-sheet-back-spacer" />
          )}
          <h2 className="bottom-sheet-title">{title}</h2>
          <button
            type="button"
            className="bottom-sheet-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </div>
  )
}

export default RSVPBottomSheet

