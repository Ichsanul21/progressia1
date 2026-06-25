<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Events\RegistrantSubmitted;
use App\Models\Registrant;
use App\Models\SubVendor;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegistrantController extends Controller
{
    private const PHONE_REGEX = '/^\+628\d{8,11}$/';

    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'industries' => Registrant::INDUSTRIES,
            'teamSizes' => Registrant::TEAM_SIZES,
            'sources' => Registrant::SOURCES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($this->isHoneypotTriggered($request)) {
            return back()->with('success', 'Pendaftaran terkirim. Tim kami akan menghubungi Anda segera.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150'],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_REGEX],
            'company_name' => ['required', 'string', 'max:150'],
            'industry' => ['required', 'string', 'in:'.implode(',', array_keys(Registrant::INDUSTRIES))],
            'team_size' => ['required', 'string', 'in:'.implode(',', array_keys(Registrant::TEAM_SIZES))],
            'source' => ['required', 'string', 'in:'.implode(',', array_keys(Registrant::SOURCES))],
            'message' => ['nullable', 'string', 'max:1000'],
        ], [
            'phone.regex' => 'Nomor WhatsApp harus berformat +628xxxxxxxxx.',
        ]);

        if (User::withTrashed()->where('email', $validated['email'])->exists()) {
            return back()->withErrors(['email' => 'Email ini sudah pernah terdaftar di Progressia. Silakan login atau gunakan email lain.']);
        }

        $existing = Registrant::where('email', $validated['email'])->first();
        if ($existing && in_array($existing->status, [Registrant::STATUS_PENDING, Registrant::STATUS_CONTACTED], true)) {
            return back()->withErrors(['email' => 'Pendaftaran Anda sedang diproses. Tim kami akan menghubungi Anda segera.']);
        }

        $registrant = $existing
            ? tap($existing)->update($validated + ['status' => Registrant::STATUS_PENDING])
            : Registrant::create($validated + ['status' => Registrant::STATUS_PENDING]);

        RegistrantSubmitted::dispatch($registrant);

        return back()->with('success', 'Pendaftaran terkirim. Tim kami akan menghubungi Anda via WhatsApp dalam 1x24 jam.');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Registrant::class);

        $search = $request->get('search');
        $status = $request->get('status');

        $query = Registrant::query()->latest();

        if ($status && in_array($status, Registrant::STATUSES, true)) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        return Inertia::render('admin/registrants/index', [
            'registrants' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'status']),
            'statuses' => Registrant::STATUSES,
            'industries' => Registrant::INDUSTRIES,
            'teamSizes' => Registrant::TEAM_SIZES,
            'sources' => Registrant::SOURCES,
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function show(Registrant $registrant): Response
    {
        $this->authorize('view', $registrant);

        return Inertia::render('admin/registrants/index', [
            'registrant' => $registrant,
        ]);
    }

    public function updateStatus(Request $request, Registrant $registrant): RedirectResponse
    {
        $this->authorize('updateStatus', $registrant);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', [Registrant::STATUS_CONTACTED, Registrant::STATUS_REJECTED])],
        ]);

        if (! in_array($registrant->status, [Registrant::STATUS_PENDING, Registrant::STATUS_CONTACTED], true)) {
            return back()->with('error', 'Status hanya bisa diubah dari pending atau contacted.');
        }

        $registrant->forceFill([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'contacted_at' => $validated['status'] === Registrant::STATUS_CONTACTED ? now() : $registrant->contacted_at,
        ])->save();

        return redirect()
            ->route('admin.registrants.index', Arr::only($request->query(), ['search', 'status']))
            ->with('success', 'Status diperbarui.');
    }

    public function convert(Request $request, Registrant $registrant): RedirectResponse
    {
        $this->authorize('convert', $registrant);

        $allowedRoles = [
            UserRole::AdminVendor->value,
            UserRole::ProjectManager->value,
            UserRole::Team->value,
            UserRole::Client->value,
            UserRole::SubVendor->value,
        ];

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:'.implode(',', $allowedRoles)],
            'vendor_id' => ['required', 'exists:vendors,id'],
            'sub_vendor_id' => ['nullable', 'required_if:role,sub_vendor', 'exists:sub_vendors,id'],
        ]);

        $vendor = Vendor::findOrFail($validated['vendor_id']);
        abort_unless($vendor, 404);

        if ($validated['role'] === UserRole::SubVendor->value) {
            abort_unless($validated['sub_vendor_id'], 422, 'Sub-vendor wajib diisi untuk role sub_vendor.');
            $subVendor = SubVendor::findOrFail($validated['sub_vendor_id']);
            abort_unless($subVendor->vendor_id === $vendor->id, 422, 'Sub-vendor harus dalam vendor yang sama.');
        } else {
            $validated['sub_vendor_id'] = null;
        }

        $defaultPassword = 'password';
        $phone = $registrant->phone;

        $user = DB::transaction(function () use ($registrant, $validated, $defaultPassword) {
            $u = User::create([
                'name' => $registrant->name,
                'email' => $registrant->email,
                'phone' => $registrant->phone,
                'password' => Hash::make($defaultPassword),
                'role' => $validated['role'],
                'vendor_id' => $validated['vendor_id'],
                'sub_vendor_id' => $validated['sub_vendor_id'] ?? null,
                'must_change_password' => true,
                'password_changed_at' => null,
            ]);

            $registrant->forceFill([
                'status' => Registrant::STATUS_CONVERTED,
                'converted_user_id' => $u->id,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ])->save();

            return $u;
        });

        $loginUrl = route('login');
        $message = "Halo {$user->name}, akun Progressia Anda sudah aktif.\n\n"
            . "Email: {$user->email}\n"
            . "Password: {$defaultPassword}\n"
            . "Login: {$loginUrl}\n\n"
            . 'Wajib ganti password setelah login pertama.';

        return redirect()
            ->route('admin.registrants.index', Arr::only($request->query(), ['search', 'status']))
            ->with([
                'success' => 'Akun berhasil dibuat.',
                'waLink' => 'https://wa.me/'.preg_replace('/\D/', '', $phone).'?text='.rawurlencode($message),
                'convertedUser' => ['name' => $user->name, 'email' => $user->email, 'phone' => $phone],
            ]);
    }

    public function destroy(Request $request, Registrant $registrant): RedirectResponse
    {
        $this->authorize('delete', $registrant);

        $registrant->delete();

        return redirect()
            ->route('admin.registrants.index', Arr::only($request->query(), ['search', 'status']))
            ->with('success', 'Pendaftar dihapus.');
    }

    private function isHoneypotTriggered(Request $request): bool
    {
        return trim((string) $request->input('website', '')) !== '';
    }
}
