import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/api/supabase'
import GuestList from '@/components/GuestList'
import MusicPlayer from '@/components/MusicPlayer'
import RSVPBottomSheet from '@/components/RSVPBottomSheet'
import RSVPForm from '@/components/RSVPForm'
import ScrollArrow from '@/components/ScrollArrow'
import StickyCTA from '@/components/StickyCTA'
import type { Guest } from '@/types/LibraryRecordInterfaces'
import { normalizePhone } from '@/utils/phone'

type ActivePanel = 'closed' | 'rsvp'

const RSVP_CAPACITY = 197

// Online tickets pool - every 2 RSVPs = 1 ticket consumed
// With 120 paid RSVPs currently: 68 - floor(120/2) = 68 - 60 = 8 tickets shown
const ONLINE_TICKET_POOL = 68

const initialViewport =
  typeof window !== 'undefined' ? window.innerHeight : 0

const App = () => {
  const [guests, setGuests] = useState<Guest[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>('closed')
  const [loadingGuests, setLoadingGuests] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(initialViewport)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [rsvpIntent, setRsvpIntent] = useState<'going' | 'maybe' | null>(null)

  const currentGuest = useMemo(() => {
    if (!session) {
      return null
    }
    const normalizedSessionPhone = normalizePhone(session.user.phone)
    return (
      guests.find(
        (guest) => normalizePhone(guest.phone) === normalizedSessionPhone,
      ) ?? null
    )
  }, [guests, session])

  // Derive CTA label based on user state
  const { ctaLabel, ctaSublabel } = useMemo(() => {
    if (currentGuest && currentGuest.paid) {
      return {
        ctaLabel: "You're in ✓",
        ctaSublabel: undefined,
      }
    }
    if (session && !currentGuest) {
      return {
        ctaLabel: 'Finish RSVP',
        ctaSublabel: 'Dec 31 · Greenpoint Loft',
      }
    }
    return {
      ctaLabel: 'RSVP',
      ctaSublabel: 'Dec 31 · Greenpoint Loft',
    }
  }, [currentGuest, session])

  const fetchGuests = useCallback(async () => {
    setLoadingGuests(true)
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('name')

    if (error) {
      console.error('Failed to load guests', error)
      setGuests([])
    } else {
      setGuests(data ?? [])
    }
    setLoadingGuests(false)
    return data ?? []
  }, [])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setActivePanel('closed')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    const handleResize = () => {
      setViewportHeight(window.innerHeight)
      setScrollY(window.scrollY)
    }
    const resetScroll = () => window.scrollTo(0, 0)

    handleResize()
    window.scrollTo(0, 0)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    window.addEventListener('beforeunload', resetScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('beforeunload', resetScroll)
    }
  }, [])

  const ensureLatestSession = useCallback(async () => {
    const {
      data: { session: latestSession },
    } = await supabase.auth.getSession()
    setSession(latestSession)
    return latestSession
  }, [])

  const handleTogglePanel = useCallback(() => {
    if (activePanel === 'rsvp') {
      setActivePanel('closed')
      setRsvpIntent(null) // Reset intent when closing
      return
    }
    // Fetch session in background, don't block the UI
    ensureLatestSession()
    setActivePanel('rsvp')
  }, [activePanel, ensureLatestSession])

  const handleInlineEdit = useCallback(async () => {
    if (activePanel === 'rsvp') {
      return
    }
    await ensureLatestSession()
    setActivePanel('rsvp')
  }, [activePanel, ensureLatestSession])

  const handleRsvpChange = useCallback(async () => {
    await fetchGuests()
    setActivePanel('closed')
    setRsvpIntent(null) // Reset intent on success
  }, [fetchGuests])

  // Derive bottom sheet title based on intent
  const rsvpSheetTitle = useMemo(() => {
    if (rsvpIntent === 'going') return 'RSVP - Going'
    if (rsvpIntent === 'maybe') return 'RSVP - Maybe'
    return 'RSVP'
  }, [rsvpIntent])

  const totalGuests = useMemo(
    () => guests.reduce((acc, guest) => acc + (guest.guest_count ?? 0), 0),
    [guests],
  )
  const spotsRemaining = Math.max(RSVP_CAPACITY - totalGuests, 0)

  // Count paid RSVPs - every 2 RSVPs = 1 ticket consumed (placebo effect)
  const paidRsvpCount = useMemo(
    () => guests.filter((g) => g.paid).length,
    [guests],
  )
  const ticketsRemaining = Math.max(0, ONLINE_TICKET_POOL - Math.floor(paidRsvpCount / 2))

  const onOrange = scrollY >= viewportHeight
  const whiteSectionY = Math.max(
    -viewportHeight,
    -Math.min(scrollY, viewportHeight),
  )

  // Add this effect to update the browser status bar and overscroll color
  useEffect(() => {
    const themeColor = onOrange ? '#ff6b35' : '#ffffff'

    // 1. Update meta theme-color for browser UI (Status Bar)
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', themeColor)

    // 2. Update body background for overscroll areas (Rubber banding)
    document.body.style.backgroundColor = themeColor
  }, [onOrange])

  const thirdSectionState = useMemo(() => {
    if (viewportHeight === 0) {
      return {
        translate: 100,
        isScrollable: false,
        revealButton: false,
      }
    }

    const orangeStart = viewportHeight
    const revealRange = viewportHeight
    
    if (scrollY < orangeStart) {
      return {
        translate: 100,
        isScrollable: false,
        revealButton: false,
      }
    }

    const scrollDistance = scrollY - orangeStart
    const progress = Math.min(1, scrollDistance / revealRange)

    return {
      translate: 100 - progress * 100,
      isScrollable: progress >= 1,
      revealButton: progress >= 0.5,
    }
  }, [scrollY, viewportHeight])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }
    console.debug('scroll-sync', {
      scrollY,
      viewportHeight,
      onOrange,
      thirdSectionTranslate: thirdSectionState.translate,
    })
  }, [scrollY, viewportHeight, onOrange, thirdSectionState.translate])

  return (
    <main>
      <MusicPlayer onPlayStateChange={setIsMusicPlaying} />
      <ScrollArrow />

      {/* Sticky CTA pill - always one thumb away */}
      <StickyCTA
        isOpen={activePanel === 'rsvp'}
        label={ctaLabel}
        sublabel={ctaSublabel}
        onClick={handleTogglePanel}
      />

      {/* Bottom sheet for RSVP flow */}
      <RSVPBottomSheet
        isOpen={activePanel === 'rsvp'}
        onClose={() => {
          setActivePanel('closed')
          setRsvpIntent(null)
        }}
        onBack={rsvpIntent ? () => setRsvpIntent(null) : undefined}
        title={rsvpSheetTitle}
      >
        <RSVPForm
          guest={currentGuest}
          sessionPhone={normalizePhone(session?.user.phone ?? '')}
          onSuccess={handleRsvpChange}
          onDelete={handleRsvpChange}
          onIntentChange={setRsvpIntent}
          parentIntent={rsvpIntent}
        />
      </RSVPBottomSheet>

      <div className="hero">
        <div className={`small-text ${onOrange ? 'on-orange' : ''}`}>
          The fourth annual edition of
        </div>
        <h1 className={`main-title ${onOrange ? 'on-orange' : ''} ${isMusicPlaying ? 'music-playing' : ''}`}>
          <span className="word">
            <span>t</span>
            <span>h</span>
            <span>e</span>
          </span>
          <span className="space"> </span>
          <span className="word">
            <span>g</span>
            <span>a</span>
            <span>l</span>
            <span>a</span>
          </span>
        </h1>
      </div>

      <div
        className="white-section"
        style={{ transform: `translateY(${whiteSectionY}px)` }}
      />

      <section className="orange-section">
        <p className={`orange-blurb ${onOrange ? 'on-orange' : ''}`}>
          From the windows, to the walls: it's time to drop the ball. We're
          gearing up for a fourth annual New Year's Gala, and would love to have
          you there.
        </p>
      </section>

      <div className="scroll-spacer" />

      <section
        className={`third-section ${
          thirdSectionState.isScrollable ? 'scrollable' : ''
        }`}
        style={{
          transform: `translateY(${thirdSectionState.translate}%)`,
        }}
      >
        <div className="third-section-left">
          <h2 className="party-details-header">Details</h2>

          <div className="details-icons">
            <div className="detail-item">
              <span className="detail-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                  <path
                    d="M12 7v5l3 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="detail-text">
                <span className="detail-label">Date / Time</span>
                Dec 31st, 8pm to 3am
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="white"
                  />
                </svg>
              </span>
              <div className="detail-text">
                <span className="detail-label">venue</span>
                <a
                  href="https://www.instagram.com/greenpoint_loft/"
                  target="_blank"
                  rel="noreferrer"
                  className="detail-link"
                >
                  The Greenpoint Loft
                </a>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L14.5 9.5L20 12L14.5 14.5L12 20L9.5 14.5L4 12L9.5 9.5L12 4Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="detail-text" style={{ width: '100%' }}>
                <span className="detail-label">what to expect</span>
                <ul className="skinny-list">
                  <li>Black tie</li>
                  <li>6 hour open bar (cocktails, beer + wine)</li>
                  <li>Two live bands + a DJ set</li>
                  <li>
                    <span>
                      <a
                        href="https://www.instagram.com/p/DOHWccGj1a1/?igsh=MW91Z2F2YTR5azRjeQ=="
                        target="_blank"
                        rel="noreferrer"
                        className="orange-link"
                      >
                        Small bites
                      </a>{' '}
                      to start,{' '}
                      <a
                        href="https://www.instagram.com/betoscarnitas/?hl=en"
                        target="_blank"
                        rel="noreferrer"
                        className="orange-link"
                      >
                        late night tacos
                      </a>{' '}
                      to end
                    </span>
                  </li>
                  <li>Roof deck overlooking the East River</li>
                </ul>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="5" y="7" width="14" height="10" rx="1" fill="white" />
                  <path
                    d="M9 9h6M9 11h6M9 13h6M9 15h6"
                    stroke="#ff6b35"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="detail-text" style={{ width: '100%' }}>
                <span className="detail-label">tickets</span>
                <div className="pricing-tiers">
                  <div className="pricing-tier past">
                    <span className="pricing-date">Through Dec 6</span>
                    <span className="pricing-separator" />
                    <span className="pricing-amount">SOLD OUT</span>
                  </div>
                  <div className="pricing-tier past">
                    <span className="pricing-date">Through Dec 27</span>
                    <span className="pricing-separator" />
                    <span className="pricing-amount">SOLD OUT</span>
                  </div>
                  <div className="pricing-tier">
                    <span className="pricing-date">Last-minute</span>
                    <span className="pricing-separator" />
                    <span className="pricing-amount">$185</span>
                  </div>
                  <div className="tickets-remaining">{ticketsRemaining} tickets left</div>
                </div>
                <p className="ticket-barrier-subtext">
                  If the ticket price is a barrier, please reach out — we want you
                  there! Contact us at <strong>anycgala@gmail.com</strong>. Discounts
                  are available for anyone willing to lend a hand.
                  <br />
                  <br />
                  And as always: invite your friends. The whole point of this is to
                  combine crowds, and it's more fun with them there!
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="third-section-right">
          <button
            className={`third-page-rsvp ${
              thirdSectionState.revealButton ? 'visible' : ''
            }`}
            onClick={handleTogglePanel}
          >
            {currentGuest?.paid ? 'Edit RSVP' : 'RSVP'}
          </button>

          <div className="third-section-right-content">
            <GuestList
              guests={guests}
              isLoading={loadingGuests}
              currentUserPhone={normalizePhone(session?.user.phone ?? null)}
              onEdit={handleInlineEdit}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

