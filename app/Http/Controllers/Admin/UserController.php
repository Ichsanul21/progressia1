<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\SubVendor;
use App\Models\User;
use App\Models\UserContactHistory;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const DEFAULT_PASSWORD = 'password';

    private const PHONE_REGEX = '/^\+628\d{8,11}$/';

    private function adminVendorAllowedRoles(): array
    {
        return [
            UserRole::ProjectManager->value,
            UserRole::Team->value,
            UserRole::Client->value,
            UserRole::SubVendor->value,
        ];
    }

    private function superAdminAllowedRoles(): array
    {
        return [
            UserRole::SuperAdmin->value,
            UserRole::AdminVendor->value,
            UserRole::ProjectManager->value,
            UserRole::Team->value,
            UserRole::Client->value,
            UserRole::SubVendor->value,
        ];
    }

    private function buildList(Request $request, ?string $role = null)
    {
        $user = $request->user();
        $search = $request->get('search');

        $query = User::query()->with(['vendor:id,name', 'subVendor:id,name']);

        if ($role) {
            $query->where('role', $role);
        }

        if ($user->isSuperAdmin()) {
            if ($vendorId = $request->get('vendor_id')) {
                $query->where('vendor_id', $vendorId);
            }
        } else {
            $query->where('vendor_id', $user->vendor_id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->paginate(15)->withQueryString();
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();
        abort_unless($user->isSuperAdmin(), 403);

        $roleFilter = $request->get('role');

        return Inertia::render('admin/users/index', [
            'users' => $this->buildList($request, $roleFilter),
            'filters' => $request->only(['search', 'vendor_id', 'role']),
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'roles' => $this->superAdminAllowedRoles(),
        ]);
    }

    public function team(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();

        return Inertia::render('admin/team/index', [
            'users' => $this->buildList($request, UserRole::Team->value),
            'filters' => $request->only(['search', 'vendor_id']),
            'vendors' => $user->isSuperAdmin() ? Vendor::orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function projectManagers(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();

        return Inertia::render('admin/project-managers/index', [
            'users' => $this->buildList($request, UserRole::ProjectManager->value),
            'filters' => $request->only(['search', 'vendor_id']),
            'vendors' => $user->isSuperAdmin() ? Vendor::orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function clients(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();
        $search = $request->get('search');

        $query = User::query()
            ->where('role', UserRole::Client->value)
            ->withCount('projectsAsClient');

        if ($user->isSuperAdmin()) {
            if ($vendorId = $request->get('vendor_id')) {
                $query->where('vendor_id', $vendorId);
            }
        } else {
            $query->where('vendor_id', $user->vendor_id);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return Inertia::render('admin/clients/index', [
            'clients' => $query->orderBy('name')->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'vendor_id']),
            'vendors' => $user->isSuperAdmin() ? Vendor::orderBy('name')->get(['id', 'name']) : [],
        ]);
    }

    public function subVendorUsers(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();
        $search = $request->get('search');
        $vendorId = $request->get('vendor_id');
        $subVendorId = $request->get('sub_vendor_id');

        $query = User::query()
            ->where('role', UserRole::SubVendor->value)
            ->with(['vendor:id,name', 'subVendor:id,name']);

        if (! $user->isSuperAdmin()) {
            $query->where('vendor_id', $user->vendor_id);
        } elseif ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        if ($subVendorId) {
            $query->where('sub_vendor_id', $subVendorId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate(15)->withQueryString();

        $subVendors = SubVendor::query()
            ->when($vendorId, fn ($q) => $q->where('vendor_id', $vendorId))
            ->orderBy('name')
            ->get(['id', 'name', 'vendor_id']);

        return Inertia::render('admin/sub-vendor-users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'vendor_id', 'sub_vendor_id']),
            'vendors' => $user->isSuperAdmin() ? Vendor::orderBy('name')->get(['id', 'name']) : [],
            'subVendors' => $subVendors,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        $user = $request->user();

        return Inertia::render('admin/users/create', [
            'vendors' => $user->isSuperAdmin()
                ? Vendor::orderBy('name')->get(['id', 'name'])
                : Vendor::where('id', $user->vendor_id)->get(['id', 'name']),
            'subVendors' => $user->isSuperAdmin()
                ? SubVendor::orderBy('name')->get(['id', 'name', 'vendor_id'])
                : SubVendor::where('vendor_id', $user->vendor_id)->orderBy('name')->get(['id', 'name', 'vendor_id']),
            'allowedRoles' => $user->isSuperAdmin() ? $this->superAdminAllowedRoles() : $this->adminVendorAllowedRoles(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $actor = $request->user();
        $allowedRoles = $actor->isSuperAdmin() ? $this->superAdminAllowedRoles() : $this->adminVendorAllowedRoles();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:' . config('validation.email_max'), Rule::unique(User::class)->withoutTrashed()],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_REGEX],
            'role' => ['required', 'string', 'in:'.implode(',', $allowedRoles)],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'sub_vendor_id' => ['nullable', 'exists:sub_vendors,id'],
        ], [
            'phone.regex' => 'Nomor WhatsApp harus berformat +628xxxxxxxxx.',
        ]);

        if (! $actor->isSuperAdmin()) {
            $validated['vendor_id'] = $actor->vendor_id;
        }

        if ($validated['role'] === UserRole::SuperAdmin->value) {
            $validated['vendor_id'] = null;
            $validated['sub_vendor_id'] = null;
        } elseif ($validated['role'] === UserRole::SubVendor->value) {
            $request->validate(['sub_vendor_id' => ['required', 'exists:sub_vendors,id']]);
            abort_if(empty($validated['vendor_id']), 422, 'Vendor wajib diisi.');
            $subVendor = SubVendor::findOrFail($validated['sub_vendor_id']);
            abort_if($subVendor->vendor_id !== $validated['vendor_id'], 422, 'Sub-vendor harus dalam vendor yang sama.');
        } else {
            $validated['sub_vendor_id'] = null;
            abort_if(empty($validated['vendor_id']), 422, 'Vendor wajib diisi.');
        }

        $user = new User([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'role' => $validated['role'],
            'vendor_id' => $validated['vendor_id'],
            'sub_vendor_id' => $validated['sub_vendor_id'] ?? null,
            'must_change_password' => true,
            'password_changed_at' => null,
        ]);

        $user->password = Hash::make(self::DEFAULT_PASSWORD);
        $user->save();

        return redirect()
            ->route($this->resolveUserListRoute($request), Arr::only($request->query(), ['search']))
            ->with('success', 'User dibuat. Password awal: '.self::DEFAULT_PASSWORD);
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorize('update', $user);

        $actor = $request->user();

        return Inertia::render('admin/users/edit', [
            'user' => $user->load(['vendor:id,name', 'subVendor:id,name']),
            'vendors' => $actor->isSuperAdmin()
                ? Vendor::orderBy('name')->get(['id', 'name'])
                : Vendor::where('id', $actor->vendor_id)->get(['id', 'name']),
            'subVendors' => $actor->isSuperAdmin()
                ? SubVendor::orderBy('name')->get(['id', 'name', 'vendor_id'])
                : SubVendor::where('vendor_id', $actor->vendor_id)->orderBy('name')->get(['id', 'name', 'vendor_id']),
            'allowedRoles' => $actor->isSuperAdmin() ? $this->superAdminAllowedRoles() : $this->adminVendorAllowedRoles(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $actor = $request->user();
        $allowedRoles = $actor->isSuperAdmin() ? $this->superAdminAllowedRoles() : $this->adminVendorAllowedRoles();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:' . config('validation.email_max'), Rule::unique(User::class)->ignore($user->id)->withoutTrashed()],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_REGEX],
            'role' => ['required', 'string', 'in:'.implode(',', $allowedRoles)],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'sub_vendor_id' => ['nullable', 'exists:sub_vendors,id'],
        ], [
            'phone.regex' => 'Nomor WhatsApp harus berformat +628xxxxxxxxx.',
        ]);

        if (! $actor->isSuperAdmin()) {
            $validated['vendor_id'] = $actor->vendor_id;
        }

        if ($validated['role'] === UserRole::SuperAdmin->value) {
            $validated['vendor_id'] = null;
            $validated['sub_vendor_id'] = null;
        } elseif ($validated['role'] === UserRole::SubVendor->value) {
            $request->validate(['sub_vendor_id' => ['required', 'exists:sub_vendors,id']]);
        } else {
            $validated['sub_vendor_id'] = null;
        }

        $user->forceFill($validated)->save();

        return redirect()
            ->route($this->resolveUserListRoute($request), Arr::only($request->query(), ['search']))
            ->with('success', 'User diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()
            ->route($this->resolveUserListRoute($request), Arr::only($request->query(), ['search']))
            ->with('success', 'User dihapus.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $user->forceFill([
            'password' => Hash::make(self::DEFAULT_PASSWORD),
            'must_change_password' => true,
            'password_changed_at' => null,
        ])->save();

        return redirect()
            ->route($this->resolveUserListRoute($request), Arr::only($request->query(), ['search']))
            ->with('success', 'Password direset ke: '.self::DEFAULT_PASSWORD);
    }

    public function search(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->isAdminOrAbove(), 403);

        $query = (string) $request->get('q', '');
        $role = $request->get('role');
        $exclude = array_filter((array) $request->get('exclude', []));

        if (mb_strlen($query) < 2) {
            return response()->json([]);
        }

        $builder = User::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->limit(10);

        if ($role) {
            $builder->where('role', $role);
        }

        if (! $actor->isSuperAdmin()) {
            $builder->where('vendor_id', $actor->vendor_id);
        }

        if (! empty($exclude)) {
            $builder->whereNotIn('id', $exclude);
        }

        return response()->json(
            $builder->get(['id', 'name', 'email', 'phone', 'role'])
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'role' => $u->role?->value,
                ])
        );
    }

    public function contactHistory(Request $request): Response
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $search = trim((string) $request->get('q', ''));
        $field = $request->get('field');
        $userId = $request->get('user_id');

        $query = UserContactHistory::query()
            ->with(['user:id,name,email', 'changedBy:id,name']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('old_value', 'like', "%{$search}%")
                    ->orWhere('new_value', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }

        if (in_array($field, [UserContactHistory::FIELD_EMAIL, UserContactHistory::FIELD_PHONE], true)) {
            $query->where('field', $field);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $entries = $query->orderByDesc('created_at')->paginate(25)->withQueryString();

        $targetUser = null;
        if ($userId) {
            $targetUser = User::withTrashed()->find($userId);
        }

        return Inertia::render('admin/users/contact-history', [
            'entries' => $entries,
            'filters' => $request->only(['q', 'field', 'user_id']),
            'targetUser' => $targetUser ? [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'phone' => $targetUser->phone,
            ] : null,
        ]);
    }

    private function resolveUserListRoute(Request $request): string
    {
        $referer = $request->header('referer', '');

        return match (true) {
            str_contains($referer, '/admin/team') => 'admin.team.index',
            str_contains($referer, '/admin/project-managers') => 'admin.project-managers.index',
            str_contains($referer, '/admin/clients') => 'admin.clients.index',
            str_contains($referer, '/admin/sub-vendor-users') => 'admin.sub-vendor-users.index',
            default => $request->user()->isSuperAdmin() ? 'admin.users.index' : 'admin.team.index',
        };
    }
}
