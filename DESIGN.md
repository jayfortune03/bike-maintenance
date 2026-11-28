# Motor Care Design System

## 0. Revamp inputs & decisions

- Existing local architecture stays intact: Expo Router, React Native Paper, MaterialCommunityIcons, Zustand, dynamic motorcycle accent, and the current garage store/service flows. Optional account access and explicit local-to-account import sit beside that store and never replace or mutate it.
- UI/UX Pro Max queries run: `motorcycle maintenance dashboard clean lightweight Indonesian` and the narrower `personal motorcycle care off-white ink teal` design-system query, plus `responsive maintenance dashboard accessibility touch targets --stack react-native`. Adopted: minimal/Swiss hierarchy, semantic Pressables, visible states, reduced motion, responsive reflow, and 48px targets. Rejected: new web fonts, marketing-page sections, dark-only/OLED direction, decorative charts, and extra red/green brand accents.
- StyleGallery pattern: [`main-with-rail`](https://github.com/changeroa/StyleGallery/blob/main/patterns/split-sidebar/main-with-rail.md) for the wide dashboard. The primary task remains first in reading order, the rail reflows below it, and `Screen` remains the only page scroll owner.
- Visual direction: warm workshop paper rather than cold dashboard chrome. Off-white canvas, near-black green ink, quiet mineral surfaces, and one accent: the active motorcycle color with restrained teal fallback.
- Primary persona: an everyday Indonesian rider checking the next maintenance action in under a minute. Situational constraints include one-handed use, outdoor glare, limited mechanical knowledge, large text, and reduced motion.

## 1. Atmosphere & Identity

Motor Care is a calm maintenance companion: useful before decorative, reassuring without hiding uncertainty, and direct about the next action. Its signature is a warm paper-like canvas, ink-forward typography, softly grouped surfaces, and the active motorcycle accent used only where action or selection needs it. The dashboard opens with the rider's motorcycle and oil priority, not generic metrics. Service health stays explicit in Indonesian text rather than relying on alarm-heavy decoration.

## 2. Color

Colors are supplied through the React Native Paper theme in `src/theme/theme.ts`; components consume semantic `theme.colors` roles rather than raw values. The primary ramp is generated from the active motorcycle color by `src/theme/accent.ts` and must preserve WCAG contrast.

| Role | Token / source | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Accent | `primary` | Dynamic, fallback `#0F766E` | Dynamic, contrast-adjusted | Primary actions, active navigation, progress |
| Accent surface | `primaryContainer` | Dynamic pale tint | Dynamic deep tint | Icon wells, selected controls |
| Page | `background` | `#F5F3EE` | `#101614` | Screen background |
| Surface | `surface` | `#FFFDF8` | `#18201D` | Cards, sheets, bottom navigation |
| Surface muted | `surfaceVariant` | `#ECE9E1` | `#25302C` | Tracks, secondary icon wells, selected neutral rows |
| Text | `onSurface` | `#18201F` | `#F4F3ED` | Titles and body |
| Text muted | `onSurfaceVariant` | `#596561` | `#B9C2BE` | Metadata and hints |
| Border strong | `outline` | `#74807B` | `#84918C` | Controls that need visible boundaries |
| Border subtle | `outlineVariant` | `#DCD8CE` | `#33403B` | Card and divider edges |
| Status good | `status.good` | `#166534` | `#86EFAC` | Tracked schedule in range |
| Status soon | `status.soon` | `#7C4A03` | `#FDE68A` | Near due |
| Status due | `status.due` | `#9A3412` | `#FDBA74` | Due now and primary next action |
| Status overdue | `status.overdue` | `#991B1B` | `#FCA5A5` | Overdue |
| Status unknown | `onSurfaceVariant` | Theme value | Theme value | Missing baseline; never use success green |
| Scrim | `backdrop` | `rgba(4, 9, 18, 0.52)` | Same | Modal backdrop |

Rules:
- Accent is reserved for actions, selection, and measured progress.
- Teal is the fallback identity, not a second accent when a motorcycle color is active.
- Selected rows use tonal fill plus a check glyph, never a colored outline.
- Missing maintenance history is neutral and action-oriented, never green or labelled safe.
- Error and overdue colors do not replace explanatory text.

## 3. Typography

React Native Paper's Material 3 system font is the only family; no font dependency is added. Hierarchy comes from size, weight, line height, and whitespace. Numeric values use Indonesian locale formatting and stable alignment within their row.

| Level | Paper variant | Size / line height | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display | `displaySmall` | 40 / 48 | 700 override | Odometer focal value |
| Page title | `headlineSmall` | 28 / 36 | 700 override | Screen title |
| Card title | `titleMedium` | 17 / 24 | 700 override | Cards and sections |
| Supporting title | `titleSmall` | 14 / 20 | 600-700 override | Compact summaries |
| Body | `bodyMedium` | 15 / 22 | 400 | Explanations |
| Metadata | `bodySmall` | 12 / 16 | 400 | Dates, kilometer values, sources |
| Action | `labelLarge` | 14 / 20 | 600 | Buttons and quick actions |
| Eyebrow | `labelSmall` / `labelMedium` | 11-12 / 16 | 600-700 | Short uppercase context labels |

Sentence case is the default. Uppercase is limited to short eyebrow labels with positive tracking. Indonesian copy must remain plain and specific.

## 4. Spacing & Layout

The base unit is **4px**. Shared values live in `src/theme/theme.ts` as `SPACING`, `RADII`, and `LAYOUT`; screen styles compose those constants rather than creating a second styling system.

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | 4 | Tight text separation |
| `space-2` | 8 | Metadata gaps, compact controls |
| `space-3` | 12 | Card rows and list gaps |
| `space-4` | 16 | Default card padding and control gaps |
| `space-5` | 20 | Compact page gutter and featured-card padding |
| `space-6` | 24 | Major card content and headings |
| `space-7` | 28 | Section heading offset |
| `space-8` | 32 | Wide page gutter and major section separation |
| `space-12` | 48 | Screen bottom breathing room and control minimum |

- Scroll ownership belongs to `Screen`; sheets and fixed detail forms own their explicitly bounded nested scroll views.
- At 375px, content is one column with 20px gutters. At 768px, gutters become 32px and related summary groups may become two columns. At 1280px, content stops at 1120px and dashboard sections use a dominant main column plus a narrower rail.
- Reading and focus order never changes when a visual group reflows. The main task stays before supplemental data in source order.
- Flexible rows wrap rather than forcing horizontal overflow.
- Every interactive target is at least 48px high and wide, or uses `hitSlop` to reach that area.
- Kilometer fields format digits with Indonesian thousand separators while typing and parse them back to integers at the form boundary.
- Corner radii: 10px status badges, 14px controls/icon wells, 18px compact surfaces, 24px cards, 28px featured surfaces and sheet top corners.

## 5. Components

### Screen
- **Structure**: safe area -> animated content wrapper -> optional scroll view -> responsive centered content column.
- **States**: scrolling or fixed; reduced motion removes entry translation.
- **Accessibility**: keyboard insets and handled taps remain enabled.

### Screen header
- **Structure**: 48px semantic icon well -> title and one-line purpose statement.
- **States**: wraps safely at large text sizes; no decorative action is placed in the title row.
- **Usage**: shared by dashboard, garage, maintenance, and settings to create a stable entry point.

### Surface card
- **Structure**: semantic content inside a `surface` background with a subtle `outlineVariant` edge. The shared shadow is restrained and limited to grouped or actionable surfaces.
- **Variants**: standard 16px inset, featured 20-24px inset, compact statistic, and tonal selected state.
- **States**: default and pressed opacity for interactive cards.
- **Accessibility**: interactive cards expose button role and a descriptive label.

### Motorcycle card
- **Active state**: the whole card uses `primaryContainer`; title, supporting copy, and the persistent check treatment use `onPrimaryContainer` without a colored state border or geometry change.
- **Inactive state**: the standard `surface` and neutral ink roles remain unchanged.

### Section title
- **Structure**: sentence-case heading with optional short supporting copy or real action.
- **Rule**: an action label is never rendered as inert text; actions use a 48px semantic control.

### Empty state
- **Structure**: context icon -> direct Indonesian title -> one useful explanation -> optional primary action.
- **Variants**: garage, maintenance, reminder, activity, and filter-result icons.
- **Copy**: explains what will appear and the next available step; no generic error or celebratory language.

### Motorcycle color picker
- **Structure**: named color choices wrap into a two-column list inside a shared surface card.
- **States**: selected color uses its swatch fill and a check glyph; all other options remain neutral.
- **Accessibility**: each choice announces its color and selection state, with at least 4.5:1 text contrast.

### Motorcycle profile photo
- **Structure**: 4:3 cropped preview with gallery, camera, and clear actions; profile and garage visuals use a square crop.
- **States**: empty, selected, selecting, permission denied, and unavailable in the web preview.
- **Storage**: image files stay in the app's document directory; persisted motorcycle data stores only the local file URI.
- **Accessibility**: actions have visible labels and the selected photo has an image label.

### Sport motorcycle preview
- **Structure**: collaborator-owned `SportMotorcyclePreview` with `color: string`, shown on Home only when `motorcycle.type === 'sport'`.
- **Label**: visible copy says the object is an illustrative generic 3D motorcycle, not an exact branded model.
- **Behavior**: local low-poly faces load on demand at a three-quarter angle and move only through explicit rotate controls; the preview never replaces the motorcycle selector, photo, or any maintenance action.

### Maintenance card
- **Structure**: maintenance identity -> status/summary -> zero, one, or two labelled progress tracks -> last-service metadata.
- **Variants**: tracked distance, tracked time, combined, and untracked baseline.
- **States**: good, soon, due, overdue, untracked. Due and overdue use a subtle whole-surface status wash plus matching icon, summary, and status text; their edge stays `outlineVariant`. Untracked stays neutral with no success badge or fabricated progress.
- **Accessibility**: non-interactive cards expose each track as a progressbar. Interactive cards announce status, progress, service baseline, and the detail action as one button to avoid nested widgets; visible labels keep every card understandable without color.
- **Schedule baseline**: create/edit and service logging accept a prior-service date for every maintenance type; prior odometer is optional and independently enables distance tracking.

### Oil focus section
- **Structure**: priority heading -> engine-oil maintenance card -> primary log action -> collaborator-owned `OilReminderControl` with `ruleId: string` -> secondary interval action.
- **States**: tracked and untracked use the maintenance-card contract; absent rule provides a neutral route to add a schedule.
- **Accessibility**: actions name oil explicitly and route to the existing maintenance log and interval-edit flows. Reminder controls stay next to the oil context, not in app settings.

### Tab screen composition
- **Home**: motorcycle selector -> oil priority -> optional sport preview -> odometer and quick context -> attention -> recent activity. On wide layouts, odometer/context becomes the rail without changing reading order.
- **Garage**: collection summary -> responsive motorcycle grid -> persistent add action. Empty state explains why adding a motorcycle unlocks the app.
- **Maintenance**: active motorcycle summary -> accessible filter controls -> schedules -> reminders. Empty results name the selected category and offer the relevant next step.
- **Settings**: appearance, notifications/privacy, and destructive data action are separate groups. Notification status remains readable and links to device settings; reset remains confirmation-gated.

### Bottom tabs and swipe canvas
- **Structure**: headless Expo Router `Tabs` keep all four descriptor-owned pages mounted once in an absolute swipe canvas; each page translates by `(index - position) * width`. The accessible bottom tab list remains the explicit control.
- **States**: finger-tracked neighbor peek, cancelled snap-back, one-tab commit, first/last boundary, vertical-scroll rejection, input/keyboard suppression, tab-press interruption, orientation resize, and reduced-motion direct settle.
- **Accessibility**: no gesture-only destination; every route remains labelled and reachable through the bottom tab bar. Only the committed page accepts pointers or native accessibility focus; inactive web pages are `aria-hidden` and inert. Taps and vertical scrolling win unless horizontal intent crosses the recognition threshold.
- **Interaction source**: adapted from beui.dev `tabs`: navigation state changes stay interruptible, the selected tab remains explicit, and reduced motion disables spatial route animation.

### Sheet
- **Structure**: modal scrim -> keyboard-avoiding overlay -> centered, bottom-anchored panel.
- **States**: opening, open, closing; reduced motion uses zero-duration state changes.
- **Accessibility**: modal view, escape dismissal, labelled close control, focusable contents.
- **Keyboard**: iOS uses padding avoidance; Android uses the activity's resize mode so the scrollable sheet and its actions remain above the keyboard without double-resizing.

### Account and local import
- **Structure**: settings entry -> account route -> signed-out authentication form or signed-in compact account summary -> two large submenu entries for `Garasi bersama` and `Salin dari Garasi`. The focused submenu is selected by the deep-linkable `panel` route parameter and returns to the account overview through an explicit 48px back action. `Screen` remains the only page scroll owner.
- **Mounting**: shared-garage and local-import panels are mutually exclusive and mount only while their submenu is open. Their focus/app-state fetch effects therefore do not run from the account overview.
- **Navigation pattern**: the overview uses StyleGallery's [`step-nav`](https://github.com/changeroa/StyleGallery/blob/main/patterns/stacking/step-nav.md) as a semantic vertical action stack with no nested scroll owner. Each entry is one accessible button with a 48px icon well, title, concise explanation, and trailing chevron.
- **Account identity**: the active email is exposed in full to accessibility services but truncates in the middle on narrow visual layouts so long addresses never force horizontal overflow.
- **Authentication states**: restoring, unavailable, signed out, submitting, and signed in. Email and password keep visible labels, allow paste/password managers, retain inline errors, and never block the local app while signed out.
- **Import confirmation**: every upload attempt opens one confirmation that names the destination email, explains exactly which fields leave the device, states that the local garage is unchanged, and offers `Nanti` beside the upload action.
- **Import states**: ready, invalid local item, importing, imported, failed, and already imported for this account. Successful local IDs are remembered per account; retry submits failed items only and never repeats a recorded success.
- **Copy**: the required disclosure is explicit: only the selected motorcycle name and current odometer are uploaded; maintenance history, reminders, photos, and other local data remain on the device.
- **Security**: native refresh credentials use platform secure storage and access credentials stay in memory. Web preview credentials stay in memory only and disappear on reload.

### Shared garage and reports
- **Structure**: account status -> pending invitations -> shared motorcycle list -> authenticated motorcycle detail -> newest condition reports. `Screen` is the only page scroll owner; condition entry uses the existing bounded `Sheet`.
- **Separation**: shared motorcycles always come from the authenticated `GET /motorcycles` response and stay in component memory. They never enter the local Zustand garage, change the active local motorcycle, or trigger a private-garage upload.
- **Invitation states**: loading, empty, pending, accepting, accepted, and failed. Each invitation names the motorcycle and keeps a 48px acceptance action beside explanatory copy.
- **Shared motorcycle cards**: use the standard surface recipe, motorcycle name, odometer, and current member role. The card is one accessible button; ownership is communicated with text and icon, not color alone.
- **Detail states**: authorizing, loading, ready, unavailable, and unauthorized. Detail access first re-fetches the current account motorcycle list; report history is requested only after the selected motorcycle is present.
- **Report history**: newest reports appear first with author, localized timestamp, odometer, fuel bars out of six, and optional note. A report opened from a notification uses `primaryContainer` plus a visible “Dari notifikasi” label, never a colored border.
- **Condition entry**: odometer is a localized integer field, fuel is a seven-option radio group from 0-6, and note is a labelled multiline field. Inline errors are announced; saving disables repeated submission and refreshes remote history without mutating local garage data.
- **Owner invitation**: `GET /motorcycles` returns exactly the authenticated account's membership role; the email form is shown only when that role is `OWNER`. Success and failure are announced next to the form.
- **Refresh**: invitation/list screens and detail history refresh on focus and when the app returns to the foreground. User actions that change remote data refresh only the relevant remote surface.
- **Notification entry**: foreground, background-tap, and cold-start payloads carry only `motorcycleId` and `reportId`. Navigation waits for session restoration, re-fetches `GET /motorcycles` for the current account, and discards unauthorized or stale-account results before opening the highlighted report.

## 6. Motion & Interaction

| Token | Duration | Usage |
| --- | --- | --- |
| `motion-press` | Immediate opacity feedback | Pressables |
| `motion-tab` | Interruptible spring: stiffness 260, damping 24, mass 0.85, no overshoot | Tab snap after release or tab press |
| `motion-entry` | 260ms | Screen/card entry |
| `motion-sheet-open` | 300ms ease-out | Sheet entrance |
| `motion-sheet-close` | 220ms ease-in | Sheet exit |

- Horizontal tracking activates after 10px and fails when vertical travel wins at 12px, so a 25-50px drag visibly reveals the real neighboring page before release.
- A release commits at the smaller of 18% page width or 64px, or at 500px/s horizontal velocity after recognition. Short slow drags snap back; commits move exactly one tab and never wrap.
- The pan detector allows taps and vertical scrolling to win before horizontal activation; it is disabled while the keyboard is open so form editing is not interpreted as navigation. Portal dialogs and sheets sit outside the tab canvas.
- During tracking and settling, one pointerless `expo-blur` overlay at intensity 8 is clipped to the revealed incoming edge and clears completely at rest; it never covers the tab bar. Android uses SDK 54's `dimezisBlurView` method rather than an opacity imitation.
- Spatial motion uses transforms; opacity and Paper ripple provide press feedback without changing layout bounds. Reduced-motion preference keeps direct finger control but removes settling motion and blur, and also removes route, entrance, sheet, and any sport-preview movement.
- No decorative auto-rotation, pulsing status, or ambient animation. The interface is useful in its final static state.

## 7. Depth & Surface

Strategy: **warm tonal layering plus restrained depth**. Cards use a 1px `outlineVariant` edge and shared `CARD_SHADOW` (`elevation: 1`, web shadow `0 8px 24px rgba(31,41,37,0.08)`). Hierarchy comes primarily from page/surface tonal shift and spacing; shadow is limited to actionable or grouped surfaces. Tracks and icon wells use `surfaceVariant` without shadow. Selected state is a tonal wash plus glyph, never an accent border.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- Target WCAG 2.2 AA: 4.5:1 body contrast, 3:1 large text and non-text controls.
- Test light and dark themes independently; dynamic motorcycle accents are contrast-adjusted before becoming Paper roles.
- Controls retain 48px targets, clear labels, and visible selected/checked state at large text sizes.
- Status is always communicated with text, not color alone.
- Bottom tabs remain visible and operable; swiping is an enhancement, not the sole navigation method.
- Vertical scrolling, taps, controls, keyboard input, sheets, and dialogs take precedence over tab swipes.
- System reduced-motion preference is respected for screen, card, sheet, and tab transitions.
- Copy must not imply a schedule is healthy until a real completion date or odometer baseline exists.
- Indonesian copy uses short active sentences, avoids jargon where a plain term exists, and never claims a generic 3D preview is an exact motorcycle model.
- Account access remains optional for the local app. Import requires explicit confirmation, visibly names the destination account, preserves local records, and reports each invalid or failed motorcycle without hiding successful items.
- Shared invitations, reports, and push registration require a signed-in account; denial or session expiry never blocks the private offline garage.
- Remote notification payload IDs are navigation hints only. Current-session API authorization is the source of truth before any shared detail is shown.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
| --- | --- | --- | --- |
| No dedicated primitive showcase route | App-wide | Shared primitives render across all four live tabs and are verified there at 375/768/1280 | Add only if component development becomes independent of product screens |
