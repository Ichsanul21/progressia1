<?php

namespace Database\Factories;

use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'description' => fake()->optional()->paragraph(),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'contact_phone' => fake()->optional()->phoneNumber(),
            'contact_person' => fake()->name(),
            'website' => fake()->optional()->url(),
            'address' => fake()->address(),
            'city' => fake()->optional()->city(),
            'province' => fake()->optional()->state(),
            'postal_code' => fake()->optional()->postcode(),
            'npwp' => fake()->optional()->numerify('##.###.###.#-###.###'),
            'license_number' => fake()->optional()->bothify('??-####/??/####'),
            'established_year' => fake()->optional()->numberBetween(2000, 2023),
            'default_lang' => 'id',
            'timezone' => 'Asia/Jakarta',
            'is_active' => true,
        ];
    }
}
