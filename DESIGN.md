# Motor Care Design System

## 1. Atmosphere & Identity

Motor Care is a calm, friendly maintenance dashboard: useful before decorative, reassuring without hiding uncertainty, and direct about the next action. Its signature is the motorcycle-colored accent applied to quiet blue-gray surfaces, with service health communicated through concise status rows rather than alarm-heavy decoration. The primary persona is an everyday rider checking the app quickly before or after a ride; secondary contexts include one-handed use, bright outdoor light, reduced motion, and limited mechanical knowledge.

## 2. Color

Colors are supplied through the React Native Paper theme in `src/theme/theme.ts`; components consume semantic `theme.colors` roles rather than raw values. The primary ramp is generated from the active motorcycle color by `src/theme/accent.ts` and must preserve WCAG contrast.

| Role | Token / source | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Accent | `primary` | Dynamic, fallback `#2563EB` | Dynamic, contrast-adjusted | Primary actions, active navigation, progress |
| Accent surface | `primaryContainer` | Dynamic pale tint | Dynamic deep tint | Icon wells, selected controls |
| Page | `background` | `#F4F6F9` | `#0D131D` | Screen background |
| Surface | `surface` | `#FFFFFF` | `#18212E` | Cards, sheets, bottom navigation |
| Surface muted | `surfaceVariant` | `#E9EEF5` | `#253142` | Tracks, secondary icon wells |
| Text | `onSurface` | `#172033` | `#F1F5F9` | Titles and body |
| Text muted | `onSurfaceVariant` | `#526077` | `#BAC5D4` | Metadata and hints |
| Border | `outlineVariant` | `#DFE5ED` | `#2C3A4D` | Card and divider edges |
| Status good | `status.good` | `#166534` | `#86EFAC` | Tracked schedule in range |
| Status soon | `status.soon` | `#854D0E` | `#FDE68A` | Near due |
| Status due | `status.due` | `#9A3412` | `#FDBA74` | Due now |
| Status overdue | `status.overdue` | `#991B1B` | `#FCA5A5` | Overdue |
| Status unknown | `onSurfaceVariant` | Theme value | Theme value | Missing baseline; never use success green |
| Scrim | `backdrop` | `rgba(4, 9, 18, 0.52)` | Same | Modal backdrop |

Rules:
- Accent is reserved for actions, selection, and measured progress.
- Missing maintenance history is neutral and action-oriented, never green or labelled safe.
- Error and overdue colors do not replace explanatory text.

## 3. Typography

React Native Paper's Material 3 system font is the only family. Numeric values use locale formatting and stable alignment within their row.

| Level | Paper variant | Size / line height | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display | `displaySmall` | 36 / 44 | 800 override | Odometer focal value |
| Page title | `headlineSmall` | 24 / 32 | 700 override | Screen title |
| Card title | `titleMedium` | 16 / 24 | 700 override | Cards and sections |
| Supporting title | `titleSmall` | 14 / 20 | 600-700 override | Compact summaries |
| Body | `bodyMedium` | 14 / 20 | 400 | Explanations |
| Metadata | `bodySmall` | 12 / 16 | 400 | Dates, kilometer values, sources |
| Action | `labelLarge` | 14 / 20 | 500-700 | Buttons and quick actions |
| Eyebrow | `labelSmall` / `labelMedium` | 11-12 / 16 | 600-700 | Short uppercase context labels |

Sentence case is the default. Uppercase is limited to short eyebrow labels with positive tracking. Indonesian copy must remain plain and specific.

## 4. Spacing & Layout

The base unit is **4px**. Existing visual values map to this scale.

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | 4 | Tight text separation |
| `space-2` | 8 | Metadata gaps, compact controls |
| `space-3` | 12 | Card rows and list gaps |
| `space-4` | 16 | Default card padding and control gaps |
| `space-5` | 20 | Page gutter and featured-card padding |
| `space-6` | 24 | Major card content and headings |
| `space-7` | 28 | Section heading offset |
| `space-8` | 32 | Major section separation |
| `space-12` | 48 | Screen bottom breathing room and control minimum |

- Scroll ownership belongs to `Screen`; sheets and detail forms own their nested scroll views.
- Page content is a single readable column, 20px mobile gutters, maximum width 640px, centered at tablet/desktop widths.
- Flexible rows wrap rather than forcing horizontal overflow.
- Touch targets are at least 44px; primary controls use 48px minimum height.
- Kilometer fields format digits with Indonesian thousand separators while typing and parse them back to integers at the form boundary.
- Corner radii: 8px status badges, 12px controls/icon wells, 16px compact surfaces, 20px cards, 24px sheet top corners.

## 5. Components

### Screen
- **Structure**: safe area -> animated content wrapper -> optional scroll view -> centered content column.
- **States**: scrolling or fixed; reduced motion removes entry translation.
- **Accessibility**: keyboard insets and handled taps remain enabled.

### Surface card
- **Structure**: semantic content inside a `surface` background, `outlineVariant` border, and shared card shadow.
- **Variants**: standard 16px inset, featured 20px inset, compact statistic.
- **States**: default and pressed opacity for interactive cards.
- **Accessibility**: interactive cards expose button role and a descriptive label.

