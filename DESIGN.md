# ResearchFlow, Design System

## Theme

Dark-first. Forced via `defaultTheme="dark"` in `ThemeProvider`. The visual metaphor is deep space: ambient violet glow, near-black surfaces, luminous type. Light mode exists but is secondary, a professional lavender-white for users who prefer it.

A dark/light class toggle is injected synchronously in `<head>` (no flash on load). Theme preference is persisted to localStorage.

---

## Color

### Strategy
Committed dark palette: violet as identity, gold as achievement, deep-space backgrounds. The brand color saturates UI elements rather than sitting in the corner, active states, borders, glows, and CTAs all carry violet.

### CSS Custom Properties (dark / light)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--background` | `#05010F` | `#FAF8FF` | Page background |
| `--foreground` | `#F8F5FF` | `#0F051E` | Primary text |
| `--card` | `#12081F` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `#F8F5FF` | `#0F051E` | Text on cards |
| `--primary` | `#7C3AED` | `#6D28D9` | Brand violet, CTAs, active states, icons |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary bg |
| `--secondary` | `#1E0F32` | `#EDE9FE` | Tinted surface, alt cards |
| `--secondary-foreground` | `#D8B4FE` | `#4C1D95` | Text on secondary |
| `--muted` | `#1E0F32` | `#F3F0FF` | Muted backgrounds |
| `--muted-foreground` | `#9473B4` | `#503278` | Subdued text, labels |
| `--accent` | `#2D1446` | `#E9D5FF` | Hover states, subtle fills |
| `--accent-foreground` | `#D8B4FE` | `#4C1D95` | Text on accent bg |
| `--border` | `#371E50` | `#D1C4E9` | Default border |
| `--input` | `#371E50` | `#D1C4E9` | Form input borders |
| `--ring` | `#A78BFA` | `#6D28D9` | Focus rings |
| `--destructive` | `#EF4444` | `#DC2626` | Errors, destructive actions |
| `--radius` | `0.75rem` | `0.75rem` | Base border-radius |

### Extended tokens

| Token | Dark | Light | Role |
|---|---|---|---|
| `--glow` | `#C084FC` | `#A855F7` | Ambient glow effects |
| `--cyan` | `#06B6D4` | `#06B6D4` | Secondary accent (AI, data) |
| `--purple-soft` | `#7C3AED` | `#7C3AED` | Alias for brand violet |
| `--surface` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.03)` | Glassmorphism base layer |
| `--surface-hover` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` | Glassmorphism hover |
| `--border-bright` | `rgba(167,139,250,0.5)` | `rgba(109,40,217,0.5)` | Emphasis border (glowing) |
| `--banner` | `rgba(255,255,255,0.03)` | `#F3EBFF` | Promo/CTA card backgrounds |
| `--banner-foreground` | `#F8F5FF` | `#3B0764` | Text on banner |

### Sidebar tokens (dark)

```
--sidebar: #0A0318
--sidebar-foreground: #F8F5FF
--sidebar-primary: #7C3AED
--sidebar-accent: rgba(124,58,237,0.15)
--sidebar-border: #371E50
```

### Chart palette

`#6D28D9` → `#A855F7` → `#06B6D4` → `#C084FC` → `#818CF8`

### Brand-locked inline colors

Some values live outside the token system as inline styles. These are identity-critical and must not be changed:

- **Gold accent** (Akili/achievement): `#FBBF24` / `#EAB308`
- **Brand violet CTAs**: `linear-gradient(135deg, #7C3AED, #A855F7)`
- **Viewport theme-color**: `#7C3AED`
- **Toast background**: `#0B0117`
- **Sidebar wordmark**: "Research" white + "Flow" `#FBBF24`

### Body ambience (dark)

The body carries two radial gradient overlays creating a star-field glow:

```css
.dark body {
  background-image:
    radial-gradient(ellipse at 30% 40%, rgba(124,58,237,0.12), transparent 60%),
    radial-gradient(ellipse at 80% 10%, rgba(168,85,247,0.08), transparent 50%);
}
```

---

## Typography

| Role | Font | Weights | Variable |
|---|---|---|---|
| Body / UI | DM Sans | 400, 500 | `--font-sans`, `font-sans` |
| Headings / display | Syne | 700, 800 | `--font-heading`, `font-heading` |
| Code / mono | Geist Mono | default | `--font-mono`, `font-mono` |

Heading tag: use `className="font-heading"` on `h1`–`h3` level elements.

---

## Spacing & Radius

Base radius `0.75rem` (12px). shadcn scale:

| Token | Value |
|---|---|
| `--radius-sm` | `0.5rem` (8px) |
| `--radius-md` | `0.625rem` (10px) |
| `--radius-lg` | `0.75rem` (12px), default |
| `--radius-xl` | `1rem` (16px) |

Cards and panels typically use `rounded-2xl` (16px). Badges and pills use `rounded-full`.

---

## Gradients

