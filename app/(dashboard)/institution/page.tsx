'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Building2, Users, BookOpen,
  TrendingUp, Award, Search,
  Download, GraduationCap, Lightbulb,
  Trophy, Star, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

export default function InstitutionDashboard() {
  const [institution, setInstitution] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeResearchers: 0,
    totalIdeas: 0,
    totalProjects: 0,
    totalShowcase: 0,
    totalAkili: 0,
    grantApplications: 0,
    mentorSessions: 0,
  })
  const [topResearchers, setTopResearchers] = useState<any[]>([])
  const [recentIdeas, setRecentIdeas] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [noInstitution, setNoInstitution] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, university_id')
      .eq('id', user.id)
      .single()

    setIsAdmin(profile?.is_admin || false)

    let institutionData = null

    const { data: myInstitution } = await supabase
      .from('institutions')
      .select('*')
      .eq('admin_user_id', user.id)
      .maybeSingle()

    if (myInstitution) {
      institutionData = myInstitution
    } else {
      const { data: membership } = await supabase
        .from('institution_members')
        .select('*, institutions(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (membership?.institutions) {
        institutionData = membership.institutions
      }
    }

    if (!institutionData) {
      setNoInstitution(true)
      setLoading(false)
      return
    }

    setInstitution(institutionData)

    const { data: memberData } = await supabase
      .from('institution_members')
      .select(`
        *,
        profiles(
          id, full_name, avatar_url,
          department, academic_level,
          akili_score, research_interests,
          projects_completed
        )
      `)
      .eq('institution_id', institutionData.id)

    const memberProfiles = (memberData || [])
      .map((m: any) => m.profiles)
      .filter(Boolean)

    setMembers(memberProfiles)

    const memberIds = memberProfiles.map((m: any) => m.id)

    if (memberIds.length > 0) {
      const [ideasRes, projectsRes, showcaseRes, grantsRes] = await Promise.all([
        supabase.from('research_ideas')
          .select('id', { count: 'exact', head: true })
          .in('author_id', memberIds),
        supabase.from('research_projects')
          .select('id', { count: 'exact', head: true })
          .in('created_by', memberIds),
        supabase.from('showcase_entries')
          .select('id', { count: 'exact', head: true })
          .in('author_id', memberIds),
        supabase.from('grant_applications')
          .select('id', { count: 'exact', head: true })
          .in('applicant_id', memberIds),
      ])

      const totalAkili = memberProfiles.reduce(
        (sum: number, m: any) => sum + (m.akili_score || 0), 0
      )

      setStats({
        totalMembers: memberProfiles.length,
        activeResearchers: memberProfiles.filter(
          (m: any) => (m.akili_score || 0) > 100
        ).length,
        totalIdeas: ideasRes.count || 0,
        totalProjects: projectsRes.count || 0,
        totalShowcase: showcaseRes.count || 0,
        totalAkili,
        grantApplications: grantsRes.count || 0,
        mentorSessions: 0,
      })

      const sorted = [...memberProfiles]
        .sort((a: any, b: any) => (b.akili_score || 0) - (a.akili_score || 0))
        .slice(0, 5)
      setTopResearchers(sorted)
    }

    if (memberIds.length > 0) {
      const { data: ideas } = await supabase
        .from('research_ideas')
        .select(`
          id, title, research_area,
          created_at, upvotes,
          profiles(full_name, avatar_url)
        `)
        .in('author_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentIdeas(ideas || [])
    }

    setLoading(false)
  }

  const filteredMembers = members.filter(m =>
    !search.trim() ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  )

  function exportReport() {
    const lines = [
      `INSTITUTION RESEARCH REPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Institution: ${institution?.name}`,
      `Country: ${institution?.country}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `SUMMARY STATISTICS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Total Researchers: ${stats.totalMembers}`,
      `Active Researchers: ${stats.activeResearchers}`,
      `Research Ideas Posted: ${stats.totalIdeas}`,
      `Active Projects: ${stats.totalProjects}`,
      `Published Research: ${stats.totalShowcase}`,
      `Grant Applications: ${stats.grantApplications}`,
      `Total Akili Points: ${stats.totalAkili.toLocaleString()}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `TOP RESEARCHERS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...topResearchers.map((r, i) =>
        `${i + 1}. ${r.full_name} — ${r.department || 'N/A'} — ${r.akili_score || 0} Akili`
      ),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `ALL RESEARCHERS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Name | Department | Level | Akili Score`,
      ...members.map(m =>
        `${m.full_name} | ${m.department || 'N/A'} | ${m.academic_level || 'N/A'} | ${m.akili_score || 0}`
      ),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `RECENT RESEARCH IDEAS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...recentIdeas.map(idea =>
        `• ${idea.title} (${idea.research_area}) — ${idea.upvotes || 0} upvotes`
      ),
      ``,
      `Generated by ResearchFlow — researchflowafrica.com`,
    ]

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${institution?.name.replace(/\s+/g, '_')}_Research_Report_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full animate-spin border-4 border-primary border-t-transparent" />
    </div>
  )

  if (noInstitution) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">No Institution Found</h1>
        <p className="text-muted-foreground">
          Your account is not linked to any university or institution yet.
        </p>
        {isAdmin && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              As a platform admin you can create institutions below.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button asChild>
                <Link href="/admin/institutions">Manage Institutions</Link>
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return

                  const { data } = await supabase
                    .from('institutions')
                    .insert({
                      name: 'ResearchFlow',
                      acronym: 'RF',
                      country: 'Nigeria',
                      contact_email: 'abdullateef0822@gmail.com',
                      subscription_status: 'active',
                      subscription_plan: 'large',
                      admin_user_id: user.id,
                    })
                    .select()
                    .single()

                  if (data) {
                    window.location.reload()
                  }
                }}
              >
                Create ResearchFlow Institution
              </Button>
            </div>
          </div>
        )}
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          <p>Are you a research coordinator or VC at a university?</p>
          <p className="mt-1">
            Contact us at{' '}
            <a
              href="mailto:support@researchflowafrica.com"
              className="text-primary hover:underline"
            >
              support@researchflowafrica.com
            </a>{' '}
            to set up your institution dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{institution.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={
                    institution.subscription_status === 'active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {institution.subscription_status === 'active' ? '✓ Premium' : 'Free Plan'}
                </Badge>
                <span className="text-xs text-muted-foreground">{institution.country}</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportReport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Researchers', value: stats.totalMembers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Active Researchers', value: stats.activeResearchers, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Research Ideas', value: stats.totalIdeas, icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Active Projects', value: stats.totalProjects, icon: BookOpen, color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { label: 'Published Research', value: stats.totalShowcase, icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Grant Applications', value: stats.grantApplications, icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Total Akili Points', value: stats.totalAkili.toLocaleString(), icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          {
            label: 'Departments',
            value: [...new Set(members.map((m: any) => m.department).filter(Boolean))].length,
            icon: GraduationCap,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Researchers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Top Researchers</h2>
              <Badge variant="outline" className="text-xs">By Akili Score</Badge>
            </div>
            <div className="space-y-3">
              {topResearchers.map((researcher: any, i) => (
                <div key={researcher.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                  <Link href={`/profile/${researcher.id}`}>
                    <Avatar className="w-9 h-9 hover:ring-2 hover:ring-primary/50 transition-all">
                      <AvatarImage src={researcher.avatar_url} />
                      <AvatarFallback>{researcher.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{researcher.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {researcher.department || researcher.academic_level}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">
                      {(researcher.akili_score || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Akili</p>
                  </div>
                </div>
              ))}
              {topResearchers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No researchers yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Research Ideas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent Research Ideas</h2>
              <Link href="/ideas">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentIdeas.map((idea: any) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`}>
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                      <AvatarImage src={idea.profiles?.avatar_url} />
                      <AvatarFallback className="text-[10px]">{idea.profiles?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{idea.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-400 px-1.5">
                          {idea.research_area}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">↑ {idea.upvotes || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {recentIdeas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No ideas posted yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Researchers */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold">All Researchers ({members.length})</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search researchers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Researcher</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Level</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akili</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member: any) => (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/profile/${member.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-xs">{member.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.full_name}</span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">{member.department || '—'}</td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">{member.academic_level || '—'}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-primary">{(member.akili_score || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No researchers found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA for free plan */}
      {institution.subscription_status !== 'active' && (
        <div className="bg-gradient-to-r from-primary/20 to-teal-500/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold">Upgrade to Premium</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get advanced analytics, unlimited researchers, and priority support.
            </p>
          </div>
          <Button asChild>
            <a href="mailto:support@researchflowafrica.com?subject=Institution Premium Upgrade">
              Contact Us to Upgrade
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
