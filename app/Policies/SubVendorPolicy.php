<?php

namespace App\Policies;

use App\Models\User;

class SubVendorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdminOrAbove();
    }

    public function view(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdminOrAbove();
    }

    public function update(User $user): bool
    {
        return $user->isAdminOrAbove();
    }

    public function delete(User $user): bool
    {
        return $user->isAdminOrAbove();
    }
}
