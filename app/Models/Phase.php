<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Phase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'status',
        'progress',
        'sort_order',
        'vendor_id',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'progress' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
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

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
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
