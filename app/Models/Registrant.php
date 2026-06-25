<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registrant extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONTACTED = 'contacted';

    public const STATUS_CONVERTED = 'converted';

    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONTACTED,
        self::STATUS_CONVERTED,
        self::STATUS_REJECTED,
    ];

    public const INDUSTRIES = [
        'konstruksi' => 'Konstruksi',
        'agensi_konsultan' => 'Agensi / Konsultan',
        'internal_team' => 'Internal Team',
        'manufaktur' => 'Manufaktur',
        'lainnya' => 'Lainnya',
    ];

    public const TEAM_SIZES = [
        '1-5' => '1 - 5 orang',
        '6-20' => '6 - 20 orang',
        '21-50' => '21 - 50 orang',
        '50+' => 'Lebih dari 50 orang',
    ];

    public const SOURCES = [
        'google' => 'Google',
        'referral' => 'Rekomendasi / Referral',
        'social_media' => 'Media Sosial',
        'iklan' => 'Iklan Online',
        'lainnya' => 'Lainnya',
    ];

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company_name',
        'industry',
        'team_size',
        'source',
        'message',
        'status',
        'reviewed_by',
        'reviewed_at',
        'converted_user_id',
        'contacted_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'contacted_at' => 'datetime',
        ];
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function convertedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_user_id');
    }

    public function industryLabel(): string
    {
        return self::INDUSTRIES[$this->industry] ?? $this->industry;
    }

    public function teamSizeLabel(): string
    {
        return self::TEAM_SIZES[$this->team_size] ?? $this->team_size;
    }

    public function sourceLabel(): string
    {
        return self::SOURCES[$this->source] ?? $this->source;
    }
}
