<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->superAdmin()->create([
            'name' => 'Super Admin',
            'email' => 'admin@progressia.test',
            'phone' => '+628000000000',
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        $this->call(RabTemplateSeeder::class);
    }
}
