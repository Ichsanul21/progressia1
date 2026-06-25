<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SubTask;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubTaskProgressPropagationTest extends TestCase
{
    use RefreshDatabase;

    public function test_subtask_completion_propagates_to_task_and_project(): void
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
        ]);

        $this->assertNotNull($subTask);
        $this->assertEquals(0, $subTask->progress);
        $this->assertEquals(0, $task->fresh()->progress);
        $this->assertEquals(0, $project->fresh()->progress);

        $subTask->update(['status' => 'done']);
        $subTask->recalculateProgress();
        $task->recalculateProgressFromSubTasks();
        $project->recalculateProgressFromTasks();

        $this->assertEquals(100, $subTask->fresh()->progress);
        $this->assertEquals(100, $task->fresh()->progress);
        $this->assertEquals(100, $project->fresh()->progress);
    }

    public function test_multiple_subtasks_average_progress(): void
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

        $subTask1 = SubTask::factory()->completed()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
        ]);
        $subTask2 = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'status' => 'not_started',
        ]);

        $subTask1->recalculateProgress();
        $subTask2->recalculateProgress();
        $task->recalculateProgressFromSubTasks();
        $project->recalculateProgressFromTasks();

        $this->assertEquals(100, $subTask1->fresh()->progress);
        $this->assertEquals(0, $subTask2->fresh()->progress);
        $this->assertEquals(50, $task->fresh()->progress);
        $this->assertEquals(50, $project->fresh()->progress);
    }
}
