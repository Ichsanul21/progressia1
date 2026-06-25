<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BatchTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_batch_update_status()
    {
        $project = Project::factory()->create();
        $this->post("/projects/{$project->id}/tasks/batch/status", [
            'task_ids' => [1],
            'status' => 'done',
        ])->assertRedirect('/login');
    }

    public function test_admin_can_batch_update_status()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task1 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);
        $task2 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'not_started']);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/batch/status", [
            'task_ids' => [$task1->id, $task2->id],
            'status' => 'done',
        ])->assertRedirect();

        $this->assertDatabaseHas('tasks', ['id' => $task1->id, 'status' => 'done', 'progress' => 100]);
        $this->assertDatabaseHas('tasks', ['id' => $task2->id, 'status' => 'done', 'progress' => 100]);
    }

    public function test_admin_can_batch_assign()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $assignee = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task1 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $task2 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/batch/assign", [
            'task_ids' => [$task1->id, $task2->id],
            'assigned_to' => $assignee->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('tasks', ['id' => $task1->id, 'assigned_to' => $assignee->id]);
        $this->assertDatabaseHas('tasks', ['id' => $task2->id, 'assigned_to' => $assignee->id]);
    }

    public function test_admin_can_batch_delete()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task1 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $task2 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/batch/destroy", [
            'task_ids' => [$task1->id, $task2->id],
        ])->assertRedirect();

        $this->assertSoftDeleted($task1);
        $this->assertSoftDeleted($task2);
    }

    public function test_team_member_cannot_batch_update()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->client()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/batch/status", [
            'task_ids' => [$task->id],
            'status' => 'done',
        ])->assertForbidden();
    }

    public function test_batch_update_status_redirects_to_tasks_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task1 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $task2 = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/tasks/batch/status", [
                'task_ids' => [$task1->id, $task2->id],
                'status' => 'in_progress',
            ])
            ->assertRedirectContains('/projects/'.$project->id.'/tasks');
    }
}
