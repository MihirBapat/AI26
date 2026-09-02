import { Sparkles, Terminal, Activity, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EmployerIntelligenceResponse } from '@/types/employer'

interface IntelligenceReportCardProps {
  report: EmployerIntelligenceResponse
}

export function IntelligenceReportCard({ report }: IntelligenceReportCardProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Main Grounded Answer Card */}
      <Card className="border border-primary/30 bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-primary/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Grounded Intelligence Synthesis
                </CardTitle>
                <CardDescription className="text-xs">
                  Generated via deterministic tool orchestration & SQL analytics
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                <ShieldCheck className="size-3 mr-1" />
                Deterministic Grounding ({Math.round(report.confidence * 100)}%)
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="prose dark:prose-invert prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-line text-sm">
            {report.answer}
          </div>
        </CardContent>
      </Card>

      {/* Tool Execution Audit Trail */}
      {report.tools_executed.length > 0 && (
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/40">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="size-3.5" />
              <span>Tool Execution Audit Trail ({report.tools_executed.length} Tools Invoked)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {report.tools_executed.map((tool, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1 font-mono"
              >
                <div className="flex items-center justify-between text-primary font-semibold">
                  <span className="flex items-center gap-1">
                    <Activity className="size-3 text-primary" />
                    {tool.tool_name}()
                  </span>
                  <span className="text-[10px] text-muted-foreground">Deterministic SQL Tool</span>
                </div>
                <p className="text-muted-foreground font-sans text-[11px]">
                  {tool.result_summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

