import { useEffect, useMemo, useState } from 'react'

import { supabase } from '@/api/supabase'
import type { Guest } from '@/types/LibraryRecordInterfaces'
import { normalizePhone } from '@/utils/phone'

interface RSVPFormProps {
  guest: Guest | null
  sessionPhone?: string | null
  onSuccess: () => Promise<void> | void
  onDelete?: () => Promise<void> | void
  onIntentChange?: (intent: 'going' | 'maybe' | null) => void
  parentIntent?: 'going' | 'maybe' | null // Used to sync when parent resets intent
}

type Intent = 'going' | 'maybe' | null
type Step = 'intent' | 'login' | 'otp' | 'details' | 'payment' | 'confirm' | 'success'

type GuestPayload = {
  name: string
  email: string
  guest_count: number
  paid: boolean
  verified: boolean
  phone: string
  status?: 'going' | 'maybe'
}

const VENMO_HANDLE = 'maxheald'

const COUNTRY_CODES = [
  { value: '+1', label: '🇺🇸 USA +1' },
  { value: '+44', label: '🇬🇧 GBR +44' },
  { value: '+33', label: '🇫🇷 FRA +33' },
  { value: '+61', label: '🇦🇺 AUS +61' },
  { value: '+91', label: '🇮🇳 IND +91' },
  { value: '+86', label: '🇨🇳 CHN +86' },
  { value: '+49', label: '🇩🇪 DEU +49' },
  { value: '+81', label: '🇯🇵 JPN +81' },
  { value: '+55', label: '🇧🇷 BRA +55' },
  { value: '+52', label: '🇲🇽 MEX +52' },
  { value: '+7', label: '🇷🇺 RUS +7' },
  { value: '+82', label: '🇰🇷 KOR +82' },
  { value: '+31', label: '🇳🇱 NLD +31' },
  { value: '+46', label: '🇸🇪 SWE +46' },
  { value: '+41', label: '🇨🇭 CHE +41' },
  { value: '+48', label: '🇵🇱 POL +48' },
  { value: '+32', label: '🇧🇪 BEL +32' },
  { value: '+43', label: '🇦🇹 AUT +43' },
  { value: '+47', label: '🇳🇴 NOR +47' },
  { value: '+45', label: '🇩🇰 DNK +45' },
  { value: '+358', label: '🇫🇮 FIN +358' },
  { value: '+353', label: '🇮🇪 IRL +353' },
  { value: '+351', label: '🇵🇹 PRT +351' },
  { value: '+30', label: '🇬🇷 GRC +30' },
  { value: '+420', label: '🇨🇿 CZE +420' },
  { value: '+36', label: '🇭🇺 HUN +36' },
  { value: '+40', label: '🇷🇴 ROU +40' },
  { value: '+90', label: '🇹🇷 TUR +90' },
  { value: '+972', label: '🇮🇱 ISR +972' },
  { value: '+971', label: '🇦🇪 ARE +971' },
  { value: '+966', label: '🇸🇦 SAU +966' },
  { value: '+27', label: '🇿🇦 ZAF +27' },
  { value: '+20', label: '🇪🇬 EGY +20' },
  { value: '+234', label: '🇳🇬 NGA +234' },
  { value: '+254', label: '🇰🇪 KEN +254' },
  { value: '+54', label: '🇦🇷 ARG +54' },
  { value: '+56', label: '🇨🇱 CHL +56' },
  { value: '+57', label: '🇨🇴 COL +57' },
  { value: '+51', label: '🇵🇪 PER +51' },
  { value: '+58', label: '🇻🇪 VEN +58' },
  { value: '+65', label: '🇸🇬 SGP +65' },
  { value: '+60', label: '🇲🇾 MYS +60' },
  { value: '+66', label: '🇹🇭 THA +66' },
  { value: '+62', label: '🇮🇩 IDN +62' },
  { value: '+63', label: '🇵🇭 PHL +63' },
  { value: '+84', label: '🇻🇳 VNM +84' },
  { value: '+64', label: '🇳🇿 NZL +64' },
  { value: '+39', label: '🇮🇹 ITA +39' },
  { value: '+34', label: '🇪🇸 ESP +34' },
  { value: '+1-CAN', label: '🇨🇦 CAN +1' },
]

const getCountryCodeForPhone = (phone: string) => {
  // Handle special case for Canada if needed, otherwise first match
  const match = COUNTRY_CODES.find((code) => {
    const cleanValue = code.value.replace('-CAN', '')
    return phone.startsWith(cleanValue)
  })
  return match?.value ?? '+1'
}

