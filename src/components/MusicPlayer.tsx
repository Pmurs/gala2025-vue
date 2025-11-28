import { useCallback, useEffect, useRef, useState } from 'react'

import jukeboxImg from '@/assets/jukebox.png'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

type Track = {
  id: string
  title: string
  videoId: string
}

const tracks: Track[] = [
  { id: 'under-cover', title: 'Under Cover of Darkness - The Strokes', videoId: '_l09H-3zzgA' },
  { id: 'pinball-wizard', title: 'Pinball Wizard - The Who', videoId: 'hHc7bR6y06M' },
  { id: 'born-to-run', title: 'Born to Run - Bruce Springsteen', videoId: 'IxuThNgl3YA' },
  { id: 'r-u-mine', title: 'R U Mine? - Arctic Monkeys', videoId: 'VQH8ZTgna3Q' },
]

const STORAGE_KEYS = {
  trackIndex: 'gala-radio-track-index',
  isOpen: 'gala-radio-open',
  position: 'gala-radio-position',
}

const getInitialTrackIndex = () => {
  if (typeof window === 'undefined') {
    return 0
  }
  const storedIndex = Number(localStorage.getItem(STORAGE_KEYS.trackIndex))
  if (Number.isNaN(storedIndex) || storedIndex < 0 || storedIndex >= tracks.length) {
    return 0
  }
  return storedIndex
}

const getInitialIsOpen = () => {
  if (typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem(STORAGE_KEYS.isOpen) === 'true'
}

type Position = { x: number; y: number }

const defaultPosition = (): Position => {
  if (typeof window === 'undefined') {
    return { x: 16, y: 72 }
  }
  const preferredX = window.innerWidth - 360
  return {
    x: Math.max(16, preferredX),
    y: 72,
  }
}

const getInitialPosition = (): Position => {
  if (typeof window === 'undefined') {
    return { x: 16, y: 72 }
  }
  const stored = localStorage.getItem(STORAGE_KEYS.position)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number'
      ) {
        return parsed
      }
    } catch (error) {
      console.warn('Invalid saved jukebox position', error)
    }
  }
  return defaultPosition()
}

