<?php

namespace Tests\Feature;

use App\Models\Phase;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_phase()
    {
        $project = Project::factory()->create();
        $this->post("/projects/{$project->id}/phases", ['name' => 'Test'])->assertRedirect('/login');
    }

    public function test_user_can_create_phase()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/phases", [
            'name' => 'Design Phase',
            'description' => 'All design work',
        ])->assertRedirect();

        $this->assertDatabaseHas('phases', [
            'project_id' => $project->id,
            'name' => 'Design Phase',
        ]);
    }

    public function test_user_can_update_phase()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $phase = $project->phases()->create(['name' => 'Old Name', 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->put("/projects/{$project->id}/phases/{$phase->id}", [
            'name' => 'Updated Phase',
        ])->assertRedirect();

        $this->assertDatabaseHas('phases', ['id' => $phase->id, 'name' => 'Updated Phase']);
    }

    public function test_user_can_delete_phase()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $phase = $project->phases()->create(['name' => 'Delete Me', 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->delete("/projects/{$project->id}/phases/{$phase->id}")->assertRedirect();

        $this->assertSoftDeleted($phase);
    }

    public function test_client_cannot_update_phase(): void
    {
        $vendor = Vendor::factory()->create();
        $client = User::factory()->client()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $phase = $project->phases()->create(['name' => 'Some Phase', 'vendor_id' => $vendor->id]);

        $this->actingAs($client)
            ->put("/projects/{$project->id}/phases/{$phase->id}", [
                'name' => 'Hacked',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_update_phase_with_all_fields(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $phase = $project->phases()->create(['name' => 'Old', 'vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->put("/projects/{$project->id}/phases/{$phase->id}", [
                'name' => 'New Name',
                'description' => 'New description',
                'status' => 'in_progress',
                'start_date' => '2026-07-01',
                'end_date' => '2026-07-31',
            ])
            ->assertRedirect();

        $phase->refresh();
        $this->assertEquals('New Name', $phase->name);
        $this->assertEquals('in_progress', $phase->status);
    }
}
