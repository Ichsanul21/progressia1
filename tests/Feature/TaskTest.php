<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SubTask;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_tasks()
    {
        $project = Project::factory()->create();
        $this->get("/projects/{$project->id}/tasks")->assertRedirect('/login');
    }

    public function test_user_can_create_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/tasks", [
            'name' => 'Test Task',
            'priority' => 'high',
        ])->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'name' => 'Test Task',
            'priority' => 'high',
        ]);
    }

    public function test_task_is_scoped_to_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->get("/projects/{$project->id}/tasks/{$task->id}")->assertOk();
    }

    public function test_user_can_update_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $file = UploadedFile::fake()->image('progress.jpg');
        $file2 = UploadedFile::fake()->image('progress2.jpg');
        $file3 = UploadedFile::fake()->image('progress3.jpg');

        $this->put("/projects/{$project->id}/tasks/{$task->id}", [
            'name' => 'Updated Task',
            'status' => 'in_progress',
            'progress_description' => 'Making good progress on this task.',
            'photos' => [$file, $file2, $file3],
        ])->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'name' => 'Updated Task',
            'status' => 'in_progress',
        ]);
    }

    public function test_user_can_delete_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->delete("/projects/{$project->id}/tasks/{$task->id}")->assertRedirect();

        $this->assertSoftDeleted($task);
    }

    public function test_task_can_be_filtered_by_status()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'done']);
        Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);

        $this->actingAs($user);
        $response = $this->get("/projects/{$project->id}/tasks?status=done");

        $response->assertOk();
    }

    public function test_updating_task_recalculates_project_progress()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'progress' => 0]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'progress' => 50,
        ]);

        $this->actingAs($user);

        $file = UploadedFile::fake()->image('progress.jpg');
        $file2 = UploadedFile::fake()->image('progress2.jpg');
        $file3 = UploadedFile::fake()->image('progress3.jpg');

        $this->put("/projects/{$project->id}/tasks/{$task->id}", [
            'name' => $task->name,
            'status' => 'done',
            'progress' => 80,
            'progress_description' => 'Task completed successfully with all requirements.',
            'photos' => [$file, $file2, $file3],
        ])->assertRedirect();

        $this->assertEquals(100, $project->fresh()->progress);
    }

    public function test_task_progress_updates_to_25_on_in_progress_status(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'not_started',
        ]);

        $this->actingAs($user);
        $task->update(['status' => 'in_progress']);
        $task->recalculateProgressFromSubTasks();

        $this->assertEquals(25, $task->fresh()->progress);
    }

    public function test_task_progress_updates_to_50_on_review_status(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $this->actingAs($user);
        $task->update(['status' => 'review']);
        $task->recalculateProgressFromSubTasks();

        $this->assertEquals(50, $task->fresh()->progress);
    }

    public function test_task_progress_updates_to_25_on_revisi_status(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'review',
        ]);

        $this->actingAs($user);
        $task->update(['status' => 'revisi']);
        $task->recalculateProgressFromSubTasks();

        $this->assertEquals(25, $task->fresh()->progress);
    }

    public function test_task_progress_stays_at_100_when_done(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'review',
        ]);

        $this->actingAs($user);
        $task->update(['status' => 'done']);
        $task->recalculateProgressFromSubTasks();

        $this->assertEquals(100, $task->fresh()->progress);
    }

    public function test_update_redirects_to_tasks_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}", [
                'name' => 'Updated Name',
            ])
            ->assertRedirectContains('/projects/'.$project->id.'/tasks');
    }

    public function test_update_progress_redirects_to_tasks_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $file = UploadedFile::fake()->image('progress.jpg');
        $file2 = UploadedFile::fake()->image('progress2.jpg');
        $file3 = UploadedFile::fake()->image('progress3.jpg');

        $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}/progress", [
                'status' => 'review',
                'progress_description' => 'Submitting for review now.',
                'photos' => [$file, $file2, $file3],
            ])
            ->assertRedirectContains('/projects/'.$project->id.'/tasks');
    }

    public function test_update_progress_no_change_returns_info_flash(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}/progress", [
                'status' => 'in_progress',
                'progress_description' => 'No change here.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('info');
    }

    public function test_admin_can_update_task_name_without_photos(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}", [
                'name' => 'Just Renamed',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'name' => 'Just Renamed']);
    }

    public function test_kanban_update_status_redirects_to_tasks_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'not_started',
        ]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/tasks/status", [
                'id' => $task->id,
                'status' => 'in_progress',
            ])
            ->assertRedirectContains('/projects/'.$project->id.'/tasks');
    }

    public function test_changing_status_with_subtasks_uses_status_progress(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
            'progress' => 25,
        ]);
        SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'status' => 'done',
            'progress' => 100,
        ]);

        $this->actingAs($user);
        $task->update(['status' => 'review']);
        $task->applyStatusProgress();

        $this->assertEquals(50, $task->fresh()->progress);
    }

    public function test_non_admin_can_update_task_name_without_photos_when_status_unchanged(): void
    {
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'name' => 'Old Name',
        ]);

        $this->actingAs($pm)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'New Name',
            ])
            ->assertRedirect();

        $this->assertEquals('New Name', $task->fresh()->name);
    }
}
