import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, RotateCw, ShieldCheck, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { User } from '@/context/AuthContext'

interface OtpVerificationModalProps {
  open: boolean
  email: string
  tempToken: string
  purpose?: string
  onSuccess: (user: User) => void
  onCancel: () => void
}

export function OtpVerificationModal({
  open,
  email,
  tempToken: initialTempToken,
  purpose = 'login',
  onSuccess,
  onCancel,
}: OtpVerificationModalProps) {
  const { verifyOtp, resendOtp } = useAuth()

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [tempToken, setTempToken] = useState<string>(initialTempToken)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<number>(30)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Keep tempToken synced if prop changes
  useEffect(() => {
    setTempToken(initialTempToken)
  }, [initialTempToken])

  // Reset inputs when dialog opens
  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '', '', ''])
      setErrorMsg(null)
      setSuccessNotice(null)
      setCooldown(30)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [open])

  // Resend countdown timer
  useEffect(() => {
    if (!open || cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [open, cooldown])

  // Mask email for display: e.g. ni***@gmail.com
  const maskedEmail = React.useMemo(() => {
    if (!email) return ''
    const parts = email.split('@')
    if (parts.length !== 2) return email
    const name = parts[0]
    const domain = parts[1]
    const visibleChars = Math.min(2, name.length)
    return `${name.slice(0, visibleChars)}***@${domain}`
  }, [email])

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      const newDigits = [...digits]
      newDigits[index] = ''
      setDigits(newDigits)
      return
    }

    const lastChar = cleaned.slice(-1)
    const newDigits = [...digits]
    newDigits[index] = lastChar
    setDigits(newDigits)
    setErrorMsg(null)

    // Focus next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setDigits(newDigits)
    setErrorMsg(null)

    const nextIndex = Math.min(5, pasted.length)
    inputRefs.current[nextIndex]?.focus()

    // If all 6 digits pasted, trigger submit
    if (pasted.length === 6) {
      executeVerification(pasted)
    }
  }

  const executeVerification = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join('')
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.')
      return
    }

    setIsVerifying(true)
    setErrorMsg(null)

    try {
      const user = await verifyOtp(email, fullCode, tempToken, purpose)
      onSuccess(user)
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.')
      // Refocus first empty or reset focus
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return

    setIsResending(true)
    setErrorMsg(null)
    setSuccessNotice(null)

    try {
      const res = await resendOtp(email, tempToken, purpose)
      setTempToken(res.temp_token)
      setCooldown(30)
      setSuccessNotice('A new verification code has been dispatched to your email.')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code. Please wait a moment.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Two-Step Verification
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We sent a 6-digit authentication code to{' '}
            <span className="font-semibold text-foreground">{maskedEmail}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="mt-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 6 Segmented Input Boxes */}
        <div className="py-4">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                aria-label={`Digit ${idx + 1}`}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Mail className="size-3" /> Check your spam folder if code isn't in inbox
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-11 text-base font-medium"
            onClick={() => executeVerification()}
            disabled={isVerifying || digits.join('').length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Verifying Code...
              </>
            ) : (
              'Verify & Continue'
            )}
          </Button>

          {/* Resend Controls */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
            <span>Didn't receive the code?</span>
            {cooldown > 0 ? (
              <span className="font-medium text-foreground/80">
                Resend in <span className="text-primary font-semibold">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-primary hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <RotateCw className="size-3" /> Resend Code
                  </>
                )}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              &larr; Back to login / Change email
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
