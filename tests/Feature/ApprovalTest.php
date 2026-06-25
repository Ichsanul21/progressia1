<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_approvals()
    {
        $this->get('/approvals')->assertRedirect('/login');
    }

    public function test_user_can_view_own_approvals()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user);
        $this->get('/approvals')->assertOk();
    }

    public function test_non_admin_cannot_approve()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->client()->create(['vendor_id' => $vendor->id]);
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $admin->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user);
        $this->post("/approvals/{$approval->id}/approve")->assertForbidden();
    }

    public function test_admin_can_approve()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user);
        $this->post("/approvals/{$approval->id}/approve")->assertRedirect();

        $this->assertDatabaseHas('approvals', [
            'id' => $approval->id,
            'status' => 'approved',
            'reviewed_by' => $user->id,
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'done',
        ]);
    }

    public function test_admin_can_reject()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user);
        $this->post("/approvals/{$approval->id}/reject", [
            'comment' => 'Not ready yet. Need more testing.',
        ])->assertRedirect();

        $this->assertDatabaseHas('approvals', [
            'id' => $approval->id,
            'status' => 'rejected',
            'reviewed_by' => $user->id,
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_cannot_approve_twice()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'approved',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        $this->actingAs($user);
        $this->post("/approvals/{$approval->id}/approve")->assertRedirect();
    }

    public function test_approve_redirects_to_approvals_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
        ]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user)
            ->post("/approvals/{$approval->id}/approve")
            ->assertRedirect(route('approvals.index'));
    }

    public function test_reject_requires_minimum_comment()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $approval = Approval::create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'target_status' => 'done',
            'old_status' => 'in_progress',
            'status' => 'pending',
            'requested_by' => $user->id,
            'vendor_id' => $vendor->id,
        ]);

        $this->actingAs($user);
        $this->post("/approvals/{$approval->id}/reject", [
            'comment' => 'No',
        ])->assertSessionHasErrors('comment');
    }
}
