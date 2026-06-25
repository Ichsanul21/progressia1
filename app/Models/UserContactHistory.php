<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserContactHistory extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    public const FIELD_EMAIL = 'email';

    public const FIELD_PHONE = 'phone';

    public const REASON_INITIAL = 'initial';

    public const REASON_UPDATED = 'updated';

    public const REASON_DELETED = 'deleted';

    public const REASON_RESTORED = 'restored';

    protected $table = 'user_contact_history';

    protected $fillable = [
        'user_id',
        'field',
        'old_value',
        'new_value',
        'reason',
        'changed_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
