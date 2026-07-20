# ResearchFlow

## Tagline
Collaborate. Discover. Publish.

## Description
ResearchFlow is a research collaboration platform for African university students and academics. It enables researchers to connect with peers, find mentors, discover funding, share ideas, and bring research projects to life through structured tools for collaboration, community, and discovery.

## Platform
web

## Register
product

## Audience
African university students, postgraduate researchers, academics, and research mentors across the continent. Users open the app in study rooms, libraries, on mobile between lectures. The context is focused, curious, ambitious — not casual.

## Core Features
- **Research ideas**: create, share, browse, and get matched on research ideas
- **Projects**: team workspaces with kanban boards, roadmaps, file sharing, and team chat
- **Collaboration matching**: AI-powered peer matching by research interest, skills, and goals
- **Mentor directory**: connect with verified research mentors by tier
- **Grants & funding**: curated funding opportunities for African researchers
- **Journals & conferences**: publication venues relevant to each user's research
- **AI Research Assistant**: Claude-powered chat assistant for research guidance
- **Community**: forums, peer review, challenges, showcase, leaderboard, marketplace
- **Akili Score**: gamification system (points, tiers: Rookie → Scholar → Luminary → Legend) rewarding research activity
- **Notifications**: realtime alerts
- **Hub-and-Spoke navigation**: three hubs (Collaborate, Discover, Community) as category landing pages with card grids

## Navigation Structure
- **Sidebar** (desktop): Core (Dashboard, My Feed, Messages), Explore (Collaborate hub, Discover hub, Community hub), conditional Mentor Dashboard, avatar dropdown (Profile, Settings, Institution, Saved, Admin, Sign out)
- **Mobile bottom nav**: Home, Explore (sheet picker for 3 hubs), Alerts, Profile

## Tech Stack
- Next.js (App Router, TypeScript)
- shadcn/ui (new-york style) + Radix UI primitives
- Tailwind CSS v4 (no config file; CSS-first config via `@theme inline` in globals.css)
- Framer Motion
- Supabase (auth, postgres, realtime, storage)
- Anthropic SDK (Claude AI assistant)
- Sonner (toasts), lucide-react (icons), date-fns
- DM Sans (body) + Syne (headings) — loaded via next/font

## Design Intent
Dark by default (forced via `defaultTheme="dark"`). The theme is focused and ambient — a workspace for serious research, not a social feed. Violet as the primary identity color signals intellectual authority without feeling corporate. Gold accent communicates achievement and premium status (Akili tiers).
