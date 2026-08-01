"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Eye,
  Download,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  Users,
  Calendar,
  Building2,
  GraduationCap,
  CheckCircle2,
  Maximize2,
  Twitter,
  Linkedin,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { ListPageSkeleton } from "@/components/ui/skeleton-screens"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { ShowcaseEntry, Profile } from "@/lib/types/database"
import { showcaseDownloaded25Times } from "@/lib/actions/akili"
import { BookmarkButton } from "@/components/ui/bookmark-button"

type ShowcaseWithAuthor = ShowcaseEntry & {
  author: Profile | null
}

const STATUS_COLORS: Record<string, string> = {
  published: '#22C55E',
  featured: '#EAB308',
  submitted: '#06B6D4',
  draft: 'var(--muted-foreground)',
  archived: 'var(--muted-foreground)',
}

function getApaAuthorName(fullName: string | null | undefined): string {
  if (!fullName) return 'Unknown Author'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  const lastName = parts[parts.length - 1]
  const initials = parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + '.')
    .join(' ')
  return `${lastName}, ${initials}`
}

export default function ShowcaseEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [entry, setEntry] = useState<ShowcaseWithAuthor | null>(null)
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<Profile[]>([])
  const [related, setRelated] = useState<ShowcaseWithAuthor[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfFullscreen, setPdfFullscreen] = useState(false)
  const [citationCopied, setCitationCopied] = useState(false)
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'harvard'>('apa')
  const [linkCopied, setLinkCopied] = useState(false)
  const [downloadCount, setDownloadCount] = useState(0)
  const [shareCount, setShareCount] = useState(0)

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)

    const { data, error } = await supabase
      .from("showcase_entries")
      .select("*, author:profiles!author_id(*)")
      .eq("id", id)
      .in("status", ["published", "featured"])
      .single()

    if (error || !data) {
      router.push("/showcase")
      return
    }

    setEntry(data as ShowcaseWithAuthor)
    setDownloadCount((data as ShowcaseEntry & { downloads?: number }).downloads || 0)

    // Increment views (silently)
    try {
      await supabase.rpc("increment_showcase_views", { entry_id: id })
    } catch {
      await supabase
        .from("showcase_entries")
        .update({ views: data.views + 1 })
        .eq("id", id)
    }

    // Load collaborator profiles
    if (data.collaborators && data.collaborators.length > 0) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const ids = data.collaborators.filter((c: string) => uuidPattern.test(c))
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, department, university_id")
          .in("id", ids)
        if (profiles) setCollaboratorProfiles(profiles as Profile[])
      }
    }

    // Load related entries
    const { data: relatedData } = await supabase
      .from("showcase_entries")
      .select("*, author:profiles!author_id(*)")
      .eq("research_area", data.research_area)
      .neq("id", id)
      .in("status", ["published", "featured"])
      .limit(3)
    if (relatedData) setRelated(relatedData as ShowcaseWithAuthor[])

    setIsLoading(false)
  }

  async function handleDownload() {
    if (!entry?.document_url) return
    window.open(entry.document_url, "_blank")

    const supabase = createClient()
    try {
      const { data: newCount } = await supabase.rpc("increment_showcase_downloads", {
        entry_id: id,
      })
      const count = typeof newCount === "number" ? newCount : downloadCount + 1
      setDownloadCount(count)
      if (count === 25 && entry.author_id) {
        await showcaseDownloaded25Times(entry.author_id, id)
        toast.success("Milestone reached! Research downloaded 25 times.")
      }
    } catch {
      setDownloadCount((c) => c + 1)
    }
  }

  function getPageUrl() {
    return typeof window !== "undefined"
      ? window.location.href
      : `https://researchflowafrica.com/showcase/${id}`
  }

  function getCitationText() {
    if (!entry) return ""
    const allAuthors = [
      getApaAuthorName(entry.author?.full_name),
      ...collaboratorProfiles.map((p) => getApaAuthorName(p.full_name)),
    ]
    const year = entry.published_at
      ? new Date(entry.published_at).getFullYear()
      : new Date().getFullYear()
    const url = getPageUrl()
    if (allAuthors.length > 1) {
      const lastAuthor = allAuthors.pop()!
      return `${allAuthors.join(", ")}, & ${lastAuthor}. (${year}). ${entry.title}. ResearchFlow Showcase. ${url}`
    }
    return `${allAuthors[0]}. (${year}). ${entry.title}. ResearchFlow Showcase. ${url}`
  }

  function getMlaCitation() {
    if (!entry) return ""
    const allAuthors = [
      entry.author?.full_name || 'Unknown Author',
      ...collaboratorProfiles.map(p => p.full_name || 'Unknown'),
    ]
    const year = entry.published_at ? new Date(entry.published_at).getFullYear() : new Date().getFullYear()
    const url = getPageUrl()
    const authorStr = allAuthors.length === 1
      ? allAuthors[0]
      : allAuthors.length === 2
        ? `${allAuthors[0]}, and ${allAuthors[1]}`
        : `${allAuthors[0]}, et al.`
    return `${authorStr}. "${entry.title}." ResearchFlow Showcase, ${year}, ${url}.`
  }

  function getHarvardCitation() {
    if (!entry) return ""
    const allAuthors = [
      getApaAuthorName(entry.author?.full_name),
      ...collaboratorProfiles.map(p => getApaAuthorName(p.full_name)),
    ]
    const year = entry.published_at ? new Date(entry.published_at).getFullYear() : new Date().getFullYear()
    const url = getPageUrl()
    const authorStr = allAuthors.length === 1
      ? allAuthors[0]
      : allAuthors.length === 2
        ? `${allAuthors[0]} and ${allAuthors[1]}`
        : `${allAuthors[0]} et al.`
    return `${authorStr} (${year}) '${entry.title}', ResearchFlow Showcase. Available at: ${url}`
  }

  function getActiveCitationText() {
    if (citationFormat === 'mla') return getMlaCitation()
    if (citationFormat === 'harvard') return getHarvardCitation()
    return getCitationText()
  }

  function copyCitation() {
    navigator.clipboard.writeText(getActiveCitationText()).then(() => {
      setCitationCopied(true)
      toast.success("Citation copied to clipboard!")
      setTimeout(() => setCitationCopied(false), 2000)
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(getPageUrl()).then(() => {
      setLinkCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  async function shareWhatsApp() {
    if (!entry) return
    const authorNames = [
      entry.author?.full_name || 'Unknown',
      ...collaboratorProfiles.map(p => p.full_name || ''),
    ].filter(Boolean).join(', ')
    const url = `https://researchflowafrica.com/showcase/${entry.id}`
    const text = encodeURIComponent(
      `🔬 *${entry.title}*\n\n` +
      `${entry.abstract?.slice(0, 200)}...\n\n` +
      `Research by: ${authorNames}\n` +
      `Published on ResearchFlow 🌍\n\n` +
      `Read the full research:\n${url}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')

    // Increment share count silently
    try {
      const supabase = createClient()
      const { data: newCount } = await supabase.rpc('increment_showcase_shares', { entry_id: id })
      setShareCount(typeof newCount === 'number' ? newCount : shareCount + 1)
    } catch {
      setShareCount(c => c + 1)
    }
  }

  function shareTwitter() {
    const text = encodeURIComponent(`${entry?.title}`)
    const url = encodeURIComponent(getPageUrl())
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
  }

  function shareLinkedIn() {
    const url = encodeURIComponent(getPageUrl())
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-4xl mx-auto" style={{ backgroundColor: '#05010F' }}>
        <ListPageSkeleton type="card" count={3} />
      </div>
    )
  }

  if (!entry) return null

  const teamMembers = [
    entry.author,
    ...collaboratorProfiles,
  ].filter(Boolean) as Profile[]

  const nonUuidCollaborators = entry.collaborators?.filter(
    (c: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)
  ) || []

  const statusColor = STATUS_COLORS[entry.status] || 'var(--muted-foreground)'
  const publishedYear = entry.published_at
    ? new Date(entry.published_at).getFullYear()
    : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(5,1,15,0.92)', borderBottom: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/showcase" className="flex items-center gap-2 text-sm" style={{ color: '#A855F7' }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Research Showcase</span>
          </Link>
          <span className="hidden sm:inline text-sm text-muted-foreground">/</span>
          <span className="hidden sm:inline text-sm truncate max-w-xs" style={{ color: '#C4B5D8' }}>{entry.title}</span>
        </div>
        {isLoggedIn ? (
          <Button size="sm" asChild style={{ background: 'var(--cta-bg)', border: 'none' }}>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button size="sm" asChild style={{ background: 'var(--cta-bg)', border: 'none' }}>
            <Link href="/auth/signup">Join ResearchFlow</Link>
          </Button>
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* HEADER SECTION */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}
            >
              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
            </Badge>
            <Badge variant="secondary" className="text-xs">{entry.research_area}</Badge>
            {entry.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-heading leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {entry.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {entry.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(entry.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {entry.views.toLocaleString()} views
            </span>
            {downloadCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                {downloadCount} downloads
              </span>
            )}
          </div>
        </div>

        <Separator style={{ borderColor: 'rgba(139,92,246,0.2)' }} />

        {/* TEAM SECTION */}
        {teamMembers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: '#A855F7' }} />
              Research Team
            </h2>
            <div className="flex flex-wrap gap-3">
              {teamMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="text-sm" style={{ background: 'var(--cta-bg)', color: '#F3F0FF' }}>
                      {member.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: '#F3F0FF' }}>{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[member.department, member.university_id].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
              {nonUuidCollaborators.map((name: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7' }}>
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F3F0FF' }}>{name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABSTRACT SECTION */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Abstract</h2>
          <div
            className="rounded-xl p-6 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5D8', lineHeight: '1.8', fontSize: '15px' }}
          >
            {entry.abstract}
          </div>
        </div>

        {/* PDF VIEWER SECTION */}
        {entry.document_url && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: '#A855F7' }} />
                Research Document
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(entry.document_url!, "_blank")}
                style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A855F7' }}
              >
                <Maximize2 className="h-4 w-4 mr-1.5" />
                View Full Screen
              </Button>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(139,92,246,0.2)', height: pdfFullscreen ? '90vh' : '620px' }}
            >
              <iframe
                src={`${entry.document_url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full"
                title="Research Document PDF Viewer"
                style={{ background: '#1a1625' }}
              />
            </div>
          </div>
        )}

        {/* TEXT CONTENT (if no PDF) */}
        {!entry.document_url && entry.content && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Research Output</h2>
            <div
              className="rounded-xl p-6 prose prose-invert max-w-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5D8', lineHeight: '1.8' }}
            >
              {entry.content.split('\n').map((line, i) => (
                <p key={i} className="mb-3">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* CITATION SECTION */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Cite This Research</h2>
          {/* Format tabs */}
          <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
            {(['apa', 'mla', 'harvard'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => { setCitationFormat(fmt); setCitationCopied(false) }}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: citationFormat === fmt ? 'rgba(124,58,237,0.3)' : 'transparent',
                  color: citationFormat === fmt ? '#C4B5FD' : 'var(--muted-foreground)',
                  border: citationFormat === fmt ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
                }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <div
            className="rounded-xl p-5 relative"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <p className="text-sm leading-relaxed pr-10" style={{ color: '#C4B5D8', fontFamily: 'monospace' }}>
              {getActiveCitationText()}
            </p>
            <button
              onClick={copyCitation}
              className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(139,92,246,0.15)', color: citationCopied ? '#22C55E' : '#A855F7' }}
              title="Copy citation"
            >
              {citationCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {citationFormat === 'apa' && 'APA 7th Edition Format'}
            {citationFormat === 'mla' && 'MLA 9th Edition Format'}
            {citationFormat === 'harvard' && 'Harvard Referencing Format'}
          </p>
        </div>

        {/* DOWNLOAD & SHARE SECTION */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5" style={{ color: '#A855F7' }} />
              Download & Share
            </h2>
            {isLoggedIn && entry && (
              <BookmarkButton contentType="showcase" contentId={entry.id} />
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {entry.document_url && (
              <Button
                onClick={handleDownload}
                style={{ background: 'var(--cta-bg)', border: 'none' }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); shareWhatsApp() }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-80"
              style={{ border: '1px solid rgba(37,211,102,0.4)', color: '#25D366', textDecoration: 'none' }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Share on WhatsApp
              {shareCount > 0 && <span className="ml-1 text-xs opacity-70">({shareCount})</span>}
            </a>
            <Button
              variant="outline"
              onClick={shareTwitter}
              style={{ border: '1px solid rgba(29,161,242,0.4)', color: '#1DA1F2' }}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={shareLinkedIn}
              style={{ border: '1px solid rgba(0,119,181,0.4)', color: '#0077B5' }}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={copyLink}
              style={{ border: '1px solid rgba(139,92,246,0.3)', color: linkCopied ? '#22C55E' : '#A855F7' }}
            >
              {linkCopied ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copy Link</>
              )}
            </Button>
          </div>
        </div>

        {/* RELATED RESEARCH SECTION */}
        {related.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Related Research</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Card
                  key={r.id}
                  className="transition-all hover:border-primary/50"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px' }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={r.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7' }}>
                          {r.author?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate text-muted-foreground">{r.author?.full_name}</span>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2" style={{ color: '#F3F0FF' }}>{r.title}</h3>
                    <p className="text-xs line-clamp-3 text-muted-foreground">{r.abstract}</p>
                    <Link href={`/showcase/${r.id}`}>
                      <Button size="sm" variant="ghost" className="w-full text-xs" style={{ color: '#A855F7' }}>
                        Read More →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* JOIN BANNER (non-logged-in) */}
        {!isLoggedIn && (
          <div
            className="rounded-2xl p-8 text-center space-y-4"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <Sparkles className="h-10 w-10 mx-auto" style={{ color: '#A855F7' }} />
            <h3 className="text-xl font-bold font-heading">Join ResearchFlow to Collaborate</h3>
            <p className="text-sm max-w-md mx-auto text-muted-foreground">
              Connect with African researchers, share your own research, and build your academic network.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                asChild
                style={{ background: 'var(--cta-bg)', border: 'none' }}
              >
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
              <Button variant="outline" asChild style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A855F7' }}>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
