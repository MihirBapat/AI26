import { GraduationCap, Users, Star, CheckCircle, PlusCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { CourseMatchItem } from '@/types/employer'

interface CourseMatchCardProps {
  course: CourseMatchItem
  onValidateCourse?: (course: CourseMatchItem) => void
}

export function CourseMatchCard({ course, onValidateCourse }: CourseMatchCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-muted-foreground'
  }

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-muted-foreground'
  }

  return (
    <Card className="border border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: Title and Match Score */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground">
                {course.sid_course_id}
              </Badge>
              <Badge variant="secondary" className="text-[10px] py-0">
                {course.course_type}
              </Badge>
              {course.price === 0 || course.price === null ? (
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 py-0">
                  Free
                </Badge>
              ) : (
                <span className="text-xs font-semibold text-foreground">₹{course.price}</span>
              )}
            </div>

            <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
              {course.title}
            </h4>

            {course.provider_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="size-3.5 shrink-0" />
                <span>{course.provider_name}</span>
              </p>
            )}
          </div>

          {/* Alignment Score Widget */}
          <div className="sm:text-right shrink-0 p-2.5 rounded-lg bg-muted/40 border border-border/60 min-w-[100px]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
              Alignment
            </span>
            <span className={`text-xl font-black ${getScoreColor(course.alignment_score)}`}>
              {course.alignment_score}%
            </span>
            <Progress
              value={course.alignment_score}
              className="h-1.5 mt-1"
              indicatorClassName={getProgressColor(course.alignment_score)}
            />
          </div>
        </div>

        {/* Matched & Missing Skills Pills */}
        <div className="space-y-1.5 pt-1 text-xs">
          {course.matched_skills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                Teaches:
              </span>
              {course.matched_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium text-[11px]"
                >
                  <CheckCircle className="size-3" />
                  {skill}
                </span>
              ))}
            </div>
          )}

          {course.missing_skills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
              <span className="font-medium shrink-0">Missing:</span>
              <span>{course.missing_skills.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Footer info & action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {course.enrollment_count.toLocaleString()} enrolled
            </span>
            {course.rating_average ? (
              <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                {course.rating_average.toFixed(1)}
              </span>
            ) : null}
          </div>

          {onValidateCourse && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onValidateCourse(course)}
              className="h-7 text-xs gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <PlusCircle className="size-3.5" />
              <span>Validate Course</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