| Name | Value | Usage |
|---|---|---|
| `gradient-primary` | `linear-gradient(135deg, #7C3AED, #A855F7)` | CTAs, filled buttons |
| `gradient-hero` | `linear-gradient(135deg, #1E0533, #050118)` | Full-bleed hero sections |
| `gradient-text` | `linear-gradient(135deg, #C084FC, #818CF8)` | Gradient headline text |
| `gradient-text-cyan` | `linear-gradient(135deg, #A855F7, #06B6D4)` | AI/discovery gradient text |

---

## Component Patterns

### Cards

**Standard card**
```
bg-card border border-border rounded-2xl
```

**Glassmorphism card** (used on dashboard panels)
```
background: rgba(255,255,255,0.03)
border: 1px solid rgba(139,92,246,0.15)
backdrop-filter: blur(12px)
border-radius: 1rem
```

**Hub card** (Collaborate / Discover / Community pages)
- Image header: `h-36` `<img>` with `object-cover`, dark gradient overlay
- Icon: bottom-left on image, `p-1.5 rounded-lg bg-black/30 backdrop-blur-sm`
- Body: `p-4` with title, description, CTA arrow
- Hover: `translate-y(-2px)` transition

**Featured entry card** (Showcase page)
- Gold top bar: `rgba(234,179,8,0.12)` bg, `#EAB308` text
- Gold border tint: `borderColor: 'rgba(234,179,8,0.35)'`

### Buttons

Primary CTA (filled):
```
style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
```

Ghost/outline: standard shadcn `variant="ghost"` or `variant="outline"`.

### Toasts (Sonner)

```
background: #0B0117
border: 1px solid rgba(124,58,237,0.25)
color: #F5F0E8
border-radius: 12px
font-size: 14px
position: bottom-center
```

Success: `border-green-500/30 bg-green-950/80`
Error: `border-red-500/30 bg-red-950/80`
Warning: `border-yellow-500/30 bg-yellow-950/80`

### Badges

Research area badge:
```
background: rgba(168,85,247,0.12)
color: #A855F7
border: 1px solid rgba(168,85,247,0.25)
```

Akili score badge (pill):
```
background: rgba(124,58,237,0.12)
border: 1px solid rgba(139,92,246,0.25)
```
Contains: Zap icon + score in `var(--primary)` + tier label in `muted-foreground`

Featured/Gold badge:
```
background: rgba(234,179,8,0.12)
color: #EAB308
border: 1px solid rgba(234,179,8,0.2)
```

### Navigation

**Sidebar** (`components/dashboard/sidebar.tsx`)
- `collapsible="icon"` mode, collapses to icon rail
- Header: Logo icon + "Research**Flow**" wordmark (white + gold `#FBBF24`)
- Groups: Core (Dashboard, My Feed, Messages) → Hub links (Collaborate, Discover, Community) → conditional Mentoring → conditional Admin
- Hub links: `ChevronRight` arrow + hover tooltip listing child pages; 150ms delay; `group/hub` named-group pattern
- Footer: avatar dropdown (Profile, Settings, Institution, Saved, Admin, Sign out)
- Overflow: `overflow-y-auto overflow-x-visible` on SidebarContent to allow hub tooltips beyond rail edge

**Mobile nav** (`components/dashboard/mobile-nav.tsx`)
- 5 tabs: Home, Ideas, Network, Alerts, Profile
- Realtime unread count badge on Alerts via Supabase subscription

**BackToHub** (`components/ui/back-to-hub.tsx`)
- Ghost button with `ArrowLeft` icon; arrow slides left on hover (`-translate-x-1`)
- Placed above page title on all hub child pages

### Global motion

All elements carry:
```css
transition: background-color 0.2s ease, border-color 0.2s ease, color 0.1s ease;
```

Cursor glow effect (`CursorGlow` component) follows mouse with ambient violet radial.

---

## Akili Score System

Gamification tiers by point threshold. Colors and labels:

| Tier | Label | Color |
|---|---|---|
| Rookie | Rookie | muted |
| Scholar | Scholar | primary violet |
| Luminary | Luminary | gold `#FBBF24` |
| Legend | Legend | gold + glow |

Score shown in sidebar footer, profile header, and leaderboard.

---

## Custom CSS Utilities

```css
.gradient-primary   /* violet-to-purple fill */
.gradient-hero      /* dark hero bg */
.gradient-text      /* purple-to-indigo clipped text */
.gradient-text-cyan /* purple-to-cyan clipped text */
```

Shimmer animation (`@keyframes shimmer`) used for loading skeleton states.

---

## Tailwind Config

Tailwind CSS v4, **no `tailwind.config.ts`**. CSS-first via `@theme inline` in `globals.css`. All token mappings (`--color-*`, `--font-*`, `--radius-*`) live there.

Custom dark variant:
```css
@custom-variant dark (&:is(.dark *));
```

Dark mode is class-based (`.dark` on `<html>`), not media-query-based.
