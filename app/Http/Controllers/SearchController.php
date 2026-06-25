<?php

namespace App\Http\Controllers;

use App\Models\Phase;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = $request->get('q', '');

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $user = $request->user();

        $projects = Project::where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => "project-{$p->id}",
                'type' => 'project',
                'title' => $p->name,
                'subtitle' => ($p->tasks_count ?? 0) . ' tasks',
                'url' => route('projects.show', $p->id),
            ]);

        $tasks = Task::with('project:id,name')
            ->where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id' => "task-{$t->id}",
                'type' => 'task',
                'title' => $t->name,
                'subtitle' => $t->project?->name ?? '—',
                'url' => route('projects.tasks.show', [$t->project_id, $t->id]),
            ]);

        $vendors = $user->isSuperAdmin()
            ? Vendor::where('name', 'like', "%{$q}%")
                ->limit(5)
                ->get()
                ->map(fn($v) => [
                    'id' => "vendor-{$v->id}",
                    'type' => 'vendor',
                    'title' => $v->name,
                    'subtitle' => $v->email ?? '—',
                    'url' => route('admin.vendors.edit', $v->id),
                ])
            : collect();

        $clients = User::whereRole('client')
            ->where('vendor_id', $user->vendor_id)
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'id' => "client-{$u->id}",
                'type' => 'client',
                'title' => $u->name,
                'subtitle' => $u->email,
                'url' => null,
            ]);

        $phases = Phase::with('project:id,name')
            ->where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id' => "phase-{$p->id}",
                'type' => 'phase',
                'title' => $p->name,
                'subtitle' => ($p->project?->name ?? '—') . ' — ' . ($p->tasks_count ?? 0) . ' tasks',
                'url' => $p->project_id ? route('projects.tasks.index', [...['project' => $p->project_id], 'phase_id' => $p->id]) : null,
            ]);

        $results = collect()
            ->concat($projects)
            ->concat($tasks)
            ->concat($vendors)
            ->concat($clients)
            ->concat($phases)
            ->values();

        return response()->json($results);
    }
}
