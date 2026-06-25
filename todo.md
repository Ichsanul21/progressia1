# Progressia — Complete SaaS-Ready Plan

## 🔴 P0 — Critical Security (blocks any production use)

### P0.1 Fix CalendarController data leak
- `app/Http/Controllers/CalendarController.php:15-18` — `orWhereNotNull('due_date')` breaks TenantScope. Wrap in closure: `->where(function($q) { $q->whereNotNull('start_date')->orWhereNotNull('due_date'); })`
- Same fix in `project()` method (lines 49-52)
- **Effort:** 2 lines, 1 file

### P0.2 Fix GenerateRecurringTasks crash
- `app/Console/Commands/GenerateRecurringTasks.php:26` — `$task->getLastGeneratedDate()` should be `$this->getLastGeneratedDate($task)`
- **Effort:** 1 line, 1 file

### P0.3 Add authorization to DocumentController
- `app/Http/Controllers/DocumentController.php:13` — `store()`: add `$this->authorize('create', [Document::class, $project])`
- `app/Http/Controllers/DocumentController.php:39` — `download()`: add `$this->authorize('download', $document)`
- `app/Http/Controllers/DocumentController.php:48` — `destroy()`: add `$this->authorize('delete', $document)`
- **Effort:** 3 lines, 1 file

### P0.4 Add authorization to VendorController
- `app/Http/Controllers/VendorController.php:30` — `store()`: add `$this->authorize('create', Vendor::class)`
- `app/Http/Controllers/VendorController.php:78` — `update()`: add `$this->authorize('update', $vendor)`
- `app/Http/Controllers/VendorController.php:121` — `destroy()`: add `$this->authorize('delete', $vendor)`
- `app/Http/Controllers/VendorController.php:129` — `restore()`: add `$this->authorize('restore', $vendor)`
- **Effort:** 4 lines, 1 file

### P0.5 Add authorization to SubVendorController
- `app/Http/Controllers/SubVendorController.php` — add `$this->authorize()` to store/update/destroy
- **Effort:** 3 lines, 1 file

### P0.6 Add authorization to Admin/UserController
- `app/Http/Controllers/Admin/UserController.php:24` — `store()`: add `$this->authorize('create', User::class)`
- **Effort:** 1 line, 1 file

### P0.7 Add ownership check to InvitationController::destroy()
- `app/Http/Controllers/InvitationController.php:94` — verify `$invitation->vendor_id === auth()->user()->vendor_id`
- **Effort:** 1 line, 1 file

### P0.8 Add ownership check to NotificationController::markRead()
- `app/Http/Controllers/NotificationController.php:39` — verify `$notification->user_id === auth()->id()` or use global scope
- **Effort:** 1 line, 1 file

### P0.9 Remove `role` and `vendor_id` from User.$fillable
- `app/Models/User.php:15-21` — remove `'role'` and `'vendor_id'` from `$fillable`
- Verify no code path passes these via mass assignment
- **Effort:** 1 line, 1 file

### P0.10 Add mime/size validation to document uploads
- `app/Http/Controllers/DocumentController.php:18` — add `'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,zip'` to file rule
- **Effort:** 1 line, 1 file

### P0.11 Add mime/size validation to cover image uploads
- `app/Http/Controllers/ProjectController.php:81-83` and `:160-164` — add `'mimes:jpg,jpeg,png,webp'` and `'max:2048'`
- **Effort:** 2 lines, 1 file

### P0.12 Scope SearchController by vendor
- `app/Http/Controllers/SearchController.php:46` — skip vendor search for non-super-admin users
- `app/Http/Controllers/SearchController.php:57` — scope client search to same vendor
- `app/Http/Controllers/SearchController.php:72` — Phase already scoped via TenantScope, Task query should scope by project
- **Effort:** 5-10 lines, 1 file

### P0.13 Configure Trusted Proxies
- `bootstrap/app.php` — add `$middleware->trustProxies(at: '*')`
- **Effort:** 1 line, 1 file

### P0.14 Configure CORS
- `config/cors.php` — create with allowed_origins, methods, headers
- **Effort:** create 1 config file

### P0.15 Lock down WebSocket channels
- `app/Events/NotificationCreated.php` — change `new Channel(...)` to `new PrivateChannel(...)`
- Add channel auth callback in `routes/channels.php`
- `config/reverb.php:85` — restrict `allowed_origins` to frontend domain
- **Effort:** 3 files, minor changes

### P0.16 Add rate limiting to registration
- `routes/auth.php:17` — add `->middleware('throttle:3,60')` on register POST route
- **Effort:** 1 line, 1 file

---

## 🟠 P1 — Multi-Tenant Isolation

### P1.1 Add vendor_id to Approval model + TenantScope
- Create migration: `add_vendor_id_to_approvals_table`
- `app/Models/Approval.php` — add `vendor_id` to `$fillable`, add TenantScope in `booted()`
- `app/Observers/TaskObserver.php` — pass `vendor_id` when creating approvals
- **Effort:** migration + model changes

### P1.2 Add vendor_id to child models + TenantScope
- Create migrations for: `task_comments`, `task_attachments`, `progress_updates`, `progress_photos`
- Add `vendor_id` column
- Update model files: add `vendor_id` to `$fillable`, add TenantScope in `booted()`
- Set `vendor_id` on create in controllers
- **Affected:** TaskComment, TaskAttachment, ProgressUpdate, ProgressPhoto
- **Effort:** 4 migrations + 4 model changes

### P1.3 Add TenantScope to ActivityLog
- `app/Models/ActivityLog.php` — add TenantScope (already has vendor_id in fillable)
- **Effort:** 1 file

### P1.4 Add auto-set vendor_id to SubVendor
- `app/Models/SubVendor.php` — add `creating` callback to auto-set `vendor_id` from auth user
- **Effort:** 4-5 lines, 1 file

### P1.5 Add $this->authorize() to read methods
- `app/Http/Controllers/ProjectController.php` — index, show, create, edit, trash, toggleFavorite
- `app/Http/Controllers/TaskController.php` — index, show, kanban, gantt, create, edit
- **Effort:** ~10 lines across 2 files

### P1.6 Add missing policy methods
- `app/Policies/TaskPolicy.php` — add `restore()` and `forceDelete()`
- `app/Policies/SubTaskPolicy.php` — same
- `app/Policies/PhasePolicy.php` — same
- `app/Policies/DocumentPolicy.php` — same
- `app/Policies/ApprovalPolicy.php` — add `view()`, `create()`, `update()`, `delete()`
- **Effort:** ~15 lines across 5 files

### P1.7 Scope SubTask.parent_id validation to same task
- `app/Http/Controllers/SubTaskController.php:21` — add parent_id scoped to same task_id
- **Effort:** 3-5 lines, 1 file

### P1.8 Add SoftDeletes + fix orphaned references
- Create migration adding `SoftDeletes` to `phases` and `documents` tables
- On phase delete: nullify `phase_id` on tasks or prevent deletion
- **Effort:** 2 migrations + 2 model changes + controller update

---

## 🟡 P2 — Data Integrity & Transactions

### P2.1 Wrap TaskController multi-step ops in transactions
- `app/Http/Controllers/TaskController.php:234-256` — update + progress creation + photo storage + recalculation
- `app/Http/Controllers/TaskController.php:266-275` — delete + recalculation
- **Effort:** 6 lines, 1 file

### P2.2 Wrap SubTaskController CRUD in transactions
- `app/Http/Controllers/SubTaskController.php` — store, update, destroy
- **Effort:** ~9 lines, 1 file

### P2.3 Wrap PhaseController::destroy() in transaction
- `app/Http/Controllers/PhaseController.php:60-63`
- **Effort:** 3 lines, 1 file

### P2.4 Fix RabItemController::import() — add transaction
- `app/Http/Controllers/RabItemController.php:87-168`
- **Effort:** 5-10 lines, 1 file

### P2.5 Fix exit anti-pattern in exports
- `app/Http/Controllers/RabItemController.php:195` and `:233`
- **Effort:** 2 lines, 1 file

