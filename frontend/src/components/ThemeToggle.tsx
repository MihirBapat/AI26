import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center bg-card border border-border rounded-full p-1 shadow-sm">
      <button 
        onClick={() => setTheme('light')} 
        className={`p-1.5 rounded-full transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
        title="Light Theme"
      >
        <Sun className="size-4" />
      </button>
      <button 
        onClick={() => setTheme('dark')} 
        className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
        title="Dark Theme"
      >
        <Moon className="size-4" />
      </button>
      <button 
        onClick={() => setTheme('system')} 
        className={`p-1.5 rounded-full transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
        title="System Theme"
      >
        <Monitor className="size-4" />
      </button>
    </div>
  )
}
