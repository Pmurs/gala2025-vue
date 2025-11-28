import type { Guest } from '@/types/LibraryRecordInterfaces'

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
      <ul className="guest-list-items">
        {guests.map((guest) => {
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

