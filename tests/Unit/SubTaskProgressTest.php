<?php

namespace Tests\Unit;

use App\Models\SubTask;
use App\Models\Task;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubTaskProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_progress_is_100_when_completed(): void
    {
        $vendor = Vendor::factory()->create();
        $task = Task::factory()->create(['vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->completed()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
        ]);

        $subTask->recalculateProgress();

        $this->assertEquals(100, $subTask->fresh()->progress);
    }

    public function test_progress_is_0_when_not_completed(): void
    {
        $vendor = Vendor::factory()->create();
        $task = Task::factory()->create(['vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
        ]);

        $subTask->recalculateProgress();

        $this->assertEquals(0, $subTask->fresh()->progress);
    }

    public function test_default_progress_is_0(): void
    {
        $vendor = Vendor::factory()->create();
        $task = Task::factory()->create(['vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
        ]);

        $subTask->recalculateProgress();

        $this->assertEquals(0, $subTask->fresh()->progress);
    }
}