### P2.6 Fix InvitationController silent mail failure
- `app/Http/Controllers/InvitationController.php:68-70`
- **Effort:** 2-3 lines, 1 file

### P2.7 Fix inconsistent update() vs updateQuietly()
- `app/Models/Project.php:172` and `:185`
- **Effort:** 2 lines, 1 file

---

## 🔵 P3 — Frontend Completion (ESLint → zero)

### P3.0 Add warning/success Badge variants (systemic fix)
- [x] `resources/js/components/ui/badge.tsx` — added `warning` and `success` variant styles

### P3.1 tasks/edit.tsx — Camera icon button
- [x] `resources/js/pages/tasks/edit.tsx` — added `Camera` lucide icon + htmlFor on label

### P3.2 tasks/calendar.tsx — today indicator
- [x] already had today styling + button in toolbar

### P3.3 tasks/show.tsx — inline comment form + TaskDependency type
- [x] comment form present (lines 486-510)
- [x] extracted `TaskDependency` interface for `dependent_tasks`/`depends_on_tasks`

### P3.4 tasks/inbox.tsx — filter bar + typed props
- [x] already had filter bar + typed props

### P3.5 tasks/gantt.tsx — zoom + dependency toggle
- [x] zoom (Day/Week/Month/Year) wired
- [ ] dependency toggle deferred — requires server to send `dependencies` on tasks (separate scope)

### P3.6 tasks/index.tsx — search bar
- [x] `resources/js/pages/tasks/index.tsx` — added search input + form, controller now filters by `name`/`description`

### P3.7 tasks/kanban.tsx — wire cards + status colors
- [x] cards wired
- [x] added `statusColors` map + status badge alongside priority badge

### P3.8 projects/show.tsx — TagInput + Users icon
- [x] added `TagInput` import + edit-tags Card gated by `can.update`
- [x] added `Users` icon to Team card title
- [x] new POST route `projects.tags.update` + `ProjectController::updateTags`

### P3.9 projects/trash.tsx — force-delete + description
- [x] already implemented

### P3.10 rab/index.tsx — Badge + importData display
- [x] `resources/js/pages/rab/index.tsx` — added `Badge` import + `importSummary` state, parsed from flash message, shown in import card

### P3.11 vendors/index.tsx — search bar
- [x] already had search bar

### P3.12 sub-vendors/index.tsx — isSuperAdmin gate
- [x] `resources/js/pages/sub-vendors/index.tsx` — added `usePage` + `isSuperAdmin` derivation, gate Edit/Delete buttons

### P3.13 settings/sessions.tsx — CardContent
- [x] `resources/js/pages/settings/sessions.tsx` — added `CardContent` import, moved IP/last-activity to CardContent, added aria-label to logout button

### P3.14 Add network error handling to forms
- [ ] deferred — requires per-form refactor with shared error toast (separate scope, larger)

### P3.15 Fix 2FA page — replace fetch() with router
- [x] `resources/js/pages/settings/two-factor.tsx` — kept fetch (Fortify endpoints return raw JSON, `router.get` would fail) but added proper error handling with `fetchError` state + UI display + Accept header

### P3.16 Create missing global calendar page
- [x] already implemented

### P3.17 Add frontend form validation
- [ ] deferred — would require adding zod/react-hook-form (separate scope, larger)

### P3.18 Add aria-labels to icon-only buttons
- [x] partial — added aria-labels to icon buttons in fixed files (sessions logout, tasks/index search)
- [ ] deferred — full sweep would be a separate scope

### P3.19 Remove leftover dead imports
- [x] `resources/js/pages/projects/trash.tsx` — added missing `useState` import
- [x] `resources/js/pages/tasks/show.tsx` — collapsed double `Trash2` import

---

## 🟢 P4 — Test Coverage

### P4.1 Critical flow tests (Approval, Phase, RabItem, BatchTask, TaskComment, TaskAttachment, TaskDependency, SubTask)
### P4.2 Authorization/role tests (cross-vendor, role gating)
### P4.3 Validation failure tests
### P4.4 Observer tests (TaskObserver, SubTaskObserver)
### P4.5 Command test (GenerateRecurringTasks)
### P4.6 Calendar/Search tenant scoping tests

---

## ⚪ P5 — Production Operations

### P5.1 Log rotation (LOG_STACK=daily)
### P5.2 Queue supervisor config
### P5.3 Rate limiting on non-auth endpoints
### P5.4 Reverb rate limiting
### P5.5 Document all env vars in .env.example
### P5.6 Cache driver (file or redis)
### P5.7 Fix NPM dependency split
### P5.8 tsc --noEmit + composer audit in CI
### P5.9 Enable strict TS options after P3 done

---

## 🚀 Landing Page + Registrant Flow

Locked plan, ready to execute. Replaces `welcome.tsx` with full marketing landing (inspired by lateral.framer.media structure) and adds a public registration request flow that routes new pendaftar to a super_admin-only admin menu, with optional convert-to-User action and WhatsApp contact button.

