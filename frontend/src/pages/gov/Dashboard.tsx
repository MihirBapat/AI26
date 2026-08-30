import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, BarChart3, BookOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { CourseView } from './components/CourseView'
import { AnalysisView } from './components/AnalysisView'
import { apiFetch } from '@/lib/api'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL_MAHARASHTRA_DISTRICTS = [
  'All Maharashtra', 'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
]

interface Sector {
  id: number
  name: string
}

export function GovDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'course'>('analysis')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Maharashtra')
  
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all')
  const handleLogout = async () => {
    await logout()
    navigate('/gov/login')
  }

  // Fetch Sectors on load
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await apiFetch<Sector[]>('/lookups/sectors')
        setSectors(data)
      } catch (err) {
        console.error("Failed to load sectors", err)
      }
    }
    fetchSectors()
  }, [])

  const selectedSectorName = sectors.find(s => s.id.toString() === selectedSectorId)?.name || null

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-2 py-3 mb-2 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center min-h-[57px]">
          <div className="flex-1 group-data-[collapsible=icon]:hidden" />
          <SidebarTrigger />
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'analysis'}
                    onClick={() => setActiveTab('analysis')}
                    tooltip="Market Analysis"
                  >
                    <BarChart3 />
                    <span>Analysis</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeTab === 'course'}
                    onClick={() => setActiveTab('course')}
                    tooltip="Course Metrics"
                  >
                    <BookOpen />
                    <span>Courses</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-2 mt-auto">
          <div className="flex items-center gap-3 w-full overflow-hidden group-data-[collapsible=icon]:justify-center">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" title={user?.full_name || 'Gov Official'}>
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold truncate">{user?.full_name || 'Gov Official'}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex min-h-16 shrink-0 flex-col sm:flex-row items-start sm:items-center gap-4 border-b px-4 py-3 bg-background">
          <div className="flex items-center w-full sm:w-auto">
            <h1 className="text-lg font-semibold whitespace-nowrap">
              {activeTab === 'analysis' ? 'Labor Market Intelligence' : 'Skill Development Courses'}
            </h1>
          </div>
          
          <div className="flex-1 flex flex-wrap items-center justify-start sm:justify-end gap-3 w-full sm:w-auto">
            {activeTab === 'analysis' && (
              <>
                <Select value={selectedSectorId} onValueChange={(val) => { if (val) setSelectedSectorId(val); }}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="All Sectors">
                      {selectedSectorId === 'all' ? 'All Sectors' : sectors.find(s => s.id.toString() === selectedSectorId)?.name || 'All Sectors'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">All Sectors</SelectItem>
                    {sectors.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()} className="text-xs">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDistrict} onValueChange={(val) => { if (val) setSelectedDistrict(val); }}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_MAHARASHTRA_DISTRICTS.map(d => (
                      <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="Sign Out"
              >
                <LogOut className="size-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'analysis' ? (
              <AnalysisView 
                district={selectedDistrict} 
                sector={selectedSectorName} 
              />
            ) : (
              <CourseView />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
