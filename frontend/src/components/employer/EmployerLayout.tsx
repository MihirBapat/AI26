import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Brain,
  ChartNoAxesCombined,
  GraduationCap,
  BadgeCheck,
  MessageSquareText,
  Sparkles,
  Building2,
  LogOut,
  Building,
  ChevronRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
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

interface EmployerLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}

const NAV_ITEMS = [
  {
    title: 'Overview',
    href: '/employer/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Jobs',
    href: '/employer/jobs',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Skills Taxonomy',
    href: '/employer/skills',
    icon: Brain,
  },
  {
    title: 'Analytics',
    href: '/employer/analytics',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Course Matching',
    href: '/employer/course-matches',
    icon: GraduationCap,
  },
  {
    title: 'Validations',
    href: '/employer/validations',
    icon: BadgeCheck,
  },
  {
    title: 'Feedback',
    href: '/employer/feedback',
    icon: MessageSquareText,
  },
  {
    title: 'Intelligence Center',
    href: '/employer/intelligence',
    icon: Sparkles,
  },
  {
    title: 'Profile',
    href: '/employer/profile',
    icon: Building2,
  },
]

export function EmployerLayout({
  children,
  title,
  subtitle,
  actions,
}: EmployerLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-3 py-3 mb-2 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center min-h-[57px]">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <Building className="size-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Employer Portal
            </span>
          </div>
          <SidebarTrigger />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== '/employer/dashboard' &&
                      location.pathname.startsWith(item.href))

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.href)}
                        tooltip={item.title}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-2 mt-auto">
          <div className="flex items-center gap-2.5 w-full overflow-hidden group-data-[collapsible=icon]:justify-center p-1">
            <div
              className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs"
              title={user?.full_name || 'Employer Account'}
            >
              <Building2 className="size-4" />
            </div>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden text-left">
              <span className="text-xs font-semibold truncate text-foreground">
                {user?.full_name || 'Employer Partner'}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header */}
        <header className="flex min-h-16 shrink-0 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b px-4 py-3 bg-background">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Employer</span>
              <ChevronRight className="size-3" />
              <span className="font-medium text-foreground">{title}</span>
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            {actions}

            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="size-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

