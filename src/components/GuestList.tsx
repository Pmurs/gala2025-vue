import { useMemo, useState } from 'react'

import type { Guest } from '@/types/LibraryRecordInterfaces'

type FilterTab = 'all' | 'going' | 'maybe'

interface GuestListProps {
  guests: Guest[]
  isLoading?: boolean
  currentUserPhone?: string | null
  onEdit?: () => void
}

const GuestList = ({
  guests,
  isLoading,
  currentUserPhone,
  onEdit,
}: GuestListProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  // Filter guests based on active tab
  const filteredGuests = useMemo(() => {
    if (activeTab === 'going') return guests.filter((g) => g.paid)
    if (activeTab === 'maybe') return guests.filter((g) => !g.paid)
    return guests
  }, [guests, activeTab])

  // Check if there are any maybe guests (to show/hide the tab)
  const hasMaybeGuests = useMemo(() => guests.some((g) => !g.paid), [guests])

  if (isLoading) {
    return (
      <div className="guest-list-container">
        <h3 className="guest-list-header">Guests</h3>
        <p className="verification-text">Loading the list...</p>
      </div>
    )
  }

  return (
    <div className="guest-list-container">
      <h3 className="guest-list-header">Guests</h3>
      
      {/* Filter tabs */}
      <div className="guest-list-tabs">
        <button
          type="button"
          className={`guest-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`guest-tab ${activeTab === 'going' ? 'active' : ''}`}
          onClick={() => setActiveTab('going')}
        >
          Going
        </button>
        {hasMaybeGuests && (
          <button
            type="button"
            className={`guest-tab ${activeTab === 'maybe' ? 'active' : ''}`}
            onClick={() => setActiveTab('maybe')}
          >
            Maybe
          </button>
        )}
      </div>

      <ul className="guest-list-items">
        {filteredGuests.map((guest) => {
          const isCurrentUser = guest.phone === currentUserPhone
          return (
            <li key={`${guest.phone}-${guest.name}`}>
              <div className="guest-info">
                <span className="guest-name">{guest.name || 'Unknown'}</span>
                {guest.guest_count === 2 && (
                  <span className="guest-plus-one">+1</span>
                )}
              </div>
              {isCurrentUser && onEdit && (
                <button
                  type="button"
                  className="text-link edit-inline"
                  onClick={onEdit}
                >
                  Edit
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default GuestList

