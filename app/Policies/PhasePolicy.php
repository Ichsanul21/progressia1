<?php

namespace App\Policies;

use App\Models\User;

class PhasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function update(User $user): bool
    {
        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function delete(User $user): bool
    {
        return $user->isAdminOrAbove() || $user->isProjectManager();
    }

    public function restore(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user): bool
    {
        return $user->isSuperAdmin();
    }
}