interface MusicPlayerProps {
  onPlayStateChange?: (isPlaying: boolean) => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const MusicPlayer = ({ onPlayStateChange }: MusicPlayerProps) => {
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasActivated, setHasActivated] = useState(false)
  const [shouldPrime, setShouldPrime] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isOpen, setIsOpen] = useState(getInitialIsOpen)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(getInitialTrackIndex)
  const [isBuffering, setIsBuffering] = useState(false)
  const [position, setPosition] = useState<Position>(getInitialPosition)
  const [isDragging, setIsDragging] = useState(false)

  const clampPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === 'undefined' || !popupRef.current) {
      return { x, y }
    }
    const { width, height } = popupRef.current.getBoundingClientRect()
    const padding = 12
    const maxX = Math.max(padding, window.innerWidth - width - padding)
    const maxY = Math.max(padding, window.innerHeight - height - padding)
    const clampedX = Math.min(Math.max(padding, x), maxX)
    const clampedY = Math.min(Math.max(padding, y), maxY)
    return { x: clampedX, y: clampedY }
  }, [])

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    window.onYouTubeIframeAPIReady = () => {
      if (playerContainerRef.current) {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          height: '100%',
          width: '100%',
          videoId: tracks[currentTrackIndex].videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => setIsReady(true),
            onStateChange: (event: any) => {
              const PlayerState = window.YT.PlayerState

              if (event.data === PlayerState.PLAYING) {
                setIsPlaying(true)
                setIsBuffering(false)
                onPlayStateChange?.(true)
              } else if (event.data === PlayerState.BUFFERING) {
                setIsBuffering(true)
              } else if (
                event.data === PlayerState.PAUSED ||
                event.data === PlayerState.ENDED
              ) {
                setIsPlaying(false)
                setIsBuffering(false)
                onPlayStateChange?.(false)
              }
            },
          },
        })
      }
    }

    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady()
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.trackIndex, String(currentTrackIndex))
    }

    if (!isReady || !playerRef.current) {
      return
    }

    const track = tracks[currentTrackIndex]

    try {
      setIsBuffering(true)
      if (isPlaying) {
        playerRef.current.loadVideoById(track.videoId)
      } else {
        playerRef.current.cueVideoById(track.videoId)
      }
      playerRef.current.unMute()
    } catch (error) {
      console.error('Error loading track', error)
      setIsBuffering(false)
      return
    }

    const handleReadyTimeout = setTimeout(() => {
      setIsBuffering(false)
    }, 250)

    return () => clearTimeout(handleReadyTimeout)
  }, [currentTrackIndex, isReady, isPlaying])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.isOpen, String(isOpen))
    }
    if (isOpen && typeof window !== 'undefined') {
      setPosition((current) => clampPosition(current.x, current.y))
    }
  }, [isOpen, clampPosition])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(position))
    }
  }, [position])

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isOpen])

  const primePlayer = useCallback(async () => {
    if (hasActivated || !playerRef.current) {
      return
    }

    try {
      setHasActivated(true)
      playerRef.current.mute()
      await playerRef.current.playVideo()
      await new Promise((resolve) => setTimeout(resolve, 150))
      playerRef.current.pauseVideo()
      playerRef.current.seekTo(0)
      playerRef.current.unMute()
    } catch (error) {
      console.error('Priming error:', error)
    }
  }, [hasActivated])

  useEffect(() => {
    if (shouldPrime && isReady) {
      primePlayer()
      setShouldPrime(false)
    }
  }, [shouldPrime, isReady, primePlayer])

  const handleJukeboxClick = () => {
    setIsOpen(true)
    if (isReady) {
      primePlayer()
    } else {
      setShouldPrime(true)
    }
  }

  const togglePlayback = async () => {
    if (!playerRef.current || !isReady) {
      return
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo()
        setIsPlaying(false)
      } else {
        playerRef.current.unMute()
        await playerRef.current.playVideo()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Playback error:', error)
    }
  }

  const handleSelectTrack = (index: number) => {
    if (index === currentTrackIndex) {
      togglePlayback()
      return
    }

    setCurrentTrackIndex(index)
  }

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
  }

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
  }

  const currentTrack = tracks[currentTrackIndex]

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      event.preventDefault()
      const nextX = event.clientX - dragOffsetRef.current.x
      const nextY = event.clientY - dragOffsetRef.current.y
      const clamped = clampPosition(nextX, nextY)
      setPosition(clamped)
    },
    [clampPosition],
  )

  const stopDragging = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    setIsDragging(false)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', stopDragging)
  }, [handlePointerMove])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return
    }
    if (!popupRef.current || typeof window === 'undefined') {
      return
    }

    event.preventDefault()
    setIsDragging(true)
    const rect = popupRef.current.getBoundingClientRect()
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setPosition((current) => clampPosition(current.x, current.y))
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
    }
  }, [clampPosition, handlePointerMove, stopDragging])

  return (
    <>
      <div className="jukebox-container">
        <img
          src={jukeboxImg}
          alt="jukebox"
          className="jukebox-image"
          onClick={handleJukeboxClick}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <div
        className={`jukebox-window ${isDragging ? 'dragging' : ''}`}
        ref={popupRef}
        onPointerDown={handlePointerDown}
        style={{
          top: position.y,
          left: position.x,
          right: 'auto',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden={!isOpen}
      >
        <div className="jukebox-window-header">
          <span className="jukebox-window-title">gala radio</span>
          <button
            type="button"
            className="jukebox-window-close"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="jukebox-window-body">
          <div className="jukebox-video-frame">
            {!isPlaying && (
              <div className="jukebox-video-static" aria-hidden="true" />
            )}
            <div className="jukebox-video-shield" aria-hidden="true" />
            <div ref={playerContainerRef} className="jukebox-video-iframe" />
          </div>
          <div className="jukebox-now-playing">
            <span className="jukebox-label">now playing</span>
            <span className="jukebox-track-title">{currentTrack.title}</span>
            {isBuffering && <span className="jukebox-buffering">loading…</span>}
          </div>
          <div className="jukebox-controls-row">
            <button 
              type="button" 
              className="jukebox-small-button jukebox-icon-btn" 
              onClick={handlePrev}
              aria-label="Previous track"
            >
              <span className="prev-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="jukebox-small-button jukebox-icon-btn"
              onClick={togglePlayback}
              disabled={isBuffering}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <span style={{ fontSize: '0.75rem' }}>loading</span>
              ) : isPlaying ? (
                <span className="pause-icon-jukebox" aria-hidden="true" />
              ) : (
                <span className="play-icon-jukebox" aria-hidden="true" />
              )}
            </button>
            <button 
              type="button" 
              className="jukebox-small-button jukebox-icon-btn" 
              onClick={handleNext}
              aria-label="Next track"
            >
              <span className="next-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default MusicPlayer

