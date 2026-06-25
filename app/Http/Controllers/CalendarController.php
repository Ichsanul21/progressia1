<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $taskQuery = Task::with('project:id,name', 'assignedUser:id,name')
            ->where(function ($q) {
                $q->whereNotNull('start_date')
                  ->orWhereNotNull('due_date');
            });

        $projectQuery = Project::whereNotNull('target_date');

        if ($user->isSubVendor()) {
            $taskQuery->where('sub_vendor_id', $user->sub_vendor_id);
            $projectQuery->whereHas('tasks', fn ($q) => $q->where('sub_vendor_id', $user->sub_vendor_id));
        }

        $tasks = $taskQuery->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->name,
                'start' => $t->start_date?->toDateString(),
                'end' => $t->due_date?->toDateString(),
                'url' => route('projects.tasks.show', [$t->project_id, $t->id]),
                'project' => $t->project?->name,
                'status' => $t->status,
                'assigned_to' => $t->assignedUser?->name,
            ]);

        $projects = $projectQuery->get(['id', 'name', 'target_date'])
            ->map(fn($p) => [
                'id' => "project-{$p->id}",
                'title' => "{$p->name} (target)",
                'start' => $p->target_date,
                'end' => $p->target_date,
                'url' => route('projects.show', $p->id),
                'project' => $p->name,
                'status' => 'milestone',
            ]);

        return Inertia::render('tasks/calendar', [
            'events' => $tasks->concat($projects)->values(),
        ]);
    }

    public function project(Request $request, Project $project): Response
    {
        $tasks = $project->tasks()
            ->with('assignedUser:id,name')
            ->where(function ($q) {
                $q->whereNotNull('start_date')
                  ->orWhereNotNull('due_date');
            })
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->name,
                'start' => $t->start_date?->toDateString(),
                'end' => $t->due_date?->toDateString(),
                'url' => route('projects.tasks.show', [$project->id, $t->id]),
                'project' => $project->name,
                'status' => $t->status,
                'assigned_to' => $t->assignedUser?->name,
            ]);

        return Inertia::render('tasks/calendar', [
            'events' => $tasks,
            'project' => $project,
        ]);
    }
}
