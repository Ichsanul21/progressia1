<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\SubVendor;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubVendorController extends Controller
{
    public function index(Request $request, ?Vendor $vendor = null): Response
    {
        $query = SubVendor::with('vendor');

        if ($vendor) {
            $query->where('vendor_id', $vendor->id);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $subVendors = $query->orderBy('name')->paginate(10);

        return Inertia::render('sub-vendors/index', [
            'subVendors' => $subVendors,
            'vendor' => $vendor,
            'filters' => $request->only('search'),
            'canDelete' => $request->user()->can('delete', SubVendor::class),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        $vendors = $user->isSuperAdmin()
            ? Vendor::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Vendor::where('id', $user->vendor_id)->where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sub-vendors/create', [
            'vendors' => $vendors,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->authorize('create', SubVendor::class);

        $rules = [
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:' . config('validation.phone_max')],
            'email' => ['nullable', 'email', 'max:' . config('validation.email_max')],
            'address' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:' . config('validation.contact_person_max')],
            'npwp' => ['nullable', 'string', 'max:' . config('validation.npwp_max')],
            'license_number' => ['nullable', 'string', 'max:' . config('validation.license_number_max')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:' . config('validation.tag_max')],
            'is_active' => ['boolean'],
        ];

        if ($user->isSuperAdmin()) {
            $rules['vendor_id'] = ['required', 'exists:vendors,id'];
        }

        $validated = $request->validate($rules);

        if (! $user->isSuperAdmin()) {
            $validated['vendor_id'] = $user->vendor_id;
        }

        $base = Str::slug($validated['name']);
        $slug = $base;
        $counter = 1;
        while (SubVendor::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $counter++;
        }
        $validated['slug'] = $slug;

        SubVendor::create($validated);

        return redirect()->route('admin.sub-vendors.index')
            ->with('success', __('Sub-vendor created.'));
    }

    public function edit(SubVendor $subVendor): Response
    {
        $user = request()->user();

        $vendors = $user->isSuperAdmin()
            ? Vendor::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Vendor::where('id', $user->vendor_id)->where('is_active', true)->get(['id', 'name']);

        return Inertia::render('sub-vendors/edit', [
            'subVendor' => $subVendor->load('vendor'),
            'vendors' => $vendors,
            'users' => $subVendor->users()->orderBy('name')->get(['id', 'name', 'email', 'phone', 'must_change_password']),
        ]);
    }

    public function update(Request $request, SubVendor $subVendor): RedirectResponse
    {
        $this->authorize('update', $subVendor);
        $user = $request->user();

        $rules = [
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:' . config('validation.phone_max')],
            'email' => ['nullable', 'email', 'max:' . config('validation.email_max')],
            'address' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:' . config('validation.contact_person_max')],
            'npwp' => ['nullable', 'string', 'max:' . config('validation.npwp_max')],
            'license_number' => ['nullable', 'string', 'max:' . config('validation.license_number_max')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:' . config('validation.tag_max')],
            'is_active' => ['boolean'],
        ];

        if ($user->isSuperAdmin()) {
            $rules['vendor_id'] = ['required', 'exists:vendors,id'];
        }

        $validated = $request->validate($rules);

        if ($validated['name'] !== $subVendor->name) {
            $base = Str::slug($validated['name']);
            $slug = $base;
            $counter = 1;
            while (SubVendor::withTrashed()->where('slug', $slug)->where('id', '!=', $subVendor->id)->exists()) {
                $slug = $base . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        $subVendor->update($validated);

        return redirect()->route('admin.sub-vendors.index')
            ->with('success', __('Sub-vendor updated.'));
    }

    public function destroy(SubVendor $subVendor): RedirectResponse
    {
        $this->authorize('delete', $subVendor);
        $subVendor->delete();

        return redirect()->route('admin.sub-vendors.index')
            ->with('success', __('Sub-vendor deleted.'));
    }

    public function attachUser(Request $request, SubVendor $subVendor): RedirectResponse
    {
        $this->authorize('update', $subVendor);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $user = User::findOrFail($validated['user_id']);

        abort_unless($user->vendor_id === $subVendor->vendor_id, 422, 'User harus dalam vendor yang sama.');

        $user->forceFill([
            'sub_vendor_id' => $subVendor->id,
            'role' => UserRole::SubVendor->value,
        ])->save();

        return back()->with('success', 'User ditambahkan ke sub-vendor.');
    }

    public function detachUser(SubVendor $subVendor, User $user): RedirectResponse
    {
        $this->authorize('update', $subVendor);

        abort_unless($user->sub_vendor_id === $subVendor->id, 404);

        $user->forceFill([
            'sub_vendor_id' => null,
        ])->save();

        return back()->with('success', 'User dilepas dari sub-vendor.');
    }
}
