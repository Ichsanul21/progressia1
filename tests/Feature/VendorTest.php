<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class VendorTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_vendors()
    {
        $this->get('/admin/vendors')->assertRedirect('/login');
    }

    public function test_non_super_admin_cannot_create_vendor()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post('/admin/vendors', ['name' => 'New Vendor', 'contact_person' => 'Budi'])->assertForbidden();
    }

    public function test_super_admin_can_create_vendor()
    {
        $user = User::factory()->superAdmin()->create();

        $this->actingAs($user);
        $this->post('/admin/vendors', [
            'name' => 'Acme Corp',
            'email' => 'acme@test.com',
            'contact_person' => 'Budi Santoso',
            'contact_phone' => '+628123456789',
        ])->assertRedirect();

        $this->assertDatabaseHas('vendors', ['name' => 'Acme Corp', 'email' => 'acme@test.com']);
    }

    public function test_creating_vendor_also_creates_admin_vendor_user(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme Corp',
            'email' => 'acme-new@test.com',
            'contact_person' => 'Budi Santoso',
            'contact_phone' => '+628123456789',
        ])->assertSessionHas('success');

        $vendor = Vendor::where('email', 'acme-new@test.com')->first();
        $this->assertNotNull($vendor);

        $user = User::where('email', 'acme-new@test.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('admin_vendor', $user->role->value);
        $this->assertEquals($vendor->id, $user->vendor_id);
        $this->assertEquals('Budi Santoso', $user->name);
        $this->assertEquals('+628123456789', $user->phone);
        $this->assertTrue($user->must_change_password);
        $this->assertNull($user->password_changed_at);
        $this->assertTrue(Hash::check('password', $user->password));
    }

    public function test_creating_vendor_with_existing_user_email_skips_user_creation(): void
    {
        $admin = User::factory()->superAdmin()->create();
        User::factory()->create(['email' => 'existing@test.com']);

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme With Existing',
            'email' => 'existing@test.com',
            'contact_person' => 'Budi',
        ])->assertSessionHas('success');

        $this->assertEquals(1, User::where('email', 'existing@test.com')->count());
        $this->assertDatabaseHas('vendors', ['email' => 'existing@test.com']);
    }

    public function test_creating_vendor_requires_contact_person(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme No Person',
            'email' => 'no-person@test.com',
        ])->assertSessionHasErrors(['contact_person']);
    }

    public function test_creating_vendor_requires_unique_email(): void
    {
        $admin = User::factory()->superAdmin()->create();
        Vendor::factory()->create(['email' => 'taken@test.com']);

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme Duplicate',
            'email' => 'taken@test.com',
            'contact_person' => 'Budi',
        ])->assertSessionHasErrors(['email']);
    }

    public function test_super_admin_can_update_vendor()
    {
        $user = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($user);
        $this->put("/admin/vendors/{$vendor->id}", [
            'name' => 'Updated Corp',
            'email' => $vendor->email,
            'contact_person' => $vendor->contact_person,
        ])->assertRedirect();

        $this->assertDatabaseHas('vendors', ['id' => $vendor->id, 'name' => 'Updated Corp']);
    }

    public function test_super_admin_can_delete_and_restore_vendor()
    {
        $user = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($user);
        $this->delete("/admin/vendors/{$vendor->id}")->assertRedirect();
        $this->assertSoftDeleted($vendor);

        $this->post("/admin/vendors/{$vendor->id}/restore")->assertRedirect();
        $this->assertDatabaseHas('vendors', ['id' => $vendor->id, 'deleted_at' => null]);
    }

    public function test_soft_deleting_vendor_cascades_to_its_users(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create(['vendor_id' => $vendor->id, 'email' => 'staff@vendor.test']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);

        $this->actingAs($admin);
        $this->delete("/admin/vendors/{$vendor->id}")->assertRedirect();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_restoring_vendor_cascades_to_its_users(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create(['vendor_id' => $vendor->id, 'email' => 'staff@vendor.test']);

        $vendor->delete();
        $this->assertSoftDeleted('users', ['id' => $user->id]);

        $this->actingAs($admin);
        $this->post("/admin/vendors/{$vendor->id}/restore")->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_can_recreate_vendor_with_email_of_soft_deleted_one(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme Old',
            'email' => 'acme@recreate.test',
            'contact_person' => 'Budi',
            'contact_phone' => '+628123456789',
        ])->assertSessionHas('success');

        $oldVendor = Vendor::where('email', 'acme@recreate.test')->first();
        $this->delete("/admin/vendors/{$oldVendor->id}")->assertRedirect();

        $this->post('/admin/vendors', [
            'name' => 'Acme New',
            'email' => 'acme@recreate.test',
            'contact_person' => 'Siti',
            'contact_phone' => '+628987654321',
        ])->assertSessionHas('success');

        $this->assertEquals(2, Vendor::withTrashed()->where('email', 'acme@recreate.test')->count());
    }

    public function test_vendor_create_success_message_mentions_reused_email_when_trashed_user_exists(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $oldVendor = Vendor::factory()->create();
        $oldUser = User::factory()->create(['vendor_id' => $oldVendor->id, 'email' => 'reused@test.com']);
        $oldUser->delete();

        $this->assertSoftDeleted('users', ['id' => $oldUser->id]);

        $this->actingAs($admin);
        $this->post('/admin/vendors', [
            'name' => 'Acme With Reuse',
            'email' => 'reused@test.com',
            'contact_person' => 'Siti',
            'contact_phone' => '+628123456789',
        ])
            ->assertSessionHas('success')
            ->assertSessionHas('success', fn ($message) => str_contains((string) $message, 'sebelumnya dipakai user non-aktif'));
    }
}
