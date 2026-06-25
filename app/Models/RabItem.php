<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RabItem extends Model
{
    protected $fillable = [
        'project_id',
        'phase_id',
        'vendor_id',
        'code',
        'name',
        'description',
        'unit',
        'volume',
        'unit_price',
        'realization',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'volume' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'realization' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model) {
            $user = auth()->user();
            if ($user && !$user->isSuperAdmin() && !$model->vendor_id) {
                $model->vendor_id = $user->vendor_id;
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class);
    }

    public function getTotalAttribute(): float
    {
        return round($this->volume * $this->unit_price, 2);
    }
}
