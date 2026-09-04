# PRD & Technical Execution Specification

# Motorcycle Care

**Version:** 1.0
**Platform:** Android First
**Application Type:** React Native Mobile App
**Stage:** Client-side MVP
**Backend:** None
**Database / SQL:** None
**Persistence:** Local device storage using MMKV
**Primary Language:** Indonesian-first, architecture ready for localization
**UI Direction:** Material Design 3, clean, premium, human-designed
**Default Theme:** Blue
**Theme Behavior:** Dynamic accent color per motorcycle

---

# 1. Product Summary

Motorcycle Care adalah aplikasi personal untuk membantu pemilik motor menjaga dan memantau kondisi serta jadwal perawatan motornya.

Aplikasi memungkinkan user memiliki beberapa profil motor dan membantu menjawab pertanyaan sederhana seperti:

* Kapan terakhir ganti oli?
* Berapa kilometer lagi sebelum ganti oli?
* Kapan terakhir cek tekanan ban?
* Apakah ada maintenance yang sudah overdue?
* Kapan perlu servis motor?
* Apa maintenance berikutnya?
* Berapa odometer terakhir motor?
* Apa saja yang sudah pernah dikerjakan pada motor ini?

Aplikasi harus terasa seperti:

> **Personal health dashboard untuk motor.**

Bukan aplikasi bengkel.

Bukan marketplace.

Bukan aplikasi otomotif yang penuh data teknis.

Bukan AI assistant.

Focus utama:

> **Apa yang perlu diperhatikan dari motor saya sekarang?**

---

# 2. Product Vision

User membuka aplikasi dan dalam waktu kurang dari beberapa detik dapat mengetahui:

1. Motor yang sedang aktif.
2. Kilometer terakhir.
3. Kondisi maintenance.
4. Maintenance yang akan datang.
5. Maintenance yang overdue.
6. Reminder berikutnya.
7. Riwayat maintenance terakhir.

Contoh Home:

```text
Good afternoon

Vario 160
Daily Ride

12,450 km

Needs Attention

Engine Oil
550 km remaining

Coming Up

Tire Pressure
Tomorrow

General Service
1,550 km remaining

Recent Activity

Engine Oil Changed
2 months ago
```

---

# 3. Product Principles

## 3.1 Simple Before Powerful

Jangan menampilkan data teknis yang tidak dibutuhkan user.

Jangan:

```text
CVT Preventive Maintenance Interval
```

Gunakan:

```text
Check CVT
```

Dan secondary text:

```text
Recommended around 5,000 km
```

---

## 3.2 Action-Oriented

Home screen harus menjawab:

> Apa yang perlu saya lakukan selanjutnya?

Bukan sekadar menampilkan statistik motor.

---

## 3.3 Transparent Recommendation

Jangan berpura-pura menggunakan AI.

Hindari copy:

```text
AI recommendation
Smart AI analysis
AI detected
Intelligent maintenance
```

Gunakan:

```text
Manufacturer recommendation

General recommendation

Custom schedule
```

---

## 3.4 Calm UI

Maintenance yang overdue perlu terlihat jelas tetapi tidak membuat aplikasi terasa menakutkan.

Gunakan:

```text
Oil change is overdue
230 km overdue
```

Bukan:

```text
CRITICAL ALERT!!!
```

---

## 3.5 Local First

Seluruh fitur inti harus bisa digunakan:

* tanpa login;
* tanpa internet;
* tanpa backend;
* tanpa cloud;
* tanpa akun.

---

# 4. MVP Scope

MVP harus memiliki fitur berikut.

## Motorcycle Garage

* Add motorcycle.
* Edit motorcycle.
* Delete motorcycle.
* Multiple motorcycles.
* Select active motorcycle.
* Motorcycle nickname.
* Motorcycle color.
* Dynamic UI theme.
* Current odometer.
* Odometer history.

## Maintenance

* Maintenance templates.
* Maintenance rules.
* Distance-based maintenance.
* Time-based maintenance.
* Distance + time maintenance.
* Maintenance status.
* Mark maintenance as completed.
* Maintenance history.
* Custom maintenance interval.

## Reminder

* Maintenance reminder.
* Custom reminder.
* Local notifications.
* Recurring reminder.
* Reminder editing.
* Reminder deletion.

## Calendar

* Add reminder to Android Calendar.
* Edit linked event.
* Remove linked event.

## User Experience

* Smooth animation.
* Light mode.
* Dark mode.
* Reduced motion awareness.
* Empty state.
* Permission handling.
* Offline support.

---

# 5. Explicit Non-Goals

DO NOT implement the following in MVP:

* backend;
* REST API;
* GraphQL;
* SQL;
* SQLite;
* PostgreSQL;
* Firebase database;
* Supabase;
* authentication;
* registration;
* Google login;
* cloud sync;
* remote push notifications;
* workshop marketplace;
* workshop booking;
* parts marketplace;
* online motorcycle catalog API;
* GPS ride tracking;
* OBD connection;
* Bluetooth connection;
* automatic odometer detection;
* fuel tracking;
* AI diagnosis;
* AI assistant;
* community features;
* chat;
* payment;
* iOS-specific optimization.

Architecture may prepare for them, but implementation must not include them.

---

# 6. Target User

Primary user:

* owns 1–3 motorcycles;
* motorcycle used regularly;
* may forget maintenance;
* doesn't want complex automotive apps;
* wants simple reminders;
* understands odometer but may not know exact maintenance intervals.

Common examples:

```text
Honda BeAT
Honda Vario
Honda PCX

Yamaha Mio
Yamaha Aerox
Yamaha NMAX

Suzuki
Kawasaki
other motorcycles
```

---

# 7. Technical Stack

Use:

```text
React Native
TypeScript strict mode

Expo
Expo Development Build
Expo Router

React Native Paper
Material Design 3

React Native Reanimated
React Native Gesture Handler

Zustand
Zustand Persist

react-native-mmkv

React Hook Form
Zod

Expo Notifications
Expo Calendar

Day.js
```

Use current mutually-compatible stable versions.

Do not blindly pin package versions from this PRD.

---

# 8. Important Technical Constraints

## 8.1 Do Not Use MUI Web

Do NOT install:

```text
@mui/material
```

React Native is not React DOM.

Use:

```text
react-native-paper
```

with Material Design 3.

React Native Paper v5's theme model follows Material Design 3 and supports customized themes.

---

# 9. Persistence Architecture

DO NOT use SQL.

