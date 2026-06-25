<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUSES = ['not_started', 'in_progress', 'review', 'done', 'revisi'];

    public const STATUS_PROGRESS = [
        'not_started' => 0,
        'in_progress' => 25,
        'review' => 50,
        'done' => 100,
        'revisi' => 25,
    ];

    protected $fillable = [
        'name',
        'description',
        'project_id',
        'phase_id',
        'vendor_id',
        'sub_vendor_id',
        'assigned_to',
        'status',
        'priority',
        'start_date',
        'due_date',
        'sort_order',
        'created_by',
        'updated_by',
        'progress',
        'is_recurring',
        'recurrence_frequency',
        'recurrence_interval',
        'recurrence_end_date',
        'recurrence_days',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'progress' => 'integer',
            'is_recurring' => 'boolean',
            'recurrence_interval' => 'integer',
            'recurrence_end_date' => 'date',
            'recurrence_days' => 'array',
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

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function phase()
    {
        return $this->belongsTo(Phase::class);
    }

    public function subVendor()
    {
        return $this->belongsTo(SubVendor::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function subTasks()
    {
        return $this->hasMany(SubTask::class)->orderBy('sort_order');
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    public function progressUpdates()
    {
        return $this->morphMany(ProgressUpdate::class, 'updatable');
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function pendingApprovals()
    {
        return $this->morphMany(Approval::class, 'approvable')->where('status', 'pending');
    }

    public function getHasPendingApprovalAttribute(): bool
    {
        return $this->pendingApprovals()->exists();
    }

    public function recalculateProgress(): void
    {
        $this->recalculateProgressFromSubTasks();
    }

    public function recalculateProgressFromSubTasks(): void
    {
        $subTasks = $this->subTasks()->whereNull('parent_id')->get();

        if ($subTasks->isEmpty()) {
            $this->updateQuietly(['progress' => self::STATUS_PROGRESS[$this->status] ?? 0]);
            return;
        }

        $avg = $subTasks->avg('progress');
        $this->updateQuietly(['progress' => round($avg)]);
    }

    public function applyStatusProgress(?string $newStatus = null): void
    {
        $status = $newStatus ?? $this->status;
        $this->updateQuietly(['progress' => self::STATUS_PROGRESS[$status] ?? 0]);
    }
}
