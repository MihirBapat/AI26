import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
  MapPin,
  BookOpen,
  Search,
  Mic,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SessionTokenResponse {
  token: string
  room_name: string
  livekit_url: string
}

// Feature list with Lucide icons
const FEATURES = [
  { icon: Mic, label: 'Voice in Marathi / Hindi / English' },
  { icon: MapPin, label: 'District-level job market data' },
  { icon: BookOpen, label: 'Course recommendations' },
  { icon: Search, label: 'Skill gap analysis' },
]

// ─── Main Consultation Page Component ─────────────────────────────────────────
export function ConsultationPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startConsultation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<SessionTokenResponse>('/candidate/session-token', {
        method: 'POST',
      })
      // Redirect to the dedicated room page with session data
      navigate('/std/consultation/room', { state: data })
    } catch (err: any) {
      const msg = err?.detail || err?.message || 'Failed to start session'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  return (
    <div className="space-y-6 max-w-3xl w-full mx-auto my-auto min-h-[calc(100vh-10rem)] flex flex-col justify-center animate-in fade-in duration-200">
      {/* Hero Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-blue-500/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Career Consultation</CardTitle>
              <CardDescription>
                Voice-powered guidance in Marathi, Hindi, or English
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your profile has already been loaded. The AI assistant knows your district, goal,
            education level, and skills. You don't need to repeat yourself, just start talking.
          </p>

          {/* Feature tags */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-xs font-normal py-1 gap-1.5"
              >
                <Icon className="size-3 shrink-0" />
                {label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Info className="size-4 text-primary" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            {[
              'Click "Start Consultation" and the AI greets you by name.',
              'Ask anything: which courses suit me, what jobs are in Pune, what skills are in demand?',
              'The agent fetches real data from the platform database before answering.',
              'Mention new skills or goals mid-conversation and the agent updates your profile.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <Button
        size="lg"
        className="w-full gap-2 text-base h-14 shadow-lg shadow-primary/20"
        onClick={startConsultation}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Starting consultation…
          </>
        ) : (
          <>
            <PhoneCall className="size-5" />
            Start Consultation
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        This AI assistant provides guidance based on available market data.
        Recommendations should be validated with official government sources before enrolling.
      </p>
    </div>
  )
}
