<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ForcePasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_must_change_flag_is_redirected()
    {
        $user = User::factory()->mustChangePassword()->create();
        $this->actingAs($user);

        $this->get('/dashboard')->assertRedirect(route('password.force.edit'));
    }

    public function test_user_can_access_force_change_page()
    {
        $user = User::factory()->mustChangePassword()->create();
        $this->actingAs($user);

        $this->get(route('password.force.edit'))->assertOk();
    }

    public function test_user_can_submit_new_password_to_clear_flag()
    {
        $user = User::factory()->mustChangePassword()->create();
        $this->actingAs($user);

        $this->post(route('password.force.update'), [
            'password' => 'NewSecret123!',
            'password_confirmation' => 'NewSecret123!',
        ])->assertRedirect();

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertNotNull($user->password_changed_at);
        $this->assertTrue(Hash::check('NewSecret123!', $user->password));
    }

    public function test_user_without_flag_can_access_dashboard()
    {
        $user = User::factory()->create(['must_change_password' => false]);
        $this->actingAs($user);

        $this->get('/dashboard')->assertOk();
    }

    public function test_logout_works_even_with_force_flag()
    {
        $user = User::factory()->mustChangePassword()->create();
        $this->actingAs($user);

        $this->post('/logout')->assertRedirect();
        $this->assertGuest();
    }
}
