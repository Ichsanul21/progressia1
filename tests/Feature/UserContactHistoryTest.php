<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserContactHistory;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserContactHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_user_records_initial_email_and_phone_history(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $vendor = Vendor::factory()->create();
        $this->actingAs($admin);

        $user = User::factory()->create([
            'email' => 'fresh@test.com',
            'phone' => '+628123456789',
            'vendor_id' => $vendor->id,
        ]);

        $entries = UserContactHistory::where('user_id', $user->id)->get();
        $this->assertCount(2, $entries);
        $this->assertTrue($entries->contains(fn ($e) => $e->field === 'email' && $e->new_value === 'fresh@test.com' && $e->old_value === null && $e->reason === 'initial'));
        $this->assertTrue($entries->contains(fn ($e) => $e->field === 'phone' && $e->new_value === '+628123456789' && $e->old_value === null && $e->reason === 'initial'));
    }

    public function test_updating_email_records_history_row(): void
    {
        $user = User::factory()->create(['email' => 'old@test.com', 'phone' => '+628123456789']);

        $user->update(['email' => 'new@test.com']);

        $emailEntries = UserContactHistory::where('user_id', $user->id)->where('field', 'email')->orderBy('id')->get();
        $this->assertCount(2, $emailEntries);
        $this->assertEquals('old@test.com', $emailEntries[0]->new_value);
        $this->assertEquals('initial', $emailEntries[0]->reason);
        $this->assertEquals('new@test.com', $emailEntries[1]->new_value);
        $this->assertEquals('old@test.com', $emailEntries[1]->old_value);
        $this->assertEquals('updated', $emailEntries[1]->reason);
    }

    public function test_updating_phone_records_history_row(): void
    {
        $user = User::factory()->create(['phone' => '+628123456789']);
        $user->update(['phone' => '+628987654321']);

        $phoneEntries = UserContactHistory::where('user_id', $user->id)->where('field', 'phone')->orderBy('id')->get();
        $this->assertCount(2, $phoneEntries);
        $this->assertEquals('+628123456789', $phoneEntries[1]->old_value);
        $this->assertEquals('+628987654321', $phoneEntries[1]->new_value);
    }

    public function test_updating_unrelated_field_does_not_record_history(): void
    {
        $user = User::factory()->create();
        $beforeCount = UserContactHistory::where('user_id', $user->id)->count();

        $user->update(['name' => 'New Name']);

        $this->assertEquals($beforeCount, UserContactHistory::where('user_id', $user->id)->count());
    }

    public function test_changed_by_user_id_is_set_from_auth(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin);

        $user = User::factory()->create();

        $entry = UserContactHistory::where('user_id', $user->id)->first();
        $this->assertEquals($admin->id, $entry->changed_by_user_id);
    }

    public function test_soft_delete_preserves_history(): void
    {
        $user = User::factory()->create();
        $historyId = UserContactHistory::where('user_id', $user->id)->first()->id;

        $user->delete();

        $this->assertNull(User::find($user->id));
        $this->assertNotNull(UserContactHistory::find($historyId));
    }

    public function test_super_admin_can_view_contact_history_page(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin);

        User::factory()->count(3)->create();

        $this->get(route('admin.users.contact-history'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/users/contact-history'));
    }

    public function test_admin_vendor_cannot_view_contact_history_page(): void
    {
        $vendor = Vendor::factory()->create();
        $admin = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $this->actingAs($admin);

        $this->get(route('admin.users.contact-history'))->assertForbidden();
    }

    public function test_history_page_can_filter_by_user_id(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin);

        $target = User::factory()->create(['email' => 'target@test.com']);
        User::factory()->count(3)->create();

        $this->get(route('admin.users.contact-history', ['user_id' => $target->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/contact-history')
                ->where('targetUser.email', 'target@test.com')
                ->has('entries.data', 2)
            );
    }

    public function test_history_page_can_filter_by_field(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin);

        $user = User::factory()->create(['phone' => '+628123456789']);
        $user->update(['email' => 'changed@test.com']);

        $this->get(route('admin.users.contact-history', ['field' => 'phone']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/contact-history')
                ->where('filters.field', 'phone')
                ->has('entries.data', 2)
            );
    }
}
