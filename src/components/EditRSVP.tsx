import { useEffect, useState } from 'react'

import type { Guest } from '@/types/LibraryRecordInterfaces'

interface EditRSVPProps {
  guest: Guest
  error?: string
  onUpdate: (guest: Guest) => Promise<void> | void
}

const EditRSVP = ({ guest, error, onUpdate }: EditRSVPProps) => {
  const [name, setName] = useState(guest.name)
  const [guestCount, setGuestCount] = useState(guest.guest_count)

  useEffect(() => {
    setName(guest.name)
    setGuestCount(guest.guest_count)
  }, [guest])

  const handleSubmit = () => {
    onUpdate({
      ...guest,
      name: name.trim(),
      guest_count: guestCount,
    })
  }

  return (
    <div className="edit-form">
      <input
        type="text"
        placeholder="your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <div className="split-button-group">
        <button
          type="button"
          className={`rsvp-split-button ${guestCount === 1 ? 'selected' : ''}`}
          onClick={() => setGuestCount(1)}
        >
          just me
        </button>
        <button
          type="button"
          className={`rsvp-split-button ${guestCount === 2 ? 'selected' : ''}`}
          onClick={() => setGuestCount(2)}
        >
          plus one
        </button>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!name.trim()}>
        update RSVP
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default EditRSVP

