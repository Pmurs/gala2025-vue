import { useState } from 'react'

import { supabase } from '@/api/supabase'

interface PhoneSignInProps {
  onVerified: () => Promise<void> | void
}

type Step = 'enter' | 'verify'

const PhoneSignIn = ({ onVerified }: PhoneSignInProps) => {
  const [step, setStep] = useState<Step>('enter')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  const isValidPhone = /^\+\d{10,15}$/.test(phone.trim())
  const isOtpValid = /^\d{6}$/.test(otp.trim())

  const sendOtp = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid number that includes the country code.')
      return
    }

    setError('')
    setIsSending(true)
    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    })
    setIsSending(false)

    if (sendError) {
      setError(sendError.message)
      return
    }

    setStep('verify')
  }

  const verifyOtp = async () => {
    if (!isOtpValid) {
      setError('Enter the 6-digit code that was just sent.')
      return
    }

    setError('')
    setIsVerifying(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms',
    })
    setIsVerifying(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    setOtp('')
    await onVerified()
  }

  return (
    <div className="phone-form">
      {step === 'enter' && (
        <>
          <input
            type="tel"
            placeholder="+1 555 555 5555"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <button
            type="button"
            onClick={sendOtp}
            disabled={!isValidPhone || isSending}
          >
            {isSending ? 'sending...' : 'verify phone'}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
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
          <div className="verification-actions">
            <button
              type="button"
              onClick={verifyOtp}
              disabled={!isOtpValid || isVerifying}
            >
              {isVerifying ? 'verifying...' : 'verify'}
            </button>
            <div className="footer">
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setStep('enter')
                  setOtp('')
                }}
              >
                Edit number
              </button>
              <button type="button" className="text-link" onClick={sendOtp}>
                Resend code
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default PhoneSignIn

