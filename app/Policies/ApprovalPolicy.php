<?php

namespace App\Policies;

use App\Models\Approval;
use App\Models\User;

class ApprovalPolicy
{
    public function review(User $user, Approval $approval): bool
    {
        return $user->isAdminOrAbove();
    }

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
