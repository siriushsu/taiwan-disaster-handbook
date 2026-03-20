# Design System — Taiwan Family Emergency Handbook Generator

## Product Context
- **What this is:** A personalized disaster preparedness PDF generator for Taiwan families. Users input their address and household info, and receive a custom handbook with nearby shelters, medical facilities, and emergency procedures.
- **Who it's for:** Taiwan residents preparing their families for earthquakes, typhoons, and other emergencies. Bilingual (Traditional Chinese / English).
- **Space/industry:** Civic tech / emergency preparedness. Peers: Ready.gov (US), Tokyo Bousai (Japan), Taiwan gov.tw, g0v.tw.
- **Project type:** Web app — guided form flow producing a downloadable PDF artifact.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with intentional warmth
- **Decoration level:** Intentional — subtle background tints for section breaks, no gradients or patterns. Typography and color do the work.
- **Mood:** Trustworthy and competent like a well-designed government resource, but warmer and more human than typical civic sites. "Designed by someone who cares" not "designed by a committee."
- **Reference sites:** Ready.gov (layout clarity), UK GOV.UK (typography discipline), Taiwan gov.tw (teal palette), g0v.tw (Noto Sans TC), Tokyo Bousai (illustrated emergency guides)

## Typography
- **Display/Hero:** Noto Sans TC Bold (700) — the gold standard for Traditional Chinese web typography, used by g0v.tw. Harmonizes seamlessly with Latin text via the Noto Sans family.
- **Body:** Noto Sans TC Regular (400) at 17px — slightly larger than standard 16px because CJK characters have more strokes and benefit from breathing room. Line-height 1.75 for CJK text.
- **UI/Labels:** Noto Sans TC Medium (500) at 14px
- **Data/Tables:** Noto Sans TC Regular (400) with `font-variant-numeric: tabular-nums` for aligned numbers
- **Code:** JetBrains Mono (if needed)
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap`
- **Font stack:** `"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`
- **Scale:**
  - Hero: 36px / 700
  - H1: 28px / 700
  - H2: 22px / 700
  - H3: 18px / 700
  - Body: 17px / 400 (line-height 1.75)
  - UI label: 14px / 500
  - Caption: 13px / 400
  - Tiny: 12px / 400

## Color
- **Approach:** Restrained — teal primary + terracotta accent + warm neutrals
- **Primary:** `#0D7377` — teal, inspired by Taiwan gov.tw. Reads as both trustworthy (blue) and natural (green). Used for header, buttons, active states, links.
- **Primary Dark:** `#065A5C` — hover states
- **Primary Light:** `#E6F3F3` — focus rings, selected backgrounds, subtle highlights
- **Accent:** `#E8704A` — warm terracotta. CTAs, download buttons, elements that need attention without panic. Warmer and more sophisticated than pure orange.
- **Accent Dark:** `#D05A35` — accent hover state
- **Neutrals (warm):**
  - Background: `#FFFFFF` (primary surface)
  - Background subtle: `#F7F5F3` (alternating sections, page background)
  - Background muted: `#EFECE8` (disabled states, step indicators)
  - Border: `#E8E4E0`
  - Border dark: `#D4CFC9`
  - Text faint: `#9C9691` (placeholders, captions)
  - Text muted: `#6B6560` (secondary text, labels)
  - Text: `#2D2A26` (body text, headings)
- **Semantic:**
  - Success: `#1A8A5C` / bg `#E8F5EE`
  - Warning: `#D4940A` / bg `#FEF7E6`
  - Error: `#C93B3B` / bg `#FCEAEA`
  - Info: `#2B7AB5` / bg `#E8F0F8`
- **Dark mode strategy:** Invert surfaces (dark warm backgrounds), reduce primary saturation 15%, lighten text to warm off-white `#E8E4E0`. Keep accent terracotta as-is — it reads well on dark.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — civic tools need breathing room, not data density
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined — single-column form flow with clear step indicators
- **Grid:** Single column for form (max 640px), wider for results/map view (max 960px)
- **Max content width:** 640px (form), 960px (results/data)
- **Border radius:**
  - sm: 4px (badges, small elements)
  - md: 8px (buttons, inputs, alerts)
  - lg: 12px (cards, modal panels)
  - full: 9999px (pills, language toggle, step indicators)

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Used for:** step transitions, button hover/active feedback, focus rings, alert entrance. No decorative animation.

## Design Risks (deliberate departures from category baseline)
| Risk | Rationale | Tradeoff |
|------|-----------|----------|
| Teal primary instead of blue/green | Distinctive, says "Taiwan," avoids generic civic-tech look | Slightly less "official" than navy — acceptable for a civic tool vs. government site |
| Warm grays instead of cool grays | More human, paper-like feel for a family-oriented tool | Less "techy" — which is a feature for this audience |
| Terracotta accent instead of orange/red | Warmer, more sophisticated, less alarming | Less urgent — appropriate since the CTA is "generate handbook" not "evacuate now" |

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Initial design system created | Created by /design-consultation based on competitive research (Ready.gov, UK GOV.UK, Taiwan gov.tw, g0v.tw, Tokyo Bousai) and product context |
| 2026-03-20 | Noto Sans TC selected as primary typeface | Gold standard for Traditional Chinese web typography, used by g0v.tw, harmonizes with Latin via Noto Sans family |
| 2026-03-20 | Teal primary palette chosen | Inspired by Taiwan gov.tw — distinctive in the emergency preparedness space, reads as both trustworthy and natural |
| 2026-03-20 | Body text set to 17px with 1.75 line-height | CJK characters have more strokes than Latin; slightly larger size and generous line-height improve readability |
