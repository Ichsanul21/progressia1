<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectReportLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectReportLinkController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('manageReportLinks', $project);

        [$link, $password] = ProjectReportLink::generateFor($project, $request->user());

        return back()->with('success', 'Link laporan berhasil dibuat.')
            ->with('new_report_link', [
                'id' => $link->id,
                'token' => $link->token,
                'password' => $password,
                'expires_at' => $link->expires_at?->toIso8601String(),
            ]);
    }

    public function destroy(Request $request, Project $project, ProjectReportLink $link): RedirectResponse
    {
        $this->authorize('manageReportLinks', $project);

        abort_unless($link->project_id === $project->id, 404);

        $link->revoke();

        return back()->with('success', 'Link laporan berhasil di-revoke.');
    }

    public function reveal(Request $request, Project $project, ProjectReportLink $link): JsonResponse
    {
        $this->authorize('manageReportLinks', $project);

        abort_unless($link->project_id === $project->id, 404);

        if ($link->revoked_at) {
            return response()->json(['error' => 'Link sudah di-revoke.'], 410);
        }
        if ($link->expires_at && $link->expires_at->isPast()) {
            return response()->json(['error' => 'Link sudah kadaluarsa.'], 410);
        }

        $plain = $link->plain_password;
        if (! $plain) {
            return response()->json([
                'error' => 'Password tidak tersedia. Buat link baru atau reset password untuk link ini.',
            ], 404);
        }

        $link->recordReveal();

        return response()->json(['password' => $plain]);
    }

    public function resetPassword(Request $request, Project $project, ProjectReportLink $link): RedirectResponse
    {
        $this->authorize('manageReportLinks', $project);

        abort_unless($link->project_id === $project->id, 404);
        abort_if($link->revoked_at, 410, 'Link sudah di-revoke.');

        $newPassword = $link->resetPassword();

        return back()->with('success', 'Password berhasil direset. Password lama sudah tidak berlaku.')
            ->with('reset_report_link', [
                'id' => $link->id,
                'password' => $newPassword,
            ]);
    }
}
