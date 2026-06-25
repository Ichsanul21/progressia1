<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdminOrAbove();
    }

    public function create(User $user): bool
    {
        return $user->isAdminOrAbove();
    }

    public function update(User $user, User $target): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminVendor() && $target->vendor_id === $user->vendor_id && ! $target->isSuperAdmin() && ! $target->isAdminVendor()) {
            return true;
        }

        return false;
    }

    public function delete(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminVendor() && $target->vendor_id === $user->vendor_id && ! $target->isSuperAdmin() && ! $target->isAdminVendor()) {
            return true;
        }

        return false;
    }
}
