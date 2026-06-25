<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProgressPhoto extends Model
{
    protected $fillable = ['path', 'vendor_id'];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model) {
            $user = auth()->user();
            if ($user && ! $user->isSuperAdmin() && ! $model->vendor_id) {
                $model->vendor_id = $user->vendor_id;
            }
        });
    }

    protected $appends = ['url'];

    public function progressUpdate(): BelongsTo
    {
        return $this->belongsTo(ProgressUpdate::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }
}
