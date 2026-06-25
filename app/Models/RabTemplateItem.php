<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RabTemplateItem extends Model
{
    protected $fillable = [
        'rab_template_id',
        'code',
        'name',
        'description',
        'unit',
        'volume',
        'unit_price',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'volume' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(RabTemplate::class, 'rab_template_id');
    }

    public function getTotalAttribute(): float
    {
        return round((float) $this->volume * (float) $this->unit_price, 2);
    }
}
