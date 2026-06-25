<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_comment()
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $this->post("/projects/{$project->id}/tasks/{$task->id}/comments", [
            'content' => 'Nice work',
        ])->assertRedirect('/login');
    }

    public function test_user_can_create_comment()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/{$task->id}/comments", [
            'content' => 'Great progress!',
        ])->assertRedirect();

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'content' => 'Great progress!',
        ]);
    }

    public function test_user_can_delete_own_comment()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'content' => 'Delete me',
        ]);

        $this->delete("/projects/{$project->id}/tasks/{$task->id}/comments/{$comment->id}")->assertRedirect();

        $this->assertDatabaseMissing('task_comments', ['id' => $comment->id]);
    }

    public function test_comment_creates_notification_on_mention()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id, 'name' => 'Admin']);
        $mentioned = User::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Boba']);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/tasks/{$task->id}/comments", [
            'content' => 'Hey @Boba! check this out',
        ])->assertRedirect();

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $mentioned->id,
            'type' => 'mention',
        ]);
    }
}
