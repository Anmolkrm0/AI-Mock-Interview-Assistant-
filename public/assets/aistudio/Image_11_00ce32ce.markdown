---
name: InterviewMind System
colors:
  surface: '#f6faff'
  surface-dim: '#d6dae0'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4fa'
  surface-container: '#eaeef4'
  surface-container-high: '#e4e8ee'
  surface-container-highest: '#dee3e9'
  on-surface: '#171c20'
  on-surface-variant: '#414754'
  inverse-surface: '#2c3135'
  inverse-on-surface: '#edf1f7'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#732de4'
  on-tertiary: '#ffffff'
  tertiary-container: '#8d4efe'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f6faff'
  on-background: '#171c20'
  surface-variant: '#dee3e9'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a high-trust, low-anxiety environment tailored for high-stakes career preparation. It pairs the dependable structure of Google Material 3 with the polished, authoritative atmosphere of enterprise recruiting platforms and executive coaching tools.

### Brand Personality & Target Audience
- **Target Audience:** Job seekers, software engineers, product managers, and professionals undergoing high-intensity behavioral and technical interview preparation.
- **Tone & Demeanor:** Objective, encouraging, intelligent, and composed. The UI removes visual chaos to maximize mental clarity during live video simulations.
- **Emotional Response:** Competence, psychological safety, and focus. The user must feel assessed by an elite standard without feeling alienated or intimidated.

### Design Movement: Modern Corporate M3
This design system embraces an evolution of Material Design 3 (Material You) tuned for web-first productivity:
- **Tonal Layering:** Hierarchy is communicated through subtle surface luminosity steps rather than heavy contrast boundaries.
- **Intentional Geometric Accents:** Clean geometric typography in headings offsets utilitarian body text to sustain human warmth.
- **Adaptive Functional Accents:** AI activities (speech transcription, sentiment analysis, scoring) use concentrated, high-chroma semantic accents against clinical neutral backdrops.

## Colors

The color palette centers on trusted digital neutrals paired with deliberate diagnostic accents. 

### Role Mapping
- **Primary (`#1A73E8`):** Anchors primary calls-to-action, active stage selectors, primary focus rings, and baseline platform metrics.
- **Secondary (`#0D9488`):** Represents growth, steady pacing, verified answers, and quantitative readiness scores.
- **Tertiary (`#7C3AED`):** Dedicated to active AI processes, speech pattern detection, dynamic feedback prompts, and real-time transcription cues.
- **Neutral (`#5E6368`):** Governs structural body typography, disabled states, unselected tabs, and secondary metadata.

### Surface Tones & Containers
The canvas uses an M3 surface hierarchy constructed over warm slate tones:
- **Surface (`#FFFFFF`):** High-focus cards, inputs, interactive widgets.
- **Surface Dim (`#F8FAFC`):** Default application background canvas.
- **Surface Container Low (`#F1F5F9`):** Inactive panels, sidebars, question drawer modules.
- **Surface Container High (`#E2E8F0`):** Borders, dividers, subtle hover fills.

### Semantic Tones
- **Success (`#10B981`):** Metric passes, structured clarity, positive pacing.
- **Warning (`#F59E0B`):** Filler word frequency alerts, cadence warnings, pacing rushes.
- **Critical (`#E11D48`):** Behavioral misses, hard session stops, speech cut-offs.

## Typography

Typography balances geometric structure in headers with maximum legibility in body blocks.

### Font Family Roles
- **Headlines (`Plus Jakarta Sans`):** Used for platform metrics, mock stage headers, evaluation category titles, and question prompts. The contemporary geometric architecture imparts an approachable yet serious tone.
- **Body & Labels (`Inter`):** Selected for high micro-legibility in live speech transcripts, analytical breakdowns, telemetry counters, and UI control elements.

### Rules of Rhythm
- Display styles are reserved strictly for high-impact performance overview screens (e.g., overall score readouts).
- Live interview feeds constrain question display to `headline-md` on desktop and `title-lg` on mobile to prevent cognitive fatigue during speaking tasks.
- Numerical scores always pair `Plus Jakarta Sans` semi-bold weights with `Inter` uppercase `label-sm` unit descriptors.

## Layout & Spacing

The layout is structured around an M3 adaptive 12-column grid system optimized for split-screen real-time applications (video feed alongside transcript/rubric panels).

### Grid Foundation
- **Desktop (1024px+):** 12-column fluid grid, `2rem` outer margin, `1.5rem` column gutters. Live interview rooms divide into a 7:5 ratio (7 columns for primary video/audio feeds, 5 columns for question scripts and real-time AI notes).
- **Tablet (600px - 1023px):** 8-column grid with `1.5rem` margins and `1rem` gutters. Side panels convert into slide-over sheets.
- **Mobile (<600px):** 4-column grid with `1rem` margins and `0.75rem` gutters. Content stacks vertically; telemetry overlays toggle above the primary feed.