const stripCountryCode = (phone: string, code: string) => {
  const cleanCode = code.replace('-CAN', '')
  return phone.startsWith(cleanCode) ? phone.slice(cleanCode.length) : phone
}

import CountrySelect from './CountrySelect'

const RSVPForm = ({ guest, sessionPhone, onSuccess, onDelete, onIntentChange, parentIntent }: RSVPFormProps) => {
  const hasSession = Boolean(sessionPhone)
  
  // Determine initial step based on existing guest state
  const getInitialStep = (): Step => {
    if (guest) {
      // Existing guest - go to details to edit
      return 'details'
    }
    // New user (even with session) - start with intent
    return 'intent'
  }
  
  const [step, setStep] = useState<Step>(getInitialStep())
  const [intent, setIntent] = useState<Intent>(guest?.paid ? 'going' : null)
  const defaultCode = hasSession ? getCountryCodeForPhone(sessionPhone ?? '') : '+1'
  const [countryCode, setCountryCode] = useState(defaultCode)
  const [localPhone, setLocalPhone] = useState(
    hasSession ? stripCountryCode(sessionPhone ?? '', defaultCode) : '',
  )
  const [verifiedPhone, setVerifiedPhone] = useState(sessionPhone ?? '')
  const [formValues, setFormValues] = useState({
    name: guest?.name ?? '',
    email: guest?.email ?? '',
    guestCount: guest?.guest_count ?? 1,
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [guestExists, setGuestExists] = useState(Boolean(guest))

  // Reset to appropriate step when guest prop changes
  useEffect(() => {
    if (guest) {
      setStep('details')
      setIntent(guest.paid ? 'going' : 'maybe')
    } else {
      setStep('intent')
      setIntent(null)
    }
  }, [guest?.phone]) // Only run when guest identity changes

  // Sync with parent intent - when parent resets to null, go back to intent step
  useEffect(() => {
    if (parentIntent === null && intent !== null) {
      setStep('intent')
      setIntent(null)
    }
  }, [parentIntent]) // eslint-disable-line react-hooks/exhaustive-deps

  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(formValues.email.trim())
  }, [formValues.email])

  const normalizedPhoneInput = useMemo(() => {
    const cleanCode = countryCode.replace('-CAN', '')
    return normalizePhone(`${cleanCode}${localPhone}`)
  }, [countryCode, localPhone])
  const canSendCode = /^\+\d{10,15}$/.test(normalizedPhoneInput) && consentChecked
  const isOtpValid = /^\d{6}$/.test(otp.trim())
  const guestCountIsSelected =
    formValues.guestCount === 1 || formValues.guestCount === 2
  const profileIsValid =
    formValues.name.trim() !== '' && isValidEmail && guestCountIsSelected

  const getPricePerTicket = () => {
    const now = new Date()
    // Convert to EST for comparison
    const estOffset = -5 * 60 // EST is UTC-5
    const nowUTC = now.getTime() + now.getTimezoneOffset() * 60000
    const nowEST = new Date(nowUTC + estOffset * 60000)

    const dec7 = new Date('2025-12-07T00:00:00') // 135 until this starts
    const dec28 = new Date('2025-12-28T00:00:00') // 160 until this starts

    if (nowEST < dec7) return 135
    if (nowEST < dec28) return 160
    return 185
  }

  const ticketCost = formValues.guestCount * getPricePerTicket()

  const getPricingText = () => {
    const now = new Date()
    const estOffset = -5 * 60
    const nowUTC = now.getTime() + now.getTimezoneOffset() * 60000
    const nowEST = new Date(nowUTC + estOffset * 60000)
    const dec7 = new Date('2025-12-07T00:00:00')
    const dec28 = new Date('2025-12-28T00:00:00')

    if (nowEST < dec7) {
      return 'Tickets are $135 per person until December 6th, when they become $160.'
    }
    if (nowEST < dec28) {
      return 'Tickets are $160 per person until December 27th.'
    }
    return 'Last-minute tickets are $185 per person.'
  }

  const handleFieldChange = (
    field: 'name' | 'email' | 'guestCount',
    value: string | number,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  useEffect(() => {
    if (guest) {
      setFormValues({
        name: guest.name ?? '',
        email: guest.email ?? '',
        guestCount: guest.guest_count ?? 1,
      })
      setGuestExists(true)
      if (guest.phone) {
        const normalized = normalizePhone(guest.phone)
        const code = getCountryCodeForPhone(normalized)
        setCountryCode(code)
        setLocalPhone(stripCountryCode(normalized, code))
        setVerifiedPhone(normalized)
      }
    } else {
      setGuestExists(false)
    }
  }, [guest])

  useEffect(() => {
    if (sessionPhone) {
      const normalized = normalizePhone(sessionPhone)
      const code = getCountryCodeForPhone(normalized)
      setCountryCode(code)
      setLocalPhone(stripCountryCode(normalized, code))
      setVerifiedPhone(sessionPhone)
      // Only advance from login/otp to details, preserve intent step
      setStep((prev) =>
        prev === 'login' || prev === 'otp' ? 'details' : prev,
      )
    }
    // Only reset to login if we lost session and we're past the auth flow
    // Don't reset if we're on intent or otp (otp is an expected pre-auth state)
    if (!sessionPhone && !verifiedPhone && step !== 'intent' && step !== 'otp') {
      setStep('login')
    }
  }, [sessionPhone, verifiedPhone, step])

  const handleSendOtp = async () => {
    if (!canSendCode) {
      setError('Enter a valid phone number with country code.')
      return
    }

    setLoading(true)
    setError('')
    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhoneInput,
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

    setStep('otp')
  }

  const loadGuestByPhone = async (phone: string) => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (data) {
      setFormValues({
        name: data.name ?? '',
        email: data.email ?? '',
        guestCount: data.guest_count ?? 1,
      })
      setGuestExists(true)
    } else {
      setFormValues((prev) => ({
        ...prev,
        guestCount: prev.guestCount || 1,
      }))
      setGuestExists(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!isOtpValid) {
      setError('Enter the 6-digit code that was just sent.')
      return
    }

    setLoading(true)
    setError('')
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizedPhoneInput,
      token: otp.trim(),
      type: 'sms',
    })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    setLoading(false)
    setOtp('')
    setVerifiedPhone(normalizedPhoneInput)
    await loadGuestByPhone(normalizedPhoneInput)
    setStep('details')
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

  const handleFinalizeRsvp = async (asMaybe = false) => {
    if (!verifiedPhone) {
      setError('Verify your number first.')
      return
    }

    const payload: GuestPayload = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      guest_count: formValues.guestCount,
      paid: !asMaybe, // Maybe = not paid yet
      verified: true,
      phone: verifiedPhone,
      status: asMaybe ? 'maybe' : 'going',
    }

    setLoading(true)
    setError('')

    try {
      await saveGuest(payload)
    } catch (saveError: any) {
      setLoading(false)
      setError(saveError?.message ?? 'Unable to save your RSVP right now.')
      return
    }

    setLoading(false)
    setGuestExists(true)
    setStep('success')
  }

  const handleDelete = async () => {
    if (!verifiedPhone) {
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
      .eq('phone', verifiedPhone)

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
      {step === 'intent' && (
        <div className="intent-step">
          <p className="verification-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Are you coming to the gala?
          </p>
          <div className="intent-buttons">
            <button
              type="button"
              className="intent-button going"
              onClick={() => {
                setIntent('going')
                onIntentChange?.('going')
                // Skip login if already verified (check verifiedPhone too for robustness)
                setStep(verifiedPhone ? 'details' : 'login')
              }}
            >
              <span className="intent-emoji">🎉</span>
              <span className="intent-label">I'm going!</span>
              <span className="intent-sublabel">Let's do this</span>
            </button>
            <button
              type="button"
              className="intent-button maybe"
              onClick={() => {
                setIntent('maybe')
                onIntentChange?.('maybe')
                // Skip login if already verified (check verifiedPhone too for robustness)
                setStep(verifiedPhone ? 'details' : 'login')
              }}
            >
              <span className="intent-emoji">🤔</span>
              <span className="intent-label">Maybe</span>
              <span className="intent-sublabel">In, but tentatively</span>
            </button>
          </div>
        </div>
      )}

      {step === 'login' && (
        <>
          <div className="phone-input-row">
            <CountrySelect
              value={countryCode}
              options={COUNTRY_CODES}
              onChange={(val) => setCountryCode(val)}
              disabled={loading}
            />
            <input
              type="tel"
              className="local-phone-input"
              placeholder="2484345508"
              value={localPhone}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '')
                setLocalPhone(digits)
              }}
              disabled={loading}
            />
          </div>

          <div className="consent-checkbox-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            margin: '0.25rem 0 0.75rem 0',
            width: '100%'
          }}>
            <input
              type="checkbox"
              id="sms-consent"
              className="rsvp-checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <label htmlFor="sms-consent" style={{
              fontFamily: '"Nagbuloe", serif',
              fontSize: '0.9rem',
              color: '#ffffff',
              cursor: 'pointer',
              lineHeight: 1.3,
              opacity: 0.9,
              textAlign: 'left'
            }}>
              I'm good to receive gala text updates!
            </label>
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={!canSendCode || loading}
          >
            {loading ? 'sending...' : 'send code'}
          </button>
        </>
      )}

      {step === 'otp' && (
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
            onClick={handleVerifyPhone}
            disabled={!isOtpValid || loading}
          >
            {loading ? 'verifying...' : 'verify'}
          </button>
          <div className="footer">
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setStep('login')
                setOtp('')
              }}
              disabled={loading}
            >
              Change number
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

      {step === 'details' && (
        <>
          <input
            type="text"
            placeholder="your name"
            value={formValues.name}
            onChange={(event) =>
              handleFieldChange('name', event.target.value)
            }
          />
          <input
            type="email"
            placeholder="your email"
            value={formValues.email}
            onChange={(event) =>
              handleFieldChange('email', event.target.value)
            }
          />

          {renderGuestToggle()}

          {/* Intent toggle - same style as guest count toggle */}
          <div className="split-button-group">
            <button
              type="button"
              className={`rsvp-split-button ${intent === 'going' ? 'selected' : ''}`}
              onClick={() => {
                setIntent('going')
                onIntentChange?.('going')
              }}
            >
              i'm going
            </button>
            <button
              type="button"
              className={`rsvp-split-button ${intent === 'maybe' ? 'selected' : ''}`}
              onClick={() => {
                setIntent('maybe')
                onIntentChange?.('maybe')
              }}
            >
              maybe
            </button>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={() => {
              if (!profileIsValid) {
                setError('Please complete your profile before continuing.')
                return
              }
              if (!verifiedPhone) {
                setError('Verify your phone number first.')
                return
              }
              if (!intent) {
                setError('Please select "i\'m going" or "maybe".')
                return
              }
              setError('')
              
              // If "maybe", save directly; if "going", go to payment
              if (intent === 'maybe') {
                handleFinalizeRsvp(true)
              } else {
                setStep('payment')
              }
            }}
            disabled={!profileIsValid || !intent || loading}
          >
            {loading ? 'saving...' : 'save'}
          </button>

          {guestExists && (
            <button
              type="button"
              className="text-link danger"
              onClick={handleDelete}
              disabled={loading}
            >
              delete RSVP
            </button>
          )}
        </>
      )}

      {step === 'payment' && (
        <div className="verification-actions payment-step">
          <p className="verification-text">Have you paid Max yet?</p>
          <p className="verification-subtext">{getPricingText()}</p>
          <a
            className="venmo-button"
            href={`https://venmo.com/?txn=pay&recipients=${VENMO_HANDLE}&amount=${ticketCost}&note=for%20the%20gala!`}
            target="_blank"
            rel="noreferrer"
          >
            Venmo @{VENMO_HANDLE} · ${ticketCost}
          </a>
          <button
            type="button"
            onClick={() => setStep('confirm')}
            disabled={loading}
          >
            I paid Max
          </button>
          <p className="verification-subtext" style={{ marginTop: '1rem', fontSize: '0.85em', opacity: 0.7, fontStyle: 'italic' }}>
            * we're unable to offer refunds due to many upfront costs but are happy to help with a ticket transfer if needed
          </p>
        </div>
      )}

      {step === 'confirm' && (
        <div className="verification-actions payment-step">
          <p className="verification-text">Double checking...</p>
          <p className="verification-subtext">
            No seriously—promise us you already sent it?
          </p>
          <button
            type="button"
            onClick={() => handleFinalizeRsvp(false)}
            disabled={loading}
          >
            {loading ? 'saving...' : 'yes, I promise'}
          </button>
          <button type="button" className="text-link" onClick={() => setStep('payment')}>
            go back
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="success-step">
          {intent === 'maybe' ? (
            <>
              <div className="success-emoji">🤔</div>
              <p className="success-title">You're on the maybe list</p>
              <p className="success-subtitle">
                We've saved your spot as tentative. You can come back anytime to confirm and pay.
              </p>
            </>
          ) : (
            <>
              <div className="success-emoji">🎉</div>
              <p className="success-title">You're in!</p>
              <p className="success-subtitle">
                See you on New Year's Eve at the Greenpoint Loft. Black tie optional but encouraged!
              </p>
            </>
          )}
          <button
            type="button"
            onClick={onSuccess}
            style={{ marginTop: '1rem' }}
          >
            done
          </button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default RSVPForm

