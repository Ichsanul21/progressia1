<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SubTask;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ObserverProgressPropagationTest extends TestCase
{
    use RefreshDatabase;

    public function test_observer_propagates_full_chain(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $project = Project::factory()->create([
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
            'progress' => 0,
            'created_by' => $user->id,
        ]);
        $phase = $project->phases()->create([
            'name' => 'Phase 1',
            'vendor_id' => $vendor->id,
            'progress' => 0,
        ]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'vendor_id' => $vendor->id,
            'status' => 'not_started',
            'progress' => 0,
            'created_by' => $user->id,
        ]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'progress' => 0,
        ]);

        // 1. Sub-task update propagates to task, phase, project
        $subTask->update(['status' => 'done', 'progress' => 100]);

        $this->assertEquals(100, $subTask->fresh()->progress);
        $this->assertEquals(100, $task->fresh()->progress);
        $this->assertEquals(100, $task->fresh()->phase->progress);
        $this->assertEquals(100, $task->fresh()->project->progress);

        // 2. Delete propagates up
        $task2 = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'not_started',
            'progress' => 0,
            'created_by' => $user->id,
        ]);
        $st = SubTask::factory()->completed()->create([
            'task_id' => $task2->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->assertEquals(100, $task2->fresh()->progress);

        // Re-fetch project to get fresh progress after task2 propagation
        $project->refresh();

        $st->delete();

        $this->assertEquals(0, $task2->fresh()->progress);
    }
}