Reference summary (from prior plan discussion):
- Bahasa Indonesia first, EN later
- Audience: dual-track (hero generic + 4 vertical use cases: Konstruksi, Agensi/Konsultan, Internal Team, Manufaktur)
- Fonts: Instrument Serif (reg + italic) + Space Grotesk (existing) + Geist Mono (400 + 500)
- Tone: mix light + dark sections (testimonial and final CTA dark)
- Loading splash: word-by-word typewriter reveal "Progressia." ~2s, sessionStorage skip on revisit
- Photos: Unsplash + Pexels, downloaded locally to `public/landing/photos/*.webp`
- Hero: split layout (headline left, photo right)
- No pricing section
- WA contact target for super_admin to pendaftar: `+62 812-5807-0694` (or each registrant's own phone)
- Register flow: form → `registrants` table (status pending) → super_admin manages
- Form fields: name, email, phone, company_name, industry (select), team_size (select), source (select), message, honeypot (hidden)
- Status enum: pending, contacted, converted, rejected
- Duplicate rules: email in users → reject, pending in registrants → reject, rejected status → allow re-submit
- Convert: dialog pick role + vendor_id + sub_vendor_id, reuse `Admin\UserController::store` logic, then auto-show toast with WA credential template button
- Status update on WA chat: manual (super_admin sets pending → contacted/rejected via dropdown)
- Notifications: sidebar badge count + Laravel Reverb real-time broadcast toast for super_admin

### L1.1 Install dependencies
- Run `npm install` for: `framer-motion`, `@radix-ui/react-accordion`, `sonner` (check `package.json` first, skip if already present)
- Verify `laravel-echo` and `pusher-js` are present (per AGENTS.md they should be, but confirm before subscribing to channels)
- **Effort:** 1 command + package.json edit if needed

### L1.2 Add fonts to app.css
- `resources/css/app.css` — `@import` Instrument Serif (italic + regular, weight 400) and Geist Mono (weight 400 + 500) from Google Fonts
- Add `--font-display: 'Instrument Serif', ui-serif, Georgia, serif;` and `--font-mono: 'Geist Mono', ui-monospace, monospace;` in `@theme` block
- **Effort:** 4 lines

### L2.1 Create registrants table migration
- New: `database/migrations/2026_06_19_000001_create_registrants_table.php`
- Columns: id, name (100), email (150), phone (20), company_name (150), industry (32), team_size (16), source (32), message text nullable, status string (16) default 'pending', reviewed_by foreignId nullable → users nullOnDelete, reviewed_at timestamp nullable, converted_user_id foreignId nullable → users nullOnDelete, contacted_at timestamp nullable, timestamps
- Indexes on `status` and `email`
- **Effort:** 1 migration file

### L2.2 Registrant model
- New: `app/Models/Registrant.php`
- `$fillable`: all form fields + status fields
- Relations: `reviewedBy()` → User, `convertedUser()` → User
- Scope: `scopePending()`
- Casts: `reviewed_at` datetime, `contacted_at` datetime
- **Effort:** 1 model file

### L2.3 Registrant policy
- New: `app/Policies/RegistrantPolicy.php`
- Methods: `viewAny`, `view`, `update`, `delete`, `convert` — all return `$user->isSuperAdmin()`
- (create/store is public, no policy check)
- Register in `app/Providers/AppServiceProvider.php` policies array
- **Effort:** 1 policy file + 1 line in provider

### L2.4 Broadcast event
- New: `app/Events/RegistrantSubmitted.php`
- `implements ShouldBroadcast`
- `broadcastOn()`: returns `new PrivateChannel('admin.registrants')`
- `broadcastWith()`: returns array with id, name, email, company_name, phone, created_at
- `broadcastAs()`: returns `'registrant.submitted'`
- **Effort:** 1 event file

### L3.1 RegistrantController
- New: `app/Http/Controllers/RegistrantController.php`
- `create()` public: render `auth/register` Inertia page
- `store(Request)` public:
  - Validate name, email, phone (regex `^\+628\d{8,11}$`), company_name, industry (in enum), team_size (in enum), source (in enum), message nullable, honeypot field `website` must be empty
  - If `website` honeypot filled, return success response without creating (silent reject)
  - Duplicate handling: reject if email exists in `users` table, reject if email exists in `registrants` with status `pending` or `contacted`, allow if previous status was `rejected`
  - Create row with status `pending`
  - Dispatch `RegistrantSubmitted::dispatch($registrant)`
  - Return Inertia render success state or redirect with flash
- `index(Request)` super_admin: paginated list with filter status + search
- `show(Registrant)` super_admin: detail (optional, can be dialog from index)
- `updateStatus(Request, Registrant)` super_admin: change status (only pending → contacted/rejected via dropdown), set `contacted_at` if contacted, set `reviewed_by` + `reviewed_at`
- `convert(Request, Registrant)` super_admin:
  - Validate role (in allowed roles), vendor_id (required unless role=super_admin), sub_vendor_id (required if role=sub_vendor)
  - Reuse same logic as `Admin\UserController::store`: create User with default password `'password'`, `must_change_password=true`, `password_changed_at=null`
  - Update registrant: `status='converted'`, `converted_user_id=$user->id`, `reviewed_by`, `reviewed_at`
  - Return back with success flash + payload containing user phone + credential template message
- `destroy(Registrant)` super_admin: hard delete
- **Effort:** 1 controller file, ~150 lines

### L3.2 Routes for register flow
- `routes/auth.php` — add inside guest middleware group:
  - `Route::get('register', [RegistrantController::class, 'create'])->name('register')`
  - `Route::post('register', [RegistrantController::class, 'store'])->middleware('throttle:3,60')`
- `routes/admin.php` — add inside super_admin role group:
  - `Route::resource('registrants', RegistrantController::class)->only(['index', 'show', 'destroy'])`
  - `Route::patch('registrants/{registrant}/status', [RegistrantController::class, 'updateStatus'])->name('registrants.update-status')`
  - `Route::post('registrants/{registrant}/convert', [RegistrantController::class, 'convert'])->name('registrants.convert')`
- **Effort:** 2 route files, ~6 lines

### L3.3 Authorize broadcast channel
- `routes/channels.php` — add `Broadcast::channel('admin.registrants', fn ($user) => $user->isSuperAdmin())`
- **Effort:** 1 line

### L4.1 Share pending count globally
- `app/Http/Middleware/HandleInertiaRequests.php` — add to `share()` array a callable that returns `pendingRegistrantsCount`
- Compute only if `$request->user()?->isSuperAdmin()`, else return 0 (skip DB query)
- Query: `Registrant::where('status', 'pending')->count()`
- **Effort:** 5 lines

### L5.1 Loading splash
- New: `resources/js/components/landing/loading-splash.tsx`
- Use `framer-motion` `AnimatePresence`
- Word-by-word reveal of "Progressia." with stagger 100ms per char/syllable
- Total duration ~1.8s, then fade out 400ms
- On mount: check `sessionStorage.getItem('landing-splash-shown')`; if true, skip render. After splash done, set the flag
- Props: `onComplete` callback
- **Effort:** ~60 lines

### L5.2 Nav
- New: `resources/js/components/landing/nav.tsx`
- Sticky position, full width, padding
- On mount: transparent bg. On scroll past hero: `backdrop-blur` + bg-background/80 opacity transition
- Layout: logo left, nav links center (Fitur, Solusi, FAQ), CTA right (Login + Daftar)
- Mobile: hamburger menu (Sheet component from existing UI lib)
- **Effort:** ~80 lines

### L5.3 Announcement bar
- New: `resources/js/components/landing/announcement-bar.tsx`
- Thin strip above nav, cyan accent background, small text + dismiss button
- Placeholder text: "Progressia 2.0 dengan dukungan multi sub-vendor sudah rilis"
- Dismiss state persisted in `localStorage`
- **Effort:** ~40 lines

### L5.4 Hero
- New: `resources/js/components/landing/hero.tsx`
- Split layout: headline + sub + CTAs left (col-span-7), photo right (col-span-5)
- Eyebrow above headline: small mono font label
- Headline: large Instrument Serif, mix italic for emphasis word(s)
- Sub: paragraph in Space Grotesk
- CTAs: Login (primary) + Daftar Sekarang (outline) → routes to `/login` and `/register`
- Photo: stub `<div className="aspect-[4/3] bg-gradient">` placeholder until real photo provided
- Animation: stagger reveal eyebrow → headline (word by word) → sub → CTAs → photo (fade in from right)
- **Effort:** ~100 lines

### L5.5 Stats strip
- New: `resources/js/components/landing/stats.tsx`
- 3 metric blocks, grid 3 columns
- Each block: big mono number + cyan accent + label below
- Metrics (placeholder, abstract improvement framing):
  - "80%" lebih cepat update progress vs Excel
  - "60%" hemat waktu rekap RAB
  - "10×" lebih cepat track multi-vendor
- Animate counter from 0 → target on `whileInView` using `useMotionValue` + `useTransform` + `animate`
- **Effort:** ~70 lines

### L5.6 Features trio
- New: `resources/js/components/landing/features.tsx`
- 3 vertical cards, each: number label (01/02/03) in mono + title + description + small photo + "Pelajari" link (placeholder)
- Cards:
  - 01 — Gantt, Kanban, Kalender. Visualisasi proyek dari berbagai sudut.
  - 02 — Multi-Vendor & Sub-Vendor. Kelola tim internal dan kontraktor pihak ketiga dalam satu workspace.
  - 03 — Progress Real-time dengan Foto. Update lapangan langsung dengan dokumentasi visual.
- Animation: stagger fade-up on view
- **Effort:** ~90 lines

### L5.7 Solutions tabs
- New: `resources/js/components/landing/solutions.tsx`
- 4 vertical tabs left (list), detail panel right
- Tabs: Konstruksi, Agensi/Konsultan, Internal Team, Manufaktur
- Each detail: photo + headline + description + bullet list of 3-4 key features
- Active tab: cyan border accent, mono number label
- Animation: cross-fade between detail panels
- **Effort:** ~120 lines

### L5.8 Testimonials
- New: `resources/js/components/landing/testimonials.tsx`
- Section dark bg (`bg-sidebar-background` or custom navy)
- 3 quote cards in grid
- Each card: italic quote (Instrument Serif italic), name + role + company (Space Grotesk), small portrait photo
- Names (Indonesian fictional placeholder):
  - Budi Santoso, Direktur, PT Konstruksi Nusantara
  - Sri Rahayu, Project Manager, CV Bangun Jaya
  - Andre Wijaya, Owner, Agensi Kreatif Indonesia
- Animation: stagger reveal on view
- **Effort:** ~90 lines

### L5.9 FAQ
- New: `resources/js/components/landing/faq.tsx`
- Use `@radix-ui/react-accordion` (install if needed)
- 5 questions/answers (placeholder Indonesian copy):
  - Berapa lama setup Progressia?
  - Apakah data proyek saya aman?
  - Apakah Progressia mendukung multi-tenant?
  - Bagaimana sub-vendor mengupdate progress?
  - Apakah ada free trial?
- **Effort:** ~80 lines

### L5.10 Final CTA
- New: `resources/js/components/landing/final-cta.tsx`
- Section dark bg + cyan accent
- Big headline + sub + 1 CTA "Daftar Sekarang" → `/register`
- Optional: background photo low opacity overlay
- **Effort:** ~50 lines

### L5.11 Footer
- New: `resources/js/components/landing/footer.tsx`
- Dark bg
- 4 columns: Produk (Fitur, Solusi, FAQ), Perusahaan (Tentang, Blog, Kontak), Sumber Daya (Dokumentasi, Status), Legal (Privasi, Syarat)
- Logo + tagline left
- Social icons + copyright bottom
- **Effort:** ~80 lines

### L6.1 Landing page composition
- New: `resources/js/pages/landing.tsx`
- Compose: LoadingSplash → AnnouncementBar → Nav → Hero → Stats → Features → Solutions → Testimonials → FAQ → FinalCTA → Footer
- Smooth scroll behavior, intersection observers for nav active state (optional)
- No AppLayout wrapper (landing uses own custom layout)
- **Effort:** ~50 lines

### L6.2 Switch root route to landing
- `routes/web.php` — change `Route::get('/', ...)` to render `Inertia::render('landing')` with name `home`
- Remove old welcome reference
- **Effort:** 2 lines

### L7.1 Register form page
- New: `resources/js/pages/auth/register.tsx` (recreate with new semantics: registration request, not account creation)
- Form fields:
  - name (text, required)
  - email (email, required)
  - phone (use existing `PhoneInput` component, required)
  - company_name (text, required)
  - industry (Select: konstruksi, agensi_konsultan, internal_team, manufaktur, lainnya)
  - team_size (Select: 1-5, 6-20, 21-50, 50+)
  - source (Select: google, referral, social_media, iklan, lainnya)
  - message (Textarea, optional)
  - website (hidden honeypot)
- Use `AuthLayout` for consistency with login/forgot-password
- Submit handler: `post(route('register'))`, on success show "Pendaftaran terkirim. Admin akan menghubungi via WhatsApp dalam 1×24 jam."
- Link back to `/login`
- **Effort:** ~180 lines

### L7.2 Login page link to register
- `resources/js/pages/auth/login.tsx` — add footer text "Belum punya akun? Daftar di sini" with `TextLink href={route('register')}` (this was removed earlier when public registration was disabled)
- **Effort:** 5 lines

### L8.1 Registrants index page
- New: `resources/js/pages/admin/registrants/index.tsx`
- List with pagination
- Filter: status dropdown (all, pending, contacted, converted, rejected) + search by name/email/company
- Columns: Nama, Email, Phone, Company, Industri, Tgl, Status (badge), Actions
- Status badge color: pending=amber, contacted=blue, converted=green, rejected=red
- Actions per row:
  - Chat WA: opens `wa.me/{phone tanpa +}?text=<encoded template halo terima kasih daftar>` in new tab, includes name + company in template
  - Convert (only if status pending or contacted): opens convert dialog
  - Status dropdown: change to contacted/rejected (only if pending or contacted)
  - Delete: confirm dialog
- **Effort:** ~250 lines

### L8.2 Convert dialog
- Inline in registrants/index.tsx (or separate component if it grows)
- Modal form: role (Select from allowed roles), vendor_id (Select), sub_vendor_id (conditional Select if role=sub_vendor)
- Submit → POST `route('admin.registrants.convert', registrant.id)`
- On success: close dialog, show toast with success message + button "Kirim Kredensial via WhatsApp" that opens `wa.me/{phone}?text=<credential template>` (auto-show, super_admin clicks)
- Template: "Halo {name}, akun Progressia Anda sudah aktif. Email: {email}, Password: password, Login: {APP_URL}/login. Wajib ganti password setelah login pertama."
- **Effort:** ~120 lines (inside index file or separate)

### L9.1 Registrant notifications hook
- New: `resources/js/hooks/use-registrant-notifications.ts`
- Subscribe to `window.Echo.private('admin.registrants').listen('.registrant.submitted', callback)`
- On event: increment local badge count (or trigger Inertia partial reload), show toast via `sonner` library
- Cleanup on unmount
- Guard: only subscribe if user is super_admin
- **Effort:** ~50 lines

### L9.2 Sidebar add Pendaftar menu + badge
- `resources/js/components/app-sidebar.tsx` — add menu item "Pendaftar" → `/admin/registrants` for super_admin
- Read `pendingRegistrantsCount` from Inertia shared props
- Show small badge next to label when count > 0 (cyan or amber pill with number)
- Wire up `useRegistrantNotifications()` hook to receive real-time updates
- **Effort:** ~30 lines

### L10.1 Delete welcome.tsx
- `resources/js/pages/welcome.tsx` — delete file
- Verify no other reference to `welcome` exists
- **Effort:** 1 file deletion

### L11.1 Asset stub + URL list
- Create `public/landing/photos/` directory
- Stub placeholder gradient SVGs for each slot so layout renders cleanly before real photos exist
- Provide list of suggested Unsplash + Pexels URLs covering: hero (engineer/dashboard), 3 features (gantt/team/site), 4 solutions (building/office/workspace/factory), 3 testimonial portraits, 1 final CTA background
- User downloads manually, compresses to WebP (~150KB each), places in `public/landing/photos/`
- **Effort:** stub generation + URL list documentation in a separate `LANDING_ASSETS.md` or appended here

### L12.1 RegistrantSubmissionTest
- New: `tests/Feature/RegistrantSubmissionTest.php`
- Tests:
  - test_valid_submission_creates_pending_row
  - test_duplicate_email_in_users_rejected
  - test_duplicate_pending_email_rejected
  - test_rejected_status_email_can_resubmit
  - test_invalid_phone_format_rejected
  - test_honeypot_filled_silent_reject (no row created, response 200)
  - test_throttle_limit_enforced (4th request within 60s → 429)
  - test_event_dispatched_on_success (Event::fake + assertDispatched RegistrantSubmitted)
- **Effort:** ~150 lines

### L12.2 RegistrantAdminTest
- New: `tests/Feature/RegistrantAdminTest.php`
- Tests:
  - test_non_super_admin_cannot_access_registrants
  - test_super_admin_can_list_registrants
  - test_super_admin_can_filter_by_status
  - test_update_status_sets_contacted_at_and_reviewed_by
  - test_convert_creates_user_with_default_password_and_force_flag
  - test_convert_updates_registrant_status_and_converted_user_id
  - test_convert_validates_sub_vendor_id_for_sub_vendor_role
  - test_destroy_removes_registrant
- **Effort:** ~180 lines

### L12.3 LandingPageTest
- New: `tests/Feature/LandingPageTest.php`
- Tests:
  - test_root_renders_landing_component
  - test_register_form_is_publicly_accessible
  - test_welcome_route_does_not_exist (404 or asserts page name not 'welcome')
- **Effort:** ~30 lines

### L13.1 Lint + format + tests + build
- Run `npm run lint`
- Run `npm run format`
- Run `php artisan test`
- Run `npm run build`
- Fix any issues sequentially until all clean
- **Effort:** variable, ~10-30 min depending on issues

### L14.1 Photo URL deliverable
- Create or append to a doc (e.g. `LANDING_ASSETS.md`) with curated list of suggested Unsplash + Pexels URLs grouped by section, with keywords and recommended dimensions, ready for user to download
- **Effort:** ~1 page of links

---

## ✅ Completed (from prior work)

- [x] Groups A-F — bug fixes and audit items
- [x] Package upgrades (Vite 8, React 19, TS 6, Tailwind 4, etc.)
- [x] RAB feature (CRUD + import/export)
- [x] Phase 1: Progress Documentation (photos per task/subtask)
- [x] Phase 2: Collaboration (comments + @mentions)
- [x] Auth overhaul: remove invitation flow, disable public registration, add force password change, add SubVendor user role + scope, add phone field + WA helper, expand admin user CRUD with reset password and pick-existing dialog (Jun 2026)

---

## 📌 Current session — 2026-06-18 (history unification + 403 redirect + bug fix)

### Group 1 — Bug fix: `canCreate` / `canUpdate` ReferenceError

- `resources/js/pages/projects/index.tsx` — Props interface was missing `canCreate?: boolean` and `canUpdate?: boolean` while JSX used both. Resulted in `Uncaught ReferenceError: canCreate is not defined` at runtime. Controller already passed both. Added both to Props interface and component destructuring.

### Group 2 — 403 redirect with toast (AuthorizationException handler)

- `bootstrap/app.php` — registered `withExceptions()` handler for `\Illuminate\Auth\Access\AuthorizationException`. Only fires for Inertia XHR requests (`X-Inertia` header). Redirects to `Referer` if present, otherwise `route('dashboard')` as fallback. Flash message: `Anda tidak memiliki akses ke halaman ini.`
- `resources/js/hooks/use-flash-toasts.ts` — new hook + `<FlashToaster />` component that listens to `usePage().props.flash` and surfaces `success/error/warning/info` to sonner toast. Mounted in `app.tsx`.
- `resources/js/app.tsx` — added `<Toaster position="bottom-right" richColors closeButton />` mount (was missing entirely; existing `toast.success` calls in `registrants/index.tsx` and `sub-vendor-users/index.tsx` were no-ops).

### Group 3 — Field-level diff descriptions in observers

- `app/Observers/TaskObserver.php` — new `describeChanges()` helper produces field-level diff like `"status: in_progress → review, progress: 25% → 50%, description updated"`. Replaces bare `"Task 'X' updated"` log description.
- `app/Observers/SubTaskObserver.php` — same helper for sub-task. Existing `status_changed` / `progress_changed` event types retained but descriptions normalized to same format.

### Group 4 — Unified timeline endpoint

- `app/Http/Controllers/TaskController.php` — new `timeline(Request, Project, Task)` method. Combines task activity logs + task progress updates + sub-task activity logs + sub-task progress updates into a single sorted array. Params: `?type=all|activity|progress&q=&offset=`. Returns `{ entries, has_more, total, offset }`. No hard max — client paginates on scroll.
- `routes/projects.php` — new route `GET /projects/{project}/tasks/{task}/timeline` named `tasks.timeline`. Limit 50 per request.
- `TaskController::show()` — eager loads `subTasks.activityLogs` with `user:id,name`.

### Group 5 — Frontend: TaskHistory component (search + filter + infinite scroll)

- New `resources/js/components/history-entry.tsx` — shared single-entry renderer: type badge, user avatar, timestamp, description, field-diff table (one row per changed key: `field: old → new`), photo thumbnail grid (4 cols). Used in both task and sub-task views.
- New `resources/js/components/task-history.tsx` — wraps `HistoryEntry`. Search input with 150ms debounce, type filter pills (`all`/`activity`/`progress`), `IntersectionObserver` infinite scroll. Initial entries from props, lazy-load more on sentinel intersect.
- `resources/js/pages/tasks/show.tsx` — replaced old toggle-style Activity History card with always-visible `History` card containing `<TaskHistory>`. Removed `getEventIcon` and `ActivityLog` interface. Updated `TaskData` interface to include `sub_tasks: SubTaskWithHistory[]` (with activity_logs + progress_updates). `buildInitialEntries()` helper derives initial 50 entries from props (progress updates only, activity logs fetched on first filter).

### Group 6 — Sub-task inline history toggle

- `resources/js/components/sub-task-tree.tsx` — new `historyExpanded: Set<number>` state. Each sub-task row gets a "History" toggle button (next to add/delete actions, group-hover visible). Click expands an inline section below the row showing that sub-task's own activity + progress updates using `HistoryEntry`. Collapsed by default. `SubTaskData` interface extended with `activity_logs`.

### Group 7 — Minor cleanups

- `resources/js/pages/tasks/show.tsx` — removed unused `ActivityLog` interface, `getEventIcon` function, `showHistory` state, and standalone Activity History card. Removed `History` button from toolbar (now always-on at bottom of page).

### Verify results (2026-06-18)

- `npm run lint` — clean
- `npm run format:check` — clean (via `npm run format`)
- `npm run build` — successful
- `php artisan test` — 229 passed, 0 failed

### Files modified in this session

Backend: `bootstrap/app.php`, `app/Http/Controllers/TaskController.php` (timeline method), `app/Observers/TaskObserver.php`, `app/Observers/SubTaskObserver.php`, `routes/projects.php`.

Frontend: `resources/js/app.tsx`, `resources/js/pages/projects/index.tsx` (Props fix), `resources/js/pages/tasks/show.tsx`, `resources/js/components/sub-task-tree.tsx`.

New: `resources/js/hooks/use-flash-toasts.ts`, `resources/js/components/history-entry.tsx`, `resources/js/components/task-history.tsx`.

---

## 📌 Current session — 2026-06-18 (revisi status + universal Update Progress modal)

### Group 1 — Status enum "revisi" + strict transition rules

- New status: `revisi` added to `tasks.status` and `sub_tasks.status` enums.
- Transition matrix (non-admin strict):
  - `not_started` -> `in_progress`
  - `in_progress` -> `review`
  - `review` -> `done` (forward) | `revisi` (branch)
  - `revisi` -> `review` (only)
  - `done` -> terminal
- Admin: any transition.
- Validation logic in `TaskController::validateStatusTransition()` and `SubTaskController::validateStatusTransition()`.

### Group 2 — Sub-task status enum (replaces `is_completed`)

- Migration `2026_06_18_000006_add_status_to_sub_tasks_table`:
  - Add `status` column default `not_started`
  - Backfill: `is_completed=true` -> `status=done`
  - Drop `is_completed`
- `SubTask` model: `STATUSES` const, `STATUS_PROGRESS` map (not_started/revisi=0, in_progress=25, review=50, done=100), drop `is_completed` fillable/cast, add `updater()` relation.
- `recalculateProgress()` uses status mapping for leaf, AVG for parent.

### Group 3 — Permission model (PM full edit + Team modal only)

| Role | Edit full | Update Progress modal | Create | Delete |
|---|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ | ✓ |
| admin_vendor | ✓ | ✓ | ✓ | ✓ |
| project_manager | ✓ (incl. dates) | ✓ | ✓ | ✓ |
| team | ✗ | ✓ | ✗ | ✗ |
| sub_vendor | ✗ | ✓ (own) | ✗ | ✗ |
| client | ✗ | ✗ | ✗ | ✗ |

- `TaskPolicy::update()`: admin + PM (Team removed from full edit, only via modal)
- `TaskPolicy::updateProgress()` NEW: admin + PM + Team + sub_vendor (own)
- `TaskPolicy::delete()`: admin + PM (PM can delete)
- `SubTaskPolicy` same pattern.
- `ProjectPolicy::create/update/delete` -> admin only.

### Group 4 — Universal Update Progress modal

- New endpoint `PUT /projects/{p}/tasks/{t}/progress` (TaskController::updateProgress).
- New endpoint `PUT /projects/{p}/tasks/{t}/sub-tasks/{st}/progress` (SubTaskController::updateProgress).
- New component `resources/js/components/update-progress-modal.tsx`:
  - Status dropdown: only valid next transitions for non-admin, all for admin.
  - Photo required for non-admin.
  - Description required when status changes.
  - Admin "Update administratif" toggle to skip photo.
- Routes added in `routes/projects.php`.
- `tasks/show.tsx`: Update Progress button (universal) + Edit button (PM/admin only).
- `tasks/index.tsx`: per-task Update Progress button + status filter includes `revisi`.
- `tasks/kanban.tsx`: per-card TrendingUp icon button + 5-column layout (added revisi column).
- `sub-task-tree.tsx`: replaced `is_completed` checkbox with status badge + status select in modal.

### Group 5 — Bug B fix + observability

- Fix B: `TaskController::edit()` adds `Request $request` param (was missing, causing 500 error).
- `TaskObserver::updated()` tracks more fields: description, start_date, due_date, phase_id, sub_vendor_id, is_recurring, recurrence_*.
- `SubTaskObserver` rewritten to use status + add status_changed event type.

### Verify results (2026-06-18)

- `php artisan migrate` — sub_tasks.status migration applied clean
- `php artisan test` — pending (existing tests may need updates for is_completed removal)
- `npm run lint` — pending
- `npm run format:check` — pending
- `npm run build` — pending

### Files modified in this session

Backend: `TaskController`, `SubTaskController`, `ProjectController`, `TaskPolicy`, `SubTaskPolicy`, `ProjectPolicy`, `SubTask` model, `User` model, `TaskObserver`, `SubTaskObserver`, `routes/projects.php`.

Frontend: `tasks/show.tsx`, `tasks/index.tsx`, `tasks/kanban.tsx`, `tasks/edit.tsx`, `sub-task-tree.tsx`, `projects/show.tsx`, `projects/index.tsx`.

New: `database/migrations/2026_06_18_000006_add_status_to_sub_tasks_table.php`, `resources/js/components/update-progress-modal.tsx`.

Docs: `database-schema.md`, `AGENTS.md`, `todo.md`.

---

## 📌 Current session — 2026-06-18 (UI/UX + workflow + upload security)

### Group 1 — Sidebar, scrollbar, theme toggle, landing navbar (DONE, verified)

- **Sidebar grouping**: `app-sidebar.tsx` + `nav-main.tsx` replaced flat list with `NavGroup[]` (Operasional, Perencanaan, Administrasi). Simple `Collapsible` per group with `defaultOpen`, no localStorage, no accordion. Icons per group: Activity, ClipboardList, ShieldCheck. Label styling: uppercase tracking-wider, `text-sidebar-primary` icon, `ChevronDown` rotates on collapse.
- **Custom scrollbar**: `resources/css/app.css` adds global rules using `color-mix(in srgb, var(--primary) 30%, transparent)` for thumb, full `var(--primary)` on hover, 8px width, rounded. Note: the initial `hsl(var(--primary) / 0.3)` was invalid CSS (nested `hsl()`) so the entire rule was being ignored. Fixed by switching to `color-mix()`.
- **Theme toggle**: New `resources/js/components/appearance-header-toggle.tsx` (Sun/Moon only, no System). Mounted in `app-sidebar-header.tsx` next to breadcrumb. Resolves actual current theme via `documentElement.classList.contains('dark')` so it works correctly even when saved preference is `system`.
- **Landing navbar overlap**: `landing/nav.tsx` changed from `fixed` to `sticky top-0`. `landing.tsx` wraps `AnnouncementBar` + `LandingNav` in single `<header className="sticky top-0 z-50">` so they stack instead of overlapping. `announcement-bar.tsx` dropped `relative isolate` (parent handles stacking).
- **SelectItem value="" fix**: Radix Select rejects empty string (reserved for clearing). Changed in `admin/team/index.tsx`, `admin/project-managers/index.tsx`, `admin/sub-vendor-users/index.tsx` to use sentinel `"all"` + map in `onValueChange` to `""` so `updateFilter` deletes the filter URL param.

### Group 2 — Task workflow (PM/Team/admin) (DONE, verified)

- **`User::canManageSchedule()` helper**: `isAdminOrAbove() || isProjectManager()`. Encapsulates "can change dates / create task/sub-task" rule. Used in `TaskController::update`, `TaskController::edit` (via `canChangeDates` prop), and gate on `canCreate` UI.
- **Team update access**: `TaskPolicy::update()` and `SubTaskPolicy::update()` now include `isTeam()`. Previously Team was blocked entirely.
- **Strict status transitions**: `TaskController::update()` enforces `$next = ['not_started' => 'in_progress', 'in_progress' => 'review', 'review' => 'done']` for non-admin. Any other transition (skip, backward, same) returns 422. Admin bypasses check.
- **Date lockdown**: `TaskController::update()` unsets `start_date`, `due_date`, `recurrence_end_date` from validated data if `!canManageSchedule()`. PM allowed (per user clarification), Team/sub_vendor/client blocked. UI in `tasks/edit.tsx` disables date inputs + helper text "Hanya admin/PM yang bisa mengubah tanggal."
- **Last updater tracking**: New migration `2026_06_18_000005_add_updated_by_to_tasks_table` adds nullable FK `updated_by` to `users`. `Task` model gains `updater()` belongsTo relation. `TaskController::update()` sets `validated['updated_by'] = $user->id` before save. `TaskController::show()` eager loads `updater:id,name`. `tasks/show.tsx` interface adds `updated_by` field, Details card shows "Last updated by" row.
- **UI guards** (UI button visibility, controller 403 in background):
  - `tasks/show.tsx`: Edit button gated by `can.update`. SubTaskTree receives `canCreate={can.create}`. Attachment download via `task-attachments.download` route (not direct URL).
  - `tasks/index.tsx`: New Task + Edit + "Create your first task" buttons all gated.
  - `tasks/kanban.tsx`: New Task gated by `canCreate`.
  - `tasks/edit.tsx`: New `canChangeDates` prop, disables date inputs for non-schedule-managers.
  - `sub-task-tree.tsx`: New `canCreate` prop, gates "Add sub-task" buttons.

### Group 3 — File upload security (DONE, verified)

- **`App\Support\ImageSanitizer`**: New GD-based helper. Re-encodes uploaded images to strip EXIF + embedded payloads. Supports jpeg/png/webp/gif. Uses `imagejpeg/png/webp/gif` to write back. No new dependency (GD already required by Laravel).
- **Image-only task attachments for non-admin**: `TaskAttachmentController::store()` now uses two different mimes lists based on `$user->canBypassPhotoRequirement()`: admin gets full `jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip,rar,txt,csv`, non-admin gets `image` rule + `mimes:jpg,jpeg,png,webp` only.
- **`image` rule added everywhere**: `TaskController::update` and `SubTaskController::update` photos rules, `ProjectController` cover image (already had), `VendorController` logo (now also without svg).
- **GD re-encode applied to all image uploads**: After store in TaskController::update, SubTaskController::update, ProjectController::store/update, VendorController::store/update, TaskAttachmentController::store (only when image).
- **Authorized download endpoint**: `TaskAttachmentController::download()` authorizes via `TaskPolicy::view` (scopes sub_vendor) and uses `Storage::disk('public')->download()` to force `Content-Disposition: attachment` instead of inline render. New route `task-attachments.download` in `routes/projects.php`. `tasks/show.tsx` download button updated to use this route.
- **Dropped SVG from vendor logo**: `VendorController` mimes changed from `jpeg,png,jpg,gif,svg,webp` to `jpeg,png,jpg,gif,webp`. SVG (can contain `<script>`) no longer uploadable.
- **`storage/app/public/.htaccess`**: New file. Disables PHP execution (multiple `mod_php*` blocks) + `FilesMatch` blocking `.php`, `.phtml`, `.phar`, `.pl`, `.py`, `.jsp`, `.asp`, `.sh`, `.cgi`, `.svg`, `.html`, `.htm`, `.js`. `Options -Indexes` to disable directory listing. Defense-in-depth even if upload validation fails.

### Group 4 — Date input format fix (DONE, verified)

- **Root cause**: `<input type="date">` rejects ISO datetime (`"2026-06-17T17:00:00.000000Z"`). Server was sending full ISO despite `'date'` cast (timezone-related edge case in Laravel 13 serialization). Fix is client-side defensive: format in `useForm` initializer via `?.slice(0, 10)`.
- **Files changed**: `resources/js/pages/tasks/edit.tsx` (3 date fields), `resources/js/pages/projects/edit.tsx` (2 date fields). Slice applied to `start_date`, `due_date`, `target_date`, `recurrence_end_date`.

### Group 5 — New files added in this session

- `app/Support/ImageSanitizer.php` (GD re-encoder)
- `app/Components/appearance-header-toggle.tsx` (Sun/Moon toggle)
- `database/migrations/2026_06_18_000005_add_updated_by_to_tasks_table.php` (`updated_by` FK)
- `storage/app/public/.htaccess` (PHP execution prevention)

### Group 6 — Models/policies updated in this session

- `app/Models/User.php`: added `canManageSchedule()`
- `app/Models/Task.php`: added `updated_by` to fillable + `updater()` relation
- `app/Policies/TaskPolicy.php`: `update()` includes `isTeam()`
- `app/Policies/SubTaskPolicy.php`: `update()` includes `isTeam()`

### Group 7 — Controllers updated in this session

- `TaskController`: `index` (canCreate/canUpdate/canDelete), `kanban` (canCreate), `show` (can.create + eager load updater), `edit` (canChangeDates), `update` (strict status + date lockdown + updated_by + re-encode)
- `TaskAttachmentController`: image-only for non-admin + `download()` + re-encode
- `SubTaskController`: `image` rule + re-encode photos
- `ProjectController`: re-encode cover image
- `VendorController`: drop SVG mimes + re-encode logo

### Verify results (2026-06-18)

- `php artisan migrate` — `updated_by` migration applied clean
- `php artisan test` — 229 passed, 0 failed (unchanged from prior baseline)
- `npm run lint` — clean
- `npm run format:check` — clean
- `npm run build` — successful (49s)

### Known status

- AGENTS.md updated with all new conventions (canManageSchedule, strict status, last-updater tracking, file upload security, date input formatting).
- database-schema.md updated with `tasks.updated_by` column.

---

## 📌 Current session — 2026-06-16 (verify HELD, user offline)

### Group 1 — Historical email/phone tracking (DONE, unverified)
- `database/migrations/2026_06_20_000001_create_user_contact_history_table.php` (schema + backfill all existing users)
- `app/Models/UserContactHistory.php` (model, FIELD_EMAIL/FIELD_PHONE/REASON_* consts)
- `app/Models/User.php` booted() with `created` + `updated` events; `recordHistory()` helper, swallows errors with Log::warning
- `app/Http/Controllers/Admin/UserController.php` — `contactHistory()` method (search + field + user_id filter)
- `routes/admin.php` — `admin.users.contact-history` route under super_admin middleware
- `resources/js/pages/admin/users/contact-history.tsx` — page UI with filter form + table + clear-target chip
- `resources/js/components/app-sidebar.tsx` — "Contact History" menu + `History` icon (super_admin only)
- `tests/Feature/UserContactHistoryTest.php` — 11 tests: created records, partial phone/email, update records, unrelated-field noop, changed_by_user_id, soft-delete preserves, super_admin gate, admin_vendor forbidden, user_id filter, field filter
- **Not run:** `php artisan test` for new file. Migration not yet executed. Backfill will only seed when `migrate` runs.

### Group 2 — P3 frontend verification (DONE, unverified)
- Explored via subagent. Status board in P3 section of this file (lines 164-205).
- Fixed: P3.1 Camera icon (tasks/edit.tsx), P3.3 TaskDependency type extraction (tasks/show.tsx), P3.6 search bar (tasks/index.tsx + TaskController), P3.7 status colors + badge (tasks/kanban.tsx), P3.8 TagInput + Users icon (projects/show.tsx + new `projects.tags.update` route + ProjectController::updateTags), P3.10 RAB import Badge (rab/index.tsx, parses flash message), P3.12 sub-vendors isSuperAdmin gate (sub-vendors/index.tsx), P3.13 CardContent + aria-label (settings/sessions.tsx), P3.15 2FA fetchError state (settings/two-factor.tsx, kept fetch — Fortify returns raw JSON, router.get wouldn't work), P3.19 missing useState import (projects/trash.tsx) + collapsed double Trash2 (tasks/show.tsx)
- Deferred (separate scope): P3.5 gantt dependency toggle (needs server to send `dependencies`), P3.14 network error handling (per-form refactor), P3.17 frontend form validation lib (would add zod + react-hook-form), P3.18 full aria-label sweep

### Group 3 — P5 production operations (DONE, unverified)
- P5.1 `.env.example`: `LOG_STACK=daily` + `LOG_DAILY_DAYS=14` (was `single`)
- P5.2 `deploy/reverb.supervisor.conf` (new file) — supervisor snippet for Reverb. Existing `deploy/supervisor.conf` already covers queue worker.
- P5.3 `routes/auth.php`: `throttle:5,1` on login POST, `throttle:3,1` on forgot-password POST, `throttle:5,1` on reset-password POST. Register POST already had `throttle:3,60`. Web middleware (300/min auth, 60/min guest) already defined in AppServiceProvider.
- P5.4 `.env.example`: `REVERB_APP_RATE_LIMITING_ENABLED=true`, `REVERB_APP_RATE_LIMIT_MAX_ATTEMPTS=60`, `REVERB_APP_RATE_LIMIT_DECAY_SECONDS=60`. Config keys already existed in `config/reverb.php`.
- P5.5 `.env.example`: added production override block (HTTPS, secure cookie, redis cache, log level) + supervisor snippets + trusted proxies snippet + rate-limiter summary.
- P5.6 `.env.example`: `CACHE_STORE=database` default with comment recommending `redis` for production. Cache prefix note.
- P5.7 `package.json`: moved `laravel-echo` and `pusher-js` from devDependencies → dependencies. Run `npm install` to update `package-lock.json` and `node_modules`.
- P5.8 `.github/workflows/lint.yml`: removed `continue-on-error: true` on `npx tsc --noEmit`. Tests workflow already has `composer audit` + `phpunit` + `npm run build`.
- P5.9 `tsconfig.json`: enabled `noUnusedLocals: true` + `noUnusedParameters: true`. Left the rest commented (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` would explode the codebase — defer).

### Verify command (when user returns)
- `php artisan migrate` (runs new contact history migration + backfill)
- `php artisan test` (expecting 211 tests passing — 200 prior + 11 new)
- `npm run lint` (expecting clean; ESLint was 0 errors pre-session)
- `npm run format` (Prettier will rewrite touched files)
- `npx tsc --noEmit --ignoreDeprecations 6.0` (likely reveals unused imports; may need to fix react-stately dep + others — `noUnusedLocals` is now on)
- `npm run build` (Vite production build)

### Verify results (executed 2026-06-16)
- `php artisan migrate` — new contact history migration ran clean
- `php artisan test` — **210 passed, 0 failed** (was 200; +10 net new from UserContactHistoryTest; one test removed: `test_creating_user_without_phone_only_records_email` because users.phone is NOT NULL in DB)
- `npm run lint` — clean
- `npm run format:check` — clean
- `npx tsc --noEmit` — **18 pre-existing errors** (see Known issues below)
- `npm run build` — successful

### Files fixed during verify
- `tests/Feature/UserContactHistoryTest.php` — removed `test_creating_user_without_phone_only_records_email` (DB has NOT NULL on phone), updated `test_history_page_can_filter_by_user_id` and `test_history_page_can_filter_by_field` to expect 2 entries (email + phone initial, not 1)
- `resources/js/pages/tasks/index.tsx:79` — typed `updated` explicitly to fix `delete updated.search` (operand of delete must be optional)
- `resources/js/components/pagination.tsx` — made `PaginationData.data` generic via `<T>` so pages with typed arrays pass type check (this fixed 12 of the 30+ tsc errors in one shot)
- `.github/workflows/lint.yml` — restored `continue-on-error: true` on tsc (was changed in session, but reverted because pre-existing tsc errors would break CI). Strict options in tsconfig stay on (no new errors from them).

### Known risks
- `noUnusedLocals` is now on. Any file that imports something unused will fail tsc. Quick wins: drop `react-stately` from package.json if grep confirms it's unused, audit imports in modified files.
- The contact history migration uses `DB::transaction` + `User::withTrashed()->orderBy('id')` for backfill. Safe but slow on large user tables.
- `User::created` event fires inside `User::store()` controller path (uses `new User(...)->save()`), so first `created` event records with `changed_by_user_id` = the actor (admin creating the user). Subsequent `updated` events also pick up `Auth::id()`. If creation happens without an auth context (e.g. seeder, registration via Filament), `changed_by_user_id` will be `null` — correct.
- `contactHistory()` aborts with 403 for non-super_admin. UI page route is gated by sidebar visibility (super_admin only) but server still enforces.

### P0-P2 — DONE (pre-session)
All P0 (security), P1 (multi-tenant), P2 (data integrity) work from prior sessions is in. No regressions expected from this session's changes; new code stays inside admin/* namespace and a new user_contact_history table.

### Group 4 (manual, not in scope this session)
- Landing photos: download from `LANDING_ASSETS.md`, compress to WebP, place in `public/landing/photos/`. User's task, not automated.

---

## 📸 Foto Wajib di Update Task / Sub-Task (2026-06-16, ✅ verified clean)

### Status eksekusi
- ✅ Backend: User::canBypassPhotoRequirement(), TaskController::update + updateStatus, SubTaskController::update, BatchTaskController::updateStatus + assign
- ✅ Frontend: tasks/edit.tsx, sub-task-tree.tsx, tasks/kanban.tsx, tasks/index.tsx
- ✅ Tests: TaskPhotoRequiredTest (8), SubTaskPhotoRequiredTest (6), TaskKanbanRestrictionTest (5)
- ✅ Docs: todo.md (this section), AGENTS.md (Photo proof on update convention)
- ✅ Verify 2026-06-16: 229 tests pass, lint clean, format clean, build successful

### Verify results
- `php artisan test` — **229 passed** (was 210 prior + 19 new). Initial 10 fail dari new tests karena TenantScope filter (Task factory default vendor_id tidak match). Fixed dengan set vendor_id explicit di test setup.
- `npm run lint` — 5 errors di awal (usePage dipanggil 2x conditional via `||` short-circuit). Fixed dengan simpan ke local var `userRole` dulu. Lint clean.
- `npm run format:check` — 1 unused var `progressAssignedTo` after cleanup. Removed. Format clean.
- `npm run build` — successful (51s)

### Aturan
- Setiap update task / sub-task via form: wajib upload minimal 1 foto
- Admin (super_admin + admin_vendor): bypass via checkbox "Update administratif" di form
- Non-admin: form only. Kanvan drag, batch ops, sub-task inline assignment disabled
- Description: required hanya saat status/progress berubah
- Forward only: data existing tidak di-block

### Files modified
**Backend:**
- `app/Models/User.php` — `canBypassPhotoRequirement()`
- `app/Http/Controllers/TaskController.php` — `update()` + `updateStatus()`
- `app/Http/Controllers/SubTaskController.php` — `update()`
- `app/Http/Controllers/BatchTaskController.php` — `updateStatus()` + `assign()`

**Frontend:**
- `resources/js/pages/tasks/edit.tsx`
- `resources/js/components/sub-task-tree.tsx`
- `resources/js/pages/tasks/kanban.tsx`
- `resources/js/pages/tasks/index.tsx`

**Tests baru:**
- `tests/Feature/TaskPhotoRequiredTest.php` (8)
- `tests/Feature/SubTaskPhotoRequiredTest.php` (6)
- `tests/Feature/TaskKanbanRestrictionTest.php` (5)

**Docs:**
- `todo.md` (this section)
- `AGENTS.md` (Photo proof on update convention)

### Backend (done, unverified)
- `app/Models/User.php` — `canBypassPhotoRequirement(): bool` = `isAdminOrAbove()`
- `app/Http/Controllers/TaskController.php` `update()` — photo enforcement moved out of `hasAny(['status','progress'])` conditional; `administrative_update` flag for admin bypass
- `app/Http/Controllers/SubTaskController.php` `update()` — same pattern
- `app/Http/Controllers/TaskController.php` `updateStatus()` (kanvan) — `abort_unless($user->canBypassPhotoRequirement())`
- `app/Http/Controllers/BatchTaskController.php` `updateStatus()` + `assign()` — same gate

### Frontend (done, unverified)
- `resources/js/pages/tasks/edit.tsx` — admin sees toggle "Update administratif (lewati foto)"; photos always shown
- `resources/js/components/sub-task-tree.tsx` — admin toggle in progress modal; assigned_to field added; inline assignment dropdown only for admin
- `resources/js/pages/tasks/kanban.tsx` — drag disabled for non-admin, warning banner, "Edit" icon on each card for non-admin
- `resources/js/pages/tasks/index.tsx` — batch section wrapped in `isAdmin`; per-row checkbox only for admin; warning banner for non-admin

### Tests (done, unverified)
- `tests/Feature/TaskPhotoRequiredTest.php` — 8 tests (non-admin fail/success, admin bypass success, admin without flag fail, non-admin cannot use flag, admin with photo creates progress, admin_vendor bypass)
- `tests/Feature/SubTaskPhotoRequiredTest.php` — 6 tests (non-admin fail/success, admin bypass, non-admin cannot use flag, admin assigned_to inline, non-admin assigned_to requires photo)
- `tests/Feature/TaskKanbanRestrictionTest.php` — 5 tests (non-admin kanvan 403, admin kanvan ok, non-admin batch status 403, admin batch ok, non-admin batch assign 403)

### Known impact
- Existing tests that use adminVendor (admin) with photos still pass (no changes needed to TaskTest, SubTaskTest, BatchTaskTest)
- Non-admin (project_manager) users now MUST use form — kanvan/batch/inline-assign disabled both UI and server side

### Verify when user says "verify"
- `php artisan test` — expect ~229 tests (210 prior + 19 new)
- `npm run lint`
- `npm run format:check`
- `npx tsc --noEmit`
- `npm run build`

---

## 🪛 Known issues (pre-existing, separate task)

### 18 pre-existing tsc errors (not introduced this session)
Surfaced by enabling `noUnusedLocals` + `noUnusedParameters` in tsconfig (no new errors from those flags, but they make the build stricter). CI masks with `continue-on-error: true`. To fully enable P5.9 strict TS, fix these:

1. `resources/js/components/app-sidebar.tsx(33,25)` — `sub_vendor` role comparison; need type guard or cast
2. `resources/js/components/landing/hero.tsx(38,44,50,54,69)` — framer-motion `Variants` type mismatch (5 lines)
3. `resources/js/components/landing/nav.tsx(17,22)` — type cast via `as` (need `as unknown as`)
4. `resources/js/pages/admin/registrants/index.tsx(94,95,97)` — `flash.success` not on `{}` (need `usePage<{flash?: {success?: string}}>()`)
5. `resources/js/pages/admin/sub-vendor-users/index.tsx(56,22)` — type cast (need `as unknown as`)
6. `resources/js/pages/projects/show.tsx(602,76)` — `rab_items_count` not on `Project` interface (add to interface or remove usage)
7. `resources/js/pages/rab/index.tsx(117,123)` — `data` not in `UseFormSubmitOptions` (use `transform()` instead)
8. `resources/js/pages/settings/two-factor.tsx(100,44)` — `recoveryCodes` not on `Page<PageProps>` (cast page or type recovery_codes properly)
9. `resources/js/pages/tasks/calendar.tsx(91,33)` — FullCalendar `events` prop type
10. `resources/js/pages/tasks/edit.tsx(231,69)` — `errors.photos` not in form errors (use `errors as Record<string, string>` or type the form)
11. `resources/js/pages/tasks/kanban.tsx(131,62)` — draggable style type mismatch (cast `style` to `CSSProperties`)

P5.9 partially done: strict options enabled, pre-existing errors need cleanup.
