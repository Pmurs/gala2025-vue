import { useMemo, useState } from 'react'

import { supabase } from '@/api/supabase'
import type { Guest } from '@/types/LibraryRecordInterfaces'
import { normalizePhone } from '@/utils/phone'

interface RSVPFormProps {
  guest: Guest | null
  onSuccess: () => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

type Step = 'details' | 'verify' | 'payment' | 'confirm'

type GuestPayload = {
  name: string
  email: string
  guest_count: number
  paid: boolean
  verified: boolean
  phone: string
}

const VENMO_HANDLE = 'maxheald'

const RSVPForm = ({ guest, onSuccess, onDelete }: RSVPFormProps) => {
  const isEditing = Boolean(guest)
  const [step, setStep] = useState<Step>('details')
  const [formValues, setFormValues] = useState({
    name: guest?.name ?? '',
    email: guest?.email ?? '',
    phone: normalizePhone(guest?.phone ?? ''),
    guestCount: guest?.guest_count ?? 0,
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<GuestPayload | null>(null)

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(formValues.email.trim())
  }, [formValues.email])

  const normalizedPhoneValue = normalizePhone(formValues.phone)
  const isValidPhone = /^\+\d{10,15}$/.test(normalizedPhoneValue)
  const canContinue =
    formValues.name.trim() !== '' && isValidEmail && isValidPhone
  const isOtpValid = /^\d{6}$/.test(otp.trim())

  const guestCountIsSelected = formValues.guestCount === 1 || formValues.guestCount === 2
  const ticketCost = formValues.guestCount === 2 ? 250 : 125

  const handleFieldChange = (
    field: 'name' | 'email' | 'phone' | 'guestCount',
    value: string | number,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]:
        field === 'phone' && typeof value === 'string'
          ? normalizePhone(value)
          : value,
    }))
  }

  const handleSendOtp = async () => {
    if (!canContinue) {
      setError('Please complete the form before continuing.')
      return
    }

    setLoading(true)
    setError('')
    setPendingPayload(null)
    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhoneValue,
    })
    setLoading(false)

    if (sendError) {
      const normalizedMessage = sendError.message?.toLowerCase() ?? ''
      if (
        normalizedMessage.includes('must include country code') ||
        normalizedMessage.includes('error reading phone number') ||
        normalizedMessage.includes("invalid parameter 'to'") ||
        normalizedMessage.includes('twilio') ||
        normalizedMessage.includes('60200') ||
        normalizedMessage.includes('21211')
      ) {
        setError('Error reading phone number. Must include country code!')
      } else {
        setError(sendError.message)
      }
      return
    }

    setStep('verify')
    setStep('verify')
  }

  const handleVerifyAndSave = async () => {
    if (!isOtpValid) {
      setError('Enter the 6-digit code that was just sent.')
      return
    }

    setLoading(true)
    setError('')
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizedPhoneValue,
      token: otp.trim(),
      type: 'sms',
    })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    const payload: GuestPayload = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      guest_count: formValues.guestCount,
      paid: true,
      verified: true,
      phone: normalizedPhoneValue,
    }

    setLoading(false)
    setOtp('')
    setPendingPayload(payload)
    setStep('payment')
  }

  const saveGuest = async (payload: GuestPayload) => {
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('phone')
      .eq('phone', payload.phone)
      .maybeSingle()

    if (existingGuest) {
      const { error } = await supabase
        .from('guests')
        .update({
          name: payload.name,
          email: payload.email,
          guest_count: payload.guest_count,
          paid: payload.paid,
          verified: payload.verified,
        })
        .eq('phone', payload.phone)
      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase.from('guests').insert([payload])
      if (error) {
        throw error
      }
    }
  }

  const handleFinalizeRsvp = async () => {
    if (!pendingPayload) {
      setError('Verify your number and confirm payment first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await saveGuest(pendingPayload)
    } catch (saveError: any) {
      setLoading(false)
      setError(saveError?.message ?? 'Unable to save your RSVP right now.')
      return
    }

    setPendingPayload(null)
    setLoading(false)
    await onSuccess()
  }

  const handleUpdate = async () => {
    if (!formValues.name.trim() || !isValidEmail) {
      setError('Please provide a valid name and email.')
      return
    }

    if (!guest) {
      return
    }

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        guest_count: formValues.guestCount,
      })
      .eq('phone', guest.phone)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await onSuccess()
  }

  const handleDelete = async () => {
    if (!guest) {
      return
    }

    const confirmed = window.confirm(
      'Remove your RSVP? You can always RSVP again later.',
    )
    if (!confirmed) {
      return
    }

    setLoading(true)
    setError('')
    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .eq('phone', guest.phone)

    if (deleteError) {
      setLoading(false)
      setError(deleteError.message)
      return
    }

    await supabase.auth.signOut()
    setLoading(false)
    if (onDelete) {
      await onDelete()
    } else {
      await onSuccess()
    }
  }

  const renderGuestToggle = () => (
    <div className="split-button-group">
      <button
        type="button"
        className={`rsvp-split-button ${
          formValues.guestCount === 1 ? 'selected' : ''
        }`}
        onClick={() => handleFieldChange('guestCount', 1)}
      >
        just me
      </button>
            <button
              type="button"
              className={`rsvp-split-button ${
                formValues.guestCount === 2 ? 'selected' : ''
              }`}
              onClick={() => handleFieldChange('guestCount', 2)}
            >
              +1
            </button>
    </div>
  )

  return (
    <div className="rsvp-form-container">
      <input
        type="text"
        placeholder="your name"
        value={formValues.name}
        onChange={(event) => handleFieldChange('name', event.target.value)}
      />
      <input
        type="email"
        placeholder="your email"
        value={formValues.email}
        onChange={(event) => handleFieldChange('email', event.target.value)}
      />
      <input
        type="tel"
        placeholder="+12345678910"
        value={formValues.phone}
        onChange={(event) => handleFieldChange('phone', event.target.value)}
        disabled={isEditing}
      />

      {renderGuestToggle()}

      {!isEditing && step === 'details' && (
        <>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={!canContinue || !guestCountIsSelected || loading}
          >
            {loading ? 'sending...' : 'continue'}
          </button>
        </>
      )}

      {!isEditing && step === 'verify' && (
        <div className="verification-actions">
          <p className="verification-text">
            Enter the 6-digit code we just texted you.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
          />
          <button
            type="button"
            onClick={handleVerifyAndSave}
            disabled={!isOtpValid || loading}
          >
            {loading ? 'verifying...' : 'verify & save'}
          </button>
          <div className="footer">
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setStep('details')
                setOtp('')
              }}
              disabled={loading}
            >
              Edit number
            </button>
            <button
              type="button"
              className="text-link"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      {!isEditing && step === 'payment' && (
        <div className="verification-actions payment-step">
          <p className="verification-text">Have you paid Max yet?</p>
          <p className="verification-subtext">
            Tickets are $125 per person until December 10th. Your total right
            now: ${ticketCost}.
          </p>
          <a
            className="venmo-button"
            href={`https://account.venmo.com/payment-link?amount=${ticketCost}&note=for%20the%20gala!&recipients=${VENMO_HANDLE}&txn=pay`}
            target="_blank"
            rel="noreferrer"
          >
            Venmo {VENMO_HANDLE} · ${ticketCost}
          </a>
          <button
            type="button"
            onClick={() => setStep('confirm')}
            disabled={loading}
          >
            I paid Max
          </button>
        </div>
      )}

      {!isEditing && step === 'confirm' && (
        <div className="verification-actions payment-step">
          <p className="verification-text">Double checking...</p>
          <p className="verification-subtext">
            No seriously—promise us you already sent it?
          </p>
          <button
            type="button"
            onClick={handleFinalizeRsvp}
            disabled={loading}
          >
            {loading ? 'saving...' : 'yes, I promise'}
          </button>
          <button type="button" className="text-link" onClick={() => setStep('payment')}>
            go back
          </button>
        </div>
      )}

      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!guestCountIsSelected || loading}
          >
            {loading ? 'saving...' : 'save changes'}
          </button>
          <button
            type="button"
            className="text-link danger"
            onClick={handleDelete}
            disabled={loading}
          >
            delete RSVP
          </button>
        </>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default RSVPForm

