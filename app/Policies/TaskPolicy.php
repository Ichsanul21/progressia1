<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ?Task $task = null): bool
    {
        if (! $task) {
            return true;
        }

        if ($user->isSubVendor()) {
            return $task->sub_vendor_id === $user->sub_vendor_id;
        }

        if ($user->isClient()) {
            return $task->project && $task->project->clients()->where('users.id', $user->id)->exists();
        }

        return true;
    }

    public function create(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function update(User $user, ?Task $task = null): bool
    {
        if ($user->isClient()) {
            return false;
        }

        if ($user->isSubVendor()) {
            return $task && $task->sub_vendor_id === $user->sub_vendor_id;
        }

        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function updateProgress(User $user, ?Task $task = null): bool
    {
        if ($user->isClient()) {
            return false;
        }

        if ($user->isSubVendor()) {
            return $task && $task->sub_vendor_id === $user->sub_vendor_id;
        }

        return $user->isAdminOrAbove() || $user->isProjectManager() || $user->isTeam();
    }

    public function delete(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function restore(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isSuperAdmin();
    }
}
