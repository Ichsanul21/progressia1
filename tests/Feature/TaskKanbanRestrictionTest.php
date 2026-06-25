<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskKanbanRestrictionTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_change_status_via_kanban_endpoint(): void
    {
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->for($project)->create(['status' => 'not_started']);

        $this->actingAs($pm)
            ->post(route('projects.tasks.update-status', $project), [
                'id' => $task->id,
                'status' => 'in_progress',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_change_status_via_kanban_endpoint(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $project = Project::factory()->create();
        $task = Task::factory()->for($project)->create(['status' => 'not_started']);

        $this->actingAs($admin)
            ->post(route('projects.tasks.update-status', $project), [
                'id' => $task->id,
                'status' => 'in_progress',
            ])
            ->assertRedirect();

        $this->assertEquals('in_progress', $task->fresh()->status);
    }

    public function test_non_admin_cannot_batch_update_status(): void
    {
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->for($project)->create();

        $this->actingAs($pm)
            ->post(route('projects.tasks.batch.status', $project), [
                'task_ids' => [$task->id],
                'status' => 'in_progress',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_batch_update_status(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $project = Project::factory()->create();
        $task = Task::factory()->for($project)->create();

        $this->actingAs($admin)
            ->post(route('projects.tasks.batch.status', $project), [
                'task_ids' => [$task->id],
                'status' => 'in_progress',
            ])
            ->assertRedirect();

        $this->assertEquals('in_progress', $task->fresh()->status);
    }

    public function test_non_admin_cannot_batch_assign(): void
    {
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->for($project)->create();
        $member = User::factory()->create();

        $this->actingAs($pm)
            ->post(route('projects.tasks.batch.assign', $project), [
                'task_ids' => [$task->id],
                'assigned_to' => $member->id,
            ])
            ->assertForbidden();
    }
}
