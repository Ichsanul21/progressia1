<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'vendor_id',
        'sub_vendor_id',
        'name',
        'description',
        'cover_image',
        'categories',
        'tags',
        'status',
        'progress',
        'start_date',
        'target_date',
        'budget',
        'review_mode',
        'archived_at',
        'is_template',
        'duplicated_from',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'categories' => 'array',
            'tags' => 'array',
            'progress' => 'integer',
            'is_template' => 'boolean',
            'review_mode' => 'boolean',
            'archived_at' => 'datetime',
            'start_date' => 'date',
            'target_date' => 'date',
            'budget' => 'decimal:2',
        ];
    }

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

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function subVendor()
    {
        return $this->belongsTo(SubVendor::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')
            ->withTimestamps();
    }

    public function clients()
    {
        return $this->belongsToMany(User::class, 'project_client')
            ->withTimestamps();
    }

    public function phases()
    {
        return $this->hasMany(Phase::class)->orderBy('sort_order');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function rabItems()
    {
        return $this->hasMany(RabItem::class)->orderBy('sort_order');
    }

    public function reportLinks()
    {
        return $this->hasMany(ProjectReportLink::class);
    }

    public function isFavoritedBy(User $user): bool
    {
        return $this->favoritedBy()->where('user_id', $user->id)->exists();
    }

    public function duplicate(): self
    {
        $copy = $this->replicate(['progress', 'status', 'archived_at']);
        $copy->name = $this->name.' (Copy)';
        $copy->duplicated_from = $this->id;
        $copy->progress = 0;
        $copy->status = 'not_started';
        $copy->save();

        return $copy;
    }

    public function archive(): void
    {
        $this->update(['archived_at' => now()]);
    }

    public function unarchive(): void
    {
        $this->update(['archived_at' => null]);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    public function scopeTemplate($query)
    {
        return $query->where('is_template', true);
    }

    public function recalculateProgress(): void
    {
        $this->recalculateProgressFromPhases();
    }

    public function recalculateProgressFromPhases(): void
    {
        $phases = $this->phases;

        if ($phases->isEmpty()) {
            $this->recalculateProgressFromTasks();
            return;
        }

        $avg = $phases->avg('progress');
        $this->updateQuietly(['progress' => round($avg)]);
    }

    public function recalculateProgressFromTasks(): void
    {
        $tasks = $this->tasks;

        if ($tasks->isEmpty()) {
            $this->updateQuietly(['progress' => 0]);
            return;
        }

        $avg = $tasks->avg('progress');
        $this->updateQuietly(['progress' => round($avg)]);
    }
}