DO NOT use browser `localStorage`.

DO NOT treat data as temporary cache.

Use:

```text
MMKV
```

as persistent local storage.

Current `react-native-mmkv` uses native C++/Nitro Modules, provides synchronous key-value persistence, and has documented integration with Zustand persistence.

Architecture:

```text
React Native UI
      ↓
Feature Hooks
      ↓
Zustand Store
      ↓
Repository / Storage Adapter
      ↓
MMKV
```

Important:

Components MUST NOT directly call:

```ts
storage.set(...)
storage.getString(...)
```

MMKV access must be abstracted.

---

# 10. Runtime State vs Persistent State

## Zustand

Responsible for:

* current runtime state;
* active motorcycle;
* current filters;
* UI state;
* selected maintenance;
* active theme;
* hydrated persisted state.

## MMKV

Responsible for persisted data:

* motorcycles;
* odometer logs;
* maintenance rules;
* maintenance history;
* reminders;
* preferences.

---

# 11. Storage Adapter

Create an adapter compatible with Zustand persist.

Concept:

```ts
interface AppStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

Implementation:

```text
MMKVStorageAdapter
```

Do not expose MMKV throughout the application.

---

# 12. Persisted Root State

Use a versioned root state.

Example:

```ts
interface PersistedAppState {
  schemaVersion: number

  motorcycles: Motorcycle[]
  odometerLogs: OdometerLog[]

  maintenanceRules: MaintenanceRule[]
  maintenanceLogs: MaintenanceLog[]

  reminders: Reminder[]

  preferences: UserPreferences
}
```

Initial:

```ts
schemaVersion: 1
```

---

# 13. State Migration

Every persisted schema change must support migration.

Concept:

```ts
migratePersistedState(
  persistedState,
  fromVersion,
  toVersion
)
```

Example:

```text
v1
↓
v2
↓
v3
```

This is important because local application updates must not destroy existing user data.

---

# 14. Static Data vs User Data

Separate data into two categories.

## Static App Data

Stored inside application bundle.

Example:

```text
motorcycle brands
motorcycle types
maintenance categories
generic maintenance templates
model-specific templates
```

Location:

```text
src/data/
```

DO NOT persist static catalog data unnecessarily.

---

## User Data

Stored in MMKV.

```text
motorcycle profile
odometer
custom maintenance
maintenance completion
reminders
preferences
```

---

# 15. Static Maintenance Data Structure

Recommended:

```text
src/data/maintenance/

generic/
  scooter.ts
  manual.ts
  sport.ts
  cub.ts

honda/
  vario-160.ts
  beat.ts
  pcx.ts

yamaha/
  nmax.ts
  aerox.ts
  mio.ts
```

MVP does NOT need complete motorcycle coverage.

Unknown motorcycle should fall back to generic type templates.

---

# 16. Motorcycle Entity

```ts
type MotorcycleType =
  | 'scooter'
  | 'cub'
  | 'manual'
  | 'sport'
  | 'other'

interface Motorcycle {
  id: string

  nickname: string

  brand: string
  model: string
  variant?: string
  year?: number

  type: MotorcycleType

  colorName?: string
  themeColor: string

  currentOdometer: number

  purchaseDate?: string
  plateNumber?: string
  notes?: string

  createdAt: string
  updatedAt: string
}
```

Use UUID/local unique ID.

---

# 17. Motorcycle Form

Required fields:

```text
Nickname
Brand
Model
Motorcycle Type
Current Odometer
Theme Color
```

Optional:

```text
Variant
Year
Purchase Date
Plate Number
Notes
```

Validation:

```text
odometer >= 0
year reasonable
nickname required
brand required
model required
```

---

# 18. Motorcycle Theme

Default:

```text
Blue
```

Suggested primary:

```text
#2563EB
```

Every motorcycle has:

```ts
themeColor
```

Examples:

```text
Blue motorcycle → blue accent
Red motorcycle → red accent
Black motorcycle → graphite accent
Green motorcycle → green accent
```

---

# 19. Theme Rules

Dynamic theme may change:

* primary button;
* selected chip;
* FAB;
* progress indicator;
* active tab;
* active icon;
* motorcycle card highlight;
* subtle background tint.

Dynamic theme must NOT change semantic colors.

Semantic colors remain consistent:

```text
success
warning
error
information
```

Example:

Red motorcycle must not cause:

```text
normal primary red
+
error red
```

to become indistinguishable.

---

# 20. Theme Color Safety

Generate usable colors from selected source color.

Check text contrast.

If arbitrary motorcycle color produces poor contrast, automatically derive a darker/lighter accessible variant.

Do not simply use:

```ts
backgroundColor = motorcycle.themeColor
color = '#fff'
```

without contrast validation.

---

# 21. Light Theme

Suggested base:

```text
Background:
#F8FAFC

Surface:
#FFFFFF

Primary:
#2563EB

Text Primary:
#0F172A

Text Secondary:
#64748B

Border:
#E2E8F0
```

Exact shades can be adjusted during implementation.

---

# 22. Dark Theme

Dark mode must be supported.

Use Material Design 3 dark principles rather than simply:

```text
background = black
```

Keep surfaces layered and readable.

---

# 23. Motorcycle Selection

User can switch active motorcycle from Home.

Use:

```text
Motorcycle Selector Bottom Sheet
```

Example:

```text
My Motorcycles

● Vario 160
  Daily Ride
  12,450 km

○ CB150R
  Weekend
  8,230 km

+ Add motorcycle
```

Changing motorcycle:

* updates Home;
* updates maintenance list;
* updates theme;
* updates reminder context.

---

# 24. Odometer

Odometer is essential because several maintenance rules depend on distance.

Home must provide visible quick action:

```text
Update Odometer
```

---

# 25. Odometer Update Flow

Input:

```text
Current odometer

12,820 km
```

Validation:

New odometer must normally be:

```text
>= previous odometer
```

If lower, show confirmation:

```text
This mileage is lower than the previous reading.

Previous:
12,450 km

New:
11,200 km

Save anyway?
```

Allow correction because previous entry may be wrong.

---

# 26. Odometer Log

```ts
interface OdometerLog {
  id: string
  motorcycleId: string

  value: number
  recordedAt: string

