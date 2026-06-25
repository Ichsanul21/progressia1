<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'phase_id' => null,
            'vendor_id' => Vendor::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['not_started', 'in_progress', 'review', 'done']),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'progress' => fake()->numberBetween(0, 100),
            'sort_order' => 0,
            'start_date' => fake()->date(),
            'due_date' => fake()->dateTimeBetween('+1 week', '+3 months')->format('Y-m-d'),
            'created_by' => User::factory(),
        ];
    }
}
