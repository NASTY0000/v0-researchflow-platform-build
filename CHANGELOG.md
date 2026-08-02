# ResearchFlow, Engineering Changelog

A full record of every feature, fix, and improvement built on this platform.
Entries are ordered from most recent to earliest.

---

## Branded Icon System
**Commit:** `652f99c`

Replaced all generic OS emojis used as UI dimension icons with custom SVG components that share the ResearchFlow visual vocabulary, node clusters, branch patterns, connection arcs, convergence marks.

### New file: `components/icons/AkiliIcons.tsx`

Five purpose-built SVG icons, all using the brand purple/gold palette, clean at 16–28px:

| Component | Replaces | Design |
|---|---|---|
| `AkiliBolt` | ⚡ | Lightning bolt with outer glow ring and white center node |
| `KnowledgeIcon` | 📚 | Baobab branch, purple trunk, three diverging branches, gold discovery node at apex |
| `CollaborationIcon` | 🤝 | Two purple researcher nodes bridged by a gold arc; gold meeting point at arc apex |
| `MentorshipIcon` | 🎓 | Mother-node radial, large gold mentor at center, six purple satellite mentees on radial lines (Ubuntu in visual form) |
| `TechnicalIcon` | ⚙️ | Convergence mark, four bezier paths flowing from corner source nodes into a single gold center point |

### Updated: `components/akili/AkiliProgressCard.tsx`
- Card header `⚡` emoji → `<AkiliBolt size={22} />` (removed `text-xl` from wrapper)
- `dimConfig` icon type changed from `string` to `ReactNode`
- Dimension row span changed to `w-5 h-5 flex items-center justify-center` for correct SVG alignment

---

## Feature 7, Skeleton Loading Screens
**Commit:** `e7650fa`

Every full-page spinner replaced with contextual skeleton layouts that match the shape of the real content, giving users a structural preview while data loads.

### New file: `components/ui/SkeletonLayouts.tsx`

Shimmer-animated base block (`SkeletonBlock`, exported as `Skeleton`) plus five layout variants:

- **`IdeaCardSkeleton`**, matches the two-line header + three body lines + tag chips shape of idea cards
- **`MatchCardSkeleton`**, matches the avatar + name + progress bar + action buttons layout
- **`ResearcherCardSkeleton`**, matches the avatar + name + two-line bio + tag chips layout
- **`NotificationSkeleton`**, matches the icon + title + body + timestamp row
- **`ProfileHeaderSkeleton`**, matches the full banner → avatar overlap → name/bio block structure

### New file: `app/globals.css` addition
`@keyframes shimmer`, 200%-wide gradient that sweeps continuously left-to-right at 1.8s, used by all skeleton blocks.

### Pages updated
| Page | Before | After |
|---|---|---|
| Dashboard | Full-screen spinner | Stat grid + hero banner + action card skeletons |
| Idea Board | shadcn `animate-pulse` card grid | 6× `IdeaCardSkeleton` |
| Find Collaborators | Full-screen `BaobabLoader` | 6× `MatchCardSkeleton` |
| My Network | Full-screen spinner | 5× `ResearcherCardSkeleton` |
| Notifications | Full-screen spinner | 5× `NotificationSkeleton` |
| Profile | `animate-pulse` card with muted blocks | `ProfileHeaderSkeleton` + two content block skeletons |

---

## Feature 8, Pull to Refresh
**Commit:** `e7650fa`

Native-feeling pull-to-refresh on all main data pages. Tracks touch position, applies rubber-band resistance, fires the page's own async data function, then snaps back.

### New file: `hooks/usePullToRefresh.ts`
- Passive touch event listeners (no scroll interference)
- 72px threshold; pull distance scaled at 0.5× for rubber-band feel
- Accepts any `async () => void` refresh callback
- Returns `{ pullDistance, isRefreshing, isPulling, threshold }` for the indicator

### New file: `components/ui/PullToRefreshIndicator.tsx`
- Fixed top overlay that grows in height with `pullDistance`
- Idle: invisible
- Pulling: rotating arrow SVG, opacity and rotation both track `progress` (0→1)
- Refreshing: spinning arc SVG with purple stroke
- Background matches the dark card surface (`#0F0A1E`)

### Pages wired
Dashboard, Idea Board, Find Collaborators, My Network, Notifications.

