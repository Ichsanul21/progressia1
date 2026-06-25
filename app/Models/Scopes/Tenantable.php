<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Model;

trait Tenantable
{
    public static function bootTenantable(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    public function initializeTenantable(): void
    {
        if (! $this->isSuperAdmin()) {
            $this->mergeFillable(['vendor_id']);
        }
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Model $model) {
            $user = auth()->user();

            if ($user && ! $user->isSuperAdmin() && ! $model->vendor_id) {
                $model->vendor_id = $user->vendor_id;
            }
        });
    }
}
