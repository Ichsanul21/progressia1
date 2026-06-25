<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Vendor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['not_started', 'in_progress', 'review', 'done']),
            'progress' => fake()->numberBetween(0, 100),
            'created_by' => User::factory(),
            'start_date' => fake()->date(),
            'target_date' => fake()->dateTimeBetween('+1 month', '+6 months')->format('Y-m-d'),
            'budget' => fake()->randomFloat(2, 10000000, 500000000),
        ];
    }
}
