import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/api/supabase'
import CreateRSVP from '@/components/CreateRSVP'
import EditRSVP from '@/components/EditRSVP'
import GuestList from '@/components/GuestList'
import MusicPlayer from '@/components/MusicPlayer'
import PhoneSignIn from '@/components/PhoneSignIn'
import type { Guest, GuestFormPayload } from '@/types/LibraryRecordInterfaces'

type ActivePanel = 'closed' | 'signIn' | 'create' | 'edit'

const RSVP_CAPACITY = 200

const initialViewport =
  typeof window !== 'undefined' ? window.innerHeight : 0

const App = () => {
  const [guests, setGuests] = useState<Guest[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>('closed')
  const [loadingGuests, setLoadingGuests] = useState(true)
  const [updateError, setUpdateError] = useState('')
  const [scrollY, setScrollY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(initialViewport)

  const currentGuest = useMemo(() => {
    if (!session) {
      return null
    }
    return guests.find((guest) => guest.phone === session.user.phone) ?? null
  }, [guests, session])

  const fetchGuests = useCallback(async () => {
    setLoadingGuests(true)
    const { data, error } = await supabase
      .from<Guest>('guests')
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

  const handleOpenPanel = useCallback(async () => {
    if (activePanel !== 'closed') {
      setActivePanel('closed')
      return
    }

    const {
      data: { session: latestSession },
    } = await supabase.auth.getSession()
    setSession(latestSession)

    if (!latestSession) {
      setActivePanel('signIn')
      return
    }

    const nextGuest =
      guests.find((guest) => guest.phone === latestSession.user.phone) ?? null
    setActivePanel(nextGuest ? 'edit' : 'create')
  }, [activePanel, guests])

  const handleSignInSuccess = useCallback(async () => {
    const updatedGuests = await fetchGuests()
    const {
      data: { session: latestSession },
    } = await supabase.auth.getSession()
    setSession(latestSession)

    if (!latestSession) {
      setActivePanel('signIn')
      return
    }

    const hasRsvp =
      updatedGuests.find((guest) => guest.phone === latestSession.user.phone) ??
      null
    setActivePanel(hasRsvp ? 'edit' : 'create')
  }, [fetchGuests])

  const handleSubmitRsvp = useCallback(
    async (payload: GuestFormPayload) => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession()

      if (!activeSession) {
        setActivePanel('signIn')
        return
      }

      const { error } = await supabase.from<Guest>('guests').insert([
        {
          ...payload,
          phone: activeSession.user.phone,
        },
      ])

      if (error) {
        console.error('Unable to create RSVP', error)
        return
      }

      await fetchGuests()
      setActivePanel('closed')
    },
    [fetchGuests],
  )

  const handleUpdateRsvp = useCallback(
    async (updatedGuest: Guest) => {
      const { error } = await supabase
        .from<Guest>('guests')
        .update({
          name: updatedGuest.name,
          guest_count: updatedGuest.guest_count,
          email: updatedGuest.email,
          paid: updatedGuest.paid,
          verified: updatedGuest.verified,
        })
        .eq('phone', updatedGuest.phone)

      if (error) {
        console.error('Unable to update RSVP', error)
        setUpdateError(error.message)
        return
      }

      setUpdateError('')
      await fetchGuests()
      setActivePanel('closed')
    },
    [fetchGuests],
  )

  const totalGuests = useMemo(
    () => guests.reduce((acc, guest) => acc + (guest.guest_count ?? 0), 0),
    [guests],
  )
  const spotsRemaining = Math.max(RSVP_CAPACITY - totalGuests, 0)

  const onOrange = scrollY >= viewportHeight
  const whiteSectionY = Math.max(
    -viewportHeight,
    -Math.min(scrollY, viewportHeight),
  )

  const thirdSectionState = useMemo(() => {
    const orangeEnd = viewportHeight * 2
    if (scrollY < orangeEnd) {
      return {
        translate: 100,
        isScrollable: false,
        revealButton: false,
      }
    }

    const scrollDistance = scrollY - orangeEnd
    const progress = Math.min(1, scrollDistance / viewportHeight)
    return {
      translate: 100 - progress * 100,
      isScrollable: progress >= 1,
      revealButton: progress >= 0.5,
    }
  }, [scrollY, viewportHeight])

  return (
    <main>
      <MusicPlayer />

      <div className="hero">
        <div className={`small-text ${onOrange ? 'on-orange' : ''}`}>
          The fourth annual edition of
        </div>
        <h1 className={`main-title ${onOrange ? 'on-orange' : ''}`}>
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
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="white"
                  />
                </svg>
              </span>
              <a
                href="https://www.greenpointloft.com"
                target="_blank"
                rel="noreferrer"
                className="detail-link"
              >
                The Greenpoint Loft
              </a>
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
              <span className="detail-text">early birds! $125 before Dec. 10th</span>
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
                  <circle cx="6.5" cy="9" r="2" fill="white" />
                  <path
                    d="M2 19c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="17.5" cy="9" r="2" fill="white" />
                  <path
                    d="M13 19c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              <span className="detail-text">
                ({spotsRemaining}/{RSVP_CAPACITY}) spots left
              </span>
            </div>
          </div>

          <div className="details-paragraph">
            <h3 className="details-subheader">What can you expect?</h3>
            <ul className="details-list">
              <li>
                Same high quality food and cocktails (Open bar all night, small
                bites til midnight, handrolled tacos til 3)
              </li>
              <li>2 live bands + a DJ set</li>
              <li>Roof deck overlooking the east river</li>
            </ul>
            <p className="details-paragraph-spacing">
              If you're new, this is a party we throw with friends, for friends:
              some of us make the food, others play music, organize, decorate, you
              name it. If ticket price is a barrier for you, please reach out at +1
              603-494-0576! We want to see you there, and can offer discounts for
              anyone willing to volunteer.
            </p>
            <p className="details-paragraph-spacing">
              Lastly, as always, invite your friends! The whole point of this is to
              combine crowds, and it's more fun with them there. see you NYE. If you
              want to check out the venue, link{' '}
              <a
                href="https://www.instagram.com/greenpoint_loft/"
                target="_blank"
                rel="noreferrer"
                className="orange-link"
              >
                here
              </a>
              .
            </p>
          </div>
        </div>

        <div className="third-section-right">
          <button
            className={`third-page-rsvp ${
              thirdSectionState.revealButton ? 'visible' : ''
            }`}
            onClick={handleOpenPanel}
          >
            {activePanel === 'closed' ? 'RSVP' : 'Close'}
          </button>

          {activePanel === 'signIn' && (
            <PhoneSignIn onVerified={handleSignInSuccess} />
          )}

          {activePanel === 'create' && (
            <CreateRSVP onSubmit={handleSubmitRsvp} />
          )}

          {activePanel === 'edit' && currentGuest && (
            <EditRSVP
              guest={currentGuest}
              error={updateError}
              onUpdate={handleUpdateRsvp}
            />
          )}

          {activePanel === 'closed' && (
            <GuestList guests={guests} isLoading={loadingGuests} />
          )}
        </div>
      </section>
    </main>
  )
}

export default App

