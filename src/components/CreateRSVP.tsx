import { useMemo, useState } from 'react'

import type { GuestFormPayload } from '@/types/LibraryRecordInterfaces'

interface CreateRSVPProps {
  onSubmit: (guest: GuestFormPayload) => Promise<void> | void
}

const VENMO_HANDLE = 'maxheald'

const CreateRSVP = ({ onSubmit }: CreateRSVPProps) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guestCount, setGuestCount] = useState(1)

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }, [email])

  const canContinue = name.trim() !== '' && isValidEmail
  const ticketCost = guestCount === 2 ? 250 : 125

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      guest_count: guestCount,
      paid: true,
      verified: true,
    })
  }

  return (
    <div className="rsvp-form-container">
      {step === 1 && (
        <div className="rsvp-step">
          <input
            type="text"
            placeholder="your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="email"
            placeholder="your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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

          <button type="button" disabled={!canContinue} onClick={() => setStep(2)}>
            continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="rsvp-step">
          <p className="verification-text">
            have you paid for your ticket yet?
          </p>
          <p className="verification-subtext">
            if not, send <strong>${ticketCost}</strong> via Venmo:
          </p>
          <a
            className="venmo-button"
            href={`https://account.venmo.com/payment-link?amount=${ticketCost}&note=for%20the%20gala!&recipients=${VENMO_HANDLE}&txn=pay`}
            target="_blank"
            rel="noreferrer"
          >
            venmo {VENMO_HANDLE}
          </a>
          <button type="button" onClick={handleSubmit}>
            i've paid
          </button>
          <div className="footer">
            <button type="button" className="text-link" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateRSVP

