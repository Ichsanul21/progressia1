<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_clients()
    {
        $this->get('/admin/clients')->assertRedirect('/login');
    }

    public function test_team_user_cannot_view_clients()
    {
        $user = User::factory()->create(['role' => 'team']);
        $this->actingAs($user);
        $this->get('/admin/clients')->assertForbidden();
    }

    public function test_admin_vendor_can_view_clients()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        User::factory()->client()->create(['vendor_id' => $vendor->id, 'name' => 'Test Client']);

        $this->actingAs($user);
        $this->get('/admin/clients')->assertOk();
    }

    public function test_admin_vendor_only_sees_own_vendor_clients()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $userA = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        User::factory()->client()->create(['vendor_id' => $vendorA->id, 'name' => 'A Client']);
        User::factory()->client()->create(['vendor_id' => $vendorB->id, 'name' => 'B Client']);

        $this->actingAs($userA);
        $this->get('/admin/clients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/clients/index')
                ->where('clients.data.0.name', 'A Client')
                ->missing('clients.data.1')
            );
    }

    public function test_super_admin_can_see_all_clients()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $superAdmin = User::factory()->superAdmin()->create();
        User::factory()->client()->create(['vendor_id' => $vendorA->id, 'name' => 'A Client']);
        User::factory()->client()->create(['vendor_id' => $vendorB->id, 'name' => 'B Client']);

        $this->actingAs($superAdmin);
        $this->get('/admin/clients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('clients.total', 2)
            );
    }

    public function test_admin_vendor_can_update_own_vendor_client()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $client = User::factory()->client()->create(['vendor_id' => $vendor->id, 'name' => 'Old Name']);

        $this->actingAs($user);
        $this->put("/admin/users/{$client->id}", [
            'name' => 'New Name',
            'email' => $client->email,
            'phone' => $client->phone,
            'role' => 'client',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $client->id, 'name' => 'New Name']);
    }

    public function test_admin_vendor_cannot_update_other_vendor_client()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $userA = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        $clientB = User::factory()->client()->create(['vendor_id' => $vendorB->id]);

        $this->actingAs($userA);
        $this->put("/admin/users/{$clientB->id}", [
            'name' => 'Hacked',
            'email' => $clientB->email,
            'phone' => $clientB->phone,
            'role' => 'client',
        ])->assertForbidden();
    }

    public function test_admin_vendor_can_delete_own_vendor_client()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $client = User::factory()->client()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->delete("/admin/users/{$client->id}")->assertRedirect();

        $this->assertSoftDeleted('users', ['id' => $client->id]);
    }

    public function test_search_filters_clients()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        User::factory()->client()->create(['vendor_id' => $vendor->id, 'name' => 'Acme Corp']);
        User::factory()->client()->create(['vendor_id' => $vendor->id, 'name' => 'Globex']);

        $this->actingAs($user);
        $this->get('/admin/clients?search=acme')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('clients.total', 1)
                ->where('clients.data.0.name', 'Acme Corp')
            );
    }
}
