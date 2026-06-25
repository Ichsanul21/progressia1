# Progressia — AGENTS.md

## Stack
- **Backend**: Laravel 13 + Fortify (auth), Inertia v3 (SSR/SPA bridge)
- **Frontend**: React 19 + TypeScript 6 + Vite 8 + Tailwind v4 (via `@tailwindcss/vite` plugin)
- **UI**: shadcn/ui (Radix primitives), `@/lib/utils` exports `cn()` util
- **Broadcasting**: Laravel Reverb + `laravel-echo` (Pusher protocol)
- **Database**: SQLite default (testing uses `:memory:`)
- **Testing**: PHPUnit 12 (`tests/Unit`, `tests/Feature`)

## Dev commands

```sh
composer dev                   # Full dev: server + queue + logs + Vite (concurrently)
npm run dev                    # Vite dev server only
npm run build                  # Vite production build
npm run build:ssr              # Vite build + SSR build
npm run lint                   # ESLint (flat config) with --fix
npm run format                 # Prettier (writes resources/)
npm run format:check           # Prettier check only
php artisan test               # PHPUnit (sqlite :memory:)
php artisan test --filter=TestName
```

## Key conventions

- **Path aliases**: `@/` → `resources/js/`, `ziggy-js` → `vendor/tightenco/ziggy` (see `tsconfig.json`)
- **Inertia pages**: auto-resolved from `resources/js/pages/**/*.tsx` — page name matches route name (e.g. `projects/index.tsx`)
- **Routes**: loaded via `bootstrap/app.php` from `routes/` — main routing in `web.php`, with split files (`projects.php`, `auth.php`, `settings.php`, `admin.php`, etc.)
- **Policies & Observers**: manually registered in `AppServiceProvider` (not auto-discovered)
- **Multi-tenancy**: via `vendor_id` + `TenantScope`/`Tenantable` trait on most models
- **Middlewares**: `CheckRole` for role-gated routes (roles: `super_admin`, `admin_vendor`, etc.)
- **Prettier**: `tabWidth: 4` (2 for yml), plugins: `prettier-plugin-tailwindcss` + `prettier-plugin-organize-imports`
- **ESLint**: flat config (v10), `eslint-config-prettier` as last entry to disable conflicting rules
- **Progress calculation**: leaf sub-tasks 0/100, parent = AVG children, task = AVG sub-tasks, project = AVG tasks. Progress propagation is automatic via model observers (`saved`/`deleted` events on SubTask, Task, Phase, Project). Do NOT call `recalculateProgress*` or `recalculateWithAncestors` manually in controllers — observers handle it.
- **Photo proof on update**: every task / sub-task update via form requires at least 1 photo. Admin (super_admin + admin_vendor) can bypass via `administrative_update=true` flag (UI: "Update administratif" checkbox in form). Non-admin: kanvan drag, batch ops, sub-task inline assignment are all disabled (server returns 403). See `User::canBypassPhotoRequirement()`.
- **Role helpers on User**: `isSuperAdmin`, `isAdminVendor`, `isProjectManager`, `isTeam`, `isClient`, `isSubVendor`. Composed: `isAdminOrAbove()` = super_admin OR admin_vendor, `canBypassPhotoRequirement()` = isAdminOrAbove(), `canManageSchedule()` = isAdminOrAbove OR project_manager (gates date changes, task/sub-task creation).
- **Task/Sub-task update authorization**: Team role can update (per `TaskPolicy::update` and `SubTaskPolicy::update`). Only `canManageSchedule()` roles can change dates. Status transitions are STRICT for non-admin: `not_started` -> `in_progress` -> `review` -> `done`, with `revisi` branch only reachable from `review` (back to `review` from `revisi`). Admin can do any transition. Last updater tracked via `tasks.updated_by` FK, exposed via `task.updater` relation, displayed on show page Details card.
- **Update Progress modal**: universal for all roles with `updateProgress` policy (admin/PM/Team/sub_vendor). Endpoint `PUT /projects/{p}/tasks/{t}/progress` and `PUT /projects/{p}/tasks/{t}/sub-tasks/{st}/progress`. Status dropdown shows only valid next transitions for non-admin, all for admin. Photo required for non-admin. Admin has "Update administratif" toggle to skip photo. Sub-task uses same modal via `sub-tasks.update-progress` route.
- **File upload security**: All image uploads (task attachments, progress photos, project cover, vendor logo) are validated with Laravel `image` rule (getimagesize) and re-encoded via `App\Support\ImageSanitizer` (GD-based) to strip EXIF metadata + any embedded payloads before storage. Task attachments are image-only (jpg/jpeg/png/webp) for non-admin; admin can also upload pdf/doc/docx/xls/xlsx/zip/rar/txt/csv. Vendor logos dropped SVG support. `storage/app/public/.htaccess` blocks PHP execution and dangerous file types (php, phar, svg, html, htm, js). Task attachments served via authorized controller endpoint (`task-attachments.download`), not direct storage URL.
- **Date input formatting**: Backend returns ISO datetime strings ("2026-06-17T17:00:00.000000Z"). `<input type="date">` requires "YYYY-MM-DD". Frontend slices ISO via `?.slice(0, 10)` in `useForm` initializer before passing to date inputs (see `tasks/edit.tsx`, `projects/edit.tsx`).
- **Sub-task status**: `sub_tasks.status` column (not `is_completed`). Enum values: `not_started | in_progress | review | done | revisi`. Progress mapping: `not_started/revisi=0, in_progress=25, review=50, done=100`. Parent sub-task progress = AVG of children. Same transition rules as task.
- **403 redirect on Inertia**: `bootstrap/app.php` `withExceptions()` catches `\Illuminate\Auth\Access\AuthorizationException` only when `X-Inertia` header is set. Redirects `Referer` (fallback `route('dashboard')`) with flash `error: 'Anda tidak memiliki akses ke halaman ini.'`. Frontend `<FlashToaster />` in `app.tsx` listens to `usePage().props.flash` and surfaces to sonner (`bottom-right`, `richColors`, `closeButton`).
- **Unified task timeline**: `GET /projects/{p}/tasks/{t}/timeline?type=all|activity|progress&q=&offset=`. Returns `{ entries, has_more, total, offset }`. Limit 50 per request, no hard max. Merges task + sub-task activity logs and progress updates. Frontend `resources/js/components/task-history.tsx` wraps `HistoryEntry` with 150ms-debounced search, type pills, and IntersectionObserver infinite scroll.
- **History entry rendering**: `resources/js/components/history-entry.tsx` is shared between task + sub-task views. Single-row field diff per changed key (e.g. `status: in_progress → review`, `progress: 25% → 50%`). Photos rendered as 4-col thumbnail grid. Observers (`TaskObserver::describeChanges`, `SubTaskObserver::describeChanges`) generate the diff from old/new values.
- **Sub-task inline history**: each row in `sub-task-tree.tsx` has a History toggle button (group-hover visible, collapsed by default). Click expands a section showing that sub-task's own activity + progress updates. Data comes from eager-loaded `sub_tasks.activity_logs` + `sub_tasks.progress_updates` (no fetch).