  createdAt: string
}
```

When updating:

```text
motorcycle.currentOdometer
```

must also update.

---

# 27. Maintenance Categories

Initial categories:

```ts
type MaintenanceType =
  | 'engine-oil'
  | 'gear-oil'
  | 'tire-pressure'
  | 'tire-condition'
  | 'brake'
  | 'brake-fluid'
  | 'air-filter'
  | 'spark-plug'
  | 'battery'
  | 'coolant'
  | 'cvt'
  | 'v-belt'
  | 'drive-chain'
  | 'general-service'
  | 'custom'
```

Not all categories apply to all motorcycles.

Example:

Scooter:

```text
CVT
V-Belt
Gear Oil
```

Manual motorcycle:

```text
Drive Chain
```

---

# 28. Maintenance Rule Entity

```ts
type MaintenanceSource =
  | 'manufacturer'
  | 'model-template'
  | 'motorcycle-type'
  | 'generic'
  | 'custom'

interface MaintenanceRule {
  id: string

  motorcycleId: string

  type: MaintenanceType

  title: string
  description?: string

  intervalKm?: number
  intervalDays?: number

  lastCompletedKm?: number
  lastCompletedAt?: string

  sourceType: MaintenanceSource
  sourceLabel?: string
  sourceReference?: string

  enabled: boolean

  createdAt: string
  updatedAt: string
}
```

---

# 29. Maintenance Can Have Multiple Triggers

Support:

```text
distance only

time only

distance OR time
```

Example:

```text
Engine oil
3000 km OR 90 days
```

Whichever occurs first becomes primary status.

---

# 30. Maintenance Calculation

Create pure domain function:

```ts
calculateMaintenanceStatus({
  currentOdometer,
  currentDate,
  intervalKm,
  intervalDays,
  lastCompletedKm,
  lastCompletedAt,
})
```

Return:

```ts
type MaintenanceStatus =
  | 'good'
  | 'soon'
  | 'due'
  | 'overdue'

interface MaintenanceStatusResult {
  status: MaintenanceStatus

  dueKm?: number
  dueDate?: string

  remainingKm?: number
  remainingDays?: number

  overdueKm?: number
  overdueDays?: number

  primaryTrigger:
    | 'distance'
    | 'time'
    | null
}
```

This function MUST NOT depend on UI or Zustand.

Write unit tests.

---

# 31. Maintenance Status Rules

## Good

Far from due threshold.

Example:

```text
1,850 km remaining
```

## Soon

Approaching due.

Suggested threshold:

```text
distance:
<= 20% interval remaining

time:
<= 20% interval remaining
```

Make threshold configurable as constant.

## Due

Reached target.

## Overdue

Exceeded target.

---

# 32. Example

Rule:

```text
Engine Oil

Interval:
3,000 km

Last:
10,000 km

Current:
12,450 km
```

Calculation:

```text
Next:
13,000 km

Remaining:
550 km
```

Status:

```text
Soon
```

---

# 33. Time + Distance Example

Rule:

```text
3,000 km
OR
90 days
```

Results:

```text
Mileage:
1,500 km remaining

Time:
3 days remaining
```

Display:

```text
Due in 3 days

or in 1,500 km
```

---

# 34. Maintenance Recommendation Strategy

Recommendation priority:

```text
1. Manufacturer/model-specific
2. Model template
3. Motorcycle type
4. Generic
5. Custom user rule
```

Custom user rule always overrides suggested template for that motorcycle.

---

# 35. Important Maintenance Disclaimer

Do NOT imply that generic maintenance interval is the official interval for every motorcycle.

UI should display source.

Example:

```text
General recommendation
```

Secondary:

```text
Check your owner's manual for the exact interval.
```

Model-specific:

```text
Manufacturer recommendation
```

Custom:

```text
Your custom schedule
```

---

# 36. Generic Maintenance Baseline

Use generic values only as initial suggestions.

They are editable.

Available Yamaha guidance illustrates why these should remain suggestions: engine oil guidance commonly sits around 2,000–3,000 km, while gear oil recommendations can be roughly 8,000–10,000 km; Yamaha also describes a regular service cadence around 4,000 km or four months in one general maintenance guide.

Suggested MVP seeds:

### Engine Oil

```text
Default suggestion:
2,500 km

Optional time:
3 months

Source:
Generic recommendation
```

User can change it.

---

### Scooter Gear Oil

```text
Default suggestion:
9,000 km

Optional time:
6 months

Source:
Generic recommendation
```

---

### General Service

```text
Default suggestion:
4,000 km
OR
4 months
```

---

### Tire Pressure Check

```text
Default:
Every 30 days
```

No PSI automatically assigned.

A Yamaha maintenance article recommends regular brake, tire-pressure, and battery checks monthly, while other manufacturer guidance emphasizes that actual tire pressure must follow the motorcycle's sticker/manual.

---

### Brake Check

```text
Default:
Every 30 days
```

---

### Battery Check

```text
Default:
Every 30 days
```

---

### CVT Inspection

For scooter only.

```text
Suggested:
5,000 km

Source:
General recommendation
```

Treat as an inspection suggestion, not automatic replacement. Yamaha's 2026 guidance for work motorcycles recommends periodic checks of CVT, rollers and V-belt around this distance, but actual model schedules can vary.

---

# 37. Components Without Universal Default Replacement

Do NOT automatically assign aggressive replacement intervals for:

```text
V-belt replacement
spark plug replacement
air filter replacement
coolant replacement
brake fluid replacement
drive chain replacement
tire replacement
```

unless model-specific data is available.

Instead allow:

```text
Check regularly
```

or user-configured rules.

Reason:

interval varies substantially by:

* motorcycle;
* engine;
* component;
* manufacturer;
* environment;
* riding conditions.

---

# 38. Tire Pressure

Never assume:

```text
Front = 29 PSI
Rear = 33 PSI
```

for every motorcycle.

Motorcycle entity may optionally have:

```ts
frontTirePressurePsi?: number
rearTirePressurePsi?: number
```

If unknown:

UI:

```text
Check tire pressure

Use the pressure listed on your motorcycle
or owner's manual.
```

---

# 39. Maintenance Template

Example:

```ts
interface MaintenanceTemplate {
  templateId: string

  brand?: string
  model?: string
  motorcycleType?: MotorcycleType

  rules: MaintenanceTemplateRule[]
}
```

Rule:

```ts
interface MaintenanceTemplateRule {
  type: MaintenanceType

  title: string

  intervalKm?: number
  intervalDays?: number

  sourceType: MaintenanceSource

  sourceLabel?: string
  sourceReference?: string
}
```

---

# 40. Template Application

When user creates:

```text
Yamaha NMAX
```

Process:

```text
find exact model template
      ↓
