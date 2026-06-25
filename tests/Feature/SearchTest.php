<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_search()
    {
        $this->getJson('/api/search?q=test')->assertUnauthorized();
    }

    public function test_user_can_search_projects_and_tasks()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Marketing Campaign']);
        Task::factory()->create(['project_id' => $project->id, 'vendor_id' => $vendor->id, 'name' => 'Design Banner']);

        $this->actingAs($user);
        $response = $this->getJson('/api/search?q=Marketing');
        $response->assertOk();
        $response->assertJsonFragment(['type' => 'project', 'title' => 'Marketing Campaign']);
    }

    public function test_vendors_only_appear_for_super_admin()
    {
        $vendor = Vendor::factory()->create(['name' => 'Secret Vendor']);
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $response = $this->getJson('/api/search?q=Secret');
        $response->assertOk();
        $response->assertJsonMissing(['type' => 'vendor']);
    }

    public function test_super_admin_can_see_vendors_in_search()
    {
        $user = User::factory()->superAdmin()->create();
        Vendor::factory()->create(['name' => 'Visible Vendor']);

        $this->actingAs($user);
        $response = $this->getJson('/api/search?q=Visible');
        $response->assertOk();
        $response->assertJsonFragment(['type' => 'vendor', 'title' => 'Visible Vendor']);
    }

    public function test_clients_are_scoped_to_user_vendor()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        $clientA = User::factory()->client()->create(['vendor_id' => $vendorA->id, 'name' => 'Client Alice']);
        $clientB = User::factory()->client()->create(['vendor_id' => $vendorB->id, 'name' => 'Client Bob']);

        $this->actingAs($user);
        $response = $this->getJson('/api/search?q=Client');
        $response->assertOk();
        $response->assertJsonFragment(['type' => 'client', 'title' => 'Client Alice']);
        $response->assertJsonMissing(['title' => 'Client Bob']);
    }

    public function test_search_requires_min_two_chars()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $response = $this->getJson('/api/search?q=a');
        $response->assertOk();
        $this->assertCount(0, $response->json());
    }
}
