<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Project $project, Request $request): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('viewAny', Task::class);

        $project->loadCount('phases', 'tasks');

        $query = $project->tasks()->with('assignedUser:id,name', 'subVendor:id,name');

        $user = $request->user();
        if ($user->isSubVendor()) {
            $query->where('sub_vendor_id', $user->sub_vendor_id);
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($priority = $request->priority) {
            $query->where('priority', $priority);
        }

        if ($phaseId = $request->phase_id) {
            $query->where('phase_id', $phaseId);
        }

        if ($search = trim((string) $request->get('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('sort_order')->orderBy('created_at', 'desc')->paginate(10);

        $phases = $project->phases()->get(['id', 'name']);

        return Inertia::render('tasks/index', [
            'project' => $project,
            'tasks' => $tasks,
            'phases' => $phases,
            'filters' => $request->only(['status', 'priority', 'phase_id', 'search']),
            'members' => $project->members()->get(['users.id', 'users.name']),
            'canCreate' => $user->can('create', Task::class),
            'canUpdate' => $user->can('update', Task::class),
            'canDelete' => $user->can('delete', Task::class),
        ]);
    }

    public function kanban(Request $request, Project $project): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('viewAny', Task::class);

        $project->loadCount('phases', 'tasks');

        $tasks = $project->tasks()->with('assignedUser:id,name', 'phase:id,name')->get();

        $user = $request->user();

        return Inertia::render('tasks/kanban', [
            'project' => $project,
            'tasks' => $tasks,
            'canCreate' => $user->can('create', Task::class),
        ]);
    }

    public function gantt(Request $request, Project $project): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('viewAny', Task::class);

        $project->loadCount('phases', 'tasks');

        $phases = $project->phases()->orderBy('sort_order')->get(['id', 'name', 'start_date', 'end_date', 'progress', 'sort_order']);

        $tasks = $project->tasks()
            ->with('phase:id,name,sort_order')
            ->orderBy('phase_id')
            ->orderBy('sort_order')
            ->get();

        $ganttTasks = [];

        foreach ($phases as $phase) {
            $ganttTasks[] = [
                'id' => "phase-{$phase->id}",
                'type' => 'project',
                'name' => $phase->name,
                'start' => $phase->start_date?->toDateString() ?? $tasks->firstWhere('phase_id', $phase->id)?->start_date?->toDateString() ?? now()->toDateString(),
                'end' => $phase->end_date?->toDateString() ?? $tasks->where('phase_id', $phase->id)->max('due_date')?->toDateString() ?? now()->addMonth()->toDateString(),
                'progress' => $phase->progress,
                'hideChildren' => false,
                'displayOrder' => $phase->sort_order,
            ];
        }

            foreach ($tasks as $task) {
                $item = [
                    'id' => (string) $task->id,
                    'type' => 'task',
                    'name' => $task->name,
                    'start' => $task->start_date?->toDateString() ?? now()->toDateString(),
                    'end' => $task->due_date?->toDateString() ?? now()->addWeek()->toDateString(),
                    'progress' => $task->progress,
                    'displayOrder' => $task->sort_order,
                ];
                if ($task->phase_id) {
                    $item['project'] = "phase-{$task->phase_id}";
                }
                $ganttTasks[] = $item;
            }

        return Inertia::render('tasks/gantt', [
            'project' => $project,
            'tasks' => $ganttTasks,
        ]);
    }

    public function updateStatus(Request $request, Project $project): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        abort_unless($request->user()->canBypassPhotoRequirement(), 403, 'Hanya admin yang bisa ubah status via kanvan. Gunakan form edit untuk upload foto bukti.');

        $validated = $request->validate([
            'id' => ['required', 'exists:tasks,id'],
            'status' => ['required', 'string', 'in:not_started,in_progress,review,done'],
        ]);

        $task = Task::findOrFail($validated['id']);
        $this->authorize('update', $task);

        $task->update(['status' => $validated['status']]);

        return redirect()
            ->route('projects.tasks.index', $project)
            ->with('success', __('Task status updated.'));
    }

    public function create(Request $request, Project $project): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('create', Task::class);

        $project->loadCount('phases', 'tasks');

        $phases = $project->phases()->get(['id', 'name']);

        $currentPhase = null;
        if ($phaseId = $request->phase_id) {
            $currentPhase = $phases->firstWhere('id', (int) $phaseId);
        }

        return Inertia::render('tasks/create', [
            'project' => $project,
            'phases' => $phases,
            'members' => $project->members()->get(['users.id', 'users.name']),
            'subVendors' => $project->vendor_id
                ? \App\Models\SubVendor::where('vendor_id', $project->vendor_id)->orderBy('name')->get(['id', 'name'])
                : [],
            'currentPhase' => $currentPhase,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('create', Task::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'phase_id' => ['nullable', 'exists:phases,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'sub_vendor_id' => ['nullable', 'exists:sub_vendors,id'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurrence_frequency' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
            'recurrence_interval' => ['nullable', 'integer', 'min:1'],
            'recurrence_end_date' => ['nullable', 'date', 'after:start_date'],
        ]);

        $validated['project_id'] = $project->id;
        $validated['created_by'] = $request->user()->id;

        $project->tasks()->create($validated);

        return redirect()->route('projects.tasks.index', $project)
            ->with('success', __('Task created.'));
    }

    public function show(Request $request, Project $project, Task $task): Response
    {
        $this->authorize('view', $task);

        $task->load([
            'assignedUser:id,name',
            'phase:id,name',
            'subTasks' => fn($q) => $q->whereNull('parent_id')->orderBy('sort_order'),
            'subTasks.assignedUser:id,name',
            'subTasks.children',
            'subTasks.children.assignedUser:id,name',
            'subTasks.activityLogs' => fn($q) => $q->with('user:id,name')->latest(),
            'subTasks.progressUpdates' => fn($q) => $q->with('photos', 'createdBy:id,name')->latest(),
            'progressUpdates' => fn($q) => $q->with('photos', 'createdBy:id,name')->latest(),
            'comments' => fn($q) => $q->with('user:id,name')->latest(),
            'attachments' => fn($q) => $q->with('uploader:id,name')->latest(),
            'activityLogs' => fn($q) => $q->with('user:id,name')->latest()->limit(50),
            'pendingApprovals',
        ]);
        $task->has_pending_approval = $task->hasPendingApproval;

        $user = $request->user();

        return Inertia::render('tasks/show', [
            'project' => $project->loadCount('phases', 'tasks'),
            'task' => $task->load('assignedUser:id,name', 'phase:id,name', 'subVendor:id,name', 'updater:id,name'),
            'members' => $project->members()->get(['users.id', 'users.name']),
            'isClient' => $user->isClient(),
            'can' => [
                'delete' => $user->can('delete', $task),
                'update' => $user->can('update', $task),
                'create' => $user->can('create', Task::class),
            ],
        ]);
    }

    public function edit(Request $request, Project $project, Task $task): Response
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $task);

        $user = $request->user();

        $task->load('assignedUser:id,name', 'phase:id,name', 'subVendor:id,name');

        return Inertia::render('tasks/edit', [
            'project' => $project->loadCount('phases', 'tasks'),
            'task' => $task,
            'phases' => $project->phases()->get(['id', 'name']),
            'members' => $project->members()->get(['users.id', 'users.name']),
            'subVendors' => $project->vendor_id
                ? \App\Models\SubVendor::where('vendor_id', $project->vendor_id)->orderBy('name')->get(['id', 'name'])
                : [],
            'canChangeDates' => $user->canManageSchedule(),
        ]);
    }

    public function update(Request $request, Project $project, Task $task): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $task);

        $user = $request->user();
        $bypassPhoto = $user->canBypassPhotoRequirement() && $request->boolean('administrative_update');

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['sometimes', 'nullable', 'string', 'max:' . config('validation.description_max')],
            'phase_id' => ['sometimes', 'nullable', 'exists:phases,id'],
            'assigned_to' => ['sometimes', 'nullable', 'exists:users,id'],
            'sub_vendor_id' => ['sometimes', 'nullable', 'exists:sub_vendors,id'],
            'priority' => ['sometimes', 'nullable', 'string', 'in:low,medium,high,urgent'],
            'status' => ['sometimes', 'nullable', 'string', 'in:not_started,in_progress,review,done,revisi'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'is_recurring' => ['sometimes', 'nullable', 'boolean'],
            'recurrence_frequency' => ['sometimes', 'nullable', 'string', 'in:daily,weekly,monthly,yearly'],
            'recurrence_interval' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'recurrence_end_date' => ['sometimes', 'nullable', 'date', 'after:start_date'],
            'progress' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
        ];

        $statusChanged = $request->has('status') && $request->input('status') !== $task->status;
        $progressChanged = $request->has('progress') && (int) $request->input('progress') !== $task->progress;
        $needsPhoto = ! $bypassPhoto && ($statusChanged || $progressChanged || $request->hasFile('photos'));

        if ($needsPhoto) {
            $rules['photos'] = ['required', 'array', 'min:3', 'max:10'];
            $rules['photos.*'] = ['required', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        } else {
            $rules['photos'] = ['nullable', 'array', 'max:10'];
            $rules['photos.*'] = ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        }

        if ($statusChanged || $progressChanged) {
            $rules['progress_description'] = ['required', 'string', 'min:10', 'max:' . config('validation.description_max')];
        }

        $validated = $request->validate($rules);

        $this->validateStatusTransition($user, $task->status, $validated['status'] ?? null);

        $validated['updated_by'] = $user->id;

        if (! $user->canManageSchedule()) {
            unset($validated['start_date'], $validated['due_date'], $validated['recurrence_end_date']);
        }

        $hasPhotos = ! empty($request->file('photos'));

        DB::transaction(function () use ($request, $task, $validated, $hasPhotos, $bypassPhoto) {
            $task->update($validated);

            if ($hasPhotos) {
                $update = $task->progressUpdates()->create([
                    'description' => $request->input('progress_description', ''),
                    'created_by' => $request->user()->id,
                ]);
                foreach ($request->file('photos', []) as $photo) {
                    $path = $photo->store('progress/task_' . $task->id, 'public');
                    \App\Support\ImageSanitizer::sanitize($photo, \Storage::disk('public')->path($path));
                    $update->photos()->create(['path' => $path]);
                }
            }

        });

        return redirect()
            ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
            ->with('success', $bypassPhoto ? __('Task updated (administrative).') : __('Task updated.'));
    }

    public function updateProgress(Request $request, Project $project, Task $task): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('updateProgress', $task);

        $user = $request->user();
        $bypassPhoto = $user->canBypassPhotoRequirement() && $request->boolean('administrative_update');

        if ($request->input('status') === $task->status && empty($request->file('photos'))) {
            return redirect()
                ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
                ->with('info', __('Tidak ada perubahan untuk disimpan.'));
        }

        $rules = [
            'status' => ['required', 'string', 'in:not_started,in_progress,review,done,revisi'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'progress_description' => ['required', 'string', 'min:10', 'max:' . config('validation.description_max')],
        ];

        if (! $bypassPhoto) {
            $rules['photos'] = ['required', 'array', 'min:3', 'max:10'];
            $rules['photos.*'] = ['required', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        } else {
            $rules['photos'] = ['nullable', 'array', 'max:10'];
            $rules['photos.*'] = ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        }

        $validated = $request->validate($rules);

        $this->validateStatusTransition($user, $task->status, $validated['status']);

        $validated['updated_by'] = $user->id;

        DB::transaction(function () use ($request, $task, $validated, $user) {
            $task->update($validated);

            if (! empty($request->file('photos'))) {
                $update = $task->progressUpdates()->create([
                    'description' => $validated['progress_description'],
                    'created_by' => $user->id,
                ]);
                foreach ($request->file('photos', []) as $photo) {
                    $path = $photo->store('progress/task_' . $task->id, 'public');
                    \App\Support\ImageSanitizer::sanitize($photo, \Storage::disk('public')->path($path));
                    $update->photos()->create(['path' => $path]);
                }
            }

        });

        return redirect()
            ->route('projects.tasks.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'status', 'priority', 'assigned_to', 'phase_id'])))
            ->with('success', $bypassPhoto ? __('Task progress updated (administrative).') : __('Task progress updated.'));
    }

    private function validateStatusTransition($user, string $current, ?string $new): void
    {
        if (! $new || $new === $current) {
            return;
        }

        if ($user->canBypassPhotoRequirement()) {
            return;
        }

        $validTransitions = [
            'not_started' => ['in_progress'],
            'in_progress' => ['review'],
            'review' => ['done', 'revisi'],
            'revisi' => ['review'],
            'done' => [],
        ];

        if (! in_array($new, $validTransitions[$current] ?? [])) {
            $allowed = $validTransitions[$current] ?? [];
            $message = empty($allowed)
                ? "Status '{$current}' tidak bisa diubah (status terminal)."
                : "Transisi dari '{$current}' ke '{$new}' tidak diizinkan. Hanya bisa ke: " . implode(', ', $allowed) . ".";
            throw \Illuminate\Validation\ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('delete', $task);

        $phase = $task->phase;

        DB::transaction(function () use ($task) {
            $task->delete();
        });

        return redirect()->route('projects.tasks.index', $project)
            ->with('success', __('Task deleted.'));
    }

    public function timeline(Request $request, Project $project, Task $task)
    {
        $this->authorize('view', $task);

        $task->load(['subTasks', 'subTasks.progressUpdates', 'subTasks.activityLogs']);

        $type = $request->get('type', 'all');
        $q = trim((string) $request->get('q', ''));
        $offset = max(0, (int) $request->get('offset', 0));
        $limit = 50;

        $entries = collect();

        if ($type === 'all' || $type === 'activity') {
            $activityLogs = \App\Models\ActivityLog::with('user:id,name')
                ->where(function ($query) use ($task) {
                    $query->where(function ($q) use ($task) {
                        $q->where('subject_type', \App\Models\Task::class)
                            ->where('subject_id', $task->id);
                    });

                    foreach ($task->subTasks as $subTask) {
                        $query->orWhere(function ($q) use ($subTask) {
                            $q->where('subject_type', \App\Models\SubTask::class)
                                ->where('subject_id', $subTask->id);
                        });
                    }
                })
                ->when($q !== '', function ($query) use ($q) {
                    $query->where('description', 'like', "%{$q}%");
                })
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => "activity-{$log->id}",
                        'type' => 'activity',
                        'event' => $log->event,
                        'description' => $log->description,
                        'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
                        'created_at' => $log->created_at?->toIso8601String(),
                        'old_values' => $log->old_values,
                        'new_values' => $log->new_values,
                        'photos' => [],
                    ];
                });
            $entries = $entries->merge($activityLogs);
        }

        if ($type === 'all' || $type === 'progress') {
            $taskProgress = $task->progressUpdates()
                ->with(['photos', 'createdBy:id,name'])
                ->when($q !== '', function ($query) use ($q) {
                    $query->where('description', 'like', "%{$q}%");
                })
                ->get()
                ->map(function ($update) use ($task) {
                    return [
                        'id' => "progress-task-{$update->id}",
                        'type' => 'progress',
                        'subject' => 'task',
                        'subject_id' => $task->id,
                        'subject_name' => $task->name,
                        'description' => $update->description,
                        'user' => $update->createdBy ? ['id' => $update->createdBy->id, 'name' => $update->createdBy->name] : null,
                        'created_at' => $update->created_at?->toIso8601String(),
                        'photos' => $update->photos->map(fn($p) => ['id' => $p->id, 'path' => $p->path])->toArray(),
                    ];
                });
            $entries = $entries->merge($taskProgress);

            foreach ($task->subTasks as $subTask) {
                $subUpdates = $subTask->progressUpdates()
                    ->with(['photos', 'createdBy:id,name'])
                    ->when($q !== '', function ($query) use ($q) {
                        $query->where('description', 'like', "%{$q}%");
                    })
                    ->get()
                    ->map(function ($update) use ($subTask) {
                        return [
                            'id' => "progress-sub-{$update->id}",
                            'type' => 'progress',
                            'subject' => 'sub_task',
                            'subject_id' => $subTask->id,
                            'subject_name' => $subTask->name,
                            'description' => $update->description,
                            'user' => $update->createdBy ? ['id' => $update->createdBy->id, 'name' => $update->createdBy->name] : null,
                            'created_at' => $update->created_at?->toIso8601String(),
                            'photos' => $update->photos->map(fn($p) => ['id' => $p->id, 'path' => $p->path])->toArray(),
                        ];
                    });
                $entries = $entries->merge($subUpdates);
            }
        }

        $sorted = $entries->sortByDesc(fn($e) => $e['created_at'] ?? '')->values();
        $total = $sorted->count();
        $page = $sorted->slice($offset, $limit)->values();

        return response()->json([
            'entries' => $page,
            'has_more' => ($offset + $limit) < $total,
            'total' => $total,
            'offset' => $offset,
        ]);
    }
}
