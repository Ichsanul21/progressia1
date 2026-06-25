<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['info', 'success', 'warning', 'error']),
            'title' => fake()->sentence(4),
            'body' => fake()->paragraph(),
            'data' => null,
            'is_read' => false,
        ];
    }
}
