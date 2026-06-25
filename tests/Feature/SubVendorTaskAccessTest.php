<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SubVendor;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubVendorTaskAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_sub_vendor_user_only_sees_projects_with_their_sub_vendor_tasks()
    {
        $vendor = Vendor::factory()->create();
        $subVendorA = SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        $subVendorB = SubVendor::factory()->create(['vendor_id' => $vendor->id]);

        $subUser = User::factory()->subVendor()->create([
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendorA->id,
        ]);

        $projectA = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'For Sub A']);
        $projectB = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'For Sub B']);
        $projectInternal = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Internal']);

        Task::factory()->create([
            'project_id' => $projectA->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendorA->id,
        ]);
        Task::factory()->create([
            'project_id' => $projectB->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendorB->id,
        ]);
        Task::factory()->create([
            'project_id' => $projectInternal->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => null,
        ]);

        $this->actingAs($subUser);
        $response = $this->get('/projects');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('projects.total', 1)
            ->where('projects.data.0.name', 'For Sub A')
        );
    }

    public function test_sub_vendor_user_can_update_assigned_task()
    {
        $vendor = Vendor::factory()->create();
        $subVendor = SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        $subUser = User::factory()->subVendor()->create([
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
        ]);

        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
        ]);

        $this->actingAs($subUser);

        $this->assertTrue($subUser->can('update', $task));
    }

    public function test_sub_vendor_user_cannot_update_other_sub_vendor_task()
    {
        $vendor = Vendor::factory()->create();
        $subVendorA = SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        $subVendorB = SubVendor::factory()->create(['vendor_id' => $vendor->id]);

        $subUser = User::factory()->subVendor()->create([
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendorA->id,
        ]);

        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $taskOther = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendorB->id,
        ]);

        $this->actingAs($subUser);
        $this->assertFalse($subUser->can('update', $taskOther));
    }

    public function test_sub_vendor_inbox_only_lists_their_tasks()
    {
        $vendor = Vendor::factory()->create();
        $subVendor = SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        $subUser = User::factory()->subVendor()->create([
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
        ]);

        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
            'name' => 'Mine',
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => null,
            'name' => 'Not Mine',
        ]);

        $this->actingAs($subUser);
        $this->get('/tasks/inbox')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('tasks.total', 1)
                ->where('tasks.data.0.name', 'Mine')
            );
    }
}
