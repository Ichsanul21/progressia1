<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    private const DEFAULT_PASSWORD = 'password';
    public function index(Request $request): Response
    {
        $vendors = Vendor::withCount('users');

        if ($search = $request->get('search')) {
            $vendors->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $vendors = $vendors->orderBy('name')->paginate(10);

        return Inertia::render('vendors/index', [
            'vendors' => $vendors,
            'filters' => $request->only('search'),
            'canDelete' => $request->user()->can('delete', Vendor::class),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('vendors/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Vendor::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:' . config('validation.email_max'), 'unique:vendors,email,NULL,id,deleted_at,NULL'],
            'phone' => ['nullable', 'string', 'max:' . config('validation.phone_max')],
            'contact_phone' => ['nullable', 'string', 'max:' . config('validation.contact_phone_max')],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'contact_person' => ['required', 'string', 'max:' . config('validation.contact_person_max')],
            'website' => ['nullable', 'url', 'max:' . config('validation.website_max')],
            'city' => ['nullable', 'string', 'max:' . config('validation.city_max')],
            'province' => ['nullable', 'string', 'max:' . config('validation.province_max')],
            'postal_code' => ['nullable', 'string', 'max:' . config('validation.postal_code_max')],
            'npwp' => ['nullable', 'string', 'max:' . config('validation.npwp_max')],
            'license_number' => ['nullable', 'string', 'max:' . config('validation.license_number_max')],
            'established_year' => ['nullable', 'integer', 'min:' . config('validation.established_year_min'), 'max:' . date('Y')],
            'default_lang' => ['nullable', 'string', 'max:' . config('validation.default_lang_max')],
            'timezone' => ['nullable', 'string', 'max:' . config('validation.timezone_max')],
            'is_active' => ['boolean'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:' . config('validation.logo_max')],
        ]);

        $base = Str::slug($validated['name']);
        $slug = $base;
        $counter = 1;
        while (Vendor::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $counter++;
        }
        $validated['slug'] = $slug;

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('vendor-logos', 'public');
            \App\Support\ImageSanitizer::sanitize($request->file('logo'), \Storage::disk('public')->path($validated['logo']));
        }

        $vendor = Vendor::create($validated);

        $existingUser = User::where('email', $vendor->email)->first();
        $trashedSameEmail = User::withTrashed()->where('email', $vendor->email)->whereNotNull('deleted_at')->exists();

        if (! $existingUser) {
            $user = User::create([
                'name' => $vendor->contact_person ?: $vendor->name,
                'email' => $vendor->email,
                'phone' => $vendor->contact_phone ?: $vendor->phone ?: '+62000000000000',
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => UserRole::AdminVendor->value,
                'vendor_id' => $vendor->id,
                'must_change_password' => true,
                'password_changed_at' => null,
            ]);

            $message = $trashedSameEmail
                ? "Vendor dibuat. Akun admin: {$user->email} / ".self::DEFAULT_PASSWORD.' (email ini sebelumnya dipakai user non-aktif, sekarang aktif untuk vendor baru, wajib ganti saat login pertama).'
                : "Vendor dibuat. Akun admin: {$user->email} / ".self::DEFAULT_PASSWORD.' (wajib ganti saat login pertama).';

            return redirect()->route('admin.vendors.index')->with('success', $message);
        }

        return redirect()->route('admin.vendors.index')
            ->with('success', 'Vendor dibuat. Email sudah terdaftar di user existing, tidak membuat akun baru.');
    }

    public function edit(Vendor $vendor): Response
    {
        return Inertia::render('vendors/edit', [
            'vendor' => $vendor,
        ]);
    }

    public function update(Request $request, Vendor $vendor): RedirectResponse
    {
        $this->authorize('update', $vendor);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'email' => ['nullable', 'email', 'max:' . config('validation.email_max')],
            'phone' => ['nullable', 'string', 'max:' . config('validation.phone_max')],
            'contact_phone' => ['nullable', 'string', 'max:' . config('validation.contact_phone_max')],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:' . config('validation.contact_person_max')],
            'website' => ['nullable', 'url', 'max:' . config('validation.website_max')],
            'city' => ['nullable', 'string', 'max:' . config('validation.city_max')],
            'province' => ['nullable', 'string', 'max:' . config('validation.province_max')],
            'postal_code' => ['nullable', 'string', 'max:' . config('validation.postal_code_max')],
            'npwp' => ['nullable', 'string', 'max:' . config('validation.npwp_max')],
            'license_number' => ['nullable', 'string', 'max:' . config('validation.license_number_max')],
            'established_year' => ['nullable', 'integer', 'min:' . config('validation.established_year_min'), 'max:' . date('Y')],
            'default_lang' => ['nullable', 'string', 'max:' . config('validation.default_lang_max')],
            'timezone' => ['nullable', 'string', 'max:' . config('validation.timezone_max')],
            'is_active' => ['boolean'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:' . config('validation.logo_max')],
        ]);

        if ($validated['name'] !== $vendor->name) {
            $base = Str::slug($validated['name']);
            $slug = $base;
            $counter = 1;
            while (Vendor::withTrashed()->where('slug', $slug)->where('id', '!=', $vendor->id)->exists()) {
                $slug = $base . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('vendor-logos', 'public');
            \App\Support\ImageSanitizer::sanitize($request->file('logo'), \Storage::disk('public')->path($validated['logo']));
        }

        $vendor->update($validated);

        return redirect()->route('admin.vendors.index')
            ->with('success', __('Vendor updated.'));
    }

    public function destroy(Vendor $vendor): RedirectResponse
    {
        $this->authorize('delete', $vendor);

        $vendor->delete();

        return redirect()->route('admin.vendors.index')
            ->with('success', __('Vendor deleted.'));
    }

    public function restore(int $id): RedirectResponse
    {
        $vendor = Vendor::withTrashed()->findOrFail($id);
        $this->authorize('restore', $vendor);
        $vendor->restore();

        return redirect()->route('admin.vendors.index')
            ->with('success', __('Vendor restored.'));
    }
}
