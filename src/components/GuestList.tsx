import type { Guest } from '@/types/LibraryRecordInterfaces'

interface GuestListProps {
  guests: Guest[]
  isLoading?: boolean
}

const GuestList = ({ guests, isLoading }: GuestListProps) => {
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
      <h3 className="guest-list-header">
        Guests {guests.length ? `(${guests.length})` : ''}
      </h3>
      <ul className="guest-list-items">
        {guests.map((guest) => (
          <li key={`${guest.phone}-${guest.name}`}>
            <span>
              {guest.name} {guest.guest_count === 2 ? '+1' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GuestList

