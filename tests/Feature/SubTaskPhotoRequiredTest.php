<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SubTask;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubTaskPhotoRequiredTest extends TestCase
{
    use RefreshDatabase;

    private function fakePhoto(): UploadedFile
    {
        return UploadedFile::fake()->image('evidence.jpg', 800, 600)->size(500);
    }

    public function test_non_admin_cannot_update_subtask_without_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);

        $this->actingAs($pm)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'name' => 'New name',
                'status' => 'review',
                'progress_description' => 'Sedang dalam review.',
            ])
            ->assertSessionHasErrors('photos');
    }

    public function test_non_admin_can_update_subtask_with_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id, 'name' => 'Old']);

        $this->actingAs($pm)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'name' => 'New name',
                'photos' => [$this->fakePhoto(), $this->fakePhoto(), $this->fakePhoto()],
            ])
            ->assertRedirect();

        $this->assertEquals('New name', $subTask->fresh()->name);
    }

    public function test_admin_can_update_subtask_without_photo_via_bypass(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'super_admin']);
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'name' => 'Old']);

        $this->actingAs($admin)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'name' => 'Updated',
                'administrative_update' => true,
            ])
            ->assertRedirect();

        $this->assertEquals('Updated', $subTask->fresh()->name);
    }

    public function test_non_admin_cannot_bypass_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);

        $this->actingAs($pm)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'name' => 'Updated',
                'status' => 'review',
                'progress_description' => 'Submitting for review.',
                'administrative_update' => true,
            ])
            ->assertSessionHasErrors('photos');
    }

    public function test_admin_can_change_assigned_to_inline_without_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $member = User::factory()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($admin)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'assigned_to' => $member->id,
                'administrative_update' => true,
            ])
            ->assertRedirect();

        $this->assertEquals($member->id, $subTask->fresh()->assigned_to);
    }

    public function test_non_admin_cannot_change_assigned_to_without_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $member = User::factory()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);
        $subTask = SubTask::factory()->create(['task_id' => $task->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($pm)
            ->put(route('sub-tasks.update', [$project, $task, $subTask]), [
                'assigned_to' => $member->id,
            ])
            ->assertRedirect();

        $this->assertEquals($member->id, $subTask->fresh()->assigned_to);
    }
}
