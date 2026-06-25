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

class SubTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_sub_task()
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $this->post("/projects/{$project->id}/tasks/{$task->id}/sub-tasks", [
            'name' => 'Test',
        ])->assertRedirect('/login');
    }

    public function test_user_can_create_sub_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/{$task->id}/sub-tasks", [
            'name' => 'Sub Task A',
        ])->assertRedirect();

        $this->assertDatabaseHas('sub_tasks', [
            'task_id' => $task->id,
            'name' => 'Sub Task A',
        ]);
    }

    public function test_completing_sub_task_updates_progress()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'progress' => 0]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id, 'progress' => 0]);

        $this->actingAs($user);

        $file = UploadedFile::fake()->image('done.jpg');
        $file2 = UploadedFile::fake()->image('done2.jpg');
        $file3 = UploadedFile::fake()->image('done3.jpg');

        $this->put("/projects/{$project->id}/tasks/{$task->id}/sub-tasks/{$subTask->id}", [
            'status' => 'done',
            'progress_description' => 'Completed this sub task successfully.',
            'photos' => [$file, $file2, $file3],
        ])->assertRedirect();

        $this->assertEquals(100, $subTask->fresh()->progress);
        $this->assertEquals('done', $subTask->fresh()->status);
        $this->assertEquals(100, $task->fresh()->progress);
    }

    public function test_user_can_delete_sub_task()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->delete("/projects/{$project->id}/tasks/{$task->id}/sub-tasks/{$subTask->id}")->assertRedirect();

        $this->assertDatabaseMissing('sub_tasks', ['id' => $subTask->id]);
    }

    public function test_admin_can_update_sub_task_name_without_photos(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}/sub-tasks/{$subTask->id}", [
                'name' => 'Renamed SubTask',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('sub_tasks', ['id' => $subTask->id, 'name' => 'Renamed SubTask']);
    }

    public function test_sub_task_update_progress_no_change_returns_info_flash(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($user)
            ->put("/projects/{$project->id}/tasks/{$task->id}/sub-tasks/{$subTask->id}/progress", [
                'status' => 'in_progress',
                'progress_description' => 'No change here.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('info');
    }

    public function test_non_admin_can_update_subtask_name_without_photos_when_status_unchanged(): void
    {
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create([
            'task_id' => $task->id,
            'vendor_id' => $vendor->id,
            'name' => 'Old SubTask Name',
        ]);

        $this->actingAs($pm)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'name' => 'New SubTask Name',
            ])
            ->assertRedirect();

        $this->assertEquals('New SubTask Name', $subTask->fresh()->name);
    }
}
