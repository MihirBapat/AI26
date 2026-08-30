import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface CourseStats {
  total_courses: number
  online_courses: number
  offline_courses: number
  free_courses: number
  paid_courses: number
  total_enrollments: number
  unique_providers: number
  unique_sectors: number
  avg_rating: number
  with_certificate: number
}

export function CourseView() {
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch<CourseStats>('/courses/stats')
        setStats(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
  if (error) return <div className="text-destructive p-4">Error: {error}</div>
  if (!stats) return null

  // Prepare data for charts
  const typeData = [
    { name: 'Online', value: stats.online_courses, fill: 'var(--color-online)' },
    { name: 'Offline', value: stats.offline_courses, fill: 'var(--color-offline)' },
  ]
  const typeConfig = {
    online: { label: 'Online', color: 'hsl(var(--chart-1))' },
    offline: { label: 'Offline', color: 'hsl(var(--chart-2))' },
  }

  const costData = [
    { name: 'Free', value: stats.free_courses, fill: 'var(--color-free)' },
    { name: 'Paid', value: stats.paid_courses, fill: 'var(--color-paid)' },
  ]
  const costConfig = {
    free: { label: 'Free', color: 'hsl(var(--chart-3))' },
    paid: { label: 'Paid', color: 'hsl(var(--chart-4))' },
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_courses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_enrollments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_providers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_sectors.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Types</CardTitle>
            <CardDescription>Distribution of online vs offline courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={typeConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Structure</CardTitle>
            <CardDescription>Free vs Paid courses available</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={costConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
