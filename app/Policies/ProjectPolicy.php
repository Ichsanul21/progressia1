<?php

namespace App\Policies;

use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->isClient()) {
            return true;
        }

        return true;
    }

    public function view(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove();
    }

    public function update(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove();
    }

    public function delete(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove();
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

    public function manageReportLinks(User $user): bool
    {
        if ($user->isClient()) {
            return false;
        }

        return $user->isAdminOrAbove() || $user->isProjectManager();
    }
}
