<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Approval;
use App\Models\Task;
use Illuminate\Support\Facades\Request;

class TaskObserver
{
    private function log(string $event, Task $task, ?array $old = null, ?array $new = null): void
    {
        $user = auth()->user();
        $description = match ($event) {
            'created' => "Task '{$task->name}' created",
            'updated' => $this->describeChanges($old ?? [], $new ?? []),
            'deleted' => "Task '{$task->name}' deleted",
            default => "Task '{$task->name}' {$event}",
        };

        ActivityLog::create([
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'user_id' => $user?->id,
            'vendor_id' => $task->vendor_id ?? $user?->vendor_id,
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
                'priority' => "priority: {$oldVal} → {$newVal}",
                'progress' => "progress: {$oldVal}% → {$newVal}%",
                'name' => "renamed to \"{$newVal}\"",
                'start_date' => "start_date: {$oldVal} → {$newVal}",
                'due_date' => "due_date: {$oldVal} → {$newVal}",
                'description' => 'description updated',
                'assigned_to' => 'assignee updated',
                'phase_id' => "phase: {$oldVal} → {$newVal}",
                'sub_vendor_id' => "sub_vendor: {$oldVal} → {$newVal}",
                'is_recurring' => 'recurring ' . ($newVal ? 'enabled' : 'disabled'),
                'recurrence_frequency' => "recurrence_frequency: {$oldVal} → {$newVal}",
                'recurrence_interval' => "recurrence_interval: {$oldVal} → {$newVal}",
                'recurrence_end_date' => "recurrence_end_date: {$oldVal} → {$newVal}",
                default => "{$key}: {$oldVal} → {$newVal}",
            };
        }

        return $parts ? implode(', ', $parts) : 'updated';
    }

    public function created(Task $task): void
    {
        $this->log('created', $task);
    }

    public function updated(Task $task): void
    {
        $dirty = $task->getDirty();

        $tracked = [
            'progress', 'status', 'priority', 'name', 'assigned_to',
            'description', 'start_date', 'due_date', 'phase_id',
            'sub_vendor_id', 'is_recurring', 'recurrence_frequency',
            'recurrence_interval', 'recurrence_end_date',
        ];

        $old = [];
        $new = [];
        foreach ($dirty as $key => $value) {
            if (in_array($key, $tracked, true)) {
                $old[$key] = $task->getOriginal($key);
                $new[$key] = $value;
            }
        }

        if (!empty($old)) {
            $this->log('updated', $task, $old, $new);
        }

        if (array_key_exists('status', $dirty) && $task->project?->review_mode) {
            $user = auth()->user();
            if (!$user?->isAdminOrAbove()) {
                $approval = Approval::create([
                    'approvable_type' => Task::class,
                    'approvable_id' => $task->id,
                    'target_status' => $task->status,
                    'old_status' => $task->getOriginal('status'),
                    'status' => 'pending',
                    'requested_by' => $user?->id,
                ]);

                $task->updateQuietly(['status' => $task->getOriginal('status')]);

                $admins = \App\Models\User::whereIn('role', [
                    \App\Enums\UserRole::SuperAdmin,
                    \App\Enums\UserRole::AdminVendor,
                ])->get();

                foreach ($admins as $admin) {
                    \App\Models\Notification::create([
                        'user_id' => $admin->id,
                        'type' => 'approval_requested',
                        'title' => __('Approval needed'),
                        'body' => __(':user requested to change task ":task" status from :old to :new', [
                            'user' => $user?->name ?? 'System',
                            'task' => $task->name,
                            'old' => $approval->old_status,
                            'new' => $approval->target_status,
                        ]),
                        'data' => ['approval_id' => $approval->id, 'task_id' => $task->id, 'project_id' => $task->project_id],
                    ]);
                }
            }
        }
    }

    public function saved(Task $task): void
    {
        $this->propagateUp($task);
    }

    public function deleted(Task $task): void
    {
        $this->log('deleted', $task);
        $this->propagateUp($task);
    }

    private function propagateUp(Task $task): void
    {
        $task->load('phase.project');
        if ($task->phase) {
            $task->phase->recalculateProgressFromTasks();
            if ($task->phase->project) {
                $task->phase->project->recalculateProgressFromPhases();
            }
        } else {
            $task->load('project');
            if ($task->project) {
                $task->project->recalculateProgressFromTasks();
            }
        }
    }
}
