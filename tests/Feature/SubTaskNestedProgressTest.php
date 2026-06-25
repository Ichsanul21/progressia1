<?php

namespace Tests\Feature;

use App\Models\SubTask;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubTaskNestedProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_factory_subtask(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create([
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
            'progress' => 0,
            'created_by' => $user->id,
        ]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'progress' => 0,
            'created_by' => $user->id,
        ]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'progress' => 0,
        ]);
        $this->assertNotNull($subTask->id);
    }
}
