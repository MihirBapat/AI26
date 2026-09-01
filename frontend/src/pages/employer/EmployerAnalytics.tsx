import { useState, useEffect, useCallback } from 'react'
import {
  Filter,
  AlertCircle,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { SkillDemandChart } from '@/components/employer/SkillDemandChart'
import { SalaryBenchmarkChart } from '@/components/employer/SalaryBenchmarkChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  getSkillDemandAnalytics,
  getSalaryBenchmarks,
} from '@/lib/employer-api'
import { apiFetch } from '@/lib/api'
import type {
  SkillDemandAnalyticsResponse,
  SalaryBenchmarkResponse,
} from '@/types/employer'

const DISTRICTS = [
  'All Maharashtra',
  'Pune', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon',
  'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
]

interface Sector {
  id: number
  name: string
}

export function EmployerAnalytics() {
  const [district, setDistrict] = useState('All Maharashtra')
  const [sectorId, setSectorId] = useState('all')
  const [sectors, setSectors] = useState<Sector[]>([])

  const [demandData, setDemandData] = useState<SkillDemandAnalyticsResponse | null>(null)
  const [salaryData, setSalaryData] = useState<SalaryBenchmarkResponse | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadSectors() {
      try {
        const sec = await apiFetch<Sector[]>('/lookups/sectors')
        setSectors(sec)
      } catch {
        // Fallback gracefully
      }
    }
    loadSectors()
  }, [])

  const loadAnalytics = useCallback(async () => {
    setErrorMsg(null)

    try {
      const [demandRes, salRes] = await Promise.all([
        getSkillDemandAnalytics({
          district,
          sector_id: sectorId !== 'all' ? parseInt(sectorId, 10) : undefined,
          limit: 15,
        }),
        getSalaryBenchmarks(district),
      ])

      setDemandData(demandRes)
      setSalaryData(salRes)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate analytics.')
    }
  }, [district, sectorId])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return (
    <EmployerLayout
      title="Labor Market & Salary Intelligence"
      subtitle="Dynamic state-level and district-level skill shortages, demand velocity, and compensation benchmarks"
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Filter className="size-4 text-primary" />
            <span>Target Market Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* District Selector */}
            <Select value={district} onValueChange={(val) => setDistrict(val || 'All Maharashtra')}>
              <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sector Selector */}
            <Select value={sectorId} onValueChange={(val) => setSectorId(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">
                  All Industry Sectors
                </SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Postings Analyzed</span>
            <h3 className="text-2xl font-bold text-foreground">
              {demandData?.total_postings_analyzed ?? 0}
            </h3>
            <span className="text-[11px] text-muted-foreground">In selected filter scope</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Top High-Demand Skill</span>
            <h3 className="text-lg font-bold text-primary truncate">
              {demandData?.top_demanded_skills[0]?.skill_name || 'No data'}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Demand Index:{' '}
              <strong>{demandData?.top_demanded_skills[0]?.demand_index ?? 0} / 100</strong>
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Tracked Roles</span>
            <h3 className="text-2xl font-bold text-foreground">
              {salaryData?.benchmarks.length ?? 0}
            </h3>
            <span className="text-[11px] text-muted-foreground">With active compensation data</span>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillDemandChart
          data={demandData?.top_demanded_skills || []}
          title={`Skill Demand Index in ${district}`}
        />
        <SalaryBenchmarkChart
          data={salaryData?.benchmarks || []}
          title={`Salary Distribution in ${district}`}
        />
      </div>

      {/* Detailed Skill Demand Metrics Table */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Ranked Skill Demand Velocity Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Dynamic mathematical metrics computed from active job vacancies across Maharashtra
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!demandData || demandData.top_demanded_skills.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground italic">
              No skill demand records in current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/30">
                    <th className="py-2.5 px-4 font-semibold">Rank</th>
                    <th className="py-2.5 px-4 font-semibold">Skill Name</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Active Postings</th>
                    <th className="py-2.5 px-4 font-semibold">Unique Employers</th>
                    <th className="py-2.5 px-4 font-semibold">Market Share %</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Demand Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {demandData.top_demanded_skills.map((s, idx) => (
                    <tr key={s.skill_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-muted-foreground">#{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5">
                        <span>{s.skill_name}</span>
                        {s.is_emerging && (
                          <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-600 bg-purple-500/10">
                            Emerging
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{s.category}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{s.postings_count}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.unique_employers_count}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.demand_share_pct}%</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-primary text-sm">{s.demand_index}</span>
                        <span className="text-[10px] text-muted-foreground"> / 100</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </EmployerLayout>
  )
}

