<?php

namespace Tests\Feature;

use App\Models\SubVendor;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubVendorTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_sub_vendors()
    {
        $this->get('/admin/sub-vendors')->assertRedirect('/login');
    }

    public function test_admin_vendor_can_create_sub_vendor()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post('/admin/sub-vendors', [
            'name' => 'Sub Contractor',
        ])->assertRedirect();

        $this->assertDatabaseHas('sub_vendors', [
            'name' => 'Sub Contractor',
            'vendor_id' => $vendor->id,
        ]);
    }

    public function test_super_admin_can_create_sub_vendor_for_any_vendor()
    {
        $user = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($user);
        $this->post('/admin/sub-vendors', [
            'name' => 'Super Sub',
            'vendor_id' => $vendor->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('sub_vendors', [
            'name' => 'Super Sub',
            'vendor_id' => $vendor->id,
        ]);
    }

    public function test_user_can_update_sub_vendor()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $subVendor = SubVendor::create([
            'vendor_id' => $vendor->id,
            'name' => 'Old Name',
            'slug' => 'old-name',
        ]);

        $this->actingAs($user);
        $this->put("/admin/sub-vendors/{$subVendor->id}", [
            'name' => 'Updated Sub',
        ])->assertRedirect();

        $this->assertDatabaseHas('sub_vendors', ['id' => $subVendor->id, 'name' => 'Updated Sub']);
    }

    public function test_user_can_delete_sub_vendor()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $subVendor = SubVendor::create([
            'vendor_id' => $vendor->id,
            'name' => 'Delete Me',
            'slug' => 'delete-me',
        ]);

        $this->actingAs($user);
        $this->delete("/admin/sub-vendors/{$subVendor->id}")->assertRedirect();

        $this->assertSoftDeleted($subVendor);
    }
}
