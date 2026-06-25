<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubTask extends Model
{
    use HasFactory;

    public const STATUSES = ['not_started', 'in_progress', 'review', 'done', 'revisi'];

    protected $fillable = [
        'name',
        'description',
        'status',
        'task_id',
        'parent_id',
        'vendor_id',
        'assigned_to',
        'sort_order',
        'progress',
    ];

    protected function casts(): array
    {
        return [
            'progress' => 'integer',
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
            if (! $model->status) {
                $model->status = 'not_started';
            }
        });
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    public function progressUpdates()
    {
        return $this->morphMany(ProgressUpdate::class, 'updatable');
    }

    public function recalculateProgress(): void
    {
        $this->load('children');

        if ($this->children->isNotEmpty()) {
            $avg = $this->children->avg('progress');
            $this->updateQuietly(['progress' => round($avg)]);
            return;
        }

        $this->updateQuietly(['progress' => Task::STATUS_PROGRESS[$this->status] ?? 0]);
    }

    public function recalculateWithAncestors(): void
    {
        $this->recalculateProgress();

        $parentId = $this->parent_id;
        while ($parentId) {
            $parent = self::find($parentId);
            if (!$parent) {
                break;
            }
            $parent->recalculateProgress();
            $parentId = $parent->parent_id;
        }
    }
}