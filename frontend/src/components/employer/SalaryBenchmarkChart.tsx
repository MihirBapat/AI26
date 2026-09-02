import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { SalaryBenchmarkItem } from '@/types/employer'

interface SalaryBenchmarkChartProps {
  data: SalaryBenchmarkItem[]
  title?: string
  description?: string
  height?: number
}

export function SalaryBenchmarkChart({
  data,
  title = 'Compensation Benchmarks by Role (₹ / Year)',
  description = 'Computed dynamically from active state job vacancies across Maharashtra',
  height = 320,
}: SalaryBenchmarkChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-sm text-muted-foreground italic">
          No salary benchmark data recorded yet for this region.
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 8).map((item) => ({
    role: item.role_category,
    min: Math.round(item.min_salary),
    avg: Math.round(item.avg_salary),
    max: Math.round(item.max_salary),
    samples: item.sample_size,
  }))

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`
    return `₹${val}`
  }

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="role"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="#888888"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                stroke="#888888"
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const sample = payload[0].payload.samples
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-popover-foreground text-xs space-y-1">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-muted-foreground">Sample Postings: {sample}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={index} style={{ color: entry.color }} className="font-medium">
                            {entry.name}: ₹{Number(entry.value).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="min" name="Min Salary" fill="#93c5fd" radius={[2, 2, 0, 0]} />
              <Bar dataKey="avg" name="Average Salary" fill="#2563eb" radius={[2, 2, 0, 0]} />
              <Bar dataKey="max" name="Max Salary" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

