<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProjectReportLink extends Model
{
    protected $fillable = [
        'token',
        'project_id',
        'created_by',
        'password_hash',
        'password_encrypted',
        'expires_at',
        'revoked_at',
        'last_accessed_at',
        'access_count',
        'reveal_count',
        'last_revealed_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'last_revealed_at' => 'datetime',
            'access_count' => 'integer',
            'reveal_count' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->whereNull('revoked_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function isValid(): bool
    {
        if ($this->revoked_at) {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function recordAccess(): void
    {
        $this->forceFill([
            'last_accessed_at' => now(),
            'access_count' => $this->access_count + 1,
        ])->save();
    }

    public function recordReveal(): void
    {
        $this->forceFill([
            'last_revealed_at' => now(),
            'reveal_count' => $this->reveal_count + 1,
        ])->save();
    }

    public function revoke(): void
    {
        $this->forceFill(['revoked_at' => now()])->save();
    }

    public function getPlainPasswordAttribute(): ?string
    {
        if (! $this->password_encrypted) {
            return null;
        }

        try {
            return Crypt::decryptString($this->password_encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function setPlainPasswordAttribute(string $value): void
    {
        $this->password_encrypted = Crypt::encryptString($value);
    }

    public function resetPassword(): string
    {
        $plain = self::generatePassword();
        $this->forceFill([
            'password_encrypted' => Crypt::encryptString($plain),
            'password_hash' => Hash::make($plain),
        ])->save();

        return $plain;
    }

    public static function defaultExpiryFor(Project $project): Carbon
    {
        if ($project->target_date) {
            return $project->target_date->copy()->endOfDay();
        }
        if ($project->start_date) {
            return $project->start_date->copy()->addYear();
        }

        return now()->addYear();
    }

    /**
     * @return array{0: self, 1: string} [link, plain_password]
     */
    public static function generateFor(Project $project, User $creator): array
    {
        $password = self::generatePassword();

        $link = self::create([
            'token' => Str::random(48),
            'project_id' => $project->id,
            'created_by' => $creator->id,
            'password_hash' => Hash::make($password),
            'password_encrypted' => Crypt::encryptString($password),
            'expires_at' => self::defaultExpiryFor($project),
        ]);

        return [$link, $password];
    }

    public static function generatePassword(int $length = 10): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        $max = strlen($alphabet) - 1;
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $alphabet[random_int(0, $max)];
        }

        return $password;
    }
}
