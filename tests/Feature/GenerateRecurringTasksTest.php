<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenerateRecurringTasksTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_generates_daily_recurring_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'is_recurring' => true,
            'recurrence_frequency' => 'daily',
            'recurrence_interval' => 1,
            'recurrence_end_date' => null,
            'start_date' => Carbon::yesterday()->toDateString(),
            'status' => 'done',
            'progress' => 100,
        ]);

        $this->artisan('tasks:generate-recurring')
            ->assertSuccessful();

        $this->assertDatabaseHas('tasks', [
            'name' => $task->name,
            'is_recurring' => false,
            'status' => 'not_started',
            'progress' => 0,
            'project_id' => $project->id,
        ]);
    }

    public function test_command_skips_non_recurring_tasks()
    {
        $vendor = Vendor::factory()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'is_recurring' => false,
            'start_date' => Carbon::yesterday()->toDateString(),
        ]);

        $this->artisan('tasks:generate-recurring')
            ->assertSuccessful();

        $this->assertDatabaseCount('tasks', 1);
    }

    public function test_command_respects_recurrence_end_date()
    {
        $vendor = Vendor::factory()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'is_recurring' => true,
            'recurrence_frequency' => 'daily',
            'recurrence_interval' => 1,
            'recurrence_end_date' => Carbon::yesterday()->toDateString(),
            'start_date' => Carbon::parse('-2 days')->toDateString(),
        ]);

        $this->artisan('tasks:generate-recurring')
            ->assertSuccessful();

        $this->assertDatabaseCount('tasks', 1);
    }

    public function test_command_copies_sub_tasks()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'is_recurring' => true,
            'recurrence_frequency' => 'daily',
            'recurrence_interval' => 1,
            'start_date' => Carbon::yesterday()->toDateString(),
        ]);

        $subTask = $task->subTasks()->create([
            'name' => 'Sub task A',
            'status' => 'done',
            'progress' => 100,
        ]);

        $this->artisan('tasks:generate-recurring')
            ->assertSuccessful();

        $newTask = Task::where('is_recurring', false)
            ->where('name', $task->name)
            ->first();

        $this->assertNotNull($newTask);
        $this->assertDatabaseHas('sub_tasks', [
            'task_id' => $newTask->id,
            'name' => 'Sub task A',
            'status' => 'not_started',
            'progress' => 0,
        ]);
    }

    public function test_command_handles_weekly_recurrence()
    {
        $vendor = Vendor::factory()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'is_recurring' => true,
            'recurrence_frequency' => 'weekly',
            'recurrence_interval' => 2,
            'start_date' => Carbon::parse('-14 days')->toDateString(),
        ]);

        $this->artisan('tasks:generate-recurring')
            ->assertSuccessful();

        $this->assertDatabaseHas('tasks', [
            'name' => $task->name,
            'is_recurring' => false,
            'project_id' => $project->id,
        ]);
    }
}
