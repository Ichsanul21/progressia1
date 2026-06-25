<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SubTask;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubTaskController extends Controller
{
    public function store(Request $request, Project $project, Task $task): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('create', SubTask::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'parent_id' => [
                'nullable',
                'exists:sub_tasks,id',
                function ($attribute, $value, $fail) use ($task) {
                    if ($value && !SubTask::where('id', $value)->where('task_id', $task->id)->exists()) {
                        $fail(__('The selected parent sub-task does not belong to this task.'));
                    }
                },
            ],
        ]);

        $validated['task_id'] = $task->id;
        $validated['status'] = $validated['status'] ?? 'not_started';

        if ($parentId = $validated['parent_id'] ?? null) {
            $parent = SubTask::find($parentId);
            $validated['sort_order'] = $parent ? $parent->children()->count() : 0;
        } else {
            $validated['sort_order'] = $task->subTasks()->whereNull('parent_id')->count();
        }

        DB::transaction(function () use ($task, $validated) {
            $task->subTasks()->create($validated);
        });

        return back()->with('success', __('Sub-task created.'));
    }

    public function update(Request $request, Project $project, Task $task, SubTask $subTask): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $subTask);

        $user = $request->user();
        $bypassPhoto = $user->canBypassPhotoRequirement() && $request->boolean('administrative_update');

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:not_started,in_progress,review,done,revisi'],
        ];

        $statusChanged = $request->has('status') && $request->input('status') !== $subTask->status;
        $needsPhoto = ! $bypassPhoto && ($statusChanged || $request->hasFile('photos'));

        if ($needsPhoto) {
            $rules['photos'] = ['required', 'array', 'min:3', 'max:10'];
            $rules['photos.*'] = ['required', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        } else {
            $rules['photos'] = ['nullable', 'array', 'max:10'];
            $rules['photos.*'] = ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:' . config('validation.photo_max')];
        }

        if ($statusChanged) {
            $rules['progress_description'] = ['required', 'string', 'min:10', 'max:' . config('validation.description_max')];
        }

        $validated = $request->validate($rules);

        $this->validateStatusTransition($user, $subTask->status, $validated['status'] ?? null);

        $hasPhotos = ! empty($request->file('photos'));

        DB::transaction(function () use ($request, $subTask, $validated, $hasPhotos) {
            $subTask->update($validated);

            if ($hasPhotos) {
                $update = $subTask->progressUpdates()->create([
                    'description' => $request->input('progress_description', ''),
                    'created_by' => $request->user()->id,
                ]);
                foreach ($request->file('photos', []) as $photo) {
                    $path = $photo->store('progress/' . $subTask->getTable() . '_' . $subTask->id, 'public');
                    \App\Support\ImageSanitizer::sanitize($photo, \Storage::disk('public')->path($path));
                    $update->photos()->create(['path' => $path]);
                }
            }
        });

        return back()->with('success', __('Sub-task updated.'));
    }

    public function updateProgress(Request $request, Project $project, Task $task, SubTask $subTask): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('updateProgress', $subTask);

        $user = $request->user();
        $bypassPhoto = $user->canBypassPhotoRequirement() && $request->boolean('administrative_update');

        if ($request->input('status') === $subTask->status && empty($request->file('photos'))) {
            return back()->with('info', __('Tidak ada perubahan untuk disimpan.'));
        }

        $rules = [
            'status' => ['required', 'string', 'in:not_started,in_progress,review,done,revisi'],
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

        $this->validateStatusTransition($user, $subTask->status, $validated['status']);

        DB::transaction(function () use ($request, $subTask, $validated) {
            $subTask->update(['status' => $validated['status']]);

            if (! empty($request->file('photos'))) {
                $update = $subTask->progressUpdates()->create([
                    'description' => $validated['progress_description'],
                    'created_by' => $user->id,
                ]);
                foreach ($request->file('photos', []) as $photo) {
                    $path = $photo->store('progress/' . $subTask->getTable() . '_' . $subTask->id, 'public');
                    \App\Support\ImageSanitizer::sanitize($photo, \Storage::disk('public')->path($path));
                    $update->photos()->create(['path' => $path]);
                }
            }

        });

        return back()->with('success', $bypassPhoto ? __('Sub-task progress updated (administrative).') : __('Sub-task progress updated.'));
    }

    public function destroy(Project $project, Task $task, SubTask $subTask): RedirectResponse
    {
        abort_if(request()->user()->isClient(), 403);
        $this->authorize('delete', $subTask);

        DB::transaction(function () use ($subTask) {
            $subTask->delete();
        });

        return back()->with('success', __('Sub-task deleted.'));
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
            throw ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }
}