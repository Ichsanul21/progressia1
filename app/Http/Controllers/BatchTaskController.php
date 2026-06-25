<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class BatchTaskController extends Controller
{
    public function updateStatus(Request $request, Project $project): RedirectResponse
    {
        abort_unless($request->user()->canBypassPhotoRequirement(), 403, 'Hanya admin yang bisa batch update status. Gunakan form edit untuk upload foto bukti.');

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['required', 'exists:tasks,id'],
            'status' => ['required', 'string', 'in:not_started,in_progress,review,done'],
        ]);

        $tasks = $project->tasks()->whereIn('id', $validated['task_ids'])->get();

        foreach ($tasks as $task) {
            $this->authorize('update', $task);
        }

        $progressMap = [
            'not_started' => 0,
            'in_progress' => 25,
            'review' => 75,
            'done' => 100,
        ];

        DB::transaction(function () use ($tasks, $validated, $progressMap) {
            foreach ($tasks as $task) {
                $task->update([
                    'status' => $validated['status'],
                    'progress' => $progressMap[$validated['status']],
                ]);
                $task->recalculateProgressFromSubTasks();
            }
        });

        $project->recalculateProgressFromTasks();

        return redirect()
            ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
            ->with('success', __(':count tasks updated.', ['count' => count($tasks)]));
    }

    public function assign(Request $request, Project $project): RedirectResponse
    {
        abort_unless($request->user()->canBypassPhotoRequirement(), 403, 'Hanya admin yang bisa batch assign. Gunakan form edit untuk update per task.');

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['required', 'exists:tasks,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $tasks = $project->tasks()->whereIn('id', $validated['task_ids'])->get();

        foreach ($tasks as $task) {
            $this->authorize('update', $task);
        }

        $project->tasks()->whereIn('id', $validated['task_ids'])->update([
            'assigned_to' => $validated['assigned_to'],
        ]);

        return redirect()
            ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
            ->with('success', __(':count tasks assigned.', ['count' => count($tasks)]));
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['required', 'exists:tasks,id'],
        ]);

        $tasks = $project->tasks()->whereIn('id', $validated['task_ids'])->get();

        foreach ($tasks as $task) {
            $this->authorize('delete', $task);
        }

        $project->tasks()->whereIn('id', $validated['task_ids'])->delete();

        $project->recalculateProgressFromTasks();

        return redirect()
            ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
            ->with('success', __(':count tasks deleted.', ['count' => count($tasks)]));
    }
}