if missing
      ↓
find scooter template
      ↓
copy maintenance rules
      ↓
assign new IDs
      ↓
assign motorcycleId
      ↓
persist user rules
```

Do not mutate static template.

---

# 41. Maintenance Completion

Maintenance Detail:

Primary action:

```text
Mark as Done
```

Open bottom sheet / page.

Input:

```text
Date
Odometer
Cost (optional)
Workshop (optional)
Notes (optional)
```

---

# 42. Maintenance Log Entity

```ts
interface MaintenanceLog {
  id: string

  motorcycleId: string
  maintenanceRuleId: string

  maintenanceType: MaintenanceType
  title: string

  completedAt: string
  odometer?: number

  cost?: number
  workshop?: string
  notes?: string

  createdAt: string
}
```

Store title/type snapshot so history still makes sense if rule is later renamed.

---

# 43. Completing Maintenance Logic

When completed:

1. Create MaintenanceLog.
2. Update rule:

```text
lastCompletedAt
lastCompletedKm
```

3. Recalculate next maintenance.
4. Reschedule associated reminder if applicable.
5. Persist atomically from application's perspective.
6. Show success feedback.

---

# 44. Maintenance History

Show per motorcycle.

Example:

```text
September 2026

Engine Oil Changed
12,820 km
Rp65,000

Tire Pressure Checked
12,500 km


July 2026

General Service
10,200 km
Rp180,000
```

Sort:

```text
newest first
```

---

# 45. Reminder Entity

```ts
type ReminderRepeat =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'

interface Reminder {
  id: string

  motorcycleId?: string
  maintenanceRuleId?: string

  title: string
  description?: string

  scheduledAt: string

  repeat: ReminderRepeat
  repeatInterval?: number

  notificationEnabled: boolean
  notificationId?: string

  calendarEnabled: boolean
  calendarEventId?: string
  calendarId?: string

  completed: boolean

  createdAt: string
  updatedAt: string
}
```

---

# 46. Reminder Types

## Maintenance Reminder

Associated with:

```text
maintenanceRuleId
motorcycleId
```

Example:

```text
Change Engine Oil
Vario 160
```

## Custom Reminder

Not necessarily maintenance-related.

Examples:

```text
Renew STNK

Check insurance

Wash motorcycle

Prepare motorcycle before touring
```

---

# 47. Local Notifications

Use:

```text
expo-notifications
```

MVP uses local scheduled notifications.

No server.

No FCM required for MVP.

Expo Notifications supports one-time and repeating scheduled local notifications.

---

# 48. Notification Permission

Do NOT ask notification permission immediately on first launch.

Request contextually.

Example:

User enables:

```text
Notify me
```

Then explain:

```text
Allow notifications so we can remind you
when maintenance is coming up.
```

Then trigger native permission.

---

# 49. Android Notification Channel

Create:

```text
Maintenance Reminders
```

Suggested:

```text
importance: default
sound: default
```

Don't create unnecessary channels.

---

# 50. Notification Copy

Good:

```text
Engine oil is due soon

Your Vario 160 has about
300 km remaining.
```

Good:

```text
Time to check tire pressure

A quick check can help keep
your Vario 160 ready to ride.
```

Avoid:

```text
🚨🚨 CRITICAL MOTOR ALERT 🚨🚨
```

Avoid excessive emoji.

---

# 51. Notification Tap

Notification data must include:

```ts
{
  reminderId,
  motorcycleId,
  maintenanceRuleId
}
```

When tapped:

```text
open app
↓
select corresponding motorcycle
↓
navigate maintenance/reminder detail
```

---

# 52. Calendar Integration

Use:

```text
expo-calendar
```

It can interact with system calendar events on Android devices. Current Expo Calendar requires a development build rather than Expo Go.

---

# 53. Calendar Permission

Do not ask permission during onboarding.

Ask only when user activates:

```text
Add to phone calendar
```

---

# 54. Calendar Event

Example:

```text
Title:
Motorcycle Care — Engine Oil

Date:
12 Sep 2026

Description:
Engine oil maintenance for Vario 160.

Current schedule:
13,000 km
```

---

# 55. Calendar Synchronization

Important requirement.

If reminder changes:

```text
12 Sep
→
15 Sep
```

system must:

1. Update Reminder state.
2. Cancel old notification.
3. Schedule new notification.
4. Update calendar event.
5. Save new IDs if necessary.
6. Persist final state.

---

# 56. Reminder Coordinator

Create service:

```ts
interface ReminderCoordinator {
  createReminder(input): Promise<Reminder>

  updateReminder(
    reminderId,
    changes
  ): Promise<Reminder>

  deleteReminder(
    reminderId
  ): Promise<void>

  rescheduleReminder(
    reminderId
  ): Promise<void>
}
```

Coordinator communicates with:

```text
ReminderRepository
NotificationService
CalendarService
```

UI should NOT orchestrate those individually.

---

# 57. Notification Service

```ts
interface NotificationService {
  requestPermission(): Promise<boolean>

  schedule(
    reminder: Reminder
  ): Promise<string | undefined>

  cancel(
    notificationId: string
  ): Promise<void>
}
```

Implementation:

```text
ExpoNotificationService
```

---

# 58. Calendar Service

```ts
interface CalendarService {
  requestPermission(): Promise<boolean>

  createEvent(
    reminder: Reminder
  ): Promise<{
    calendarId: string
    eventId: string
  }>

  updateEvent(
    reminder: Reminder
  ): Promise<void>

  deleteEvent(
    calendarId: string,
    eventId: string
  ): Promise<void>
}
```

Implementation:

```text
ExpoCalendarService
```

---

# 59. Failure Handling

Example:

Notification created successfully but calendar creation fails.

Do NOT lose reminder.

Save reminder with:

```text
notificationEnabled = true
calendarEnabled = false
```

Show:

```text
Reminder saved

We couldn't add it to your calendar.
You can try again later.
```

---

# 60. Navigation

Bottom navigation:

```text
Home
Garage
Maintenance
Settings
```

Do NOT create five or six tabs.

Reminder lives within Maintenance/Home.

---

# 61. Expo Router Structure

Suggested:

```text
app/

  _layout.tsx

  (tabs)/
    _layout.tsx
    index.tsx
    garage.tsx
    maintenance.tsx
    settings.tsx

  motorcycle/
    add.tsx
    [id]/
      index.tsx
      edit.tsx
      history.tsx

  maintenance/
    [id].tsx
    complete/
      [id].tsx

  reminder/
    create.tsx
    [id].tsx
    edit/
      [id].tsx