## Quirks

- `@rsagiev/gantt-task-react-19` needs a `postinstall` script hack — `npm install` handles it automatically
- `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `SESSION_DRIVER=database` — all DB-backed
- `tasks:generate-recurring` Artisan command runs daily via `Schedule`
- `.env.example` has `APP_LOCALE=id` and timezone `Asia/Jakarta` (copy to `.env` for dev)
- `php artisan pail` used for log tailing (runs as part of `composer dev`)
- SSR entry at `resources/js/ssr.jsx`, build output to `bootstrap/ssr`

## Architecture flow

```
Blade layout (app.blade.php)
  → @vite(['resources/js/app.tsx', ...])
    → createInertiaApp() resolves pages via glob
      → Inertia::render('pageName') on backend
        → page component in pages/{name}.tsx
```

No separate API layer — all data flows through Inertia responses from controllers.

## Style guide

Follow these style guidelines in chat, commit messages, and prose:

- Be concise and descriptive
- Don't oversell the changes. It's not an advertisement.
- Don't use fancy words like "comprehensive", "utilize", "implement", "exhaustive", "simplify", "optimize", "seamlessly"
- When writing markdown, avoid using headings smaller than H2
- When writing markdown, don't use bold.
- When writing markdown tables, pad cells with spaces so columns align. This makes tables legible in monospace contexts like terminals.
- Never use em dashes (—). Use commas, colons, or separate sentences instead.

## Before coding

- State assumptions explicitly before implementing. If uncertain, ask.
- If multiple interpretations of a request exist, present them, don't pick silently.
- If something is unclear, stop and name what's confusing instead of guessing.
- Write the minimum code that solves the problem. No speculative features, no abstractions for single-use code, no configurability that wasn't asked for.
- Don't add error handling for impossible scenarios.
- Touch only what the task requires. Don't "improve" adjacent code, comments, or formatting.
- Match existing style in a file, even if you'd write it differently.
- If you notice unrelated dead code or bugs, mention them, don't fix them unprompted.
- Clean up orphans your changes create (unused imports, variables). Don't remove pre-existing dead code unless asked.

## Working with me

- Be direct. No glazing. Never write "You're absolutely right!" or similar sycophantic openers.
- Push back with specific reasons when you disagree. If it's a gut feeling, say so.
- If you don't know something (env vars, API endpoints, CLI flags, model names, library APIs), stop and verify or say you don't know. Never invent technical details.
- Your training data is stale. Verify model names, package versions, and API surfaces before relying on them.
- Don't say a task is done until typechecks, linters, and tests pass. If none are configured, say so explicitly instead of claiming success.
- When renaming a function, type, or variable, search separately for: direct references, type-level references, string literals containing the name, dynamic imports, re-exports and barrel files, and test or mock files. One grep is not enough.

## General advice

- Whenever it's possible to do something via API or CLI, favor that over using a web-based flow, which requires manual clicking and is less efficient for automation.
- Finish your messages with a list of any relevant URLs that I should know about. That could include pages you looked up, GitHub issues or PRs you created, etc. No need to repeat them too many times.
- Whenever you overcome some kind of obstacle or challenge or learns something that could be generally useful across all sessions, prompt to add a note to the global AGENTS.md file so that the future sessions can benefit. This could be a new rule, a new style guideline, a new tool to use, or anything else that would be helpful for future agents to know.

## Self-improvement

- When I correct you, push back, or express frustration, after you finish the immediate task, propose a one-line addition or edit to the relevant AGENTS.md so the same mistake doesn't recur.
- Decide scope explicitly. Global (your global AGENTS.md) if the rule applies across all my projects. Project (`./AGENTS.md`) if it only applies to this codebase. Neither if it's a one-off. State your scope decision and why before proposing the edit.
- Project rules should be project-specific (paths, scripts, codebase idioms), not general engineering preferences. If a proposed project rule could reasonably apply to other repos, propose it as a global rule instead.
- Before proposing, search the relevant AGENTS.md for an existing rule that covers this. If one exists, propose tightening it, not adding a new bullet.
- Show me the proposed diff. Do not edit the file until I approve.
- Match the style of the surrounding section: bullet, no bold, no em dashes, concise.
- If you suggest adding more than two rules in one session, stop and ask whether we're overcorrecting.
- When an AGENTS.md grows past about 200 lines, propose deletions or consolidations alongside additions, not just additions.
- If I ask you to "audit AGENTS.md", read the whole file and propose a list of rules to delete because they're obsolete, duplicated, or never followed in practice, with one-sentence reasoning each.
- At the start of work in a new project, check whether the project has its own `AGENTS.md`. If it doesn't, suggest creating one and offer to draft it. AGENTS.md is for agents: technical instructions about the project (stack, scripts, conventions, gotchas, paths, build and test commands). Include an instruction in the project-level AGENTS.md to make it update itself when meaningful changes are made to the project.
- Also check whether the project has a `README.md`. If it doesn't, suggest creating one. README.md is for humans: what the project is, why it exists, and how a person gets started. Don't conflate the two. If a project has only one of the two, don't duplicate content across them, link between them where useful. Link to AGENTS.md from the README.md when relevant.
