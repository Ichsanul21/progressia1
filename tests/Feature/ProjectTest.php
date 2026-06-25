<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_projects()
    {
        $this->get('/projects')->assertRedirect('/login');
        $this->get('/projects/create')->assertRedirect('/login');
    }

    public function test_user_can_create_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post('/projects', [
            'name' => 'Test Project',
            'description' => 'Test description',
        ])->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'name' => 'Test Project',
            'vendor_id' => $vendor->id,
            'created_by' => $user->id,
        ]);
    }

    public function test_user_can_see_own_projects()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        Project::factory()->count(3)->create(['vendor_id' => $vendor->id]);
        Project::factory()->count(2)->create();

        $this->actingAs($user);
        $response = $this->get('/projects');

        $response->assertOk();
        $response->assertSee(Project::where('vendor_id', $vendor->id)->first()->name);
    }

    public function test_user_can_view_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->get("/projects/{$project->id}")->assertOk();
    }

    public function test_user_cannot_view_other_vendor_project()
    {
        $user = User::factory()->superAdmin()->create();
        $project = Project::factory()->create();

        $this->actingAs($user);
        $this->get("/projects/{$project->id}")->assertOk();
    }

    public function test_user_can_update_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'created_by' => $user->id]);

        $this->actingAs($user);
        $this->put("/projects/{$project->id}", [
            'name' => 'Updated Name',
        ])->assertRedirect();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'name' => 'Updated Name']);
    }

    public function test_user_can_delete_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->delete("/projects/{$project->id}")->assertRedirect();

        $this->assertSoftDeleted($project);
    }

    public function test_user_can_archive_and_unarchive_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/archive")->assertRedirect();
        $this->assertNotNull($project->fresh()->archived_at);

        $this->post("/projects/{$project->id}/unarchive")->assertRedirect();
        $this->assertNull($project->fresh()->archived_at);
    }

    public function test_user_can_duplicate_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Original']);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/duplicate")->assertRedirect();

        $this->assertDatabaseHas('projects', ['name' => 'Original (Copy)']);
    }

    public function test_user_can_toggle_favorite()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/favorite")->assertRedirect();
        $this->assertTrue($project->isFavoritedBy($user));

        $this->post("/projects/{$project->id}/favorite")->assertRedirect();
        $this->assertFalse($project->fresh()->isFavoritedBy($user));
    }

    public function test_user_can_attach_and_detach_member()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $member = User::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/members", ['user_id' => $member->id])->assertRedirect();
        $this->assertDatabaseHas('project_user', ['project_id' => $project->id, 'user_id' => $member->id]);

        $this->delete("/projects/{$project->id}/members/{$member->id}")->assertRedirect();
        $this->assertDatabaseMissing('project_user', ['project_id' => $project->id, 'user_id' => $member->id]);
    }

    public function test_user_can_attach_and_detach_client()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $client = User::factory()->client()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $this->post("/projects/{$project->id}/clients", ['user_id' => $client->id])->assertRedirect();
        $this->assertDatabaseHas('project_client', ['project_id' => $project->id, 'user_id' => $client->id]);

        $this->delete("/projects/{$project->id}/clients/{$client->id}")->assertRedirect();
        $this->assertDatabaseMissing('project_client', ['project_id' => $project->id, 'user_id' => $client->id]);
    }

    public function test_user_can_upload_cover_image()
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $file = UploadedFile::fake()->image('cover.jpg');
        $this->post('/projects', [
            'name' => 'Cover Project',
            'cover_image' => $file,
        ])->assertRedirect();

        $project = Project::where('name', 'Cover Project')->first();
        $this->assertNotNull($project->cover_image);
        Storage::disk('public')->assertExists($project->cover_image);
    }

    public function test_user_can_restore_deleted_project()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $project->delete();

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/restore")->assertRedirect();

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'deleted_at' => null]);
    }

    public function test_create_project_with_no_client_succeeds(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'admin-no-client@test.com',
            'phone' => '+6281234567890',
            'password' => bcrypt('password'),
            'role' => UserRole::AdminVendor->value,
            'vendor_id' => $vendor->id,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);
        $projectName = 'No Client Project ' . uniqid();

        $this->actingAs($user)
            ->post('/projects', [
                'name' => $projectName,
                'description' => 'no client',
            ])
            ->assertRedirect();

        $project = Project::where('name', $projectName)->first();
        $this->assertNotNull($project);
        $this->assertDatabaseCount('project_client', 0);
    }

    public function test_create_project_with_existing_client_succeeds(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'admin-existing@test.com',
            'phone' => '+6281234567890',
            'password' => bcrypt('password'),
            'role' => UserRole::AdminVendor->value,
            'vendor_id' => $vendor->id,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);
        $existingClient = User::create([
            'name' => 'Existing Client',
            'email' => 'existing-client@test.com',
            'phone' => '+6281234567891',
            'password' => bcrypt('password'),
            'role' => UserRole::Client->value,
            'vendor_id' => $vendor->id,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);
        $projectName = 'Existing Client Project ' . uniqid();

        $this->actingAs($user)
            ->post('/projects', [
                'name' => $projectName,
                'client_id' => $existingClient->id,
            ])
            ->assertRedirect();

        $project = Project::where('name', $projectName)->first();
        $this->assertNotNull($project);
        $this->assertDatabaseHas('project_client', [
            'project_id' => $project->id,
            'user_id' => $existingClient->id,
        ]);
    }

    public function test_create_project_with_empty_new_client_does_not_create_user(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'admin-empty@test.com',
            'phone' => '+6281234567890',
            'password' => bcrypt('password'),
            'role' => UserRole::AdminVendor->value,
            'vendor_id' => $vendor->id,
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);
        $projectName = 'Empty New Client Project ' . uniqid();

        $this->actingAs($user)
            ->post('/projects', [
                'name' => $projectName,
                'new_client' => ['name' => '', 'email' => '', 'phone' => ''],
            ])
            ->assertRedirect();

        $project = Project::where('name', $projectName)->first();
        $this->assertNotNull($project);
        $this->assertDatabaseCount('project_client', 0);
        $this->assertDatabaseMissing('users', ['email' => '']);
    }

    public function test_store_redirects_to_projects_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->post('/projects', ['name' => 'Redirect Store Test'])
            ->assertRedirectContains('/projects');
    }

    public function test_update_redirects_to_projects_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'created_by' => $user->id]);

        $this->actingAs($user)
            ->put("/projects/{$project->id}", ['name' => 'Updated Name'])
            ->assertRedirectContains('/projects');
    }

    public function test_archive_redirects_to_projects_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/archive")
            ->assertRedirectContains('/projects');
    }

    public function test_toggle_favorite_redirects_to_projects_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/favorite")
            ->assertRedirectContains('/projects');
    }

    public function test_duplicate_redirects_to_projects_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Original '.uniqid()]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/duplicate")
            ->assertRedirectContains('/projects');
    }

    public function test_project_progress_resets_to_zero_when_status_is_not_started(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create([
            'vendor_id' => $vendor->id,
            'status' => 'in_progress',
            'progress' => 50,
        ]);
        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'progress' => 100,
        ]);

        $this->actingAs($user);
        $project->update(['status' => 'not_started']);
        $project->recalculateProgressFromTasks();

        $this->assertEquals(0, $project->fresh()->progress);
    }
}