Note: Dashboard and Notifications required extracting their inner `loadX()` functions from `useEffect` closures to `useCallback` hooks so they could be passed to `usePullToRefresh`.

---

## Feature 5, Ice-Breaker Messages & Collaboration Signals
**Commit:** `05ab076`

Three sub-features that reduce friction between "matched" and "actually collaborating."

### Ice-Breaker Suggestions, `lib/utils/icebreakers.ts`
`generateIcebreaker(currentUser, match)` inspects both profiles' `research_interests` arrays for shared topics. If overlap is found, it picks from three interest-specific opener templates. If no overlap, it falls back to three generic-but-warm templates. Returns a ready-to-send string.

**Messages page** (`app/(dashboard)/messages/page.tsx`):
- Fetches current user's full profile on load (new `currentUserProfile` state)
- When a conversation is opened with zero messages, a clickable purple chip appears above the compose textarea labelled "Ice-breaker suggestion (click to use)"
- Clicking fills the textarea with the generated message and removes the chip
- The chip disappears automatically once any message is sent

### "Interested in Collaborating" Button, `app/(dashboard)/matches/page.tsx`
- New button rendered below the Connect/View row on collaborator cards (not mentor cards)
- Clicking: inserts a row into `collaboration_interests` (from_user_id, to_user_id), sends a named notification to the matched researcher with a direct link to the current user's profile, shows a green confirmation toast, changes button to "✓ Interest sent" (disabled)
- State tracked in `collabInterestsSent: Set<string>` so the button stays locked for the session

### Emoji Reactions on Idea Cards, `app/(dashboard)/ideas/page.tsx`
- 🔥 💡 🤝 reaction buttons rendered on idea cards for non-authors
- Optimistic toggle: clicking immediately updates local `ideaReactions: Map<ideaId, Set<emoji>>` state, then persists to `idea_reactions` table (or removes row on second click)
- Reactions are loaded from the DB on page load alongside upvotes

---

## Feature 6, Notification Quality
**Commit:** `05ab076`

All in-app notification inserts updated to be specific, personal, and action-driving.

| Trigger | Before | After |
|---|---|---|
| Direct message | "New message / Someone sent you a message" | "Message from {Name} / "{first 60 chars of message content}…"" |
| Connection request | "New Connection Request / Someone wants to connect with you" | "{Name} wants to connect / {Name} sent you a connection request "{message snippet}". Accept or decline in your network." |
| Collaboration interest | *(new)* | "{Name} is interested in collaborating / {Name} flagged your profile as a potential collaboration match. Check their profile and say hi!" with link to sender's profile |

---

## Feature 4, Celebration Moments
**Commit:** `d5aac32`

Users receive a rich in-app toast the first time they hit any of six platform milestones. Each fires at most once (localStorage-gated).

### New file: `hooks/useMilestones.ts`
Queries `research_ideas` and `showcase_entries` for counts; reads `connections_count`, `akili_score`, bio completeness, and avatar URL from the profile row. Checks six milestones in priority order:

| Key | Condition |
|---|---|
| `first_idea` | At least 1 idea posted |
| `first_connection` | `connections_count >= 1` |
| `tier_scholar` | `akili_score >= 300` |
| `tier_fellow` | `akili_score >= 700` |
| `first_publish` | At least 1 published showcase entry |
| `profile_complete` | bio + university + interests + avatar all present |

Stores `rf_milestone_{key}` in localStorage to prevent repeat fires. Exposes `activeMilestone` and `clearMilestone()`.

### New file: `components/ui/MilestoneToast.tsx`
- Fixed bottom overlay (`bottom-24`), slides up on mount via `animate-in slide-in-from-bottom-4`
- Dark purple gradient background with amber border and shimmer line at top
- Auto-dismisses after 5 s (configurable `duration` prop); X button for manual close
- On mount, fires DOM-based confetti: 60 particles (mix of rect and circle), random sizes 4–12px, brand colour palette, animated with the Web Animations API, removed from DOM on finish, no library dependency

