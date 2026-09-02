import { useState } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  ShieldCheck,
  Brain,
  AlertCircle,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { IntelligenceReportCard } from '@/components/employer/IntelligenceReportCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { queryEmployerIntelligence } from '@/lib/employer-api'
import type { EmployerIntelligenceResponse } from '@/types/employer'

const SUGGESTED_QUERIES = [
  {
    title: 'Top Demanded Skills & Company Vacancies',
    query: 'What skills are in highest market demand in Pune and what is my company active hiring status?',
    district: 'Pune',
  },
  {
    title: 'Compensation Benchmarks',
    query: 'What are the prevailing minimum, average, and maximum salary benchmarks for technical roles?',
    district: 'Pune',
  },
  {
    title: 'Curriculum Gap & Course Coverage',
    query: 'What is the course coverage and missing skills for Python, FastAPI, Docker, and PostgreSQL?',
    district: 'Pune',
  },
  {
    title: 'Statewide Shortages & Priority Hiring',
    query: 'What are the critical emerging skills and top priority market shortages across Maharashtra?',
    district: 'Maharashtra',
  },
]

const DISTRICTS = [
  'Maharashtra',
  'Pune', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon',
]

export function EmployerIntelligence() {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('Pune')
  const [report, setReport] = useState<EmployerIntelligenceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleRunQuery = async (queryText: string, targetDistrict: string = district) => {
    if (!queryText.trim()) return

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await queryEmployerIntelligence({
        query: queryText.trim(),
        district: targetDistrict === 'Maharashtra' ? undefined : targetDistrict,
      })
      setReport(res)
    } catch (err: any) {
      setErrorMsg(err.message || 'Intelligence query failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <EmployerLayout
      title="Employer Intelligence Center"
      subtitle="Tool-orchestrated analytical agent executing deterministic database queries & market benchmarks"
    >
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-sm block">Deterministic Intelligence Agent</span>
            <span className="text-muted-foreground">
              Directly executes SQL analytics over state vacancies, canonical skills, and 1,897 SID courses with zero hallucination.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20 text-[11px] flex items-center gap-1">
            <ShieldCheck className="size-3" />
            Live Grounded Tool-Calling
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Query Input & Presets */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Analytical Query</CardTitle>
              <CardDescription className="text-xs">
                Ask multi-step questions regarding your company vacancies, regional shortages, or salary levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Geography</label>
                <Select value={district} onValueChange={(val) => setDistrict(val || 'Pune')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Question / Prompt</label>
                <Textarea
                  placeholder="e.g. What are the high-demand skills in Pune and what is my company hiring status?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="text-xs leading-relaxed"
                  rows={4}
                />
              </div>

              <Button
                onClick={() => handleRunQuery(query, district)}
                disabled={isLoading || !query.trim()}
                className="w-full text-xs gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Executing Analytical Tools...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Generate Intelligence Report</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Suggested One-Click Queries */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Brain className="size-3.5" />
                <span>Preset Analytical Inquiries</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {SUGGESTED_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(item.query)
                    setDistrict(item.district)
                    handleRunQuery(item.query, item.district)
                  }}
                  className="w-full p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/60 text-left text-xs transition-colors space-y-0.5 group"
                >
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">[{item.district}]</span>
                  </p>
                  <p className="text-muted-foreground text-[11px] line-clamp-2">{item.query}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Report & Tools Trace */}
        <div className="lg:col-span-2 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <Card className="border border-border/80 p-16 text-center text-xs text-muted-foreground space-y-3">
              <Loader2 className="size-8 text-primary animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">Executing Deterministic Agent Tools</p>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Running SQL analytics over registered vacancies, computing skill demand frequencies, and evaluating SID course alignment...
                </p>
              </div>
            </Card>
          ) : report ? (
            <IntelligenceReportCard report={report} />
          ) : (
            <Card className="border border-dashed border-border p-16 text-center text-xs text-muted-foreground space-y-3">
              <Sparkles className="size-10 text-primary mx-auto opacity-50" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Intelligence Center Ready</h4>
                <p className="max-w-md mx-auto leading-relaxed">
                  Select one of the preset inquiries on the left or type your own question to inspect real-time labor market signals and curriculum coverage.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </EmployerLayout>
  )
}

