<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_notifications()
    {
        $this->get('/notifications')->assertRedirect('/login');
    }

    public function test_user_can_view_notifications()
    {
        $user = User::factory()->create();

        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user);
        $this->get('/notifications')->assertOk();
    }

    public function test_user_can_mark_notification_as_read()
    {
        $user = User::factory()->create();

        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->actingAs($user);
        $this->post("/notifications/{$notification->id}/read")->assertRedirect();

        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_user_can_mark_all_notifications_as_read()
    {
        $user = User::factory()->create();

        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->actingAs($user);
        $this->post('/notifications/read-all')->assertRedirect();

        $this->assertEquals(0, Notification::where('user_id', $user->id)->unread()->count());
    }

    public function test_user_sees_unread_count()
    {
        $user = User::factory()->create();

        Notification::factory()->count(2)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);
        Notification::factory()->count(1)->create([
            'user_id' => $user->id,
            'is_read' => true,
        ]);

        $this->actingAs($user);
        $response = $this->get('/notifications/unread');

        $response->assertOk();
        $response->assertJson(['count' => 2]);
    }

    public function test_user_only_sees_own_notifications()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Notification::factory()->create([
            'user_id' => $user->id,
            'title' => 'Mine',
        ]);
        Notification::factory()->create([
            'user_id' => $other->id,
            'title' => 'Not Mine',
        ]);

        $this->actingAs($user);
        $response = $this->get('/notifications');

        $response->assertSee('Mine');
        $response->assertDontSee('Not Mine');
    }
}