```

Bottom sheets can live as components instead of routes where appropriate.

---

# 62. Home Screen

Home is the most important screen.

Order:

```text
Header

Active Motorcycle

Motorcycle Hero

Odometer

Needs Attention

Coming Up

Quick Actions

Recent Activity
```

---

# 63. Home Header

Example:

```text
Good afternoon

Vario 160 ▼
```

Do not make greeting dominant.

Motorcycle identity should remain visually stronger.

---

# 64. Motorcycle Hero

Do NOT use large AI-generated motorcycle artwork as a requirement.

MVP can use:

* subtle motorcycle icon;
* simple silhouette;
* model initials;
* tasteful generic illustration.

Example:

```text
Vario 160

Daily Ride

12,450 km
```

Primary quick action:

```text
Update odometer
```

---

# 65. Needs Attention

Only show if necessary.

Priority:

```text
overdue
due
soon
```

Maximum about:

```text
3 items
```

Then:

```text
View all
```

---

# 66. Coming Up

Show:

* upcoming time reminder;
* upcoming distance maintenance.

Example:

```text
Tire Pressure

Tomorrow
```

```text
General Service

1,550 km remaining
```

---

# 67. Quick Actions

Maximum three visible.

Suggested:

```text
Update Odometer

Add Reminder

Log Maintenance
```

Do not fill screen with action buttons.

---

# 68. Recent Activity

Show maximum:

```text
3 recent logs
```

Example:

```text
Engine Oil Changed

12,000 km
2 months ago
```

---

# 69. Empty Home

No motorcycles:

```text
Your garage is empty

Add your motorcycle to start tracking
maintenance and reminders.

Add Motorcycle
```

---

# 70. Garage Screen

Header:

```text
My Garage
```

Motorcycle cards.

Example:

```text
Vario 160

Daily Ride
12,450 km

2 items coming up
```

Second:

```text
CB150R

Weekend Ride
8,230 km

All good
```

FAB:

```text
+
```

or:

```text
Add motorcycle
```

---

# 71. Add Motorcycle Flow

Use progressive multi-step flow.

Not one huge form.

---

# 72. Add Motorcycle Step 1

```text
What motorcycle do you ride?
```

Fields:

```text
Brand
Model
Variant optional
```

---

# 73. Step 2

```text
Tell us a little more
```

Fields:

```text
Year
Motorcycle type
Nickname
```

Nickname suggestion:

```text
Vario 160
```

---

# 74. Step 3

```text
What's the current mileage?
```

Large numeric field:

```text
12,450

km
```

---

# 75. Step 4

Theme:

```text
Choose your motorcycle color
```

Preset swatches:

```text
Blue
Red
Black
White
Gray
Green
Yellow
Custom
```

Preview card reacts immediately.

---

# 76. Step 5

Maintenance template preview.

Example:

```text
We'll start with these reminders

Engine Oil
2,500 km

General Service
4,000 km

Tire Pressure
Every month

Brake Check
Every month

Gear Oil
9,000 km
```

Buttons:

```text
Use Recommendations

Customize
```

---

# 77. Add Motorcycle Success

Use subtle transition.

```text
Vario 160 added to your garage
```

Navigate Home with new motorcycle active.

---

# 78. Motorcycle Detail

Sections:

```text
Overview

Current Mileage

Maintenance

History

Motorcycle Information
```

Actions:

```text
Edit

Delete
```

---

# 79. Delete Motorcycle

Must require confirmation.

Example:

```text
Delete Vario 160?

This will also remove its maintenance history
and reminders from this device.

Cancel

Delete
```

Before deleting:

cancel linked notifications.

Attempt to remove app-created calendar events where appropriate.

---

# 80. Maintenance Screen

Top:

```text
Maintenance

Vario 160 ▼
```

Sections:

```text
Needs Attention

Coming Soon

All Maintenance
```

---

# 81. Maintenance Filter

Chips:

```text
All
Engine
Transmission
Tires
Brakes
Other
```

Keep horizontally scrollable if needed.

---

# 82. Maintenance Card

Example:

```text
Engine Oil

550 km remaining

Last:
10,000 km

Next:
13,000 km
```

Include subtle progress indicator.

Do not use giant automotive gauges.

---

# 83. Maintenance Progress

For distance:

```text
completedDistance =
currentKm - lastCompletedKm

progress =
completedDistance / intervalKm
```

Clamp:

```text
0 → 1
```

Overdue can visually exceed logical threshold but progress UI remains max 100%.

Status indicates overdue separately.

---

# 84. Maintenance Detail Screen

Example:

```text
Engine Oil

550 km remaining

Current mileage
12,450 km

Last changed
10,000 km

Recommended interval
3,000 km

Next
13,000 km

General recommendation

Check your motorcycle manual
for the exact maintenance schedule.
```

Actions:

```text
Mark as Done

Set Reminder

Edit Schedule
```

---

# 85. Edit Maintenance Schedule

Fields:

```text
Name

Distance interval
[ 3000 ] km

Time interval
[ 90 ] days

Enabled
```

Allow:

* distance only;
* time only;
* both.

---

# 86. Custom Maintenance

User can add own maintenance.

Example:

```text
Chain Lubrication

Every:
500 km
```

or:

```text
Detailing

Every:
30 days
```

---

# 87. Reminder Creation

Fields:

```text
Title

Motorcycle optional

Date

Time

Repeat

Notification toggle

Add to phone calendar toggle

Notes
```

---

# 88. Reminder Repeat UI

Options:

```text
Doesn't repeat

Daily

Weekly

Monthly

Yearly

Custom
```

Custom MVP can support:

```text
Every X days
Every X weeks
Every X months
```

Avoid building complex Google Calendar-like RRULE editor in MVP.

---

# 89. Settings

Sections:

```text
Appearance

Notifications

Maintenance

Data

About
```

---

# 90. Appearance

Options:

```text
System
Light
Dark
```

Toggle:

```text
Use motorcycle color as accent
```

Default:

```text
enabled
```

If disabled:

use default blue globally.

---

# 91. Notification Settings

Show:

```text
Notifications
Allowed / Not allowed
```

Action:

```text
Open Android Settings
```

Do not repeatedly request permission after permanently denied.

---

# 92. Maintenance Settings

Possible settings:

```text
Coming soon threshold

Use recommended maintenance templates

