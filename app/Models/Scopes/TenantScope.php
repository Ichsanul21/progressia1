<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && ! $user->isSuperAdmin()) {
            $builder->where($model->qualifyColumn('vendor_id'), $user->vendor_id);
        }
    }
}