### Spacing Rules
- Component internal padding strictly follows the 4px base increment (`space-xs` through `space-xl`).
- High-stress interactive areas (e.g., audio controls, mic toggles, finish interview actions) maintain a mandatory minimum separation of `space-md` (`1rem`) to prevent mis-clicks.

## Elevation & Depth

This system avoids heavy drop shadows, instead using subtle surface tonal tiers combined with soft, directional ambient occlusion to express elevation.

### Surface Tiers
- **Tier 0 (Flat / Canvas):** `#F8FAFC`. Base layout canvas for dashboards and background workspaces.
- **Tier 1 (Resting Cards & Panes):** `#FFFFFF` paired with a 1px border (`#E2E8F0`). Zero shadow.
- **Tier 2 (Floating & Active Cards):** `#FFFFFF` with `0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)`. Used for active transcript prompts and hover states.
- **Tier 3 (Modals, Contextual Menus & Video Floating Controls):** `#FFFFFF` with `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)`.

### Border Discipline
All cards and container tiers maintain a subtle `1px solid #E2E8F0` hairline border to define edge boundaries independent of display color accuracy and viewing angles.

## Shapes

The design uses a Level 3 (Pill-shaped) curvature model. Full radii are leveraged across interactive elements to soften the high-pressure interview environment, while content frames retain structural clarity through balanced large corner curves.

### Curvature Assignments
- **Pills (`rounded-full` / 9999px):** Primary buttons, segmented evaluation toggles, audio visualizer capsules, tags, filter chips, and live timer badges.
- **Panels & Large Cards (`rounded-3xl` / `3rem`):** Outer platform overview shells, candidate video viewports, score summary displays.
- **Inner Containers (`rounded-2xl` / `2rem`):** Live transcript bubble cards, metric panels, category performance breakdowns.
- **Form Controls & Menus (`rounded-xl` / `1rem`):** Text areas, prompt selectors, and dropdown popovers.

## Components

### Buttons
- **Filled Primary:** Background `#1A73E8`, text `#FFFFFF`, full pill radius (`rounded-full`). On hover, background transitions to `#1557B0`. Elevation shifts from Tier 0 to Tier 2.
- **Tonal (Secondary Actions):** Background `#E8F0FE`, text `#1A73E8`, border `none`. Hover background transitions to `#D2E3FC`.
- **Destructive Pill (End Session):** Background `#FEE2E2`, text `#E11D48`, hover background `#FCD0D0`.
- **Sizing:** Standard touch targets sit at `44px` height with `1.25rem` horizontal padding.

### Chips & Badges
- **Status Chips:** Pill geometry (`rounded-full`), `space-xs` vertical padding, `space-sm` horizontal padding. Type size `label-sm`.
- **AI Active Badge:** Background `#F5F3FF`, border `1px solid #DDD6FE`, text `#7C3AED`, containing a pulsing 6px circle dot indicator.
- **Evaluation Filter Chips:** Unselected states feature a transparent body with a `1px solid #E2E8F0` border. Selected states use an `#E8F0FE` fill with a `#1A73E8` border and text.

### Segmented Rigor & Duration Controls
- Encased in a single `rounded-full` track with `#F1F5F9` background and `4px` interior inset padding.
- Selected option slides with an elevated `#FFFFFF` pill container supported by a Tier 1 shadow and `#1A73E8` bold text.
- Options include interview modes: "Standard Practice", "Target Bar", and "Stress Test".

### Cards & Media Frames
- **Video Feed Viewport:** Styled with `rounded-3xl` corners, an internal `#0F172A` deep matte slate canvas, and a hairline border (`#334155`). Controls float anchored to the bottom edge inside a frosted glass pill container (`background: rgba(15, 23, 42, 0.75)`, `backdrop-filter: blur(12px)`).
- **Metric Feedback Cards:** Resting on `#FFFFFF` surfaces with `rounded-2xl` radii. Scores feature clear gauge bars using semantic colors (Emerald for strengths, Amber for delivery rhythm, Rose for missed points).

### Inputs & Text Areas
- Built with a `#F8FAFC` background and a `1px solid #E2E8F0` boundary, shifting on focus to `#FFFFFF` background with a `2px solid #1A73E8` outline.
- Labels sit above inputs using `label-md` in `#5E6368`.

### Specialized AI Feedback Indicators
- **Audio Wave Visualizer:** Horizontal cluster of 5–9 vertical capsules (`width: 3px`, `radius: 9999px`) shifting dynamically between `8px` and `28px` in height using `#7C3AED`.
- **Live Transcript Drawer:** Uses `#F8FAFC` background with individual speaker cards styled in `#FFFFFF` with `rounded-xl` corners and `0.75rem` internal padding.