import { Badge } from '@/components/ui/badge'

interface JobStatusBadgeProps {
  status: 'draft' | 'published' | 'paused' | 'closed' | string
  className?: string
}

export function JobStatusBadge({ status, className = '' }: JobStatusBadgeProps) {
  const normStatus = status?.toLowerCase()

  switch (normStatus) {
    case 'published':
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium ${className}`}
        >
          <span className="size-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
          Published
        </Badge>
      )
    case 'draft':
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium ${className}`}
        >
          <span className="size-1.5 rounded-full bg-amber-500 mr-1" />
          Draft
        </Badge>
      )
    case 'closed':
      return (
        <Badge
          variant="outline"
          className={`border-zinc-500/30 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 font-medium ${className}`}
        >
          <span className="size-1.5 rounded-full bg-zinc-400 mr-1" />
          Closed
        </Badge>
      )
    case 'paused':
      return (
        <Badge
          variant="outline"
          className={`border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium ${className}`}
        >
          <span className="size-1.5 rounded-full bg-sky-500 mr-1" />
          Paused
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className={className}>
          {status}
        </Badge>
      )
  }
}

