import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { SkillDemandItem } from '@/types/employer'

interface SkillDemandChartProps {
  data: SkillDemandItem[]
  title?: string
  description?: string
  height?: number
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#818cf8', '#a78bfa', '#c084fc']

export function SkillDemandChart({
  data,
  title = 'Top Market Skill Demand Index',
  description = 'Dynamic score calculated from active employer vacancies and unique employer counts',
  height = 320,
}: SkillDemandChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-sm text-muted-foreground italic">
          No skill demand data available for selected filter.
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 10).map((item) => ({
    name: item.skill_name,
    demandIndex: item.demand_index,
    postings: item.postings_count,
    employers: item.unique_employers_count,
    category: item.category,
    isEmerging: item.is_emerging,
  }))

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.3} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                stroke="#888888"
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                stroke="#888888"
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-popover-foreground text-xs space-y-1">
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-muted-foreground">Category: {d.category}</p>
                        <p className="text-primary font-medium">Demand Index: {d.demandIndex} / 100</p>
                        <p className="text-muted-foreground">
                          Postings: {d.postings} &middot; Unique Employers: {d.employers}
                        </p>
                        {d.isEmerging && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500 text-white">
                            EMERGING SKILL
                          </span>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="demandIndex" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

