<?php

namespace App\Policies;

use App\Models\Registrant;
use App\Models\User;

class RegistrantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, Registrant $registrant): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, Registrant $registrant): bool
    {
        return $user->isSuperAdmin();
    }

    public function updateStatus(User $user, Registrant $registrant): bool
    {
        return $user->isSuperAdmin();
    }

    public function convert(User $user, Registrant $registrant): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, Registrant $registrant): bool
    {
        return $user->isSuperAdmin();
    }
}
