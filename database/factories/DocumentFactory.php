<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'vendor_id' => Vendor::factory(),
            'name' => fake()->words(3, true) . '.pdf',
            'file_path' => 'documents/test-' . fake()->uuid() . '.pdf',
            'file_size' => fake()->numberBetween(1000, 5000000),
            'mime_type' => 'application/pdf',
            'category' => fake()->randomElement(['contract', 'drawing', 'report', 'permit', 'other']),
            'version' => 1,
            'uploaded_by' => User::factory(),
        ];
    }
}