Odometer reminder
```

For MVP, threshold can remain fixed internally if UI would add unnecessary complexity.

---

# 93. Data Settings

MVP:

```text
Reset App Data
```

Require confirmation twice or strong confirmation.

Future placeholder is not necessary.

Do NOT display non-working:

```text
Cloud Backup
Sync
```

---

# 94. Animation System

Use:

```text
React Native Reanimated
```

Animations must feel deliberate and restrained.

Do not animate everything.

---

# 95. Animation Timing

Typical interaction:

```text
180–280 ms
```

Page transition:

```text
220–320 ms
```

Micro interaction:

```text
120–200 ms
```

Use spring where natural.

Do not use excessively bouncy spring.

---

# 96. Motorcycle Switch Animation

When switching:

```text
old content:
opacity 1 → 0
translateX 0 → -12

new content:
opacity 0 → 1
translateX 12 → 0
```

Theme accent transitions smoothly.

---

# 97. Maintenance Completion Animation

When Mark as Done:

```text
progress → complete

check icon:
scale .8 → 1.08 → 1

status:
Due → Good
```

Then update card.

Do not use confetti.

---

# 98. Add Motorcycle Animation

New motorcycle card:

```text
opacity 0 → 1

translateY 12 → 0
```

---

# 99. Bottom Sheet Animation

Spring.

Minimal overshoot.

Background dim:

```text
opacity transition
```

---

# 100. Press Feedback

Cards/buttons must provide:

* ripple;
* opacity;
* scale where appropriate.

Avoid every card scaling dramatically.

---

# 101. Reduced Motion

Respect reduced motion accessibility settings where technically available.

When enabled:

* disable decorative movement;
* shorten transitions;
* preserve state changes;
* avoid large slides.

---

# 102. UI Design Direction

The application should look:

```text
clean
quiet
modern
functional
premium
human-designed
Android-native
```

---

# 103. Avoid “AI Generated UI”

Explicitly avoid:

```text
blue-purple gradients everywhere

glassmorphism

random glowing elements

huge hero gradients

cards inside cards inside cards

extreme 32px border radius everywhere

floating decorative blobs

overuse of emoji

overuse of shadows

giant automotive speedometer gauges

overly futuristic dashboards

random motivational quotes

unnecessary charts
```

---

# 104. Shape Language

Suggested radius:

```text
small:
8

medium:
12

large:
16–20

hero container:
24 maximum
```

Not every element needs rounded container.

---

# 105. Spacing System

Use consistent scale:

```ts
4
8
12
16
20
24
32
40
48
```

Do not use arbitrary spacing everywhere.

---

# 106. Typography

Prefer standard readable Android-friendly typography.

Material typography hierarchy:

```text
Display
Headline
Title
Body
Label
```

But application primarily uses:

```text
Headline Small
Title Medium
Body Medium
Body Small
Label
```

Avoid excessive huge headings.

---

# 107. Iconography

Use one consistent icon family compatible with React Native Paper.

Do not mix:

```text
Material Icons
Lucide
Font Awesome
Emoji
```

randomly.

---

# 108. Accessibility

Minimum target:

```text
48dp
```

for important interactive elements.

Provide accessibility label for icon-only actions.

Text must remain readable with larger font settings.

Do not rely purely on color for maintenance status.

Example:

Not only orange.

Also show:

```text
Due Soon
```

---

# 109. Empty States

Use simple text + action.

## Maintenance

```text
Nothing needs attention

Your maintenance schedule is looking good.
```

## History

```text
No maintenance history yet

Completed maintenance will appear here.
```

## Reminder

```text
No reminders yet

Create a reminder for maintenance
or anything else related to your motorcycle.
```

---

# 110. Error Handling

Use inline errors where possible.

Avoid generic:

```text
Something went wrong.
```

when specific information exists.

Examples:

```text
We couldn't schedule this notification.

Calendar access is turned off.

Current mileage cannot be negative.
```

---

# 111. Permission Denied Behavior

## Notification denied

Reminder can still exist in app.

Show:

```text
Notification is off

This reminder is saved,
but Android won't show an alert.
```

## Calendar denied

Reminder still works through local notification.

Show:

```text
Calendar access is off

Your reminder is still saved
and notifications can continue to work.
```

---

# 112. No Internet Behavior

Core application MUST work completely offline.

No loader should wait for internet.

No maintenance screen should depend on network.

---

# 113. Store Structure

Suggested:

```text
src/store/

app.store.ts

slices/
  motorcycle.slice.ts
  maintenance.slice.ts
  reminder.slice.ts
  preferences.slice.ts
```

Or multiple Zustand stores if implementation remains clean.

Prefer simple structure over overengineering.

---

# 114. Repository Interfaces

## Motorcycle

```ts
interface MotorcycleRepository {
  getAll(): Motorcycle[]

  getById(
    id: string
  ): Motorcycle | undefined

  save(
    motorcycle: Motorcycle
  ): void

  delete(
    id: string
  ): void
}
```

---

## Maintenance

```ts
interface MaintenanceRepository {
  getRules(
    motorcycleId: string
  ): MaintenanceRule[]

  saveRule(
    rule: MaintenanceRule
  ): void

  deleteRule(
    ruleId: string
  ): void

  getLogs(
    motorcycleId: string
  ): MaintenanceLog[]

  saveLog(
    log: MaintenanceLog
  ): void
}
```

---

## Reminder

```ts
interface ReminderRepository {
  getAll(): Reminder[]

  getById(
    id: string
  ): Reminder | undefined

  save(
    reminder: Reminder
  ): void

  delete(
    id: string
  ): void
}
```

Repository implementation can call Zustand actions/MMKV abstraction as appropriate.

Avoid duplicate competing sources of truth.

---

# 115. Domain Services

Create:

```text
MaintenanceCalculator

MaintenanceTemplateService

ReminderCoordinator

NotificationService

CalendarService
```

UI components must not contain domain calculations.

---

# 116. Suggested Source Structure

```text
src/

  components/
    ui/
    feedback/
    layout/

  features/

    garage/
      components/
      hooks/
      services/
      forms/

    odometer/
      components/
      services/

    maintenance/
      components/
      hooks/
      services/
      utils/

    reminders/
      components/
      hooks/
      services/

    settings/

  domain/

    motorcycle/
      motorcycle.types.ts

    maintenance/
      maintenance.types.ts
      maintenance-calculator.ts

    reminder/
      reminder.types.ts

  data/

    motorcycles/

    maintenance/
      generic/
      honda/
      yamaha/

  services/

    notifications/
      notification.service.ts
      expo-notification.service.ts

    calendar/
      calendar.service.ts
      expo-calendar.service.ts

  storage/

    mmkv.ts
    storage-adapter.ts
    migrations.ts

  store/

  theme/

    colors.ts
    spacing.ts
    typography.ts
    theme.ts
    motorcycle-theme.ts

  utils/

  constants/
