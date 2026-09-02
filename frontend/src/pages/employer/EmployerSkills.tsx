import { useState, useEffect } from 'react'
import {
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getCanonicalSkills, normalizeSkill } from '@/lib/employer-api'
import type { SkillRead, SkillNormalizeResponse } from '@/types/employer'

const CATEGORIES = [
  'All Categories',
  'Programming Language',
  'Framework',
  'Database',
  'Cloud & DevOps',
  'Architecture',
  'AI & Data',
  'Manufacturing',
  'Automotive',
  'Electronics',
  'Healthcare',
  'BFSI',
  'Logistics',
  'Renewable Energy',
]

export function EmployerSkills() {
  const [skills, setSkills] = useState<SkillRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')

  // Live Normalizer Tool State
  const [testInput, setTestInput] = useState('')
  const [normalizeResult, setNormalizeResult] = useState<SkillNormalizeResponse | null>(null)
  const [isNormalizing, setIsNormalizing] = useState(false)

  useEffect(() => {
    async function fetchSkills() {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getCanonicalSkills({
          category: selectedCategory === 'All Categories' ? undefined : selectedCategory,
          search: search.trim() || undefined,
          limit: 100,
        })
        setSkills(data)
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load canonical skills.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkills()
  }, [search, selectedCategory])

  const handleTestNormalize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testInput.trim()) return

    setIsNormalizing(true)
    try {
      const res = await normalizeSkill(testInput.trim())
      setNormalizeResult(res)
    } catch (err: any) {
      alert(err.message || 'Normalization failed.')
    } finally {
      setIsNormalizing(false)
    }
  }

  return (
    <EmployerLayout
      title="Canonical Skill Taxonomy"
      subtitle="Standardized skill vocabulary, alias mapping, and real-time fuzzy normalizer"
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Normalizer Tool Box */}
      <Card className="border border-primary/30 bg-card shadow-xs">
        <CardHeader className="pb-3 bg-primary/[0.02] border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Live Skill Alias Normalizer & Matcher
              </CardTitle>
              <CardDescription className="text-xs">
                Test how variations (e.g. "Postgres", "Kubernets", "React.js") resolve to canonical taxonomy entries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleTestNormalize} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Try: 'FastAPI', 'Postgres', 'Kubernets', 'AWS Cloud', 'CNC'..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="text-xs h-9 flex-1"
            />
            <Button
              type="submit"
              disabled={isNormalizing || !testInput.trim()}
              size="sm"
              className="h-9 text-xs gap-1.5"
            >
              {isNormalizing && <Loader2 className="size-3.5 animate-spin" />}
              <span>Test Normalization</span>
            </Button>
          </form>

          {normalizeResult && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">"{normalizeResult.raw_input}"</span>
                <ArrowRight className="size-3.5 text-primary" />
                {normalizeResult.canonical_skill ? (
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {normalizeResult.canonical_skill.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">No canonical match found</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <Badge variant="outline" className="text-[10px]">
                  Match: <strong>{normalizeResult.matched_via}</strong>
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Confidence: {Math.round(normalizeResult.confidence * 100)}%
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Explorer Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter canonical skills by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val || 'All Categories')}
          >
            <SelectTrigger className="w-full md:w-[220px] h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span>Loading canonical skills taxonomy...</span>
        </div>
      ) : skills.length === 0 ? (
        <Card className="p-12 text-center text-xs text-muted-foreground">
          No canonical skills match your search criteria.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {skills.map((skill) => (
            <Card
              key={skill.id}
              className="border border-border/80 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
            >
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{skill.name}</h4>
                  {skill.is_emerging && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-500 text-white shrink-0">
                      EMERGING
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Category</span>
                    <span className="font-medium text-foreground">{skill.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground font-mono text-[10px]">
                    <span>Lookup Key</span>
                    <span>{skill.normalized_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </EmployerLayout>
  )
}

