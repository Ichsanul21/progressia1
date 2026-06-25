<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Events\RegistrantSubmitted;
use App\Models\Registrant;
use App\Models\SubVendor;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrantAdminTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->superAdmin()->create();
    }

    private function adminVendor(Vendor $vendor): User
    {
        return User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
    }

    private function makeRegistrant(array $overrides = []): Registrant
    {
        return Registrant::create(array_merge([
            'name' => 'Budi',
            'email' => 'budi@test.com',
            'phone' => '+628123456789',
            'company_name' => 'PT Test',
            'industry' => 'konstruksi',
            'team_size' => '1-5',
            'source' => 'google',
            'status' => 'pending',
        ], $overrides));
    }

    public function test_non_super_admin_cannot_view_index(): void
    {
        $vendor = Vendor::factory()->create();
        $admin = $this->adminVendor($vendor);
        $this->actingAs($admin);

        $this->get('/admin/registrants')->assertForbidden();
    }

    public function test_team_user_cannot_view_index(): void
    {
        $user = User::factory()->create(['role' => 'team']);
        $this->actingAs($user);

        $this->get('/admin/registrants')->assertForbidden();
    }

    public function test_super_admin_can_view_index(): void
    {
        $admin = $this->superAdmin();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->get('/admin/registrants')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registrants/index')
                ->where('registrants.total', 1)
                ->where('registrants.data.0.email', 'budi@test.com')
            );
    }

    public function test_super_admin_can_filter_by_status(): void
    {
        $admin = $this->superAdmin();
        $this->makeRegistrant(['status' => 'pending']);
        $this->makeRegistrant(['email' => 'c@test.com', 'status' => 'contacted']);
        $this->actingAs($admin);

        $this->get('/admin/registrants?status=pending')
            ->assertInertia(fn ($page) => $page
                ->where('registrants.total', 1)
            );
    }

    public function test_update_status_pending_to_contacted(): void
    {
        $admin = $this->superAdmin();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->patch("/admin/registrants/{$r->id}/status", ['status' => 'contacted'])
            ->assertSessionHas('success');

        $r->refresh();
        $this->assertEquals('contacted', $r->status);
        $this->assertEquals($admin->id, $r->reviewed_by);
        $this->assertNotNull($r->contacted_at);
    }

    public function test_update_status_pending_to_rejected(): void
    {
        $admin = $this->superAdmin();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->patch("/admin/registrants/{$r->id}/status", ['status' => 'rejected'])
            ->assertSessionHas('success');

        $r->refresh();
        $this->assertEquals('rejected', $r->status);
    }

    public function test_update_status_already_converted_rejected(): void
    {
        $admin = $this->superAdmin();
        $r = $this->makeRegistrant(['status' => 'converted']);
        $this->actingAs($admin);

        $this->patch("/admin/registrants/{$r->id}/status", ['status' => 'contacted'])
            ->assertSessionHas('error');
    }

    public function test_convert_creates_user_with_default_password(): void
    {
        Event::fake([RegistrantSubmitted::class]);

        $admin = $this->superAdmin();
        $vendor = Vendor::factory()->create();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->post("/admin/registrants/{$r->id}/convert", [
            'role' => 'admin_vendor',
            'vendor_id' => $vendor->id,
        ])->assertSessionHas('success');

        $user = User::where('email', 'budi@test.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->must_change_password);
        $this->assertNull($user->password_changed_at);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertEquals(UserRole::AdminVendor->value, $user->role->value);
        $this->assertEquals($vendor->id, $user->vendor_id);

        $r->refresh();
        $this->assertEquals('converted', $r->status);
        $this->assertEquals($user->id, $r->converted_user_id);
    }

    public function test_convert_sub_vendor_requires_sub_vendor_id(): void
    {
        $admin = $this->superAdmin();
        $vendor = Vendor::factory()->create();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->post("/admin/registrants/{$r->id}/convert", [
            'role' => 'sub_vendor',
            'vendor_id' => $vendor->id,
        ])->assertSessionHasErrors(['sub_vendor_id']);
    }

    public function test_convert_sub_vendor_with_sub_vendor_id(): void
    {
        $admin = $this->superAdmin();
        $vendor = Vendor::factory()->create();
        $subVendor = SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->post("/admin/registrants/{$r->id}/convert", [
            'role' => 'sub_vendor',
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
        ])->assertSessionHas('success');

        $user = User::where('email', 'budi@test.com')->first();
        $this->assertEquals(UserRole::SubVendor->value, $user->role->value);
        $this->assertEquals($subVendor->id, $user->sub_vendor_id);
    }

    public function test_convert_sub_vendor_different_vendor_rejected(): void
    {
        $admin = $this->superAdmin();
        $vendor = Vendor::factory()->create();
        $otherVendor = Vendor::factory()->create();
        $subVendor = SubVendor::factory()->create(['vendor_id' => $otherVendor->id]);
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->post("/admin/registrants/{$r->id}/convert", [
            'role' => 'sub_vendor',
            'vendor_id' => $vendor->id,
            'sub_vendor_id' => $subVendor->id,
        ])->assertStatus(422);
    }

    public function test_destroy_removes_registrant(): void
    {
        $admin = $this->superAdmin();
        $r = $this->makeRegistrant();
        $this->actingAs($admin);

        $this->delete("/admin/registrants/{$r->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('registrants', ['id' => $r->id]);
    }
}