### Wired into
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/profile/page.tsx`

---

## Feature 3b, Akili Progress Engine
**Commit:** `d5aac32`

Replaces the static score display with a full progression system.

### New file: `lib/utils/akili-progress.ts`

**Tier ladder:**
| Tier | Score range |
|---|---|
| Emerging Researcher | 0–299 |
| Scholar Researcher | 300–699 |
| Research Fellow | 700–1 499 |
| Senior Researcher | 1 500–2 499 |
| Research Leader | 2 500+ |

Exports: `getCurrentTier(score)`, `getNextTier(score)`, `getPointsToNextTier(score)`, `getTopActions(dimensions, count)`.

`getTopActions` maps all 12 defined actions (3 per dimension) against the user's dimension scores, sorts by lowest-dimension-first, and returns the top N most-impactful actions to surface.

### New file: `components/akili/AkiliProgressCard.tsx`
Full-width card on the profile page:
- Score number + current tier name + "X pts to {next tier}"
- Gradient progress bar from current tier minimum to next tier minimum
- Four dimension bars (Knowledge / Collaboration / Mentorship / Technical), each up to 500 pts max, with distinct colours (purple / cyan / emerald / amber)
- "Earn points now" section: 3 contextual action links showing `+N pts`, sorted by where the user needs the most growth

Replaces the former static `AkiliScoreCard` on the profile page.

---

## Feature 3a, Getting Started Checklist
**Commit:** `d5aac32`

Shown to new users (joined < 7 days OR `akili_score < 100`), hidden once all items complete or dismissed.

### New file: `components/dashboard/GettingStartedChecklist.tsx`
Four checklist items (queried live from DB):
1. Complete your profile (bio filled)
2. Post your first research idea (`research_ideas` count ≥ 1)
3. Make your first connection (`connections` count ≥ 1)
4. Explore a mentor (checks `rf_hint_mentors` localStorage key)

Gradient progress bar tracks `completed / 4 * 100%`. When all four are done, shows a celebration message and auto-dismisses after 4 s, setting `rf_checklist_done` in localStorage.

---

## Feature 2, Contextual Onboarding Hints
**Commit:** `ef438c6`

One-time dismissable hints that explain each section to first-time visitors.

### New file: `components/ui/ContextualHint.tsx`
- Reads `localStorage.getItem('rf_{hintKey}')` on mount; renders nothing if already dismissed
- Dismissal writes `rf_{hintKey}` and hides with a fade-out transition
- Props: `hintKey`, `title`, `description`, `icon` (emoji string, default `💡`)
- Purple-tinted banner, X dismiss button

### Added to pages
| Page | Key | Message |
|---|---|---|
| Task Marketplace | `hint_marketplace` | How the marketplace works |
| Find Collaborators | `hint_collaborators` | How smart matching works |
| Challenges | `hint_challenges` | How to enter challenges |
| Grants | `hint_grants` | How grant discovery works |
| Mentors | `hint_mentors` | How mentor matching works |
| Showcase | `hint_showcase` | How to publish work |

---

## Feature 1: Meaningful Empty States
**Commit:** `ef438c6`

All generic "No items found" fallbacks replaced with context-aware messaging and actionable CTAs.

### New file: `components/ui/EmptyState.tsx`
Props: `icon` (ReactNode), `title`, `description`, `ctaLabel`, `ctaHref`, `ctaOnClick`, `secondaryLabel`, `secondaryHref`, `stat` (shows a green pulsing dot + live count).

### Pages updated
| Page | Context | CTA |
|---|---|---|
| Idea Board | Search/filter → no results OR empty board | "Post your first idea" / "Clear filters" |
| My Network | Empty connections | → `/matches` |
| Projects | No active projects | Create or browse ideas |
| Messages | No conversations | → Visit a profile |
| Saved | All-tab + per-type tabs | Context-specific save prompts |
| Notifications | All caught up | → Complete your profile |
| Marketplace | Filter → no results OR empty | "Post a task" |
| Find Collaborators | No matches | → Complete your profile |

---

## Profile Card Structure Fix
**Commit:** `304abb4`

Eliminated a visible gap at the card's top edge between the banner canvas and the card border in both light and dark mode.

**Root cause:** The shadcn `<Card>` component renders with `bg-card` as its background, which in dark mode is a non-black value. The canvas sat inside this card, leaving a sliver of card background visible at the top.

**Fix:** Replaced the outer `<Card>` wrapper with a plain `<div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-...">`. This makes the card a single compositing layer with no competing background colour. The banner `<div>` inside is set to `background: '#05010F'` to match the canvas exactly.

---

