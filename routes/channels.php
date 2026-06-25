<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', fn (User $user, int $id) => (int) $user->id === $id);

Broadcast::channel('admin.registrants', fn (User $user) => $user->isSuperAdmin());
