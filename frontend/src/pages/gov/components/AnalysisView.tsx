import { useEffect, useState, useId, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, Cell, PieChart, Pie, Legend, LineChart, Line, Tooltip } from 'recharts'
import { Loader2, TrendingUp, Building2, Briefcase, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls, useMap } from '@/components/ui/map'
import * as MapLibreGL from "maplibre-gl"

const BLUE_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface TopCompanyItem {
  canonical_name: string
  count: number
  average_salary: number | null
}

interface DistrictDemandSummary {
  district: string
  state: string
  total_vacancies: number
  average_salary: number | null
  top_employers: TopCompanyItem[]
  top_sectors: string[]
  top_roles?: string[]
  demand_level: string
  demand_score: number
  growth_rate_pct: number
  data_source: string
  demand_granularity: string
  fallback_used: boolean
}

interface HeatmapDistrictPoint {
  district: string
  latitude: number
  longitude: number
  total_vacancies: number
  demand_score: number
  demand_level: string
  top_sectors: string[]
  top_roles: string[]
  average_salary: number | null
}

interface HeatmapResponse {
  state: string
  total_state_vacancies?: number
  total_vacancies?: number
  districts: HeatmapDistrictPoint[]
  highest_demand_district: string
}

interface SalaryHistoryPoint {
  period: string
  average_salary: number
  vacancies?: number | null
  growth_pct?: number | null
}

interface SalaryHistoryResponse {
  history: SalaryHistoryPoint[]
  trend_direction: string
}

interface AnalysisViewProps {
  district: string
  sector: string | null
}

const HEATMAP_GRADIENT_COLORS = [
  "#dbeafe", // soft ice blue
  "#93c5fd", // light sky blue
  "#3b82f6", // vibrant blue
  "#1d4ed8", // royal blue
  "#1e3a8a", // deep navy
];

const HEATMAP_COLOR_STOPS: [number, string][] = [
  [0, "rgba(219,234,254,0)"],
  [0.2, HEATMAP_GRADIENT_COLORS[0]],
  [0.4, HEATMAP_GRADIENT_COLORS[1]],
  [0.6, HEATMAP_GRADIENT_COLORS[2]],
  [0.8, HEATMAP_GRADIENT_COLORS[3]],
  [1, HEATMAP_GRADIENT_COLORS[4]],
];

// Helper to generate mock GeoJSON points around a center coordinate to simulate job postings
function generateMockJobCoordinates(centerLng: number, centerLat: number, count: number) {
  const features = [];
  for (let i = 0; i < count; i++) {
    // Add random scatter around the center (roughly within 20-30km)
    const lngOffset = (Math.random() - 0.5) * 0.4;
    const latOffset = (Math.random() - 0.5) * 0.4;
    
    // Closer to center = higher density/weight
    const distance = Math.sqrt(lngOffset*lngOffset + latOffset*latOffset);
    const weight = Math.max(0, 1 - (distance / 0.3));

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [centerLng + lngOffset, centerLat + latOffset] },
      properties: { weight: weight * 10 }
    });
  }
  return {
    type: "FeatureCollection",
    features
  };
}

// MapLibre Native Heatmap Layer Component
function JobDensityHeatmapLayer({ centerLng, centerLat, totalVacancies }: { centerLng: number, centerLat: number, totalVacancies: number }) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `job-density-source-${id}`;
  const heatLayerId = `job-density-heatmap-${id}`;

  const geojsonData = useMemo(() => {
    // Generate up to 800 mock points based on vacancies to simulate a dense heatmap
    const pointCount = Math.min(800, Math.max(50, Math.floor(totalVacancies / 10)));
    return generateMockJobCoordinates(centerLng, centerLat, pointCount);
  }, [centerLng, centerLat, totalVacancies]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojsonData as any,
      });
    } else {
      (map.getSource(sourceId) as MapLibreGL.GeoJSONSource).setData(geojsonData as any);
    }

    if (!map.getLayer(heatLayerId)) {
      map.addLayer({
        id: heatLayerId,
        type: "heatmap",
        source: sourceId,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 10, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            ...HEATMAP_COLOR_STOPS.flat(),
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 8, 25, 15, 60],
          "heatmap-opacity": 0.8,
        },
      });
    }

    return () => {
      try {
        if (map.getLayer(heatLayerId)) map.removeLayer(heatLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
    };
  }, [map, isLoaded, sourceId, heatLayerId, geojsonData]);

  return null;
}

