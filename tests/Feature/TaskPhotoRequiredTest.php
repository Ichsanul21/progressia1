<?php

namespace Tests\Feature;

use App\Models\ProgressUpdate;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskPhotoRequiredTest extends TestCase
{
    use RefreshDatabase;

    private function makeProjectManagerUser(Vendor $vendor): User
    {
        return User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
    }

    private function makeAdminUser(bool $super = true): User
    {
        return $super
            ? User::factory()->create(['role' => 'super_admin'])
            : User::factory()->adminVendor()->create();
    }

    private function fakePhoto(): UploadedFile
    {
        return UploadedFile::fake()->image('evidence.jpg', 800, 600)->size(500);
    }

    public function test_non_admin_cannot_update_task_without_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = $this->makeProjectManagerUser($vendor);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);

        $this->actingAs($pm)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'New name',
                'status' => 'review',
                'progress' => 50,
                'progress_description' => 'Submitting for review.',
            ])
            ->assertSessionHasErrors('photos');
    }

    public function test_non_admin_cannot_update_task_with_only_status_change_without_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = $this->makeProjectManagerUser($vendor);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'not_started']);

        $this->actingAs($pm)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => $task->name,
                'status' => 'in_progress',
                'progress' => 25,
                'progress_description' => 'Sedang dikerjakan',
            ])
            ->assertSessionHasErrors('photos');
    }

    public function test_non_admin_can_update_task_with_photo(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = $this->makeProjectManagerUser($vendor);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'name' => 'Old']);

        $this->actingAs($pm)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'New name',
                'photos' => [$this->fakePhoto(), $this->fakePhoto(), $this->fakePhoto()],
            ])
            ->assertRedirect();

        $this->assertEquals('New name', $task->fresh()->name);
        $this->assertCount(1, ProgressUpdate::where('updatable_id', $task->id)->get());
    }

    public function test_admin_can_update_task_without_photo_via_bypass(): void
    {
        Storage::fake('public');
        $admin = $this->makeAdminUser();
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'name' => 'Old']);

        $this->actingAs($admin)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'Updated name',
                'administrative_update' => true,
            ])
            ->assertRedirect();

        $this->assertEquals('Updated name', $task->fresh()->name);
        $this->assertCount(0, ProgressUpdate::where('updatable_id', $task->id)->get());
    }

    public function test_admin_cannot_bypass_photo_with_invalid_flag(): void
    {
        Storage::fake('public');
        $admin = $this->makeAdminUser();
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);

        $this->actingAs($admin)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'Updated',
            ])
            ->assertRedirect();

        $this->assertEquals('Updated', $task->fresh()->name);
    }

    public function test_non_admin_cannot_use_bypass_flag(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $pm = $this->makeProjectManagerUser($vendor);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'status' => 'in_progress']);

        $this->actingAs($pm)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'Updated',
                'status' => 'review',
                'progress_description' => 'Submitting for review.',
                'administrative_update' => true,
            ])
            ->assertSessionHasErrors('photos');
    }

    public function test_admin_with_photo_creates_progress_update(): void
    {
        Storage::fake('public');
        $admin = $this->makeAdminUser();
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);

        $this->actingAs($admin)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => $task->name,
                'photos' => [$this->fakePhoto(), $this->fakePhoto(), $this->fakePhoto()],
            ])
            ->assertRedirect();

        $this->assertCount(1, ProgressUpdate::where('updatable_id', $task->id)->get());
    }

    public function test_admin_vendor_can_also_bypass(): void
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->for($vendor)->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($admin)
            ->put(route('projects.tasks.update', [$project, $task]), [
                'name' => 'Updated',
                'administrative_update' => true,
            ])
            ->assertRedirect();

        $this->assertEquals('Updated', $task->fresh()->name);
        $this->assertCount(0, ProgressUpdate::where('updatable_id', $task->id)->get());
    }
}
