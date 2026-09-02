import { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getEmployerProfile, updateEmployerProfile } from '@/lib/employer-api'
import { apiFetch } from '@/lib/api'
import type { EmployerProfile, EmployerProfileUpdatePayload } from '@/types/employer'

const DISTRICTS = [
  'Pune', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon',
  'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
]

interface Sector {
  id: number
  name: string
}

export function EmployerProfilePage() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null)
  const [sectors, setSectors] = useState<Sector[]>([])

  // Form Fields
  const [companyName, setCompanyName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [industry, setIndustry] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [companySize, setCompanySize] = useState('51-200')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('Pune')
  const [pincode, setPincode] = useState('')
  const [description, setDescription] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [prof, sec] = await Promise.all([
          getEmployerProfile(),
          apiFetch<Sector[]>('/lookups/sectors').catch(() => []),
        ])

        setProfile(prof)
        setSectors(sec)

        // Populate form
        setCompanyName(prof.company_name || '')
        setLegalName(prof.legal_name || '')
        setIndustry(prof.industry || '')
        setSectorId(prof.sector_id ? prof.sector_id.toString() : '')
        setCompanySize(prof.company_size || '51-200')
        setWebsite(prof.website || '')
        setContactEmail(prof.contact_email || '')
        setContactPhone(prof.contact_phone || '')
        setAddress(prof.address || '')
        setCity(prof.city || '')
        setDistrict(prof.district || 'Pune')
        setPincode(prof.pincode || '')
        setDescription(prof.description || '')
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load organization profile.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      alert('Company Name is required.')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: EmployerProfileUpdatePayload = {
        company_name: companyName.trim(),
        legal_name: legalName.trim() || null,
        industry: industry.trim() || null,
        sector_id: sectorId ? parseInt(sectorId, 10) : null,
        company_size: companySize || null,
        website: website.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        district: district || null,
        pincode: pincode.trim() || null,
        description: description.trim() || null,
      }

      const updated = await updateEmployerProfile(payload)
      setProfile(updated)
      setSuccessMsg('Organization profile successfully saved!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EmployerLayout
      title="Organization Profile"
      subtitle="Manage your company details, regional district presence, and verification status"
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span>Loading organization profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Card: Overview & Verification */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{companyName || 'Organization'}</CardTitle>
                    <CardDescription className="text-xs">
                      Registered Employer on Maharashtra Labour Market Intelligence Platform
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {profile?.verification_status === 'verified' ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold gap-1 text-xs py-1 px-2.5">
                      <ShieldCheck className="size-3.5" />
                      Verified Industry Partner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold text-xs py-1 px-2.5">
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Core Info */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">1. Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Company / Trade Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Legal Registered Name</label>
                  <Input
                    placeholder="e.g. Tata Technologies Limited"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Industry Sector</label>
                  <Select value={sectorId} onValueChange={(val) => setSectorId(val || '')}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Primary Focus Area</label>
                  <Input
                    placeholder="e.g. Automotive & Embedded"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Company Size</label>
                  <Select value={companySize} onValueChange={(val) => setCompanySize(val || '51-200')}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10" className="text-xs">1-10 Employees</SelectItem>
                      <SelectItem value="11-50" className="text-xs">11-50 Employees</SelectItem>
                      <SelectItem value="51-200" className="text-xs">51-200 Employees</SelectItem>
                      <SelectItem value="201-500" className="text-xs">201-500 Employees</SelectItem>
                      <SelectItem value="500+" className="text-xs">500+ Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Company Description & Mission</label>
                <Textarea
                  placeholder="Overview of company operations, engineering capabilities, and talent requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs leading-relaxed"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Geography */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">2. Location & Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Globe className="size-3 text-muted-foreground" />
                    <span>Website URL</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Mail className="size-3 text-muted-foreground" />
                    <span>Official Contact Email</span>
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />
                    <span>Phone Number</span>
                  </label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <Input
                    placeholder="e.g. Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">District (Maharashtra)</label>
                  <Select value={district} onValueChange={(val) => setDistrict(val || 'Pune')}>
                    <SelectTrigger className="h-9 text-xs">
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
                  <label className="text-xs font-semibold text-foreground">Pincode</label>
                  <Input
                    placeholder="411001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Office Address</label>
                <Input
                  placeholder="Plot / Street / Industrial Area / Technology Park"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs gap-1.5 min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </EmployerLayout>
  )
}

