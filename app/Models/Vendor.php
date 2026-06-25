<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'address',
        'phone',
        'contact_phone',
        'email',
        'contact_person',
        'website',
        'city',
        'province',
        'postal_code',
        'npwp',
        'license_number',
        'established_year',
        'default_lang',
        'timezone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'established_year' => 'integer',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function subVendors()
    {
        return $this->hasMany(SubVendor::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
