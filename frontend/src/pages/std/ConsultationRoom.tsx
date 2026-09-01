import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  DisconnectButton,
  useConnectionState,
  TrackToggle,
} from '@livekit/components-react'
import { ConnectionState, Track } from 'livekit-client'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PhoneOff, Loader2, Mic, Bot, Sparkles, ArrowLeft } from 'lucide-react'

// ─── Inner Google Meet-style UI (rendered inside LiveKitRoom) ─────────────────
function VoiceConsultationUI({ onDisconnect }: { onDisconnect: () => void }) {
  const { user } = useAuth()
  const { state, audioTrack } = useVoiceAssistant()
  const connectionState = useConnectionState()

  const stateLabels: Record<string, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    initializing: 'Initializing agent...',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  }

  const isConnected = connectionState === ConnectionState.Connected
  const isAgentSpeaking = state === 'speaking'
  const isAgentListening = state === 'listening'
  const isAgentThinking = state === 'thinking'

  // User initials
  const userInitials = (user?.full_name || 'Candidate')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full w-full justify-between p-4 md:p-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Leave</span>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium">AI Career Consultation</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              !isConnected
                ? 'destructive'
                : isAgentSpeaking
                ? 'default'
                : isAgentListening
                ? 'secondary'
                : 'outline'
            }
            className="text-xs px-2.5 py-1 gap-1.5 capitalize"
          >
            <span
              className={`size-2 rounded-full ${
                !isConnected
                  ? 'bg-destructive-foreground'
                  : isAgentSpeaking
                  ? 'bg-emerald-400 animate-pulse'
                  : isAgentThinking
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-primary animate-pulse'
              }`}
            />
            {!isConnected ? 'Connecting...' : stateLabels[state] || state}
          </Badge>
        </div>
      </div>

      {/* Main Google Meet Grid: 2 Equal Tiles */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 my-2 items-center">
        {/* Tile 1: AI Career Counselor */}
        <div
          className={`h-full min-h-[260px] md:min-h-[380px] bg-card border rounded-2xl relative flex flex-col items-center justify-center p-6 transition-all duration-300 shadow-sm ${
            isAgentSpeaking
              ? 'ring-2 ring-primary border-primary'
              : isAgentThinking
              ? 'ring-2 ring-amber-500/50 border-amber-500/50'
              : 'border-border'
          }`}
        >
          {/* Central Avatar */}
          <div className="relative flex flex-col items-center gap-4">
            <div
              className={`size-24 md:size-32 rounded-full bg-primary/10 border-2 flex items-center justify-center transition-transform duration-300 ${
                isAgentSpeaking
                  ? 'border-primary scale-105 shadow-md'
                  : 'border-border'
              }`}
            >
              <Bot
                className={`size-12 md:size-16 transition-colors ${
                  isAgentSpeaking ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>

            {/* Audio Waveform when Agent is speaking */}
            {audioTrack && (
              <div className="w-40 h-8 flex items-center justify-center">
                <BarVisualizer
                  state={state}
                  barCount={15}
                  trackRef={audioTrack}
                  className="w-full h-full"
                  options={{ minHeight: 4 }}
                />
              </div>
            )}
          </div>

          {/* Bottom Left Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border text-xs font-medium">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI Career Counselor</span>
          </div>
        </div>

        {/* Tile 2: User */}
        <div
          className={`h-full min-h-[260px] md:min-h-[380px] bg-card border rounded-2xl relative flex flex-col items-center justify-center p-6 transition-all duration-300 shadow-sm ${
            isAgentListening
              ? 'ring-2 ring-emerald-500/60 border-emerald-500/60'
              : 'border-border'
          }`}
        >
          {/* Central Avatar */}
          <Avatar className="size-24 md:size-32 border-2 border-border shadow-sm">
            <AvatarFallback className="text-xl md:text-2xl font-semibold bg-muted text-muted-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* Bottom Left Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border text-xs font-medium">
            <Mic className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{user?.full_name || 'You'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar (Google Meet Style) */}
      <div className="flex items-center justify-center pt-3 pb-2">
        <div className="flex items-center gap-4 bg-card border border-border px-6 py-3 rounded-full shadow-lg">
          {/* LiveKit Mic Toggle */}
          <TrackToggle
            source={Track.Source.Microphone}
            className="p-3 rounded-full bg-muted hover:bg-accent text-foreground transition-colors cursor-pointer border border-border"
          />

          {/* End Call Button */}
          <DisconnectButton onClick={onDisconnect}>
            <Button
              variant="destructive"
              className="rounded-full px-5 py-2.5 gap-2 font-medium shadow-sm hover:bg-destructive/90"
            >
              <PhoneOff className="size-4" />
              <span>Leave Call</span>
            </Button>
          </DisconnectButton>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  )
}

// ─── Main Room Component ─────────────────────────────────────────
export function ConsultationRoom() {
  const navigate = useNavigate()
  const location = useLocation()

  const [sessionData, setSessionData] = useState<{
    token: string
    livekit_url: string
    room_name: string
  } | null>(null)

  useEffect(() => {
    if (location.state?.token && location.state?.livekit_url) {
      setSessionData(location.state)
    } else {
      navigate('/std/dashboard', { replace: true })
    }
  }, [location, navigate])

  const handleDisconnect = useCallback(() => {
    navigate('/std/dashboard')
  }, [navigate])

  if (!sessionData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Joining consultation room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden font-sans">
      <LiveKitRoom
        token={sessionData.token}
        serverUrl={sessionData.livekit_url}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={handleDisconnect}
        className="w-full h-full flex flex-col"
      >
        <VoiceConsultationUI onDisconnect={handleDisconnect} />
      </LiveKitRoom>
    </div>
  )
}
