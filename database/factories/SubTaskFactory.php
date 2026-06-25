<?php

namespace Database\Factories;

use App\Models\SubTask;
use App\Models\Task;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubTaskFactory extends Factory
{
    protected $model = SubTask::class;

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'vendor_id' => Vendor::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'sort_order' => 0,
            'status' => 'not_started',
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    public function review(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'review',
        ]);
    }

    public function revisi(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'revisi',
        ]);
    }
}