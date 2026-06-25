<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+62'.fake()->numerify('8##########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Team->value,
            'vendor_id' => Vendor::factory(),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function mustChangePassword(): static
    {
        return $this->state(fn (array $attributes) => [
            'must_change_password' => true,
            'password_changed_at' => null,
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::SuperAdmin->value,
            'vendor_id' => null,
        ]);
    }

    public function adminVendor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::AdminVendor->value,
        ]);
    }

    public function projectManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ProjectManager->value,
        ]);
    }

    public function client(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Client->value,
        ]);
    }

    public function subVendor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::SubVendor->value,
        ]);
    }
}
