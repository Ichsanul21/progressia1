<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectReportLink;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicReportController extends Controller
{
    public function show(Request $request, string $token)
    {
        $link = ProjectReportLink::with('project')->where('token', $token)->firstOrFail();

        if ($link->revoked_at) {
            return $this->renderStateView('public.revoked', ['token' => $token], 410);
        }

        if ($link->expires_at && $link->expires_at->isPast()) {
            return $this->renderStateView('public.expired', [
                'token' => $token,
                'expires_at' => $link->expires_at->toIso8601String(),
            ], 410);
        }

        $sessionKey = "unlocked_reports.{$link->id}";
        $unlocked = $request->session()->has($sessionKey);

        if (! $unlocked) {
            return Inertia::render('public/password', [
                'token' => $token,
                'error' => null,
            ]);
        }

        $link->recordAccess();
        $data = $this->buildReportData($link);

        return Inertia::render('public/report', $data);
    }

    public function unlock(Request $request, string $token): RedirectResponse
    {
        $link = ProjectReportLink::where('token', $token)->firstOrFail();

        if ($link->revoked_at) {
            abort(410, 'Link sudah tidak aktif.');
        }
        if ($link->expires_at && $link->expires_at->isPast()) {
            abort(410, 'Link sudah kadaluarsa.');
        }

        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($validated['password'], $link->password_hash)) {
            return back()->withErrors(['password' => 'Password salah.']);
        }

        $request->session()->put("unlocked_reports.{$link->id}", true);

        return redirect()->route('public.report.show', ['token' => $token]);
    }

    public function logout(Request $request, string $token): RedirectResponse
    {
        $link = ProjectReportLink::where('token', $token)->first();
        if ($link) {
            $request->session()->forget("unlocked_reports.{$link->id}");
        }

        return redirect()->route('public.report.show', ['token' => $token]);
    }

    public function pdf(Request $request, string $token): HttpResponse
    {
        [$link, $data] = $this->loadUnlocked($request, $token);
        $link->recordAccess();
        $data['access_count'] = $link->fresh()->access_count;

        if (! empty($data['vendor']['logo']) && Storage::disk('public')->exists($data['vendor']['logo'])) {
            $data['vendor']['logo_url'] = Storage::disk('public')->path($data['vendor']['logo']);
        } else {
            $data['vendor']['logo_url'] = null;
        }

        if (! empty($data['project']['cover_image']) && Storage::disk('public')->exists($data['project']['cover_image'])) {
            $data['project']['cover_image_url'] = Storage::disk('public')->path($data['project']['cover_image']);
        } else {
            $data['project']['cover_image_url'] = null;
        }

        $html = view('public.report-pdf', $data)->render();

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'laporan-'.Str::slug($data['project']['name']).'-'.now()->format('Y-m-d').'.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function csv(Request $request, string $token): StreamedResponse
    {
        [$link, $data] = $this->loadUnlocked($request, $token);
        $link->recordAccess();
        $data['access_count'] = $link->fresh()->access_count;

        $filename = 'laporan-'.Str::slug($data['project']['name']).'-'.now()->format('Y-m-d').'.csv';

        return response()->stream(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Project', 'Vendor', 'Project Status', 'Project Progress %', 'Phase', 'Task', 'Task Status', 'Task Progress %', 'Task Updated At']);

            foreach ($data['phases'] as $phase) {
                if (empty($phase['tasks'])) {
                    fputcsv($out, [
                        $data['project']['name'],
                        $data['vendor']['name'] ?? '',
                        $data['project']['status'],
                        $data['project']['progress'],
                        $phase['name'],
                        '',
                        '',
                        '',
                        '',
                    ]);
                    continue;
                }
                foreach ($phase['tasks'] as $task) {
                    fputcsv($out, [
                        $data['project']['name'],
                        $data['vendor']['name'] ?? '',
                        $data['project']['status'],
                        $data['project']['progress'],
                        $phase['name'],
                        $task['name'],
                        $task['status'],
                        $task['progress'],
                        $task['updated_at'] ?? '',
                    ]);
                }
            }

            fclose($out);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * @return array{0: ProjectReportLink, 1: array<string, mixed>}
     */
    private function loadUnlocked(Request $request, string $token): array
    {
        $link = ProjectReportLink::with('project')->where('token', $token)->firstOrFail();

        if ($link->revoked_at) {
            abort(410, 'Link sudah tidak aktif.');
        }
        if ($link->expires_at && $link->expires_at->isPast()) {
            abort(410, 'Link sudah kadaluarsa.');
        }

        if (! $request->session()->has("unlocked_reports.{$link->id}")) {
            abort(403, 'Silakan masukkan password terlebih dahulu.');
        }

        $data = $this->buildReportData($link);

        return [$link, $data];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildReportData(ProjectReportLink $link): array
    {
        $project = $link->project;
        $project->load([
            'vendor:id,name,logo',
            'clients:id,name,phone',
            'phases' => fn ($q) => $q->with(['tasks' => function ($q2) {
                $q2->with([
                    // 'progressUpdates' => fn ($q3) => $q3->with('photos')->latest()->limit(1),
                    'progressUpdates' => fn ($q3) => $q3->with('photos')->latest(),
                ])->orderBy('sort_order');
            }])->orderBy('sort_order'),
        ]);

        $rabTotal = (float) ($project->rabItems()->toBase()->selectRaw('SUM(COALESCE(volume * unit_price, 0)) as total')->reorder()->value('total') ?? 0);
        $rabCount = $project->rabItems()->count();

        $whatsappPhone = $project->clients()->whereNotNull('phone')->orderBy('id')->first()?->phone;

        return [
            'token' => $link->token,
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'progress' => $project->progress,
                'start_date' => $project->start_date?->toDateString(),
                'target_date' => $project->target_date?->toDateString(),
                'cover_image' => $project->cover_image,
                'cover_image_url' => $project->cover_image ? Storage::disk('public')->url($project->cover_image) : null,
                'budget' => $project->budget,
            ],
            'vendor' => $project->vendor ? [
                'id' => $project->vendor->id,
                'name' => $project->vendor->name,
                'logo' => $project->vendor->logo,
                'logo_url' => $project->vendor->logo ? Storage::disk('public')->url($project->vendor->logo) : null,
            ] : null,
            'rab_summary' => [
                'items' => $rabCount,
                'total' => round((float) $rabTotal, 2),
            ],
            'phases' => $project->phases->map(function ($phase) {
                return [
                    'id' => $phase->id,
                    'name' => $phase->name,
                    'progress' => $phase->progress,
                    'status' => $phase->status,
                    'tasks' => $phase->tasks->map(function ($task) {
                        $latest = $task->progressUpdates->first();

                        return [
                            'id' => $task->id,
                            'name' => $task->name,
                            'status' => $task->status,
                            'progress' => $task->progress,
                            'updated_at' => $task->updated_at?->toIso8601String(),
                            'latest_update' => $latest ? [
                                'description' => $latest->description,
                                'created_at' => $latest->created_at?->toIso8601String(),
                                'photos' => $latest->photos->map(fn ($p) => [
                                    'id' => $p->id,
                                    'path' => $p->path,
                                    'url' => Storage::disk('public')->url($p->path),
                                ])->toArray(),
                            ] : null,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
            'whatsapp_phone' => $whatsappPhone,
            'client_name' => $project->clients()->orderBy('id')->first()?->name,
            'access_count' => $link->access_count,
            'expires_at' => $link->expires_at?->toIso8601String(),
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    private function renderStateView(string $view, array $data, int $status): HttpResponse
    {
        $html = view($view, $data)->render();

        return response($html, $status, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
