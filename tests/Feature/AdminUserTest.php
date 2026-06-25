<?php

namespace Tests\Feature;

use App\Models\SubVendor;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_user()
    {
        $this->get('/admin/users/create')->assertRedirect('/login');
    }

    public function test_team_user_cannot_create_user()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->create(['role' => 'team', 'vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->post('/admin/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'phone' => '+628123456789',
            'role' => 'team',
            'vendor_id' => $vendor->id,
        ])->assertForbidden();
    }

    public function test_admin_vendor_can_create_user_in_own_vendor()
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin);
        $this->post('/admin/users', [
            'name' => 'New Team Member',
            'email' => 'new@test.com',
            'phone' => '+628123456789',
            'role' => 'team',
        ])->assertRedirect();

        $created = User::where('email', 'new@test.com')->first();
        $this->assertNotNull($created);
        $this->assertEquals($vendor->id, $created->vendor_id);
        $this->assertEquals('team', $created->role->value);
        $this->assertTrue($created->must_change_password);
        $this->assertTrue(Hash::check('password', $created->password));
    }

    public function test_admin_vendor_cannot_create_admin_vendor_role()
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin);
        $this->post('/admin/users', [
            'name' => 'New Admin',
            'email' => 'new@test.com',
            'phone' => '+628123456789',
            'role' => 'admin_vendor',
        ])->assertSessionHasErrors(['role']);
    }

    public function test_super_admin_can_create_user()
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($superAdmin);
        $this->post('/admin/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'phone' => '+628123456789',
            'role' => 'admin_vendor',
            'vendor_id' => $vendor->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['email' => 'new@test.com', 'vendor_id' => $vendor->id]);
    }

    public function test_sub_vendor_role_requires_sub_vendor_id()
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin);
        $this->post('/admin/users', [
            'name' => 'Sub User',
            'email' => 'sub@test.com',
            'phone' => '+628123456789',
            'role' => 'sub_vendor',
        ])->assertSessionHasErrors(['sub_vendor_id']);
    }

    public function test_sub_vendor_user_created_with_sub_vendor_id()
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $subVendor = SubVendor::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin);
        $this->post('/admin/users', [
            'name' => 'Sub User',
            'email' => 'sub@test.com',
            'phone' => '+628123456789',
            'role' => 'sub_vendor',
            'sub_vendor_id' => $subVendor->id,
        ])->assertRedirect();

        $created = User::where('email', 'sub@test.com')->first();
        $this->assertEquals($subVendor->id, $created->sub_vendor_id);
        $this->assertEquals($vendor->id, $created->vendor_id);
    }

    public function test_phone_validation_rejects_invalid_format()
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($superAdmin);
        $this->post('/admin/users', [
            'name' => 'Bad Phone',
            'email' => 'bad@test.com',
            'phone' => '08123456789',
            'role' => 'team',
            'vendor_id' => $vendor->id,
        ])->assertSessionHasErrors(['phone']);
    }

    public function test_reset_password_sets_default_and_force_flag()
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $target = User::factory()->create(['must_change_password' => false]);

        $this->actingAs($superAdmin);
        $this->post("/admin/users/{$target->id}/reset-password")->assertRedirect();

        $target->refresh();
        $this->assertTrue($target->must_change_password);
        $this->assertTrue(Hash::check('password', $target->password));
        $this->assertNull($target->password_changed_at);
    }

    public function test_search_returns_users_for_admin_vendor_in_own_vendor()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        User::factory()->create(['name' => 'Acme Person', 'vendor_id' => $vendorA->id]);
        User::factory()->create(['name' => 'Acme Other', 'vendor_id' => $vendorB->id]);

        $this->actingAs($admin);
        $response = $this->get('/admin/users/search?q=Acme');
        $response->assertOk();
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Acme Person', $data[0]['name']);
    }

    public function test_can_recreate_user_with_email_of_soft_deleted_one()
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();
        $oldAttrs = [
            'vendor_id' => $vendor->id,
            'email' => 'reused@test.com',
        ];
        $old = User::factory()->create($oldAttrs);
        $old->delete();

        $this->assertSoftDeleted('users', ['id' => $old->id]);

        $this->actingAs($superAdmin);
        $this->post('/admin/users', [
            'name' => 'New Hire',
            'email' => 'reused@test.com',
            'phone' => '+628123456789',
            'role' => 'team',
            'vendor_id' => $vendor->id,
        ])->assertSessionHas('success');

        $new = User::where('email', 'reused@test.com')->whereNull('deleted_at')->first();
        $this->assertNotNull($new);
        $this->assertNotEquals($old->id, $new->id);
    }

    public function test_super_admin_can_view_team_page_with_vendor_filter(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        User::factory()->create(['role' => 'team', 'vendor_id' => $vendorA->id, 'name' => 'Team A']);
        User::factory()->create(['role' => 'team', 'vendor_id' => $vendorB->id, 'name' => 'Team B']);

        $this->actingAs($superAdmin);
        $this->get('/admin/team')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/team/index')
                ->has('users')
                ->where('users.total', 2)
                ->has('vendors')
            );
    }

    public function test_team_page_vendor_filter_narrows_results(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        User::factory()->create(['role' => 'team', 'vendor_id' => $vendorA->id, 'name' => 'Team A']);
        User::factory()->create(['role' => 'team', 'vendor_id' => $vendorB->id, 'name' => 'Team B']);

        $this->actingAs($superAdmin);
        $this->get('/admin/team?vendor_id='.$vendorA->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.name', 'Team A')
            );
    }

    public function test_super_admin_can_view_project_managers_page(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        User::factory()->create(['role' => 'project_manager']);

        $this->actingAs($superAdmin);
        $this->get('/admin/project-managers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/project-managers/index')
                ->has('users')
                ->has('vendors')
            );
    }

    public function test_super_admin_can_view_clients_page(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        User::factory()->create(['role' => 'client']);

        $this->actingAs($superAdmin);
        $this->get('/admin/clients')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/clients/index')
                ->has('clients')
                ->has('vendors')
            );
    }

    public function test_super_admin_can_view_sub_vendor_users_page(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();
        $subVendor = \App\Models\SubVendor::factory()->create(['vendor_id' => $vendor->id]);
        User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendor->id, 'sub_vendor_id' => $subVendor->id]);

        $this->actingAs($superAdmin);
        $this->get('/admin/sub-vendor-users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/sub-vendor-users/index')
                ->has('users')
                ->has('vendors')
                ->has('subVendors')
            );
    }

    public function test_sub_vendor_users_page_filters_by_vendor_id(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendorA->id, 'name' => 'User A']);
        User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendorB->id, 'name' => 'User B']);

        $this->actingAs($superAdmin);
        $this->get('/admin/sub-vendor-users?vendor_id='.$vendorA->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.name', 'User A')
            );
    }

    public function test_admin_vendor_only_sees_own_vendor_sub_vendor_users(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendorA->id, 'name' => 'Visible User']);
        User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendorB->id, 'name' => 'Hidden User']);

        $this->actingAs($admin);
        $this->get('/admin/sub-vendor-users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.name', 'Visible User')
            );
    }

    public function test_team_user_cannot_access_sub_vendor_users_page(): void
    {
        $vendor = Vendor::factory()->create();
        $team = User::factory()->create(['role' => 'team', 'vendor_id' => $vendor->id]);

        $this->actingAs($team);
        $this->get('/admin/sub-vendor-users')->assertForbidden();
    }

    public function test_store_user_from_team_referer_redirects_to_team_index(): void
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin)
            ->withHeader('referer', route('admin.team.index'))
            ->post('/admin/users', [
                'name' => 'Referer Test',
                'email' => 'referer-test@test.com',
                'phone' => '+628123456789',
                'role' => 'team',
            ])
            ->assertRedirect(route('admin.team.index'));
    }

    public function test_store_user_as_admin_vendor_without_referer_redirects_to_team_index(): void
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($admin)
            ->post('/admin/users', [
                'name' => 'No Referer Admin Vendor',
                'email' => 'no-ref-admin-vendor@test.com',
                'phone' => '+628123456789',
                'role' => 'team',
            ])
            ->assertRedirect(route('admin.team.index'));
    }

    public function test_update_user_as_admin_vendor_without_referer_redirects_to_team_index(): void
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $target = User::factory()->create(['vendor_id' => $vendor->id, 'role' => 'team']);

        $this->actingAs($admin)
            ->put("/admin/users/{$target->id}", [
                'name' => 'Renamed By Admin Vendor',
                'email' => $target->email,
                'phone' => $target->phone,
                'role' => 'team',
            ])
            ->assertRedirect(route('admin.team.index'));
    }

    public function test_super_admin_without_referer_redirects_to_users_index(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($superAdmin)
            ->post('/admin/users', [
                'name' => 'No Referer Super Admin',
                'email' => 'no-ref-super-admin@test.com',
                'phone' => '+628123456789',
                'role' => 'admin_vendor',
                'vendor_id' => $vendor->id,
            ])
            ->assertRedirect(route('admin.users.index'));
    }
}
