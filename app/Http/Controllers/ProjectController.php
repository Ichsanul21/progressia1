<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    private const CLIENT_DEFAULT_PASSWORD = 'password';

    private const PHONE_REGEX = '/^\+628\d{8,11}$/';

    private function scopedClientsFor(User $actor, ?int $vendorId): array
    {
        $query = User::where('role', UserRole::Client->value);

        if ($actor->isSuperAdmin()) {
            if ($vendorId) {
                $query->where('vendor_id', $vendorId);
            }
        } else {
            $query->where('vendor_id', $actor->vendor_id);
        }

        return $query->orderBy('name')->get(['id', 'name', 'email', 'vendor_id'])->toArray();
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);

        $query = Project::withCount('phases', 'tasks')
            ->with('vendor:id,name')
            ->active()
            ->orderBy('created_at', 'desc');

        $user = $request->user();

        if ($user->isClient()) {
            $query->whereHas('clients', fn ($q) => $q->where('users.id', $user->id));
        } elseif ($user->isSubVendor()) {
            $query->whereHas('tasks', fn ($q) => $q->where('sub_vendor_id', $user->sub_vendor_id));
        }

        if ($search = $request->search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        $projects = $query->paginate(10);

        $favoritedIds = $user ? $user->favoriteProjects()->pluck('project_id')->toArray() : [];

        $projects->getCollection()->transform(function ($project) use ($favoritedIds) {
            $project->is_favorited = in_array($project->id, $favoritedIds);
            return $project;
        });

        $archivedCount = $user->isSubVendor() ? 0 : Project::archived()->count();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status']),
            'archivedCount' => $archivedCount,
            'canCreate' => $user->can('create', Project::class),
            'canUpdate' => $user->can('update', Project::class),
            'canDelete' => $user->can('delete', Project::class),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('create', Project::class);

        $user = $request->user();
        $allClients = $this->scopedClientsFor($user, null);

        return Inertia::render('projects/create', [
            'vendors' => $user->isSuperAdmin() ? Vendor::all(['id', 'name']) : [],
            'allClients' => $allClients,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('create', Project::class);

        $actor = $request->user();

        $rules = [
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:' . config('validation.category_max')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:' . config('validation.tag_max')],
            'start_date' => ['nullable', 'date'],
            'target_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'client_id' => ['nullable', 'integer', 'exists:users,id'],
            'new_client' => ['nullable', 'array'],
            'new_client.name' => ['nullable', 'string', 'max:' . config('validation.name_max')],
            'new_client.email' => ['nullable', 'string', 'lowercase', 'email', 'max:' . config('validation.email_max'), Rule::unique('users', 'email')->whereNull('deleted_at')],
            'new_client.phone' => ['nullable', 'string', 'regex:'.self::PHONE_REGEX],
        ];

        if ($actor->isSuperAdmin()) {
            $rules['vendor_id'] = ['required', 'exists:vendors,id'];
        }

        $validated = $request->validate($rules, [
            'new_client.phone.regex' => 'Nomor WhatsApp harus berformat +628xxxxxxxxx.',
        ]);

        $validated['created_by'] = $actor->id;

        if ($request->hasFile('cover_image')) {
            $validated['cover_image'] = $request->file('cover_image')->store('projects/covers', 'public');
            \App\Support\ImageSanitizer::sanitize($request->file('cover_image'), \Storage::disk('public')->path($validated['cover_image']));
        }

        $project = DB::transaction(function () use ($request, $actor, $validated) {
            $project = Project::create($validated);

            $clientId = $validated['client_id'] ?? null;

            if ($clientId) {
                $client = User::findOrFail($clientId);
                abort_unless($client->role === UserRole::Client, 422, 'User yang dipilih bukan client.');
                abort_unless(
                    $actor->isSuperAdmin() || $client->vendor_id === $actor->vendor_id,
                    403,
                    'Client harus berasal dari vendor yang sama.',
                );
                $project->clients()->syncWithoutDetaching([$client->id]);
            } elseif (! empty($validated['new_client']['name'] ?? null)) {
                $new = $validated['new_client'];
                $clientVendorId = $actor->isSuperAdmin() ? $project->vendor_id : $actor->vendor_id;

                abort_if(empty($clientVendorId), 422, 'Vendor wajib diisi untuk membuat client baru.');

                $client = new User([
                    'name' => $new['name'],
                    'email' => $new['email'],
                    'phone' => $new['phone'],
                    'role' => UserRole::Client,
                    'vendor_id' => $clientVendorId,
                    'must_change_password' => true,
                    'password_changed_at' => null,
                ]);
                $client->password = Hash::make(self::CLIENT_DEFAULT_PASSWORD);
                $client->save();

                $project->clients()->syncWithoutDetaching([$client->id]);
            }

            return $project;
        });

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', __('Project created.'));
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $user = $request->user();

        if ($user->isClient()) {
            abort_unless($project->clients()->where('users.id', $user->id)->exists(), 403);
        }

        $project->load([
            'phases' => fn($q) => $q->withCount('tasks'),
            'members:id,name',
            'clients:id,name',
            'vendor:id,name',
            'subVendor:id,name',
            'createdBy:id,name',
            'documents' => function ($q) {
                $q->with('uploader:id,name')->latest();
            },
        ]);

        $project->loadCount('tasks', 'documents', 'rabItems');

        $allClients = $this->scopedClientsFor($user, $project->vendor_id);

        $allMembers = User::whereIn('role', ['admin_vendor', 'team'])
            ->where('vendor_id', $project->vendor_id)
            ->get(['id', 'name']);

        $rabBudget = (float) ($project->rabItems()->toBase()->selectRaw('SUM(COALESCE(volume * unit_price, 0)) as total')->reorder()->value('total') ?? 0);

        $reportLinks = $project->reportLinks()
            ->active()
            ->latest()
            ->get(['id', 'token', 'expires_at', 'revoked_at', 'last_accessed_at', 'access_count', 'reveal_count', 'last_revealed_at', 'created_at'])
            ->map(fn ($l) => [
                'id' => $l->id,
                'token' => $l->token,
                'expires_at' => $l->expires_at?->toIso8601String(),
                'last_accessed_at' => $l->last_access_at?->toIso8601String(),
                'access_count' => $l->access_count,
                'reveal_count' => $l->reveal_count,
                'last_revealed_at' => $l->last_revealed_at?->toIso8601String(),
                'created_at' => $l->created_at->toIso8601String(),
            ])
            ->values()
            ->all();

        $canManageLinks = $user->can('manageReportLinks', $project);

        $whatsappPhone = $canManageLinks
            ? $project->clients()->whereNotNull('phone')->orderBy('id')->first()?->phone
            : null;

        return Inertia::render('projects/show', [
            'project' => $project,
            'isFavorited' => $project->isFavoritedBy($user),
            'allClients' => $allClients,
            'allMembers' => $allMembers,
            'rabBudget' => round($rabBudget, 2),
            'isClient' => $user->isClient(),
            'reportLinks' => $reportLinks,
            'whatsappPhone' => $whatsappPhone,
            'can' => [
                'delete' => $user->can('delete', $project),
                'update' => $user->can('update', $project),
                'forceDelete' => $user->can('forceDelete', $project),
                'restore' => $user->can('restore', $project),
                'manage_report_links' => $canManageLinks,
            ],
        ]);
    }

    public function edit(Request $request, Project $project): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $project);

        $user = $request->user();
        $allClients = $this->scopedClientsFor($user, $project->vendor_id);

        return Inertia::render('projects/edit', [
            'project' => $project,
            'vendors' => $user->isSuperAdmin() ? Vendor::all(['id', 'name']) : [],
            'allClients' => $allClients,
        ]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $project);

        $actor = $request->user();

        // 1. Hapus 'cover_image' dari request jika tidak ada file yang diupload
        // Ini mencegah error validasi 'image' jika Inertia mengirim null sebagai string kosong
        if (!$request->hasFile('cover_image')) {
            $request->request->remove('cover_image');
        }

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['sometimes', 'nullable', 'string', 'max:' . config('validation.description_max')],
            'categories' => ['sometimes', 'nullable', 'array'],
            'categories.*' => ['string', 'max:' . config('validation.category_max')],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:' . config('validation.tag_max')],
            'status' => ['sometimes', 'nullable', 'string', 'in:not_started,in_progress,review,done'],
            'progress' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:' . config('validation.progress_max')],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'target_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'cover_image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_cover_image' => ['sometimes', 'boolean'],
            'client_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'new_client' => ['sometimes', 'nullable', 'array'],
            'new_client.name' => ['nullable', 'string', 'max:' . config('validation.name_max')],
            'new_client.email' => ['nullable', 'string', 'lowercase', 'email', 'max:' . config('validation.email_max'), Rule::unique('users', 'email')->ignore($project->id, 'id')->whereNull('deleted_at')],
            'new_client.phone' => ['nullable', 'string', 'regex:'.self::PHONE_REGEX],
        ];

        if ($actor->isSuperAdmin()) {
            $rules['vendor_id'] = ['sometimes', 'required', 'exists:vendors,id'];
        }

        $validated = $request->validate($rules, [
            'new_client.phone.regex' => 'Nomor WhatsApp harus berformat +628xxxxxxxxx.',
        ]);

        // 2. Handle cover image
        if ($request->hasFile('cover_image')) {
            if ($project->cover_image) {
                Storage::disk('public')->delete($project->cover_image);
            }
            $validated['cover_image'] = $request->file('cover_image')->store('projects/covers', 'public');
            \App\Support\ImageSanitizer::sanitize($request->file('cover_image'), \Storage::disk('public')->path($validated['cover_image']));
        } elseif ($request->boolean('remove_cover_image') && $project->cover_image) {
            // PERBAIKAN UTAMA: Gunakan $request->boolean()
            // ini akan mengubah string "false" menjadi boolean false dengan benar
            Storage::disk('public')->delete($project->cover_image);
            $validated['cover_image'] = null;
        } else {
            // Jika tidak ada file baru & tidak diminta hapus, pastikan tidak ada di $validated
            // agar data lama di database tidak tertimpa oleh null
            unset($validated['cover_image']);
        }

        // 3. Simpan data relasi client ke variabel terpisah
        $clientId = $validated['client_id'] ?? null;
        $newClientData = $validated['new_client'] ?? null;

        // 4. Hapus field yang BUKAN kolom tabel 'projects' dari $validated
        // Ini mencegah error MassAssignmentException saat $project->update()
        unset($validated['remove_cover_image']);
        unset($validated['client_id']);
        unset($validated['new_client']);

        DB::transaction(function () use ($project, $actor, $validated, $clientId, $newClientData) {
            $project->update($validated);

            if ($clientId) {
                $client = User::findOrFail($clientId);
                abort_unless($client->role === UserRole::Client, 422, 'User yang dipilih bukan client.');
                abort_unless(
                    $actor->isSuperAdmin() || $client->vendor_id === $actor->vendor_id,
                    403,
                    'Client harus berasal dari vendor yang sama.',
                );
                $project->clients()->syncWithoutDetaching([$client->id]);
            } elseif (! empty($newClientData['name'] ?? null)) {
                $clientVendorId = $actor->isSuperAdmin() ? $project->vendor_id : $actor->vendor_id;

                abort_if(empty($clientVendorId), 422, 'Vendor wajib diisi untuk membuat client baru.');

                $client = new User([
                    'name' => $newClientData['name'],
                    'email' => $newClientData['email'],
                    'phone' => $newClientData['phone'],
                    'role' => UserRole::Client,
                    'vendor_id' => $clientVendorId,
                    'must_change_password' => true,
                    'password_changed_at' => null,
                ]);
                $client->password = Hash::make(self::CLIENT_DEFAULT_PASSWORD);
                $client->save();

                $project->clients()->syncWithoutDetaching([$client->id]);
            }
        });

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', __('Project updated.'));
    }

    public function updateTags(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:' . config('validation.tag_max')],
        ]);

        $project->update(['tags' => $validated['tags'] ?? []]);

        return back()->with('success', __('Tags diperbarui.'));
    }

    public function restore(int $id): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);

        $project = Project::withTrashed()->findOrFail($id);

        $this->authorize('restore', $project);

        $project->restore();

        return redirect()->route('projects.index')
            ->with('success', __('Project restored.'));
    }

    public function forceDelete(int $id): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);

        $project = Project::withTrashed()->findOrFail($id);

        $this->authorize('forceDelete', $project);

        $project->forceDelete();

        return redirect()->route('projects.trash')
            ->with('success', __('Project permanently deleted.'));
    }

    public function destroy(Project $project): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', __('Project deleted.'));
    }

    public function duplicate(Request $request, Project $project): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('update', $project);

        $copy = $project->duplicate();

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', __('Project duplicated.'));
    }

    public function archive(Request $request, Project $project): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('update', $project);

        $project->archive();

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', __('Project archived.'));
    }

    public function unarchive(Request $request, Project $project): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('update', $project);

        $project->unarchive();

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', __('Project unarchived.'));
    }

    public function toggleFavorite(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('view', $project);

        $user = request()->user();

        abort_if($user->isClient() && ! $project->clients()->where('users.id', $user->id)->exists(), 403);

        if ($project->isFavoritedBy($user)) {
            $project->favoritedBy()->detach($user);
            $message = __('Project removed from favorites.');
        } else {
            $project->favoritedBy()->attach($user);
            $message = __('Project added to favorites.');
        }

        return redirect()
            ->route('projects.index', Arr::only($request->query(), ['search', 'status', 'vendor_id', 'archived']))
            ->with('success', $message);
    }

    public function attachMember(Request $request, Project $project): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $project->members()->syncWithoutDetaching($validated['user_id']);

        return back()->with('success', __('Member added to project.'));
    }

    public function detachMember(Project $project, User $user): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('update', $project);

        $project->members()->detach($user->id);

        return back()->with('success', __('Member removed from project.'));
    }

    public function attachClient(Request $request, Project $project): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        abort_unless($user->role === UserRole::Client, 422, 'User yang dipilih bukan client.');

        $actor = $request->user();
        abort_unless(
            $actor->isSuperAdmin() || $user->vendor_id === $actor->vendor_id,
            403,
            'Client harus berasal dari vendor yang sama.',
        );

        $project->clients()->syncWithoutDetaching($user->id);

        return back()->with('success', __('Client added to project.'));
    }

    public function detachClient(Project $project, User $user): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('update', $project);

        $project->clients()->detach($user->id);

        return back()->with('success', __('Client removed from project.'));
    }

    public function trash(): Response
    {
        $this->authorize('restore', Project::class);

        $projects = Project::onlyTrashed()
            ->with('vendor:id,name')
            ->orderBy('deleted_at', 'desc')
            ->paginate(10);

        return Inertia::render('projects/trash', [
            'projects' => $projects,
        ]);
    }

}