```

---

# 117. Component Design

Reusable components might include:

```text
MotorcycleCard

MotorcycleSelector

MaintenanceCard

MaintenanceStatusChip

MaintenanceProgress

ReminderCard

OdometerDisplay

EmptyState

SectionHeader

PrimaryButton

ConfirmDialog

BottomSheet

ColorPicker

NumericInput
```

Don't create abstractions prematurely for components used once.

---

# 118. Form Strategy

Use:

```text
React Hook Form
+
Zod
```

Schemas:

```text
motorcycleSchema
odometerSchema
maintenanceSchema
reminderSchema
maintenanceCompletionSchema
```

---

# 119. Date Handling

Use:

```text
Day.js
```

Persist timestamps as:

```text
ISO 8601 strings
```

Example:

```text
2026-09-04T15:30:00+07:00
```

Never persist localized strings:

```text
4 September 2026
```

as source data.

Formatting happens in UI.

---

# 120. Currency

Maintenance cost optional.

Store as numeric integer:

```text
65000
```

not:

```text
"Rp65.000"
```

Display formatter handles:

```text
Rp65.000
```

---

# 121. Localization Readiness

Initial user-facing language can be Indonesian.

Do not scatter strings throughout business logic.

Recommended structure:

```text
src/locales/id.ts
```

Full i18n framework optional for MVP.

But UI text should be easy to migrate.

---

# 122. Testing Requirements

At minimum unit test:

```text
maintenance calculation

status good

status soon

status due

status overdue

distance only

time only

distance OR time

lower odometer handling

persist migration

template fallback
```

---

# 123. Reminder Tests

Test service logic with adapters/mocks:

```text
create reminder

schedule notification

calendar enabled

calendar disabled

edit reminder

cancel previous notification

delete reminder
```

Do not require real Android calendar for domain unit tests.

---

# 124. Manual QA

Must test on physical Android device.

Especially:

```text
notification permission

scheduled notification

app closed

notification tap

calendar permission

calendar event creation

calendar event edit

calendar event deletion

MMKV persistence after app restart
```

---

# 125. Development Environment

Because MMKV and Calendar use native functionality, development workflow should assume native development builds rather than treating Expo Go as the final environment.

Current MMKV v4 is a Nitro Module and documents Expo installation via prebuild, while Expo Calendar currently explicitly requires a development build.

---

# 126. Performance

Target:

```text
smooth 60fps common interactions

instant local navigation

no noticeable loading for local data
```

Avoid:

```text
large JSON serialization every render

unnecessary global rerenders

heavy calculations inside components
```

---

# 127. Zustand Selector Discipline

Avoid:

```ts
const store = useAppStore()
```

inside every screen.

Prefer selectors:

```ts
const motorcycles =
  useAppStore(
    state => state.motorcycles
  )
```

This minimizes rerenders.

---

# 128. Storage Write Strategy

Don't persist manually from every screen.

Actions update state.

Persistence middleware/adapter handles storage.

For multi-step operations such as completing maintenance:

create one domain/store action.

Example:

```ts
completeMaintenance(...)
```

instead of:

```text
component:
add log
update rule
update reminder
write storage
```

---

# 129. Derived Data

Do not persist values that can easily be calculated.

Do not persist:

```text
remainingKm

maintenanceStatus

overdueDays

progressPercent
```

Calculate them.

Persist source state only:

```text
current odometer

interval

last completion
```

---

# 130. Active Motorcycle

Persist:

```ts
activeMotorcycleId
```

When active motorcycle is deleted:

select:

```text
first remaining motorcycle
```

If none:

```text
undefined
```

---

# 131. Initial Launch

If no app data:

show lightweight welcome.

Avoid multi-page marketing onboarding.

Example:

```text
Take better care of your motorcycle

Track maintenance, mileage,
and reminders in one place.

Get Started
```

Then immediately:

```text
Add Motorcycle
```

---

# 132. Returning Launch

If motorcycles exist:

go directly Home.

No splash longer than necessary.

---

# 133. Product Copy Style

Copy should be:

```text
short
friendly
calm
practical
```

Avoid:

```text
Hey rider! 🏍️🔥

Your beast needs some love!
```

Prefer:

```text
Engine oil is due soon

About 300 km remaining.
```

---

# 134. Privacy

MVP data stays locally on device.

No analytics required.

No account.

No remote upload.

No network permissions needed for core product.

Plate number is optional.

---

# 135. Data Loss Disclaimer

Since no cloud backup exists, settings/about can explain:

```text
Your motorcycle data is stored
on this device.

Uninstalling the app may remove it.
```

Do not imply data is backed up.

---

# 136. Future-Proofing

Architecture should make future transition possible:

```text
MMKV
↓
Repository contract
↓
SQLite / backend later
```

But DO NOT build unused synchronization abstractions now.

Only preserve clean boundaries.

---

# 137. Future Features — Not MVP

Possible later:

```text
cloud account

multi-device sync

service cost analytics

fuel tracking

fuel efficiency

maintenance spending

document reminders

STNK reminder

tax reminder

insurance

shared motorcycle

family garage

manufacturer maintenance database

automatic maintenance data updates

export/import backup

iOS

service workshop

smart mileage prediction
```

---

# 138. Future Mileage Prediction

Potential future feature:

Odometer history:

```text
June:
8,000

July:
9,100

August:
10,250
```

Estimate:

```text
~1,125 km/month
```

Then:

```text
Your next oil change may be needed
around October 18.
```

This does not require AI.

Simple rolling average is enough.

Do not implement in MVP.

---

# 139. Implementation Phase 1 — Foundation

Agent should first implement:

```text
Expo React Native project

TypeScript strict

Expo Router

React Native Paper

theme

light/dark mode

dynamic accent infrastructure

Reanimated

MMKV

Zustand persistence

schema versioning

basic app shell

bottom navigation
```

Definition of Done:

App launches on physical Android device and state persists after restart.

---

# 140. Phase 2 — Garage

Implement:

```text
welcome

add motorcycle

garage

motorcycle detail

