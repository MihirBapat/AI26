import { Badge } from '@/components/ui/badge'

interface SkillBadgeProps {
  name: string
  category?: string
  requirementType?: 'required' | 'preferred' | string
  isEmerging?: boolean
  className?: string
  onRemove?: () => void
}

export function SkillBadge({
  name,
  category,
  requirementType,
  isEmerging = false,
  className = '',
  onRemove,
}: SkillBadgeProps) {
  // Determine color tint based on category
  const getCategoryColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'programming language':
        return 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300'
      case 'framework':
        return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
      case 'database':
        return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
      case 'cloud & devops':
        return 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300'
      case 'ai & data':
        return 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300'
      case 'manufacturing':
      case 'automotive':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      case 'healthcare':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      case 'electronics':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
      default:
        return 'border-border bg-muted/60 text-foreground'
    }
  }

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-lg transition-all ${getCategoryColor(
        category
      )} ${className}`}
    >
      <span>{name}</span>

      {isEmerging && (
        <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-purple-500 text-white uppercase tracking-wider">
          Emerging
        </span>
      )}

      {requirementType === 'preferred' && (
        <span className="text-[10px] text-muted-foreground italic font-normal">
          (preferred)
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 text-muted-foreground hover:text-destructive focus:outline-none"
          title={`Remove ${name}`}
        >
          &times;
        </button>
      )}
    </Badge>
  )
}