## Avatar Overlap Layout
**Commit:** `89c35f5` / `db05208`

The profile avatar now correctly straddles the banner/content boundary, top half in the banner, bottom half in the content area.

**Technique:** Avatar wrapper uses `-mt-12 z-20` (negative top margin pulls it 48px upward into the banner while remaining within the content div's stacking context). The outer wrapper's `overflow-hidden` clips the banner canvas corners while the avatar remains unclipped because it is positioned within the content div.

**Applied to:** `/profile` (own profile) and `/profile/[id]` (public profile view).

Avatar sizes: `w-24 h-24` on both pages. Border: `3px solid #7C3AED`. Box shadow: `0 0 0 5px rgba(124,58,237,0.2), 0 0 24px rgba(124,58,237,0.45)`.

---

## Constellation Star Label Clamping
**Commit:** `db05208`

Research interest labels on the constellation canvas background were overflowing the canvas edges on narrow screens.

**Fix** in `components/profile/ConstellationCanvas.tsx`:
```typescript
const textWidth = ctx.measureText(interest.name).width
const labelX = Math.min(
  Math.max(textWidth / 2 + 2, sx),
  W - textWidth / 2 - 2
)
```
Labels now stay fully within canvas bounds regardless of star position. Font size is also responsive: `8px` on viewports below 400px, `9px` above.

---

## Automatic Deployment
**Commit:** `2a19f6f`

All development happens directly on `main`. Every push automatically triggers a Vercel deployment.

- **`.github/workflows/deploy.yml`**, CI placeholder that confirms Vercel's GitHub integration is the deploy mechanism
- **`push.default = current`** configured globally so `git push` always targets the current branch by name
- Feature branches eliminated; no merge overhead

---

## Canvas Profile Backgrounds
**Earlier commits**

Two animated Canvas2D backgrounds for the profile banner, selectable per-user:

### `components/profile/BaobabCanvas.tsx`
Animated growing Baobab tree. Branches extend upward with recursive subdivision. Nodes pulse. Rendered server-side safe via `next/dynamic` with `ssr: false`.

### `components/profile/ConstellationCanvas.tsx`
Research interests rendered as a star constellation. Each interest is a labelled node; edges drawn between nearby stars. Stars pulse. Labels clamped within canvas bounds (see fix above).

### `components/profile/ProfileBackground.tsx`
Wrapper component that lazy-loads either canvas based on `profile.profile_background` value (`'baobab'` | `'constellation'` | `null`). Uses `next/dynamic` with `ssr: false` to prevent Vercel SSR crashes.

---

## Akili Score Badge
**`components/akili/AkiliScoreBadge.tsx`**

Compact inline badge for displaying a user's Akili score anywhere in the UI. Shows a `Zap` icon (lucide), the numeric score in monospace, and optionally the tier title. Two sizes: `sm` (default) and `md`. Used on match cards, profile headers, and the leaderboard.

---

## Profile Micro-Interactions
**Earlier commits**

- **Akili count-up animation**, score number increments from 0 to the actual value over ~1.2 s on profile load
- **Sparkle burst**, 12 SVG sparkle particles radiate from the avatar on load, fade out over 0.8 s
- **Stat fade-in**, stats section fades in with a 0.3 s delay after the profile header renders
- **`RippleButton` component**, `components/ui/RippleButton.tsx`: button that spawns a circular ripple at the click point using a DOM-appended span, removed after the animation completes

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| `next/dynamic` with `ssr: false` for all Canvas components | Canvas2D APIs are not available in Node.js; skipping SSR prevents Vercel build crashes |
| `localStorage` for milestone and hint state | No backend round-trip needed; state is per-device and user-scoped by nature |
| DOM-based confetti (no library) | Keeps bundle size zero-impact; 60 particles is well within browser performance budget |
| Passive touch listeners in `usePullToRefresh` | Avoids blocking the main thread during scroll; required for Chrome's intervention policy |
| Plain `<div>` wrapper on profile card (not shadcn `<Card>`) | Eliminates competing `bg-card` background that caused the banner gap |
| `useCallback` for page-level data fetchers | Required to pass stable function references to `usePullToRefresh` without infinite re-render loops |
| `SkeletonLayouts.tsx` name (not `Skeleton.tsx`) | Avoids case-collision with the existing shadcn `skeleton.tsx` on case-insensitive filesystems |
