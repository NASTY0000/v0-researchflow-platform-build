"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { BackToHub } from "@/components/ui/back-to-hub"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/EmptyState"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import {
  ShoppingBag,
  Loader2,
  AlertTriangle,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  ChevronRight,
  Wrench,
  FileText,
  Send,
  ToggleLeft,
  ToggleRight,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns"
import { sendServiceEnquiry, respondToEnquiry } from "@/lib/actions/marketplace"
import { CreateListingModal } from "@/components/marketplace/create-listing-modal"
import { CreateRequestModal } from "@/components/marketplace/create-request-modal"
import { SendEnquiryModal } from "@/components/marketplace/send-enquiry-modal"
import type {
  ServiceCategory,
  ServiceListing,
  ServiceRequest,
  ServiceEnquiry,
} from "@/lib/types/marketplace"
import type { Profile } from "@/lib/types/database"

const PROHIBITED_USE_NOTICE =
  "ResearchFlow Marketplace is for legitimate research support services. " +
  "Do not offer or request the writing of thesis or dissertation content, " +
  "completion of assessed coursework, ghost authorship, or any work to be " +
  "presented as your own without acknowledgement. " +
  "Listings that breach this will be removed."

// ── deadline helpers ────────────────────────────────────────────────────────

function deadlineStatus(deadline: string | null): 'none' | 'expired' | 'urgent' | 'soon' | 'open' {
  if (!deadline) return 'none'
  const d = new Date(deadline)
  if (isPast(d)) return 'expired'
  const days = differenceInDays(d, new Date())
  if (days <= 3) return 'urgent'
  if (days <= 10) return 'soon'
  return 'open'
}

function deadlineColor(status: ReturnType<typeof deadlineStatus>): string {
  if (status === 'expired') return 'text-destructive'
  if (status === 'urgent') return 'text-destructive'
  if (status === 'soon') return 'text-orange-500'
  return 'text-muted-foreground'
}

// ── types ───────────────────────────────────────────────────────────────────

type ListingWithProvider = ServiceListing & { provider?: Profile; category?: ServiceCategory }
type RequestWithRequester = ServiceRequest & { requester?: Profile; category?: ServiceCategory }
type EnquiryFull = ServiceEnquiry & {
  sender?: Profile
  recipient?: Profile
  listing?: { id: string; title: string; provider_id: string } | null
  request?: { id: string; title: string; requester_id: string } | null
}

// ── sub-components ──────────────────────────────────────────────────────────

function ListingCard({
  listing,
  currentUserId,
  onEnquire,
  onEdit,
}: {
  listing: ListingWithProvider
  currentUserId: string | null
  onEnquire: (listing: ListingWithProvider) => void
  onEdit: (listing: ListingWithProvider) => void
}) {
  const isOwn = listing.provider_id === currentUserId
  const provider = listing.provider

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/profile/${listing.provider_id}`}>
              <Avatar className="h-8 w-8 shrink-0 hover:ring-2 hover:ring-primary/40 transition-all">
                <AvatarImage src={provider?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {provider?.full_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <Link href={`/profile/${listing.provider_id}`} className="text-sm font-medium hover:underline truncate block">
                {provider?.full_name ?? "Researcher"}
              </Link>
              {provider?.faculty && (
                <p className="text-xs text-muted-foreground truncate">{provider.faculty}</p>
              )}
            </div>
          </div>
          {listing.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">{listing.category.name}</Badge>
          )}
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>
        </div>

        {/* Tools */}
        {listing.tools && listing.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tools.slice(0, 4).map(t => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[11px]">
                <Wrench className="h-2.5 w-2.5 text-muted-foreground" />
                {t}
              </span>
            ))}
            {listing.tools.length > 4 && (
              <span className="text-[11px] text-muted-foreground">+{listing.tools.length - 4} more</span>
            )}
          </div>
        )}

        {/* Rate + turnaround */}
        {(listing.rate_note || listing.turnaround_note) && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {listing.rate_note && (
              <span>Rate: <span className="text-foreground">{listing.rate_note}</span>
                <span className="text-muted-foreground"> · Arranged privately</span>
              </span>
            )}
            {listing.turnaround_note && (
              <span>Turnaround: <span className="text-foreground">{listing.turnaround_note}</span></span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-1">
          {isOwn ? (
            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onEdit(listing)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit listing
            </Button>
          ) : (
            <Button size="sm" className="w-full gap-1.5" onClick={() => onEnquire(listing)}>
              <Send className="h-3.5 w-3.5" /> Send enquiry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RequestCard({
  request,
  currentUserId,
  onEnquire,
  onEdit,
}: {
  request: RequestWithRequester
  currentUserId: string | null
  onEnquire: (request: RequestWithRequester) => void
  onEdit: (request: RequestWithRequester) => void
}) {
  const isOwn = request.requester_id === currentUserId
  const requester = request.requester
  const dlStatus = deadlineStatus(request.deadline)
  const dlColor = deadlineColor(dlStatus)

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/profile/${request.requester_id}`}>
              <Avatar className="h-8 w-8 shrink-0 hover:ring-2 hover:ring-primary/40 transition-all">
                <AvatarImage src={requester?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {requester?.full_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <Link href={`/profile/${request.requester_id}`} className="text-sm font-medium hover:underline truncate block">
                {requester?.full_name ?? "Researcher"}
              </Link>
              {requester?.faculty && (
                <p className="text-xs text-muted-foreground truncate">{requester.faculty}</p>
              )}
            </div>
          </div>
          {request.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">{request.category.name}</Badge>
          )}
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{request.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
        </div>

        {/* Budget + deadline */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          {request.budget_note && (
            <span className="text-muted-foreground">
              Budget: <span className="text-foreground">{request.budget_note}</span>
              <span className="text-muted-foreground"> · Arranged privately</span>
            </span>
          )}
          {request.deadline && (
            <span className={`flex items-center gap-1 ${dlColor}`}>
              <Calendar className="h-3 w-3" />
              {dlStatus === 'expired' ? 'Deadline passed' : `Due ${formatDistanceToNow(new Date(request.deadline), { addSuffix: true })}`}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="pt-1">
          {isOwn ? (
            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onEdit(request)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit request
            </Button>
          ) : (
            <Button size="sm" className="w-full gap-1.5" onClick={() => onEnquire(request)}>
              <MessageSquare className="h-3.5 w-3.5" /> Send enquiry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AgreementsPrompt({ otherUserId, otherName }: { otherUserId: string; otherName: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 mt-2">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        Recording what was agreed protects both of you.{" "}
        {isFeatureEnabled('agreements') ? <Link href="/agreements" className="text-primary underline underline-offset-2">Create an agreement</Link> : 'Create an agreement'}{" "}
        covering scope, timeline, and how this contribution will be acknowledged.
        You can also{" "}
        <Link href={`/messages?user=${otherUserId}`} className="text-primary underline underline-offset-2">
          message {otherName} directly
        </Link>.
      </p>
    </div>
  )
}

// ── main page ───────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "my" ? "my" : "listings"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Categories
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Listings tab
  const [listings, setListings] = useState<ListingWithProvider[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)

  // Requests tab
  const [requests, setRequests] = useState<RequestWithRequester[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  // My activity tab
  const [myListings, setMyListings] = useState<ServiceListing[]>([])
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([])
  const [enquiriesReceived, setEnquiriesReceived] = useState<EnquiryFull[]>([])
  const [enquiriesSent, setEnquiriesSent] = useState<EnquiryFull[]>([])
  const [myLoading, setMyLoading] = useState(false)
  const myLoadedRef = useRef(false)

  // User projects (for CreateRequestModal)
  const [userProjects, setUserProjects] = useState<{ id: string; title: string }[]>([])

  // Modals
  const [showListingModal, setShowListingModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [editListing, setEditListing] = useState<ServiceListing | null>(null)
  const [editRequest, setEditRequest] = useState<ServiceRequest | null>(null)
  const [enquireTarget, setEnquireTarget] = useState<
    { type: 'listing'; item: ListingWithProvider } | { type: 'request'; item: RequestWithRequester } | null
  >(null)

  // Responding
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
        supabase
          .from('projects')
          .select('id, title')
          .eq('status', 'active')
          .then(({ data: teams }) => {
            // get projects where user is team member
            supabase
              .from('team_members')
              .select('team_id')
              .eq('user_id', user.id)
              .then(({ data: memberships }) => {
                const teamIds = (memberships ?? []).map((m: { team_id: string }) => m.team_id)
                if (teamIds.length > 0) {
                  supabase
                    .from('projects')
                    .select('id, title')
                    .in('team_id', teamIds)
                    .then(({ data }) => setUserProjects(data ?? []))
                }
              })
          })
      }
    })

    supabase
      .from('service_categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // ── load listings ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'listings') return
    setListingsLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('service_listings')
      .select(`*, provider:profiles!service_listings_provider_id_fkey(id, full_name, avatar_url, faculty), category:service_categories!service_listings_category_id_fkey(id, name, slug, icon)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (selectedCategory) q = q.eq('category_id', selectedCategory)
    q.limit(60).then(({ data }) => {
      setListings((data ?? []) as ListingWithProvider[])
      setListingsLoading(false)
    })
  }, [activeTab, selectedCategory])

  // ── load requests ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'requests') return
    setRequestsLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('service_requests')
      .select(`*, requester:profiles!service_requests_requester_id_fkey(id, full_name, avatar_url, faculty), category:service_categories!service_requests_category_id_fkey(id, name, slug, icon)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (selectedCategory) q = q.eq('category_id', selectedCategory)
    q.limit(60).then(({ data }) => {
      setRequests((data ?? []) as RequestWithRequester[])
      setRequestsLoading(false)
    })
  }, [activeTab, selectedCategory])

  // ── load my activity ──────────────────────────────────────────────────────

  const loadMyActivity = useCallback(async () => {
    if (!currentUserId) return
    setMyLoading(true)
    const supabase = createClient()

    const [
      { data: ml },
      { data: mr },
      { data: er },
      { data: es },
    ] = await Promise.all([
      supabase.from('service_listings').select('*').eq('provider_id', currentUserId).order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*').eq('requester_id', currentUserId).order('created_at', { ascending: false }),
      supabase
        .from('service_enquiries')
        .select(`*, sender:profiles!service_enquiries_sender_id_fkey(id, full_name, avatar_url), listing:service_listings(id, title, provider_id), request:service_requests(id, title, requester_id)`)
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false }),
      supabase
        .from('service_enquiries')
        .select(`*, recipient:profiles!service_enquiries_recipient_id_fkey(id, full_name, avatar_url), listing:service_listings(id, title, provider_id), request:service_requests(id, title, requester_id)`)
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false }),
    ])

    setMyListings(ml ?? [])
    setMyRequests(mr ?? [])
    setEnquiriesReceived((er ?? []) as EnquiryFull[])
    setEnquiriesSent((es ?? []) as EnquiryFull[])
    setMyLoading(false)
  }, [currentUserId])

  useEffect(() => {
    if (activeTab === 'my' && !myLoadedRef.current && currentUserId) {
      myLoadedRef.current = true
      loadMyActivity()
    }
  }, [activeTab, currentUserId, loadMyActivity])

  // ── handlers ──────────────────────────────────────────────────────────────

  async function handleEnquiryConfirm(message: string): Promise<string | null> {
    if (!enquireTarget) return 'No target selected.'
    const args = enquireTarget.type === 'listing'
      ? { listingId: enquireTarget.item.id, message }
      : { requestId: enquireTarget.item.id, message }
    const result = await sendServiceEnquiry(args)
    if ('error' in result && result.error) return result.error
    toast.success(`Enquiry sent!`)
    setEnquireTarget(null)
    return null
  }

  async function handleRespond(enquiryId: string, action: 'accepted' | 'declined') {
    setRespondingId(enquiryId)
    const result = await respondToEnquiry(enquiryId, action)
    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success(action === 'accepted' ? 'Enquiry accepted.' : 'Enquiry declined.')
      setEnquiriesReceived(prev =>
        prev.map(e => e.id === enquiryId ? { ...e, status: action } : e)
      )
    }
    setRespondingId(null)
  }

  async function toggleListingStatus(listing: ServiceListing) {
    setTogglingId(listing.id)
    const next = listing.status === 'active' ? 'inactive' : 'active'
    const supabase = createClient()
    const { error } = await supabase
      .from('service_listings')
      .update({ status: next })
      .eq('id', listing.id)
      .eq('provider_id', currentUserId ?? '')
    if (error) { toast.error(error.message); }
    else {
      setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: next } : l))
      toast.success(next === 'active' ? 'Listing activated.' : 'Listing deactivated.')
    }
    setTogglingId(null)
  }

  async function toggleRequestStatus(request: ServiceRequest) {
    setTogglingId(request.id)
    const next = request.status === 'open' ? 'closed' : 'open'
    const supabase = createClient()
    const { error } = await supabase
      .from('service_requests')
      .update({ status: next })
      .eq('id', request.id)
      .eq('requester_id', currentUserId ?? '')
    if (error) { toast.error(error.message); }
    else {
      setMyRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: next } : r))
      toast.success(next === 'open' ? 'Request reopened.' : 'Request closed.')
    }
    setTogglingId(null)
  }

  function onListingSuccess() {
    setShowListingModal(false)
    setEditListing(null)
    myLoadedRef.current = false
    if (activeTab === 'my') {
      myLoadedRef.current = true
      loadMyActivity()
    }
    if (activeTab === 'listings') {
      setListingsLoading(true)
      const supabase = createClient()
      supabase
        .from('service_listings')
        .select(`*, provider:profiles!service_listings_provider_id_fkey(id, full_name, avatar_url, faculty), category:service_categories!service_listings_category_id_fkey(id, name, slug, icon)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60)
        .then(({ data }) => { setListings((data ?? []) as ListingWithProvider[]); setListingsLoading(false) })
    }
    toast.success(editListing ? 'Listing updated.' : 'Listing posted!')
  }

  function onRequestSuccess() {
    setShowRequestModal(false)
    setEditRequest(null)
    myLoadedRef.current = false
    if (activeTab === 'my') {
      myLoadedRef.current = true
      loadMyActivity()
    }
    if (activeTab === 'requests') {
      setRequestsLoading(true)
      const supabase = createClient()
      supabase
        .from('service_requests')
        .select(`*, requester:profiles!service_requests_requester_id_fkey(id, full_name, avatar_url, faculty), category:service_categories!service_requests_category_id_fkey(id, name, slug, icon)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(60)
        .then(({ data }) => { setRequests((data ?? []) as RequestWithRequester[]); setRequestsLoading(false) })
    }
    toast.success(editRequest ? 'Request updated.' : 'Request posted!')
  }

  // ── category chips ────────────────────────────────────────────────────────

  const CategoryChips = () => (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !selectedCategory
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
        }`}
      >
        All
      </button>
      {categories.map(c => (
        <button
          key={c.id}
          onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selectedCategory === c.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  )

  // ── enquiry status badge ──────────────────────────────────────────────────

  function EnquiryStatusBadge({ status }: { status: 'pending' | 'accepted' | 'declined' }) {
    if (status === 'pending') return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    if (status === 'accepted') return <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Accepted</Badge>
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Declined</Badge>
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <BackToHub href="/community" label="Back to Community" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Research Services
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect with researchers offering or requesting research support services.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditListing(null); setShowListingModal(true) }}>
            <Plus className="h-3.5 w-3.5" /> Offer a service
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditRequest(null); setShowRequestModal(true) }}>
            <Plus className="h-3.5 w-3.5" /> Post a request
          </Button>
        </div>
      </div>

      {/* Integrity notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{PROHIBITED_USE_NOTICE}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); if (v !== 'my') myLoadedRef.current = false }}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="listings">Offering services</TabsTrigger>
          <TabsTrigger value="requests">Requesting help</TabsTrigger>
          <TabsTrigger value="my">My activity</TabsTrigger>
        </TabsList>

        {/* ── Listings tab ── */}
        <TabsContent value="listings" className="space-y-4 mt-4">
          <CategoryChips />
          {listingsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-24 bg-muted rounded" /></CardContent></Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon="🛠️"
              title="No services listed yet"
              description="Be the first to offer a research support service."
              ctaLabel="Offer a service"
              ctaOnClick={() => { setEditListing(null); setShowListingModal(true) }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  currentUserId={currentUserId}
                  onEnquire={item => setEnquireTarget({ type: 'listing', item })}
                  onEdit={item => { setEditListing(item); setShowListingModal(true) }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Requests tab ── */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          <CategoryChips />
          {requestsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-24 bg-muted rounded" /></CardContent></Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No service requests yet"
              description="Post what your research project needs and let providers come to you."
              ctaLabel="Post a request"
              ctaOnClick={() => { setEditRequest(null); setShowRequestModal(true) }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map(r => (
                <RequestCard
                  key={r.id}
                  request={r}
                  currentUserId={currentUserId}
                  onEnquire={item => setEnquireTarget({ type: 'request', item })}
                  onEdit={item => { setEditRequest(item); setShowRequestModal(true) }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── My activity tab ── */}
        <TabsContent value="my" className="space-y-6 mt-4">
          {myLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* My listings */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">My listings</h2>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditListing(null); setShowListingModal(true) }}>
                    <Plus className="h-3.5 w-3.5" /> New listing
                  </Button>
                </div>
                {myListings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven&apos;t posted any service listings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myListings.map(l => (
                      <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{l.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={l.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {l.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={togglingId === l.id}
                            onClick={() => toggleListingStatus(l)}
                            title={l.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === l.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : l.status === 'active'
                                ? <ToggleRight className="h-4 w-4 text-primary" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            }
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditListing(l); setShowListingModal(true) }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* My requests */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">My requests</h2>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditRequest(null); setShowRequestModal(true) }}>
                    <Plus className="h-3.5 w-3.5" /> New request
                  </Button>
                </div>
                {myRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven&apos;t posted any service requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myRequests.map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={r.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {r.status === 'open' ? 'Open' : 'Closed'}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={togglingId === r.id}
                            onClick={() => toggleRequestStatus(r)}
                            title={r.status === 'open' ? 'Close request' : 'Reopen request'}
                          >
                            {togglingId === r.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : r.status === 'open'
                                ? <ToggleRight className="h-4 w-4 text-primary" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            }
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRequest(r); setShowRequestModal(true) }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Enquiries received */}
              <section className="space-y-3">
                <h2 className="font-semibold">Enquiries received</h2>
                {enquiriesReceived.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No enquiries received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {enquiriesReceived.map(e => {
                      const contextTitle = e.listing?.title ?? e.request?.title ?? 'your listing'
                      const senderName = e.sender?.full_name ?? 'Researcher'
                      const senderId = e.sender_id
                      return (
                        <div key={e.id} className="rounded-lg border border-border p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link href={`/profile/${senderId}`}>
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarImage src={e.sender?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="min-w-0">
                                <Link href={`/profile/${senderId}`} className="text-sm font-medium hover:underline">{senderName}</Link>
                                <p className="text-xs text-muted-foreground truncate">re: {contextTitle}</p>
                              </div>
                            </div>
                            <EnquiryStatusBadge status={e.status} />
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3 pl-9">{e.message}</p>

                          {e.status === 'accepted' && (
                            <AgreementsPrompt otherUserId={senderId} otherName={senderName} />
                          )}

                          {e.status === 'pending' && (
                            <div className="flex gap-2 pt-1 pl-9">
                              <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={respondingId === e.id}
                                onClick={() => handleRespond(e.id, 'accepted')}
                              >
                                {respondingId === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-destructive hover:text-destructive"
                                disabled={respondingId === e.id}
                                onClick={() => handleRespond(e.id, 'declined')}
                              >
                                <XCircle className="h-3 w-3" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Enquiries sent */}
              <section className="space-y-3">
                <h2 className="font-semibold">Enquiries sent</h2>
                {enquiriesSent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven&apos;t sent any enquiries yet.</p>
                ) : (
                  <div className="space-y-3">
                    {enquiriesSent.map(e => {
                      const contextTitle = e.listing?.title ?? e.request?.title ?? 'a listing'
                      const recipientName = e.recipient?.full_name ?? 'Researcher'
                      const recipientId = e.recipient_id
                      return (
                        <div key={e.id} className="rounded-lg border border-border p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link href={`/profile/${recipientId}`}>
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarImage src={e.recipient?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{recipientName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="min-w-0">
                                <Link href={`/profile/${recipientId}`} className="text-sm font-medium hover:underline">{recipientName}</Link>
                                <p className="text-xs text-muted-foreground truncate">re: {contextTitle}</p>
                              </div>
                            </div>
                            <EnquiryStatusBadge status={e.status} />
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3 pl-9">{e.message}</p>

                          {e.status === 'accepted' && (
                            <AgreementsPrompt otherUserId={recipientId} otherName={recipientName} />
                          )}

                          {e.status === 'accepted' && (
                            <div className="pl-9 pt-1">
                              <Link href={`/messages?user=${recipientId}`}>
                                <Button size="sm" variant="outline" className="gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Message {recipientName}
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SendEnquiryModal
        open={!!enquireTarget}
        targetTitle={
          enquireTarget?.type === 'listing'
            ? enquireTarget.item.title
            : enquireTarget?.item.title ?? ''
        }
        onConfirm={handleEnquiryConfirm}
        onCancel={() => setEnquireTarget(null)}
      />

      <CreateListingModal
        open={showListingModal}
        categories={categories}
        editListing={editListing}
        onSuccess={onListingSuccess}
        onCancel={() => { setShowListingModal(false); setEditListing(null) }}
      />

      <CreateRequestModal
        open={showRequestModal}
        categories={categories}
        userProjects={userProjects}
        editRequest={editRequest}
        onSuccess={onRequestSuccess}
        onCancel={() => { setShowRequestModal(false); setEditRequest(null) }}
      />
    </div>
  )
}