edit

delete

active motorcycle

theme switching

odometer update

odometer log
```

Definition of Done:

User can manage multiple motorcycles and restart application without losing them.

---

# 141. Phase 3 — Maintenance Engine

Implement:

```text
maintenance domain types

generic templates

template selection

rule generation

status calculator

maintenance screen

detail screen

custom schedule

mark as done

history
```

Definition of Done:

Maintenance status changes correctly based on odometer and date.

---

# 142. Phase 4 — Notification Reminder

Implement:

```text
reminder model

reminder creation

notification permission

local notification

notification editing

notification cancellation

notification navigation
```

Definition of Done:

Scheduled notification appears on physical Android device.

---

# 143. Phase 5 — Calendar

Implement:

```text
calendar permission

calendar service

create event

edit event

delete event

ReminderCoordinator
```

Definition of Done:

Reminder state, scheduled notification, and calendar event stay synchronized.

---

# 144. Phase 6 — UX Polish

Implement:

```text
animations

empty states

error states

loading/hydration

permission denied states

reduced motion

accessibility

micro interactions

dark theme polishing
```

---

# 145. Phase 7 — QA

Test:

```text
fresh install

no permissions

permissions allowed

permissions denied

one motorcycle

five motorcycles

high odometer

maintenance overdue

maintenance complete

reminder editing

calendar event

delete motorcycle

restart app

dark mode

system theme
```

---

# 146. Acceptance Criteria — Garage

Must pass:

* User can create motorcycle.
* User can create at least 5 motorcycles.
* User can edit motorcycle.
* User can delete motorcycle.
* User can switch motorcycle.
* Active motorcycle persists.
* Different motorcycles can have different accent colors.
* Data remains after restart.

---

# 147. Acceptance Criteria — Odometer

* User can update odometer.
* Odometer history saved.
* Current odometer updated.
* Lower value triggers warning.
* Maintenance recalculates immediately.

---

# 148. Acceptance Criteria — Maintenance

* Rules generated when motorcycle added.
* Generic fallback works.
* Distance rule works.
* Time rule works.
* Combined rule works.
* Good status works.
* Soon status works.
* Due status works.
* Overdue status works.
* Custom rule works.
* Mark as done works.
* History works.
* Next interval recalculates.

---

# 149. Acceptance Criteria — Reminder

* Reminder can be created.
* Reminder can be edited.
* Reminder can be deleted.
* Local notification can be enabled.
* Local notification can be disabled.
* Repeat works for supported recurrence types.
* Notification tap opens relevant context.
* Permission rejection doesn't break app.

---

# 150. Acceptance Criteria — Calendar

* User can enable calendar.
* Permission requested contextually.
* Event created.
* Event updated when reminder changes.
* Event removed when requested.
* Calendar failure doesn't delete local reminder.
* Calendar permission rejection doesn't break notification.

---

# 151. Acceptance Criteria — UI

* UI uses Material Design 3 philosophy.
* UI uses React Native Paper.
* No MUI web.
* Default accent blue.
* Motorcycle accent supported.
* Light mode supported.
* Dark mode supported.
* Smooth animation.
* No obvious animation jank.
* No unnecessary gradients.
* No “AI dashboard” aesthetic.
* Minimum common touch target around 48dp.
* Semantic status is understandable without relying only on color.

---

# 152. Acceptance Criteria — Persistence

After:

```text
force close
restart
device reboot
```

user data should remain where Android/app lifecycle permits normal local persistence.

Persist:

```text
motorcycles
active motorcycle
odometer logs
maintenance rules
maintenance logs
reminders
preferences
```

---

# 153. Coding Standards

Use:

```text
TypeScript strict

named types

small domain functions

feature-based architecture

clean naming

pure maintenance calculations
```

Avoid:

```text
any

huge screen files

business logic inside JSX

direct MMKV use inside UI

duplicated domain logic

unexplained magic numbers
```

---

# 154. No Premature Architecture

Do NOT introduce:

```text
Redux

React Query

backend API layer

SQL ORM

microservices

dependency injection framework

event bus

GraphQL

Firebase
```

unless actually required.

Keep architecture clean but small.

---

# 155. Agent Execution Rules

The implementing agent MUST follow these rules:

1. Build Android-first.

2. Use React Native + TypeScript.

3. Use Expo with native development build where required.

4. Use React Native Paper / Material Design 3.

5. Do not install MUI web.

6. Use MMKV for persistent client data.

7. Use Zustand for application state.

8. Do not introduce SQL.

9. Do not introduce backend.

10. Do not introduce authentication.

11. Keep all core functionality offline.

12. Separate domain logic from UI.

13. Do not directly call native notification/calendar APIs throughout components.

14. Use service abstractions.

15. Do not make generic maintenance data appear manufacturer-certified.

16. User must be able to override maintenance intervals.

17. Do not assign universal tire-pressure PSI.

18. Store dates as ISO strings.

19. Persist schema version.

20. Implement storage migration infrastructure.

21. Prioritize clean UX over excessive visual effects.

22. Make animation subtle and smooth.

23. Avoid AI-looking gradients/glass effects.

24. Use reusable components when genuinely reusable.

25. Write unit tests for maintenance calculations.

26. Verify notifications and calendar on a physical Android device.

---

# 156. Definition of MVP Complete

The MVP is complete when this full journey works:

```text
Fresh install

↓

Add Yamaha NMAX

↓

Enter:
12,000 km

↓

Choose:
Blue motorcycle

↓

App creates suggested
maintenance schedule

↓

Home shows:
Engine Oil
due soon

↓

User updates odometer:
12,600 km

↓

Maintenance status recalculates

↓

User creates service reminder

↓

Enables notification

↓

Adds event to Android calendar

↓

Notification fires

↓

User opens notification

↓

Engine Oil detail opens

↓

User selects:
Mark as Done

↓

Enters:
12,800 km

↓

Maintenance history created

↓

Next engine oil target recalculated

↓

User closes application

↓

User reopens application

↓

All motorcycle,
maintenance,
history,
reminder,
and preference data remains
```

No:

```text
login
backend
internet
SQL
```

is required during the entire flow.

---

# 157. Product North Star

The application should ultimately feel like:

> **A clean personal garage that quietly remembers the important things about your motorcycle, so you don't have to.**

Every feature added to MVP should support that idea.

If a proposed feature makes the application noticeably more complicated without helping the user understand:

> **“What does my motorcycle need next?”**

it should probably not be part of the MVP.
