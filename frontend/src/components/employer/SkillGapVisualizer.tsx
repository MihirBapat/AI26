import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { SkillGapResponse } from '@/types/employer'

interface SkillGapVisualizerProps {
  data: SkillGapResponse
  showRecommendations?: boolean
}

export function SkillGapVisualizer({
  data,
  showRecommendations = true,
}: SkillGapVisualizerProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold">Low Gap (Strong Alignment)</Badge>
      case 'moderate':
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold">Moderate Gap</Badge>
      case 'high':
        return <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-600 font-semibold">High Gap</Badge>
      case 'critical':
      default:
        return <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-semibold">Critical Curriculum Gap</Badge>
    }
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 55) return 'bg-amber-500'
    if (pct >= 30) return 'bg-orange-500'
    return 'bg-destructive'
  }

  const coveredSkills = data.skill_breakdown.filter((s) => s.status === 'covered')
  const partialSkills = data.skill_breakdown.filter((s) => s.status === 'partial')
  const missingSkills = data.skill_breakdown.filter((s) => s.status === 'missing')

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span>Curriculum Skill Alignment Score</span>
              {getSeverityBadge(data.gap_severity)}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Evaluated against 1,897 Skill India Digital courses for role: <span className="font-medium text-foreground">{data.role_title}</span>
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {data.overall_coverage_percentage}%
            </span>
            <span className="text-xs text-muted-foreground block">Taught in Courses</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <Progress
            value={data.overall_coverage_percentage}
            className="h-3"
            indicatorClassName={getProgressColor(data.overall_coverage_percentage)}
          />
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
          <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block text-sm">
              {data.covered_skills_count}
            </span>
            <span className="text-muted-foreground">Fully Covered</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <span className="text-amber-700 dark:text-amber-300 font-bold block text-sm">
              {data.partial_skills_count}
            </span>
            <span className="text-muted-foreground">Partially Taught</span>
          </div>
          <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20">
            <span className="text-destructive font-bold block text-sm">
              {data.missing_skills_count}
            </span>
            <span className="text-muted-foreground">Missing from SID</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Breakdown Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Covered */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Covered Skills ({coveredSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {coveredSkills.length > 0 ? (
                coveredSkills.map((s) => (
                  <Badge
                    key={s.skill_id}
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs py-0.5"
                  >
                    ✓ {s.skill_name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">None fully covered</span>
              )}
            </div>
          </div>

          {/* Partial */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              <span>Partial Coverage ({partialSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {partialSkills.length > 0 ? (
                partialSkills.map((s) => (
                  <Badge
                    key={s.skill_id}
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs py-0.5"
                  >
                    ◐ {s.skill_name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">None partially covered</span>
              )}
            </div>
          </div>

          {/* Missing */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <XCircle className="size-4" />
              <span>Critical Gaps ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.length > 0 ? (
                missingSkills.map((s) => (
                  <Badge
                    key={s.skill_id}
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-destructive text-xs py-0.5"
                  >
                    ✕ {s.skill_name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">No critical missing skills</span>
              )}
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        {showRecommendations && data.recommendations.length > 0 && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Curriculum & Policy Alignment Recommendations</span>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

