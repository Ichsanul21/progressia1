<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'vendor_id',
        'sub_vendor_id',
        'must_change_password',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function subVendor()
    {
        return $this->belongsTo(SubVendor::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function subTasks()
    {
        return $this->hasMany(SubTask::class, 'assigned_to');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user');
    }

    public function projectsAsClient()
    {
        return $this->belongsToMany(Project::class, 'project_client');
    }

    public function favoriteProjects()
    {
        return $this->belongsToMany(Project::class, 'favorites');
    }

    public function reportLinks()
    {
        return $this->hasMany(ProjectReportLink::class, 'created_by');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    public function isAdminVendor(): bool
    {
        return $this->role === UserRole::AdminVendor;
    }

    public function isProjectManager(): bool
    {
        return $this->role === UserRole::ProjectManager;
    }

    public function isTeam(): bool
    {
        return $this->role === UserRole::Team;
    }

    public function isClient(): bool
    {
        return $this->role === UserRole::Client;
    }

    public function isSubVendor(): bool
    {
        return $this->role === UserRole::SubVendor;
    }

    public function isAdminOrAbove(): bool
    {
        return $this->isSuperAdmin() || $this->isAdminVendor();
    }

    public function canBypassPhotoRequirement(): bool
    {
        return $this->isAdminOrAbove();
    }

    public function canManageSchedule(): bool
    {
        return $this->isAdminOrAbove() || $this->isProjectManager();
    }

    public function hasRole(UserRole|string $role): bool
    {
        $roleValue = $role instanceof UserRole ? $role->value : $role;
        return $this->role?->value === $roleValue;
    }

    protected static function booted(): void
    {
        static::created(function (User $user) {
            static::recordHistory($user, UserContactHistory::FIELD_EMAIL, null, $user->email, UserContactHistory::REASON_INITIAL);
            if ($user->phone) {
                static::recordHistory($user, UserContactHistory::FIELD_PHONE, null, $user->phone, UserContactHistory::REASON_INITIAL);
            }
        });

        static::updated(function (User $user) {
            if ($user->wasChanged('email')) {
                static::recordHistory(
                    $user,
                    UserContactHistory::FIELD_EMAIL,
                    $user->getOriginal('email'),
                    $user->email,
                    UserContactHistory::REASON_UPDATED,
                );
            }
            if ($user->wasChanged('phone')) {
                static::recordHistory(
                    $user,
                    UserContactHistory::FIELD_PHONE,
                    $user->getOriginal('phone'),
                    $user->phone,
                    UserContactHistory::REASON_UPDATED,
                );
            }
        });
    }

    private static function recordHistory(User $user, string $field, ?string $oldValue, ?string $newValue, string $reason): void
    {
        try {
            UserContactHistory::create([
                'user_id' => $user->id,
                'field' => $field,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'reason' => $reason,
                'changed_by_user_id' => Auth::id(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record user contact history', [
                'user_id' => $user->id,
                'field' => $field,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
