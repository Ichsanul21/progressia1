<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_calendar()
    {
        $this->get('/calendar')->assertRedirect('/login');
    }

    public function test_user_cannot_see_other_vendor_tasks_in_calendar()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);

        $projectA = Project::factory()->create(['vendor_id' => $vendorA->id]);
        $projectB = Project::factory()->create(['vendor_id' => $vendorB->id]);

        Task::factory()->create([
            'project_id' => $projectA->id,
            'vendor_id' => $vendorA->id,
            'start_date' => now()->toDateString(),
            'name' => 'Visible Task',
        ]);
        Task::factory()->create([
            'project_id' => $projectB->id,
            'vendor_id' => $vendorB->id,
            'start_date' => now()->toDateString(),
            'name' => 'Hidden Task',
        ]);

        $this->actingAs($user);
        $response = $this->get('/calendar');
        $response->assertOk();
        $response->assertSee('Visible Task');
        $response->assertDontSee('Hidden Task');
    }

    public function test_project_calendar_shows_only_project_tasks()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        Task::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'start_date' => now()->toDateString(),
            'name' => 'Project Task',
        ]);
        Task::factory()->create([
            'vendor_id' => $vendor->id,
            'start_date' => now()->toDateString(),
            'name' => 'Other Project Task',
        ]);

        $this->actingAs($user);
        $response = $this->get("/projects/{$project->id}/calendar");
        $response->assertOk();
        $response->assertSee('Project Task');
        $response->assertDontSee('Other Project Task');
    }
}