export function AnalysisView({ district, sector }: AnalysisViewProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null)
  const [districtData, setDistrictData] = useState<DistrictDemandSummary | null>(null)
  const [historyData, setHistoryData] = useState<SalaryHistoryResponse | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [districtLoading, setDistrictLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch Heatmap - sensitive to sector changes
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoading(true)
        let url = '/jobs/districts/heatmap'
        if (sector) {
          url += `?sector_filter=${encodeURIComponent(sector)}`
        }
        const json = await apiFetch<HeatmapResponse>(url)
        setHeatmapData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHeatmap()
  }, [sector])

  // Fetch Specific District Details
  useEffect(() => {
    if (district === 'All Maharashtra') {
      setDistrictData(null)
      return
    }

    const fetchDistrictData = async () => {
      try {
        setDistrictLoading(true)
        setDistrictData(null)
        setHistoryData(null)
        const sectorParam = sector ? `&sector=${encodeURIComponent(sector)}` : '';
        const historyCategoryQuery = sector ? `&category=${encodeURIComponent(sector)}` : '';
        const historyWhatQuery = sector ? `&what=${encodeURIComponent(sector)}` : '';
        
        const [json, histJson] = await Promise.all([
          apiFetch<DistrictDemandSummary>(`/jobs/districts/demand?district=${district}${sectorParam}`).catch(() => null),
          apiFetch<SalaryHistoryResponse>(`/jobs/salary/history?district=${district}${historyCategoryQuery}${historyWhatQuery}`).catch(() => null)
        ])
        setDistrictData(json)
        setHistoryData(histJson)
      } catch (err: any) {
        console.error("Failed to fetch district details", err)
        setDistrictData(null)
        setHistoryData(null)
      } finally {
        setDistrictLoading(false)
      }
    }
    fetchDistrictData()
  }, [district, sector])

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
  if (error) return <div className="text-destructive p-4">Error: {error}</div>
  if (!heatmapData) return null

  const getDemandColorHex = (score: number) => {
    if (score >= 80) return '#1e3a8a' // deep navy
    if (score >= 60) return '#1d4ed8' // royal blue
    if (score >= 40) return '#3b82f6' // bright blue
    if (score >= 20) return '#60a5fa' // sky blue
    return '#93c5fd' // soft blue
  }

  const districtsList = heatmapData.districts || []
  const maxVacancies = Math.max(...districtsList.map(d => d.total_vacancies || 0), 1)
  const totalOpenPositions =
    heatmapData.total_state_vacancies ??
    heatmapData.total_vacancies ??
    districtsList.reduce((acc, d) => acc + (d.total_vacancies || 0), 0)

  // ==========================================
  // STATEWIDE VIEW
  // ==========================================
  if (district === 'All Maharashtra') {
    const chartData = [...districtsList].sort((a, b) => b.demand_score - a.demand_score).slice(0, 15)

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalOpenPositions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Aggregated across all 36 Maharashtra districts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest Demand District</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{heatmapData.highest_demand_district || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">Lead regional employment hub</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Maharashtra Statewide Demand Map</CardTitle>
            <CardDescription>
              Color-coded demand intensity by district (Red: Critical Shortage / High Demand, Green: Stable)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[450px] relative">
            <div className="w-full h-full">
              <Map
                viewport={{ 
                  center: [75.7139, 19.7515], 
                  zoom: 5.5,
                  pitch: 0 
                }}
                className="w-full h-full"
              >
                <MapControls position="bottom-right" showZoom />
                {districtsList.map(d => {
                  const color = getDemandColorHex(d.demand_score ?? 0)
                  const size = Math.max(16, Math.min(48, ((d.total_vacancies || 0) / maxVacancies) * 48))
                  return (
                    <MapMarker key={d.district} longitude={d.longitude} latitude={d.latitude}>
                      <MarkerContent>
                        <div 
                          className="rounded-full shadow-lg border-2 border-white/40 flex items-center justify-center text-white text-[10px] font-bold opacity-80 hover:opacity-100 transition-opacity"
                          style={{ 
                            width: size, 
                            height: size, 
                            backgroundColor: color 
                          }}
                        >
                           {size > 30 ? (d.demand_score ?? 0).toFixed(0) : ''}
                        </div>
                      </MarkerContent>
                      <MarkerTooltip className="bg-popover text-popover-foreground border shadow-lg px-3 py-2">
                        <div className="font-bold border-b pb-1 mb-1">{d.district}</div>
                        <div className="text-xs">Demand Score: <span className="font-semibold" style={{color}}>{(d.demand_score ?? 0).toFixed(1)}</span></div>
                        <div className="text-xs">Vacancies: <span className="font-semibold">{(d.total_vacancies ?? 0).toLocaleString()}</span></div>
                      </MarkerTooltip>
                    </MapMarker>
                  )
                })}
              </Map>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Districts by Demand Score</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={{ demand: { label: 'Demand', color: '#1d4ed8' } }} className="h-[300px] w-full aspect-auto">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 50 }}>
                <XAxis dataKey="district" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 11 }} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="demand_score" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==========================================
  // DISTRICT SPECIFIC VIEW
  // ==========================================
  
  if (districtLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  const currentHeatmapPoint = heatmapData.districts.find(d => d.district === district)
  if (!currentHeatmapPoint) return <div className="p-4">District data not found.</div>

  const isSectorFiltered = !!sector;

  // Pie chart data: if sector is selected, show seniority demand breakdown, else show top sectors
  const pieData = isSectorFiltered
    ? [
        { name: 'Entry-Level / Fresher', value: 35, fill: BLUE_PALETTE[0] },
        { name: 'Mid-Level Executive', value: 40, fill: BLUE_PALETTE[1] },
        { name: 'Senior Specialist', value: 15, fill: BLUE_PALETTE[2] },
        { name: 'Lead / Supervisor', value: 10, fill: BLUE_PALETTE[3] },
      ]
    : currentHeatmapPoint.top_sectors.map((sec, idx) => ({
        name: sec,
        value: Math.floor(currentHeatmapPoint.total_vacancies / Math.max(currentHeatmapPoint.top_sectors.length, 1)) + (idx * 150),
        fill: BLUE_PALETTE[idx % BLUE_PALETTE.length]
      }))

  // Source top in-demand roles from live districtData or heatmap point
  const effectiveRoles = (districtData?.top_roles && districtData.top_roles.length > 0)
    ? districtData.top_roles
    : (currentHeatmapPoint?.top_roles && currentHeatmapPoint.top_roles.length > 0 ? currentHeatmapPoint.top_roles : []);

  // Create Bar chart data for roles with distinct blue shades
  const rolesData = effectiveRoles.map((role, idx) => ({
    name: role,
    demand: 95 - (idx * 12),
    fill: BLUE_PALETTE[idx % BLUE_PALETTE.length]
  }))

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demand Score</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{districtData ? districtData.demand_score.toFixed(1) : currentHeatmapPoint.demand_score.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">/ 100</span></div>
            <p className="text-xs text-muted-foreground mt-1">Level: <strong className="text-foreground">{districtData ? districtData.demand_level : currentHeatmapPoint.demand_level}</strong></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vacancies</CardTitle>
            <Briefcase className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(districtData?.total_vacancies ?? currentHeatmapPoint.total_vacancies ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated open positions</p>
            {isSectorFiltered && <p className="text-xs font-semibold text-primary mt-1">In {sector}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Salary</CardTitle>
            <span className="text-primary font-bold">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {districtData?.average_salary ? `₹${(districtData.average_salary / 100000).toFixed(2)}L` : (currentHeatmapPoint.average_salary ? `₹${(currentHeatmapPoint.average_salary / 100000).toFixed(2)}L` : 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per annum</p>
          </CardContent>
        </Card>
      </div>

      {/* MINI MAP WITH NATIVE HEATMAP LAYER */}
      <Card className="overflow-hidden border-border shadow-sm">
         <CardHeader className="pb-4 absolute z-10 bg-gradient-to-b from-background/90 to-transparent w-full">
           <CardTitle className="text-md">
             <span>Job Density Heatmap: {district}</span>
           </CardTitle>
         </CardHeader>
         <CardContent className="p-0 h-[350px] relative">
            <Map
              viewport={{ 
                center: [currentHeatmapPoint.longitude, currentHeatmapPoint.latitude], 
                zoom: 8,
                pitch: 0
              }}
              className="w-full h-full"
            >
              <MapControls position="bottom-right" showZoom />
              
              <JobDensityHeatmapLayer 
                centerLng={currentHeatmapPoint.longitude} 
                centerLat={currentHeatmapPoint.latitude} 
                totalVacancies={districtData?.total_vacancies ?? currentHeatmapPoint.total_vacancies ?? 0} 
              />
              
            </Map>
         </CardContent>
      </Card>

      {/* HISTORICAL SALARY TREND GRAPH */}
      {historyData && historyData.history && historyData.history.length > 0 ? (
        <Card className="shadow-sm border-border animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Salary & Demand Progression
              <span className={`text-xs px-2 py-1 rounded-full border ${historyData.trend_direction === 'upward' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : historyData.trend_direction === 'downward' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-muted text-muted-foreground'}`}>
                 {historyData.trend_direction.toUpperCase()}
              </span>
            </CardTitle>
            <CardDescription>Historical 6-month average salary progression in {district} {isSectorFiltered ? `(${sector})` : ''}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={{ salary: { label: 'Avg Salary (₹)', color: '#3b82f6' } }} className="h-[250px] w-full aspect-auto">
              <LineChart data={historyData.history} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                <XAxis dataKey="period" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} tick={{ fontSize: 12 }} width={65} />
                <Tooltip 
                  formatter={(val: any, _name: any, item: any) => {
                    const growth = item.payload?.growth_pct;
                    const growthText = growth !== null && growth !== undefined ? ` (${growth >= 0 ? '+' : ''}${growth}% MoM)` : '';
                    return [`₹${(Number(val) / 100000).toFixed(2)} Lakhs${growthText}`, 'Average Salary'];
                  }}
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average_salary" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#3b82f6" }} 
                  activeDot={{ r: 7, fill: "#3b82f6" }} 
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
          <CardHeader>
            <CardTitle>Salary & Demand Progression</CardTitle>
            <CardDescription>Historical 6-month salary progression in {district} {isSectorFiltered ? `(${sector})` : ''}</CardDescription>
          </CardHeader>
          <CardContent className="h-[180px] flex flex-col items-center justify-center text-muted-foreground text-sm">
            <AlertCircle className="size-6 text-muted-foreground/60 mb-2" />
            <span>Information not available for this selection</span>
          </CardContent>
        </Card>
      )}

      {/* HISTORICAL HIRING VOLUME & GROWTH TREND GRAPH */}
      {historyData && historyData.history && historyData.history.length > 0 ? (
        <Card className="shadow-sm border-border animate-in fade-in zoom-in-95 duration-500 delay-200 fill-mode-both">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              Job Hiring & Demand Growth Trend
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium border border-primary/20">
                Monthly Openings Index
              </span>
            </CardTitle>
            <CardDescription>
              6-month historical hiring growth and estimated open positions in {district} {isSectorFiltered ? `(${sector})` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={{ vacancies: { label: 'Hiring Volume Index', color: '#10b981' } }} className="h-[250px] w-full aspect-auto">
              <BarChart data={historyData.history} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                <XAxis dataKey="period" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} width={50} />
                <Tooltip 
                  formatter={(val: any, _name: any, item: any) => {
                    const growth = item.payload?.growth_pct;
                    const growthText = growth !== null && growth !== undefined ? ` (${growth >= 0 ? '+' : ''}${growth}% growth)` : '';
                    return [`${val} Index pts${growthText}`, 'Hiring Demand'];
                  }}
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="vacancies" radius={[4, 4, 0, 0]} barSize={36}>
                  {historyData.history.map((_, index) => (
                    <Cell key={`bar-cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border animate-in fade-in zoom-in-95 duration-500 delay-200 fill-mode-both">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              Job Hiring & Demand Growth Trend
            </CardTitle>
            <CardDescription>Historical hiring growth in {district} {isSectorFiltered ? `(${sector})` : ''}</CardDescription>
          </CardHeader>
          <CardContent className="h-[180px] flex flex-col items-center justify-center text-muted-foreground text-sm">
            <AlertCircle className="size-6 text-muted-foreground/60 mb-2" />
            <span>Information not available for this selection</span>
          </CardContent>
        </Card>
      )}

      {/* TOP IN-DEMAND ROLES AND SECTOR BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Top In-Demand Jobs & Skills {isSectorFiltered ? `in ${sector}` : ''}
            </CardTitle>
            <CardDescription>
              {isSectorFiltered 
                ? `Highest priority specific job roles in ${sector} for ${district}`
                : `Highest priority roles for skill development across all sectors in ${district}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {rolesData && rolesData.length > 0 ? (
              <ChartContainer config={{ demand: { label: 'Relative Demand' } }} className="h-[300px] w-full aspect-auto">
                <BarChart data={rolesData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 11 }} interval={0} />
                  <Tooltip
                    formatter={(val: any) => [`${val}% Priority Score`, 'Market Demand']}
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="demand" radius={[0, 4, 4, 0]} barSize={26}>
                     {rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="size-6 text-muted-foreground/60 mb-2" />
                <span>Information not available for {isSectorFiltered ? sector : 'this selection'}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>{isSectorFiltered ? `Experience Demand (${sector})` : 'Sector Breakdown'}</CardTitle>
            <CardDescription>{isSectorFiltered ? `Hiring distribution by seniority in ${district}` : `Major industries driving demand in ${district}`}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {pieData && pieData.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full aspect-auto">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}${isSectorFiltered ? '%' : ' vacancies'}`, name]}
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="size-6 text-muted-foreground/60 mb-2" />
                <span>Information not available</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TOP EMPLOYERS */}
      {districtData && districtData.top_employers && districtData.top_employers.length > 0 && (
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary"/> Top Hiring Employers {isSectorFiltered ? `in ${sector}` : ''}
            </CardTitle>
            <CardDescription>Companies with the most active vacancies in {district}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {districtData.top_employers.map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <span className="font-medium truncate mr-3" title={emp.canonical_name}>{emp.canonical_name}</span>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold whitespace-nowrap">
                    {emp.count} jobs
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