### Motorcycle color picker
- **Structure**: named color choices wrap into a two-column list inside a shared surface card.
- **States**: selected color uses its swatch fill and a check glyph; all other options remain neutral.
- **Accessibility**: each choice announces its color and selection state, with at least 4.5:1 text contrast.

### Motorcycle profile photo
- **Structure**: 4:3 cropped preview with gallery, camera, and clear actions; profile and garage visuals use a square crop.
- **States**: empty, selected, selecting, permission denied, and unavailable in the web preview.
- **Storage**: image files stay in the app's document directory; persisted motorcycle data stores only the local file URI.
- **Accessibility**: actions have visible labels and the selected photo has an image label.

### Maintenance card
- **Structure**: maintenance identity -> status/summary -> zero, one, or two labelled progress tracks -> last-service metadata.
- **Variants**: tracked distance, tracked time, combined, and untracked baseline.
- **States**: good, soon, due, overdue, untracked. Untracked has no success badge or fabricated progress.
- **Accessibility**: non-interactive cards expose each track as a progressbar. Interactive cards announce status, progress, service baseline, and the detail action as one button to avoid nested widgets; visible labels keep every card understandable without color.
- **Schedule baseline**: create/edit and service logging accept a prior-service date for every maintenance type; prior odometer is optional and independently enables distance tracking.

### Oil focus section
- **Structure**: section heading -> engine-oil maintenance card -> primary log action and secondary interval action.
- **States**: tracked and untracked use the maintenance-card contract; absent rule provides a neutral route to add a schedule.
- **Accessibility**: actions name oil explicitly and route to the existing maintenance log and interval-edit flows.

### Bottom tabs and swipe canvas
- **Structure**: existing accessible bottom tabs remain the explicit control; the full tab-content canvas also accepts deliberate horizontal swipes.
- **States**: swipe left/right, first/last boundary, vertical-scroll rejection, input/keyboard suppression, reduced-motion route transition.
- **Accessibility**: no gesture-only destination; every route remains labelled and reachable through the bottom tab bar. Taps and vertical scrolling win unless horizontal intent crosses the threshold.
- **Interaction source**: adapted from beui.dev `tabs`: navigation state changes stay interruptible, the selected tab remains explicit, and reduced motion disables spatial route animation.

### Sheet
- **Structure**: modal scrim -> keyboard-avoiding overlay -> centered, bottom-anchored panel.
- **States**: opening, open, closing; reduced motion uses zero-duration state changes.
- **Accessibility**: modal view, escape dismissal, labelled close control, focusable contents.
- **Keyboard**: iOS uses padding avoidance; Android uses the activity's resize mode so the scrollable sheet and its actions remain above the keyboard without double-resizing.

## 6. Motion & Interaction

| Token | Duration | Usage |
| --- | --- | --- |
| `motion-press` | Immediate opacity feedback | Pressables |
| `motion-tab` | Router `shift` transition | Tab change |
| `motion-entry` | 260ms | Screen/card entry |
| `motion-sheet-open` | 300ms ease-out | Sheet entrance |
| `motion-sheet-close` | 220ms ease-in | Sheet exit |

- Horizontal navigation activates only after a deliberate 64px movement and fails when vertical travel exceeds 24px.
- Swipes move exactly one tab and never wrap at the first or last tab.
- The pan detector allows taps and vertical scrolling to win before horizontal activation; it is disabled while the keyboard is open so form editing is not interpreted as navigation. Portal dialogs and sheets sit outside the tab canvas.
- Spatial motion uses transforms; opacity is used for press feedback. Reduced-motion preference removes route and entrance movement.

## 7. Depth & Surface

Strategy: **mixed soft border plus restrained shadow**. Cards use a 1px `outlineVariant` edge and the shared `CARD_SHADOW` (`elevation: 2`, web shadow `0 4px 16px rgba(0,0,0,0.10)`). Hierarchy comes primarily from the page/surface tonal shift; shadow is limited to actionable or grouped surfaces. Tracks and icon wells use `surfaceVariant` without extra shadow.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- Target WCAG 2.2 AA: 4.5:1 body contrast, 3:1 large text and non-text controls.
- Status is always communicated with text, not color alone.
- Bottom tabs remain visible and operable; swiping is an enhancement, not the sole navigation method.
- Vertical scrolling, taps, controls, keyboard input, sheets, and dialogs take precedence over tab swipes.
- System reduced-motion preference is respected for screen, card, sheet, and tab transitions.
- Copy must not imply a schedule is healthy until a real completion date or odometer baseline exists.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
| --- | --- | --- | --- |
| Paper uses the platform system font | App-wide | Avoids adding a font dependency and preserves native rendering | Revisit only with a full brand/type project |
| Existing screens contain a few direct visual literals | Legacy UI | This task changes only oil and swipe surfaces; broad consolidation is out of scope | Consolidate when each legacy screen is next edited |
| No dedicated primitive showcase route | App-wide | Shared primitives already render across live screens; this change verifies them through the real app at 375/768/1280 | Add only if component development becomes independent of product screens |
