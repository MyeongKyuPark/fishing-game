# Design System — Tidehaven (타이드헤이븐)

> Source of truth for all visual and UI decisions. Read before making any design change.
> Created by /design-consultation from existing codebase (2026-03-22).

---

## Product Context

- **What this is:** A Korean-language multiplayer fishing RPG with mining, cooking, crafting, guild systems, and NPC story arcs. Healing sandbox with light progression.
- **Who it's for:** Korean-speaking casual/RPG players who enjoy the feeling of a quiet seaside town — fishing, chatting, leveling up at their own pace.
- **Space/industry:** Browser-based casual MMO / cozy game (Stardew Valley, Animal Crossing tonal peers)
- **Project type:** Fullscreen web app (React + HTML5 Canvas), mobile-aware

---

## Aesthetic Direction

- **Direction:** Night Harbor — the feeling of a fishing village at 2am. Warm golden lantern light against deep ocean darkness. Calm, but alive.
- **Decoration level:** Intentional — emoji serve as functional icons throughout. Subtle glows on active fishing/mining states. Glassmorphism panels float above the canvas world.
- **Mood:** The UI should feel like a wooden dock notice board — readable by lantern-light, with a warmth that contrasts the cold deep ocean behind it. Never cold, never clinical.
- **Anti-patterns to avoid:** No purple gradients. No generic card grids. No "gaming" orange/neon. No Bootstrap defaults. The design language is warm, maritime, and Korean.

---

## Color

- **Approach:** Balanced — two accent families (warm gold + cool blue) against a near-black ocean base.

### Base / Surfaces
| Role | Token | Hex | Notes |
|------|-------|-----|-------|
| Root background | `--bg-root` | `#1a1a2e` | Main canvas surround |
| Panel background | `--bg-panel` | `#16162a` | Solid modal panels |
| Panel deep | `--bg-deep` | `#0a1a2e` | Admin panel, deep contexts |
| Login gradient start | — | `#0d2a4a` | Login radial gradient |
| Login gradient end | — | `#07111f` | Login radial gradient |
| Glass panel (light) | — | `rgba(255,255,255,0.05)` | Translucent room rows |
| Glass panel (medium) | — | `rgba(255,255,255,0.07)` | Translucent game panels |
| Chat background | — | `rgba(8,8,18,0.94)` | Chat sidebar |

### Gold Family (warm, titles, highlights)
| Role | Token | Hex |
|------|-------|-----|
| Harbor Gold (titles, HUD, panel headers) | `--gold-primary` | `#e8d888` |
| Gold muted (money, shop) | `--gold-secondary` | `#e0d070` |
| Gold bright (auction highlights) | `--gold-bright` | `#ffd700` |
| Amber (mining active, mine chat) | `--amber` | `#ffbb44` |

### Ocean Blue Family (cool, interactive, system)
| Role | Token | Hex |
|------|-------|-----|
| Sky blue (user names, accents) | `--blue-light` | `#aaddff` |
| Ocean blue (stats, XP, season pass) | `--blue-mid` | `#88ccff` |
| Chat user color | — | `#88bbff` |
| Interactive blue (buttons) | `--blue-action` | `#2a6aaa` |
| Interactive blue dark | — | `#1a4a7a` |
| Focus ring | — | `rgba(100,180,255,0.6)` |
| Fishing active | `--fishing-glow` | `#66ccff` |
| Section label text | `--text-label` | `#6688aa` |

### Semantic
| Role | Token | Hex |
|------|-------|-----|
| Catch / success / green | `--success` | `#77ee77` (chat), `#44ff88` (buttons) |
| Error / damage | `--error` | `#ff7070` |
| Error intense | — | `#ff6666` |
| Overlay backdrop | — | `rgba(0,0,0,0.6)` |

### Text Hierarchy
| Role | Hex |
|------|-----|
| Primary (white) | `#ffffff` |
| Secondary | `#e0e0ff` |
| Tertiary | `rgba(255,255,255,0.5)` |
| Muted | `rgba(255,255,255,0.3–0.4)` |
| Ghost | `rgba(255,255,255,0.2)` |

---

## Typography

- **Primary font:** `'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif`
  - Rationale: Korean-first. Noto Sans KR covers all Hangul glyphs cleanly at any size. 'Malgun Gothic' as Windows fallback. Never substitute with Roboto/Inter (wrong cultural register).
