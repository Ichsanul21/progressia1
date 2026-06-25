<?php

namespace Database\Factories;

use App\Models\SubVendor;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SubVendorFactory extends Factory
{
    protected $model = SubVendor::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'vendor_id' => Vendor::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'description' => fake()->optional()->paragraph(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'contact_person' => fake()->name(),
            'npwp' => null,
            'license_number' => null,
            'tags' => [],
            'is_active' => true,
        ];
    }
}
