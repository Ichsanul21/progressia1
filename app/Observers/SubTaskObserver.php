<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\SubTask;
use Illuminate\Support\Facades\Request;

class SubTaskObserver
{
    private function log(string $event, SubTask $subTask, ?array $old = null, ?array $new = null): void
    {
        $user = auth()->user();

        $description = match ($event) {
            'created' => "Sub-task '{$subTask->name}' created",
            'updated' => $this->describeChanges($old ?? [], $new ?? []),
            'deleted' => "Sub-task '{$subTask->name}' deleted",
            'status_changed' => "status: " . ($old['status'] ?? '?') . " → " . ($new['status'] ?? '?'),
            'progress_changed' => "progress: " . ($old['progress'] ?? '?') . "% → " . ($new['progress'] ?? '?') . "%",
            default => "Sub-task '{$subTask->name}' {$event}",
        };

        ActivityLog::create([
            'subject_type' => SubTask::class,
            'subject_id' => $subTask->id,
            'user_id' => $user?->id,
            'vendor_id' => $subTask->vendor_id ?? $user?->vendor_id,
            'event' => $event,
            'old_values' => $old,
            'new_values' => $new,
            'description' => $description,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    private function describeChanges(array $old, array $new): string
    {
        $parts = [];
        foreach ($new as $key => $newVal) {
            $oldVal = $old[$key] ?? null;
            if ($oldVal === $newVal) {
                continue;
            }
            $parts[] = match ($key) {
                'status' => "status: {$oldVal} → {$newVal}",
                'progress' => "progress: {$oldVal}% → {$newVal}%",
                'name' => "renamed to \"{$newVal}\"",
                'description' => 'description updated',
                'assigned_to' => 'assignee updated',
                default => "{$key}: {$oldVal} → {$newVal}",
            };
        }

        return $parts ? implode(', ', $parts) : 'updated';
    }

    public function created(SubTask $subTask): void
    {
        $this->log('created', $subTask);
    }

    public function updated(SubTask $subTask): void
    {
        $dirty = $subTask->getDirty();

        $tracked = ['name', 'description', 'status', 'assigned_to', 'progress'];

        $old = [];
        $new = [];
        foreach ($dirty as $key => $value) {
            if (in_array($key, $tracked, true)) {
                $old[$key] = $subTask->getOriginal($key);
                $new[$key] = $value;
            }
        }

        if (empty($old)) {
            return;
        }

        $hasStatus = isset($dirty['status']);
        $hasProgress = isset($dirty['progress']);
        $hasOther = !empty(array_diff_key($old, ['status' => true, 'progress' => true]));

        if ($hasOther) {
            $this->log('updated', $subTask, $old, $new);
        } elseif ($hasStatus) {
            $this->log('status_changed', $subTask, $old, $new);
        } elseif ($hasProgress) {
            $this->log('progress_changed', $subTask, $old, $new);
        }
    }

    public function saved(SubTask $subTask): void
    {
        $this->propagateUp($subTask);
    }

    public function deleted(SubTask $subTask): void
    {
        $this->log('deleted', $subTask);
        $this->propagateFromDeleted($subTask);
    }

    private function propagateFromDeleted(SubTask $subTask): void
    {
        $parentId = $subTask->getOriginal('parent_id');
        if ($parentId) {
            $parent = SubTask::find($parentId);
            if ($parent) {
                $this->propagateUp($parent);
            }
        } else {
            $subTask->load('task.phase.project', 'task.project');
            $task = $subTask->task;
            if (! $task) {
                return;
            }
            $task->recalculateProgressFromSubTasks();

            if ($task->phase && $task->phase->project) {
                $task->phase->recalculateProgressFromTasks();
                $task->phase->project->recalculateProgressFromPhases();
            } elseif ($task->project) {
                $task->project->recalculateProgressFromTasks();
            }
        }
    }

    private function propagateUp(SubTask $subTask): void
    {
        $subTask->recalculateProgress();

        if ($subTask->parent_id) {
            $parent = SubTask::find($subTask->parent_id);
            if ($parent) {
                $this->propagateUp($parent);
            }
        } else {
            $subTask->load('task.phase.project', 'task.project');
            $task = $subTask->task;
            if (! $task) {
                return;
            }
            $task->recalculateProgressFromSubTasks();

            if ($task->phase && $task->phase->project) {
                $task->phase->recalculateProgressFromTasks();
                $task->phase->project->recalculateProgressFromPhases();
            } elseif ($task->project) {
                $task->project->recalculateProgressFromTasks();
            }
        }
    }
}