- **Story / NPC dialogue font:** `'Noto Serif KR', 'Batang', serif` *(recommended addition — not yet in codebase)*
  - Rationale: NPC story moments deserve a warmer typographic register. Serif KR signals "this is a narrative moment, not a UI event." Apply to `.story-text`, dialogue boxes, chapter title cards.
- **Loading strategy:** Google Fonts CDN for Noto Sans KR (preconnect + font-display: swap)

### Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero | 28px | 800 | Login title |
| Panel header | 15px | 700 | `.panel-head` titles |
| Body | 13px | 400–600 | Default game text |
| Small | 12px | 400–700 | Chat messages, labels |
| Micro | 11px | 700 | Section titles (uppercase, letter-spacing 0.5px) |
| Caption | 10–11px | 400 | Timestamps, hints |

---

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable (a healing game — never cramped)
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 12px (section padding vertical)
  - base: 18px (section padding horizontal, `.section`)
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

---

## Layout

- **Approach:** Hybrid — strict panel grid for UI overlays, free canvas for the game world
- **Panel structure:** Overlay modals float centered, max-width varies by purpose
  - Narrow (info/confirm): 360px
  - Standard (shop/inventory): 500px
  - Wide (auction house, leaderboard): 600–700px
- **Max content width:** 95vw (responsive) with fixed panel widths
- **Grid:** Chat sidebar 290px fixed, canvas area flex-1

### Border Radius Scale (hierarchical — this matters)
| Level | Value | Usage |
|-------|-------|-------|
| xs | 4–6px | Badges, tags, small buttons, close button |
| sm | 7–8px | HUD chips, shortcut buttons, scrollbar thumbs |
| md | 10px | Form inputs, list rows, room cards |
| lg | 12px | Main `.panel` modals |
| xl | 20px | Login box |
| full | 9999px | Avatar circles, pill badges |

---

## Motion

- **Approach:** Minimal-functional — motion aids comprehension, never decorates
- **Easing:** enter `ease-out` / exit `ease-in` / state change `ease-in-out`
- **Duration:**
  - micro: 100ms (hover color changes)
  - short: 150ms (button transforms, border-color focus)
  - medium: 200ms (panel transitions, progress bars — `transition: width 0.4s`)
  - long: 400ms (progress bars, width animations)
- **Named animations:**
  - `blink` (1.4s ease-in-out infinite): active fishing/mining HUD state
  - `biteFlash` (alternating box-shadow): fishing bite indicator
  - Hover transform: `translateY(-1px)` on primary buttons

---

## Component Patterns

### Panel (`.panel` + `.panel-head` + `.section`)
The core UI primitive. Everything important happens in a panel.
```
┌─────────────────────────────────────┐
│ 🎣 Panel Title              ✕      │  ← .panel-head: gold title, close btn
├─────────────────────────────────────┤
│ SECTION LABEL                       │  ← .section-title: uppercase, #6688aa
│ Content row...                      │
│ Content row...                      │
├─────────────────────────────────────┤
│ Another section...                  │
└─────────────────────────────────────┘
```

### Tab Bar (Auction House pattern)
```
[탭1] [탭2] [탭3]
─────────────────
content
```
Active tab: `rgba(255,255,255,0.15)` background, `#88ccff` text, bottom border `#88ccff`.

### HUD Chip
Dark glass (`rgba(0,0,0,0.65)`) + gold text + 7px radius. Blink animation when active.

### Primary Button
Gradient `#2a6aaa → #1a4a7a`, hover `translateY(-1px)` + slight opacity reduction.

### Ghost / Action Button (in-panel)
`rgba(255,255,255,0.08)` background, colored text (gold, green, blue depending on action), hover darkens or tints toward action color.

---

## Glassmorphism Rules

Used for overlay panels on top of the game canvas:
- Background: `rgba(255,255,255,0.05–0.07)` OR `#16162a` for solid contexts
- Border: `1px solid rgba(255,255,255,0.10–0.18)`
- Backdrop filter: `blur(3–8px)` (overlay uses 3px, login uses 8px)
- Box shadow: `0 24px 60px rgba(0,0,0,0.5)` for elevated elements

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial DESIGN.md created | Formalized from existing codebase by /design-consultation |
| 2026-03-22 | Noto Serif KR added for story moments | NPC dialogue deserves warmer typographic register than UI sans-serif |
| 2026-03-22 | Border radius is hierarchical (6→20px) | Reflects element importance — chips are small/crisp, major panels are softer |
| 2026-03-22 | Gold (#e8d888) reserved for titles/key info | Warm gold is the "lantern light" — overuse kills the warmth signal |
